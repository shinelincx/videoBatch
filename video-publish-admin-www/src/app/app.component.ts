import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { MenuService, MenuItem } from './core/services/menu.service';
import { AuthService } from './core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzAvatarModule,
    NzDropDownModule,
    NzButtonModule
  ],
  template: `
    @if (authService.isAuthenticated) {
      <nz-layout class="app-layout">
        <nz-sider
          class="app-sider"
          [nzCollapsible]="true"
          [(nzCollapsed)]="isCollapsed"
          [nzBreakpoint]="'lg'"
          [nzCollapsedWidth]="0"
          [nzWidth]="200"
          [nzTrigger]="null"
        >
          <div class="logo">
            <span>{{ isCollapsed ? 'V' : 'Video' }}</span>
          </div>
          <ul nz-menu nzTheme="light" nzMode="inline" [nzInlineCollapsed]="isCollapsed">
            @for (menu of menus; track menu.id) {
              <li
                nz-submenu
                [nzTitle]="menu.name"
                [nzOpen]="isMenuOpen(menu.id)"
                (nzOpenChange)="onMenuOpenChange(menu.id, $event)"
              >
                <ul>
                  @for (child of menu.children; track child.id) {
                    <li nz-menu-item [nzSelected]="selectedPath === child.path" (click)="navigateTo(child.path!)">
                      {{ child.name }}
                    </li>
                  }
                </ul>
              </li>
            }
          </ul>
        </nz-sider>

        <nz-layout class="main-layout" [class.main-layout--collapsed]="isCollapsed">
          <nz-header class="header">
            <button
              type="button"
              nz-button
              nzType="text"
              nzSize="small"
              class="toggle-btn"
              [attr.aria-label]="isCollapsed ? '展开侧栏' : '收起侧栏'"
              (click)="toggleCollapsed()"
            >
              <nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" nzTheme="outline" />
            </button>
            <div class="header-right">
              <div class="user-info" nz-dropdown [nzDropdownMenu]="userMenu">
                <nz-avatar nzIcon="user" nzSize="small"></nz-avatar>
                <span>{{ authService.currentUser?.nick || '管理员' }}</span>
              </div>
              <nz-dropdown-menu #userMenu="nzDropdownMenu">
                <ul nz-menu>
                  <li nz-menu-item (click)="viewUser()">
                    <nz-icon nzType="user" nzTheme="outline" />
                    查看用户
                  </li>
                  <li nz-menu-item (click)="logout()">
                    <nz-icon nzType="logout" nzTheme="outline" />
                    退出登录
                  </li>
                </ul>
              </nz-dropdown-menu>
            </div>
          </nz-header>

          <nz-content class="content">
            <router-outlet></router-outlet>
          </nz-content>
        </nz-layout>
      </nz-layout>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .app-layout {
      height: 100vh;
    }

    .app-sider {
      background: #ffffff;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
      border-right: 1px solid #f0f0f0;
    }

    .logo {
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #262626;
      font-size: 16px;
      font-weight: 500;
      background: #ffffff;
      letter-spacing: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .main-layout {
      margin-left: 200px;
      transition: margin-left 0.2s ease;
    }

    .main-layout.main-layout--collapsed {
      margin-left: 0;
    }

    .header {
      height: 44px;
      padding: 0 12px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      border-bottom: 1px solid #f0f0f0;
    }

    .toggle-btn {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      min-width: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
      color: #595959;
    }

    .toggle-btn:hover {
      color: #1890ff;
      background: #e6f7ff;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: #595959;
    }

    .user-info:hover {
      background: #f5f5f5;
    }

    .content {
      margin: 10px 12px;
      padding: 0;
      background: transparent;
      border-radius: 0;
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  menus: MenuItem[] = [];
  selectedPath = '/system/user';
  currentMenuName = '用户管理';
  openedMenuIds = new Set<string>();

  private menuSub!: Subscription;
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private menuService: MenuService,
    public authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // 订阅菜单变化（登录/登出时自动更新侧边栏）
    this.menuSub = this.menuService.menus$.subscribe(menus => {
      this.menus = menus;
      this.syncMenuState(this.router.url || this.selectedPath);
    });

    // 监听路由变化，同步菜单选中状态
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.syncMenuState(event.urlAfterRedirects || event.url);
      }
    });
    this.syncMenuState(this.router.url || this.selectedPath);
  }

  ngOnDestroy(): void {
    this.menuSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    this.menuService.setCollapsed(this.isCollapsed);
  }

  navigateTo(path: string): void {
    this.selectedPath = path;
    const menuItem = this.findMenuItem(this.menus, path);
    if (menuItem) {
      this.currentMenuName = menuItem.name;
    }
    this.router.navigate([path]);
  }

  isMenuOpen(menuId: string): boolean {
    return this.openedMenuIds.has(menuId);
  }

  onMenuOpenChange(menuId: string, open: boolean): void {
    if (open) {
      this.openedMenuIds.add(menuId);
    } else {
      this.openedMenuIds.delete(menuId);
    }
  }

  viewUser(): void {
    // 查看用户功能
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.handleLogout();
        this.message.success('已退出登录');
      },
      error: () => {
        this.authService.handleLogout();
        this.message.success('已退出登录');
      }
    });
  }

  private findMenuItem(menus: MenuItem[], path: string): MenuItem | null {
    for (const menu of menus) {
      if (menu.path === path) {
        return menu;
      }
      if (menu.children) {
        const found = this.findMenuItem(menu.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  private syncMenuState(url: string): void {
    const path = this.normalizePath(url);
    this.selectedPath = path;
    const match = this.findMenuMatch(this.menus, path);
    if (!match) {
      return;
    }
    this.currentMenuName = match.item.name;
    match.parents.forEach(parent => this.openedMenuIds.add(parent.id));
  }

  private findMenuMatch(menus: MenuItem[], path: string, parents: MenuItem[] = []): { item: MenuItem; parents: MenuItem[] } | null {
    for (const menu of menus) {
      if (menu.path && this.normalizePath(menu.path) === path) {
        return { item: menu, parents };
      }
      const children = menu.children || [];
      if (children.length > 0) {
        const found = this.findMenuMatch(children, path, [...parents, menu]);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private normalizePath(url: string): string {
    const path = String(url || '').split(/[?#]/)[0] || '/system/user';
    return path.length > 1 ? path.replace(/\/+$/g, '') : path;
  }
}
