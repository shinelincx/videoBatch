import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // 全量菜单（静态定义）
  private allMenus: MenuItem[] = [
    {
      id: 'system',
      name: '系统管理',
      icon: 'setting',
      children: [
        { id: 'user', name: '用户管理', path: '/system/user', icon: 'user' },
        { id: 'role', name: '角色管理', path: '/system/role', icon: 'team' },
        { id: 'menu', name: '菜单权限管理', path: '/system/menu', icon: 'menu' },
        { id: 'tenant', name: '租户管理', path: '/system/tenant', icon: 'bank' }
      ]
    },
    {
      id: 'base-config',
      name: '基础配置',
      icon: 'setting',
      children: [
        { id: 'product-category', name: '商品类目', path: '/base-config/category', icon: 'appstore' },
        { id: 'base-account', name: '账号管理', path: '/base-config/account', icon: 'contacts' },
        { id: 'proxy-config', name: '代理配置', path: '/base-config/proxy', icon: 'global' }
      ]
    },
    {
      id: 'client',
      name: '客户端',
      icon: 'desktop',
      children: [
        { id: 'client-monitor', name: '客户端监控', path: '/client/monitor', icon: 'monitor' }
      ]
    },
    {
      id: 'selection',
      name: '选品管理',
      icon: 'shopping',
      children: [
        { id: 'selection-record', name: '选品记录', path: '/selection/record', icon: 'file-text' }
      ]
    },
    {
      id: 'clipping',
      name: '剪辑管理',
      icon: 'scissor',
      children: [
        { id: 'clip-config', name: '剪辑配置', path: '/clipping/config', icon: 'control' },
        { id: 'clip-record', name: '剪辑记录', path: '/clipping/record', icon: 'file-text' }
      ]
    },
    {
      id: 'publish',
      name: '发布管理',
      icon: 'send',
      children: [
        { id: 'publish-config', name: '发布配置', path: '/publish/config', icon: 'rocket' },
        { id: 'account', name: '发布账号', path: '/publish/account', icon: 'contacts' },
        { id: 'publish-record', name: '发布记录', path: '/publish/record', icon: 'history' }
      ]
    }
  ];

  // 当前用户可见的菜单（经过权限过滤）
  private menusSubject = new BehaviorSubject<MenuItem[]>(this.allMenus);
  public menus$ = this.menusSubject.asObservable();

  private collapsedSubject = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsedSubject.asObservable();

  /** 获取全量菜单（用于菜单同步等场景） */
  getAllMenus(): MenuItem[] {
    return this.allMenus;
  }

  /** 获取当前用户可见菜单 */
  getMenus(): MenuItem[] {
    return this.menusSubject.value;
  }

  /**
   * 根据用户权限过滤菜单
   * @param perms 用户拥有的权限列表（后端返回的是 AuthVo 对象数组，含 val 字段）
   */
  filterMenusByPerms(perms: any[]): void {
    // 从 AuthVo 对象中提取 val 字段，兼容字符串和对象两种格式
    const permVals: string[] = (perms || []).map((p: any) =>
      typeof p === 'string' ? p : (p.val || p.pval || '')
    ).filter(Boolean);

    // 权限值为 * 表示超管，显示全部菜单
    if (permVals.length === 0 || permVals.includes('*')) {
      this.menusSubject.next([...this.allMenus]);
      return;
    }

    const filtered = this.allMenus
      .map(menu => {
        if (!menu.children) return menu;
        const filteredChildren = menu.children.filter(child => permVals.includes(child.path || ''));
        if (filteredChildren.length === 0) return null;
        return { ...menu, children: filteredChildren };
      })
      .filter((menu): menu is MenuItem => menu !== null);

    this.menusSubject.next(filtered);
  }

  /** 重置为全量菜单（退出登录时调用） */
  resetMenus(): void {
    this.menusSubject.next(this.allMenus);
  }

  toggleCollapsed(): void {
    this.collapsedSubject.next(!this.collapsedSubject.value);
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsedSubject.next(collapsed);
  }
}
