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

interface ProductCategory {
  id?: number;
  name: string;
  parentId: number;
  seq: number;
  level: number;
  status: number;
  remark?: string;
  createTime?: string;
  children?: ProductCategory[];
  depth?: number;
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-product-category',
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
        <h2 class="page-title">商品类目</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增类目</span>
            </button>
            <button nz-button (click)="expandAll()">
              <nz-icon nzType="down"></nz-icon>
              <span>全部展开</span>
            </button>
            <button nz-button (click)="collapseAll()">
              <nz-icon nzType="right"></nz-icon>
              <span>全部收起</span>
            </button>
          </div>
          <div class="toolbar-right">
            <span class="category-count">共 {{ total }} 个类目</span>
            <button nz-button (click)="refresh()" [nzLoading]="loading">
              <nz-icon nzType="reload"></nz-icon>
              <span>刷新</span>
            </button>
          </div>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzFrontPagination]="false"
          [nzShowPagination]="false"
        >
          <thead>
            <tr>
              <th>类目名称</th>
              <th>父级类目</th>
              <th>层级</th>
              <th>排序</th>
              <th>状态</th>
              <th>备注</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>
                  <div class="category-name" [style.padding-left.px]="(item.depth || 0) * 24">
                    @if (hasChildren(item)) {
                      <button nz-button nzType="text" nzSize="small" class="expand-button" (click)="toggleExpand(item)">
                        <nz-icon [nzType]="isExpanded(item) ? 'down' : 'right'"></nz-icon>
                      </button>
                    } @else {
                      <span class="expand-spacer"></span>
                    }
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td>{{ getCategoryName(item.parentId) }}</td>
                <td>{{ item.level }}级</td>
                <td>{{ item.seq }}</td>
                <td>
                  <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                    {{ statusMap[item.status] || '未知' }}
                  </nz-tag>
                </td>
                <td class="remark-cell" [title]="item.remark || ''">{{ item.remark || '—' }}</td>
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
                      nzPopconfirmTitle="确定删除此类目?"
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
        nzWidth="560px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>类目名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入类目名称">
                <input nz-input formControlName="name" placeholder="请输入类目名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>父级类目</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="parentId" nzPlaceHolder="请选择父级类目">
                  <nz-option [nzValue]="0" nzLabel="顶级类目"></nz-option>
                  @for (category of parentOptions; track category.id) {
                    <nz-option [nzValue]="category.id" [nzLabel]="categoryOptionLabel(category)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>层级</nz-form-label>
              <nz-form-control>
                <nz-input-number class="number-input" formControlName="level" [nzMin]="1" [nzMax]="3" [nzStep]="1"></nz-input-number>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>排序</nz-form-label>
              <nz-form-control>
                <nz-input-number class="number-input" formControlName="seq" [nzMin]="0" [nzStep]="1"></nz-input-number>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>状态</nz-form-label>
              <nz-form-control>
                <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>备注</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="remark" rows="3" placeholder="请输入类目描述"></textarea>
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
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .category-count {
      color: #8c8c8c;
      font-size: 13px;
    }
    .category-name {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 24px;
    }
    .expand-button {
      width: 24px;
      height: 24px;
      padding: 0;
      line-height: 22px;
    }
    .expand-spacer {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
    }
    .remark-cell {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .number-input {
      width: 100%;
    }
  `]
})
export class ProductCategoryComponent implements OnInit {
  data: ProductCategory[] = [];
  categoryOptions: ProductCategory[] = [];
  categoryTree: ProductCategory[] = [];
  expandedCategoryIds = new Set<number>();
  parentIdMap = new Map<number, number>();
  loading = false;
  total = 0;
  private initializedTreeExpansion = false;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增类目';
  editingId: number | null = null;

  statusMap = statusMap;

  form = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required]),
    parentId: new FormControl<number>(0, { nonNullable: true }),
    level: new FormControl<number>(1, { nonNullable: true }),
    seq: new FormControl<number>(0, { nonNullable: true }),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    remark: new FormControl<string | null>('')
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  get parentOptions(): ProductCategory[] {
    return this.categoryOptions.filter(item => {
      if (!item.id || item.id === this.editingId || item.level >= 3) {
        return false;
      }
      return !this.isDescendantOfEditing(item);
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.form.controls.parentId.valueChanges.subscribe(parentId => {
      this.form.controls.level.setValue(this.levelForParent(parentId), { emitEvent: false });
    });
  }

  refresh(): void {
    this.loadData();
  }

  expandAll(): void {
    this.expandedCategoryIds.clear();
    this.collectExpandableIds(this.categoryTree, this.expandedCategoryIds);
    this.data = this.flattenCategoryTree(this.categoryTree);
  }

  collapseAll(): void {
    this.expandedCategoryIds.clear();
    this.data = this.flattenCategoryTree(this.categoryTree);
  }

  toggleExpand(item: ProductCategory): void {
    if (!item.id || !this.hasChildren(item)) {
      return;
    }
    if (this.expandedCategoryIds.has(item.id)) {
      this.expandedCategoryIds.delete(item.id);
    } else {
      this.expandedCategoryIds.add(item.id);
    }
    this.data = this.flattenCategoryTree(this.categoryTree);
  }

  isExpanded(item: ProductCategory): boolean {
    return !!item.id && this.expandedCategoryIds.has(item.id);
  }

  hasChildren(item: ProductCategory): boolean {
    return !!item.children?.length;
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getAllProductCategories().subscribe({
      next: (res: any) => {
        const categories = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.total = categories.length;
        this.categoryTree = this.buildCategoryTree(categories);
        this.categoryOptions = this.flattenCategoryTree(this.categoryTree, true);
        this.syncExpandedState();
        this.data = this.flattenCategoryTree(this.categoryTree);
        this.loading = false;
      },
      error: () => {
        this.message.error('加载类目失败');
        this.data = [];
        this.categoryOptions = [];
        this.categoryTree = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  getCategoryName(parentId?: number | null): string {
    if (!parentId) return '顶级类目';
    return this.categoryOptions.find(item => item.id === parentId)?.name || `#${parentId}`;
  }

  categoryOptionLabel(category: ProductCategory): string {
    return `${'　'.repeat(category.depth || 0)}${category.name}`;
  }

  buildCategoryTree(categories: ProductCategory[]): ProductCategory[] {
    this.parentIdMap.clear();
    const nodeMap = new Map<number, ProductCategory>();
    const roots: ProductCategory[] = [];

    categories.forEach(item => {
      if (!item.id) {
        return;
      }
      nodeMap.set(item.id, {
        ...item,
        parentId: item.parentId || 0,
        children: []
      });
      this.parentIdMap.set(item.id, item.parentId || 0);
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
    this.assignCategoryDepth(roots, 0);
    return roots;
  }

  flattenCategoryTree(nodes: ProductCategory[], includeCollapsed = false): ProductCategory[] {
    const rows: ProductCategory[] = [];
    nodes.forEach(node => {
      rows.push(node);
      if (node.children?.length && (includeCollapsed || this.isExpanded(node))) {
        rows.push(...this.flattenCategoryTree(node.children, includeCollapsed));
      }
    });
    return rows;
  }

  syncExpandedState(): void {
    const existingIds = new Set(this.categoryOptions.map(item => item.id).filter((id): id is number => !!id));
    this.expandedCategoryIds.forEach(id => {
      if (!existingIds.has(id)) {
        this.expandedCategoryIds.delete(id);
      }
    });
    if (!this.initializedTreeExpansion) {
      this.collectExpandableIds(this.categoryTree, this.expandedCategoryIds);
      this.initializedTreeExpansion = true;
    }
  }

  collectExpandableIds(nodes: ProductCategory[], target: Set<number>): void {
    nodes.forEach(node => {
      if (node.id && node.children?.length) {
        target.add(node.id);
        this.collectExpandableIds(node.children, target);
      }
    });
  }

  sortCategoryNodes(nodes: ProductCategory[]): void {
    nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));
    nodes.forEach(node => this.sortCategoryNodes(node.children || []));
  }

  assignCategoryDepth(nodes: ProductCategory[], depth: number): void {
    nodes.forEach(node => {
      node.depth = depth;
      this.assignCategoryDepth(node.children || [], depth + 1);
    });
  }

  isDescendantOfEditing(item: ProductCategory): boolean {
    if (!this.editingId || !item.id) {
      return false;
    }
    let parentId = item.parentId || 0;
    while (parentId) {
      if (parentId === this.editingId) {
        return true;
      }
      parentId = this.parentIdMap.get(parentId) || 0;
    }
    return false;
  }

  levelForParent(parentId?: number | null): number {
    if (!parentId) {
      return 1;
    }
    const parent = this.categoryOptions.find(item => item.id === parentId);
    return Math.min((parent?.level || 1) + 1, 3);
  }

  showAddModal(): void {
    this.modalTitle = '新增类目';
    this.editingId = null;
    this.form.reset({ parentId: 0, level: 1, seq: 0, status: true, remark: '' });
    this.modalVisible = true;
  }

  showEditModal(item: ProductCategory): void {
    this.modalTitle = '编辑类目';
    this.editingId = item.id || null;
    this.form.patchValue({
      name: item.name,
      parentId: item.parentId || 0,
      level: item.level || 1,
      seq: item.seq || 0,
      status: item.status === 1,
      remark: item.remark || ''
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) return;
    this.modalLoading = true;
    const v = this.form.value;
    const payload: ProductCategory = {
      name: v.name || '',
      parentId: v.parentId || 0,
      level: v.level || 1,
      seq: v.seq || 0,
      status: v.status ? 1 : 0,
      remark: v.remark || ''
    };

    const api$ = this.editingId
      ? this.sysApi.updateProductCategory({ ...payload, id: this.editingId })
      : this.sysApi.createProductCategory(payload);

    api$.subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(this.editingId ? '更新成功' : '创建成功');
          this.modalVisible = false;
          this.refresh();
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

  deleteItem(item: ProductCategory): void {
    if (!item.id) return;
    this.sysApi.deleteProductCategory(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.refresh();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => this.message.error('删除失败')
    });
  }
}
