import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

// 对齐数据库 clip_record 表
interface ClipRecord {
  id: number;
  productId?: string;
  productCategoryName?: string;
  productTitle?: string;
  userId?: number;
  status?: string;
  reason?: string;
  createTime?: string;
}

type AccountId = number | string;
type BaseAccountRow = Record<string, unknown>;

interface AccountOption {
  id: AccountId;
  label: string;
  nickname: string;
  douyinAccount: string;
  baiyingId: string;
  status?: number | string;
}

interface PublishOptions {
  syncPublish: string;
  visibility: string;
  savePermission: string;
  publishTime: string;
}

interface ClipRecordSearchParams {
  productId?: string;
  productTitle?: string;
  status?: string;
}

interface ClipRecordStatistics {
  todayClippedCount: number;
  todayPendingClipCount: number;
  currentMonthClipCount: number;
  lastMonthClipCount: number;
  currentYearClipCount: number;
}

interface PublishAssignment {
  account: AccountOption;
  rows: ClipRecord[];
}

const ADMIN_BRIDGE_SOURCE = 'video-publish-admin-www';
const PLUGIN_BRIDGE_SOURCE = 'browser-plugin';
const OPEN_CREATOR_MESSAGE = 'OPEN_CREATOR';
const CHECK_PUBLISH_READY_MESSAGE = 'CHECK_PUBLISH_READY';

const statusColorMap: Record<string, string> = {
  '已作废': 'warning',
  '待配置': 'default',
  '待剪辑': 'default',
  '剪辑中': 'processing',
  '剪辑失败': 'error',
  '待发布': 'default',
  '发布中': 'processing',
  '发布失败': 'error',
  '发布成功': 'success'
};

const statusOptions = [
  '已作废',
  '待配置',
  '待剪辑',
  '剪辑中',
  '剪辑失败',
  '待发布',
  '发布中',
  '发布失败',
  '发布成功'
];

const quickStatusOptions = [
  '待剪辑',
  '剪辑失败',
  '待发布',
  '发布失败'
];

@Component({
  selector: 'app-clip-record',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzTagModule,
    NzSpaceModule,
    NzPopconfirmModule,
    NzModalModule,
    NzSelectModule,
    NzRadioModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">剪辑记录</h2>
      </div>

      <div class="card-container">
        <div class="statistics-panel" [class.statistics-panel-loading]="statisticsLoading">
          <div class="stat-card stat-card-success">
            <div class="stat-label">今日已剪辑</div>
            <div class="stat-value">{{ statisticNumber('todayClippedCount') }}</div>
          </div>
          <div class="stat-card stat-card-warning">
            <div class="stat-label">今日待剪辑</div>
            <div class="stat-value">{{ statisticNumber('todayPendingClipCount') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">本月剪辑</div>
            <div class="stat-value">{{ statisticNumber('currentMonthClipCount') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">上月剪辑</div>
            <div class="stat-value">{{ statisticNumber('lastMonthClipCount') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">本年剪辑</div>
            <div class="stat-value">{{ statisticNumber('currentYearClipCount') }}</div>
          </div>
        </div>

        <form class="search-form" [formGroup]="searchForm" (ngSubmit)="search()">
          <div class="search-grid">
            <div class="search-field">
              <span>商品ID</span>
              <input nz-input formControlName="productId" placeholder="商品ID" />
            </div>
            <div class="search-field">
              <span>商品标题</span>
              <input nz-input formControlName="productTitle" placeholder="商品标题" />
            </div>
            <div class="search-field">
              <span>状态</span>
              <nz-select formControlName="status" nzPlaceHolder="全部状态" nzAllowClear>
                @for (status of statusOptions; track status) {
                  <nz-option [nzValue]="status" [nzLabel]="status"></nz-option>
                }
              </nz-select>
            </div>
            <div class="search-field quick-status-field">
              <span>快捷状态</span>
              <nz-radio-group
                class="status-radio-group"
                [ngModel]="searchForm.controls.status.value"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onStatusSearchChange($event)"
              >
                @for (status of quickStatusOptions; track status) {
                  <label nz-radio [nzValue]="status">{{ status }}</label>
                }
              </nz-radio-group>
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
          <button nz-button nzType="primary" [disabled]="!canPublish" [nzLoading]="publishSubmitting" (click)="openPublishModal()">
            发布
          </button>
          <button nz-button (click)="refresh()" [nzLoading]="loading">刷新</button>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
          (nzPageSizeChange)="loadData()"
          [nzTableLayout]="'fixed'"
          [nzScroll]="{ x: '1340px' }"
        >
          <thead>
            <tr>
              <th
                nzWidth="52px"
                [nzChecked]="allPublishableChecked"
                [nzIndeterminate]="selectionIndeterminate"
                [nzDisabled]="publishableRows.length === 0"
                (nzCheckedChange)="onAllChecked($event)"
              ></th>
              <th nzWidth="180px">商品ID</th>
              <th nzWidth="160px">品类</th>
              <th nzWidth="420px">商品标题</th>
              <th nzWidth="120px">状态</th>
              <th nzWidth="220px">原因</th>
              <th nzWidth="180px">创建时间</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td
                  [nzChecked]="isChecked(item)"
                  [nzDisabled]="!isPublishable(item)"
                  (nzCheckedChange)="onItemChecked(item, $event)"
                ></td>
                <td>
                  <span class="ellipsis-cell" [title]="item.productId || ''">{{ item.productId || '-' }}</span>
                </td>
                <td>
                  <span class="ellipsis-cell" [title]="item.productCategoryName || ''">{{ item.productCategoryName || '-' }}</span>
                </td>
                <td>
                  <span class="ellipsis-cell" [title]="item.productTitle || ''">{{ item.productTitle || '-' }}</span>
                </td>
                <td>
                  <nz-tag [nzColor]="statusColorMap[item.status || ''] || 'default'">
                    {{ item.status || '-' }}
                  </nz-tag>
                </td>
                <td>
                  <span class="ellipsis-cell" [title]="item.reason || ''">{{ item.reason || '-' }}</span>
                </td>
                <td>{{ item.createTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>

      <nz-modal
        [(nzVisible)]="publishModalVisible"
        nzTitle="发布设置"
        nzWidth="620px"
        [nzOkLoading]="publishSubmitting"
        [nzOkDisabled]="publishAccountLoading || selectedPublishAccounts.length === 0"
        (nzOnOk)="submitPublish()"
        (nzOnCancel)="closePublishModal()"
      >
        <ng-container *nzModalContent>
          <div class="publish-summary">
            已选择 {{ selectedRows.length }} 条待发布记录，{{ selectedPublishAccounts.length }} 个发布账号，分配 {{ assignedPublishCount }} 条
          </div>
          <div class="publish-setting-row">
            <div class="publish-setting-label">发布账号</div>
            <input
              nz-input
              readonly
              class="publish-account-input"
              [ngModel]="publishAccountInputText"
              placeholder="请选择发布账号"
              (click)="openPublishAccountPicker()"
            />
          </div>
          <div class="publish-setting-row">
            <div class="publish-setting-label">每个账号视频发布数量</div>
            <nz-input-number
              class="publish-count-input"
              [ngModel]="publishVideoCountPerAccount"
              [nzMin]="0"
              [nzMax]="selectedRows.length"
              [nzStep]="1"
              [nzDisabled]="selectedPublishAccounts.length === 0"
              (ngModelChange)="onPublishVideoCountPerAccountChange($event)"
            ></nz-input-number>
          </div>
          <div class="publish-option-list">
            <div class="publish-option-row">
              <div class="publish-option-label">同时发布</div>
              <nz-radio-group [(ngModel)]="syncPublish">
                <label nz-radio nzValue="不同时发布">不同时发布</label>
                <label nz-radio nzValue="同时发布到">同时发布到</label>
              </nz-radio-group>
            </div>
            <div class="publish-option-row">
              <div class="publish-option-label">谁可以看</div>
              <nz-radio-group [(ngModel)]="visibility">
                <label nz-radio nzValue="公开">公开</label>
                <label nz-radio nzValue="好友可见">好友可见</label>
                <label nz-radio nzValue="仅自己可见">仅自己可见</label>
              </nz-radio-group>
            </div>
            <div class="publish-option-row">
              <div class="publish-option-label">保存权限</div>
              <nz-radio-group [(ngModel)]="savePermission">
                <label nz-radio nzValue="允许">允许</label>
                <label nz-radio nzValue="不允许">不允许</label>
              </nz-radio-group>
            </div>
            <div class="publish-option-row">
              <div class="publish-option-label">发布时间</div>
              <nz-radio-group [(ngModel)]="publishTime">
                <label nz-radio nzValue="立即发布">立即发布</label>
                <label nz-radio nzValue="定时发布">定时发布</label>
              </nz-radio-group>
            </div>
          </div>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="publishAccountPickerVisible"
        nzTitle="选择发布账号"
        nzWidth="980px"
        [nzOkDisabled]="publishAccountLoading"
        (nzOnOk)="closePublishAccountPicker()"
        (nzOnCancel)="closePublishAccountPicker()"
      >
        <ng-container *nzModalContent>
          <div class="publish-account-toolbar">
            <input
              nz-input
              [(ngModel)]="publishAccountKeyword"
              (ngModelChange)="onPublishAccountKeywordChange($event)"
              placeholder="搜索昵称、抖音账号、百应ID"
            />
            <span class="publish-account-count">已选 {{ selectedPublishAccounts.length }} 个 / 共 {{ filteredPublishAccountOptions.length }} 个账号</span>
          </div>
          <nz-table
            #publishAccountTable
            class="publish-account-table"
            nzSize="small"
            [nzData]="filteredPublishAccountOptions"
            [nzLoading]="publishAccountLoading"
            [nzFrontPagination]="true"
            [(nzPageIndex)]="publishAccountPageIndex"
            [nzPageSize]="publishAccountPageSize"
            [nzShowPagination]="true"
            [nzShowSizeChanger]="false"
            [nzTableLayout]="'fixed'"
            [nzScroll]="{ x: '900px', y: '360px' }"
            (nzCurrentPageDataChange)="onPublishAccountCurrentPageDataChange($event)"
          >
            <thead>
              <tr>
                <th nzWidth="46px">
                  <label
                    nz-checkbox
                    [ngModel]="publishAccountAllChecked"
                    [nzIndeterminate]="publishAccountIndeterminate"
                    (ngModelChange)="onPublishAccountAllChecked($event)"
                  ></label>
                </th>
                <th nzWidth="180px">昵称</th>
                <th nzWidth="170px">抖音账号</th>
                <th nzWidth="150px">百应ID</th>
                <th nzWidth="110px">状态</th>
              </tr>
            </thead>
            <tbody>
              @for (account of publishAccountTable.data; track account.id) {
                <tr
                  class="publish-account-row"
                  [class.publish-account-row-checked]="isPublishAccountChecked(account)"
                  (click)="togglePublishAccountRow(account)"
                >
                  <td>
                    <label
                      nz-checkbox
                      [ngModel]="isPublishAccountChecked(account)"
                      (click)="$event.stopPropagation()"
                      (ngModelChange)="onPublishAccountChecked(account, $event)"
                    ></label>
                  </td>
                  <td><span class="ellipsis-cell" [title]="account.nickname">{{ account.nickname || '-' }}</span></td>
                  <td><span class="ellipsis-cell" [title]="account.douyinAccount">{{ account.douyinAccount || '-' }}</span></td>
                  <td><span class="ellipsis-cell" [title]="account.baiyingId">{{ account.baiyingId || '-' }}</span></td>
                  <td>
                    <nz-tag [nzColor]="accountStatusColor(account)">
                      {{ accountStatusText(account) }}
                    </nz-tag>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
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
    }
    .search-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
    }
    .search-field {
      display: flex;
      flex: 1 1 220px;
      min-width: 180px;
      flex-direction: column;
      gap: 6px;
    }
    .search-field span {
      color: #595959;
      font-size: 13px;
    }
    .quick-status-field {
      flex: 1 1 360px;
    }
    .search-field input,
    .search-field nz-select {
      width: 100%;
    }
    .status-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      min-height: 32px;
      align-items: center;
    }
    .search-actions {
      display: flex;
      flex: 0 0 auto;
      gap: 8px;
      align-items: center;
    }
    .toolbar {
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      margin-bottom: 12px;
    }
    .statistics-panel {
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .statistics-panel-loading {
      opacity: .65;
    }
    .stat-card {
      position: relative;
      min-width: 0;
      min-height: 78px;
      padding: 12px 14px;
      overflow: hidden;
      border: 1px solid #edf0f5;
      border-radius: 6px;
      background: linear-gradient(180deg, #fff 0%, #fafafa 100%);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
      background: #1677ff;
    }
    .stat-card-success::before {
      background: #52c41a;
    }
    .stat-card-warning::before {
      background: #faad14;
    }
    .stat-label {
      color: #8c8c8c;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
    }
    .stat-value {
      margin-top: 8px;
      color: #262626;
      font-size: 24px;
      font-weight: 600;
      line-height: 30px;
      font-variant-numeric: tabular-nums;
    }
    .stat-card-success .stat-value {
      color: #389e0d;
    }
    .stat-card-warning .stat-value {
      color: #d48806;
    }
    .ellipsis-cell {
      display: block;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .publish-summary {
      margin-bottom: 10px;
      color: #595959;
      font-size: 13px;
    }
    .publish-setting-row {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .publish-setting-label {
      color: #262626;
      font-size: 13px;
    }
    .publish-account-input {
      cursor: pointer;
    }
    .publish-account-toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
    }
    .publish-account-toolbar input {
      width: 320px;
      max-width: 100%;
    }
    .publish-account-count {
      color: #8c8c8c;
      font-size: 13px;
      white-space: nowrap;
    }
    .publish-account-table {
      margin-bottom: 14px;
    }
    .publish-account-row {
      cursor: pointer;
    }
    .publish-account-row-checked td {
      background: #e6f7ff;
    }
    .publish-count-input {
      width: 110px;
    }
    .publish-option-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 14px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
    .publish-option-row {
      display: grid;
      grid-template-columns: 86px minmax(0, 1fr);
      align-items: start;
      gap: 12px;
    }
    .publish-option-label {
      color: #262626;
      line-height: 32px;
      font-size: 13px;
    }
    @media (max-width: 960px) {
      .statistics-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 520px) {
      .statistics-panel {
        grid-template-columns: 1fr;
      }
      .search-field,
      .search-actions {
        flex-basis: 100%;
      }
      .search-actions {
        justify-content: flex-end;
      }
      .publish-account-toolbar {
        align-items: stretch;
        flex-direction: column;
      }
      .publish-account-toolbar input {
        width: 100%;
      }
      .publish-setting-row {
        grid-template-columns: 1fr;
        gap: 6px;
      }
    }
  `]
})
export class ClipRecordComponent implements OnInit {
  data: ClipRecord[] = [];
  checkedIds = new Set<number>();
  publishAccountOptions: AccountOption[] = [];
  statistics: ClipRecordStatistics = this.emptyStatistics();
  loading = false;
  statisticsLoading = false;
  publishAccountLoading = false;
  publishModalVisible = false;
  publishAccountPickerVisible = false;
  publishSubmitting = false;
  publishAccountKeyword = '';
  publishAccountPageIndex = 1;
  publishAccountPageSize = 50;
  publishAccountCurrentPageData: AccountOption[] = [];
  selectedPublishAccountKeys = new Set<string>();
  publishVideoCountPerAccount = 0;
  syncPublish = '不同时发布';
  visibility = '公开';
  savePermission = '允许';
  publishTime = '立即发布';
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  statusColorMap = statusColorMap;
  statusOptions = statusOptions;
  quickStatusOptions = quickStatusOptions;

  searchForm = new FormGroup({
    productId: new FormControl<string>('', { nonNullable: true }),
    productTitle: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<string | null>(null)
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadData();
  }

  refresh(): void {
    this.loadStatistics();
    this.loadData();
  }

  search(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  onStatusSearchChange(status: string | null): void {
    this.searchForm.controls.status.setValue(status);
    this.search();
  }

  resetSearch(): void {
    this.searchForm.reset({
      productId: '',
      productTitle: '',
      status: null
    });
    this.search();
  }

  loadData(): void {
    this.loading = true;
    const params = this.buildSearchParams();
    const request: { current: number; size: number; params?: ClipRecordSearchParams } = {
      current: this.pageIndex,
      size: this.pageSize
    };
    if (Object.keys(params).length > 0) {
      request.params = params;
    }
    this.sysApi.getClipRecordList(request).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
          this.checkedIds.clear();
        } else {
          this.data = [];
          this.total = 0;
          this.checkedIds.clear();
        }
        this.loading = false;
      },
      error: () => { this.message.error('加载失败'); this.loading = false; }
    });
  }

  private buildSearchParams(): ClipRecordSearchParams {
    const value = this.searchForm.value;
    const params: ClipRecordSearchParams = {};
    this.assignTrimmedParam(params, 'productId', value.productId);
    this.assignTrimmedParam(params, 'productTitle', value.productTitle);
    this.assignTrimmedParam(params, 'status', value.status);
    return params;
  }

  private assignTrimmedParam(
    params: ClipRecordSearchParams,
    key: keyof ClipRecordSearchParams,
    value?: string | null
  ): void {
    const text = (value || '').trim();
    if (text) {
      params[key] = text;
    }
  }

  get selectedRows(): ClipRecord[] {
    return this.data.filter(item => this.checkedIds.has(item.id));
  }

  get publishableRows(): ClipRecord[] {
    return this.data.filter(item => this.isPublishable(item));
  }

  get canPublish(): boolean {
    const rows = this.selectedRows;
    return !this.loading && !this.publishSubmitting && rows.length > 0 && rows.every(item => this.isPublishable(item));
  }

  get filteredPublishAccountOptions(): AccountOption[] {
    const keyword = this.publishAccountKeyword.trim().toLowerCase();
    if (!keyword) {
      return this.publishAccountOptions;
    }
    return this.publishAccountOptions.filter(account => this.publishAccountSearchText(account).includes(keyword));
  }

  get selectedPublishAccounts(): AccountOption[] {
    return this.publishAccountOptions.filter(account => this.selectedPublishAccountKeys.has(this.accountKey(account.id)));
  }

  get publishAccountInputText(): string {
    const accounts = this.selectedPublishAccounts;
    if (accounts.length === 0) {
      return '';
    }
    if (accounts.length <= 2) {
      return accounts.map(account => account.label || account.nickname || `#${account.id}`).join('，');
    }
    return `${accounts[0].label || accounts[0].nickname || `#${accounts[0].id}`} 等 ${accounts.length} 个账号`;
  }

  get assignedPublishCount(): number {
    const total = this.selectedPublishAccounts.length * this.publishVideoCountPerAccount;
    return Math.min(total, this.selectedRows.length);
  }

  get publishAccountAllChecked(): boolean {
    const accounts = this.selectableCurrentPublishAccounts();
    return accounts.length > 0 && accounts.every(account => this.isPublishAccountChecked(account));
  }

  get publishAccountIndeterminate(): boolean {
    const accounts = this.selectableCurrentPublishAccounts();
    const checkedCount = accounts.filter(account => this.isPublishAccountChecked(account)).length;
    return checkedCount > 0 && checkedCount < accounts.length;
  }

  get allPublishableChecked(): boolean {
    const rows = this.publishableRows;
    return rows.length > 0 && rows.every(item => this.checkedIds.has(item.id));
  }

  get selectionIndeterminate(): boolean {
    const checkedCount = this.publishableRows.filter(item => this.checkedIds.has(item.id)).length;
    return checkedCount > 0 && checkedCount < this.publishableRows.length;
  }

  isPublishable(item: ClipRecord): boolean {
    return item.status === '待发布' && Boolean(item.productId);
  }

  isChecked(item: ClipRecord): boolean {
    return this.checkedIds.has(item.id);
  }

  onAllChecked(checked: boolean): void {
    this.publishableRows.forEach(item => {
      if (checked) {
        this.checkedIds.add(item.id);
      } else {
        this.checkedIds.delete(item.id);
      }
    });
  }

  onItemChecked(item: ClipRecord, checked: boolean): void {
    if (!this.isPublishable(item)) {
      return;
    }
    if (checked) {
      this.checkedIds.add(item.id);
    } else {
      this.checkedIds.delete(item.id);
    }
  }

  onPublishAccountCurrentPageDataChange(data: readonly AccountOption[]): void {
    this.publishAccountCurrentPageData = [...data];
  }

  onPublishAccountKeywordChange(keyword: string): void {
    this.publishAccountKeyword = keyword;
    this.publishAccountPageIndex = 1;
    this.publishAccountCurrentPageData = this.filteredPublishAccountOptions.slice(0, this.publishAccountPageSize);
  }

  onPublishAccountAllChecked(checked: boolean): void {
    this.selectableCurrentPublishAccounts().forEach(account => {
      const key = this.accountKey(account.id);
      if (checked) {
        this.selectedPublishAccountKeys.add(key);
      } else {
        this.selectedPublishAccountKeys.delete(key);
      }
    });
    this.resetPublishVideoCountPerAccount();
  }

  onPublishAccountChecked(account: AccountOption, checked: boolean): void {
    const key = this.accountKey(account.id);
    if (checked) {
      this.selectedPublishAccountKeys.add(key);
    } else {
      this.selectedPublishAccountKeys.delete(key);
    }
    this.resetPublishVideoCountPerAccount();
  }

  togglePublishAccountRow(account: AccountOption): void {
    this.onPublishAccountChecked(account, !this.isPublishAccountChecked(account));
  }

  isPublishAccountChecked(account: AccountOption): boolean {
    return this.selectedPublishAccountKeys.has(this.accountKey(account.id));
  }

  onPublishVideoCountPerAccountChange(value: number | null): void {
    const count = Math.max(0, Math.floor(Number(value) || 0));
    this.publishVideoCountPerAccount = count;
  }

  accountStatusText(account: AccountOption): string {
    const value = account.status;
    if (value === 0 || value === '0') {
      return '禁用';
    }
    if (value === 1 || value === '1') {
      return '启用';
    }
    return '-';
  }

  accountStatusColor(account: AccountOption): string {
    const text = this.accountStatusText(account);
    if (text === '启用') {
      return 'green';
    }
    if (text === '禁用') {
      return 'red';
    }
    return 'default';
  }

  openPublishModal(): void {
    if (!this.canPublish) {
      return;
    }
    this.publishSubmitting = true;
    this.checkPluginPublishReady()
      .then(() => {
        this.resetPublishAccountPicker();
        this.resetPublishOptions();
        this.publishModalVisible = true;
        this.loadPublishAccounts();
      })
      .catch(error => {
        this.modal.warning({
          nzTitle: '插件未就绪',
          nzContent: error?.message || '请确认插件已登录并已授权发布目录',
          nzOkText: '知道了'
        });
      })
      .finally(() => {
        this.publishSubmitting = false;
      });
  }

  closePublishModal(): void {
    if (this.publishSubmitting) {
      return;
    }
    this.publishAccountPickerVisible = false;
    this.publishModalVisible = false;
  }

  openPublishAccountPicker(): void {
    this.publishAccountPickerVisible = true;
    this.publishAccountPageIndex = 1;
    this.publishAccountCurrentPageData = this.filteredPublishAccountOptions.slice(0, this.publishAccountPageSize);
    if (this.publishAccountOptions.length === 0 && !this.publishAccountLoading) {
      this.loadPublishAccounts();
    }
  }

  closePublishAccountPicker(): void {
    this.publishAccountPickerVisible = false;
  }

  submitPublish(): void {
    const accounts = this.selectedPublishAccounts;
    if (accounts.length === 0) {
      this.message.warning('请选择发布账号');
      return;
    }
    const rows = this.selectedRows;
    const assignments = this.buildPublishAssignments(accounts, rows);
    if (assignments.length === 0) {
      this.message.warning('请设置每个账号视频发布数量');
      return;
    }

    this.publishSubmitting = true;
    this.publishAssignments(assignments, this.currentPublishOptions())
      .then(result => {
        this.message.success(`已发布 ${result.productCount || rows.length} 条商品，上传 ${result.uploadCount || rows.length} 个视频`);
        this.publishAccountPickerVisible = false;
        this.publishModalVisible = false;
        this.loadStatistics();
        this.loadData();
      })
      .catch(error => {
        this.message.error(error?.message || '打开创作中心失败');
      })
      .finally(() => {
        this.publishSubmitting = false;
      });
  }

  private loadPublishAccounts(): void {
    this.publishAccountLoading = true;
    this.sysApi.getAllBaseAccounts().subscribe({
      next: (res: any) => {
        if (res.code === 0 && Array.isArray(res.data)) {
          this.publishAccountOptions = this.toAccountOptions(res.data);
          this.removeUnavailablePublishAccounts();
          this.publishAccountCurrentPageData = this.filteredPublishAccountOptions.slice(0, this.publishAccountPageSize);
        } else {
          this.publishAccountOptions = [];
          this.selectedPublishAccountKeys.clear();
          this.publishVideoCountPerAccount = 0;
          this.publishAccountCurrentPageData = [];
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载账号失败');
          }
        }
        this.publishAccountLoading = false;
      },
      error: () => {
        this.publishAccountOptions = [];
        this.selectedPublishAccountKeys.clear();
        this.publishVideoCountPerAccount = 0;
        this.publishAccountCurrentPageData = [];
        this.message.error('加载账号失败');
        this.publishAccountLoading = false;
      }
    });
  }

  private toAccountOptions(rows: BaseAccountRow[]): AccountOption[] {
    return rows
      .map((row): AccountOption | null => {
        const id = row['id'];
        if (typeof id !== 'number' && typeof id !== 'string') {
          return null;
        }
        const nickname = this.textValue(row['nickname'] ?? row['nickName'] ?? row['nick_name'] ?? row['nick'] ?? row['name']);
        const douyinAccount = this.textValue(row['douyinAccount'] ?? row['douyin_account'] ?? row['account']);
        const baiyingId = this.textValue(row['baiyingId'] ?? row['baiying_id']);
        const status = row['status'] as number | string | undefined;
        const label = [nickname || `#${id}`, douyinAccount, baiyingId].filter(Boolean).join(' / ');
        return { id, label, nickname, douyinAccount, baiyingId, status };
      })
      .filter((option): option is AccountOption => option !== null);
  }

  private resetPublishAccountPicker(): void {
    this.publishAccountKeyword = '';
    this.publishAccountPageIndex = 1;
    this.publishAccountCurrentPageData = [];
    this.selectedPublishAccountKeys.clear();
    this.publishVideoCountPerAccount = 0;
  }

  private removeUnavailablePublishAccounts(): void {
    const availableKeys = new Set(this.publishAccountOptions
      .map(account => this.accountKey(account.id)));
    this.selectedPublishAccountKeys.forEach(key => {
      if (!availableKeys.has(key)) {
        this.selectedPublishAccountKeys.delete(key);
      }
    });
    this.resetPublishVideoCountPerAccount();
  }

  private resetPublishVideoCountPerAccount(): void {
    const accountCount = this.selectedPublishAccounts.length;
    if (accountCount === 0) {
      this.publishVideoCountPerAccount = 0;
      return;
    }
    this.publishVideoCountPerAccount = Math.ceil(this.selectedRows.length / accountCount);
  }

  private selectableCurrentPublishAccounts(): AccountOption[] {
    return this.publishAccountCurrentPageData;
  }

  private publishAccountSearchText(account: AccountOption): string {
    return [
      account.label,
      account.nickname,
      account.douyinAccount,
      account.baiyingId,
      this.accountStatusText(account)
    ].join(' ').toLowerCase();
  }

  private accountKey(id: AccountId): string {
    return String(id);
  }

  private buildPublishAssignments(accounts: AccountOption[], rows: ClipRecord[]): PublishAssignment[] {
    let cursor = 0;
    const assignments: PublishAssignment[] = [];
    accounts.forEach(account => {
      const count = this.publishVideoCountPerAccount;
      if (count <= 0 || cursor >= rows.length) {
        return;
      }
      const accountRows = rows.slice(cursor, cursor + count);
      cursor += count;
      if (accountRows.length > 0) {
        assignments.push({ account, rows: accountRows });
      }
    });
    return assignments;
  }

  private async publishAssignments(
    assignments: PublishAssignment[],
    publishOptions: PublishOptions
  ): Promise<{ uploadCount: number; productCount: number }> {
    let uploadCount = 0;
    let productCount = 0;
    for (const assignment of assignments) {
      const productIds = assignment.rows
        .map(item => this.textValue(item.productId))
        .filter(Boolean);
      const productTitles = assignment.rows.map(item => this.textValue(item.productTitle));
      const result = await this.openCreator(
        assignment.account.id,
        productIds,
        productTitles,
        publishOptions
      );
      uploadCount += result.uploadCount || productIds.length;
      productCount += result.productCount || productIds.length;
    }
    return { uploadCount, productCount };
  }

  private textValue(value: unknown): string {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  statisticNumber(key: keyof ClipRecordStatistics): string {
    return String(this.statistics[key] ?? 0);
  }

  private loadStatistics(): void {
    this.statisticsLoading = true;
    this.sysApi.getClipRecordStatistics().subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          this.statistics = this.normalizeStatistics(res.data);
        } else {
          this.statistics = this.emptyStatistics();
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载剪辑统计失败');
          }
        }
        this.statisticsLoading = false;
      },
      error: () => {
        this.statistics = this.emptyStatistics();
        this.statisticsLoading = false;
        this.message.error('加载剪辑统计失败');
      }
    });
  }

  private emptyStatistics(): ClipRecordStatistics {
    return {
      todayClippedCount: 0,
      todayPendingClipCount: 0,
      currentMonthClipCount: 0,
      lastMonthClipCount: 0,
      currentYearClipCount: 0
    };
  }

  private normalizeStatistics(data: Record<string, unknown>): ClipRecordStatistics {
    return {
      todayClippedCount: this.toCount(data['todayClippedCount']),
      todayPendingClipCount: this.toCount(data['todayPendingClipCount']),
      currentMonthClipCount: this.toCount(data['currentMonthClipCount']),
      lastMonthClipCount: this.toCount(data['lastMonthClipCount']),
      currentYearClipCount: this.toCount(data['currentYearClipCount'])
    };
  }

  private toCount(value: unknown): number {
    const count = Number(value ?? 0);
    return Number.isFinite(count) ? count : 0;
  }

  private resetPublishOptions(): void {
    this.syncPublish = '不同时发布';
    this.visibility = '公开';
    this.savePermission = '允许';
    this.publishTime = '立即发布';
  }

  private currentPublishOptions(): PublishOptions {
    return {
      syncPublish: this.syncPublish,
      visibility: this.visibility,
      savePermission: this.savePermission,
      publishTime: this.publishTime
    };
  }

  private checkPluginPublishReady(): Promise<void> {
    return this.postPluginBridgeMessage(CHECK_PUBLISH_READY_MESSAGE, {}, 10000, '请确认插件已登录并已授权发布目录')
      .then(() => undefined);
  }

  private postPluginBridgeMessage<T>(
    type: string,
    payload: unknown,
    timeoutMs: number,
    fallbackError: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('未检测到浏览器插件响应，请确认插件已安装并刷新当前页面'));
      }, timeoutMs);
      const cleanup = () => {
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.source !== window) {
          return;
        }
        const data = event.data || {};
        if (data.source !== PLUGIN_BRIDGE_SOURCE
          || data.type !== `${type}_RESULT`
          || data.requestId !== requestId) {
          return;
        }
        cleanup();
        if (data.ok) {
          resolve((data.result || {}) as T);
        } else {
          reject(new Error(data.error || fallbackError));
        }
      };

      window.addEventListener('message', onMessage);
      window.postMessage({
        source: ADMIN_BRIDGE_SOURCE,
        type,
        requestId,
        payload
      }, window.location.origin);
    });
  }

  private openCreator(
    accountId: AccountId,
    productIds: string[],
    productTitles: string[],
    publishOptions: PublishOptions
  ): Promise<{ uploadCount?: number; productCount?: number }> {
    return new Promise((resolve, reject) => {
      const requestId = `open-creator-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timeoutMs = Math.max(120000, productIds.length * 180000);
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('未检测到浏览器插件响应，请确认插件已安装并刷新当前页面'));
      }, timeoutMs);
      const cleanup = () => {
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.source !== window) {
          return;
        }
        const data = event.data || {};
        if (data.source !== PLUGIN_BRIDGE_SOURCE
          || data.type !== `${OPEN_CREATOR_MESSAGE}_RESULT`
          || data.requestId !== requestId) {
          return;
        }
        if (!data.ok && /extension context invalidated/i.test(String(data.error || ''))) {
          return;
        }
        cleanup();
        if (data.ok) {
          resolve(data.result || {});
        } else {
          reject(new Error(data.error || '打开创作中心失败'));
        }
      };

      window.addEventListener('message', onMessage);
      window.postMessage({
        source: ADMIN_BRIDGE_SOURCE,
        type: OPEN_CREATOR_MESSAGE,
        requestId,
        payload: { accountId, productIds, productTitles, publishOptions }
      }, window.location.origin);
    });
  }

  deleteRecord(item: ClipRecord): void {
    this.sysApi.deleteClipRecord(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadStatistics();
          this.loadData();
        }
        else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => { this.message.error('删除失败'); }
    });
  }
}
