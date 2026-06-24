import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface ClientRow {
  id?: number;
  machineName?: string;
  macAddress?: string;
  status?: string;
  tenantId?: number;
  tenantName?: string;
  lastHeartbeatTime?: string;
  currentCommand?: string;
  lastCommand?: string;
}

type ClientCommand = 'start' | 'resume' | 'pause' | 'stop';

const statusColorMap: Record<string, string> = {
  '离线': 'red',
  '待机': 'blue',
  '运行中': 'green',
  '暂停中': 'orange'
};

const commandTextMap: Record<ClientCommand, string> = {
  start: '启动',
  resume: '继续',
  pause: '暂停',
  stop: '停止'
};

@Component({
  selector: 'app-client-monitor',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzTagModule,
    NzIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">客户端监控</h2>
        <button nz-button nzSize="small" (click)="loadData()" [nzLoading]="loading">
          <nz-icon nzType="reload"></nz-icon>
          <span>刷新</span>
        </button>
      </div>

      <div class="card-container">
        <div class="monitor-summary">
          <div class="summary-card">
            <span>在线客户端</span>
            <strong class="success">{{ onlineCount }}</strong>
          </div>
          <div class="summary-card">
            <span>离线客户端</span>
            <strong class="danger">{{ offlineCount }}</strong>
          </div>
          <div class="summary-card">
            <span>gRPC端口</span>
            <strong>9090</strong>
          </div>
        </div>

        <nz-table
          class="compact-table"
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
          (nzPageSizeChange)="loadData()"
          [nzPageSizeOptions]="[20, 30, 50, 100]"
          [nzShowSizeChanger]="true"
          [nzScroll]="{ x: '1120px' }"
        >
          <thead>
            <tr>
              <th nzWidth="220px">机器名称</th>
              <th nzWidth="180px">MAC地址</th>
              <th nzWidth="110px">连接状态</th>
              <th nzWidth="160px">所属租户</th>
              <th nzWidth="180px">最后心跳</th>
              <th nzWidth="110px">待执行指令</th>
              <th nzWidth="110px">最近指令</th>
              <th nzWidth="210px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>
                  <span class="cell-text" [title]="item.machineName || '-'">{{ item.machineName || '-' }}</span>
                </td>
                <td>{{ item.macAddress || '-' }}</td>
                <td>
                  <nz-tag [nzColor]="statusColor(item.status)">{{ item.status || '离线' }}</nz-tag>
                </td>
                <td>
                  <span class="cell-text" [title]="tenantText(item)">{{ tenantText(item) }}</span>
                </td>
                <td>{{ item.lastHeartbeatTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>{{ item.currentCommand || '-' }}</td>
                <td>{{ item.lastCommand || '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <button nz-button nzType="link" nzSize="small" (click)="sendCommand(item, 'start')">启动</button>
                    <button nz-button nzType="link" nzSize="small" (click)="sendCommand(item, 'resume')">继续</button>
                    <button nz-button nzType="link" nzSize="small" (click)="sendCommand(item, 'pause')">暂停</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="sendCommand(item, 'stop')">停止</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
    }
    .page-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #262626;
    }
    .card-container {
      background: #fff;
      border-radius: 4px;
      padding: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
    }
    .monitor-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(160px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }
    .summary-card {
      min-height: 62px;
      padding: 10px 12px;
      border: 1px solid #edf0f5;
      border-radius: 6px;
      background: #fafafa;
    }
    .summary-card span {
      display: block;
      color: #8c8c8c;
      font-size: 12px;
      line-height: 18px;
    }
    .summary-card strong {
      display: block;
      margin-top: 4px;
      color: #262626;
      font-size: 22px;
      line-height: 28px;
      font-weight: 600;
    }
    .summary-card strong.success {
      color: #389e0d;
    }
    .summary-card strong.danger {
      color: #cf1322;
    }
    .cell-text {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    :host ::ng-deep .compact-table .ant-table-thead > tr > th,
    :host ::ng-deep .compact-table .ant-table-tbody > tr > td {
      padding: 6px 8px;
      line-height: 1.35;
    }
    :host ::ng-deep .compact-table .ant-btn-link {
      padding-left: 0;
      padding-right: 0;
    }
    @media (max-width: 720px) {
      .monitor-summary {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClientMonitorComponent implements OnInit {
  data: ClientRow[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 30;

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get onlineCount(): number {
    return this.data.filter(item => item.status && item.status !== '离线').length;
  }

  get offlineCount(): number {
    return this.data.filter(item => !item.status || item.status === '离线').length;
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getClientMonitorList({ current: this.pageIndex, size: this.pageSize }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message.error('加载客户端失败');
      }
    });
  }

  sendCommand(item: ClientRow, command: ClientCommand): void {
    if (!item.id) return;
    this.sysApi.controlClient(item.id, command).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(`${commandTextMap[command]}指令已下发`);
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '指令下发失败');
        }
      },
      error: () => this.message.error('指令下发失败')
    });
  }

  statusColor(status?: string): string {
    return statusColorMap[status || '离线'] || 'default';
  }

  tenantText(item: ClientRow): string {
    return item.tenantName || (item.tenantId ? String(item.tenantId) : '-');
  }
}
