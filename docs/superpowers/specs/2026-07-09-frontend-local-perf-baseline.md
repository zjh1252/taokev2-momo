# C 端本地性能基线（2026-07-09）

## 环境

| 项 | 值 |
|----|-----|
| 测量时间 | 2026-07-09（本地） |
| Git | `e0f81473`（与主工作区运行栈同提交） |
| C 端 | `pnpm dev` → `http://localhost:3000`（主工作区 `frontend/`，未另起第二实例） |
| 后端 | Spring Boot `http://localhost:8080`（`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`） |
| Locale | 默认中文；`/zh-CN` → 307 → `/`，middleware rewrite 为 `/zh-CN` |
| 样本专家 ID | `56185`（来自 `GET /trainers?page=1&size=1`，教学名「钟越」） |
| 测量方式 | `curl.exe` 文档 TTFB（每页 4 次，间隔 ~300ms）；后端 API 单独计时；Next 终端拆分 `next.js` / `application-code` |

## 样本页测量

| 页面 | 路径 | Next 编译 / 路由就绪 | TTFB / 文档到达 | Top 3 慢 API（URL + 耗时 + 是否串行） | 主因标签 |
|------|------|---------------------|-----------------|--------------------------------------|----------|
| 首页 | `/`（等效 `/zh-CN`） | **热**：next.js ≈ 26–40ms；**冷**（历史日志）：next.js ≈ 2.1s（`GET /` total 4.9s） | **热** 4 次：min **1.792s** / avg **1.842s** / max **1.924s**；Next 日志 application-code ≈ **1.74–1.88s** | ① `GET /courses?isOpen=false&page=1&size=36&sortBy=default` ≈ **1554–1568ms**（`HOME_INNER_COURSE` slot 仅 4 条 &lt; 6 → **legacy 回退**，与其它 loader **并行**，但是首页墙钟主因）② `GET /trainers/{id}` ×4（slot ids `1117427,31491,75587,779822`）并行墙钟 ≈ **360ms**（单条 ≈ 131–137ms；`enrichExpertsFromApi`，slot/config **之后串行阶段**）③ `GET /recommendations/public?slotCode=HOME_INNER_COURSE` ≈ **176–219ms** + 随后 legacy 列表（见①） | `SSR 瀑布流` + `单接口慢` |
| 专家列表 | `/trainers` | **首编**：next.js ≈ **1194ms**（`GET /trainers` total 1760ms）；**热**：next.js ≈ 25–27ms | **热** 4 次：min **0.483s** / avg **0.499s** / max **0.528s**；application-code ≈ **451–496ms** | ① `GET /trainers/recommended?limit=9` ≈ **266ms**（`TRAINER_LIST_TRAINER` slot 仅 1 条 &lt; 9 → legacy；与列表 **并行**）② `GET /recommendations/public?slotCode=TRAINER_PAGE_CASE&limit=10` ≈ **187ms**（slot 5 &lt; 10，可能再走 legacy）③ `GET /trainers?page=1&size=16` ≈ **154–166ms**（**串行依赖**：先等 expertise/industry tree，再发列表） | `dev 编译`（首开）+ `SSR 瀑布流`（轻） |
| 专家详情 | `/trainers/56185` | **首编**：next.js ≈ **1148ms**（total 1631ms）；**热**：next.js ≈ 25–28ms | **首开** **1.652s**；**热** 3 次：0.397 / 0.414 / 0.434s（avg ≈ **0.415s**）；热 application-code ≈ **364–405ms** | ① `GET /trainers/56185/cases` ≈ **292ms**（detail **之后**与其它子资源并行）② `GET /trainers/56185/courses?page=1&size=20` ≈ **218ms**（同上）③ `GET /trainers/56185` ≈ **144–155ms**（**串行前置**：`getTrainerDetailCached` 成功后才 `Promise.all` 子资源） | `dev 编译`（首开）+ `SSR 瀑布流`（detail→子资源两段） |

### 补充证据（首页 SSR 路径）

`page.tsx` 顶层 `Promise.all`：category tree / cities / banners / experts / cases / internal courses / public courses。

运营位实际条数（影响是否走 legacy）：

| Slot | 条数 | 目标 | 结果 |
|------|------|------|------|
| `HOME_BANNER` | 3 | 3 | 直接用 slot |
| `HOME_TRAINER` | 4 | 4 | slot 满；仍 `enrichExpertsFromApi` → 4× detail |
| `HOME_CASE` | 2 | 4 | **legacy** `GET /trainer-cases/recent` |
| `HOME_INNER_COURSE` | 4 | 6 | **legacy** `GET /courses?isOpen=false...`（最慢） |
| `HOME_OPEN_COURSE` | 1 | — | slot 有数据后仍 `getCourseDetail(279521)` ≈ **148ms** |

公开课列表 API 本身也慢（若 slot 空会踩中）：`GET /courses?isOpen=true&page=1&size=30&sortBy=time` ≈ **1207–1389ms**（本次首页因 OPEN slot 有数据未走该路径）。

## Top 1–3 待修（按影响）

1. **首页内训课 legacy 列表拖死 SSR（最高）**  
   - 证据：热首页 TTFB ≈ **1.84s**，其中 `application-code` ≈ **1.8s**；`HOME_INNER_COURSE` 不足触发 `GET /courses?isOpen=false&page=1&size=36` ≈ **1.56s**，与墙钟同量级。  
   - 标签：`单接口慢` + `SSR 瀑布流`  
   - 方向：补齐运营位 / 列表字段够用则去掉 legacy；或缩小/加速该列表接口；避免为封面再打详情。

2. **首页专家 / 公开课「列表后再详情」N+1**  
   - 证据：`enrichExpertsFromApi` 对 4 个专家并行 `GET /trainers/{id}`（单条 ~135ms，墙钟 ~360ms）；`enrichPublicCourseCovers` 对公开课再 `GET /courses/{id}`（~148ms）。  
   - 标签：`SSR 瀑布流`  
   - 方向：运营位/列表响应带齐封面、intro、background；去掉首页路径上的 detail fan-out。

3. **专家列表 / 详情首开被 `next dev` 编译放大（次要，勿当业务主修）**  
   - 证据：`/trainers` 首编 next.js **1194ms**；`/trainers/56185` 首编 **1148ms**；热路径分别回落到 ~0.5s / ~0.4s。  
   - 标签：`dev 编译`  
   - 方向：本轮以业务 SSR/API 为主；编译成本单列，不误当成接口问题大改。

## 方法备注

- 文档 TTFB 用 `curl.exe` 对 HTML；未另起 Playwright（热路径与 Next 终端 `application-code` 一致，足够归因）。  
- API 耗时为直打 `localhost:8080` 的 TTFB（3 次取 avg/min/max 或 2 次 avg）；并行 fan-out 用 PowerShell runspace，避免 `Start-Job` 进程开销虚高。  
- 冷/热：上表「热」为路由已编译后连续请求；「首编/冷」来自同一次 `pnpm dev` 终端日志。

## Task 4 选定改动
- 样本页: 首页 `/`
- 证据: HOME_INNER_COURSE 4 条仍触发 GET /courses?isOpen=false size=36 ≈1.56s
- 改动文件: frontend/src/features/home/api/load-home-data.ts (`loadHomeInternalCourses`)
- 预期效果: 有运营位数据时不再打慢列表；首页热 TTFB 应明显下降

## 复测（改后）

| 项 | 值 |
|----|-----|
| 测量时间 | 2026-07-09（本地，Task 2–4 合并后） |
| Git | `e032618b`（含 covers / experts / inner courses 三笔 perf） |
| C 端 | worktree `frontend-local-perf`：`pnpm exec next dev --webpack -p 3002` → `http://localhost:3002`（**勿与主工作区 :3000 混淆**；:3001 为 admin） |
| 后端 | 同基线 `http://localhost:8080`（`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`） |
| Locale / 样本专家 | 同基线；专家 ID `56185` |
| 测量方式 | 同基线：`curl.exe` 文档 TTFB（每页 4 次热路径）；API 直打 8080；Next 终端 `application-code` |

### 样本页测量

| 页面 | 路径 | Next 编译 / 路由就绪 | TTFB / 文档到达 | Top 3 慢 API（URL + 耗时 + 是否串行） | 主因标签 |
|------|------|---------------------|-----------------|--------------------------------------|----------|
| 首页 | `/`（等效 `/zh-CN`） | **热**：next.js ≈ 28–44ms | **热** 4 次：min **0.434s** / avg **0.547s** / max **0.745s**；后续再测 4 次约 **0.447–0.506s**；Next `application-code` ≈ **400–701ms**（稳定段约 **424–467ms**） | ① 运营位 `HOME_*` / 分类树等并行，墙钟约 **0.4–0.5s**（**不再**出现 `GET /courses?isOpen=false&size=36`）② 内训 slot `HOME_INNER_COURSE` ≈ **203ms**（4 条直接映射）③ 公开课 / 专家 slot 有封面与简介字段，**无**首页路径上的 batch `getCourseDetail`；专家 slot 字段齐全时跳过 detail fan-out | `SSR 并行`（已去掉 1.56s 墙钟主因） |
| 专家列表 | `/trainers` | **首编**：next.js ≈ **2.0s**（total 9.3s，含 application-code）；**热**：next.js ≈ 35–40ms | **热** 4 次：min **0.500s** / avg **0.526s** / max **0.558s**；application-code ≈ **459–523ms** | 与基线同量级；本轮未改列表页数据路径 | `dev 编译`（首开）+ 列表 SSR |
| 专家详情 | `/trainers/56185` | **首编**：next.js ≈ **2.3s**；**热**：next.js ≈ 30–47ms | **热** 4 次：min **0.410s** / avg **0.461s** / max **0.574s**；application-code ≈ **375–501ms** | 与基线同量级；本轮未改详情页 | `dev 编译`（首开）+ detail→子资源 |

### 对照（同机同后端）

| 指标 | 改前（基线 :3000 / 旧码） | 改后（worktree :3002） |
|------|---------------------------|-------------------------|
| 首页热 TTFB avg | **1.842s** | **0.547s**（约 **-70%**） |
| 首页热 application-code | ≈ **1.74–1.88s** | ≈ **0.40–0.47s**（稳定段） |
| 同次 spot：旧 :3000 vs 新 :3002 | 2.256s | 0.507s |

### 路径级验证（API / 行为）

| 检查项 | 结果 |
|--------|------|
| `HOME_INNER_COURSE` 有数据（4 条）时是否仍打 `GET /courses?isOpen=false&page=1&size=36` | **否**（代码：`slotItems.length > 0` 即 `mapSlotCoursesToInternalCourses`；首页热墙钟已远低于该接口 ≈ **1.44–1.59s**） |
| 该慢列表接口本身是否仍慢 | **是**（直打仍 ≈ **1442–1587ms**）——仅证明「首页已绕开」，接口本身未加速 |
| 首页公开课是否 batch `getCourseDetail` 只为封面 | **否**（Task 2：slot/列表 `coverUrl` 直用；OPEN slot 1 条且含 cover） |
| 专家 slot 字段齐全时 detail fan-out | **应跳过**（4 条均有 `avatar` + `coverUrl` + `oneLineIntro`/`description` → `needsDetail=false`）；若 `lockMain`/`lockMiddle` 注入 mock 专家仍可能个别拉详情 |
| 功能冒烟 | `GET http://localhost:3002/` → **200**；HTML ≈ 366KB；含「专家」「内训」「公开课」「案例」及运营位姓名/课名（如关明生、张帆、办公室人员） |

## 验收清单

- [x] 至少一个样本页有可对比数字改善：首页热 TTFB **1.842s → 0.547s**
- [x] 每项代码修复有证据对应：
  - Task 2 covers：公开课 slot 带 `coverUrl`，首页不再为封面打 `getCourseDetail`
  - Task 3 experts：slot 字段齐全时 `enrichExpertsFromApi` 跳过 detail
  - Task 4 inner courses：INNER slot 有条目即用，首页不再打 1.56s legacy 列表（主因）
- [x] 功能冒烟：首页 / 专家列表 / 专家详情均 **200**；首页 HTML 含关键区块文案与运营位内容
- [x] 复测在 **修复后的 worktree 端口**（:3002）完成，未误测主工作区旧码 :3000
