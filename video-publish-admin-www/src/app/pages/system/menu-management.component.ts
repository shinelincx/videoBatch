import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { SysApiService, SysPerm } from '../../core/services/sys-api.service';
import { MenuService, MenuItem } from '../../core/services/menu.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

// 权限类型枚举
enum PermType {
  MENU = 1,
  BUTTON = 2,
  API = 3
}

// 权限类型名称映射
const PermTypeNames: Record<number, string> = {
  [PermType.MENU]: '菜单权限',
  [PermType.BUTTON]: '按钮权限',
  [PermType.API]: 'API权限'
};

@Component({
  selector: 'app-menu-management',
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
    NzSelectModule,
    NzTagModule,
    NzSpaceModule,
    NzIconModule,
    NzTabsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">菜单权限管理</h2>
        <p class="page-desc">管理系统的菜单、按钮和API权限，进入页面时自动同步路由菜单信息</p>
      </div>

      <div class="card-container">
        <!-- 权限类型标签页 -->
        <nz-tabs [(nzSelectedIndex)]="selectedTabIndex" (nzSelectedIndexChange)="onTabChange()">
          <nz-tab nzTitle="菜单权限">
            <ng-template [ngTemplateOutlet]="permTableTemplate"></ng-template>
          </nz-tab>
          <nz-tab nzTitle="按钮权限">
            <ng-template [ngTemplateOutlet]="permTableTemplate"></ng-template>
          </nz-tab>
          <nz-tab nzTitle="API权限">
            <ng-template [ngTemplateOutlet]="permTableTemplate"></ng-template>
          </nz-tab>
        </nz-tabs>

        <!-- 权限表格模板 -->
        <ng-template #permTableTemplate>
          <div class="toolbar">
            <button nz-button nzType="primary" (click)="showAddModal()">
              <nz-icon nzType="plus"></nz-icon>
              <span>新增</span>
            </button>
            <button nz-button (click)="syncFromRoute()" [nzLoading]="syncing" *ngIf="currentPermType === PermType.MENU">
              <nz-icon nzType="sync"></nz-icon>
              <span>从路由同步</span>
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
                <th>权限名称</th>
                <th>权限值</th>
                <th *ngIf="currentPermType !== PermType.MENU">父级权限</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (item of data; track item.pval) {
                <tr>
                  <td>{{ item.pname }}</td>
                  <td>
                    <nz-tag [nzColor]="getPermTypeColor(currentPermType)">{{ item.pval }}</nz-tag>
                  </td>
                  <td *ngIf="currentPermType !== PermType.MENU">{{ getParentName(item.parent) }}</td>
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
        </ng-template>
      </div>

      <!-- 新增/编辑弹窗 -->
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
              <nz-form-label nzRequired>权限名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入权限名称">
                <input nz-input formControlName="pname" placeholder="请输入权限名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>权限值</nz-form-label>
              <nz-form-control nzErrorTip="请输入权限值">
                <input nz-input formControlName="pval" placeholder="请输入权限值" [disabled]="isEditing" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item *ngIf="currentPermType !== PermType.MENU">
              <nz-form-label>父级权限</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="parent" nzPlaceHolder="请选择父级权限" nzAllowClear>
                  @for (menu of menuPerms; track menu.pval) {
                    <nz-option [nzValue]="menu.pval!" [nzLabel]="menu.pname!"></nz-option>
                  }
                </nz-select>
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

    .page-desc {
      font-size: 12px;
      color: #8c8c8c;
      margin: 4px 0 0 0;
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

    ::ng-deep .ant-tabs-content {
      padding-top: 16px;
    }
  `]
})
export class MenuManagementComponent implements OnInit {
  // 暴露枚举到模板
  PermType = PermType;
  PermTypeNames = PermTypeNames;

  data: SysPerm[] = [];
  loading = false;
  syncing = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  selectedTabIndex = 0;
  currentPermType: PermType = PermType.MENU;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增权限';
  isEditing = false;

  // 菜单权限列表（用于父级选择）
  menuPerms: SysPerm[] = [];

  form = new FormGroup({
    pname: new FormControl<string | null>('', [Validators.required]),
    pval: new FormControl<string | null>('', [Validators.required]),
    parent: new FormControl<string | null>(null)
  });

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    // 页面加载时自动同步路由菜单到后端
    this.syncFromRoute();
  }

  /**
   * 从路由同步菜单权限到后端
   */
  syncFromRoute(): void {
    this.syncing = true;
    const menus = this.menuService.getAllMenus();
    const permList: SysPerm[] = this.buildPermListFromMenus(menus);

    this.sysApi.syncMenuPerms(permList).subscribe({
      next: () => {
        this.message.success('菜单同步成功');
        this.syncing = false;
        this.loadData();
      },
      error: (err) => {
        console.error('同步菜单失败', err);
        this.message.error('同步菜单失败');
        this.syncing = false;
        this.loadData();
      }
    });
  }

  /**
   * 将菜单结构转换为权限列表
   */
  private buildPermListFromMenus(menus: MenuItem[]): SysPerm[] {
    const permList: SysPerm[] = [];

    for (const menu of menus) {
      // 添加一级菜单
      permList.push({
        pval: menu.id,
        pname: menu.name,
        ptype: PermType.MENU,
        leaf: !menu.children || menu.children.length === 0
      });

      // 添加二级菜单
      if (menu.children) {
        for (const child of menu.children) {
          permList.push({
            pval: child.path || child.id,
            pname: child.name,
            ptype: PermType.MENU,
            parent: menu.id,
            leaf: true
          });
        }
      }
    }

    return permList;
  }

  /**
   * 标签页切换
   */
  onTabChange(): void {
    this.currentPermType = this.selectedTabIndex + 1 as PermType;
    this.pageIndex = 1;
    this.loadData();
  }

  /**
   * 获取权限类型颜色
   */
  getPermTypeColor(type: PermType): string {
    const colors: Record<number, string> = {
      [PermType.MENU]: 'blue',
      [PermType.BUTTON]: 'green',
      [PermType.API]: 'orange'
    };
    return colors[type] || 'default';
  }

  /**
   * 获取父级权限名称
   */
  getParentName(parentPval?: string): string {
    if (!parentPval) return '-';
    const parent = this.menuPerms.find(p => p.pval === parentPval);
    return parent ? parent.pname! : parentPval;
  }

  /**
   * 加载数据
   */
  loadData(): void {
    this.loading = true;

    // 加载所有权限
    this.sysApi.getAllPerms().subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data && res.data.permMap) {
          const permMap = res.data.permMap;
          const perms = permMap[this.currentPermType] || [];

          // 如果是菜单权限，保存用于父级选择
          if (this.currentPermType === PermType.MENU) {
            this.menuPerms = perms;
          }

          // 分页处理
          this.total = perms.length;
          const start = (this.pageIndex - 1) * this.pageSize;
          this.data = perms.slice(start, start + this.pageSize);
        } else {
          this.data = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('加载数据失败', err);
        this.message.error('加载数据失败');
        this.loading = false;
      }
    });
  }

  /**
   * 显示新增弹窗
   */
  showAddModal(): void {
    this.modalTitle = '新增' + PermTypeNames[this.currentPermType];
    this.isEditing = false;
    this.form.reset();
    this.modalVisible = true;
  }

  /**
   * 显示编辑弹窗
   */
  showEditModal(item: SysPerm): void {
    this.modalTitle = '编辑' + PermTypeNames[this.currentPermType];
    this.isEditing = true;
    this.form.patchValue({
      pname: item.pname,
      pval: item.pval,
      parent: item.parent
    });
    this.modalVisible = true;
  }

  /**
   * 提交表单
   */
  handleOk(): void {
    if (this.form.invalid) {
      return;
    }
    this.modalLoading = true;
    const formValue = this.form.value;

    if (this.isEditing) {
      this.sysApi.updatePerm({
        pval: formValue.pval || '',
        pname: formValue.pname || '',
        ptype: this.currentPermType,
        parent: formValue.parent || undefined
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
          console.error('更新失败', err);
          this.message.error('更新失败');
          this.modalLoading = false;
        }
      });
    } else {
      this.sysApi.createPerm({
        pval: formValue.pval || '',
        pname: formValue.pname || '',
        ptype: this.currentPermType,
        parent: formValue.parent || undefined
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
          console.error('创建失败', err);
          this.message.error('创建失败');
          this.modalLoading = false;
        }
      });
    }
  }

  /**
   * 删除权限
   */
  deleteItem(item: SysPerm): void {
    if (!item.pval) return;

    this.sysApi.deletePerm(item.pval).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: (err) => {
        console.error('删除失败', err);
        this.message.error('删除失败');
      }
    });
  }
}
