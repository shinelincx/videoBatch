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
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import type { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface SelectionStrategy {
  id?: number;
  name: string;
  platform: string;
  category?: string;
  commissionMin?: number;
  commissionMax?: number;
  commissionRateMin?: number;
  commissionRateMax?: number;
  priceMin?: number;
  priceMax?: number;
  orderRatioMin?: number;
  orderRatioMax?: number;
  productRatingMin?: number;
  productRatingMax?: number;
  createTime?: string;
}

interface SelectionStrategyItem {
  id?: number;
  name: string;
  content?: string;
  status: number;
  seq: number;
}

interface ProductCategory {
  id?: number;
  name: string;
  parentId?: number;
  seq?: number;
  level?: number;
  status: number;
  children?: ProductCategory[];
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-selection-strategy',
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
    NzCascaderModule,
    NzInputNumberModule,
    NzSwitchModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">选品策略</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增策略</span>
            </button>
          </div>
          <div class="toolbar-right">
            <button nz-button (click)="refresh()" [nzLoading]="loading">
              <nz-icon nzType="reload"></nz-icon>
              <span>刷新</span>
            </button>
            <button nz-button (click)="showItemListModal()">
              <nz-icon nzType="setting"></nz-icon>
              <span>策略项配置</span>
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
        >
          <thead>
            <tr>
              <th>策略名称</th>
              <th>平台</th>
              <th>品类</th>
              <th>佣金</th>
              <th>佣金率</th>
              <th>价格</th>
              <th>出单比</th>
              <th>评分</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.platform }}</td>
                <td>{{ displayCategory(item.category) }}</td>
                <td>{{ rangeText(item.commissionMin, item.commissionMax) }}</td>
                <td>{{ rangeText(item.commissionRateMin, item.commissionRateMax, '%') }}</td>
                <td>{{ rangeText(item.priceMin, item.priceMax) }}</td>
                <td>{{ rangeText(item.orderRatioMin, item.orderRatioMax, '%') }}</td>
                <td>{{ rangeText(item.productRatingMin, item.productRatingMax) }}</td>
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
                      nzPopconfirmTitle="确定删除此策略?"
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
            <div class="form-grid">
              <nz-form-item>
                <nz-form-label nzRequired>策略名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入策略名称">
                  <input nz-input formControlName="name" placeholder="请输入策略名称" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>平台</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="platform">
                    <nz-option nzValue="百应" nzLabel="百应"></nz-option>
                    <nz-option nzValue="禅选" nzLabel="禅选"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>品类</nz-form-label>
                <nz-form-control>
                  <nz-cascader
                    class="category-cascader"
                    formControlName="categoryPath"
                    [nzOptions]="categoryCascaderOptions"
                    [nzShowSearch]="true"
                    [nzChangeOnSelect]="true"
                    nzPlaceHolder="请选择品类"
                  ></nz-cascader>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>佣金</nz-form-label>
                <nz-form-control>
                  <div class="range-control">
                    <nz-input-number class="number-input" formControlName="commissionMin" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最小值"></nz-input-number>
                    <span>至</span>
                    <nz-input-number class="number-input" formControlName="commissionMax" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最大值"></nz-input-number>
                  </div>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>佣金率(%)</nz-form-label>
                <nz-form-control>
                  <div class="range-control">
                    <nz-input-number class="number-input" formControlName="commissionRateMin" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最小值"></nz-input-number>
                    <span>至</span>
                    <nz-input-number class="number-input" formControlName="commissionRateMax" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最大值"></nz-input-number>
                  </div>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>价格</nz-form-label>
                <nz-form-control>
                  <div class="range-control">
                    <nz-input-number class="number-input" formControlName="priceMin" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最小值"></nz-input-number>
                    <span>至</span>
                    <nz-input-number class="number-input" formControlName="priceMax" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最大值"></nz-input-number>
                  </div>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>出单比(%)</nz-form-label>
                <nz-form-control>
                  <div class="range-control">
                    <nz-input-number class="number-input" formControlName="orderRatioMin" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最小值"></nz-input-number>
                    <span>至</span>
                    <nz-input-number class="number-input" formControlName="orderRatioMax" [nzMin]="0" [nzStep]="0.01" nzPlaceHolder="最大值"></nz-input-number>
                  </div>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>评分</nz-form-label>
                <nz-form-control>
                  <div class="range-control">
                    <nz-input-number class="number-input" formControlName="productRatingMin" [nzMin]="0" [nzMax]="5" [nzStep]="0.1" nzPlaceHolder="最小值"></nz-input-number>
                    <span>至</span>
                    <nz-input-number class="number-input" formControlName="productRatingMax" [nzMin]="0" [nzMax]="5" [nzStep]="0.1" nzPlaceHolder="最大值"></nz-input-number>
                  </div>
                </nz-form-control>
              </nz-form-item>
            </div>
          </form>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="itemListVisible"
        nzTitle="策略项配置"
        nzWidth="900px"
        [nzFooter]="itemListFooter"
      >
        <ng-container *nzModalContent>
          <div class="detail-toolbar">
            <div class="toolbar-left">
              <button nz-button nzType="primary" nzSize="small" (click)="showAddItemModal()">
                <nz-icon nzType="plus"></nz-icon>
                <span>新增策略项</span>
              </button>
            </div>
            <div class="toolbar-right">
              <button nz-button nzSize="small" (click)="loadItemData()" [nzLoading]="itemLoading">
                <nz-icon nzType="reload"></nz-icon>
                <span>刷新</span>
              </button>
            </div>
          </div>
          <nz-table [nzData]="items" [nzLoading]="itemLoading" nzSize="small" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>名称</th>
                <th>内容</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items; track item.id) {
                <tr>
                  <td>{{ item.name }}</td>
                  <td>{{ item.content }}</td>
                  <td>
                    <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                      {{ statusMap[item.status] || '未知' }}
                    </nz-tag>
                  </td>
                  <td>{{ item.seq }}</td>
                  <td>
                    <nz-space>
                      <button nz-button nzType="link" nzSize="small" (click)="showEditItemModal(item)">编辑</button>
                      <button
                        nz-button
                        nzType="link"
                        nzSize="small"
                        nzDanger
                        nz-popconfirm
                        nzPopconfirmTitle="确定删除此策略项?"
                        (nzOnConfirm)="deleteItemRow(item)"
                      >删除</button>
                    </nz-space>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </ng-container>
        <ng-template #itemListFooter>
          <button nz-button (click)="itemListVisible = false">关闭</button>
        </ng-template>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="itemModalVisible"
        [nzTitle]="itemModalTitle"
        [nzOkLoading]="itemModalLoading"
        (nzOnOk)="handleItemOk()"
        (nzOnCancel)="itemModalVisible = false"
        nzWidth="520px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="itemForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入名称">
                <input nz-input formControlName="name" placeholder="请输入策略项名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>内容</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="content" rows="4" placeholder="请输入策略项内容"></textarea>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>状态</nz-form-label>
              <nz-form-control>
                <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>排序</nz-form-label>
              <nz-form-control>
                <nz-input-number class="number-input" formControlName="seq" [nzMin]="0" [nzStep]="1"></nz-input-number>
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
    .toolbar,
    .detail-toolbar {
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
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }
    .number-input {
      width: 100%;
    }
    .category-cascader {
      display: block;
      width: 100%;
    }
    .range-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
    }
    .range-control span {
      color: #8c8c8c;
      text-align: center;
      font-size: 12px;
    }
  `]
})
export class SelectionStrategyComponent implements OnInit {
  data: SelectionStrategy[] = [];
  items: SelectionStrategyItem[] = [];
  categoryOptions: ProductCategory[] = [];
  categoryCascaderOptions: NzCascaderOption[] = [];
  private categoryPathMap = new Map<number, number[]>();
  private categoryPathLabelMap = new Map<string, string[]>();
  private categoryTextPathMap = new Map<string, number[]>();
  private editingCategoryText = '';
  loading = false;
  itemLoading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增策略';
  editingId: number | null = null;

  itemListVisible = false;
  itemModalVisible = false;
  itemModalLoading = false;
  itemModalTitle = '新增策略项';
  editingItemId: number | null = null;

  statusMap = statusMap;

  form = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required]),
    platform: new FormControl<string>('百应', { nonNullable: true }),
    categoryPath: new FormControl<number[]>([], { nonNullable: true }),
    commissionMin: new FormControl<number | null>(null),
    commissionMax: new FormControl<number | null>(null),
    commissionRateMin: new FormControl<number | null>(null),
    commissionRateMax: new FormControl<number | null>(null),
    priceMin: new FormControl<number | null>(null),
    priceMax: new FormControl<number | null>(null),
    orderRatioMin: new FormControl<number | null>(null),
    orderRatioMax: new FormControl<number | null>(null),
    productRatingMin: new FormControl<number | null>(null),
    productRatingMax: new FormControl<number | null>(null)
  });

  itemForm = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required]),
    content: new FormControl<string | null>(''),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    seq: new FormControl<number>(0, { nonNullable: true })
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadCategoryOptions();
    this.loadData();
  }

  refresh(): void {
    this.loadCategoryOptions();
    this.loadData();
  }

  loadCategoryOptions(): void {
    this.sysApi.getAllProductCategories().subscribe({
      next: (res: any) => {
        const categories = res.code === 0 && Array.isArray(res.data) ? this.normalizeProductCategories(res.data) : [];
        this.categoryOptions = categories;
        this.categoryCascaderOptions = this.buildCategoryCascaderOptions(categories);
      },
      error: () => {
        this.categoryOptions = [];
        this.categoryCascaderOptions = [];
        this.categoryPathMap.clear();
        this.categoryPathLabelMap.clear();
        this.categoryTextPathMap.clear();
        this.message.error('加载品类选项失败');
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getSelectionStrategyList({ current: this.pageIndex, size: this.pageSize }).subscribe({
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
        this.message.error('加载策略失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增策略';
    this.editingId = null;
    this.editingCategoryText = '';
    this.form.reset({
      platform: '百应',
      categoryPath: [],
      commissionMin: null,
      commissionMax: null,
      commissionRateMin: null,
      commissionRateMax: null,
      priceMin: null,
      priceMax: null,
      orderRatioMin: null,
      orderRatioMax: null,
      productRatingMin: null,
      productRatingMax: null
    });
    this.form.markAsPristine();
    this.modalVisible = true;
  }

  showEditModal(item: SelectionStrategy): void {
    this.modalTitle = '编辑策略';
    this.editingId = item.id || null;
    this.editingCategoryText = item.category || '';
    this.form.patchValue({
      name: item.name,
      platform: item.platform || '百应',
      categoryPath: this.categoryToPath(item.category),
      commissionMin: this.rangeValue(item.commissionMin),
      commissionMax: this.rangeValue(item.commissionMax),
      commissionRateMin: this.rangeValue(item.commissionRateMin),
      commissionRateMax: this.rangeValue(item.commissionRateMax),
      priceMin: this.rangeValue(item.priceMin),
      priceMax: this.rangeValue(item.priceMax),
      orderRatioMin: this.rangeValue(item.orderRatioMin),
      orderRatioMax: this.rangeValue(item.orderRatioMax),
      productRatingMin: this.rangeValue(item.productRatingMin),
      productRatingMax: this.rangeValue(item.productRatingMax)
    });
    this.form.markAsPristine();
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) return;
    const rangeError = this.validateRanges();
    if (rangeError) {
      this.message.warning(rangeError);
      return;
    }
    this.modalLoading = true;
    const v = this.form.getRawValue();
    const selectedCategory = this.categoryPathToCategory(v.categoryPath);
    const payload: SelectionStrategy = {
      name: v.name || '',
      platform: v.platform || '百应',
      category: selectedCategory || (this.form.controls.categoryPath.dirty ? '' : this.editingCategoryText),
      commissionMin: this.emptyToNull(v.commissionMin),
      commissionMax: this.emptyToNull(v.commissionMax),
      commissionRateMin: this.emptyToNull(v.commissionRateMin),
      commissionRateMax: this.emptyToNull(v.commissionRateMax),
      priceMin: this.emptyToNull(v.priceMin),
      priceMax: this.emptyToNull(v.priceMax),
      orderRatioMin: this.emptyToNull(v.orderRatioMin),
      orderRatioMax: this.emptyToNull(v.orderRatioMax),
      productRatingMin: this.emptyToNull(v.productRatingMin),
      productRatingMax: this.emptyToNull(v.productRatingMax)
    };

    const api$ = this.editingId
      ? this.sysApi.updateSelectionStrategy({ ...payload, id: this.editingId })
      : this.sysApi.createSelectionStrategy(payload);

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

  displayCategory(category?: string): string {
    const path = this.categoryToPath(category);
    if (path.length > 0) {
      return this.categoryPathToDisplayText(path);
    }
    return category || '—';
  }

  rangeText(min: unknown, max: unknown, suffix = ''): string {
    const start = this.rangeValue(min);
    const end = this.rangeValue(max);
    const hasStart = !this.isEmptyValue(start);
    const hasEnd = !this.isEmptyValue(end);
    if (!hasStart && !hasEnd) return '-';
    if (hasStart && hasEnd) return `${this.formatNumber(start)}${suffix} - ${this.formatNumber(end)}${suffix}`;
    if (hasStart) return `>= ${this.formatNumber(start)}${suffix}`;
    return `<= ${this.formatNumber(end)}${suffix}`;
  }

  private validateRanges(): string {
    const ranges: Array<{ label: string; min: number | null | undefined; max: number | null | undefined }> = [
      { label: '佣金', min: this.form.value.commissionMin, max: this.form.value.commissionMax },
      { label: '佣金率', min: this.form.value.commissionRateMin, max: this.form.value.commissionRateMax },
      { label: '价格', min: this.form.value.priceMin, max: this.form.value.priceMax },
      { label: '出单比', min: this.form.value.orderRatioMin, max: this.form.value.orderRatioMax },
      { label: '评分', min: this.form.value.productRatingMin, max: this.form.value.productRatingMax }
    ];
    for (const range of ranges) {
      if (!this.isEmptyValue(range.min) && !this.isEmptyValue(range.max) && Number(range.min) > Number(range.max)) {
        return `${range.label}最小值不能大于最大值`;
      }
    }
    return '';
  }

  private rangeValue(value: unknown): number | null {
    if (!this.isEmptyValue(value)) return Number(value);
    return null;
  }

  private emptyToNull(value: unknown): number | undefined {
    return this.isEmptyValue(value) ? undefined : Number(value);
  }

  private isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  private formatNumber(value: unknown): string {
    return this.isEmptyValue(value) ? '' : String(value);
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

  private buildCategoryCascaderOptions(categories: ProductCategory[]): NzCascaderOption[] {
    this.categoryPathMap.clear();
    this.categoryPathLabelMap.clear();
    this.categoryTextPathMap.clear();
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
    return this.toCascaderOptions(roots, [], []);
  }

  private toCascaderOptions(nodes: ProductCategory[], parentPath: number[], parentLabels: string[]): NzCascaderOption[] {
    return nodes
      .filter((node): node is ProductCategory & { id: number } => !!node.id)
      .map(node => {
        const path = [...parentPath, node.id];
        const labels = [...parentLabels, node.name];
        const children = node.children || [];
        this.categoryPathMap.set(node.id, path);
        this.categoryPathLabelMap.set(this.categoryPathKey(path), labels);
        this.categoryTextPathMap.set(this.categoryLabelsToText(labels), path);
        if (!this.categoryTextPathMap.has(node.name)) {
          this.categoryTextPathMap.set(node.name, path);
        }
        return {
          label: node.name,
          value: node.id,
          isLeaf: children.length === 0,
          children: children.length ? this.toCascaderOptions(children, path, labels) : undefined
        };
      });
  }

  private sortCategoryNodes(nodes: ProductCategory[]): void {
    nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));
    nodes.forEach(node => this.sortCategoryNodes(node.children || []));
  }

  private categoryToPath(category?: string): number[] {
    const text = (category || '').trim();
    if (!text) {
      return [];
    }
    const directPath = this.categoryTextPathMap.get(text);
    if (directPath) {
      return directPath;
    }
    const normalizedPathText = this.categoryLabelsToText(text.split('-').map(item => item.trim()).filter(Boolean));
    return this.categoryTextPathMap.get(normalizedPathText) || [];
  }

  private categoryPathToCategory(path?: number[] | null): string {
    const labels = this.categoryPathLabelMap.get(this.categoryPathKey(path));
    return labels?.[labels.length - 1] || '';
  }

  private categoryPathToDisplayText(path?: number[] | null): string {
    const labels = this.categoryPathLabelMap.get(this.categoryPathKey(path));
    return labels ? this.categoryLabelsToText(labels) : '';
  }

  private categoryLabelsToText(labels: string[]): string {
    return labels.join(' - ');
  }

  private categoryPathKey(path?: number[] | null): string {
    return Array.isArray(path) ? path.join(',') : '';
  }

  deleteItem(item: SelectionStrategy): void {
    if (!item.id) return;
    this.sysApi.deleteSelectionStrategy(item.id).subscribe({
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

  showItemListModal(): void {
    this.itemListVisible = true;
    this.loadItemData();
  }

  loadItemData(): void {
    this.itemLoading = true;
    this.sysApi.getAllSelectionStrategyItems().subscribe({
      next: (res: any) => {
        this.items = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.itemLoading = false;
      },
      error: () => {
        this.message.error('加载策略项失败');
        this.itemLoading = false;
      }
    });
  }

  showAddItemModal(): void {
    this.itemModalTitle = '新增策略项';
    this.editingItemId = null;
    this.itemForm.reset({ status: true, seq: 0 });
    this.itemModalVisible = true;
  }

  showEditItemModal(item: SelectionStrategyItem): void {
    this.itemModalTitle = '编辑策略项';
    this.editingItemId = item.id || null;
    this.itemForm.patchValue({
      name: item.name,
      content: item.content || '',
      status: item.status === 1,
      seq: item.seq || 0
    });
    this.itemModalVisible = true;
  }

  handleItemOk(): void {
    if (this.itemForm.invalid) return;
    this.itemModalLoading = true;
    const v = this.itemForm.value;
    const payload: SelectionStrategyItem = {
      name: v.name || '',
      content: v.content || '',
      status: v.status ? 1 : 0,
      seq: v.seq || 0
    };

    const api$ = this.editingItemId
      ? this.sysApi.updateSelectionStrategyItem({ ...payload, id: this.editingItemId })
      : this.sysApi.createSelectionStrategyItem(payload);

    api$.subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(this.editingItemId ? '更新成功' : '创建成功');
          this.itemModalVisible = false;
          this.loadItemData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '操作失败');
        }
        this.itemModalLoading = false;
      },
      error: () => {
        this.message.error('操作失败');
        this.itemModalLoading = false;
      }
    });
  }

  deleteItemRow(item: SelectionStrategyItem): void {
    if (!item.id) return;
    this.sysApi.deleteSelectionStrategyItem(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadItemData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => this.message.error('删除失败')
    });
  }
}
