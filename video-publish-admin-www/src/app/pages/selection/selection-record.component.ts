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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface SelectionRecord {
  id?: number;
  accountNickname: string;
  productId: string;
  productTitle: string;
  productLink?: string;
  trailerLink?: string;
  productCategoryId?: number | null;
  commission?: number;
  commissionRate?: number;
  price: number;
  productRating?: number;
  totalSales?: number;
  sellerCount?: number;
  shopName: string;
  status: string;
  reason?: string;
  createTime?: string;
}

interface AccountOption {
  id?: number;
  nickname: string;
  douyinAccount: string;
}

interface ProductCategory {
  id?: number;
  name: string;
  parentId?: number;
  seq?: number;
  level?: number;
  status?: number;
  children?: ProductCategory[];
}

interface SelectionRecordSearchParams {
  productId?: string;
  productTitle?: string;
  accountNickname?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
}

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

const clipActionStatuses = ['待配置'];
const discardActionStatuses = ['待配置', '待剪辑', '剪辑失败', '待发布'];
const restoreActionStatuses = ['剪辑失败', '发布失败'];
const defaultSelectionStatus = '待配置';

@Component({
  selector: 'app-selection-record',
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
    NzPopconfirmModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDatePickerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">选品记录</h2>
      </div>

      <div class="card-container">
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
              <span>账号昵称</span>
              <input nz-input formControlName="accountNickname" placeholder="账号昵称" />
            </div>
            <div class="search-field">
              <span>状态</span>
              <nz-select formControlName="status" nzPlaceHolder="全部状态" nzAllowClear>
                @for (status of statusOptions; track status) {
                  <nz-option [nzValue]="status" [nzLabel]="status"></nz-option>
                }
              </nz-select>
            </div>
            <div class="search-field date-field">
              <span>创建时间</span>
              <nz-range-picker formControlName="createTimeRange" [nzFormat]="'yyyy-MM-dd'"></nz-range-picker>
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
            <button
              nz-button
              nzType="primary"
              type="button"
              [disabled]="clipActionDisabled"
              [nzLoading]="clipSubmitting"
              (click)="submitClip()"
            >
              <nz-icon nzType="video-camera"></nz-icon>
              <span>开始剪辑</span>
            </button>
            <button
              nz-button
              nzDanger
              type="button"
              [disabled]="discardActionDisabled"
              [nzLoading]="discardSubmitting"
              (click)="submitDiscard()"
            >
              <nz-icon nzType="delete"></nz-icon>
              <span>作废</span>
            </button>
            <button
              nz-button
              type="button"
              [disabled]="restoreActionDisabled"
              [nzLoading]="restoreSubmitting"
              (click)="submitRestore()"
            >
              <nz-icon nzType="rollback"></nz-icon>
              <span>恢复</span>
            </button>
          </div>
          <div class="toolbar-right">
            <button nz-button (click)="refresh()" [nzLoading]="loading">
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
          [nzScroll]="{ x: '1720px' }"
        >
          <thead>
            <tr>
              <th
                nzWidth="56px"
                [nzChecked]="checked"
                [nzIndeterminate]="indeterminate"
                (nzCheckedChange)="onAllChecked($event)"
              ></th>
              <th nzWidth="96px">账号昵称</th>
              <th nzWidth="140px" class="nowrap-header">商品ID</th>
              <th nzWidth="180px">品类</th>
              <th nzWidth="260px">商品标题</th>
              <th nzWidth="120px">价格</th>
              <th nzWidth="100px">佣金</th>
              <th nzWidth="100px">佣金率</th>
              <th nzWidth="100px">评分</th>
              <th nzWidth="120px">销量</th>
              <th nzWidth="100px">状态</th>
              <th nzWidth="170px">创建时间</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td
                  [nzChecked]="item.id ? checkedIdSet.has(item.id) : false"
                  (nzCheckedChange)="onItemChecked(item, $event)"
                ></td>
                <td class="ellipsis-cell account-cell" [title]="item.accountNickname">{{ item.accountNickname }}</td>
                <td class="product-id-cell nowrap-cell">
                  <button
                    type="button"
                    class="link-button product-id-link"
                    [title]="item.productId || ''"
                    (click)="copyProductId(item.productId)"
                  >
                    {{ item.productId || '—' }}
                  </button>
                </td>
                <td class="ellipsis-cell category-cell" [title]="categoryDisplay(item)">{{ categoryDisplay(item) }}</td>
                <td>
                  <button
                    type="button"
                    class="link-button title-link"
                    [class.disabled-link]="!item.productLink"
                    [title]="item.productLink || item.productTitle"
                    (click)="openProductLink(item)"
                  >
                    {{ item.productTitle || '—' }}
                  </button>
                </td>
                <td>{{ item.price }}</td>
                <td>{{ item.commission ?? 0 }}</td>
                <td>{{ item.commissionRate ?? 0 }}%</td>
                <td>{{ item.productRating ?? 0 }}</td>
                <td>{{ item.totalSales ?? 0 }}</td>
                <td>{{ item.status }}</td>
                <td>{{ item.createTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
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
        nzWidth="760px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <div class="form-grid">
              <nz-form-item>
                <nz-form-label nzRequired>选品账号</nz-form-label>
                <nz-form-control nzErrorTip="请选择选品账号">
                  <nz-select formControlName="accountNickname" nzPlaceHolder="请选择账号" nzShowSearch>
                    @for (account of accountOptions; track account.id) {
                      <nz-option [nzValue]="account.nickname" [nzLabel]="account.nickname + '（' + account.douyinAccount + '）'"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>商品ID</nz-form-label>
                <nz-form-control nzErrorTip="请输入商品ID">
                  <input nz-input formControlName="productId" placeholder="请输入商品ID" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>商品标题</nz-form-label>
                <nz-form-control nzErrorTip="请输入商品标题">
                  <input nz-input formControlName="productTitle" placeholder="请输入商品标题" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>商铺名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入商铺名称">
                  <input nz-input formControlName="shopName" placeholder="请输入商铺名称" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>价格</nz-form-label>
                <nz-form-control nzErrorTip="请输入价格">
                  <nz-input-number class="number-input" formControlName="price" [nzMin]="0" [nzStep]="0.01"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>佣金</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="commission" [nzMin]="0" [nzStep]="0.01"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>佣金率(%)</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="commissionRate" [nzMin]="0" [nzStep]="0.01"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>商品评分</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="productRating" [nzMin]="0" [nzMax]="5" [nzStep]="0.1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>总销量</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="totalSales" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>带货人数</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="sellerCount" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="status">
                    @for (status of statusOptions; track status) {
                      <nz-option [nzValue]="status" [nzLabel]="status"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>商品类目ID</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="productCategoryId" [nzMin]="1" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>商品链接</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="productLink" placeholder="请输入商品链接" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>挂车链接</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="trailerLink" placeholder="请输入挂车链接" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <nz-form-item>
              <nz-form-label>原因</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="reason" rows="3" placeholder="请输入原因"></textarea>
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
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
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
      flex: 1 1 176px;
      gap: 6px;
      min-width: 0;
      color: #595959;
      font-size: 13px;
    }
    .search-field input,
    .search-field nz-select,
    .search-field nz-range-picker {
      width: 100%;
    }
    .date-field {
      flex-basis: 300px;
      min-width: 280px;
    }
    .search-actions {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 8px;
    }
    @media (max-width: 520px) {
      .search-field,
      .date-field,
      .search-actions {
        flex-basis: 100%;
        min-width: 0;
      }
      .search-actions {
        justify-content: flex-end;
      }
    }
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }
    .number-input {
      width: 100%;
    }
    .ellipsis-cell {
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .account-cell {
      max-width: 96px;
    }
    .category-cell {
      max-width: 180px;
    }
    .link-button {
      max-width: 100%;
      padding: 0;
      border: 0;
      color: #1677ff;
      background: transparent;
      line-height: 22px;
      text-align: left;
      cursor: pointer;
    }
    .link-button:hover,
    .link-button:focus {
      color: #0958d9;
      text-decoration: underline;
      outline: none;
    }
    .product-id-link {
      display: block;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }
    .product-id-cell {
      max-width: 140px;
    }
    .nowrap-header,
    .nowrap-cell {
      white-space: nowrap;
    }
    .title-link {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .disabled-link {
      color: #8c8c8c;
      cursor: not-allowed;
    }
    .disabled-link:hover,
    .disabled-link:focus {
      color: #8c8c8c;
      text-decoration: none;
    }
  `]
})
export class SelectionRecordComponent implements OnInit {
  data: SelectionRecord[] = [];
  accountOptions: AccountOption[] = [];
  categoryOptions: ProductCategory[] = [];
  private categoryPathLabelMap = new Map<number, string[]>();
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;
  checked = false;
  indeterminate = false;
  checkedIdSet = new Set<number>();
  checkedRecordMap = new Map<number, SelectionRecord>();
  clipSubmitting = false;
  discardSubmitting = false;
  restoreSubmitting = false;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增记录';
  editingId: number | null = null;

  statusOptions = statusOptions;

  searchForm = new FormGroup({
    productId: new FormControl<string>('', { nonNullable: true }),
    productTitle: new FormControl<string>('', { nonNullable: true }),
    accountNickname: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<string | null>(null),
    createTimeRange: new FormControl<Date[] | null>(null)
  });

  form = new FormGroup({
    accountNickname: new FormControl<string | null>('', [Validators.required]),
    productId: new FormControl<string | null>('', [Validators.required]),
    productTitle: new FormControl<string | null>('', [Validators.required]),
    productLink: new FormControl<string | null>(''),
    trailerLink: new FormControl<string | null>(''),
    productCategoryId: new FormControl<number | null>(null),
    commission: new FormControl<number>(0, { nonNullable: true }),
    commissionRate: new FormControl<number>(0, { nonNullable: true }),
    price: new FormControl<number>(0, { nonNullable: true }),
    productRating: new FormControl<number>(0, { nonNullable: true }),
    totalSales: new FormControl<number>(0, { nonNullable: true }),
    sellerCount: new FormControl<number>(0, { nonNullable: true }),
    shopName: new FormControl<string | null>('', [Validators.required]),
    status: new FormControl<string>(defaultSelectionStatus, { nonNullable: true }),
    reason: new FormControl<string | null>('')
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
    this.loadData();
  }

  refresh(): void {
    this.loadOptions();
    this.loadData();
  }

  search(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  resetSearch(): void {
    this.searchForm.reset({
      productId: '',
      productTitle: '',
      accountNickname: '',
      status: null,
      createTimeRange: null
    });
    this.search();
  }

  get selectedRecords(): SelectionRecord[] {
    return Array.from(this.checkedRecordMap.values());
  }

  get clipActionDisabled(): boolean {
    const selected = this.selectedRecords;
    return this.loading
      || this.clipSubmitting
      || this.discardSubmitting
      || this.restoreSubmitting
      || selected.length === 0
      || selected.some(item => !clipActionStatuses.includes(item.status));
  }

  get discardActionDisabled(): boolean {
    const selected = this.selectedRecords;
    return this.loading
      || this.clipSubmitting
      || this.discardSubmitting
      || this.restoreSubmitting
      || selected.length === 0
      || selected.some(item => !discardActionStatuses.includes(item.status));
  }

  get restoreActionDisabled(): boolean {
    const selected = this.selectedRecords;
    return this.loading
      || this.clipSubmitting
      || this.discardSubmitting
      || this.restoreSubmitting
      || selected.length === 0
      || selected.some(item => !restoreActionStatuses.includes(item.status));
  }

  onItemChecked(item: SelectionRecord, checked: boolean): void {
    this.updateCheckedSet(item, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.data.forEach(item => this.updateCheckedSet(item, checked));
    this.refreshCheckedStatus();
  }

  submitClip(): void {
    if (this.clipActionDisabled) {
      return;
    }
    const ids = this.selectedIds();
    this.clipSubmitting = true;
    this.sysApi.batchClipProductSelectionRecords(ids).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('已开始剪辑');
          this.clearSelection();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '开始剪辑失败');
        }
        this.clipSubmitting = false;
      },
      error: () => {
        this.message.error('开始剪辑失败');
        this.clipSubmitting = false;
      }
    });
  }

  submitDiscard(): void {
    if (this.discardActionDisabled) {
      return;
    }
    const ids = this.selectedIds();
    this.discardSubmitting = true;
    this.sysApi.batchDiscardProductSelectionRecords(ids).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('已作废');
          this.clearSelection();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '作废失败');
        }
        this.discardSubmitting = false;
      },
      error: () => {
        this.message.error('作废失败');
        this.discardSubmitting = false;
      }
    });
  }

  submitRestore(): void {
    if (this.restoreActionDisabled) {
      return;
    }
    const ids = this.selectedIds();
    this.restoreSubmitting = true;
    this.sysApi.batchRestoreProductSelectionRecords(ids).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('已恢复');
          this.clearSelection();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '恢复失败');
        }
        this.restoreSubmitting = false;
      },
      error: () => {
        this.message.error('恢复失败');
        this.restoreSubmitting = false;
      }
    });
  }

  loadData(): void {
    this.loading = true;
    const params = this.buildSearchParams();
    const request: { current: number; size: number; params?: SelectionRecordSearchParams } = {
      current: this.pageIndex,
      size: this.pageSize
    };
    if (Object.keys(params).length > 0) {
      request.params = params;
    }
    this.sysApi.getProductSelectionRecordList(request).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
        }
        this.clearSelection();
        this.loading = false;
      },
      error: () => {
        this.message.error('加载记录失败');
        this.loading = false;
      }
    });
  }

  loadOptions(): void {
    this.sysApi.getAllBaseAccounts().subscribe({
      next: (res: any) => {
        this.accountOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
      },
      error: () => this.message.error('加载账号选项失败')
    });
    this.sysApi.getAllProductCategories().subscribe({
      next: (res: any) => {
        const categories = res.code === 0 && Array.isArray(res.data) ? this.normalizeProductCategories(res.data) : [];
        this.categoryOptions = categories;
        this.buildCategoryPathLabels(categories);
      },
      error: () => {
        this.categoryOptions = [];
        this.categoryPathLabelMap.clear();
        this.message.error('加载品类选项失败');
      }
    });
  }

  copyProductId(productId?: string): void {
    const text = (productId || '').trim();
    if (!text) {
      this.message.warning('商品ID为空');
      return;
    }
    this.copyText(text)
      .then(() => this.message.success('商品ID复制成功'))
      .catch(() => this.message.error('复制失败，请手动复制'));
  }

  openProductLink(item: SelectionRecord): void {
    const link = (item.productLink || '').trim();
    if (!link) {
      this.message.warning('商品链接为空');
      return;
    }
    const opened = window.open(this.normalizeProductLink(link), '_blank', 'width=1200,height=800');
    if (opened) {
      opened.opener = null;
    } else {
      this.message.warning('浏览器已拦截新窗口，请允许弹窗后重试');
    }
  }

  categoryDisplay(item: SelectionRecord): string {
    const id = Number(item.productCategoryId || 0);
    if (!Number.isFinite(id) || id <= 0) return '—';
    const labels = this.categoryPathLabelMap.get(id);
    return labels && labels.length > 0 ? labels.join(' / ') : `#${id}`;
  }

  showAddModal(): void {
    this.modalTitle = '新增记录';
    this.editingId = null;
    this.form.reset({
      accountNickname: '',
      productCategoryId: null,
      commission: 0,
      commissionRate: 0,
      price: 0,
      productRating: 0,
      totalSales: 0,
      sellerCount: 0,
      status: defaultSelectionStatus,
      reason: ''
    });
    this.modalVisible = true;
  }

  showEditModal(item: SelectionRecord): void {
    this.modalTitle = '编辑记录';
    this.editingId = item.id || null;
    this.form.patchValue({
      accountNickname: item.accountNickname,
      productId: item.productId,
      productTitle: item.productTitle,
      productLink: item.productLink || '',
      trailerLink: item.trailerLink || '',
      productCategoryId: item.productCategoryId || null,
      commission: item.commission || 0,
      commissionRate: item.commissionRate || 0,
      price: item.price || 0,
      productRating: item.productRating || 0,
      totalSales: item.totalSales || 0,
      sellerCount: item.sellerCount || 0,
      shopName: item.shopName,
      status: item.status || defaultSelectionStatus,
      reason: item.reason || ''
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) return;
    this.modalLoading = true;
    const v = this.form.value;
    const payload: SelectionRecord = {
      accountNickname: v.accountNickname || '',
      productId: v.productId || '',
      productTitle: v.productTitle || '',
      productLink: v.productLink || '',
      trailerLink: v.trailerLink || '',
      productCategoryId: v.productCategoryId || null,
      commission: v.commission || 0,
      commissionRate: v.commissionRate || 0,
      price: v.price || 0,
      productRating: v.productRating || 0,
      totalSales: v.totalSales || 0,
      sellerCount: v.sellerCount || 0,
      shopName: v.shopName || '',
      status: v.status || defaultSelectionStatus,
      reason: v.reason || ''
    };

    const api$ = this.editingId
      ? this.sysApi.updateProductSelectionRecord({ ...payload, id: this.editingId })
      : this.sysApi.createProductSelectionRecord(payload);

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

  deleteItem(item: SelectionRecord): void {
    if (!item.id) return;
    this.sysApi.deleteProductSelectionRecord(item.id).subscribe({
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

  private updateCheckedSet(item: SelectionRecord, checked: boolean): void {
    const id = item.id;
    if (!id) {
      return;
    }
    if (checked) {
      this.checkedIdSet.add(id);
      this.checkedRecordMap.set(id, item);
    } else {
      this.checkedIdSet.delete(id);
      this.checkedRecordMap.delete(id);
    }
  }

  private refreshCheckedStatus(): void {
    const selectableRows = this.data.filter(item => !!item.id);
    const checkedRows = selectableRows.filter(item => item.id && this.checkedIdSet.has(item.id));
    this.checked = selectableRows.length > 0 && checkedRows.length === selectableRows.length;
    this.indeterminate = checkedRows.length > 0 && !this.checked;
  }

  private clearSelection(): void {
    this.checkedIdSet.clear();
    this.checkedRecordMap.clear();
    this.checked = false;
    this.indeterminate = false;
  }

  private selectedIds(): number[] {
    return Array.from(this.checkedIdSet);
  }

  private async copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!copied) {
      throw new Error('copy failed');
    }
  }

  private normalizeProductLink(link: string): string {
    try {
      return new URL(link).href;
    } catch {
      return `https://${link}`;
    }
  }

  private buildSearchParams(): SelectionRecordSearchParams {
    const value = this.searchForm.value;
    const params: SelectionRecordSearchParams = {};
    this.assignTrimmedParam(params, 'productId', value.productId);
    this.assignTrimmedParam(params, 'productTitle', value.productTitle);
    this.assignTrimmedParam(params, 'accountNickname', value.accountNickname);
    this.assignTrimmedParam(params, 'status', value.status);

    const range = value.createTimeRange;
    if (Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
      params.startTime = this.formatDateTime(this.startOfDay(range[0]));
      params.endTime = this.formatDateTime(this.endOfDay(range[1]));
    }
    return params;
  }

  private assignTrimmedParam(
    params: SelectionRecordSearchParams,
    key: keyof SelectionRecordSearchParams,
    value?: string | null
  ): void {
    const text = (value || '').trim();
    if (text) {
      params[key] = text;
    }
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private formatDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return [
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    ].join(' ');
  }

  private normalizeProductCategories(categories: ProductCategory[]): ProductCategory[] {
    return categories.map(item => ({
      ...item,
      id: item.id ? Number(item.id) : undefined,
      parentId: Number(item.parentId || 0),
      seq: Number(item.seq || 0),
      level: Number(item.level || 1),
      status: Number(item.status ?? 1),
      children: []
    }));
  }

  private buildCategoryPathLabels(categories: ProductCategory[]): void {
    this.categoryPathLabelMap.clear();
    const nodeMap = new Map<number, ProductCategory>();
    const roots: ProductCategory[] = [];

    categories.forEach(item => {
      if (!item.id) {
        return;
      }
      const node: ProductCategory = {
        ...item,
        parentId: item.parentId || 0,
        children: []
      };
      nodeMap.set(item.id, node);
    });

    nodeMap.forEach(node => {
      const parentId = node.parentId || 0;
      const parent = parentId ? nodeMap.get(parentId) : undefined;
      if (parent && parent.id !== node.id) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    this.sortCategoryNodes(roots);
    this.collectCategoryPathLabels(roots, []);
  }

  private collectCategoryPathLabels(nodes: ProductCategory[], parentLabels: string[]): void {
    nodes.forEach(node => {
      if (!node.id) {
        return;
      }
      const labels = [...parentLabels, node.name];
      this.categoryPathLabelMap.set(node.id, labels);
      this.collectCategoryPathLabels(node.children || [], labels);
    });
  }

  private sortCategoryNodes(nodes: ProductCategory[]): void {
    nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));
    nodes.forEach(node => this.sortCategoryNodes(node.children || []));
  }
}
