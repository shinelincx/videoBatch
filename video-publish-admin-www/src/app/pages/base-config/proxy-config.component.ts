import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface ProxyConfig {
  id?: number;
  name: string;
  remark?: string;
  ip: string;
  port: number;
  protocol: string;
  username?: string;
  password?: string;
  status: number;
  timeout?: number;
  maxConnections?: number;
  usedCount?: number;
  createTime?: string;
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-proxy-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    NzFormModule,
    NzTagModule,
    NzSpaceModule,
    NzIconModule,
    NzSwitchModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzInputNumberModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">代理配置</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button nzType="primary" (click)="showAddModal()">
            <nz-icon nzType="plus"></nz-icon>
            <span>新增代理</span>
          </button>
          <button nz-button (click)="loadData()" [nzLoading]="loading">
            <nz-icon nzType="reload"></nz-icon>
            <span>刷新</span>
          </button>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
          (nzPageSizeChange)="loadData()"
          [nzScroll]="{ x: '1100px' }"
        >
          <thead>
            <tr>
              <th nzWidth="140px">代理名称</th>
              <th nzWidth="100px">协议</th>
              <th nzWidth="180px">地址</th>
              <th nzWidth="140px">用户名</th>
              <th nzWidth="110px">超时</th>
              <th nzWidth="120px">最大连接</th>
              <th nzWidth="110px">已使用</th>
              <th nzWidth="90px">状态</th>
              <th nzWidth="170px">创建时间</th>
              <th nzWidth="160px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.protocol }}</td>
                <td>{{ item.ip }}:{{ item.port }}</td>
                <td>{{ item.username || '—' }}</td>
                <td>{{ item.timeout || 30 }} 秒</td>
                <td>{{ item.maxConnections || 10 }}</td>
                <td>{{ item.usedCount || 0 }}</td>
                <td>
                  <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                    {{ statusMap[item.status] || '未知' }}
                  </nz-tag>
                </td>
                <td>{{ item.createTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="确定删除此代理?"
                      (nzOnConfirm)="deleteItem(item)"
                    >删除</button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>

      <nz-modal
        [(nzVisible)]="modalVisible"
        [nzTitle]="modalTitle"
        [nzOkLoading]="modalLoading"
        (nzOnOk)="handleOk()"
        (nzOnCancel)="modalVisible = false"
        nzWidth="660px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <div class="form-grid">
              <nz-form-item>
                <nz-form-label nzRequired>代理名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入代理名称">
                  <input nz-input formControlName="name" placeholder="请输入代理名称" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>协议</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="protocol">
                    <nz-option nzValue="http" nzLabel="http"></nz-option>
                    <nz-option nzValue="https" nzLabel="https"></nz-option>
                    <nz-option nzValue="socks5" nzLabel="socks5"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>代理IP</nz-form-label>
                <nz-form-control nzErrorTip="请输入代理IP">
                  <input nz-input formControlName="ip" placeholder="请输入代理IP" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>端口</nz-form-label>
                <nz-form-control nzErrorTip="请输入端口">
                  <nz-input-number class="number-input" formControlName="port" [nzMin]="1" [nzMax]="65535" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>用户名</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="username" placeholder="如需认证请输入用户名" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>密码</nz-form-label>
                <nz-form-control>
                  <input nz-input type="password" formControlName="password" placeholder="如需认证请输入密码" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>连接超时（秒）</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="timeout" [nzMin]="1" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>最大连接数</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="maxConnections" [nzMin]="1" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>已使用次数</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="usedCount" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
                </nz-form-control>
              </nz-form-item>
            </div>
            <nz-form-item>
              <nz-form-label>备注</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="remark" rows="3" placeholder="请输入备注"></textarea>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
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
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }
    .number-input {
      width: 100%;
    }
  `]
})
export class ProxyConfigComponent implements OnInit {
  data: ProxyConfig[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增代理';
  editingId: number | null = null;

  statusMap = statusMap;

  form = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required]),
    ip: new FormControl<string | null>('', [Validators.required]),
    port: new FormControl<number>(8080, { nonNullable: true, validators: [Validators.required] }),
    protocol: new FormControl<string>('http', { nonNullable: true }),
    username: new FormControl<string | null>(''),
    password: new FormControl<string | null>(''),
    timeout: new FormControl<number>(30, { nonNullable: true }),
    maxConnections: new FormControl<number>(10, { nonNullable: true }),
    usedCount: new FormControl<number>(0, { nonNullable: true }),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    remark: new FormControl<string | null>('')
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getProxyConfigList({ current: this.pageIndex, size: this.pageSize }).subscribe({
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
        this.message.error('加载代理失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增代理';
    this.editingId = null;
    this.form.reset({
      port: 8080,
      protocol: 'http',
      timeout: 30,
      maxConnections: 10,
      usedCount: 0,
      status: true,
      remark: ''
    });
    this.modalVisible = true;
  }

  showEditModal(item: ProxyConfig): void {
    this.modalTitle = '编辑代理';
    this.editingId = item.id || null;
    this.form.patchValue({
      name: item.name,
      ip: item.ip,
      port: item.port,
      protocol: item.protocol || 'http',
      username: item.username || '',
      password: item.password || '',
      timeout: item.timeout || 30,
      maxConnections: item.maxConnections || 10,
      usedCount: item.usedCount || 0,
      status: item.status === 1,
      remark: item.remark || ''
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) return;
    this.modalLoading = true;
    const v = this.form.value;
    const payload: ProxyConfig = {
      name: v.name || '',
      ip: v.ip || '',
      port: v.port || 8080,
      protocol: v.protocol || 'http',
      username: v.username || '',
      password: v.password || '',
      timeout: v.timeout || 30,
      maxConnections: v.maxConnections || 10,
      usedCount: v.usedCount || 0,
      status: v.status ? 1 : 0,
      remark: v.remark || ''
    };

    const api$ = this.editingId
      ? this.sysApi.updateProxyConfig({ ...payload, id: this.editingId })
      : this.sysApi.createProxyConfig(payload);

    api$.subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(this.editingId ? '更新成功' : '创建成功');
          this.modalVisible = false;
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '操作失败');
        }
        this.modalLoading = false;
      },
      error: () => {
        this.message.error('操作失败');
        this.modalLoading = false;
      }
    });
  }

  deleteItem(item: ProxyConfig): void {
    if (!item.id) return;
    this.sysApi.deleteProxyConfig(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => this.message.error('删除失败')
    });
  }
}
