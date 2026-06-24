import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

export interface SysUser {
  uid?: string;
  uname?: string;
  nick?: string;
  pwd?: string;
  salt?: string;
  lock?: boolean;
  created?: string;
  updated?: string;
  tenantId?: number | null;
  roleList?: SysRole[];
}

export interface SysRole {
  rid?: string;
  rname?: string;
  rdesc?: string;
  rval?: string;
  created?: string;
  updated?: string;
}

export interface SysPerm {
  pid?: string;
  pval?: string;
  pname?: string;
  ptype?: number;
  parent?: string;
  leaf?: boolean;
  created?: string;
  updated?: string;
}

export interface SysMenu {
  mid?: string;
  mname?: string;
  mval?: string;
  mtype?: number;
  parent?: string;
  icon?: string;
  sort?: number;
  leaf?: boolean;
  created?: string;
  updated?: string;
}

export interface SysTenant {
  id?: number;
  tid?: string;
  name?: string;
  tname?: string;
  created?: Date;
  createTime?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg?: string;
}

export interface UserQueryParams {
  nick?: string;
  current?: number;
  size?: number;
}

export interface RoleQueryParams {
  rname?: string;
  current?: number;
  size?: number;
}

export interface PermQueryParams {
  ptype?: number;
}

export interface RolePermVo {
  rid: string;
  ptype: number;
  pvals: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SysApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserList(params: UserQueryParams): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_user/query`, params);
  }

  getUserInfo(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sys_user/info`);
  }

  getUserRoles(uid: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sys_user/${uid}/roles`);
  }

  createUser(user: { uname: string; pwd: string; nick?: string; tenantId?: number | null }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_user`, user);
  }

  updateUser(user: Partial<SysUser>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_user/info`, user);
  }

  updateUserRole(uid: string, rids: string[]): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_user/role`, { uid, rids });
  }

  updatePassword(pwd: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_user/pwd`, { pwd });
  }

  deleteUser(uid: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_user`, { body: { uid } });
  }

  getRoleList(params: RoleQueryParams): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_role/query`, params);
  }

  getRolePerms(rid: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sys_role/${rid}/perms`);
  }

  createRole(role: { rname: string; rval: string; rdesc?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_role`, role);
  }

  updateRole(role: Partial<SysRole>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_role/info`, role);
  }

  updateRolePerm(vo: RolePermVo): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_role/perm`, vo);
  }

  deleteRole(rid: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_role`, { body: { rid } });
  }

  getAllPerms(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sys_perm/list/all`);
  }

  getButtonPermMap(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sys_perm/list/btn_perm_map`);
  }

  syncMenuPerms(perms: SysPerm[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_perm/sync/menu`, perms);
  }

  syncApiPerms(perms: SysPerm[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_perm/sync/api`, perms);
  }

  createPerm(perm: { pval: string; pname: string; ptype: number; parent?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_perm`, perm);
  }

  updatePerm(perm: Partial<SysPerm>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_perm/info`, perm);
  }

  deletePerm(pval: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_perm`, { body: { pval } });
  }

  getMenuList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_menu/query`, params);
  }

  createMenu(menu: { mname: string; mval: string; mtype: number; parent?: string; icon?: string; sort?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_menu`, menu);
  }

  updateMenu(menu: Partial<SysMenu>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_menu/info`, menu);
  }

  deleteMenu(mid: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_menu`, { body: { mid } });
  }

  getPermissionList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_perm/query`, params);
  }

  createPermission(perm: { pval: string; pname: string; ptype: number; parent?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_perm`, perm);
  }

  updatePermission(perm: Partial<SysPerm>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_perm/info`, perm);
  }

  deletePermission(pid: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_perm`, { body: { pid } });
  }

  getTenantList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_tenant/query`, params);
  }

  createTenant(tenant: { tname: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sys_tenant`, tenant);
  }

  updateTenant(tenant: Partial<SysTenant>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/sys_tenant/info`, tenant);
  }

  deleteTenant(tid: string): Observable<ApiResponse> {
    return this.http.request<ApiResponse>('DELETE', `${this.baseUrl}/sys_tenant`, { body: { tid } });
  }

  // ==================== 选品策略 ====================

  getSelectionStrategyList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/page`, params);
  }

  getAllSelectionStrategies(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/selection/strategy/list`);
  }

  createSelectionStrategy(strategy: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/create`, strategy);
  }

  updateSelectionStrategy(strategy: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/update`, strategy);
  }

  deleteSelectionStrategy(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/delete`, { id });
  }

  getSelectionStrategyItemList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/item/page`, params);
  }

  getAllSelectionStrategyItems(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/selection/strategy/item/list`);
  }

  createSelectionStrategyItem(item: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/item/create`, item);
  }

  updateSelectionStrategyItem(item: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/item/update`, item);
  }

  deleteSelectionStrategyItem(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/strategy/item/delete`, { id });
  }

  // ==================== 选品记录 ====================

  getProductSelectionRecordList(params: { current?: number; size?: number; params?: Record<string, any> }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/page`, params);
  }

  getProductSelectionRecordDetailByProductId(productId: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/detail_by_product_id`, { productId });
  }

  createProductSelectionRecord(record: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/create`, record);
  }

  updateProductSelectionRecord(record: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/update`, record);
  }

  deleteProductSelectionRecord(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/delete`, { id });
  }

  batchClipProductSelectionRecords(ids: number[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/batch_clip`, { ids });
  }

  batchDiscardProductSelectionRecords(ids: number[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/batch_discard`, { ids });
  }

  batchRestoreProductSelectionRecords(ids: number[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/selection/record/batch_restore`, { ids });
  }

  // ==================== 发布配置 ====================

  getPublishConfigList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/config/page`, params);
  }

  getPublishConfigColumns(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/config/columns`);
  }

  getAllPublishConfigs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/config/list`);
  }

  createPublishConfig(config: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/config/create`, config);
  }

  updatePublishConfig(config: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/config/update`, config);
  }

  deletePublishConfig(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/config/delete`, { id });
  }

  // ==================== 发布账号 ====================

  getPublishAccountList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/page`, params);
  }

  getPublishAccountColumns(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/account/columns`);
  }

  getAllPublishAccounts(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/account/list`);
  }

  getPublishAccountStatistics(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/account/statistics`);
  }

  startPublishAccounts(payload: { publishAccountIds: Array<number | string>; robotId: number | string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/start/publish`, payload);
  }

  loginPublishAccount(payload: { publishAccountId: number | string; robotId: number | string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/login`, payload);
  }

  createPublishAccount(account: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/create`, account);
  }

  importPublishAccounts(payload: {
    accountIds: Array<number | string>;
    configId: number | string;
    robotId?: number | string | null;
    selectionAudit?: number | string | null;
    publishConditions?: Array<Record<string, unknown>>;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/import`, payload);
  }

  updatePublishAccount(account: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/update`, account);
  }

  deletePublishAccount(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/account/delete`, { id });
  }

  // ==================== 发布记录 ====================

  getPublishRecordList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/publish/record/page`, params);
  }

  getAllPublishRecords(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/publish/record/list`);
  }

  // ==================== 剪辑规则 ====================

  getClipRuleList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/page`, params);
  }

  createClipRule(rule: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/create`, rule);
  }

  updateClipRule(rule: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/update`, rule);
  }

  deleteClipRule(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/delete`, { id });
  }

  getClipRuleItems(ruleId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_rule/${ruleId}/items`);
  }

  getClipRuleItemOptions(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_rule/items/options`);
  }

  saveClipRuleItems(ruleId: number, items: any[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/items/save`, { ruleId, items });
  }

  executeClipRule(ruleId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule/execute`, { ruleId });
  }

  // ==================== 剪辑配置 ====================

  getClipConfigList(params: { current?: number; size?: number; params?: Record<string, any> }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_config/page`, params);
  }

  getAllClipConfigs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_config/list`);
  }

  getClipConfigMap(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_config/config_map`);
  }

  createClipConfig(config: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_config/create`, config);
  }

  updateClipConfig(config: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_config/update`, config);
  }

  deleteClipConfig(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_config/delete`, { id });
  }

  // ==================== 剪辑规则项 ====================

  getClipRuleItemList(params: { current?: number; size?: number; params?: Record<string, any> }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule_item/page`, params);
  }

  createClipRuleItem(item: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule_item/create`, item);
  }

  updateClipRuleItem(item: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule_item/update`, item);
  }

  deleteClipRuleItem(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_rule_item/delete`, { id });
  }

  // ==================== 基础配置：商品类目 ====================

  getProductCategoryList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/category/page`, params);
  }

  getAllProductCategories(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/base/category/list`);
  }

  createProductCategory(category: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/category/create`, category);
  }

  updateProductCategory(category: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/category/update`, category);
  }

  deleteProductCategory(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/category/delete`, { id });
  }

  // ==================== 基础配置：账号管理 ====================

  getBaseAccountList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/account/page`, params);
  }

  getAllBaseAccounts(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/base/account/list`);
  }

  createBaseAccount(account: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/account/create`, account);
  }

  updateBaseAccount(account: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/account/update`, account);
  }

  deleteBaseAccount(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/account/delete`, { id });
  }

  loginBaseAccount(payload: { accountId: number | string; robotId: number | string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/account/login`, payload);
  }

  // ==================== 基础配置：代理配置 ====================

  getProxyConfigList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/proxy/page`, params);
  }

  getAllProxyConfigs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/base/proxy/list`);
  }

  createProxyConfig(proxy: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/proxy/create`, proxy);
  }

  updateProxyConfig(proxy: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/proxy/update`, proxy);
  }

  deleteProxyConfig(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/proxy/delete`, { id });
  }

  // ==================== 基础配置：机器人管理 ====================

  getRobotList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/robot/page`, params);
  }

  getOnlineRobots(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/base/robot/online`);
  }

  controlRobot(id: number, command: 'resume' | 'pause' | 'stop'): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/robot/command`, { id, command });
  }

  getClientMonitorList(params: { current?: number; size?: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/robot/page`, params);
  }

  controlClient(id: number, command: 'start' | 'resume' | 'pause' | 'stop'): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/base/robot/command`, { id, command });
  }

  // ==================== 剪辑记录 ====================

  getClipRecordList(params: { current?: number; size?: number; params?: Record<string, any> }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_record/page`, params);
  }

  getPendingClipRecordList(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_record/pending_clip/list`);
  }

  getClipRecordStatistics(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/clip_record/statistics`);
  }

  deleteClipRecord(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/clip_record/delete`, { id });
  }
}
