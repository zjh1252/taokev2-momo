# taoke-uniapp · AI 协作规范（AGENTS.md）

本文件是 `taoke-uniapp` 子项目的 SOP，团队成员与 AI 编码助手在本目录下工作时必须遵守。
它不重复根目录全局规范（编码风格、注释语言、布尔字段命名等），仅聚焦本子项目特有的关注点。

---

## 0. 项目目标

- 一个代码库交付：**H5（首期）→ 微信小程序 → Android → iOS**
- 业务领域：淘课网移动端（首页 / 专家 / 公开课 / 我的 / 登录注册 / 课程详情 / 专家详情）
- 设计来源：[design_stitch/](design_stitch/) 下 Stitch（Google AI）输出的 7 张高保真原型

## 1. 技术栈（定死，不混用）

| 维度 | 选型 |
|---|---|
| 框架 | uni-app + Vue 3（`<script setup>`，组合式 API） |
| 语言 | JavaScript 优先；如需 TS 全局统一 |
| 包管理器 | **HBuilderX 内置**（当前阶段，无 package.json）；二期切 CLI 后用 `pnpm` |
| 状态管理 | Pinia |
| 原子样式 | 当前：scoped SCSS + 小型工具类 [styles/common.scss](styles/common.scss)；TODO：二期切 CLI 后接入 UnoCSS + `@uni-helper/unocss-preset-uni` |
| 基础组件 | `uni-ui`（uni_modules 已安装） |
| 字体图标 | iconfont.cn（unicode 模式），统一封装为 `<TkIcon>` |
| 网络 | `uni.request` 自封 `utils/request.js`，统一解包 `ApiResponse<T>` |
| 配置管理 | [configs/env.js](configs/env.js) + [configs/index.js](configs/index.js) 集中管理；`process.env.NODE_ENV` 区分 dev/prod；业务统一 `import config from '@/configs'` |
| 单位 | rpx（基准 375，1px = 2rpx） |

> **禁止**：直接引入 Tailwind CSS、直接使用 `material-symbols-outlined` 字体、直接使用 `document/window/localStorage` 等浏览器专属 API（用 `uni.*` 替代）。

## 2. 目录约定

```
taoke-uniapp/
├── api/                   # 按域拆分的接口模块（auth.js / user.js / course.js / interaction.js ...）
├── components/            # 全局公共组件（Tk* 前缀）
├── configs/               # 全局配置（env.js 环境矩阵 / index.js 跨端组装）
├── pages/
│   ├── home/              # tab 1
│   ├── expert/            # tab 2 + 详情
│   ├── course/            # tab 3 + 详情
│   ├── user/              # tab 4
│   └── auth/              # 登录 / 注册
├── stores/                # Pinia stores（user / dict / cart ...）
├── static/
│   ├── tabbar/            # 原生 tabBar 图标（每 tab 灰/红 2 张 PNG，81×81 @3x）
│   └── iconfont/          # iconfont.ttf + 对应 css
├── styles/                # 全局 SCSS：tokens.scss / mixins.scss / common.scss
├── utils/                 # request / auth / format / mock 等
├── uni.scss               # 设计令牌入口（@import styles/tokens.scss）
└── pages.json             # 页面注册 + 原生 tabBar 配置
```

**命名约定**：
- 公共组件统一 `Tk*` 前缀（`TkIcon` / `TkNavBar` / `TkSearchBar` / `TkCourseCard` / `TkExpertCard` / `TkCategoryGrid` / `TkBottomActions` / `TkEmpty` / `TkLoading`）
- 页面文件 `kebab-case.vue`
- API 方法名采用动宾命名（`fetchCourseList` / `loginByPassword`）

## 3. 设计令牌（Design Tokens）

所有颜色 / 圆角 / 阴影 / 间距 **只能引用 token，禁止硬编码**。Token 定义在 [uni.scss](uni.scss) / `styles/tokens.scss`：

```scss
// 主色（与 PC 端 home_frontend-demo 对齐）
$tk-primary:         #E62117;
$tk-primary-pressed: #C41C14;
$tk-primary-soft:    rgba(230,33,23,0.10);

// 背景与字
$tk-bg-page:   #F7F9FC;
$tk-bg-card:   #FFFFFF;
$tk-text-1:    #1B1C1C;   // 主字
$tk-text-2:    #666666;   // 次字
$tk-text-3:    #5E5E5E;
$tk-divider:   #E0E3E6;
$tk-star:      #F59E0B;

// 圆角
$tk-radius-sm: 12rpx;
$tk-radius-md: 24rpx;
$tk-radius-lg: 32rpx;     // Stitch 中的 rounded-2xl
$tk-radius-xl: 48rpx;
$tk-radius-full: 9999rpx;

// 阴影
$tk-shadow-card: 0 4rpx 20rpx rgba(0,0,0,0.04);
$tk-shadow-pop:  0 8rpx 32rpx rgba(0,0,0,0.08);
```

字体：H5 用 Google Fonts `Manrope/Inter`；小程序 / App 直接 fallback 系统字体（`-apple-system, "PingFang SC", sans-serif`），不强制下载远程字体。

## 4. Stitch → uniapp 落地方法论（核心 SOP）

把 Stitch 输出当作 **「高保真视觉规范 + DOM 草稿」**，不是生产代码可直接搬。

### 4.1 三层落地法

**第一层 · 设计令牌（一次性）**

从 Stitch 的 tailwind config（每个 `code.html` 顶部）抽出 colors / radius / fontFamily / spacing 写入 `uni.scss`，业务页只引 token。

**第二层 · 原子工具类（Tailwind 跨端替代）**

引入 UnoCSS：90% 的 tailwind class 原样可用（`flex / gap-2 / p-4 / text-sm / rounded-2xl / space-y-3 / items-center / justify-between`）。preset 自动把 `p-4`(16px) → `32rpx`。

**跨端黑名单 class**（review 时改写为 scoped SCSS）：

| Class 模式 | 不兼容平台 | 替代方案 |
|---|---|---|
| `backdrop-blur-*` / `bg-clip-text` / `mix-blend-*` | 小程序无滤镜 | 删除 / 用半透明背景近似 |
| `ring-*` / `peer-*` / `group:hover` / `group:focus` | 小程序无 `:peer`/`:has` | 用 `:active` + scoped SCSS |
| 复杂 `bg-gradient-to-r from-X via-Y to-Z` | 部分小程序异常 | 改 SCSS `linear-gradient(...)` |
| `dark:*` | 首期不做 | 全部删除 |
| `min-h-[100dvh]` / `*-[Xpx]` 任意值语法 | 小程序 class 名限制 | 用 scoped SCSS |
| `hover:*` | 小程序无 hover | 改 `active:*` 或 `:active` |

**第三层 · 组件抽象**

「重复度 ≥ 2 抽组件」原则。组件命名沿用 [design_stitch/app_2/DESIGN.md](design_stitch/app_2/DESIGN.md) 的语义块：`nav-bar / search-bar / category-grid / course-list / expert-card / tab-bar`。

### 4.2 HTML → SFC 机械翻译规则表

| Stitch HTML | uniapp SFC | 说明 |
|---|---|---|
| `<div>` | `<view>` | 跨端通用容器 |
| `<span>` / `<p>` / `<h1-h6>` 包文本 | `<text>` | uniapp 强制：纯文本必须包在 text 内 |
| `<img src>` | `<image src mode="aspectFill">` | mode 必填 |
| `<button>` | `<view @tap>` 或 `<button plain="true">` | 原生 button 默认带边框，业务里基本都用 view+@tap |
| `<input>` | `<input>` | placeholder 颜色用 `placeholder-style` 属性 |
| `<a href="x">` | `<navigator url="x">` 或 `@tap="uni.navigateTo({url:'x'})"` | |
| `onClick` | `@tap` | 避免小程序 click 的 300ms 延迟 |
| `class="material-symbols-outlined">menu` | `<TkIcon name="menu" />` | 所有图标统一走 TkIcon |
| `position: fixed` 顶部 | `pages.json` 配自定义 navBar；详情头图通栏例外 | |
| `position: fixed` 底部 tabBar | `pages.json` 原生 tabBar | 不在页面里写底部 nav |
| `env(safe-area-inset-*)` | H5 直接生效；App 在 pages.json 加 `"safearea"`；小程序自动 | SCSS 写 `constant() + env()` 双行兼容旧 iOS |
| `min-h-[100dvh]` | `min-height: 100vh` | dvh 小程序不支持 |
| `px` 数值 | `rpx`（×2） | UnoCSS preset 自动；scoped SCSS 手动 |

### 4.3 AI 辅助迁移流程

1. AI prompt 必带 §4.2 规则表与 §4.1 黑名单
2. **一次只喂一个 section**（搜索栏 / 单个卡片 / Banner），**不要喂整页**
3. 产出 Vue 3 SFC（`<script setup>`） + scoped SCSS
4. 人工 review：抽组件、合并 token、清理黑名单 class
5. H5 + 微信开发者工具模拟器各跑一遍

### 4.4 质量门禁（防止后期返工）

业务页面（`pages/**/*.vue`、`components/**/*.vue`）禁止出现：

- `material-symbols-outlined` 字符串（必须走 `<TkIcon>`）
- 任何 `px` 数值（必须 rpx；少量 1px 边框可写 `1px` 但需注释说明）
- 黑名单 class（见 §4.1 表格）
- 硬编码颜色 / 阴影（必须引 `$tk-*` token）
- `document` / `window` / `localStorage`（用 `uni.*`）
- `<div>` / `<span>` / `<p>` / `<a>`（用 view/text/navigator）

每页提交前 H5 + 微信开发者工具模拟器双端冒烟。

## 5. 网络层规范

### 5.1 baseURL（来自 configs，禁止散落在业务文件）

```js
// utils/request.js
import config from '@/configs';
const baseURL = config.baseURL;
const TIMEOUT = config.timeout;
```

平台分支与环境矩阵全部收敛到 [configs/index.js](configs/index.js) + [configs/env.js](configs/env.js)：

- **dev**：H5 / 小程序 / App 统一直连 `http://localhost:8080`（后端 [CorsFilterConfig](../backend/taoke-app/src/main/java/com/taoke/app/filter/CorsFilterConfig.java) 默认 `allowed-origins=*`）
- **小程序模拟器 / App 真机预览**：`localhost` 指设备本身，需把 `configs/env.js` 中 `development.API_BASE_URL_NATIVE` 改为开发者机器局域网 IP（如 `http://192.168.1.100:8080`）
- **prod**：当前是占位域名 `https://api.taoke.com`，上线前替换；小程序还需在公众平台配合法域名白名单
- **环境切换**：HBuilderX 「运行 → 浏览器/小程序模拟器」自动注 `NODE_ENV=development`；「发行」自动注 `NODE_ENV=production`，无需额外脚本

### 5.2 拦截规则

- 请求拦截：自动注入 `Authorization: Bearer ${token}`
- 响应拦截：解包 `ApiResponse<T>`（`code/message/data`）
  - `code === 0` → 返回 `data`
  - `code !== 0` → `uni.showToast({ title: message })` 并 reject
  - HTTP 401 → 清 token + `uni.reLaunch({ url: '/pages/auth/login' })`

### 5.3 后端接口现状（已就绪，可直接对接）

| 域 | 接口 | Controller |
|---|---|---|
| 鉴权 | `/auth/login` `/auth/login/sms` `/auth/send-code` `/auth/register` `/auth/refresh` `/auth/reset-password` | [AuthController](../backend/taoke-user/src/main/java/com/taoke/user/controller/AuthController.java) |
| 用户 | `/users/me` `/users/me/password` `/users/me/phone` | [UserController](../backend/taoke-user/src/main/java/com/taoke/user/controller/UserController.java) |
| 通知 | `/notifications` `/notifications/unread-count` `/notifications/{id}/read` | [NotificationController](../backend/taoke-user/src/main/java/com/taoke/user/controller/NotificationController.java) |
| 专家 | `/trainers/{id}` `/trainers/{id}/cases` `/trainers/{id}/highlights` | [TrainerController](../backend/taoke-user/src/main/java/com/taoke/user/controller/TrainerController.java) |
| 机构 | `/institutions` `/institutions/{id}` | [InstitutionController](../backend/taoke-user/src/main/java/com/taoke/user/controller/InstitutionController.java) |
| 课程 | `/courses` `/courses/{id}` `/trainers/{id}/recommended-courses` `/opencourses/hot` | [PublicCourseController](../backend/taoke-course/src/main/java/com/taoke/course/controller/PublicCourseController.java) |
| 视频 | `/videos` `/videos/{id}` `/videos/categories` | [PublicVideoController](../backend/taoke-course/src/main/java/com/taoke/course/controller/video/PublicVideoController.java) |
| 互动 | `/interaction/reviews` `/interaction/favorites` `/interaction/likes` `/interaction/states` | [interaction/](../backend/taoke-course/src/main/java/com/taoke/course/controller/interaction) |
| 订单 | `/orders` `/payments` `/cart/items` | [order/](../backend/taoke-course/src/main/java/com/taoke/course/controller/order) |
| 学习 | `/learning/videos` `/learning/courses` `/learning/continue` | [LearningController](../backend/taoke-course/src/main/java/com/taoke/course/controller/LearningController.java) |
| 需求 | `/demands` `/demands/mine` | [DemandController](../backend/taoke-course/src/main/java/com/taoke/course/controller/demand/DemandController.java) |

> 首页 Banner / CMS 轮播 暂无独立接口，参考 [frontend](../frontend) 的方案（多用 `/opencourses/hot` 顶替）。

## 6. 路由与导航

- TabBar 4 项使用 **uni-app 原生 tabBar**（`pages.json` 配置），共需 8 张 PNG（每 tab 灰/红 2 张，81×81 @3x，放 `static/tabbar/`）
- 页面跳转优先用 `uni.navigateTo`（保留来源页栈）；切 tab 用 `uni.switchTab`；详情→列表回退用 `uni.navigateBack`
- 全局拦截需登录的页面：在 `utils/auth.js` 暴露 `requireLogin()` helper，业务页面在 `onLoad` 调用

## 7. 开发与调试

- 启动 H5：HBuilderX 运行 → 浏览器；或 CLI `pnpm dev:h5`
- 启动微信小程序：HBuilderX 运行 → 微信开发者工具
- 跨域：dev 默认直连 `http://localhost:8080`，依赖后端 `CorsFilterConfig` 的 `allowed-origins=*`；不再依赖 vite proxy（[manifest.json](manifest.json) 中残留的 `h5.devServer.proxy` 配置已闲置，可清理，见 §10 TODO）

## 8. 提交前自检清单

- [ ] 没有 `material-symbols-outlined` 字符串
- [ ] 没有 `px` 数值（除 `1px` 边框）
- [ ] 没有 §4.1 黑名单 class
- [ ] 没有硬编码颜色（grep `#[0-9a-fA-F]{6}`，全部应在 token）
- [ ] 没有 `<div>` / `<span>` / `<p>` / `<a>`
- [ ] 没有 `document` / `window` / `localStorage`
- [ ] H5 + 微信开发者工具模拟器双端跑过

## 9. 当前进度（Iteration 1 已完成）

- 基础设施：`uni.scss` / `styles/{tokens,mixins,common}.scss` / `pages.json` 原生 tabBar / `App.vue` + Pinia
- 配置层：[configs/env.js](configs/env.js)（dev/prod 环境矩阵）+ [configs/index.js](configs/index.js)（跨端组装）
- 网络与状态：[utils/request.js](utils/request.js)（baseURL/timeout 已接 configs）、[utils/auth.js](utils/auth.js)、[stores/user.js](stores/user.js)
- API 模块：[api/auth.js](api/auth.js)、[api/user.js](api/user.js)、[api/course.js](api/course.js)、[api/expert.js](api/expert.js)、[api/interaction.js](api/interaction.js)
- 公共组件：`TkIcon` / `TkNavBar` / `TkSearchBar` / `TkCourseCard` / `TkExpertCard` / `TkEmpty` / `TkLoading`
- 首页 [pages/home/index.vue](pages/home/index.vue) 完整实现（接口失败自动回退 mock），其余 6 页占位

## 10. 已知 TODO

- [ ] **tabBar 图标**：当前用 `static/c1.png ~ c8.png` 作占位（设计上不匹配），需替换为 4 组（默认/激活）红灰单色 PNG，尺寸 81×81 @3x，放 `static/tabbar/`
- [ ] **真实生产域名补全**：[configs/env.js](configs/env.js) 中 `production` 段的 `API_BASE_URL` / `API_BASE_URL_NATIVE` / `CDN_BASE_URL` 当前是占位（`https://api.taoke.com` / `https://cdn.taoke.com`），上线前替换
- [ ] **微信小程序 appid**：[configs/index.js](configs/index.js) 的 `wxAppId` 与 [manifest.json](manifest.json) 的 `mp-weixin.appid` 需同步填写
- [ ] **真机调试 IP**：小程序模拟器 / App 真机预览时 `localhost` 指设备本身，需把 [configs/env.js](configs/env.js) 中 `development.API_BASE_URL_NATIVE` 改成开发者机器局域网 IP；多人协作时考虑用 `configs/local.js`（gitignore）覆盖
- [ ] **CLI 切换后改 env 来源**：升级到 `@dcloudio/vite-plugin-uni` 后，新建 `.env.development` / `.env.production`，把 [configs/env.js](configs/env.js) 中 `ENV_MAP` 改为读 `import.meta.env.VITE_*`，业务代码无需改动
- [ ] **清理 manifest devServer.proxy**：dev 已直连 `http://localhost:8080`，[manifest.json](manifest.json) 中 `h5.devServer.proxy` 配置已闲置，可在确认无依赖后移除
- [ ] **UnoCSS 接入**：项目升级为 CLI（`@dcloudio/vite-plugin-uni`）后引入 `@uni-helper/unocss-preset-uni`，让 Tailwind 风格类直接可用
- [ ] **iconfont 扩展**：业务深入后若 `uni-icons` 内置图标不够，从 iconfont.cn 自建项目，扩展 `TkIcon` 的 NAME_MAP
- [ ] **首页 banner 接口**：等后端 CMS 接口或对照 [frontend](../frontend) 现有调用方式替换 mock
- [ ] **搜索跨页传参**：当前 `onSearch` 只 switchTab，关键字未传到目标 tab 页，待用 store 或 event-bus 实现

## 11. 禁止事项

- 禁止读取 `/AGENTS.md` 与 `/docs/**`（参考 `/docs/tmp/mine/AGENTS.md`）
- 禁止在业务代码内引入 Tailwind CSS（用 UnoCSS preset）
- 禁止直接修改 `uni_modules/` 下 uni-ui 源码（如需扩展用包装组件）
- 禁止把 `static/iconfont/` 中字体文件用于 H5 之外的硬编码引用，必须经 `<TkIcon>`
