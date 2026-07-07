# 6.30 测试问题修复需求 Spec

**日期：** 2026-07-06  
**来源：** `docs/tasks/6.30-测试.pdf`  
**范围：** `frontend` C 端与用户中心为主，必要时补充 `backend` / `admin-frontend` 能力  
**目标：** 将 6.30 PDF 中的测试反馈整理为可核对、可拆分实施的需求说明；需求确认后再进入代码改动。

---

## 1. 推荐实施策略

### 推荐方案：按优先级分批闭环

本 spec 保留 PDF 原始优先级与编号，建议本轮优先完成 **P0**，P1/P2 作为后续批次进入计划。

- **P0**：影响核心转化链路、首页入口、课程详情与用户中心需求/代理操作，应优先修复。
- **P1**：发布内容、日期校验、用户中心快捷入口、智能客服与录播课搜索跳转，建议第二批处理。
- **P2**：分享复制体验，风险低，可作为第三批或顺手项。

### 其他备选

- **一次性全量处理 P0/P1/P2**：回归范围大，涉及首页、课程、用户中心、后台配置和 AI 能力，交付风险较高。
- **只处理纯前端展示问题**：速度快，但 Banner 后台配置、AI 解析、课程介绍 PDF 迁移等问题会留下业务断点。

本 spec 采用推荐方案：P0 进入当前实现范围；P1/P2 明确需求与验收，等确认后可继续排期。

---

## 2. 范围与边界

### 本轮 P0 范围

1. 课程详情字段补齐：公开课和内训课详情页展示课程大纲、课程简介、培训对象、课程收益、授课形式等字段，并补齐老站课程介绍 PDF 的数据迁移与前后端展示。
2. 内训课右侧操作按钮统一：联系客服购买、加入购物车、收藏。
3. 首页 Banner 与专题入口：展示 2026 年度专题、支持三张轮播图切换、后台可配置。
4. 首页智能客服入口：Banner 上“立即咨询”等按钮统一打开智能客服聊天。
5. 需求详情编辑入口：已发布需求详情页增加“编辑”按钮，允许用户修改自己提交的需求。
6. 首页“查看专题”跳转到侧边栏“ MBA 总裁”对应专题/分类页。
7. 专家用户中心“我的代理 / 已生效代理”区域移除提示文案，新增“添加代理”按钮。

### 后续 P1/P2 范围

1. 发布课程页 AI 解析课程资料接入大模型能力。
2. 添加著作出版日期、发布案例培训日期禁止选择未来日期。
3. 用户中心首页 4 个快捷按钮补齐跳转内容：AI 智能选课打开智能客服，培训宝和目标通跳转外部站点，行业热点课按分类进入录播课最多浏览列表。
4. 行业热点课跳转到该课程所属分类的录播课列表，并按最多浏览筛选。
5. 公开课详情“分享”按钮复制当前页面网址并提示成功。

### 不纳入本 spec

- 不调整后端模块边界与角色体系。
- 不做 Maven 编译或后端构建。
- 不重做页面整体视觉风格，只针对 PDF 指出的问题修复。
- P0-17 在线状态提示语本轮先不做，保留记录，不进入当前代码改动范围。
- 不处理 PDF 第 12 页，因为文本提取为空；如第 12 页包含截图需求，需要补充说明。

---

## 3. P0 需求明细

### P0-5 公开课详情补齐课程信息字段

**PDF 原文摘要：** `https://v2.taoke.com/opencourse/187535.htm` 课程详情缺少信息字段，应包含课纲、课程简介、培训对象、课程收益、授课形式；参考老站 `https://www.taoke.com/opencourse/437801.htm`；数据迁移时课程介绍中的 PDF 也要迁移过来。

**目标行为：**

- 公开课详情页课程介绍区域展示以下内容：
  - 课纲
  - 课程简介
  - 培训对象
  - 课程收益
  - 授课形式
- 字段为空时不显示空标题，避免页面出现空白模块。
- 老站课程介绍中包含 PDF 附件或嵌入内容时，本轮需要补齐数据迁移、后端字段返回和前端展示，迁移后详情页可访问或展示该 PDF 内容。

**涉及模块：**

- `frontend/src/app/[locale]/(public)/opencourses/[id]/page.tsx`
- `frontend/src/features/course/components/detail/CourseDetailTabs.tsx`
- `frontend/src/features/course/api/service.ts`
- `frontend/src/features/course/api/types.ts`
- 后端课程详情 DTO 与课程详情接口。
- 老站数据迁移脚本，迁移脚本统一放在 `data-trans/` 下，Flyway 只做 schema/种子。

**验收标准：**

- 访问公开课详情，课程详情区域能看到 PDF 要求字段。
- 字段顺序与公开课详情设计一致，内容不重复、不乱码。
- 含 PDF 的课程介绍迁移后可正常访问。

### P0-7 内训课详情右侧按钮统一

**PDF 原文摘要：** `https://v2.taoke.com/inhousecourse/248291.htm` 内训课和公开课详情页右侧三个按钮应保持一致，内训课三个按钮改为：联系客服购买、加入购物车、收藏。

**目标行为：**

- 内训课详情右侧按钮从上到下或从主到次展示：
  - 联系客服购买
  - 加入购物车
  - 收藏
- 按钮视觉与公开课详情右侧操作区保持一致。
- “联系客服购买”打开现有智能客服或客服入口；若当前已有电话/客服策略，以首页智能客服组件为准。
- “加入购物车”调用现有购物车能力。
- “收藏”调用现有收藏能力，并显示已收藏状态。

**涉及模块：**

- `frontend/src/app/[locale]/(public)/innercourses/[id]/page.tsx`
- `frontend/src/features/course/components/detail/CourseSidebar.tsx`
- `frontend/src/features/course/api/service.ts`

**验收标准：**

- 内训课详情右侧出现 PDF 指定三按钮。
- 三个按钮均可点击且行为正确。
- 与公开课详情侧栏在视觉密度、按钮样式上保持一致。

### P0-8 内训课详情补齐课程信息字段

**PDF 原文摘要：** `https://v2.taoke.com/inhousecourse/222608.htm` 内训课详情页课程详情缺少信息字段，应包含课纲、课程简介、培训对象、课程收益、授课形式，类似公开课课程介绍。

**目标行为：**

- 内训课详情页复用公开课课程详情字段展示规则。
- 字段为空时不显示空标题。
- 课程介绍内容可展示富文本、图片与迁移后的附件链接。

**涉及模块：**

- `frontend/src/app/[locale]/(public)/innercourses/[id]/page.tsx`
- `frontend/src/features/course/components/detail/CourseDetailTabs.tsx`
- `frontend/src/features/course/api/types.ts`
- 可能涉及后端课程详情 DTO。

**验收标准：**

- 内训课详情页展示课纲、课程简介、培训对象、课程收益、授课形式。
- 展示结构与公开课详情一致。

### P0-11 首页 Banner 年度专题文案更新

**PDF 原文摘要：** `https://v2.taoke.com/` 首页 Banner 图替换成时间最新的，将图中的“淘课网2024年度专题”改成“淘课网2026年度专题”。

**目标行为：**

- 首页首屏 Banner 不再出现“淘课网2024年度专题”。
- 展示为“淘课网2026年度专题”。
- 如果文案在图片内，需要替换图片资源；如果文案由页面渲染，需要更新 CMS 配置或前端默认数据。

**涉及模块：**

- `frontend/src/features/home/components/HeroSection.tsx`
- `frontend/src/features/home/api/load-home-data.ts`
- 后台 CMS / 推荐位 / 物料配置相关模块，可能涉及 `admin-frontend` 与 `backend/taoke-admin`。

**验收标准：**

- 首页 Banner 展示 2026 年度专题。
- 线上数据缺失时不回退到 2024 文案。

### P0-12 已发布需求详情增加编辑按钮

**PDF 原文摘要：** `https://v2.taoke.com/dashboard/demands/2291` 发布了的需求详情页，“取消需求”按钮旁边增加“编辑”按钮，支持用户随时修改自己已填写的需求表单。

**目标行为：**

- 用户进入自己发布的需求详情页时，在“取消需求”旁展示“编辑”按钮。
- 点击“编辑”进入需求编辑页，表单回填当前需求内容。
- 提交后保存修改并返回详情或列表。
- 权限限制：仅需求发布人可编辑；平台后台编辑能力不受影响。
- 状态限制：用户已确认按默认处理，未取消、未关闭的自有需求均可编辑；已取消、已关闭状态不可编辑。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/demands/[id]/page.tsx`
- `frontend/src/app/[locale]/(usercenter)/dashboard/demands/create/page.tsx`
- 可能新增 `frontend/src/app/[locale]/(usercenter)/dashboard/demands/[id]/edit/page.tsx`
- `backend/taoke-course` 需求接口，若当前没有用户侧更新接口，需要补充。

**验收标准：**

- 自己发布的需求详情页能看到“编辑”按钮。
- 非本人需求不可编辑。
- 编辑保存后详情页展示最新内容。

### P0-14 首页“立即咨询”等按钮打开智能客服

**PDF 原文摘要：** 首页 Banner 图“立即咨询”按钮，点击需要跳转到智能客服；图中所圈两个按钮都应跳转到智能客服聊天。

**目标行为：**

- 首页 Banner 的“立即咨询”按钮打开现有智能客服聊天界面。
- PDF 圈出的另两个首页按钮也统一打开智能客服聊天。
- 入口行为复用现有 `CustomerServiceChatDialog`，避免重复实现客服弹窗。

**涉及模块：**

- `frontend/src/features/home/components/HeroSection.tsx`
- `frontend/src/components/customer-service-chat-dialog.tsx`
- `frontend/src/components/layout/floating-actions.tsx`

**验收标准：**

- 点击对应按钮后打开同一个智能客服聊天。
- 不跳空链接，不刷新页面，不出现未实现提示。

### P0-15 首页“查看专题”跳转 MBA/总裁班筛选页

**PDF 原文摘要：** “查看专题”按钮点击后需要跳转到侧边栏中的“ MBA 总裁”所显示的页面。

**目标行为：**

- 首页“查看专题”按钮跳转到专家页“擅长领域”筛选中点击 `MBA/总裁班` 后的同等效果。
- 目标页为专家列表页，并选中 `擅长领域 = MBA/总裁班`，展示该领域下的专家结果。
- 跳转目标应复用专家筛选参数与分类配置，不硬编码不可维护的 URL。

**涉及模块：**

- `frontend/src/features/home/components/HeroSection.tsx`
- `frontend/src/features/home/data/category-menu.ts`
- `frontend/src/features/home/utils/buildCategoryMenu.ts`
- 可能涉及 CMS 推荐位配置。

**验收标准：**

- 首页“查看专题”点击后进入专家列表页。
- 页面中 `MBA/总裁班` 处于已筛选状态，结果列表与在专家页手动点击该筛选项一致。

### P0-16 首页三张 Banner 支持左右切换并可后台更换

**PDF 原文摘要：** 三张 Banner 图应有左右切换按钮，按钮放在红圈位置；背景三张 Banner 图需要能够在后台更换，即展示位三张轮播图可从后台上传。

**目标行为：**

- 首页 Banner 支持 3 张轮播图。
- 首屏显示左右切换按钮，可手动切换上一张/下一张。
- Banner 数据来自后台可配置展示位；后台可上传/替换三张图。
- 前端在后台未配置或少于 3 张时有合理兜底，不影响首页渲染。

**涉及模块：**

- `frontend/src/features/home/components/HeroSection.tsx`
- `frontend/src/features/home/api/load-home-data.ts`
- `admin-frontend` CMS / 推荐位 / 物料上传页面
- `backend/taoke-admin` CMS 或推荐位接口
- `backend/taoke-course` CMS 数据服务，视现有实现而定。

**验收标准：**

- 首页可通过左右按钮切换三张 Banner。
- 后台替换图片后，首页刷新展示新图片。
- 移动端与桌面端按钮不遮挡核心文案。

### P0-17 在线时隐藏指定提示语

**PDF 原文摘要：** “当我还在线的时候，不要提示这段语句”。

**处理结论：** 用户确认本轮先不做。

**后续默认解释：**

- 用户仍处于在线客服或智能客服会话在线状态时，不显示“离线 / 不在线 / 请留言 / 稍后回复”类提示。
- 如果是第三方客服组件内部提示，优先通过配置或入口状态控制隐藏；不要用脆弱的 DOM 文本强删。

**涉及模块：**

- `frontend/src/components/customer-service-chat-dialog.tsx`
- 可能涉及智能客服 / 53KF / 第三方客服接入配置。

**验收标准：**

- 本轮不验收该项。
- 后续重新启用时，再确认具体提示文案与在线/离线状态规则。

### P0-2 专家用户中心“我的代理”增加添加代理入口

**PDF 原文摘要：** `https://v2.taoke.com/dashboard/my-agents` 专家用户中心侧边栏“我的代理 / 已生效代理”板块，去掉图中圈出的那段话，改为添加一个“添加代理”按钮，允许专家添加助理、经纪人、专家经纪公司、机构、机构员工。

**目标行为：**

- “已生效代理”区域移除 PDF 圈出的说明文案。
- 在对应位置新增“添加代理”按钮。
- 点击后进入添加代理流程，支持选择或邀请以下对象：
  - 助理
  - 经纪人
  - 专家经纪公司
  - 机构
  - 机构员工
- 绑定关系仍遵守现有供给侧绑定规则：申请后待对方确认，状态为 `PENDING/ACTIVE/REJECTED/UNBOUND`。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/my-agents/page.tsx`
- 供给侧绑定 API，可能涉及 `backend/taoke-user` 的专家、代理、机构绑定接口。

**验收标准：**

- 原说明文案不再显示。
- “添加代理”按钮出现且可进入添加流程。
- 添加后能看到待确认或已生效状态。

---

## 4. P1 需求明细

### P1-1 发布课程页 AI 解析课程资料接入大模型

**PDF 原文摘要：** `https://v2.taoke.com/dashboard/courses/create` 发布课程页面暂时无法使用 AI 解析课程资料功能，需要接一下大模型。

**目标行为：**

- 发布课程页上传课程资料后，可调用后端 AI 解析接口。
- 解析结果回填课程标题、简介、课纲、对象、收益等表单字段。
- 解析失败时提示原因，保留用户已填写内容。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/courses/create/page.tsx`
- `frontend/src/features/course/components/publisher/CourseForm.tsx`
- 后端 Spring AI / 文档解析能力。

### P1-4 添加著作出版日期禁止未来日期

**PDF 原文摘要：** `https://v2.taoke.com/dashboard/books/manage?trainerUserId=114223` 用户中心侧边栏“我的著作 / 添加著作”页面，出版日期不允许选未来日期，最多当天。

**目标行为：**

- 出版日期选择器最大值为当前日期。
- 手动输入未来日期时拦截并提示。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/books/create/page.tsx`
- 可能涉及后端 DTO 校验。

### P1-5 发布案例培训日期禁止未来日期

**PDF 原文摘要：** `https://v2.taoke.com/dashboard/cases/create` 发布案例页面培训日期字段不允许选择未来日期，最多当前日期。

**目标行为：**

- 培训日期选择器最大值为当前日期。
- 手动输入未来日期时拦截并提示。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/cases/create/page.tsx`
- 可能涉及后端 DTO 校验。

### P1-6 用户中心首页 4 个按钮补齐内容

**PDF 原文摘要：** `https://v2.taoke.com/dashboard` 图片中的 4 个按钮都没有接入内容，需要接一下。AI 智能选课和首页智能客服实现一样的功能，都跳转到智能客服聊天界面。

**目标行为：**

- 用户中心首页 4 个快捷按钮全部具备有效点击行为。
- “AI 智能选课”打开智能客服聊天界面。
- “培训宝”跳转外部网址：`https://www.91pxb.com/?mod=marketing&do=intro`。
- “目标通”跳转外部网址：`https://www.91mbt.com/home/#/download`。
- “行业热点课”按 P1-7 规则进入录播课列表。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/page.tsx`
- `frontend/src/components/customer-service-chat-dialog.tsx`

### P1-7 行业热点课跳转录播课搜索

**PDF 原文摘要：** 点击“行业热点课”按钮，会跳转到录播课栏目，根据该课程所属分类进入对应分类列表，并筛选“最多浏览”条件。

**目标行为：**

- 点击行业热点课按钮后进入录播课列表。
- URL 携带该课程所属分类参数。
- 若分类为 `MBA/总裁班`，跳转后录播课列表选中 `MBA/总裁班` 分类，效果参考截图二。
- 默认排序为“最多浏览”。
- 分类来源取当前课程/卡片的课程分类字段；若存在多级分类，优先使用前端列表中展示给用户的末级分类。

**涉及模块：**

- `frontend/src/app/[locale]/(usercenter)/dashboard/page.tsx`
- 录播课列表页面与搜索参数处理模块。

---

## 5. P2 需求明细

### P2-1 公开课详情分享按钮复制当前网址

**PDF 原文摘要：** `https://v2.taoke.com/opencourse/279514.htm` 按下“分享”按钮后，复制当前页面网址，并在顶部提示“已复制该页面网址”。

**目标行为：**

- 点击分享按钮后调用浏览器剪贴板 API 复制当前页面完整 URL。
- 顶部显示提示：“已复制该页面网址”。
- 剪贴板 API 不可用时提供降级提示。

**涉及模块：**

- `frontend/src/app/[locale]/(public)/opencourses/[id]/page.tsx`
- `frontend/src/features/course/components/detail/CourseHero.tsx`
- 或当前实际承载分享按钮的详情组件。

---

## 6. 数据与接口要求

### 课程详情字段

课程详情接口需要提供或透传以下字段：

- `outline` / 课纲
- `description` / 课程简介
- `targetAudience` / 培训对象
- `benefits` / 课程收益
- `teachingFormat` / 授课形式
- `attachments` / 课程介绍附件，包含 PDF 时可访问

字段命名以现有 API 为准，前端不新增重复概念字段。

### Banner 配置

首页 Banner 建议走现有 CMS / 推荐位 / 物料配置能力：

- 展示位支持 3 条 Banner。
- 每条包含图片、标题、副标题、按钮文案、按钮行为、跳转目标。
- 后台上传图片后前端可读取。

### 需求编辑

若当前只有创建需求接口，需要补充用户侧更新接口：

- `GET /demands/{id}`：获取自有需求详情。
- `PUT /demands/{id}` 或现有等价接口：更新自有需求。
- 后端校验当前用户为需求发布人。

### 智能客服

所有“立即咨询 / AI 智能选课 / 联系客服购买”等入口应复用同一客服打开方式，避免各页面维护不同逻辑。

---

## 7. 验证计划

### 文档确认后实施验证

- C 端：运行 `pnpm lint`，必要时运行 `pnpm build`。
- 后台前端：如改动 `admin-frontend`，运行 `bun lint`，必要时运行 `bun run build`。
- 后端：遵守仓库规则，不运行 Maven；只做静态检查和必要文件核对。
- 手工回归以下页面：
  - `/opencourses/{id}`
  - `/innercourses/{id}`
  - `/dashboard/demands/{id}`
  - `/dashboard/my-agents`
  - `/dashboard`
  - 首页 `/`

---

## 8. 需求确认结果

1. P0-17 用户已确认本轮先不做。
2. P0-12 用户已确认按默认处理：不包含已取消/已关闭状态。
3. P0-15 用户已确认：按专家页“擅长领域”下 `MBA/总裁班` 的筛选效果跳转。
4. P1-6 用户已确认：培训宝跳转 `https://www.91pxb.com/?mod=marketing&do=intro`；目标通跳转 `https://www.91mbt.com/home/#/download`；AI 智能选课打开智能客服；行业热点课按 P1-7。
5. P1-7 用户已确认：行业热点课跳转到该课程所属分类的录播课列表，并选择“最多浏览”。
6. P0-5 用户已确认：补齐老站课程介绍 PDF 的数据迁移、后端返回与前端展示。

当前已无阻塞确认项；如本 spec 内容无误，下一步可进入实现计划。
