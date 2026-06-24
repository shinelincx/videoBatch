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
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import type { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface AccountConfig {
  id?: number;
  code: string;
  nickname: string;
  douyinAccount?: string;
  baiyingId?: string;
  productCategoryId?: number | null;
  productCategoryName?: string;
  priority: number;
  proxyId?: number | null;
  status: number;
  userId?: string;
  avatar?: string;
  avatarUrl?: string;
  fansCount?: number;
  dailyMaxPublishCount?: number;
  remark?: string;
  createTime?: string;
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

interface ProxyConfig {
  id?: number;
  name: string;
  ip: string;
  port: number;
  protocol: string;
  status: number;
}

interface RobotRow {
  id?: number | string;
  machineName?: string;
  macAddress?: string;
}

const statusMap: Record<number, string> = { 0: '禁用', 1: '启用' };

@Component({
  selector: 'app-account-config',
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
    NzCascaderModule,
    NzInputNumberModule,
    NzAvatarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">账号管理</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button nzType="primary" (click)="showAddModal()">
            <nz-icon nzType="plus"></nz-icon>
            <span>新增账号</span>
          </button>
          <button nz-button (click)="refresh()" [nzLoading]="loading">
            <nz-icon nzType="reload"></nz-icon>
            <span>刷新</span>
          </button>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          (nzPageIndexChange)="loadData()"
          (nzPageSizeChange)="loadData()"
          [nzScroll]="{ x: '1500px' }"
        >
          <thead>
            <tr>
              <th nzWidth="72px">头像</th>
              <th nzWidth="120px">编码</th>
              <th nzWidth="140px">昵称</th>
              <th nzWidth="140px">抖音账号</th>
              <th nzWidth="120px">百应ID</th>
              <th nzWidth="220px">商品类目</th>
              <th nzWidth="90px">优先级</th>
              <th nzWidth="160px">代理</th>
              <th nzWidth="100px">粉丝数</th>
              <th nzWidth="130px">每日最大发布数</th>
              <th nzWidth="90px">状态</th>
              <th nzWidth="210px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>
                  <nz-avatar [nzSrc]="getAvatar(item)" nzIcon="user" nzSize="small"></nz-avatar>
                </td>
                <td>{{ item.code || '—' }}</td>
                <td>{{ item.nickname }}</td>
                <td>{{ item.douyinAccount || '—' }}</td>
                <td>{{ item.baiyingId || '—' }}</td>
                <td class="ellipsis-cell" [title]="getCategoryName(item)">
                  {{ getCategoryName(item) }}
                </td>
                <td>{{ item.priority }}</td>
                <td>{{ getProxyName(item.proxyId) }}</td>
                <td>{{ item.fansCount || 0 }}</td>
                <td>{{ item.dailyMaxPublishCount || 0 }}</td>
                <td>
                  <nz-tag [nzColor]="item.status === 1 ? 'green' : 'red'">
                    {{ statusMap[item.status] || '未知' }}
                  </nz-tag>
                </td>
                <td>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small" (click)="showLoginModal(item)">登录</button>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="确定删除此账号?"
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
                <nz-form-label nzRequired>编码</nz-form-label>
                <nz-form-control nzErrorTip="请输入编码">
                  <input nz-input formControlName="code" placeholder="请输入编码" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label nzRequired>昵称</nz-form-label>
                <nz-form-control nzErrorTip="请输入昵称">
                  <input nz-input formControlName="nickname" placeholder="请输入昵称" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>抖音账号</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="douyinAccount" placeholder="请输入抖音账号" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>百应ID</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="baiyingId" placeholder="请输入百应ID" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>所属用户</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="userId" placeholder="请输入所属用户" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>商品类目</nz-form-label>
                <nz-form-control>
                  <nz-cascader
                    class="category-cascader"
                    formControlName="productCategoryPath"
                    [nzOptions]="categoryCascaderOptions"
                    [nzChangeOnSelect]="true"
                    [nzShowSearch]="true"
                    nzPlaceHolder="请选择商品类目"
                  ></nz-cascader>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>代理</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="proxyId" nzAllowClear nzPlaceHolder="请选择代理">
                    @for (proxy of proxyOptions; track proxy.id) {
                      <nz-option [nzValue]="proxy.id" [nzLabel]="proxy.name + '（' + proxy.protocol + '://' + proxy.ip + ':' + proxy.port + '）'"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>优先级</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="priority" [nzMin]="1" [nzMax]="10" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>粉丝数</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="fansCount" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>每日最大发布数</nz-form-label>
                <nz-form-control>
                  <nz-input-number class="number-input" formControlName="dailyMaxPublishCount" [nzMin]="0" [nzStep]="1"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>头像URL</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="avatar" placeholder="请输入头像URL" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>状态</nz-form-label>
                <nz-form-control>
                  <nz-switch formControlName="status" [nzCheckedChildren]="'启用'" [nzUnCheckedChildren]="'禁用'"></nz-switch>
                </nz-form-control>
              </nz-form-item>
            </div>
            <nz-form-item>
              <nz-form-label>备注</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="remark" rows="3" placeholder="请输入备注"></textarea>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="loginModalVisible"
        nzTitle="选择在线客户端"
        [nzOkLoading]="loginModalLoading"
        [nzOkDisabled]="!selectedLoginRobotId"
        (nzOnOk)="handleLoginOk()"
        (nzOnCancel)="closeLoginModal()"
        nzWidth="520px"
      >
        <ng-container *nzModalContent>
          <div class="login-summary">
            账号：{{ loginAccount ? loginAccount.nickname : '-' }}
          </div>
          <nz-form-item>
            <nz-form-label nzRequired>在线客户端</nz-form-label>
            <nz-form-control>
              <nz-select
                class="login-client-select"
                [(ngModel)]="selectedLoginRobotId"
                [nzLoading]="onlineRobotsLoading"
                nzPlaceHolder="请选择在线客户端"
              >
                @for (robot of onlineRobots; track robot.id || $index) {
                  <nz-option [nzValue]="robot.id" [nzLabel]="robotLabel(robot)"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
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
    .ellipsis-cell {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .login-summary {
      margin-bottom: 12px;
      color: #595959;
    }
    .login-client-select {
      width: 100%;
    }
  `]
})
export class AccountConfigComponent implements OnInit {
  data: AccountConfig[] = [];
  categoryOptions: ProductCategory[] = [];
  categoryCascaderOptions: NzCascaderOption[] = [];
  private categoryPathMap = new Map<number, number[]>();
  private categoryNameMap = new Map<number, string>();
  proxyOptions: ProxyConfig[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增账号';
  editingId: number | null = null;
  loginModalVisible = false;
  loginModalLoading = false;
  onlineRobotsLoading = false;
  loginAccount: AccountConfig | null = null;
  selectedLoginRobotId: number | string | null = null;
  onlineRobots: RobotRow[] = [];

  statusMap = statusMap;

  form = new FormGroup({
    code: new FormControl<string | null>('', [Validators.required]),
    nickname: new FormControl<string | null>('', [Validators.required]),
    douyinAccount: new FormControl<string | null>(''),
    baiyingId: new FormControl<string | null>(''),
    userId: new FormControl<string | null>(''),
    productCategoryPath: new FormControl<number[]>([], { nonNullable: true }),
    proxyId: new FormControl<number | null>(null),
    priority: new FormControl<number>(5, { nonNullable: true }),
    fansCount: new FormControl<number>(0, { nonNullable: true }),
    dailyMaxPublishCount: new FormControl<number>(0, { nonNullable: true }),
    avatar: new FormControl<string | null>(''),
    status: new FormControl<boolean>(true, { nonNullable: true }),
    remark: new FormControl<string | null>('')
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

  loadData(): void {
    this.loading = true;
    this.sysApi.getBaseAccountList({ current: this.pageIndex, size: this.pageSize }).subscribe({
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
        this.message.error('加载账号失败');
        this.loading = false;
      }
    });
  }

  loadOptions(): void {
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
        this.categoryNameMap.clear();
        this.message.error('加载类目选项失败');
      }
    });
    this.sysApi.getAllProxyConfigs().subscribe({
      next: (res: any) => {
        this.proxyOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
      },
      error: () => this.message.error('加载代理选项失败')
    });
  }

  getCategoryName(item: AccountConfig): string {
    if (item.productCategoryName) return item.productCategoryName;
    const id = Number(item.productCategoryId || 0);
    if (!Number.isFinite(id) || id <= 0) return '—';
    return this.categoryNameMap.get(id) || this.categoryOptions.find(category => category.id === id)?.name || `#${id}`;
  }

  getProxyName(proxyId?: number | null): string {
    if (!proxyId) return '—';
    const proxy = this.proxyOptions.find(item => item.id === proxyId);
    return proxy ? proxy.name : `#${proxyId}`;
  }

  getAvatar(item: AccountConfig): string {
    return item.avatar || item.avatarUrl || '';
  }

  showAddModal(): void {
    this.modalTitle = '新增账号';
    this.editingId = null;
    this.form.reset({
      code: '',
      nickname: '',
      douyinAccount: '',
      baiyingId: '',
      userId: '',
      productCategoryPath: [],
      proxyId: null,
      priority: 5,
      fansCount: 0,
      dailyMaxPublishCount: 0,
      avatar: '',
      status: true,
      remark: ''
    });
    this.modalVisible = true;
  }

  showEditModal(item: AccountConfig): void {
    this.modalTitle = '编辑账号';
    this.editingId = item.id || null;
    this.form.patchValue({
      code: item.code || '',
      nickname: item.nickname,
      douyinAccount: item.douyinAccount || '',
      baiyingId: item.baiyingId || '',
      userId: item.userId || '',
      productCategoryPath: this.categoryIdToPath(item.productCategoryId),
      proxyId: item.proxyId || null,
      priority: item.priority || 5,
      fansCount: item.fansCount || 0,
      dailyMaxPublishCount: item.dailyMaxPublishCount || 0,
      avatar: item.avatar || item.avatarUrl || '',
      status: item.status === 1,
      remark: item.remark || ''
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('请先完善必填信息');
      return;
    }
    const v = this.form.getRawValue();
    this.modalLoading = true;
    const productCategoryId = this.categoryPathToCategoryId(v.productCategoryPath);
    const payload: AccountConfig = {
      code: (v.code || '').trim(),
      nickname: v.nickname || '',
      douyinAccount: v.douyinAccount || '',
      baiyingId: v.baiyingId || '',
      userId: v.userId || '',
      productCategoryId,
      proxyId: v.proxyId || null,
      priority: v.priority || 5,
      fansCount: v.fansCount || 0,
      dailyMaxPublishCount: v.dailyMaxPublishCount || 0,
      avatar: v.avatar || '',
      status: v.status ? 1 : 0,
      remark: v.remark || ''
    };

    const api$ = this.editingId
      ? this.sysApi.updateBaseAccount({ ...payload, id: this.editingId })
      : this.sysApi.createBaseAccount(payload);

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

  deleteItem(item: AccountConfig): void {
    if (!item.id) return;
    this.sysApi.deleteBaseAccount(item.id).subscribe({
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

  showLoginModal(item: AccountConfig): void {
    this.loginAccount = item;
    this.selectedLoginRobotId = null;
    this.onlineRobots = [];
    this.loginModalVisible = true;
    this.loadOnlineRobots();
  }

  loadOnlineRobots(): void {
    this.onlineRobotsLoading = true;
    this.sysApi.getOnlineRobots().subscribe({
      next: (res: any) => {
        this.onlineRobots = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        if (this.onlineRobots.length === 0 && !isApiSessionExpiredResponse(res)) {
          this.message.warning('当前没有在线客户端');
        }
        this.onlineRobotsLoading = false;
      },
      error: () => {
        this.message.error('加载在线客户端失败');
        this.onlineRobotsLoading = false;
      }
    });
  }

  handleLoginOk(): void {
    const accountId = this.loginAccount?.id;
    if (!accountId) {
      this.message.warning('请选择账号');
      return;
    }
    if (this.selectedLoginRobotId === null) {
      this.message.warning('请选择在线客户端');
      return;
    }
    this.loginModalLoading = true;
    this.sysApi.loginBaseAccount({
      accountId,
      robotId: this.selectedLoginRobotId
    }).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('登录需求已推送');
          this.closeLoginModal();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '登录需求推送失败');
        }
        this.loginModalLoading = false;
      },
      error: () => {
        this.message.error('登录需求推送失败');
        this.loginModalLoading = false;
      }
    });
  }

  closeLoginModal(): void {
    this.loginModalVisible = false;
    this.loginAccount = null;
    this.selectedLoginRobotId = null;
    this.onlineRobots = [];
  }

  robotLabel(robot: RobotRow): string {
    const machineName = this.displayText(robot.machineName);
    const macAddress = this.displayText(robot.macAddress);
    if (machineName !== '—' && macAddress !== '—') return `${machineName}（${macAddress}）`;
    if (machineName !== '—') return machineName;
    if (macAddress !== '—') return macAddress;
    return `客户端#${robot.id || ''}`;
  }

  displayText(value: unknown): string {
    const text = String(value ?? '').trim();
    return text || '—';
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
    this.categoryNameMap.clear();
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
      this.categoryNameMap.set(item.id, item.name);
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
    return this.toCascaderOptions(roots, []);
  }

  private toCascaderOptions(nodes: ProductCategory[], parentPath: number[]): NzCascaderOption[] {
    return nodes
      .filter((node): node is ProductCategory & { id: number } => !!node.id)
      .map(node => {
        const path = [...parentPath, node.id];
        const children = node.children || [];
        this.categoryPathMap.set(node.id, path);
        return {
          label: node.name,
          value: node.id,
          isLeaf: children.length === 0,
          children: children.length ? this.toCascaderOptions(children, path) : undefined
        };
      });
  }

  private sortCategoryNodes(nodes: ProductCategory[]): void {
    nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));
    nodes.forEach(node => this.sortCategoryNodes(node.children || []));
  }

  private categoryIdToPath(productCategoryId?: number | null): number[] {
    const id = Number(productCategoryId || 0);
    if (!Number.isFinite(id) || id <= 0) return [];
    return this.categoryPathMap.get(id) || [];
  }

  private categoryPathToCategoryId(path?: number[] | null): number | null {
    if (!path || path.length === 0) return null;
    const id = Number(path[path.length - 1]);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

}
