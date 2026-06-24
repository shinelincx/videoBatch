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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SysApiService, SysRole, SysPerm } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

// 权限类型
const PERM_TYPE = { MENU: 1, BUTTON: 2, API: 3 };

@Component({
  selector: 'app-role-management',
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
    NzTabsModule,
    NzCheckboxModule,
    NzSpinModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">角色管理</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button nzType="primary" (click)="showAddModal()">
            <nz-icon nzType="plus"></nz-icon>
            <span>新增</span>
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
              <th>角色名称</th>
              <th>角色值</th>
              <th>角色描述</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.rid) {
              <tr>
                <td>{{ item.rname }}</td>
                <td><nz-tag nzColor="blue">{{ item.rval }}</nz-tag></td>
                <td>{{ item.rdesc }}</td>
                <td>{{ item.created | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small" (click)="showPermModal(item)">分配权限</button>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteItem(item)">删除</button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>

      <!-- 新增/编辑角色弹窗 -->
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
              <nz-form-label nzRequired>角色名称</nz-form-label>
              <nz-form-control nzErrorTip="请输入角色名称">
                <input nz-input formControlName="rname" placeholder="请输入角色名称" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>角色值</nz-form-label>
              <nz-form-control nzErrorTip="请输入角色值">
                <input nz-input formControlName="rval" placeholder="请输入角色值" [disabled]="!!editingId" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>角色描述</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="rdesc" placeholder="请输入角色描述" />
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>

      <!-- 分配权限弹窗 -->
      <nz-modal
        [(nzVisible)]="permModalVisible"
        nzTitle="分配权限"
        [nzOkLoading]="permModalLoading"
        (nzOnOk)="handlePermOk()"
        (nzOnCancel)="permModalVisible = false"
        nzWidth="720px"
      >
        <ng-container *nzModalContent>
          <p style="margin-bottom: 12px; color: #8c8c8c;">
            当前角色：<strong>{{ currentRole?.rname }}</strong>
          </p>
          <nz-spin [nzSpinning]="permLoading">
            <nz-tabs [(nzSelectedIndex)]="permTabIndex">
              <nz-tab nzTitle="菜单权限">
                <div class="perm-check-list">
                  @for (perm of menuPerms; track perm.pval) {
                    <label nz-checkbox
                      [(nzChecked)]="perm._checked"
                      [nzIndeterminate]="perm._indeterminate"
                      (nzCheckedChange)="onMenuParentChange(perm)">
                      {{ perm.pname }}
                    </label>
                    @if (perm._children && perm._children.length > 0) {
                      <div class="perm-children">
                        @for (child of perm._children; track child.pval) {
                          <label nz-checkbox
                            [(nzChecked)]="child._checked"
                            (nzCheckedChange)="onMenuChildChange(perm)">
                            {{ child.pname }}
                          </label>
                        }
                      </div>
                    }
                  }
                </div>
              </nz-tab>
              <nz-tab nzTitle="按钮权限">
                <div class="perm-check-list">
                  @for (group of buttonPermGroups; track group.parent) {
                    <div class="perm-group">
                      <div class="perm-group-title">{{ group.parentName }}</div>
                      <div class="perm-children">
                        @for (perm of group.perms; track perm.pval) {
                          <label nz-checkbox [(nzChecked)]="perm._checked">
                            {{ perm.pname }}
                          </label>
                        }
                      </div>
                    </div>
                  }
                  @if (buttonPermGroups.length === 0) {
                    <p nz-typography nzType="secondary">暂无按钮权限数据</p>
                  }
                </div>
              </nz-tab>
              <nz-tab nzTitle="API权限">
                <div class="perm-check-list">
                  @for (perm of apiPerms; track perm.pval) {
                    <label nz-checkbox [(nzChecked)]="perm._checked">
                      {{ perm.pname }}
                    </label>
                  }
                  @if (apiPerms.length === 0) {
                    <p nz-typography nzType="secondary">暂无API权限数据</p>
                  }
                </div>
              </nz-tab>
            </nz-tabs>
          </nz-spin>
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
      gap: 12px;
      margin-bottom: 16px;
    }
    .perm-check-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }
    .perm-children {
      padding-left: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .perm-group {
      margin-bottom: 12px;
    }
    .perm-group-title {
      font-weight: 500;
      color: #262626;
      margin-bottom: 6px;
      padding-left: 4px;
    }
  `]
})
export class RoleManagementComponent implements OnInit {
  data: SysRole[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  // 角色CRUD弹窗
  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增角色';
  editingId: string | null = null;

  form = new FormGroup({
    rname: new FormControl<string | null>('', [Validators.required]),
    rval: new FormControl<string | null>('', [Validators.required]),
    rdesc: new FormControl<string | null>('')
  });

  // 权限分配弹窗
  permModalVisible = false;
  permModalLoading = false;
  permLoading = false;
  permTabIndex = 0;
  currentRole: SysRole | null = null;

  // 权限数据（带选中状态）
  menuPerms: any[] = [];
  buttonPermGroups: any[] = [];
  apiPerms: any[] = [];

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ==================== 角色CRUD ====================

  loadData(): void {
    this.loading = true;
    this.sysApi.getRoleList({
      rname: '',
      current: this.pageIndex,
      size: this.pageSize
    }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data && res.data.page) {
          this.data = res.data.page.records || [];
          this.total = res.data.page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: () => {
        this.message.error('加载数据失败');
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增角色';
    this.editingId = null;
    this.form.reset();
    this.modalVisible = true;
  }

  showEditModal(item: SysRole): void {
    this.modalTitle = '编辑角色';
    this.editingId = item.rid || null;
    this.form.patchValue({
      rname: item.rname,
      rval: item.rval,
      rdesc: item.rdesc
    });
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) return;
    this.modalLoading = true;
    const v = this.form.value;

    if (this.editingId) {
      this.sysApi.updateRole({
        rid: this.editingId,
        rname: v.rname || '',
        rval: v.rval || '',
        rdesc: v.rdesc || ''
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
        error: () => { this.message.error('更新失败'); this.modalLoading = false; }
      });
    } else {
      this.sysApi.createRole({
        rname: v.rname || '',
        rval: v.rval || '',
        rdesc: v.rdesc || ''
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
        error: () => { this.message.error('创建失败'); this.modalLoading = false; }
      });
    }
  }

  deleteItem(item: SysRole): void {
    if (!item.rid) return;
    this.sysApi.deleteRole(item.rid).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => { this.message.error('删除失败'); }
    });
  }

  // ==================== 权限分配 ====================

  showPermModal(item: SysRole): void {
    this.currentRole = item;
    this.permModalVisible = true;
    this.permTabIndex = 0;
    this.loadPermData(item.rid!);
  }

  private loadPermData(rid: string): void {
    this.permLoading = true;

    // 并行加载：全部权限 + 角色已有权限
    this.sysApi.getAllPerms().subscribe({
      next: (allRes: any) => {
        if (isApiSessionExpiredResponse(allRes)) {
          this.permLoading = false;
          return;
        }
        const permMap = allRes.data?.permMap || {};
        const btnPermMap = allRes.data?.btnPermMap || {};

        // 构建菜单权限树
        const allMenuPerms = permMap[PERM_TYPE.MENU] || [];
        this.menuPerms = this.buildMenuPermTree(allMenuPerms);

        // 构建按钮权限分组
        this.buttonPermGroups = this.buildButtonPermGroups(btnPermMap, allMenuPerms);

        // 构建API权限列表
        this.apiPerms = (permMap[PERM_TYPE.API] || []).map((p: SysPerm) => ({
          ...p,
          _checked: false
        }));

        // 加载角色已有权限并勾选
        this.sysApi.getRolePerms(rid).subscribe({
          next: (roleRes: any) => {
            if (isApiSessionExpiredResponse(roleRes)) {
              this.permLoading = false;
              return;
            }
            const rd = roleRes.data || {};
            this.setChecked(this.menuPerms, rd.menuPvals || [], true);
            this.setCheckedFlat(this.buttonPermGroups, rd.btnPvals || []);
            this.setCheckedFlat(this.apiPerms, rd.apiPvals || []);
            this.permLoading = false;
          },
          error: () => {
            this.message.error('加载角色权限失败');
            this.permLoading = false;
          }
        });
      },
      error: () => {
        this.message.error('加载权限数据失败');
        this.permLoading = false;
      }
    });
  }

  /**
   * 构建菜单权限树（一级菜单 -> 二级菜单）
   */
  private buildMenuPermTree(perms: SysPerm[]): any[] {
    const parentPerms = perms.filter(p => !p.parent);
    return parentPerms.map(parent => {
      const children = perms
        .filter(p => p.parent === parent.pval)
        .map(c => ({ ...c, _checked: false }));
      return {
        ...parent,
        _checked: false,
        _indeterminate: false,
        _children: children
      };
    });
  }

  /**
   * 构建按钮权限分组（按父级菜单分组）
   */
  private buildButtonPermGroups(btnPermMap: Record<string, SysPerm[]>, menuPerms: SysPerm[]): any[] {
    const groups: any[] = [];
    // 找到所有作为父级的菜单权限名称映射
    const menuNameMap: Record<string, string> = {};
    menuPerms.forEach(p => { menuNameMap[p.pval!] = p.pname!; });

    for (const [parentPval, perms] of Object.entries(btnPermMap)) {
      groups.push({
        parent: parentPval,
        parentName: menuNameMap[parentPval] || parentPval,
        perms: perms.map(p => ({ ...p, _checked: false }))
      });
    }
    return groups;
  }

  /**
   * 勾选菜单权限树
   */
  private setChecked(menuTree: any[], pvals: string[], deep: boolean): void {
    for (const node of menuTree) {
      const childMatch = deep && node._children
        ? node._children.some((c: any) => pvals.includes(c.pval))
        : false;
      node._checked = pvals.includes(node.pval) || childMatch;
      node._indeterminate = false;
      if (deep && node._children) {
        for (const child of node._children) {
          child._checked = pvals.includes(child.pval);
        }
      }
    }
  }

  /**
   * 勾选扁平列表
   */
  private setCheckedFlat(groups: any[], pvals: string[]): void {
    for (const group of groups) {
      if (group.perms) {
        for (const perm of group.perms) {
          perm._checked = pvals.includes(perm.pval);
        }
      }
      if (Array.isArray(group)) {
        for (const perm of group) {
          perm._checked = pvals.includes(perm.pval);
        }
      }
    }
  }

  /**
   * 菜单父级 checkbox 变化
   */
  onMenuParentChange(parent: any): void {
    if (!parent._children) return;
    for (const child of parent._children) {
      child._checked = parent._checked;
    }
    parent._indeterminate = false;
  }

  /**
   * 菜单子级 checkbox 变化
   */
  onMenuChildChange(parent: any): void {
    const checkedCount = parent._children.filter((c: any) => c._checked).length;
    parent._checked = checkedCount === parent._children.length;
    parent._indeterminate = checkedCount > 0 && checkedCount < parent._children.length;
  }

  /**
   * 保存权限分配
   */
  handlePermOk(): void {
    if (!this.currentRole?.rid) return;
    this.permModalLoading = true;
    const rid = this.currentRole.rid;

    // 收集选中的权限值
    const menuPvals = this.collectMenuPvals();
    const btnPvals = this.collectFlatPvals(this.buttonPermGroups);
    const apiPvals = this.apiPerms.filter(p => p._checked).map(p => p.pval!);

    // 按类型分别保存
    const calls = [
      this.sysApi.updateRolePerm({ rid, ptype: PERM_TYPE.MENU, pvals: menuPvals }),
      this.sysApi.updateRolePerm({ rid, ptype: PERM_TYPE.BUTTON, pvals: btnPvals }),
      this.sysApi.updateRolePerm({ rid, ptype: PERM_TYPE.API, pvals: apiPvals })
    ];

    let completed = 0;
    let hasError = false;

    for (const call of calls) {
      call.subscribe({
        next: () => {
          completed++;
          if (completed === calls.length) {
            this.permModalLoading = false;
            if (!hasError) {
              this.message.success('权限分配成功');
              this.permModalVisible = false;
            }
          }
        },
        error: () => {
          completed++;
          hasError = true;
          if (completed === calls.length) {
            this.permModalLoading = false;
            this.message.error('权限分配失败');
          }
        }
      });
    }
  }

  /**
   * 收集菜单权限选中的值（只取叶子节点）
   */
  private collectMenuPvals(): string[] {
    const pvals: string[] = [];
    for (const parent of this.menuPerms) {
      if (parent._children && parent._children.length > 0) {
        for (const child of parent._children) {
          if (child._checked) pvals.push(child.pval!);
        }
      } else if (parent._checked) {
        pvals.push(parent.pval!);
      }
    }
    return pvals;
  }

  /**
   * 收集按钮/API权限选中的值
   */
  private collectFlatPvals(groups: any[]): string[] {
    const pvals: string[] = [];
    for (const group of groups) {
      const list = group.perms || group;
      for (const perm of list) {
        if (perm._checked) pvals.push(perm.pval!);
      }
    }
    return pvals;
  }
}
