# 视频发布平台后台管理系统 - 项目规范

## 1. Concept & Vision

一个现代化、功能完备的视频发布平台后台管理系统，采用 Ant Design 风格，提供直观高效的管理体验。界面简洁专业，交互流畅自然，让管理员能够高效管理用户、选品、剪辑和发布等核心业务模块。

## 2. Design Language

### 美学方向
- 参考 Ant Design Pro 风格，专业企业级后台管理界面
- 简洁大气，层次分明，强调功能性和易用性

### 色彩方案
- 主色：`#1890ff` (Ant Design 蓝)
- 成功色：`#52c41a`
- 警告色：`#faad14`
- 错误色：`#ff4d4f`
- 背景色：`#f0f2f5`
- 侧边栏：`#001529` (深蓝黑)
- 文字主色：`#333333`
- 文字次要色：`#666666`
- 边框色：`#e8e8e8`

### 字体
- 主字体：`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- 代码字体：`Monaco, Menlo, 'Courier New', monospace`
- 基础字号：14px
- 标题字号：20px/16px/14px

### 间距系统
- 基础间距单位：8px
- 页面内边距：24px
- 卡片内边距：24px
- 元素间距：16px/24px

### 动效
- 过渡时长：0.3s
- 缓动函数：`ease-in-out`
- 侧边栏展开收起动画
- 页面切换淡入淡出

## 3. Layout & Structure

### 整体布局
```
┌─────────────────────────────────────────────────────┐
│                     头部 Header                      │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│   侧边栏   │              内容区域                   │
│  Sider    │              Content                   │
│            │                                        │
│  (可折叠)  │                                        │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

### 响应式策略
- 桌面端（>1200px）：完整侧边栏 + 内容区
- 平板端（768-1200px）：折叠侧边栏
- 移动端（<768px）：隐藏侧边栏，汉堡菜单

## 4. Features & Interactions

### 菜单结构
```
系统管理
  ├── 用户管理
  ├── 角色管理
  ├── 菜单管理
  ├── 权限管理
  └── 租户管理

选品管理
  ├── 选品设置
  ├── 选品来源
  └── 选品记录

剪辑管理
  ├── AI剪辑
  ├── 切片剪辑
  └── 混合剪辑

发布管理
  ├── 发布配置
  ├── 账号管理
  └── 发布记录
```

### 核心功能
1. **侧边栏导航**：支持展开/收起，显示菜单图标和文字
2. **头部组件**：面包屑、用户头像、下拉菜单
3. **内容区**：路由页面展示
4. **Mock API**：模拟 CRUD 操作
5. **表格列表页**：搜索、筛选、分页、新增、编辑、删除
6. **表单页**：新增/编辑表单，表单验证

### 交互细节
- 菜单hover：背景色变化
- 菜单选中：左侧高亮条 + 背景色
- 按钮hover：轻微上移 + 阴影
- 表格行hover：背景色变化
- 加载状态：骨架屏或 Loading 动画

## 5. Component Inventory

### Layout 组件
- `LayoutComponent`：主布局容器
- `HeaderComponent`：顶部导航栏
- `SiderComponent`：侧边栏菜单
- `ContentComponent`：内容区域

### 功能组件
- `UserManagementComponent`：用户管理页面
- `RoleManagementComponent`：角色管理页面
- `MenuManagementComponent`：菜单管理页面
- `PermissionManagementComponent`：权限管理页面
- `TenantManagementComponent`：租户管理页面
- `SelectionSettingComponent`：选品设置页面
- `SelectionSourceComponent`：选品来源页面
- `SelectionRecordComponent`：选品记录页面
- `AIClippingComponent`：AI剪辑页面
- `SliceClippingComponent`：切片剪辑页面
- `MixedClippingComponent`：混合剪辑页面
- `PublishConfigComponent`：发布配置页面
- `AccountManagementComponent`：账号管理页面
- `PublishRecordComponent`：发布记录页面

### 状态
- Default：正常显示
- Loading：骨架屏/加载动画
- Empty：空状态提示
- Error：错误状态提示

## 6. Technical Approach

### 技术栈
- **框架**：Angular 17+
- **UI 库**：ng-zorro-antd
- **样式**：SCSS + Ant Design 样式
- **图标**：@ant-design/icons-angular
- **路由**：Angular Router
- **HTTP**：Angular HttpClient (Mock)
- **状态**：Services with BehaviorSubject

### 项目结构
```
src/
├── app/
│   ├── core/                    # 核心模块
│   │   ├── services/           # 服务
│   │   │   └── menu.service.ts
│   │   └── mock/               # Mock数据
│   │       └── mock-api.service.ts
│   ├── layout/                 # 布局模块
│   │   ├── header/
│   │   ├── sider/
│   │   └── content/
│   ├── pages/                  # 页面模块
│   │   ├── system/             # 系统管理
│   │   ├── selection/          # 选品管理
│   │   ├── clipping/           # 剪辑管理
│   │   └── publish/            # 发布管理
│   ├── routes/                 # 路由配置
│   └── app.component.ts
├── assets/
└── styles/
```

### Mock API 设计
每个模块提供以下接口：
- `GET /api/{module}` - 获取列表（分页）
- `GET /api/{module}/:id` - 获取详情
- `POST /api/{module}` - 新增
- `PUT /api/{module}/:id` - 更新
- `DELETE /api/{module}/:id` - 删除
