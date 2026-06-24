import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/system/user',
        pathMatch: 'full'
      },
      {
        path: 'system',
        children: [
          { path: 'user', loadComponent: () => import('./pages/system/user-management.component').then(m => m.UserManagementComponent) },
          { path: 'role', loadComponent: () => import('./pages/system/role-management.component').then(m => m.RoleManagementComponent) },
          { path: 'menu', loadComponent: () => import('./pages/system/menu-management.component').then(m => m.MenuManagementComponent) },
          { path: 'tenant', loadComponent: () => import('./pages/system/tenant-management.component').then(m => m.TenantManagementComponent) }
        ]
      },
      {
        path: 'base-config',
        children: [
          { path: 'category', loadComponent: () => import('./pages/base-config/product-category.component').then(m => m.ProductCategoryComponent) },
          { path: 'account', loadComponent: () => import('./pages/base-config/account-config.component').then(m => m.AccountConfigComponent) },
          { path: 'proxy', loadComponent: () => import('./pages/base-config/proxy-config.component').then(m => m.ProxyConfigComponent) },
          { path: 'robot', loadComponent: () => import('./pages/base-config/robot-management.component').then(m => m.RobotManagementComponent) }
        ]
      },
      {
        path: 'client',
        children: [
          { path: 'monitor', loadComponent: () => import('./pages/client/client-monitor.component').then(m => m.ClientMonitorComponent) }
        ]
      },
      {
        path: 'selection',
        children: [
          { path: 'strategy', loadComponent: () => import('./pages/selection/selection-strategy.component').then(m => m.SelectionStrategyComponent) },
          { path: 'record', loadComponent: () => import('./pages/selection/selection-record.component').then(m => m.SelectionRecordComponent) }
        ]
      },
      {
        path: 'clipping',
        children: [
          { path: 'rule', loadComponent: () => import('./pages/clipping/clip-rule.component').then(m => m.ClipRuleComponent) },
          { path: 'config', loadComponent: () => import('./pages/clipping/clip-config.component').then(m => m.ClipConfigComponent) },
          { path: 'rule-item', loadComponent: () => import('./pages/clipping/clip-rule-item.component').then(m => m.ClipRuleItemComponent) },
          { path: 'record', loadComponent: () => import('./pages/clipping/clip-record.component').then(m => m.ClipRecordComponent) }
        ]
      },
      {
        path: 'publish',
        children: [
          { path: 'config', loadComponent: () => import('./pages/publish/publish-config.component').then(m => m.PublishConfigComponent) },
          { path: 'strategy', redirectTo: 'config', pathMatch: 'full' },
          { path: 'account', loadComponent: () => import('./pages/publish/account-management.component').then(m => m.AccountManagementComponent) },
          { path: 'record', loadComponent: () => import('./pages/publish/publish-record.component').then(m => m.PublishRecordComponent) }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/system/user'
  }
];
