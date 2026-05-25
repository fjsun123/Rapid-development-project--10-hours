# 页面名称：后台CRM客户管理（admin_crm）

> MVP 版本：保留客户列表、搜索、新增/编辑模态；砍掉客户详情抽屉（含订单历史、"为该客户下单"快捷入口）、订单总数列点击跳转、分页器。表格行点击直接打开编辑模态。

## 基本信息
- 页面ID：admin_crm_001
- 入口：左侧导航「CRM」菜单，路由 /crm
- 状态：正常 / 加载（骨架屏）/ 空态 / 异常

## 元素清单（带ID）

### 1. 搜索筛选区（admin-crm-search-section-001）
- 搜索框（admin-crm-search-input-001）：占位「搜索客户姓名或手机号」，支持实时搜索（防抖500ms）
- 新增客户按钮（admin-crm-add-btn-001）：主要按钮，右上角

### 2. 客户列表表格（admin-crm-table-001）
列定义：
- 姓名（admin-crm-table-name-001）：可点击，打开编辑客户模态框
- 手机号（admin-crm-table-phone-001）：完整显示
- 订单总数（admin-crm-table-order-count-001）：数字（仅展示）
- 累计消费（admin-crm-table-total-spent-001）：格式 ¥XX,XXX.XX
- 最后下单时间（admin-crm-table-last-order-001）：格式 YYYY-MM-DD HH:mm
- 操作列（admin-crm-table-actions-001）：编辑

数据加载：固定取前 50 条（接口保留 page/size 入参，前端 MVP 不分页）。

### 3. 新增/编辑客户模态框（admin-crm-modal-001）
表单字段：
- 姓名输入框（admin-crm-modal-name-001）：必填，最大20字符
- 手机号输入框（admin-crm-modal-phone-001）：必填，11位数字，唯一校验

底部按钮：
- 取消按钮（admin-crm-modal-cancel-001）
- 确定按钮（admin-crm-modal-submit-001）：loading状态

### 4. 空状态（admin-crm-empty-001）
- 插图
- 文案「暂无客户，点击新增客户」
- 新增客户按钮

### 5. 加载骨架屏（admin-crm-skeleton-001）
- 表格骨架：8行

## 交互逻辑

### A. 搜索客户（admin-crm-search）
触发：在搜索框输入内容（防抖后）

行为：
- 调用 GET /api/customers?keyword=xxx&page=1&size=50
- 显示加载状态
- 成功：渲染客户列表
- 空结果：显示空状态

### B. 新增客户（admin-crm-add）
触发：点击「新增客户」按钮

行为：
- 打开新增客户模态框
- 清空表单
- 提交时调用 POST /api/customers
- 成功：吐司「客户添加成功」，关闭模态框，刷新列表
- 失败：
  - 手机号重复：吐司「该手机号已存在」
  - 其他错误：吐司错误信息

### C. 编辑客户（admin-crm-edit）
触发：点击表格行姓名 或 操作列「编辑」按钮

行为：
- 打开编辑客户模态框，预填当前客户信息
- 提交时调用 PATCH /api/customers/:id
- 成功：吐司「客户信息已更新」，关闭模态框，刷新列表
- 失败：吐司错误信息

## 文案定稿

| 用途 | 文案 |
|------|------|
| 搜索框占位 | 搜索客户姓名或手机号 |
| 新增客户 | 新增客户 |
| 表格列标题 | 姓名 / 手机号 / 订单总数 / 累计消费 / 最后下单时间 / 操作 |
| 编辑 | 编辑 |
| 确定 | 确定 |
| 取消 | 取消 |
| 添加成功 | 客户添加成功 |
| 更新成功 | 客户信息已更新 |
| 手机号重复 | 该手机号已存在 |
| 空状态 | 暂无客户，点击新增客户 |

## 数值常量

- 列表最大显示条数（MVP 不分页）：50条
- 搜索防抖时间：500ms
- 姓名最大长度：20字符
- 手机号长度：11位

## 关联文档

- 路由：/crm
- 接口：
  - GET /api/customers（支持 keyword, page, size）
  - POST /api/customers
  - PATCH /api/customers/:id
- 埋点：admin_crm_view, admin_crm_search, admin_crm_add, admin_crm_edit
- 权限：需登录

## 视觉锚点

![后台CRM客户管理](screenshots/admin_crm.png)
Figma链接：[待补充]

## MVP 砍除项（不实现）

- ❌ 客户详情抽屉（admin-crm-drawer-001）—— 整个组件不实现
- ❌ 客户订单历史表格（依赖详情抽屉）
- ❌「为该客户下单」快捷入口（依赖详情抽屉）
- ❌ 订单总数列点击跳转订单页带 customerId 筛选
- ❌ 客户备注字段（数据库与 API 不带 remark）
- ❌ 分页控件（前端固定取前 50 条）
- ❌ `GET /api/customers/:id`、`GET /api/customers/:id/orders` 接口（详情抽屉砍掉后无调用方）
