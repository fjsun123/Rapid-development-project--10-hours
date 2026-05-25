# 页面名称：后台UI组件库（admin_ui_library）

## 基本信息
- 页面ID：admin_ui_library_001
- 入口：独立路由 /ui-library，不在主导航菜单显示，仅供开发者和设计师预览
- 状态：静态展示页（无加载/异常状态）

## 元素清单（带ID）

### 1. 页面标题区（admin-ui-header-001）
- 标题「设计系统与组件库」
- 说明「此页面展示所有设计令牌和可复用组件」

### 2. 左侧导航锚点（admin-ui-nav-001）
- 垂直导航列表：
  - 颜色令牌
  - 字体排印
  - 间距刻度
  - 表面样式
  - 组件示例
  - 状态模式
- 点击滚动到对应区块

### 3. 颜色令牌区（admin-ui-colors-001）
- 区块标题「颜色令牌」
- 颜色分组卡片：
  - **主色组**：
    - color-primary（#F59E0B）- 主色
    - color-primary-hover（#D97706）- 主色悬停
  - **功能色组**：
    - color-secondary（#3B82F6）- 次要按钮
    - color-success（#10B981）- 成功
    - color-warning（#F97316）- 警告
    - color-error（#EF4444）- 错误
  - **文字色组**：
    - color-text-primary（#111827）- 主要文字
    - color-text-secondary（#6B7280）- 次要文字
    - color-text-placeholder（#9CA3AF）- 占位文字
  - **背景色组**：
    - color-bg-page（#F9FAFB）- 背景底色
    - color-bg-surface（#FFFFFF）- 卡片背景
    - color-bg-disabled（#F3F4F6）- 禁用背景
  - **边框色组**：
    - color-border（#E5E7EB）- 边框

### 4. 字体排印区（admin-ui-typography-001）
- 区块标题「字体排印」
- 样式示例卡片：
  - heading-1：28px / 36px / 600，「页面主标题」示例
  - heading-2：20px / 28px / 600，「区块标题」示例
  - heading-3：16px / 24px / 600，「卡片标题」示例
  - body-large：16px / 24px / 400，「表单标签、正文」示例
  - body-base：14px / 20px / 400，「表格内容、长文本」示例
  - caption：12px / 16px / 400，「辅助信息、时间戳」示例
- 字体族说明：system-ui, -apple-system, 'Segoe UI', Roboto

### 5. 间距刻度区（admin-ui-spacing-001）
- 区块标题「间距刻度（基于 8px）」
- 间距可视化卡片：
  - spacing-xs：4px
  - spacing-sm：8px
  - spacing-md：16px
  - spacing-lg：24px
  - spacing-xl：32px
  - spacing-2xl：48px
- 每个间距显示色条 + 数值

### 6. 表面样式区（admin-ui-surface-001）
- 区块标题「圆角、边框、阴影」
- **圆角示例**：
  - radius-sm：4px（按钮、输入框）
  - radius-md：8px（卡片）
  - radius-lg：12px（模态框）
  - radius-full：9999px（徽章、头像）
- **边框示例**：
  - border-default：1px solid #E5E7EB
  - border-focus：1px solid #F59E0B
- **阴影示例**：
  - shadow-sm：轻微阴影
  - shadow-md：中等阴影
  - shadow-lg：深度阴影

### 7. 组件示例区（admin-ui-components-001）
区块标题「可重用组件」

#### 7.1 按钮组件（admin-ui-button-001）
展示所有按钮类型和状态：
- 主要按钮：default / hover / focus / active / disabled
- 次要按钮：同上
- 文本按钮：同上
- 危险按钮：同上
- 图标按钮：带图标示例
- 尺寸变体：small / medium / large

#### 7.2 输入框组件（admin-ui-input-001）
- 文本输入框：default / focus / disabled / error / success
- 数字输入框
- 复选框：unchecked / checked / disabled
- 单选框：unchecked / checked / disabled
- 开关：off / on / disabled
- 日期选择器

#### 7.3 下拉选择组件（admin-ui-select-001）
- 单选下拉：default / expanded / selected / disabled
- 多选下拉：已选标签显示
- 分组下拉

#### 7.4 模态框组件（admin-ui-modal-001）
- 打开模态框按钮：点击弹出示例模态框
- 模态框示例：
  - 标题、内容、底部按钮
  - 点击遮罩或ESC可关闭

#### 7.5 卡片组件（admin-ui-card-001）
- 信息卡片：标题 + 内容 + 操作
- 统计卡片：数值 + 单位 + 图标

#### 7.6 表格组件（admin-ui-table-001）
- 示例表格：3列 × 5行
- 排序功能
- 操作列

#### 7.7 徽章组件（admin-ui-badge-001）
- 状态徽章：进行中 / 成功 / 警告 / 错误 / 禁用

#### 7.8 导航组件（admin-ui-nav-001）
- 侧边栏菜单项：default / hover / active / disabled
- 面包屑：首页 > 订单 > 详情
- 标签页：Tab切换示例

#### 7.9 骨架屏组件（admin-ui-skeleton-001）
- 卡片骨架
- 表格骨架
- 列表骨架

#### 7.10 反馈组件（admin-ui-feedback-001）
- 吐司触发按钮：
  - 成功吐司
  - 错误吐司
  - 警告吐司
- 吐司位置：右上角，4秒自动消失

### 8. 状态模式区（admin-ui-states-001）
区块标题「语义状态」
- 加载状态：骨架屏和Spinner示例
- 空状态：居中插图 + 说明 + 引导按钮
- 成功状态：绿色吐司示例
- 警告状态：橙色吐司/内联提示示例
- 错误状态：红色吐司 + 表单内联错误示例

## 交互逻辑

### A. 导航锚点跳转（admin-ui-nav-jump）
触发：点击左侧导航项

行为：
- 页面滚动到对应区块
- 导航项高亮当前区块

### B. 打开模态框演示（admin-ui-modal-demo）
触发：点击「打开模态框」按钮

行为：
- 弹出示例模态框
- 点击遮罩、ESC或取消按钮可关闭

### C. 触发吐司演示（admin-ui-toast-demo）
触发：点击吐司触发按钮

行为：
- 右上角弹出对应颜色吐司
- 4秒后自动消失
- 多个吐司可堆叠（最多3条）

### D. 表单控件交互（admin-ui-form-demo）
触发：点击复选框、开关、下拉等

行为：
- 实时展示状态变化
- 仅展示效果，不调用接口

## 文案定稿

| 用途 | 文案 |
|------|------|
| 页面标题 | 设计系统与组件库 |
| 页面说明 | 此页面展示所有设计令牌和可复用组件 |
| 导航项 | 颜色令牌 / 字体排印 / 间距刻度 / 表面样式 / 组件示例 / 状态模式 |
| 区块标题 | 颜色令牌 / 字体排印 / 间距刻度（基于 8px）/ 圆角、边框、阴影 / 可重用组件 / 语义状态 |
| 按钮示例 | 主要按钮 / 次要按钮 / 文本按钮 / 危险按钮 |
| 模态框示例标题 | 示例模态框 |
| 模态框示例内容 | 这是一个模态框示例 |
| 成功吐司 | 操作成功 |
| 错误吐司 | 操作失败 |
| 警告吐司 | 请注意 |
| 空状态示例 | 暂无数据，点击添加 |
| 空状态按钮 | 添加数据 |

## 数值常量

- 颜色色块尺寸：120×60px
- 间距可视化条高度：40px
- 示例表格行数：5
- 吐司自动消失时间：4秒
- 吐司最大堆叠数：3条

## 关联文档

- 路由：/ui-library（不在主导航显示）
- 接口：无（静态展示页）
- 埋点：无（仅供开发/设计预览）
- 权限：无限制（开发环境）

## 视觉锚点

![后台UI组件库](screenshots/admin_ui_library.png)
Figma链接：[待补充]