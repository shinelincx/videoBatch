/**
 * gRPC 机器人心跳与指令订阅（ClientMonitorService，默认端口 9090）
 */
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { getRobotIdentity } = require('./robot-identity');
const { APP_ROOT, SRC_ROOT } = require('./load-env');

const PROTO_PATH = path.join(SRC_ROOT, 'proto', 'client_monitor.proto');

const STATUS_OFFLINE = '离线';
const STATUS_STANDBY = '待机';
const STATUS_RUNNING = '运行中';
const STATUS_PAUSED = '暂停中';

const CLIENT_VERSION = process.env.CLIENT_VERSION || '4.1';

function loadGrpcClient(host, port) {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition);
  const Service = proto.video.publish.client.ClientMonitorService;
  return new Service(`${host}:${port}`, grpc.credentials.createInsecure());
}

function unaryCall(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

class GrpcHeartbeat {
  /**
   * @param {object} options
   * @param {string} options.host
   * @param {number} options.port
   * @param {number} [options.intervalMs]
   * @param {number} [options.tenantId]
   * @param {Function} [options.onCommand]
   * @param {Function} [options.onError]
   */
  constructor(options) {
    this.host = options.host;
    this.port = options.port;
    this.intervalMs = options.intervalMs || Number(process.env.GRPC_HEARTBEAT_INTERVAL_MS || 5000);
    this.tenantId = options.tenantId || Number(process.env.TENANT_ID || 0);
    this.onCommand = options.onCommand || (() => {});
    this.onError = options.onError || ((msg) => console.warn(msg));

    this.identity = getRobotIdentity();
    this.status = STATUS_STANDBY;
    this.robotId = null;

    this._client = null;
    this._commandStream = null;
    this._heartbeatTimer = null;
    this._reconnectTimer = null;
    this._stopped = false;
  }

  setStatus(status) {
    if (status) this.status = status;
  }

  getStatus() {
    return this.status;
  }

  _heartbeatPayload() {
    return {
      machine_name: this.identity.machineName,
      mac_address: this.identity.macAddress,
      status: this.status,
      tenant_id: this.tenantId,
      client_version: CLIENT_VERSION,
    };
  }

  _commandPollPayload() {
    return {
      machine_name: this.identity.machineName,
      mac_address: this.identity.macAddress,
      tenant_id: this.tenantId,
    };
  }

  async start() {
    if (this._client) return;

    this._stopped = false;
    this._client = loadGrpcClient(this.host, this.port);

    console.log(`\n📡 连接 gRPC 心跳服务: ${this.host}:${this.port}`);
    console.log(`   机器: ${this.identity.machineName} / ${this.identity.macAddress}`);

    const registerRes = await unaryCall(this._client, 'Register', this._heartbeatPayload());
    this.robotId = registerRes.robot_id || null;
    console.log(`  ✅ gRPC 注册成功 (robot_id: ${this.robotId ?? '未知'}, 状态: ${registerRes.status || STATUS_STANDBY})`);

    this._openCommandStream();
    this._startHeartbeatTimer();
  }

  _openCommandStream() {
    if (this._stopped || !this._client) return;

    if (this._commandStream) {
      try {
        this._commandStream.removeAllListeners();
        this._commandStream.cancel();
      } catch {
        /* ignore */
      }
      this._commandStream = null;
    }

    const stream = this._client.SubscribeCommand(this._commandPollPayload());
    this._commandStream = stream;

    stream.on('data', (response) => {
      const command = (response.command || '').trim();
      if (!command) return;

      const meta = {
        robot_id: response.robot_id ?? response.robotId ?? null,
        command,
        command_time_millis: response.command_time_millis ?? response.commandTimeMillis ?? null,
        payload: response.payload || '',
      };

      const payloadHint = meta.payload ? ` (payload: ${meta.payload})` : '';
      console.log(`\n📨 收到 gRPC 指令: ${command}${payloadHint}`);
      if (meta.robot_id) {
        console.log(`   robot_id: ${meta.robot_id}, command_time_millis: ${meta.command_time_millis ?? '-'}`);
      }

      try {
        this.onCommand(command, meta);
      } catch (e) {
        this.onError(`处理 gRPC 指令失败: ${e.message}`);
      }
    });

    stream.on('error', (err) => {
      if (this._stopped) return;
      this.onError(`gRPC 指令流断开: ${err.message}`);
      this._scheduleReconnect();
    });

    stream.on('end', () => {
      if (this._stopped) return;
      this.onError('gRPC 指令流已结束，准备重连...');
      this._scheduleReconnect();
    });
  }

  _scheduleReconnect() {
    if (this._stopped || this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      if (!this._stopped) {
        console.log('  🔄 正在重连 gRPC 指令流...');
        this._openCommandStream();
      }
    }, 3000);
  }

  _startHeartbeatTimer() {
    if (this._heartbeatTimer) return;
    this._heartbeatTimer = setInterval(() => {
      this._sendHeartbeat().catch((err) => {
        this.onError(`gRPC 心跳失败: ${err.message}`);
      });
    }, this.intervalMs);
  }

  async _sendHeartbeat() {
    if (this._stopped || !this._client) return;
    const res = await unaryCall(this._client, 'Heartbeat', this._heartbeatPayload());
    if (res.robot_id) {
      this.robotId = res.robot_id;
    }
  }

  async sendHeartbeat() {
    await this._sendHeartbeat();
  }

  async stop(sendOffline = false) {
    this._stopped = true;

    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._commandStream) {
      try {
        this._commandStream.removeAllListeners();
        this._commandStream.cancel();
      } catch {
        /* ignore */
      }
      this._commandStream = null;
    }

    if (sendOffline && this._client) {
      try {
        this.status = STATUS_OFFLINE;
        await unaryCall(this._client, 'Offline', {
          machine_name: this.identity.machineName,
          mac_address: this.identity.macAddress,
          tenant_id: this.tenantId,
        });
        console.log('  📴 已发送 gRPC 离线通知');
      } catch (err) {
        this.onError(`gRPC 离线通知失败: ${err.message}`);
      }
    }

    if (this._client) {
      try {
        this._client.close();
      } catch {
        /* ignore */
      }
      this._client = null;
    }
  }
}

module.exports = {
  GrpcHeartbeat,
  STATUS_OFFLINE,
  STATUS_STANDBY,
  STATUS_RUNNING,
  STATUS_PAUSED,
};
