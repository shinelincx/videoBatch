# 视频发布平台后台管理系统

## 项目简介

基于 Angular 19+ 和 ng-zorro-antd 最新版本开发的前后端分离后台管理系统，采用 Ant Design 风格。

## 技术栈

- **前端框架**：Angular 19+
- **UI 库**：ng-zorro-antd 21.2.2
- **构建工具**：Angular CLI
- **样式**：SCSS
- **状态管理**：组件级状态管理
- **API 模拟**：Mock 数据服务

## 项目结构

```
video-publish-admin-www/
├── src/
│   ├── app/
│   │   ├── core/                    # 核心服务
│   │   │   └── services/            # 服务目录
│   │   │       └── mock-api.service.ts  # Mock API 服务
│   │   ├── pages/                   # 页面组件
│   │   │   ├── clipping/            # 剪辑管理
│   │   │   │   ├── ai-clipping.component.ts
│   │   │   │   ├── slice-clipping.component.ts
│   │   │   │   └── mixed-clipping.component.ts
│   │   │   ├── publish/             # 发布管理
│   │   │   │   ├── account-management.component.ts
│   │   │   │   ├── publish-record.component.ts
│   │   │   │   └── publish-config.component.ts
│   │   │   ├── selection/           # 选品管理
│   │   │   │   ├── selection-record.component.ts
│   │   │   │   ├── selection-setting.component.ts
│   │   │   │   └── selection-source.component.ts
│   │   │   └── system/              # 系统管理
│   │   │       ├── menu-management.component.ts
│   │   │       ├── permission-management.component.ts
│   │   │       ├── role-management.component.ts
│   │   │       ├── tenant-management.component.ts
│   │   │       └── user-management.component.ts
│   │   ├── layout/                  # 布局组件
│   │   │   └── main-layout.component.ts
│   │   ├── app.component.ts         # 根组件
│   │   └── app-routing.module.ts    # 路由配置
│   ├── styles/                      # 全局样式
│   └── index.html                   # 入口 HTML
├── angular.json                     # Angular 配置
├── package.json                     # 项目依赖
└── README.md                        # 项目说明
```

## 功能模块

### 1. 系统管理
- **用户管理**：用户的增删改查
- **角色管理**：角色的增删改查
- **菜单管理**：菜单的增删改查
- **权限管理**：权限的配置与管理
- **租户管理**：租户的增删改查

### 2. 选品管理
- **选品设置**：选品规则的配置
- **选品来源**：选品来源的管理
- **选品记录**：选品历史记录

### 3. 剪辑管理
- **AI 剪辑**：AI 自动剪辑功能
- **切片剪辑**：手动切片剪辑
- **混合剪辑**：混合剪辑模式

### 4. 发布管理
- **发布配置**：发布参数的配置
- **账号管理**：发布账号的管理
- **发布记录**：发布历史记录

## 开发环境搭建

1. **安装 Node.js**
   - 推荐版本：v20.19+ 或 v22.12+

2. **安装依赖**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **启动开发服务器**
   ```bash
   npm start
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

## 模拟数据

项目使用 `MockApiService` 提供模拟数据，支持以下操作：
- 列表查询（带分页）
- 单条数据查询
- 数据创建
- 数据更新
- 数据删除

## 注意事项

1. **版本兼容**：项目使用 Angular 19+ 和 ng-zorro-antd 21.2.2，确保 Node.js 版本符合要求
2. **依赖安装**：使用 `--legacy-peer-deps` 解决依赖冲突
3. **Mock 数据**：所有接口均为模拟数据，实际项目中需要替换为真实 API
4. **路由配置**：已配置完整的路由结构，可直接访问各模块

## 浏览器支持

- Chrome（推荐）
- Firefox
- Safari
- Edge

## 项目特点

- **模块化设计**：清晰的目录结构和组件划分
- **响应式布局**：适配不同屏幕尺寸
- **Ant Design 风格**：统一的 UI 设计语言
- **模拟数据**：内置 Mock 服务，无需后端即可展示功能
- **完整的 CRUD 操作**：支持增删改查等基本操作
- **表单验证**：集成表单验证功能
- **状态管理**：组件级状态管理，满足基本需求

## 后续优化方向

1. 集成真实后端 API
2. 引入状态管理库（如 NgRx）
3. 增加单元测试和端到端测试
4. 优化性能和用户体验
5. 支持国际化
6. 增加更多高级功能


## 发布命令
   ```bash
   ng build
   ```