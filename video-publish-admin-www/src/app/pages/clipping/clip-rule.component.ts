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
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

// 对齐数据库 clip_rule 表
interface ClipRule {
  id: number;
  userId?: number;
  name: string;
  status: number;
  clipCount?: number;
  createTime?: string;
  /** 规则项名称，逗号分隔（后端聚合） */
  itemNames?: string;
}

// 对齐数据库 clip_rule_item 表
interface ClipRuleItem {
  id?: number;
  code?: string;
  name: string;
  content?: string;
  status: number;
  seq?: number;
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-clip-rule',
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
    NzSelectModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">剪辑规则</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增规则</span>
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
        >
          <thead>
            <tr>
              <th>规则名称</th>
              <th nzWidth="280px">规则项</th>
              <th>状态</th>
              <th>剪辑数</th>
              <th>创建时间</th>
              <th nzWidth="260px" nzRight>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td>
                  <span class="item-names-cell" [title]="item.itemNames || ''">
                    {{ item.itemNames || '—' }}
                  </span>
                </td>
                <td>
                  <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                    {{ statusMap[item.status] || '未知' }}
                  </nz-tag>
                </td>
                <td>{{ item.clipCount || 0 }}</td>
                <td>{{ item.createTime | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td nzRight>
                  <div class="action-buttons">
                    <button nz-button nzType="link" nzSize="small" (click)="showDetailModal(item)">选择规则项</button>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <nz-popconfirm nzTitle="确定执行此规则?" (nzOnConfirm)="executeRule(item)">
                      <button nz-button nzType="link" nzSize="small">执行</button>
                    </nz-popconfirm>
                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="确定删除此规则?"
                      (nzOnConfirm)="deleteRule(item)"
                    >删除</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>

      <!-- 新增/编辑规则弹窗 -->
      <nz-modal
        [(nzVisible)]="modalVisible"
        [nzTitle]="modalTitle"
        [nzOkLoading]="modalLoading"
        (nzOnOk)="handleModalOk()"
        (nzOnCancel)="modalVisible = false"
        nzWidth="620px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="ruleForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>规则名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入规则名称">
                <input nz-input formControlName="name" placeholder="请输入规则名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>状态</nz-form-label>
              <nz-form-control>
                <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>剪辑规则项</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="itemIds"
                  nzMode="multiple"
                  nzPlaceHolder="请选择规则项"
                  [nzLoading]="itemOptionsLoading"
                  [nzMaxTagCount]="4"
                >
                  @for (option of itemOptions; track option.name) {
                    <nz-option [nzValue]="option.name" [nzLabel]="ruleItemOptionLabel(option)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>

      <!-- 规则项弹窗 -->
      <nz-modal
        [(nzVisible)]="detailVisible"
        nzTitle="规则项配置"
        nzWidth="900px"
        [nzFooter]="detailFooter"
        (nzOnCancel)="handleDetailClose()"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="selectionForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label>剪辑规则项</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="itemIds"
                  nzMode="multiple"
                  nzPlaceHolder="请选择规则项"
                  [nzLoading]="itemOptionsLoading || itemsLoading"
                  [nzMaxTagCount]="8"
                >
                  @for (option of itemOptions; track option.name) {
                    <nz-option [nzValue]="option.name" [nzLabel]="ruleItemOptionLabel(option)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </form>
          <nz-table
            [nzData]="selectedDetailItems"
            [nzLoading]="itemOptionsLoading || itemsLoading"
            nzSize="small"
            [nzShowPagination]="false"
          >
            <thead>
              <tr>
                <th>名称</th>
                <th>内容</th>
                <th>状态</th>
                <th>排序</th>
                <th nzWidth="80px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (ri of selectedDetailItems; track ri.name) {
                <tr>
                  <td>{{ ri.name }}</td>
                  <td>{{ ri.content }}</td>
                  <td>
                    <nz-tag [nzColor]="ri.status === 1 ? 'green' : 'red'">
                      {{ statusMap[ri.status] || '未知' }}
                    </nz-tag>
                  </td>
                  <td>{{ ri.seq }}</td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="removeSelectedItem(ri)">删除</button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </ng-container>
        <ng-template #detailFooter>
          <button nz-button (click)="handleDetailClose()">关闭</button>
          <button nz-button nzType="primary" [nzLoading]="detailSaving" (click)="handleDetailSave()">保存</button>
        </ng-template>
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
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .item-names-cell {
      display: inline-block;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
      color: #595959;
      font-size: 13px;
    }
  `]
})
export class ClipRuleComponent implements OnInit {
  data: ClipRule[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增规则';
  editingId: number | null = null;

  ruleForm = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required]),
    status: new FormControl<boolean>(true),
    itemIds: new FormControl<string[]>([], { nonNullable: true })
  });

  statusMap = statusMap;

  // 规则项
  detailVisible = false;
  detailSaving = false;
  itemsLoading = false;
  ruleItems: ClipRuleItem[] = [];
  itemOptions: ClipRuleItem[] = [];
  itemOptionsLoading = false;
  currentRuleId: number | null = null;
  detailItemsChanged = false;

  selectionForm = new FormGroup({
    itemIds: new FormControl<string[]>([], { nonNullable: true })
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
    this.sysApi.getClipRuleList({ current: this.pageIndex, size: this.pageSize }).subscribe({
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
      error: () => { this.message.error('加载失败'); this.loading = false; }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增规则';
    this.editingId = null;
    this.ruleItems = [];
    this.ruleForm.reset({ status: true, itemIds: [] });
    this.loadItemOptions();
    this.modalVisible = true;
  }

  showEditModal(item: ClipRule): void {
    this.modalTitle = '编辑规则';
    this.editingId = item.id;
    this.ruleItems = [];
    this.ruleForm.patchValue({ name: item.name, status: item.status === 1, itemIds: [] });
    this.loadItemOptions();
    this.loadRuleItems(item.id, ids => this.ruleForm.controls.itemIds.setValue(ids));
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.ruleForm.invalid) return;
    this.modalLoading = true;
    const v = this.ruleForm.value;
    const payload: any = { name: v.name, status: v.status ? 1 : 0 };
    const selectedIds = v.itemIds || [];

    const api$ = this.editingId
      ? this.sysApi.updateClipRule({ ...payload, id: this.editingId })
      : this.sysApi.createClipRule(payload);

    api$.subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          const ruleId = this.editingId || this.createdRuleId(res);
          if (!ruleId) {
            this.message.error('规则保存成功，但未获取到规则ID');
            this.modalLoading = false;
            return;
          }
          this.saveSelectedItems(ruleId, selectedIds, () => {
            this.message.success(this.editingId ? '更新成功' : '创建成功');
            this.modalVisible = false;
            this.modalLoading = false;
            this.loadData();
          }, () => {
            this.modalLoading = false;
          });
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '操作失败');
          this.modalLoading = false;
        }
      },
      error: () => { this.message.error('操作失败'); this.modalLoading = false; }
    });
  }

  // ==================== 规则项 ====================

  showDetailModal(item: ClipRule): void {
    this.currentRuleId = item.id;
    this.ruleItems = [];
    this.detailItemsChanged = false;
    this.selectionForm.reset({ itemIds: [] });
    this.detailVisible = true;
    this.loadItemOptions();
    this.loadRuleItems(item.id, ids => this.selectionForm.controls.itemIds.setValue(ids));
  }

  handleDetailClose(): void {
    this.detailVisible = false;
    if (this.detailItemsChanged) {
      this.detailItemsChanged = false;
      this.loadData();
    }
  }

  loadRuleItems(): void;
  loadRuleItems(ruleId: number, onLoaded?: (ids: string[]) => void): void;
  loadRuleItems(ruleId?: number, onLoaded?: (ids: string[]) => void): void {
    const targetRuleId = ruleId || this.currentRuleId;
    if (!targetRuleId) return;
    this.itemsLoading = true;
    this.sysApi.getClipRuleItems(targetRuleId).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          this.ruleItems = Array.isArray(res.data) ? res.data : (res.data.records || []);
        } else { this.ruleItems = []; }
        this.mergeItemOptions(this.ruleItems);
        onLoaded?.(this.ruleItems
          .map(item => item.name)
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
          .map(name => name.trim()));
        this.itemsLoading = false;
      },
      error: () => { this.message.error('加载规则项失败'); this.itemsLoading = false; }
    });
  }

  loadItemOptions(): void {
    this.itemOptionsLoading = true;
    this.sysApi.getClipRuleItemOptions().subscribe({
      next: (res: any) => {
        this.itemOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.itemOptionsLoading = false;
      },
      error: () => {
        this.itemOptions = [];
        this.itemOptionsLoading = false;
      }
    });
  }

  handleDetailSave(): void {
    if (!this.currentRuleId) return;
    this.detailSaving = true;
    this.saveSelectedItems(this.currentRuleId, this.selectionForm.controls.itemIds.value || [], () => {
      this.message.success('保存成功');
      this.detailItemsChanged = true;
      this.detailSaving = false;
      this.handleDetailClose();
    }, () => {
      this.detailSaving = false;
    });
  }

  saveSelectedItems(ruleId: number, selectedIds: string[], onSuccess: () => void, onDone?: () => void): void {
    const selectedItems = this.selectedItemsByIds(selectedIds);
    if (selectedItems.length !== selectedIds.length) {
      this.message.warning('规则项数据未加载完成，请刷新后重试');
      onDone?.();
      return;
    }
    this.sysApi.saveClipRuleItems(ruleId, selectedItems).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          onSuccess();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '保存失败');
        }
        onDone?.();
      },
      error: () => { this.message.error('保存失败'); onDone?.(); }
    });
  }

  get selectedDetailItems(): ClipRuleItem[] {
    return this.selectedItemOptionsByIds(this.selectionForm.controls.itemIds.value || []);
  }

  removeSelectedItem(item: ClipRuleItem): void {
    if (!item.name) return;
    const targetName = item.name.trim();
    const next = (this.selectionForm.controls.itemIds.value || []).filter(name => name.trim() !== targetName);
    this.selectionForm.controls.itemIds.setValue(next);
  }

  ruleItemOptionLabel(item: ClipRuleItem): string {
    return item.name;
  }

  private selectedItemsByIds(ids: string[]): ClipRuleItem[] {
    return this.selectedItemOptionsByIds(ids)
      .map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        content: item.content || '',
        status: item.status ?? 1,
        seq: item.seq ?? 0
      }));
  }

  private selectedItemOptionsByIds(ids: string[]): ClipRuleItem[] {
    const byName = new Map<string, ClipRuleItem>();
    this.itemOptions
      .filter(item => typeof item.name === 'string' && item.name.trim().length > 0)
      .forEach(item => byName.set(item.name.trim(), { ...item, name: item.name.trim() }));
    this.ruleItems
      .filter(item => typeof item.name === 'string' && item.name.trim().length > 0)
      .forEach(item => {
        const name = item.name.trim();
        const option = byName.get(name);
        byName.set(name, { ...option, ...item, code: item.code || option?.code, name, id: option?.id ?? item.id });
      });
    return ids
      .map(name => byName.get(name.trim()))
      .filter((item): item is ClipRuleItem => !!item);
  }

  private mergeItemOptions(items: ClipRuleItem[]): void {
    const existing = new Set(this.itemOptions
      .filter(item => typeof item.name === 'string' && item.name.trim().length > 0)
      .map(item => item.name.trim()));
    const extras = items.filter(item => typeof item.name === 'string'
      && item.name.trim().length > 0
      && !existing.has(item.name.trim()))
      .map(item => ({ ...item, name: item.name.trim() }));
    if (extras.length > 0) {
      this.itemOptions = [...this.itemOptions, ...extras];
    }
  }

  private createdRuleId(res: any): number | null {
    const id = res?.data?.id ?? res?.data;
    const num = Number(id);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  executeRule(item: ClipRule): void {
    this.sysApi.executeClipRule(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) { this.message.success('规则已提交执行'); this.loadData(); }
        else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '执行失败');
        }
      },
      error: () => { this.message.error('执行失败'); }
    });
  }

  deleteRule(item: ClipRule): void {
    this.sysApi.deleteClipRule(item.id).subscribe({
      next: (res: any) => {
        if (res.code === 0) { this.message.success('删除成功'); this.loadData(); }
        else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => { this.message.error('删除失败'); }
    });
  }
}
