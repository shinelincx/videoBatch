import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface RobotRow {
  id?: number;
  machineName?: string;
  macAddress?: string;
  status?: string;
  tenantId?: number;
  tenantName?: string;
  lastHeartbeatTime?: string;
  currentCommand?: string;
}

type RobotCommand = 'resume' | 'pause' | 'stop';

const statusColorMap: Record<string, string> = {
  '离线': 'red',
  '待机': 'blue',
  '运行中': 'green',
  '暂停中': 'orange'
};

const commandTextMap: Record<RobotCommand, string> = {
  resume: '继续',
  pause: '暂停',
  stop: '停止'
};

@Component({
  selector: 'app-robot-management',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzTagModule,
    NzIconModule,
    NzSpaceModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">机器人管理</h2>
        <button nz-button nzSize="small" (click)="loadData()" [nzLoading]="loading">
          <nz-icon nzType="reload"></nz-icon>
          <span>刷新</span>
        </button>
      </div>

      <div class="card-container">
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
          [nzScroll]="{ x: '980px' }"
        >
          <thead>
            <tr>
              <th nzWidth="220px">机器名称</th>
              <th nzWidth="180px">MAC地址</th>
              <th nzWidth="100px">当前状态</th>
              <th nzWidth="160px">所属租户</th>
              <th nzWidth="170px">最后心跳</th>
              <th nzWidth="160px">操作</th>
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
                  <nz-tag [nzColor]="statusColor(item.status)">
                    {{ item.status || '离线' }}
                  </nz-tag>
                </td>
                <td>
                  <span class="cell-text" [title]="tenantText(item)">{{ tenantText(item) }}</span>
                </td>
                <td>{{ item.lastHeartbeatTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <nz-space nzSize="small">
                    <button nz-button nzType="link" nzSize="small" (click)="sendCommand(item, 'resume')">继续</button>
                    <button nz-button nzType="link" nzSize="small" (click)="sendCommand(item, 'pause')">暂停</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="sendCommand(item, 'stop')">停止</button>
                  </nz-space>
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
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .cell-text {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
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
  `]
})
export class RobotManagementComponent implements OnInit {
  data: RobotRow[] = [];
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

  loadData(): void {
    this.loading = true;
    this.sysApi.getRobotList({ current: this.pageIndex, size: this.pageSize }).subscribe({
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
        this.message.error('加载机器人失败');
      }
    });
  }

  sendCommand(item: RobotRow, command: RobotCommand): void {
    if (!item.id) return;
    this.sysApi.controlRobot(item.id, command).subscribe({
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

  tenantText(item: RobotRow): string {
    return item.tenantName || (item.tenantId ? String(item.tenantId) : '-');
  }
}
