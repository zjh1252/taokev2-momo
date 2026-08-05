# 淘课网移动端 · PDF4 测试问题修复设计

**日期：** 2026-06-29  
**范围：** `taoke-uniapp`（微信小程序 / H5）  
**来源：** `testdoc/淘课网移动端4.pdf`  
**决策确认：**
- 客服 P0：`uni.makePhoneCall('02134606062')`；53KF web-view **P1 再接**
- 发票：对齐 PC `frontend` 申请发票页 + 后端 `/orders/{orderNo}/invoice`

---

## 1. 目标

一次性闭环 PDF 中 9 条测试项（#4 为 #5 的 PC 参考图，合并处理），使小程序行为与 PC 端业务规则一致，UI 按 PDF 标注实现。

---

## 2. 分期

| 阶段 | 条目 | 说明 |
|------|------|------|
| **P0** | #1 #2 #3 #7 #8 #9 + 图片资源 | 筛选、评分、封面、期次、分类；`toAssetUrl` 老站路径 |
| **P0** | #5 部分 | 底部栏改布局 + 电话；「发布定制需求」新页 |
| **P0** | #6 部分 | 订单详情底部：评价 / 咨询(电话) / 申请发票入口 |
| **P1** | #5 立即咨询 | 53KF `<web-view>` 或 H5 跳转（待业务域名） |

---

## 3. 分项设计

### 3.1 #1 #2 专家筛选「类别 / 行业」对齐 PC

**现状：** `pages/expert/list.vue` 用 `flattenTopCategories()` 只取一级；API 失败时选项为空或极少。

**方案：**
1. `loadFilterOptions()` 并行请求 `TRAINER_EXPERTISE`、`TRAINER_INDUSTRY` 完整树。
2. 筛选项改用 **`flattenLeafCategories()`**（与 PC 可筛选的叶子分类一致；若 PC 侧为一级+二级混选，则用 `flattenCategoryOptions()` 生成 `父 / 子` 标签）。
3. 失败时 toast 提示并重试，**禁止**静默空列表。
4. 提交参数保持 `expertiseCategoryId` / `industryCategoryId`（numeric ID）。

**涉及文件：**
- `pages/expert/list.vue`
- `utils/normalize.js`（已有工具，仅改调用）

---

### 3.2 #3 专家评分 &lt; 3.0 显示「未评价」

**规则（对齐 PDF + PC 卡片）：**

| 条件 | 列表 `TkExpertCard` | 详情 `expert/detail` |
|------|-------------------|---------------------|
| `score <= 0` 或无分 | 显示「未评价」 | 显示「未评价」 |
| `0 < score < 3` | 显示「未评价」（PDF 明确要求） | 显示数值或「未评价」（与 PC Hero 低分一致） |
| `score >= 3` | 星级 + 数字 | 星级 + 数字 |

**修复：**
- 删除 `rating || 5` 默认值（当前 0 分会显示 5 星）。
- 新增 `utils/rating-display.js`：`formatExpertRating(score)` → `{ showStars, label, value }`。
- `TkExpertCard` row/grid 两变体共用。

**涉及文件：**
- `components/TkExpertCard/TkExpertCard.vue`
- `pages/expert/detail.vue`（统计区评分）

---

### 3.3 #5 专家详情：底部栏 + 发布定制需求

**底部 `TkActionBar`（从左到右）：**

| 位置 | 按钮 | 行为 |
|------|------|------|
| 左 | 电话 | `uni.makePhoneCall({ phoneNumber: '02134606062' })` |
| 中 | 收藏 | 现有 favorite API |
| 右 | **立即咨询**（primary 大红） | P0：同电话或 toast「客服接入中」；P1：53KF |

> PDF 要求立即咨询进 53KF；用户确认 P0 先用电话，按钮文案仍用「立即咨询」，点击行为 P0 = `makePhoneCall`。

**「发布定制需求」：**
- 位置：详情页 hero 下方或「推荐课程」上方，独立红色描边按钮。
- 跳转：`pages/demand/create.vue`（新建）。
- 表单字段对齐 PC `CreateDemandForm`（登录用户）：
  - 培训主题 / 标题、人数、预算区间、期望开课、形式（线上/线下）、地区（线下时）、详细描述
  - 联系人、电话（默认 `userStore` 手机号）
  - 可选：`intendedTrainerId` 从专家详情带入当前专家 ID
- API：`POST /demands`（扩展 `api/demand.js`）。

**涉及文件：**
- `pages/expert/detail.vue`
- `pages/demand/create.vue`（新）
- `api/demand.js`
- `pages.json` 注册路由

---

### 3.4 #6 订单详情：评价 / 咨询 / 申请发票

**现状：** `pages/order/checkout.vue` 兼作详情；已支付仅「查看订单」。

**方案：** 在 `checkout.vue` 按 `order.status` 渲染不同底栏（不新建 detail 页，减少路由改动）：

| 状态 | 底栏按钮 |
|------|----------|
| 0 待支付 | 取消订单 + 立即支付（保持） |
| 1 已支付 | **评价** + **咨询**(电话) + **申请发票**(primary) |
| 2 已取消 | **立即咨询**(电话) + **重新购买**(primary 红色) — 对齐 PDF #7 |
| 3/4 其他 | 按 PC `OrderCard` 简化 |

**评价：** 跳转 `pages/review/submit.vue?orderNo=&productType=&productId=`（新建或复用），调用现有 `/interaction/reviews` 创建接口；若无现成提交页则新建最小表单（星级+文字）。

**咨询：** `makePhoneCall('02134606062')`。

**申请发票（对齐 PC）：**
- 新页 `pages/order/invoice.vue?orderNo=xxx`
- 进入时并行：`GET /orders/{orderNo}`、`GET /orders/{orderNo}/invoice`、`GET /users/me`（预填邮箱）
- 已申请：只读展示状态（待开票/已开票/已驳回）
- 未申请：表单字段与 PC 一致
  - 发票类型：SPECIAL / NORMAL
  - 抬头类型：PERSONAL / COMPANY
  - 抬头、税号（企业必填）、银行、账号、地址、电话、邮箱
- 提交：`POST /orders/{orderNo}/invoice`
- 校验规则复制 PC `invoice/page.tsx`

**涉及文件：**
- `pages/order/checkout.vue`
- `pages/order/invoice.vue`（新）
- `api/order.js`（+ invoice 方法）
- `api/order-types` 或内联 types

---

### 3.5 #7 公开课列表封面 + 未支付/已取消订单底栏

**公开课列表：**
- `TkOpenCourseCard` 增加左侧封面 `<image>`，数据源 `coverUrl`（`normalizeOpenCourseListItem` 补字段）。
- 与首页 `TkHomePublicCourseCard` 共用 `toAssetUrl`。

**订单底栏：** 见 §3.4 状态 2；「重新购买」= 取订单首项 `productType/productId` 重新 `createOrder` 或跳转课程详情购买。

---

### 3.6 #8 课程评分 &lt; 3.0 →「暂无评分」

**规则：**
- 列表 `TkOpenCourseCard`、详情 `course/detail.vue`：`score < 3 || score <= 0` → 文案「暂无评分」，不渲染星形。
- `score >= 3` → 星级 + 数字。

**课程介绍 / 大纲：** 详情页已有 `TkSection`；确认字段映射 `intro` / `syllabus`（或后端 `description`）非空时展示，空则隐藏区块。

---

### 3.7 #9 课程封面、期次格式、分类全量

**封面：** 延续 `utils/asset.js` 增强（已完成草稿）：
- `/attachments/`、`/u/` → `https://www.taoke.com`
- `taoke/upload/`、`taoke/covers/` → PXB CDN
- 占位图过滤 `isPlaceholderLegacyAvatar`

**期次格式：** `utils/course-display.js` 新增 `formatPlanDateTime()` → `YYYY-MM-DD HH:mm`（零填充，不用 `toLocaleDateString`）。

**分类网格：** `pages/course/list.vue` 从 `COURSE_CATEGORY` 树 **`flattenTopCategories` 全量** 渲染（非固定 8 格 + mock）；超出一屏横向滚动或 4 列多行。

**微信小程序域名白名单（运维）：**  
`downloadFile` 增加 `https://www.taoke.com`、`https://cdn5-pxb-videos.taoke.com`。

---

## 4. 公共模块

### 4.1 `utils/rating-display.js`

```javascript
export const RATING_LOW_THRESHOLD = 3;

export function formatExpertRating(score) { /* 未评价 / 星级 */ }
export function formatCourseRating(score) { /* 暂无评分 / 星级 */ }
```

### 4.2 `utils/consult.js`

```javascript
export const SERVICE_PHONE = '02134606062';
export function callServicePhone() {
  uni.makePhoneCall({ phoneNumber: SERVICE_PHONE.replace(/-/g, '') });
}
```

### 4.3 环境变量（`.env.test` 已加）

```
VITE_LEGACY_ASSET_BASE_URL=https://www.taoke.com
VITE_PXB_VIDEO_CDN_URL=https://cdn5-pxb-videos.taoke.com
```

---

## 5. 不在本次范围

- 53KF 在线客服 web-view（P1）
- 后端 API 变更（发票/需求/分类接口已存在）
- 单元测试（项目约定暂不写）

---

## 6. 验收清单

- [ ] 专家筛选类别/行业选项数量与 PC 一致（同一 test 环境）
- [ ] 评分 0~2.9 的专家卡片显示「未评价」，无假 5 星
- [ ] 专家详情：电话/收藏/立即咨询布局；发布定制需求可提交
- [ ] 已支付订单：评价、咨询、申请发票可用；发票表单与 PC 一致
- [ ] 已取消订单：立即咨询 + 重新购买
- [ ] 公开课列表/详情封面正常；关明生等迁移数据头像/案例图正常
- [ ] 课程评分 &lt;3 显示「暂无评分」；期次为 `2026-08-29 09:00` 格式
- [ ] 公开课分类含 PDF 图一图二全部项

---

## 7. 实现顺序（建议）

1. `asset.js` + 域名文档（图片基础）
2. `rating-display.js` + Expert/Course 卡片
3. 专家筛选分类 + 课程分类网格
4. 专家详情底栏 + demand/create
5. order/checkout 底栏分流 + order/invoice + review submit
6. 公开课封面 + 期次格式
7. 全量手工冒烟（模拟器 + test 包真机）
