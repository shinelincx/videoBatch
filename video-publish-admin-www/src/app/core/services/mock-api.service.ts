import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface PageResult<T> {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockApiService {

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private mockData: Record<string, any[]> = {
    user: [
      { id: '1', username: 'admin', realName: '管理员', email: 'admin@example.com', role: '超级管理员', status: 'active', createTime: '2024-01-01 10:00:00' },
      { id: '2', username: 'editor', realName: '编辑', email: 'editor@example.com', role: '编辑', status: 'active', createTime: '2024-01-02 10:00:00' },
      { id: '3', username: 'viewer', realName: '查看者', email: 'viewer@example.com', role: '查看者', status: 'inactive', createTime: '2024-01-03 10:00:00' }
    ],
    role: [
      { id: '1', name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有所有权限', userCount: 1, createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '编辑', code: 'EDITOR', description: '可管理内容', userCount: 5, createTime: '2024-01-02 10:00:00' },
      { id: '3', name: '查看者', code: 'VIEWER', description: '只读权限', userCount: 10, createTime: '2024-01-03 10:00:00' }
    ],
    menu: [
      { id: '1', name: '系统管理', parentId: null, path: '/system', icon: 'setting', sort: 1, type: 'directory', createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '用户管理', parentId: '1', path: '/system/user', icon: 'user', sort: 1, type: 'menu', createTime: '2024-01-01 10:00:00' }
    ],
    permission: [
      { id: '1', name: '用户管理', code: 'system:user', description: '用户管理权限', type: 'menu', createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '角色管理', code: 'system:role', description: '角色管理权限', type: 'menu', createTime: '2024-01-01 10:00:00' }
    ],
    tenant: [
      { id: '1', name: '默认租户', code: 'DEFAULT', status: 'active', userCount: 100, expireTime: '2025-12-31', createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '测试租户', code: 'TEST', status: 'active', userCount: 10, expireTime: '2024-12-31', createTime: '2024-01-02 10:00:00' }
    ],
    'selection-setting': [
      { id: '1', name: '默认选品规则', type: 'auto', status: 'enabled', keywords: '视频,剪辑', createTime: '2024-01-01 10:00:00' }
    ],
    'selection-source': [
      { id: '1', name: '抖音', type: 'douyin', status: 'active', url: 'https://douyin.com', createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '快手', type: 'kuaishou', status: 'active', url: 'https://kuaishou.com', createTime: '2024-01-02 10:00:00' }
    ],
    'selection-record': [
      { id: '1', title: '热门视频1', source: '抖音', status: 'selected', selectTime: '2024-01-15 10:00:00' },
      { id: '2', title: '热门视频2', source: '快手', status: 'pending', selectTime: '2024-01-16 10:00:00' }
    ],
    'ai-clipping': [
      { id: '1', name: 'AI剪辑任务1', source: '视频1.mp4', status: 'processing', progress: 45, createTime: '2024-01-15 10:00:00' },
      { id: '2', name: 'AI剪辑任务2', source: '视频2.mp4', status: 'completed', progress: 100, createTime: '2024-01-14 10:00:00' }
    ],
    'slice-clipping': [
      { id: '1', name: '切片任务1', source: '视频1.mp4', duration: '00:05:30', status: 'processing', createTime: '2024-01-15 10:00:00' }
    ],
    'mixed-clipping': [
      { id: '1', name: '混合剪辑1', sources: '视频1.mp4,视频2.mp4', status: 'processing', createTime: '2024-01-15 10:00:00' }
    ],
    'publish-config': [
      { id: '1', name: '每日发布', cron: '0 9 * * *', platforms: '抖音,快手', status: 'enabled', createTime: '2024-01-01 10:00:00' },
      { id: '2', name: '周末发布', cron: '0 10 * * 0,6', platforms: '抖音', status: 'disabled', createTime: '2024-01-02 10:00:00' }
    ],
    'publish-account': [
      { id: '1', platform: '抖音', username: 'account1', status: 'active', followers: '10万', lastPublish: '2024-01-15 10:00:00', createTime: '2024-01-01 10:00:00' },
      { id: '2', platform: '快手', username: 'account2', status: 'active', followers: '5万', lastPublish: '2024-01-14 10:00:00', createTime: '2024-01-02 10:00:00' }
    ],
    'publish-record': [
      { id: '1', title: '发布视频1', platform: '抖音', account: 'account1', status: 'success', publishTime: '2024-01-15 10:00:00' },
      { id: '2', title: '发布视频2', platform: '快手', account: 'account2', status: 'failed', publishTime: '2024-01-15 11:00:00' }
    ]
  };

  getList(module: string, pageIndex: number = 1, pageSize: number = 10): Observable<PageResult<any>> {
    const data = this.mockData[module] || [];
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return of({
      items: data.slice(start, end),
      total: data.length,
      pageIndex,
      pageSize
    }).pipe(delay(300));
  }

  getById(module: string, id: string): Observable<any> {
    const data = this.mockData[module] || [];
    const item = data.find(d => d.id === id);
    return of(item).pipe(delay(200));
  }

  create(module: string, item: any): Observable<any> {
    const data = this.mockData[module] || [];
    item.id = this.generateId();
    item.createTime = new Date().toLocaleString();
    data.push(item);
    this.mockData[module] = data;
    return of(item).pipe(delay(300));
  }

  update(module: string, id: string, item: any): Observable<any> {
    const data = this.mockData[module] || [];
    const index = data.findIndex(d => d.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...item };
      this.mockData[module] = data;
      return of(data[index]).pipe(delay(300));
    }
    return of(null).pipe(delay(300));
  }

  delete(module: string, id: string): Observable<boolean> {
    const data = this.mockData[module] || [];
    const index = data.findIndex(d => d.id === id);
    if (index !== -1) {
      data.splice(index, 1);
      this.mockData[module] = data;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}
