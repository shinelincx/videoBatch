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
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface SysTenant {
  tid?: string;
  tname?: string;
  created?: Date;
}

@Component({
  selector: 'app-tenant-management',
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
    NzIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">租户管理</h2>
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
              <th>租户名称</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.tid) {
              <tr>
                <td>{{ item.tname }}</td>
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
              <nz-form-label nzRequired>租户名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入租户名称">
                <input nz-input formControlName="tname" placeholder="请输入租户名称" />
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
export class TenantManagementComponent implements OnInit {
  data: SysTenant[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增租户';
  editingId: string | null = null;

  form = new FormGroup({
    tname: new FormControl<string | null>('', [Validators.required])
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
    this.sysApi.getTenantList({
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
        console.error('加载租户数据失败', err);
        this.message.error('加载数据失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增租户';
    this.editingId = null;
    this.form.reset();
    this.modalVisible = true;
  }

  showEditModal(item: SysTenant): void {
    this.modalTitle = '编辑租户';
    this.editingId = item.tid || null;
    this.form.patchValue({
      tname: item.tname
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) {
      return;
    }
    this.modalLoading = true;
    const formValue = this.form.value;

    if (this.editingId) {
      this.sysApi.updateTenant({
        tid: this.editingId,
        tname: formValue.tname || ''
      }).subscribe({
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
          console.error('更新租户失败', err);
          this.message.error('更新失败');
          this.modalLoading = false;
        }
      });
    } else {
      this.sysApi.createTenant({
        tname: formValue.tname || ''
      }).subscribe({
        next: (res: any) => {
          if (res.code === 0) {
            this.message.success('创建成功');
            this.modalVisible = false;
            this.loadData();
          } else if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '创建失败');
          }
          this.modalLoading = false;
        },
        error: (err) => {
          console.error('创建租户失败', err);
          this.message.error('创建失败');
          this.modalLoading = false;
        }
      });
    }
  }

  deleteItem(item: SysTenant): void {
    if (!item.tid) return;
    this.sysApi.deleteTenant(item.tid).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: (err) => {
        console.error('删除租户失败', err);
        this.message.error('删除失败');
      }
    });
  }
}
