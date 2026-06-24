import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
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

interface ClipRuleItem {
  id?: number;
  code: string;
  name: string;
  content?: string;
  status: number;
  seq?: number;
  createTime?: string;
}

interface ClipRuleItemSearchParams {
  code?: string;
  name?: string;
  status?: number;
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-clip-rule-item',
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
        <h2 class="page-title">剪辑规则项</h2>
      </div>

      <div class="card-container">
        <form class="search-form" [formGroup]="searchForm" (ngSubmit)="search()">
          <div class="search-grid">
            <div class="search-field">
              <span>代码</span>
              <input nz-input formControlName="code" placeholder="规则项代码" />
            </div>
            <div class="search-field">
              <span>名称</span>
              <input nz-input formControlName="name" placeholder="规则项名称" />
            </div>
            <div class="search-field">
              <span>状态</span>
              <nz-select formControlName="status" nzPlaceHolder="全部状态" nzAllowClear>
                <nz-option [nzValue]="1" nzLabel="启用"></nz-option>
                <nz-option [nzValue]="0" nzLabel="禁用"></nz-option>
              </nz-select>
            </div>
            <div class="search-actions">
              <button nz-button nzType="primary" type="submit" [nzLoading]="loading">
                <nz-icon nzType="search"></nz-icon>
                <span>查询</span>
              </button>
              <button nz-button type="button" (click)="resetSearch()">重置</button>
            </div>
          </div>
        </form>

        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增规则项</span>
            </button>
          </div>
          <div class="toolbar-right">
            <button nz-button (click)="loadData()" [nzLoading]="loading">
              <nz-icon nzType="reload"></nz-icon>
              <span>刷新</span>
            </button>
          </div>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
          (nzPageSizeChange)="loadData()"
          [nzScroll]="{ x: '1160px' }"
        >
          <thead>
            <tr>
              <th nzWidth="160px">代码</th>
              <th nzWidth="180px">名称</th>
              <th nzWidth="320px">内容</th>
              <th nzWidth="90px">状态</th>
              <th nzWidth="90px">排序</th>
              <th nzWidth="170px">创建时间</th>
              <th nzWidth="140px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td class="ellipsis-cell" [title]="item.code">{{ item.code }}</td>
                <td class="ellipsis-cell" [title]="item.name">{{ item.name }}</td>
                <td class="ellipsis-cell content-cell" [title]="item.content || ''">{{ item.content || '—' }}</td>
                <td>
                  <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                    {{ statusMap[item.status] || '未知' }}
                  </nz-tag>
                </td>
                <td>{{ item.seq ?? 0 }}</td>
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
                      nzPopconfirmTitle="确定删除此规则项?"
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
        nzWidth="680px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>代码</nz-form-label>
              <nz-form-control nzErrorTip="请输入规则项代码">
                <input nz-input formControlName="code" placeholder="请输入规则项代码" maxlength="64" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入规则项名称">
                <input nz-input formControlName="name" placeholder="请输入规则项名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>内容</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="content" rows="4" placeholder="请输入规则项内容"></textarea>
              </nz-form-control>
            </nz-form-item>
            @if (editingId) {
              <nz-form-item>
                <nz-form-label>排序</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="seq" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            }
            <nz-form-item>
              <nz-form-label>状态</nz-form-label>
              <nz-form-control>
                <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
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
      box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.02);
    }
    .search-form {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .search-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: end;
    }
    .search-field {
      display: flex;
      flex-direction: column;
      flex: 1 1 180px;
      gap: 6px;
      min-width: 0;
      color: #595959;
      font-size: 13px;
    }
    .search-field input,
    .search-field nz-select,
    .number-input {
      width: 100%;
    }
    .search-actions {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 8px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ellipsis-cell {
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .content-cell {
      max-width: 320px;
    }
    @media (max-width: 520px) {
      .search-field,
      .search-actions {
        flex-basis: 100%;
      }
      .search-actions {
        justify-content: flex-end;
      }
    }
  `]
})
export class ClipRuleItemComponent implements OnInit {
  data: ClipRuleItem[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增规则项';
  editingId: number | null = null;
  statusMap = statusMap;

  searchForm = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<number | null>(null)
  });

  form = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    seq: new FormControl<number>(0, { nonNullable: true })
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  search(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  resetSearch(): void {
    this.searchForm.reset({
      code: '',
      name: '',
      status: null
    });
    this.search();
  }

  loadData(): void {
    this.loading = true;
    const params = this.buildSearchParams();
    const request: { current: number; size: number; params?: ClipRuleItemSearchParams } = {
      current: this.pageIndex,
      size: this.pageSize
    };
    if (Object.keys(params).length > 0) {
      request.params = params;
    }
    this.sysApi.getClipRuleItemList(request).subscribe({
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
        this.message.error('加载规则项失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增规则项';
    this.editingId = null;
    this.form.reset({
      code: '',
      name: '',
      content: '',
      status: true,
      seq: 0
    });
    this.modalVisible = true;
  }

  showEditModal(item: ClipRuleItem): void {
    this.modalTitle = '编辑规则项';
    this.editingId = item.id || null;
    this.form.reset({
      code: item.code || '',
      name: item.name || '',
      content: item.content || '',
      status: item.status === 1,
      seq: item.seq || 0
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }
    this.modalLoading = true;
    const v = this.form.value;
    const payload: ClipRuleItem = {
      code: (v.code || '').trim(),
      name: (v.name || '').trim(),
      content: v.content || '',
      status: v.status ? 1 : 0,
      seq: this.editingId ? (v.seq || 0) : undefined
    };

    const api$ = this.editingId
      ? this.sysApi.updateClipRuleItem({ ...payload, id: this.editingId })
      : this.sysApi.createClipRuleItem(payload);

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

  deleteItem(item: ClipRuleItem): void {
    if (!item.id) return;
    this.sysApi.deleteClipRuleItem(item.id).subscribe({
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

  private buildSearchParams(): ClipRuleItemSearchParams {
    const value = this.searchForm.value;
    const params: ClipRuleItemSearchParams = {};
    const code = (value.code || '').trim();
    if (code) {
      params.code = code;
    }
    const name = (value.name || '').trim();
    if (name) {
      params.name = name;
    }
    if (value.status !== null && value.status !== undefined) {
      params.status = value.status;
    }
    return params;
  }
}
