import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SysApiService, SysUser, SysTenant } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

@Component({
  selector: 'app-user-management',
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
    NzSelectModule,
    NzTagModule,
    NzSpaceModule,
    NzIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">用户管理</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button nzType="primary" (click)="showAddModal()">
            <nz-icon nzType="plus"></nz-icon>
            <span>新增</span>
          </button>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
        >
          <thead>
            <tr>
              <th>用户名</th>
              <th>昵称</th>
              <th>租户</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.uid) {
              <tr>
                <td>{{ item.uname }}</td>
                <td>{{ item.nick }}</td>
                <td>{{ getTenantName(item.tenantId) }}</td>
                <td>
                  @for (role of item.roleList; track role.rid) {
                    <nz-tag>{{ role.rname }}</nz-tag>
                  }
                </td>
                <td>
                  <nz-tag [nzColor]="item.lock === false ? 'green' : 'red'">
                    {{ item.lock === false ? '正常' : '锁定' }}
                  </nz-tag>
                </td>
                <td>{{ item.created | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteItem(item)">删除</button>
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
        nzWidth="600px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>用户名</nz-form-label>
              <nz-form-control nzErrorTip="请输入用户名">
                <input nz-input formControlName="uname" placeholder="请输入用户名" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label [nzRequired]="!editingId">密码</nz-form-label>
              <nz-form-control [nzErrorTip]="editingId ? '' : '请输入密码'">
                <input nz-input type="password" formControlName="pwd" placeholder="请输入密码" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>昵称</nz-form-label>
              <nz-form-control nzErrorTip="请输入昵称">
                <input nz-input formControlName="nick" placeholder="请输入昵称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>租户</nz-form-label>
              <nz-form-control nzErrorTip="请选择租户">
                <nz-select formControlName="tenantId" nzAllowClear nzPlaceHolder="请选择租户">
                  @for (tenant of tenantOptions; track getTenantId(tenant)) {
                    <nz-option [nzValue]="getTenantId(tenant)" [nzLabel]="getTenantLabel(tenant)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 0;
    }

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
      letter-spacing: 0.3px;
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
      gap: 12px;
      margin-bottom: 16px;
    }

    .toolbar button {
      flex-shrink: 0;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  data: SysUser[] = [];
  tenantOptions: SysTenant[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增用户';
  editingId: string | null = null;

  form = new FormGroup({
    uname: new FormControl<string | null>('', [Validators.required]),
    pwd: new FormControl<string | null>('', [Validators.required]),
    nick: new FormControl<string | null>('', [Validators.required]),
    tenantId: new FormControl<number | null>(null, [Validators.required])
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadTenantOptions();
    this.loadData();
  }

  loadTenantOptions(): void {
    this.sysApi.getTenantList({ current: 1, size: 1000 }).subscribe({
      next: (res: any) => {
        const page = res.code === 0 && res.data ? (res.data.page || res.data) : null;
        this.tenantOptions = page?.records || [];
      },
      error: () => {
        this.tenantOptions = [];
        this.message.error('加载租户选项失败');
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getUserList({
      nick: '',
      current: this.pageIndex,
      size: this.pageSize
    }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data && res.data.page) {
          this.data = res.data.page.records || [];
          this.total = res.data.page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('加载用户数据失败', err);
        this.message.error('加载数据失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增用户';
    this.editingId = null;
    this.form.reset({ tenantId: null });
    this.form.get('pwd')?.setValidators([Validators.required]);
    this.form.get('pwd')?.updateValueAndValidity();
    this.form.get('uname')?.enable();
    this.modalVisible = true;
  }

  showEditModal(item: SysUser): void {
    this.modalTitle = '编辑用户';
    this.editingId = item.uid || null;
    this.form.patchValue({
      uname: item.uname,
      pwd: '',
      nick: item.nick,
      tenantId: item.tenantId || null
    });
    this.form.get('pwd')?.clearValidators();
    this.form.get('pwd')?.updateValueAndValidity();
    this.form.get('uname')?.disable();
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) {
      return;
    }
    this.modalLoading = true;
    const formValue = this.form.value;

    if (this.editingId) {
      const updateData: Partial<SysUser> = {
        uid: this.editingId,
        nick: formValue.nick ?? undefined,
        tenantId: formValue.tenantId ?? null
      };
      if (formValue.pwd) {
        (updateData as any).pwd = formValue.pwd;
      }
      this.sysApi.updateUser(updateData).subscribe({
        next: (res: any) => {
          if (res.code === 0) {
            this.message.success('更新成功');
            this.modalVisible = false;
            this.loadData();
          } else if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '更新失败');
          }
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('更新用户失败', err);
          this.message.error('更新失败');
          this.modalLoading = false;
        }
      });
    } else {
      this.sysApi.createUser({
        uname: formValue.uname || '',
        pwd: formValue.pwd || '',
        nick: formValue.nick || '',
        tenantId: formValue.tenantId ?? null
      }).subscribe({
        next: (res: any) => {
          if (res.code === 0) {
            this.message.success('创建成功');
            this.modalVisible = false;
            this.loadData();
          } else {
            this.message.error(res.msg || '创建失败');
          }
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('创建用户失败', err);
          this.message.error('创建失败');
          this.modalLoading = false;
        }
      });
    }
  }

  deleteItem(item: SysUser): void {
    if (!item.uid) return;
    this.sysApi.deleteUser(item.uid).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: (err) => {
        console.error('删除用户失败', err);
        this.message.error('删除失败');
      }
    });
  }

  getTenantName(tenantId?: number | null): string {
    if (!tenantId) return '—';
    const tenant = this.tenantOptions.find(item => this.getTenantId(item) === tenantId);
    return tenant ? this.getTenantLabel(tenant) : `#${tenantId}`;
  }

  getTenantId(tenant: SysTenant): number | null {
    const value = tenant.id ?? (tenant.tid ? Number(tenant.tid) : null);
    return Number.isFinite(value) ? value : null;
  }

  getTenantLabel(tenant: SysTenant): string {
    return tenant.name || tenant.tname || `#${this.getTenantId(tenant) || ''}`;
  }
}
