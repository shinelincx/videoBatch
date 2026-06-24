import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface PublishConfigColumn {
  name: string;
  label: string;
  dataType: string;
  columnType: string;
  comment?: string;
  nullable: boolean;
  defaultValue?: unknown;
  primaryKey: boolean;
  autoIncrement: boolean;
  system: boolean;
  editable: boolean;
}

type PublishConfigRow = Record<string, unknown>;

const publishOptionMap: Record<string, string[]> = {
  self_declaration: [
    '内容由AI生成',
    '内容为个人观点或见解',
    '内容为转载信息',
    '内容含营销推广信息',
    '虚构演绎，仅供娱乐',
    '危险行为，请勿模仿',
    '可能引人不适',
    '无需添加自主声明'
  ],
  sync_publish: ['不同时发布', '同时发布到'],
  visibility: ['公开', '好友可见', '仅自己可见'],
  save_permission: ['允许', '不允许'],
  publish_time: ['立即发布', '定时发布']
};

const setupFieldNames = new Set([
  'publishinterval',
  'selectionaudit'
]);

const publishOptionDefaults: Record<string, string> = {
  self_declaration: '无需添加自主声明',
  sync_publish: '不同时发布',
  visibility: '公开',
  save_permission: '允许',
  publish_time: '立即发布'
};

@Component({
  selector: 'app-publish-config',
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
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzRadioModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">发布配置</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showAddModal()" [disabled]="editableColumns.length === 0">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增配置</span>
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
          nzSize="small"
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [nzPageIndex]="pageIndex"
          [nzPageSize]="pageSize"
          [nzFrontPagination]="false"
          [nzShowSizeChanger]="true"
          [nzScroll]="{ x: tableScrollX }"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
        >
          <thead>
            <tr>
              @for (column of tableColumns; track column.name) {
                <th [nzWidth]="getColumnWidth(column)">{{ column.label }}</th>
              }
              <th nzWidth="120px" nzRight>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track getRowId(item, $index)) {
              <tr>
                @for (column of tableColumns; track column.name) {
                  <td>
                    @if (isStatusColumn(column)) {
                      <nz-switch
                        [ngModel]="isStatusEnabled(item, column)"
                        [nzLoading]="isStatusSwitchLoading(item, column)"
                        [nzCheckedChildren]="'启用'"
                        [nzUnCheckedChildren]="'停用'"
                        (ngModelChange)="onStatusSwitchChange(item, column, $event)"
                      ></nz-switch>
                    } @else if (isOwnerColumn(column)) {
                      <span class="cell-text" [title]="ownerText(item, column)">
                        {{ ownerText(item, column) }}
                      </span>
                    } @else if (isTenantColumn(column)) {
                      <span class="cell-text" [title]="tenantText(item, column)">
                        {{ tenantText(item, column) }}
                      </span>
                    } @else if (isClipConfigColumn(column)) {
                      <span class="cell-text" [title]="clipConfigText(item, column)">
                        {{ clipConfigText(item, column) }}
                      </span>
                    } @else {
                      <span class="cell-text" [title]="formatCell(item, column)">
                        {{ formatCell(item, column) }}
                      </span>
                    }
                  </td>
                }
                <td nzRight>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="确定删除此配置?"
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
        nzWidth="840px"
      >
        <ng-container *nzModalContent>
          <div class="config-modal-body">
            <form nz-form [formGroup]="form" nzLayout="vertical" class="compact-config-form">
              @if (setupColumns.length > 0) {
                <div class="setup-grid">
                @for (column of setupColumns; track column.name) {
                  <nz-form-item class="compact-form-item">
                    <nz-form-label [nzRequired]="isRequired(column)">{{ columnLabel(column) }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="'请填写' + columnLabel(column)">
                      @if (isYesNoColumn(column)) {
                        <nz-select [formControlName]="column.name" nzPlaceHolder="请选择">
                          <nz-option [nzValue]="1" nzLabel="是"></nz-option>
                          <nz-option [nzValue]="0" nzLabel="否"></nz-option>
                        </nz-select>
                      } @else {
                        <nz-input-number
                          class="number-input"
                          [formControlName]="column.name"
                          [nzMin]="getNumberMin(column)"
                          [nzStep]="getNumberStep(column)"
                        ></nz-input-number>
                      }
                    </nz-form-control>
                  </nz-form-item>
                }
                </div>
              }
              <div class="form-grid">
                @for (column of editableColumns; track column.name) {
                  @if (!isSetupField(column) && !isPublishDelayColumn(column)) {
                    <nz-form-item class="compact-form-item" [class.full-row]="isFullRowColumn(column)">
                      <nz-form-label [nzRequired]="isRequired(column)">{{ columnLabel(column) }}</nz-form-label>
                      <nz-form-control [nzErrorTip]="'请填写' + columnLabel(column)">
                        @if (isPublishOptionColumn(column)) {
                          <nz-radio-group
                            [formControlName]="column.name"
                            class="publish-radio-group"
                            [class.publish-radio-group-vertical]="isSelfDeclarationColumn(column)"
                          >
                            @for (option of publishOptions(column); track option) {
                              <label
                                nz-radio
                                [nzValue]="option"
                                [class.publish-radio-option-block]="isSelfDeclarationColumn(column)"
                                [class.publish-time-option-inline]="isPublishTimeColumn(column) && option === '定时发布'"
                              >
                                <span class="publish-time-title">
                                  <span>{{ option }}</span>
                                  @if (isPublishTimeColumn(column) && option === '定时发布' && isTimedPublishSelected()) {
                                    @if (publishDelayColumn; as delayColumn) {
                                      <span class="publish-delay-inline">
                                        <span class="publish-delay-inline-label">{{ columnLabel(delayColumn) }}</span>
                                        <nz-input-number
                                          class="publish-delay-input"
                                          [formControlName]="delayColumn.name"
                                          [nzMin]="getNumberMin(delayColumn)"
                                          [nzStep]="getNumberStep(delayColumn)"
                                        ></nz-input-number>
                                      </span>
                                    }
                                  }
                                </span>
                              </label>
                            }
                          </nz-radio-group>
                        } @else if (isClipConfigColumn(column)) {
                          <nz-select
                            [formControlName]="column.name"
                            nzAllowClear
                            nzShowSearch
                            nzPlaceHolder="请选择剪辑配置"
                          >
                            @for (config of clipConfigOptions; track clipConfigOptionValue(config)) {
                              <nz-option
                                [nzValue]="clipConfigOptionValue(config)"
                                [nzLabel]="clipConfigOptionLabel(config)"
                              ></nz-option>
                            }
                          </nz-select>
                        } @else if (isYesNoColumn(column)) {
                          <nz-select [formControlName]="column.name" nzPlaceHolder="请选择">
                            <nz-option [nzValue]="1" nzLabel="是"></nz-option>
                            <nz-option [nzValue]="0" nzLabel="否"></nz-option>
                          </nz-select>
                        } @else if (isNumberColumn(column)) {
                          <nz-input-number
                            class="number-input"
                            [formControlName]="column.name"
                            [nzMin]="getNumberMin(column)"
                            [nzStep]="getNumberStep(column)"
                          ></nz-input-number>
                        } @else if (isLongColumn(column) && !isMaterialPathColumn(column)) {
                          <textarea
                            nz-input
                            [formControlName]="column.name"
                            rows="4"
                            [placeholder]="'请输入' + columnLabel(column)"
                          ></textarea>
                        } @else {
                          <input nz-input [formControlName]="column.name" [placeholder]="'请输入' + columnLabel(column)" />
                        }
                      </nz-form-control>
                    </nz-form-item>
                  }
                }
              </div>
            </form>
          </div>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header {
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .page-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      color: #262626;
    }
    .card-container {
      background: #fff;
      border-radius: 4px;
      padding: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.02);
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cell-text {
      display: inline-block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
    .config-modal-body {
      max-height: min(70vh, 640px);
      overflow-y: auto;
      padding: 2px 8px 0 0;
    }
    .compact-config-form {
      display: grid;
      gap: 6px;
    }
    .setup-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 2px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px 12px;
    }
    .form-grid .full-row {
      grid-column: 1 / -1;
    }
    .number-input {
      width: 100%;
    }
    :host ::ng-deep .compact-config-form .ant-form-item {
      margin-bottom: 6px;
    }
    :host ::ng-deep .compact-config-form .ant-form-item-label {
      padding-bottom: 2px;
      line-height: 20px;
    }
    :host ::ng-deep .compact-config-form .ant-form-item-label > label {
      height: 20px;
      font-size: 12px;
      color: rgba(0, 0, 0, .72);
    }
    :host ::ng-deep .compact-config-form .ant-input,
    :host ::ng-deep .compact-config-form .ant-select-selector,
    :host ::ng-deep .compact-config-form .ant-input-number {
      min-height: 30px;
    }
    :host ::ng-deep .compact-config-form .ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
      height: 30px;
      padding: 0 8px;
    }
    :host ::ng-deep .compact-config-form .ant-select-single .ant-select-selector .ant-select-selection-item,
    :host ::ng-deep .compact-config-form .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
      line-height: 28px;
    }
    :host ::ng-deep .compact-config-form .ant-input-number-input {
      height: 28px;
      padding: 0 8px;
    }
    :host ::ng-deep .compact-config-form textarea.ant-input {
      min-height: 72px;
    }
    .publish-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      min-height: 28px;
      align-items: center;
      line-height: 28px;
    }
    .publish-radio-group-vertical {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: flex-start;
      gap: 3px;
      line-height: 22px;
    }
    .publish-radio-option-block {
      display: block;
      width: 100%;
      margin-right: 0;
      line-height: 22px;
    }
    .publish-time-option-inline {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    }
    .publish-time-title {
      display: inline-flex;
      align-items: center;
      gap: 0;
      white-space: nowrap;
    }
    .publish-delay-inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 4px;
      vertical-align: middle;
      white-space: nowrap;
    }
    .publish-delay-inline-label {
      color: rgba(0, 0, 0, .65);
      font-size: 12px;
      white-space: nowrap;
    }
    .publish-delay-input {
      width: 58px;
    }
    @media (max-width: 760px) {
      .setup-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PublishConfigComponent implements OnInit {
  columns: PublishConfigColumn[] = [];
  data: PublishConfigRow[] = [];
  clipConfigOptions: PublishConfigRow[] = [];
  form = new UntypedFormGroup({});

  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增配置';
  editingId: unknown = null;
  statusUpdatingKeys = new Set<string>();

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  get tableColumns(): PublishConfigColumn[] {
    return this.columns.filter(column => column.name !== 'deleted'
      && !this.isRemovedPublishLimitColumn(column)
      && !this.isRemovedCarrierColumn(column)
      && !this.isSelectionStrategyColumn(column));
  }

  get editableColumns(): PublishConfigColumn[] {
    const columns = this.columns.filter(column => column.editable
      && !this.isStatusColumn(column)
      && !this.isOwnerColumn(column)
      && !this.isTenantColumn(column)
      && !this.isRemovedPublishLimitColumn(column)
      && !this.isRemovedCarrierColumn(column)
      && !this.isPublishDirColumn(column)
      && !this.isSelectionStrategyColumn(column));
    return this.orderEditableColumns(this.deduplicateEditableColumns(columns));
  }

  get publishDelayColumn(): PublishConfigColumn | null {
    return this.editableColumns.find(column => this.isPublishDelayColumn(column)) || null;
  }

  get setupColumns(): PublishConfigColumn[] {
    return this.editableColumns
      .filter(column => this.isSetupField(column))
      .sort((a, b) => this.setupFieldIndex(a) - this.setupFieldIndex(b));
  }

  get tableScrollX(): string {
    return `${Math.max(this.tableColumns.length * 150 + 120, 900)}px`;
  }

  ngOnInit(): void {
    this.loadClipConfigOptions();
    this.loadColumns();
  }

  refresh(): void {
    this.loadClipConfigOptions();
    this.loadColumns();
  }

  loadClipConfigOptions(): void {
    this.sysApi.getAllClipConfigs().subscribe({
      next: (res: any) => {
        this.clipConfigOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
      },
      error: () => {
        this.clipConfigOptions = [];
      }
    });
  }

  loadColumns(): void {
    this.loading = true;
    this.sysApi.getPublishConfigColumns().subscribe({
      next: (res: any) => {
        if (res.code === 0 && Array.isArray(res.data)) {
          this.columns = res.data;
          this.loadData();
        } else {
          this.columns = [];
          this.data = [];
          this.total = 0;
          this.loading = false;
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布配置字段失败');
          }
        }
      },
      error: () => {
        this.columns = [];
        this.data = [];
        this.total = 0;
        this.loading = false;
        this.message.error('加载发布配置字段失败');
      }
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadData();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getPublishConfigList({ current: this.pageIndex, size: this.pageSize }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布配置失败');
          }
        }
        this.loading = false;
      },
      error: () => {
        this.message.error('加载发布配置失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增配置';
    this.editingId = null;
    this.buildForm();
    this.modalVisible = true;
  }

  showEditModal(item: PublishConfigRow): void {
    this.modalTitle = '编辑配置';
    this.editingId = item['id'];
    this.buildForm(item);
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
    const payload = this.normalizePayload(this.form.getRawValue());
    const api$ = this.editingId
      ? this.sysApi.updatePublishConfig({ ...payload, id: this.editingId })
      : this.sysApi.createPublishConfig(payload);

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

  deleteItem(item: PublishConfigRow): void {
    const id = item['id'];
    if (id === null || id === undefined || id === '') return;
    this.sysApi.deletePublishConfig(id as number).subscribe({
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

  onStatusSwitchChange(item: PublishConfigRow, column: PublishConfigColumn, checked: boolean): void {
    const id = item['id'];
    if (id === null || id === undefined || id === '') return;

    const previous = item[column.name];
    const next = checked ? 1 : 0;
    const key = this.statusSwitchKey(item, column);
    item[column.name] = next;
    this.statusUpdatingKeys.add(key);

    this.sysApi.updatePublishConfig({ id, [column.name]: next }).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(checked ? '已启用' : '已停用');
        } else {
          item[column.name] = previous;
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '状态更新失败');
          }
        }
        this.statusUpdatingKeys.delete(key);
      },
      error: () => {
        item[column.name] = previous;
        this.statusUpdatingKeys.delete(key);
        this.message.error('状态更新失败');
      }
    });
  }

  buildForm(row?: PublishConfigRow): void {
    const controls: Record<string, UntypedFormControl> = {};
    this.editableColumns.forEach(column => {
      controls[column.name] = new UntypedFormControl(
        row ? this.getFormValue(row, column) : this.getDefaultValue(column),
        this.isRequired(column) ? [Validators.required] : []
      );
    });
    this.form = new UntypedFormGroup(controls);
  }

  normalizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const next: Record<string, unknown> = {};
    this.editableColumns.forEach(column => {
      const value = payload[column.name];
      next[column.name] = this.isClipConfigColumn(column)
        ? this.normalizeNullableNumber(value)
        : this.isPublishOptionColumn(column)
        ? value || this.publishOptionDefault(column)
        : this.isYesNoColumn(column)
        ? this.normalizeYesNoValue(value)
        : this.isNumberColumn(column) && value !== '' && value !== null && value !== undefined
        ? Number(value)
        : value;
    });
    return next;
  }

  getDefaultValue(column: PublishConfigColumn): unknown {
    if (column.defaultValue !== null && column.defaultValue !== undefined) {
      if (this.isClipConfigColumn(column)) {
        return this.normalizeNullableNumber(column.defaultValue);
      }
      if (this.isPublishOptionColumn(column)) {
        return column.defaultValue || this.publishOptionDefault(column);
      }
      return this.isYesNoColumn(column) ? this.normalizeYesNoValue(column.defaultValue) : column.defaultValue;
    }
    if (this.isClipConfigColumn(column)) return null;
    if (this.isPublishOptionColumn(column)) return this.publishOptionDefault(column);
    if (this.isYesNoColumn(column)) return 0;
    return this.isNumberColumn(column) ? null : '';
  }

  getFormValue(row: PublishConfigRow, column: PublishConfigColumn): unknown {
    const value = row[column.name];
    if (this.isPublishOptionColumn(column)) {
      return value || this.publishOptionDefault(column);
    }
    if (this.isClipConfigColumn(column)) {
      return this.normalizeNullableNumber(value);
    }
    if (this.isYesNoColumn(column)) {
      return this.normalizeYesNoValue(value);
    }
    return value ?? '';
  }

  ownerText(item: PublishConfigRow, column: PublishConfigColumn): string {
    const value = item['displayOwner'];
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  tenantText(item: PublishConfigRow, column: PublishConfigColumn): string {
    const value = item['displayTenant'] ?? item[column.name];
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  clipConfigText(item: PublishConfigRow, column: PublishConfigColumn): string {
    const value = item['displayClipConfigName'] ?? item[column.name];
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  getRowId(item: PublishConfigRow, index: number): unknown {
    return item['id'] ?? index;
  }

  formatCell(item: PublishConfigRow, column: PublishConfigColumn): string {
    const value = item[column.name];
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (this.isStatusColumn(column)) {
      if (value === 1 || value === '1' || value === true) return '启用';
      if (value === 0 || value === '0' || value === false) return '禁用';
    }
    if (this.isYesNoColumn(column)) {
      if (value === 1 || value === '1' || value === true || value === 'true' || value === '是') return '是';
      if (value === 0 || value === '0' || value === false || value === 'false' || value === '否') return '否';
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  getStatusColor(item: PublishConfigRow, column: PublishConfigColumn): string {
    const value = item[column.name];
    return value === 1 || value === '1' || value === true ? 'green' : 'red';
  }

  isStatusEnabled(item: PublishConfigRow, column: PublishConfigColumn): boolean {
    const value = item[column.name];
    return value === 1 || value === '1' || value === true;
  }

  isStatusSwitchLoading(item: PublishConfigRow, column: PublishConfigColumn): boolean {
    return this.statusUpdatingKeys.has(this.statusSwitchKey(item, column));
  }

  private statusSwitchKey(item: PublishConfigRow, column: PublishConfigColumn): string {
    return `${item['id'] ?? ''}:${column.name}`;
  }

  getColumnWidth(column: PublishConfigColumn): string {
    if (column.name === 'id') return '120px';
    if (this.isOwnerColumn(column)) return '140px';
    if (this.isTenantColumn(column)) return '140px';
    if (this.isClipConfigColumn(column)) return '180px';
    if (this.isPublishOptionColumn(column)) return column.name === 'self_declaration' ? '220px' : '150px';
    if (this.isMaterialPathColumn(column)) return '220px';
    if (this.isLongColumn(column)) return '240px';
    if (this.isDateColumn(column)) return '170px';
    return '150px';
  }

  isRequired(column: PublishConfigColumn): boolean {
    return !column.nullable && column.defaultValue === null && !column.autoIncrement;
  }

  isNumberColumn(column: PublishConfigColumn): boolean {
    return ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'float', 'double', 'decimal'].includes(
      column.dataType
    );
  }

  isLongColumn(column: PublishConfigColumn): boolean {
    return ['text', 'mediumtext', 'longtext', 'json'].includes(column.dataType) ||
      column.columnType.includes('varchar(500') ||
      column.columnType.includes('varchar(1000');
  }

  isFullRowColumn(column: PublishConfigColumn): boolean {
    return column.name === 'self_declaration'
      || column.name === 'visibility'
      || this.isPublishTimeColumn(column)
      || (this.isLongColumn(column) && !this.isMaterialPathColumn(column));
  }

  isSelfDeclarationColumn(column: PublishConfigColumn): boolean {
    return column.name === 'self_declaration';
  }

  isPublishOptionColumn(column: PublishConfigColumn): boolean {
    return Object.prototype.hasOwnProperty.call(publishOptionMap, column.name);
  }

  isPublishTimeColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    return name === 'publish_time' || name === 'publishtime';
  }

  isPublishDelayColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    return name === 'publish_delay' || name === 'publishdelay';
  }

  isTimedPublishSelected(): boolean {
    const column = this.columns.find(item => this.isPublishTimeColumn(item));
    return column ? this.form.get(column.name)?.value === '定时发布' : false;
  }

  columnLabel(column: PublishConfigColumn): string {
    if (this.isClipConfigColumn(column)) return '剪辑配置';
    return this.isPublishDelayColumn(column) ? '发布延迟(小时)' : column.label;
  }

  private orderEditableColumns(columns: PublishConfigColumn[]): PublishConfigColumn[] {
    const ordered = [...columns];
    const nameIndex = ordered.findIndex(column => column.name === 'name');
    if (nameIndex > 0) {
      const [nameColumn] = ordered.splice(nameIndex, 1);
      ordered.unshift(nameColumn);
    }
    const clipConfigIndex = ordered.findIndex(column => this.isClipConfigColumn(column));
    if (clipConfigIndex !== -1) {
      const [clipConfigColumn] = ordered.splice(clipConfigIndex, 1);
      const nextNameIndex = ordered.findIndex(column => column.name === 'name');
      ordered.splice(nextNameIndex === -1 ? 0 : nextNameIndex + 1, 0, clipConfigColumn);
    }

    const selectionAuditIndex = ordered.findIndex(column => this.isSelectionAuditColumn(column));
    if (selectionAuditIndex !== -1 && selectionAuditIndex !== ordered.length - 1) {
      const [selectionAuditColumn] = ordered.splice(selectionAuditIndex, 1);
      ordered.push(selectionAuditColumn);
    }
    return ordered;
  }

  private deduplicateEditableColumns(columns: PublishConfigColumn[]): PublishConfigColumn[] {
    const seen = new Set<string>();
    return columns.filter(column => {
      const key = this.normalizeColumnAlias(column.name);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private isPublishDirColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    const text = `${column.label || ''}${column.comment || ''}`;
    return name === 'publish_dir' || name === 'publishdir' || text.includes('发布目录');
  }

  private isSelectionAuditColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    const text = `${column.label || ''}${column.comment || ''}`;
    return name === 'selection_audit' || name === 'selectionaudit' || text.includes('选品是否审核');
  }

  isClipConfigColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    const text = `${column.label || ''}${column.comment || ''}`;
    return name === 'clip_config_id'
      || name === 'clipconfigid'
      || text.includes('关联剪辑配置')
      || text.includes('剪辑配置id')
      || text.includes('剪辑配置ID');
  }

  clipConfigOptionValue(config: PublishConfigRow): number | string | null {
    const value = config['id'];
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'number' ? value : String(value);
  }

  clipConfigOptionLabel(config: PublishConfigRow): string {
    const name = config['name'] ?? config['code'] ?? config['id'];
    if (name === null || name === undefined || name === '') return '-';
    const version = config['version'];
    return version === null || version === undefined || version === ''
      ? String(name)
      : `${name} v${version}`;
  }

  publishOptions(column: PublishConfigColumn): string[] {
    return publishOptionMap[column.name] || [];
  }

  publishOptionDefault(column: PublishConfigColumn): string {
    return publishOptionDefaults[column.name] || '';
  }

  isMaterialPathColumn(column: PublishConfigColumn): boolean {
    const text = `${column.label || ''}${column.comment || ''}${column.name || ''}`;
    const name = column.name.toLowerCase();
    return text.includes('素材目录')
      || text.includes('发布目录')
      || name.includes('material_path')
      || name.includes('material_dir')
      || name.includes('publish_dir')
      || name.includes('publishdir')
      || name.includes('publish_path')
      || name.includes('source_path')
      || name.includes('source_dir');
  }

  isDateColumn(column: PublishConfigColumn): boolean {
    return ['datetime', 'timestamp', 'date', 'time'].includes(column.dataType);
  }

  isStatusColumn(column: PublishConfigColumn): boolean {
    return column.name === 'status' || column.name.endsWith('_status') || column.name === 'enabled';
  }

  isOwnerColumn(column: PublishConfigColumn): boolean {
    const name = column.name.toLowerCase();
    return name === 'user_id' || name === 'userid';
  }

  isTenantColumn(column: PublishConfigColumn): boolean {
    const text = `${column.label || ''}${column.comment || ''}`;
    const name = column.name.toLowerCase();
    return text.includes('所属租户')
      || text.includes('租户标识')
      || name === 'tenant_id'
      || name === 'tenantid';
  }

  isSelectionStrategyColumn(column: PublishConfigColumn): boolean {
    const text = `${column.label || ''}${column.comment || ''}`;
    const name = column.name.toLowerCase();
    return name === 'selection_strategy_id'
      || name === 'selectionstrategyid'
      || name === 'strategy_id'
      || text.includes('选品策略id')
      || text.includes('选品策略ID')
      || text.includes('策略id')
      || text.includes('策略ID');
  }

  isSetupField(column: PublishConfigColumn): boolean {
    return setupFieldNames.has(this.normalizeColumnAlias(column.name));
  }

  private setupFieldIndex(column: PublishConfigColumn): number {
    const name = this.normalizeColumnAlias(column.name);
    if (name === 'publishinterval') return 0;
    if (name === 'selectionaudit') return 1;
    return 99;
  }

  isYesNoColumn(column: PublishConfigColumn): boolean {
    const text = `${column.label || ''}${column.comment || ''}${column.name || ''}`;
    const name = column.name.toLowerCase();
    return text.includes('是/否')
      || text.includes('是否')
      || name.startsWith('is_')
      || name.endsWith('_enabled');
  }

  normalizeYesNoValue(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (value === 1 || value === '1' || value === true || value === 'true' || value === '是') return 1;
    if (value === 0 || value === '0' || value === false || value === 'false' || value === '否') return 0;
    return Number(value) === 1 ? 1 : 0;
  }

  normalizeNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  }

  getNumberMin(column: PublishConfigColumn): number | null {
    if (this.isPublishIntervalColumn(column) || this.isPublishDelayColumn(column)) {
      return 0;
    }
    return column.columnType.includes('unsigned') ? 0 : null;
  }

  isRemovedPublishLimitColumn(column: PublishConfigColumn): boolean {
    const name = this.normalizeColumnAlias(column.name);
    return name === 'dailymaxpublishcount' || name === 'maxdailypublish';
  }

  isRemovedCarrierColumn(column: PublishConfigColumn): boolean {
    return this.normalizeColumnAlias(column.name) === 'iscarrier';
  }

  isPublishIntervalColumn(column: PublishConfigColumn): boolean {
    const name = this.normalizeColumnAlias(column.name);
    return name === 'publishinterval';
  }

  getNumberStep(column: PublishConfigColumn): number {
    return ['float', 'double', 'decimal'].includes(column.dataType) ? 0.01 : 1;
  }

  private normalizeColumnAlias(name: string): string {
    return (name || '').replace(/_/g, '').toLowerCase();
  }
}
