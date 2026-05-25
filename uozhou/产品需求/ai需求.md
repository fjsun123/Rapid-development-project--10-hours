餐厅管理仪表板系统 PRD
文档版本	日期	作者	变更说明
1.0	2026-05-22	AI	初稿，包含设计系统与后端
1. 产品概述
本产品是一套面向餐厅管理员的 PC Web 仪表板系统，提供可视化的经营数据、订单全流程管理、客户管理、菜单管理及业务设置。系统包含严格的设计系统、可复用 UI 组件库，并配备真实的后端订餐服务，实现前后端一体化的业务闭环。

1.1 目标用户
餐厅管理员 / 店长

运营人员

1.2 核心能力
统一的设计系统与组件库

5 个核心业务页面

后端 API 支持完整的订餐业务逻辑（菜单、订单、客户、设置）

严格的订单状态流转和金额服务端计算

2. 设计系统（全局令牌）
所有页面与组件必须严格遵循以下令牌。

2.1 颜色令牌
用途	令牌名	十六进制
主色	color-primary	#F59E0B
主色悬停	color-primary-hover	#D97706
次要按钮	color-secondary	#3B82F6
成功	color-success	#10B981
警告	color-warning	#F97316
错误	color-error	#EF4444
背景底色	color-bg-page	#F9FAFB
卡片背景	color-bg-surface	#FFFFFF
主要文字	color-text-primary	#111827
次要文字	color-text-secondary	#6B7280
占位文字	color-text-placeholder	#9CA3AF
边框	color-border	#E5E7EB
禁用背景	color-bg-disabled	#F3F4F6
2.2 字体排印
样式名	字号	行高	字重	用途
heading-1	28px	36px	600	页面主标题
heading-2	20px	28px	600	区块标题
heading-3	16px	24px	600	卡片标题
body-large	16px	24px	400	表单标签、正文
body-base	14px	20px	400	表格内容、长文本
caption	12px	16px	400	辅助信息、时间戳
字体族：system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif

2.3 间距刻度（基于 8px）
令牌名	值
spacing-xs	4px
spacing-sm	8px
spacing-md	16px
spacing-lg	24px
spacing-xl	32px
spacing-2xl	48px
2.4 圆角、边框、阴影、坡度
属性	值
radius-sm	4px（按钮、输入框）
radius-md	8px（卡片）
radius-lg	12px（模态框）
radius-full	9999px（徽章、圆形头像）
border-default	1px solid #E5E7EB
border-focus	1px solid #F59E0B
shadow-sm	0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md	0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow-lg	0 10px 15px -3px rgb(0 0 0 / 0.1)
坡度（hover 提升）	轻微上升平移 + 阴影加深
2.5 布局 / 网格规则
左侧固定侧边栏宽度 256px，右侧主内容区自适应。

右侧内容区内边距：spacing-lg（24px）。

采用 12 列网格 布局卡片列表，断点采用 min-width: 1200px。

侧边栏导航可折叠（可选）。

2.6 语义状态
状态	视觉表现
加载	骨架屏或局部 Spinner，不破坏布局
空	居中插图 + 说明文字 + 引导按钮（如“添加第一道菜”）
成功	绿色吐司，自动消失（4 秒）
警告	橙色吐司或内联提示，需手动关闭
错误	红色吐司 + 表单内联错误，错误信息清晰
2.7 模式组件通用行为
模态框：点击遮罩或按 ESC 可关闭（对于表单类弹窗，若用户已输入内容则需二次确认）。

抽屉：右侧滑出，用于详情查看或复杂表单。

吐司：位置右上角，同时最多显示 3 条，自动堆叠。

3. UI 组件库页面（/ui-library）
此页面供开发者和设计师预览所有设计令牌和组件状态。

3.1 展示内容
颜色令牌：所有颜色色块 + 名称 + 色值，分组展示。

字体排印：每个文字样式示例。

间距刻度：可视化间距条。

表面样式：不同圆角、阴影的卡片示例。

可重用组件（每个组件需展示 default / hover / focus / active / disabled 状态）：

按钮（主要、次要、文本、危险、图标按钮）

输入框及表单控件（文本、数字、复选框、单选框、开关、日期选择器）

下拉选择 / 菜单（单选、多选、分组）

模态框 / 对话框（提供“打开”按钮展示示例）

卡片 / 表面（信息卡片、统计卡片）

表格 / 列表（带排序、操作列）

徽章 / 状态指示器（进行中、成功、警告、错误、禁用）

导航元素（侧边栏菜单项、面包屑、标签页）

骨架屏 / 加载状态（卡片骨架、表格骨架）

反馈 / 吐司提示模式（成功、错误、警告示例触发按钮）

3.2 交互要求
模态框演示：点击按钮弹出示例模态框。

吐司演示：点击按钮触发不同类别的吐司。

表单控件支持实时编辑以展示状态变化。

4. 仪表板页面详细需求
全局左侧导航包含以下菜单：首页、订单、CRM、菜单、设置。UI 库页面不显示在主菜单，通过独立路由访问。

4.1 首页（/dashboard）
4.1.1 页面元素与数据
元素	数据来源	交互
KPI 卡片（4个）	总订单数、今日营收、待处理订单数、热门商品名称	热门商品名称悬浮显示 Tooltip；待处理订单卡片点击跳转订单页并筛选“待接单”
近7天订单趋势图	每日订单量（折线图）	鼠标悬浮显示具体数值；无数据时显示占位提示
最近订单列表（5条）	订单号、客户名、总额、状态	点击行打开订单详情抽屉（复用订单页抽屉）
手动刷新按钮	触发所有数据重新加载	显示 loading 状态，成功吐司“已刷新”，失败吐司错误
4.1.2 状态处理
加载：骨架屏（卡片骨架 + 图表骨架 + 表格骨架）

空：无订单时显示“暂无订单，去创建第一单”

错误：显示重试按钮

4.2 订单管理（/orders）
4.2.1 筛选区
订单状态下拉（多选）：待接单、已接单（制作中）、待出餐、已完成、已取消

日期范围选择器（今天、本周、自定义）

搜索框（订单号 / 客户名）

重置按钮

4.2.2 订单表格
列：订单号、客户、总金额、状态、创建时间、操作（查看详情、更新状态）

分页：每页 20 条

操作列“更新状态”按钮仅当当前状态存在合法可跳转目标时显示

4.2.3 创建订单模态框
步骤1：选择客户（下拉搜索现有客户 + “新增客户”短表单）

步骤2：添加菜品（按分类展示可用菜品，数量输入，实时小计）

步骤3：确认总金额（只读，后端预计算，但前端也展示合计供预览）

提交时前端校验（至少一个菜品、客户已选）→ 调用 POST /api/orders

成功关闭模态框并刷新订单列表；失败保留表单显示错误

4.2.4 订单详情抽屉
订单基本信息、订单项列表、状态时间线

内部包含“更新状态”按钮（复用状态更新逻辑）

4.2.5 状态更新
点击“更新状态”打开抽屉，展示当前状态可转换的目标状态（由后端 /api/orders/:id/available-status 提供）

确认后调用 PATCH /api/orders/:id/status → 成功刷新列表和详情抽屉（若打开）→ 失败显示错误

4.2.6 状态处理
表格加载：骨架屏

空筛选：显示空状态（“没有找到订单，试试清除筛选条件”）

操作反馈：吐司成功/失败

4.3 客户关系管理（CRM）（/crm）
4.3.1 客户列表
列：姓名、手机号、订单总数、累计消费金额、最后下单时间

支持按姓名/手机号搜索

分页（每页 15 条）

点击行打开客户详情抽屉

4.3.2 新增/编辑客户模态框
字段：姓名（必填）、手机号（必填，唯一校验）

提交调用 POST /api/customers 或 PATCH /api/customers/:id

4.3.3 客户详情抽屉
客户基本信息 + 编辑按钮

历史订单表格（订单号、日期、金额、状态），点击行打开订单详情抽屉

“为该客户下单”按钮：关闭当前抽屉，打开创建订单模态框并预填充客户 ID

4.3.4 状态处理
列表加载骨架屏，空状态显示“暂无客户，点击新增客户”

4.4 菜单管理（/menu）
4.4.1 左侧分类区
分类列表（显示所有分类，可增删改）

新增分类按钮 → 弹出模态框（名称、排序权重）

点击分类，右侧显示该分类下的菜品

4.4.2 右侧菜品管理
顶部：当前分类名 + “新增菜品”按钮 + 批量上架/下架按钮

菜品表格：复选框、图片（缩略图）、名称、分类、售价（元）、库存、上架状态（开关）、操作（编辑、删除）

分页（每页 10 条）

4.4.3 新增/编辑菜品模态框
字段：名称（必填）、分类（下拉）、售价（正整数，分）、库存（非负整数，-1表示不限）、描述、图片URL、上架状态

4.4.4 交互规则
上架状态开关：乐观更新（点击后立即切换UI，调用 API 更新，失败则回滚）

删除菜品：二次确认 → 调用 DELETE，若有关联未完成订单则后端拒绝并提示

批量上下架：选中菜品 → 二次确认 → 调用批量接口（或循环调用）

4.4.5 状态处理
空分类：显示“此分类下暂无菜品，点击新增菜品”

4.5 设置（/settings）
4.5.1 设置项
预计出餐准备时间（分钟，数字输入，1~180）

自动接受新订单（开关）

门店营业状态（开关：营业中/已打烊）

每日营业时间（两个时间选择器：开始时间、结束时间）

4.5.2 交互
所有修改通过“保存”按钮统一提交（调用 PUT /api/settings）

前端校验（准备时间范围、结束时间>开始时间）

保存时按钮 loading，成功吐司，失败显示错误

提供“重置”按钮恢复至上次保存值

5. 后端订餐系统设计
5.1 数据模型（TypeScript 定义）
typescript
// 门店（单门店场景可简化为全局，但为了扩展保留）
interface Store {
  id: string;
  name: string;
}

// 客户
interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;   // 分
  orderCount: number;
  lastOrderAt: Date;
  createdAt: Date;
}

// 菜品分类
interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

// 菜单项
interface MenuItem {
  id: string;
  name: string;
  price: number;        // 分
  originalPrice?: number;
  categoryId: string;
  available: boolean;
  stock: number;        // -1 表示不限
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 订单状态
type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

// 订单
interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  totalAmount: number;   // 分，服务端计算
  status: OrderStatus;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 订单项
interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;   // 快照
  unitPrice: number;      // 快照价格（分）
  quantity: number;
  total: number;          // unitPrice * quantity
}

// 业务设置（单门店全局）
interface Settings {
  prepTimeMin: number;      // 1-180
  autoAccept: boolean;
  isOpen: boolean;          // 营业状态
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string;   // "22:00"
}
5.2 订单状态流转规则（强制）
合法转换：

pending → confirmed（商家接单） / cancelled

confirmed → ready（出餐） / cancelled

ready → completed

禁止：逆向、跨级、取消已完成订单。

5.3 核心业务规则
创建订单：

验证 customerId 存在。

验证所有 menuItemId 存在且 available = true，若 stock >= 0 则检查库存充足。

服务端基于 unitPrice（当前菜品价格）和 quantity 重新计算每个订单项总额及订单总额，拒绝前端传入的 totalAmount。

初始状态为 pending；若设置 autoAccept = true，则自动将状态转为 confirmed。

扣减库存（若 stock >= 0）。

更新订单状态：

只能通过 PATCH /api/orders/:id/status 端点，请求体 { status: targetStatus }。

后端校验合法性，非法转换返回 400 及错误码。

取消订单：

若订单状态为 pending 或 confirmed，可取消，取消后恢复已扣减的库存。

已完成订单不可取消。

金额服务端计算：订单任何查询均返回服务端存储的总额，不接受前端修改。

删除菜单项：若存在未完成订单（状态不是 completed 或 cancelled）引用该菜品，禁止删除，返回错误。

5.4 API 端点清单
方法	路径	描述	校验说明
GET	/api/menu-items	获取菜单项（支持 ?categoryId=xxx&available=true）	
POST	/api/menu-items	新增菜单项	价格 > 0，分类存在
PATCH	/api/menu-items/:id	更新菜单项	若更新库存，需验证非负
DELETE	/api/menu-items/:id	删除菜单项	若存在未完成订单引用则拒绝
GET	/api/categories	获取所有分类	
POST	/api/categories	新增分类	名称必填
PATCH	/api/categories/:id	编辑分类	
DELETE	/api/categories/:id	删除分类（同时删除其下菜品？建议先转移或拒绝）	若分类下有菜品则拒绝
GET	/api/customers	客户列表（支持 ?keyword=xxx&page=1&size=15）	
POST	/api/customers	新增客户	手机号唯一
PATCH	/api/customers/:id	编辑客户	手机号唯一
GET	/api/customers/:id/orders	某客户的历史订单	
POST	/api/orders	创建订单	服务端计算总额，校验菜品可用性与库存
GET	/api/orders	订单列表（支持 ?status=pending,confirmed&page=1&size=20）	
GET	/api/orders/:id	订单详情	
PATCH	/api/orders/:id/status	更新订单状态	严格遵循状态机，返回新状态
GET	/api/orders/:id/available-status	获取当前订单可转换的状态列表	基于状态机计算
GET	/api/settings	获取业务设置	
PUT	/api/settings	更新设置	校验准备时间范围、营业时间逻辑
GET	/api/dashboard/stats	今日订单数、今日收入、待处理订单数、热门商品（销量最高）	
GET	/api/dashboard/trend	近7天每日订单量（用于图表）	
5.5 错误响应格式
所有错误响应使用统一 JSON 结构，HTTP 状态码为 400, 404, 422, 500。

json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "菜品「汉堡」库存不足，当前剩余 2 份"
  }
}
常见错误码：

INVALID_ORDER_ITEMS – 菜品不可用或不存在

INSUFFICIENT_STOCK – 库存不足

INVALID_STATUS_TRANSITION – 非法的状态转换

DUPLICATE_PHONE – 客户手机号重复

VALIDATION_FAILED – 字段校验不通过

6. 种子数据与本地引导
为便于本地审查，项目启动时自动运行初始化脚本（使用 SQLite 或内存数据库）：

6.1 基础数据
门店：默认门店 “望京店”（ID=1）

分类：

主菜（sortOrder=1）

饮料（sortOrder=2）

主食（sortOrder=3）

菜单项：

名称	价格(分)	分类	可用	库存
汉堡	3800	主菜	true	100
薯条	1800	主菜	true	-1
可乐	1000	饮料	false	50
炒饭	2500	主食	true	30
客户：

张三，13800000000，累计消费 0，订单数 0

李四，13912345678，累计消费 0，订单数 0

订单示例：

已完成订单：订单号 ORD001，客户张三，总金额 3800，状态 completed，下单时间 2026-05-21

待接单订单：订单号 ORD002，客户李四，总金额 1800，状态 pending，下单时间 2026-05-22

设置：

准备时间：20 分钟

自动接单：true

营业状态：true

营业时间：09:00 ~ 22:00

6.2 启动方式
前端：npm run dev（React + Vite，端口 5173）

后端：npm run start（Node + Express + SQLite，端口 3001）

前端代理 /api 到 http://localhost:3001

访问 http://localhost:5173 即可使用，无需登录（演示环境）

7. 非功能性要求
视觉一致性：严格使用设计系统令牌，禁止硬编码颜色或间距。

响应式：最小支持宽度 1280px，侧边栏可折叠。

可访问性：键盘可聚焦，语义化 HTML，按钮有 cursor: pointer，表单控件有标签。

性能：列表接口支持分页，图表数据轻量。

