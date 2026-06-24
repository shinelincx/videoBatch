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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface ClipConfig {
  id?: number;
  code: string;
  name: string;
  version: number;
  clipMode: string;
  imgVideoPosition?: string | null;
  frameExtraction: boolean;
  cropping: boolean;
  blur: boolean;
  shake: boolean;
  watermark: boolean;
  brightness: boolean;
  contrast: boolean;
  saturation: boolean;
  colorBalance: boolean;
  gamma: boolean;
  vintageBw: boolean;
  subtitles: boolean;
  danmaku: boolean;
  sticker: boolean;
  prependEnabled: boolean;
  appendEnabled: boolean;
  backgroundMusicEnabled: boolean;
  speedAdjustmentEnabled: boolean;
  pitchEnabled: boolean;
  loopCount: number;
  defaultDurationPerImage: number;
  status: number;
  remark?: string | null;
  createTime?: string;
}

interface ClipConfigSearchParams {
  code?: string;
  name?: string;
  clipMode?: string;
  status?: number;
}

type SwitchFieldKey =
  | 'frameExtraction'
  | 'cropping'
  | 'blur'
  | 'shake'
  | 'watermark'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'colorBalance'
  | 'gamma'
  | 'vintageBw'
  | 'subtitles'
  | 'danmaku'
  | 'sticker'
  | 'prependEnabled'
  | 'appendEnabled'
  | 'backgroundMusicEnabled'
  | 'speedAdjustmentEnabled'
  | 'pitchEnabled';

interface SwitchField {
  key: SwitchFieldKey;
  label: string;
}

interface SwitchFieldGroup {
  title: string;
  fields: SwitchField[];
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };
const modeMap: Record<string, string> = {
  'image-to-video': '图片转视频',
  'reference-video': '参考视频'
};

const switchFieldGroups: SwitchFieldGroup[] = [
  {
    title: '视频项',
    fields: [
      { key: 'frameExtraction', label: '抽帧' },
      { key: 'cropping', label: '裁剪' },
      { key: 'blur', label: '模糊' },
      { key: 'shake', label: '抖动' },
      { key: 'watermark', label: '水印' },
      { key: 'brightness', label: '亮度' },
      { key: 'contrast', label: '对比度' },
      { key: 'saturation', label: '饱和度' },
      { key: 'colorBalance', label: '色彩平衡' },
      { key: 'gamma', label: '伽马' },
      { key: 'vintageBw', label: '复古黑白' }
    ]
  },
  {
    title: '文本项',
    fields: [
      { key: 'subtitles', label: '字幕' },
      { key: 'danmaku', label: '弹幕' },
      { key: 'sticker', label: '贴纸' }
    ]
  },
  {
    title: '片头片尾',
    fields: [
      { key: 'prependEnabled', label: '片头' },
      { key: 'appendEnabled', label: '片尾' }
    ]
  },
  {
    title: '音频',
    fields: [
      { key: 'backgroundMusicEnabled', label: '背景音乐' },
      { key: 'speedAdjustmentEnabled', label: '速度调整' },
      { key: 'pitchEnabled', label: '音调调整' }
    ]
  }
];

@Component({
  selector: 'app-clip-config',
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
    NzSelectModule,
    NzInputNumberModule,
    NzPopconfirmModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">剪辑配置</h2>
      </div>

      <div class="card-container">
        <form class="search-form" [formGroup]="searchForm" (ngSubmit)="search()">
          <div class="search-grid">
            <div class="search-field">
              <span>代码</span>
              <input nz-input formControlName="code" placeholder="配置代码" />
            </div>
            <div class="search-field">
              <span>名称</span>
              <input nz-input formControlName="name" placeholder="配置名称" />
            </div>
            <div class="search-field">
              <span>模式</span>
              <nz-select formControlName="clipMode" nzPlaceHolder="全部模式" nzAllowClear>
                <nz-option nzValue="image-to-video" nzLabel="图片转视频"></nz-option>
                <nz-option nzValue="reference-video" nzLabel="参考视频"></nz-option>
              </nz-select>
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
            <button nz-button nzType="primary" type="button" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增配置</span>
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
          [nzScroll]="{ x: '1240px' }"
        >
          <thead>
            <tr>
              <th nzWidth="150px">代码</th>
              <th nzWidth="180px">名称</th>
              <th nzWidth="120px">模式</th>
              <th nzWidth="80px">版本</th>
              <th nzWidth="100px">循环次数</th>
              <th nzWidth="130px">图片时长</th>
              <th nzWidth="90px">状态</th>
              <th nzWidth="170px">创建时间</th>
              <th nzWidth="140px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td class="ellipsis-cell" [title]="item.code">{{ item.code }}</td>
                <td class="ellipsis-cell" [title]="item.name || item.code || ''">{{ item.name || item.code || '-' }}</td>
                <td>{{ modeMap[item.clipMode] || item.clipMode }}</td>
                <td>{{ item.version }}</td>
                <td>{{ item.loopCount }}</td>
                <td>{{ item.defaultDurationPerImage }}</td>
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
        nzWidth="920px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <div class="form-grid">
              <nz-form-item>
                <nz-form-label nzRequired>代码</nz-form-label>
                <nz-form-control nzErrorTip="请输入配置代码">
                  <input nz-input formControlName="code" placeholder="cfg-img-v2" maxlength="64" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>名称</nz-form-label>
                <nz-form-control nzErrorTip="请输入配置名称">
                  <input nz-input formControlName="name" placeholder="请输入配置名称" maxlength="100" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>版本</nz-form-label>
                <nz-form-control nzErrorTip="请输入版本">
                  <nz-input-number class="full-width" formControlName="version" [nzMin]="1" [nzStep]="1" [nzDisabled]="true"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>模式</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="clipMode">
                    <nz-option nzValue="image-to-video" nzLabel="图片转视频"></nz-option>
                    <nz-option nzValue="reference-video" nzLabel="参考视频"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>图片视频位置</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="imgVideoPosition" nzAllowClear>
                    <nz-option nzValue="before" nzLabel="before"></nz-option>
                    <nz-option nzValue="after" nzLabel="after"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
                </nz-form-control>
              </nz-form-item>
            </div>

            @for (group of switchFieldGroups; track group.title) {
              <div class="form-section">
                <h3>{{ group.title }}</h3>
                <div class="switch-grid">
                  @for (field of group.fields; track field.key) {
                    <div class="switch-row">
                      <span class="switch-title">{{ field.label }}</span>
                      <nz-switch [formControlName]="field.key"></nz-switch>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="form-section">
              <h3>次数与时长</h3>
              <div class="form-grid compact-grid">
                <nz-form-item>
                  <nz-form-label nzRequired>循环次数</nz-form-label>
                  <nz-form-control>
                    <nz-input-number class="full-width" formControlName="loopCount" [nzMin]="1" [nzStep]="1"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
                <nz-form-item>
                  <nz-form-label nzRequired>单张图片默认时长</nz-form-label>
                  <nz-form-control>
                    <nz-input-number class="full-width" formControlName="defaultDurationPerImage" [nzMin]="0.1" [nzStep]="0.5"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
                <nz-form-item class="wide-field">
                  <nz-form-label>备注</nz-form-label>
                  <nz-form-control>
                    <textarea nz-input formControlName="remark" rows="2" maxlength="500"></textarea>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>
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
    .search-grid,
    .toolbar,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .search-grid {
      flex-wrap: wrap;
      align-items: end;
    }
    .search-field {
      display: flex;
      flex: 1 1 180px;
      min-width: 0;
      flex-direction: column;
      gap: 6px;
      color: #595959;
      font-size: 13px;
    }
    .search-field input,
    .search-field nz-select {
      width: 100%;
    }
    .search-actions {
      display: flex;
      gap: 8px;
    }
    .toolbar {
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ellipsis-cell {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 16px;
      row-gap: 2px;
    }
    .compact-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wide-field {
      grid-column: 1 / -1;
    }
    .form-section {
      padding-top: 14px;
      margin-top: 4px;
      border-top: 1px solid #f0f0f0;
    }
    .form-section h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 500;
      color: #262626;
    }
    .switch-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px 16px;
    }
    .switch-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 32px;
      gap: 10px;
      color: #595959;
    }
    .switch-title {
      flex: 0 0 auto;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .full-width {
      width: 100%;
    }
    @media (max-width: 760px) {
      .form-grid,
      .compact-grid,
      .switch-grid {
        grid-template-columns: 1fr;
      }
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
export class ClipConfigComponent implements OnInit {
  data: ClipConfig[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '编辑配置';
  editingId: number | null = null;
  statusMap = statusMap;
  modeMap = modeMap;
  switchFieldGroups = switchFieldGroups;

  searchForm = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true }),
    clipMode: new FormControl<string | null>(null),
    status: new FormControl<number | null>(null)
  });

  form = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    version: new FormControl<number>(2, { nonNullable: true, validators: [Validators.required] }),
    clipMode: new FormControl<string>('image-to-video', { nonNullable: true, validators: [Validators.required] }),
    imgVideoPosition: new FormControl<string | null>(null),
    frameExtraction: new FormControl<boolean>(true, { nonNullable: true }),
    cropping: new FormControl<boolean>(true, { nonNullable: true }),
    blur: new FormControl<boolean>(true, { nonNullable: true }),
    shake: new FormControl<boolean>(true, { nonNullable: true }),
    watermark: new FormControl<boolean>(true, { nonNullable: true }),
    brightness: new FormControl<boolean>(true, { nonNullable: true }),
    contrast: new FormControl<boolean>(true, { nonNullable: true }),
    saturation: new FormControl<boolean>(true, { nonNullable: true }),
    colorBalance: new FormControl<boolean>(false, { nonNullable: true }),
    gamma: new FormControl<boolean>(false, { nonNullable: true }),
    vintageBw: new FormControl<boolean>(false, { nonNullable: true }),
    subtitles: new FormControl<boolean>(false, { nonNullable: true }),
    danmaku: new FormControl<boolean>(false, { nonNullable: true }),
    sticker: new FormControl<boolean>(true, { nonNullable: true }),
    prependEnabled: new FormControl<boolean>(false, { nonNullable: true }),
    appendEnabled: new FormControl<boolean>(false, { nonNullable: true }),
    backgroundMusicEnabled: new FormControl<boolean>(true, { nonNullable: true }),
    speedAdjustmentEnabled: new FormControl<boolean>(false, { nonNullable: true }),
    pitchEnabled: new FormControl<boolean>(true, { nonNullable: true }),
    loopCount: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required] }),
    defaultDurationPerImage: new FormControl<number>(3, { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    remark: new FormControl<string>('', { nonNullable: true })
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
    this.searchForm.reset({ code: '', name: '', clipMode: null, status: null });
    this.search();
  }

  loadData(): void {
    this.loading = true;
    const params = this.buildSearchParams();
    const request: { current: number; size: number; params?: ClipConfigSearchParams } = {
      current: this.pageIndex,
      size: this.pageSize
    };
    if (Object.keys(params).length > 0) {
      request.params = params;
    }
    this.sysApi.getClipConfigList(request).subscribe({
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
        this.message.error('加载剪辑配置失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增配置';
    this.editingId = null;
    this.form.reset({
      code: '',
      name: '',
      version: 1,
      clipMode: 'image-to-video',
      imgVideoPosition: null,
      frameExtraction: true,
      cropping: true,
      blur: true,
      shake: true,
      watermark: true,
      brightness: true,
      contrast: true,
      saturation: true,
      colorBalance: false,
      gamma: false,
      vintageBw: false,
      subtitles: false,
      danmaku: false,
      sticker: true,
      prependEnabled: false,
      appendEnabled: false,
      backgroundMusicEnabled: true,
      speedAdjustmentEnabled: false,
      pitchEnabled: true,
      loopCount: 1,
      defaultDurationPerImage: 3,
      status: true,
      remark: ''
    });
    this.modalVisible = true;
  }

  showEditModal(item: ClipConfig): void {
    this.modalTitle = '编辑配置';
    this.editingId = item.id || null;
    this.form.reset({
      code: item.code || '',
      name: item.name || item.code || '',
      version: item.version || 1,
      clipMode: item.clipMode || 'image-to-video',
      imgVideoPosition: item.imgVideoPosition || null,
      frameExtraction: item.frameExtraction === true,
      cropping: item.cropping === true,
      blur: item.blur === true,
      shake: item.shake === true,
      watermark: item.watermark === true,
      brightness: item.brightness === true,
      contrast: item.contrast === true,
      saturation: item.saturation === true,
      colorBalance: item.colorBalance === true,
      gamma: item.gamma === true,
      vintageBw: item.vintageBw === true,
      subtitles: item.subtitles === true,
      danmaku: item.danmaku === true,
      sticker: item.sticker === true,
      prependEnabled: item.prependEnabled === true,
      appendEnabled: item.appendEnabled === true,
      backgroundMusicEnabled: item.backgroundMusicEnabled === true,
      speedAdjustmentEnabled: item.speedAdjustmentEnabled === true,
      pitchEnabled: item.pitchEnabled === true,
      loopCount: item.loopCount || 1,
      defaultDurationPerImage: item.defaultDurationPerImage || 3,
      status: item.status === 1,
      remark: item.remark || ''
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
    const payload = this.buildPayload();
    const api$ = this.editingId
      ? this.sysApi.updateClipConfig({ ...payload, id: this.editingId })
      : this.sysApi.createClipConfig(payload);

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

  deleteItem(item: ClipConfig): void {
    if (!item.id) return;
    this.sysApi.deleteClipConfig(item.id).subscribe({
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

  private buildPayload(): ClipConfig {
    const v = this.form.getRawValue();
    return {
      code: v.code.trim(),
      name: v.name.trim(),
      version: v.version,
      clipMode: v.clipMode,
      imgVideoPosition: v.imgVideoPosition || null,
      frameExtraction: v.frameExtraction,
      cropping: v.cropping,
      blur: v.blur,
      shake: v.shake,
      watermark: v.watermark,
      brightness: v.brightness,
      contrast: v.contrast,
      saturation: v.saturation,
      colorBalance: v.colorBalance,
      gamma: v.gamma,
      vintageBw: v.vintageBw,
      subtitles: v.subtitles,
      danmaku: v.danmaku,
      sticker: v.sticker,
      prependEnabled: v.prependEnabled,
      appendEnabled: v.appendEnabled,
      backgroundMusicEnabled: v.backgroundMusicEnabled,
      speedAdjustmentEnabled: v.speedAdjustmentEnabled,
      pitchEnabled: v.pitchEnabled,
      loopCount: v.loopCount,
      defaultDurationPerImage: v.defaultDurationPerImage,
      status: v.status ? 1 : 0,
      remark: v.remark || ''
    };
  }

  private buildSearchParams(): ClipConfigSearchParams {
    const value = this.searchForm.value;
    const params: ClipConfigSearchParams = {};
    const code = (value.code || '').trim();
    if (code) params.code = code;
    const name = (value.name || '').trim();
    if (name) params.name = name;
    if (value.clipMode) params.clipMode = value.clipMode;
    if (value.status !== null && value.status !== undefined) params.status = value.status;
    return params;
  }

}
