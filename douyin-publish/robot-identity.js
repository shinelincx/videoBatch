/**
 * 机器人身份标识（与 video-publish-client/robot_heartbeat.py 保持一致）
 */
const os = require('os');
const crypto = require('crypto');

/**
 * 获取机器名称
 * @returns {string}
 */
function getMachineName() {
  return (os.hostname() || '').trim() || 'unknown-machine';
}

/**
 * 获取 MAC 地址（优先物理网卡，否则基于主机名生成稳定伪 MAC）
 * @returns {string}
 */
function pseudoMacFromHost() {
  const hash = crypto.createHash('md5').update(getMachineName()).digest();
  const parts = [];
  for (let i = 0; i < 6; i++) {
    parts.push(hash[i].toString(16).padStart(2, '0'));
  }
  return parts.join(':');
}

function getMacAddress() {
  try {
    const nets = os.networkInterfaces();
    for (const iface of Object.keys(nets)) {
      for (const net of nets[iface] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          return net.mac.toLowerCase();
        }
      }
    }
  } catch {
    /* 部分环境无法读取网卡信息，回退到伪 MAC */
  }

  return pseudoMacFromHost();
}

/**
 * @returns {{ machineName: string, macAddress: string }}
 */
function getRobotIdentity() {
  return {
    machineName: getMachineName(),
    macAddress: getMacAddress(),
  };
}

module.exports = {
  getMachineName,
  getMacAddress,
  getRobotIdentity,
};
