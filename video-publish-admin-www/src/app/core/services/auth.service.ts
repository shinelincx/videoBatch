import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MenuService } from './menu.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export interface User {
  uid?: string;
  name?: string;
  nick?: string;
  avator?: string;
  roles?: string[];
  perms?: string[];
}

export interface LoginResponse {
  token: string;
  uid: string;
  nick: string;
  roles: string[];
  perms: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_KEY = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private menuService: MenuService,
    private message: NzMessageService
  ) {
    this.loadUserFromStorage();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        // 恢复用户菜单
        if (user.perms) {
          this.menuService.filterMenusByPerms(user.perms);
        }
      } catch (e) {
        localStorage.removeItem(this.USER_KEY);
      }
    }
  }

  login(uname: string, pwd: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { uname, pwd });
  }

  handleLoginSuccess(response: any): void {
    if (response.code === 0 && response.data) {
      const user: User = {
        uid: response.data.uid,
        name: response.data.uid,
        nick: response.data.nick,
        roles: response.data.roles,
        perms: response.data.perms
      };

      this.currentUserSubject.next(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_KEY, response.data.token);

      // 根据用户权限过滤菜单
      this.menuService.filterMenusByPerms(user.perms || []);
    }
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/info`);
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {});
  }

  handleLogout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    // 重置菜单为全量
    this.menuService.resetMenus();
    this.router.navigate(['/login']);
  }

  /**
   * 登录态失效：只提示一次并跳转（拦截器与并发请求可能多次命中，业务层勿再弹窗）。
   */
  handleSessionExpiredOnce(msg?: string): void {
    if (!this.currentUserSubject.value) {
      return;
    }
    this.message.error(msg?.trim() || '登录已失效，请重新登录');
    this.handleLogout();
  }

}
