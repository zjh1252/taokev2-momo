# 培训宝 Legacy 兼容接口说明

本文档描述 **taokev2-mono** 中 `taoke-legacy` 模块已实现的 Legacy 兼容接口，供 **培训宝（PXB）**、**i人事 / wittrain 等接入商** 调用。调用方只需将 `tkw_site_host` / `mobile_website` 指向 v2 后端地址，URL 形态与老站一致。

**联调环境示例：**

| 角色 | 地址 |
|------|------|
| 淘课 v2 | `http://local.taokenew.com:8080` |
| 培训宝 | `http://local.91pxb.com`（本地） / `https://dev.91pxb.com`（dev） |
| i人事 wittrain | 由 `LEGACY_SIGNATURE_URL_WITTRAIN` 配置 |

---

## 一、通用约定

| 项目 | 说明 |
|------|------|
| 默认服务根地址 | `http://127.0.0.1:8080`（或实际部署域名） |
| 响应格式 | **直接 JSON 字符串**，不使用 v2 的 `ApiResponse` 包装 |
| 鉴权失败 | 返回纯文本 `Access Denied`（HTTP 200） |
| 用户映射（培训宝 `appid=pxb`） | POST 参数 `uid` = UCenter **cdbid** = `sys_users.uc_uid` |
| 用户映射（接入商 `appid=wittrain` 等） | POST 参数 `uid` = 接入商 **root_company_id** → `member_provider` → `sys_users.id`（不存在时自动注册） |
| 组织隔离 | `pxb_root_id` = 培训宝 / 接入商组织 `root_company_id`，`0` 表示不限 |

### 1.1 search_course.php 签名（Query 参数）

参与签名的只有 **URL Query**，POST body **不参与**签名。

```
ksort(appid, opt, timetamp)
→ query = appid=pxb&opt=courseList&timetamp=1719000000  （PHP urlencode，空格为 +）
→ signature = md5(query + secret)
```

| 参数 | 位置 | 说明 |
|------|------|------|
| `appid` | Query | 培训宝入站常用 `pxb`；i人事等接入商为 `wittrain` / `qa_wittrain` / `ihr_wittrain` |
| `opt` | Query | 业务操作名 |
| `timetamp` | Query | Unix 秒级时间戳（注意拼写是 timetamp） |
| `signature` | Query | 32 位 MD5 |
| 业务参数 | POST body | `application/x-www-form-urlencoded` |

密钥与出库地址（对齐老站 `common.signature.php`，**密钥与 URL 写在 `backend/.env.local` 或部署环境变量**，`application.yaml` 仅做引用；模板见 `backend/.env.example`）：

| 配置项 | 环境变量 | 说明 |
|--------|----------|------|
| `signature-keys.pxb` | `LEGACY_SIGNATURE_KEY_PXB` | 培训宝入站 appid |
| `signature-keys.taoke` | `LEGACY_SIGNATURE_KEY_TAOKE` | 淘课出库 PXB 默认签名 appid |
| `signature-keys.shequ` | `LEGACY_SIGNATURE_KEY_SHEQU` | 社区等其它接入方 |
| `signature-keys.wittrain` | `LEGACY_SIGNATURE_KEY_WITTRAIN` | i人事接入商（测试/生产另有 `QA_WITTRAIN` / `IHR_WITTRAIN`） |
| `signature-urls.wittrain` 等 | `LEGACY_SIGNATURE_URL_WITTRAIN` 等 | 接入商出库完整 URL（`add_tt_course.php`） |
| `pxb-outbound.base-url` | `PXB_SITE_URL` | 培训宝默认出库根地址 |
| `pxb-outbound.enabled` | `PXB_OUTBOUND_ENABLED` | 是否推送 saveCourses，默认 `true` |
| `pxb-outbound.app-id` | `PXB_OUTBOUND_APP_ID` | 出库 PXB 时签名 appid，默认 `taoke` |

**行为说明：**

- **入站**：Query 中 `appid` 必须在 `signature-keys` 中有对应密钥，否则返回 `Access Denied`。
- **出站 saveCourses**：见 **§1.4**；接入商 URL 原样使用（可 https），培训宝默认 URL 会将 https 降为 http（与老站 `pxbCurl` 一致）。
- **用户映射**：在 `signature-urls` 中配置的 appid（如 `wittrain`）→ `member_provider` 表；否则 `uid` = UCenter cdbid = `sys_users.uc_uid`。
- **数据库**：接入商映射依赖 Flyway `V132__create_member_provider.sql`（表 `member_provider`）。

时间戳窗口：

- `search_course.php`：默认 **7200 秒**（2 小时）
- `/api/get.php`、`/api/trainer.php` 等其它 legacy 入口：默认 **864000 秒**（10 天）

**请求模板：**

```http
POST /api/search_course.php?opt={opt}&appid=pxb&timetamp={ts}&signature={sig}
Content-Type: application/x-www-form-urlencoded

uid=123456&pxb_root_id=100&...
```

> 为便于浏览器联调，`search_course.php` 也支持 **GET**（业务参数可放在 Query）；培训宝生产环境仍以 POST 为主。

**联调脚本：** `backend/scripts/pxb-legacy-smoke.py`

### 1.2 get.php / trainer.php 签名（Query 参数）

与 `search_course.php` **算法相同**，参与签名的仍只有 Query 中的 `appid`、`opt`、`timetamp`；POST body **不参与**签名。

| 项目 | 说明 |
|------|------|
| 时间戳窗口 | **864000 秒**（10 天，`defaultTimestampSkewSeconds`） |
| 请求方式 | GET / POST 均可；业务参数可在 Query 或 form body |
| 失败响应 | 纯文本 `Access Denied`（HTTP 200） |

**请求模板：**

```http
GET|POST /api/get.php?opt={opt}&appid=pxb&timetamp={ts}&signature={sig}&...
GET|POST /api/trainer.php?opt={opt}&appid=pxb&timetamp={ts}&signature={sig}&...
```

**联调脚本子命令：** `call-get`（get.php）、`call-trainer`（trainer.php）

### 1.3 Query 未 urlencode 时的兜底（Tomcat 层）

GET Query 中含**未编码**的非 ASCII 字符（如 `trainer_name=刘纯`）时，Tomcat 可能在进入 Spring 之前拒绝解析。v2 对以下 Legacy 入口做了 **HTTP 200 + JSON** 兜底，**不再返回 HTML Exception Report**：

| 入口 | 兜底 JSON |
|------|-----------|
| `/api/get.php`、`/api/search_course.php` | `{}` |
| `/api/trainer.php` | `{"isok":false,"msg":"参数错误"}` |
| `/?c=taokevideo&a=player&...` | `{"isok":false,"data":"参数错误"}` |
| `/getData`、`/?c=taokeajax&a=getData` | `{"isok":false,"tip":"invalid json"}` |

**说明：**

- 兜底仅表示「请求格式非法」，**无法**按中文关键词真正查库；培训宝侧仍应对参数做 **urlencode**，或使用 **POST body** 传中文。
- 实现：`taoke-legacy` 模块 `LegacyApiErrorReportValve`（Tomcat `ErrorReportValve` 替换）。

### 1.4 下单后出库 saveCourses（generateOrder / restoreByOrderCode）

`generateOrder`、`restoreByOrderCode` 在本地落单并创建 enrollment 后，会调用出库接口（对齐老站 `pxb_tt_course.pxbCurl` → `add_tt_course.php?opt=saveCourses`）。

| 场景 | 出库 URL | 签名 appid | POST `uid` |
|------|----------|------------|------------|
| 培训宝普通用户 | `{PXB_SITE_URL}/api/tt_course/add_tt_course.php` | `taoke`（`PXB_OUTBOUND_APP_ID`） | 用户 UCenter cdbid |
| 接入商用户（`member_provider`） | `signature-urls[tkw_type]`，如 wittrain | 接入商 appid（如 `wittrain`） | 接入商 `root_company_id` |

**POST 主要字段：**

- `save_data`：逗号分隔 video_id；**套餐订单**为包内全部已发布 video（与老站 order_detail 一致）
- `packages_relation[videoId]`：video → 老站 topic_item.id（package legacy node id）
- `pxb_root_id`、`is_include_paper`、`copy_root_id` 等与老站一致

**PXB / 接入商成功响应（JSON）：**

```json
{ "isok": true, "msg": "存入课程库成功" }
```

v2 同时识别 `isok` 与 `is_ok`。若出库失败，订单事务回滚，接口返回 `{ "isok": false, "msg": "..." }`。

**关闭出库（仅本地落单）：** `PXB_OUTBOUND_ENABLED=false`

---

## 二、search_course.php（16 个 opt）

**统一入口：**

```
GET|POST {BASE}/api/search_course.php?opt=...&appid=pxb&timetamp=...&signature=...
```

---

### 2.1 录播课搜索 / 已购

#### `courseList` — 录播课分页列表

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | 培训宝 cdbid |
| `ctype` | 否 | 固定 `3`（录播），其它类型暂返回空 |
| `cate` | 否 | 分类 ID |
| `keyword` | 否 | 关键词 |
| `orderby` | 否 | `id` / `price` / `score` / `title`，默认 `id` |
| `sort` | 否 | `asc` / `desc`，默认 `desc` |
| `start` | 否 | 偏移，默认 0 |
| `perpage` | 否 | 每页条数，默认 15 |
| `pxb_root_id` | 否 | 组织 ID |

**响应示例：**

```json
{
  "courses_num": 100,
  "courses": {
    "1001": {
      "id": 1001,
      "title": "...",
      "price": 99,
      "trainer": "...",
      "img": "...",
      "video_url": "vid=1001&child=0",
      "v_type": 1,
      "score": 4.5,
      "duration": 3600,
      "cid": 1,
      "cate_name": "...",
      "buystatus": 1,
      "starttime": 1719000000,
      "endtime": 1740537600
    }
  }
}
```

`buystatus`：`0` 未购 / `1` 已购 / `-1` 过期 / `-2` 即将过期

---

#### `courseOrder` — 用户已购录播课 ID 映射

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | |
| `ctype` | 否 | `3` |
| `cate` / `keyword` / `pxb_root_id` | 否 | 筛选 |

**响应：** `{ "1001": 1001, "1002": 1002 }`（以 id 为 key 的对象）

---

#### `getCourseByIds` / `getOrderCourseByIds` — 按 ID 批量查课

两者共用同一 Handler。

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | |
| `courseids` | 是 | 逗号分隔或数组，如 `1001,1002` |
| `pxb_root_id` | 否 | |

**响应：** `{ "1001": { ...含 url/pic/buy_status... }, ... }`

---

#### `adsList` — 推荐广告位录播课

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `type` | 否 | 默认 `video`，非 video 返回 `{}` |

**响应：** 以视频 id 为 key 的对象（含 `id/title/price/trainer/img/video_url/v_type/score/cid/cate_name` 等）

数据来源：v2 `is_featured` / `sticky_priority` 推荐位。

---

#### `getAccountBuyVideos` — 账号未过期已购视频 ID 列表

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | |
| `pxb_root_id` | 否 | |

**响应：** `[1001, 1002, 1003]`（JSON 数组）

---

#### `VideoDetail` — 单课详情（客服后台）

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | |
| `video_id` | 是 | |
| `pxb_root_id` | 否 | |

**响应：**

```json
{
  "isok": true,
  "msg": {
    "buy_status": { "buystatus": 1, "starttime": 0, "endtime": 0 },
    "video": {
      "id": 1001,
      "title": "...",
      "url": "vid=1001&child=0",
      "types": 1,
      "seriesList": { "101": { } }
    }
  }
}
```

---

### 2.2 套餐 / 专题

#### `getCourseTopic` — 套餐/专题树

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 否 | 有则填充 `buystatus` |
| `order_supplier` | 否 | `yes` 按供应商排序 |
| `pxb_root_id` | 否 | |

**响应：** 以 topic **id 为 key 的对象**（非数组），字段含 `id/topic_id/item_name/item_parent/price/buystatus/...`

---

#### `getTopicCourses` — 包内课程分页 ✅ 已验证（培训宝 package 780 等）

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | |
| `package_id` | 是 | 包 ID（`video_package_groups.legacy_node_id`） |
| `second_id` | 否 | 子专题 ID，`0`=整包 |
| `start` / `perpage` | 否 | 分页，默认 0 / 15 |
| `pxb_root_id` | 否 | |

**响应：**

```json
{
  "courses_num": 50,
  "video_num": 120,
  "courses": { "1001": { } }
}
```

---

#### `getTopicCourseIds` — 包内课程 ID 列表

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `package_id` | 是 | |
| `second_id` | 否 | |

**响应：** `[1001, 1002, ...]`（JSON 数组）

---

### 2.3 订单

#### `generateOrder` — 创建套餐订单 ✅ 已验证

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | 培训宝：cdbid；接入商（wittrain）：root_company_id |
| `package_ids` / `package_ids[]` | 是 | 包 ID 列表（老站 topic_item.id / v2 `video_package_groups.legacy_node_id`） |
| `total` | 否 | 订单金额 |
| `pxb_kefu` / `pxb_remarks` / `order_subject` | 否 | 客服信息 |
| `is_include_paper` | 否 | 是否含试卷 |
| `copy_root_id` | 否 | 模板账号 |
| `concurrency` | 否 | 同时观看人数，默认 1 |
| `begintime` / `endtime` | 否 | Unix 秒，有效期 |
| `ignore_package` / `ignore_package[]` | 否 | 排除的子系列 |
| `pxb_root_id` | 否 | 组织隔离，写入 `orders.pxb_root_id` |

**流程：** 解析用户 → 创建 `orders` / `order_items` / enrollment → 出库 saveCourses → 成功返回订单号。

**成功响应：**

```json
{
  "isok": true,
  "msg": {
    "order_code": "TK202606221234567890",
    "order_subject": "...",
    "status": 3,
    "starttime": 1719000000,
    "endtime": 1740537600
  }
}
```

**失败：** `{ "isok": false, "msg": "..." }`（含出库失败时整单回滚）

**已验证场景（2026-06 / 2026-07）：**

| 调用方 | appid | 说明 |
|--------|-------|------|
| 培训宝 | `pxb` | 套餐下单（如 package 941），课程入库培训宝 tt_course |
| i人事 | `wittrain` | 在线课程下单，课程入库 i人事侧课程库 |

**请求示例（培训宝）：**

```http
POST /api/search_course.php?opt=generateOrder&appid=pxb&timetamp={ts}&signature={sig}
Content-Type: application/x-www-form-urlencoded

uid=16257&pxb_root_id=44&package_ids[0]=941&total=0&order_subject=...&is_include_paper=0&concurrency=1
```

**请求示例（i人事 wittrain）：** Query 中 `appid=wittrain`，`uid` 为接入商 root_company_id；出库走 `LEGACY_SIGNATURE_URL_WITTRAIN`。

---

#### `getOrders` — 订单列表

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `filter[uids]` | 否 | 用户 ID 逗号分隔；培训宝为 cdbid，接入商为 root_company_id，经 MemberProvider / uc_uid 转内部 userId |
| `filter[order_status]` | 否 | 订单状态 |
| `filter[start_time_start]` 等 | 否 | 时间范围（Unix 秒） |
| `filter[root_company_id]` | 否 | 组织过滤：`pxb_root_id IN (0, root_company_id)` |
| `page` / `pagesize` | 否 | 默认 1 / 15，按 `orders.id DESC` |

> **已知限制：** 标准 PXB 使用 `filter[uids]`、`filter[root_company_id]`（见 `getOredersByCondition`）。i人事部分请求使用 `uid[uids]`、`uid[root_company_id]` 嵌套格式，**v2 当前仅识别 `filter[...]`**，ihr 订单列表联调需待兼容或 ihr 侧改为标准参数。查最新订单请使用 **`page=1`**。

**响应：**

```json
{
  "total": 10,
  "orders_list": [
    {
      "order_code": "...",
      "order_subject": "...",
      "status": 3,
      "starttime": 0,
      "endtime": 0,
      "pxb_root_id": 100,
      "pxb_kefu": "..."
    }
  ]
}
```

老站 status：`3`=已支付，`-1`=过期

---

#### `restoreByOrderCode` — 按订单号恢复入库（开通报名）

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `order_code` | 是 | 订单号 |
| `is_include_paper` | 否 | 默认 -1（取订单原状态） |

成功后同样会触发 saveCourses 出库（规则同 **§1.4**）。

**响应：** `{ "isok": true, "msg": "入库成功" }`

---

#### `getVideoIdsByOrderCode` — 订单下视频 ID

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `order_code` | 是 | |

**响应：**

```json
{
  "isok": true,
  "video_id_list": [1001, 1002]
}
```

---

### 2.4 购买态 / 套餐导航 / 课程同步（P0 新增）

#### `getCourseBuyStatus` — 批量查询购买状态

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `uid` | 是 | 培训宝 cdbid |
| `courseids` | 是 | 逗号分隔或 `courseids[]` 数组 |
| `ctype` | 否 | 固定 `3`（录播），其它返回 `{}` |
| `pxb_root_id` | 否 | 组织 ID |

**响应：** 以视频 id 为 key 的对象，含 `buystatus`、`starttime`、`endtime` 等。

---

#### `videoSupplierNext` — 套餐内下一集视频 ID

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `video_id` | 是 | 当前视频 ID |

**响应：** `{ "video_id": 1002 }`（无下一集时为 `0`）

---

#### `sync_course` — 回写 PXB 课程资源类型

| POST 参数 | 必填 | 说明 |
|-----------|------|------|
| `courses` | 是 | JSON 字符串，key 为淘课课程 id，value 含 `pxb_resoure` 等 |

**成功：** `{ "isok": true, "msg": "课程同步成功" }`  
**失败：** `{ "isok": false, "msg": "课程同步参数有误" }`

---

## 三、get.php（4 个 opt）

**统一入口：**

```
GET|POST {BASE}/api/get.php?opt=...&appid=pxb&timetamp=...&signature=...
```

签名规则见 **§1.2**；Controller：`LegacyGetController`。

---

### 3.1 `trainer` — 按讲师姓名搜索

| 参数 | 位置 | 说明 |
|------|------|------|
| `trainer_name` | Query / POST | 讲师姓名关键词 |
| `accurate` | Query / POST | `1` 精确匹配；`0` 模糊（默认） |

**响应：** 以讲师 **userId**（`sys_users.id`）为 key 的对象，字段含 `id`、`roleid`（v2 讲师 id）、`realname`、`icon`、`cates`、`course`、`intro` 等。

**已验证示例：**

```
GET /api/get.php?opt=trainer&appid=pxb&timetamp=...&signature=...&accurate=1&trainer_name=刘
```

---

### 3.2 `video_state` — 共享视频审核状态

| 参数 | 位置 | 说明 |
|------|------|------|
| `video_id` | Query / POST | 淘课视频 ID |

**响应示例（审核通过）：**

```json
{
  "isok": true,
  "isapprove": 1,
  "info": "视频Id 1001 内容审核通过。",
  "detail_url": "/trainer/756913/video_detail/1001.htm"
}
```

`isapprove`：`0` 待审核 / `1` 通过 / `-1` 驳回（含 `approveinfo`）

---

### 3.3 `tkvideo` — PXB 视频共享到淘课（add / update / delete）

| 参数 | 位置 | 说明 |
|------|------|------|
| `video` | **POST body** | JSON 字符串，结构 `{ "type": "add|update|delete", "video": {...}, "series": [...] }` |

Query 仍只需签名四元组；业务 JSON 放在 form 字段 `video`（与培训宝 `queryTKWByPost` 一致）。

**成功示例：**

```json
{
  "isok": true,
  "msg": {
    "info": "添加成功",
    "pxb_id": 12345,
    "taoke_id": 1001,
    "seriesRelation": { "67890": 2001 }
  }
}
```

`video.uid` 为培训宝 cdbid，服务端映射为 `sys_users.uc_uid` → 发布者 `publisher_id`。

---

### 3.4 `related_tktrainer` — 关联 PXB 讲师与淘课讲师  ***已验证

| 参数 | 位置 | 说明 |
|------|------|------|
| `trainer_uid` | Query / POST | 淘课讲师 userId |
| `pxb_uid` | Query / POST | 培训宝用户 uid |
| `pxb_username` | 否 | 培训宝用户名 |
| `mobile` | 否 | 手机号 |

**响应：** `{ "isok": true, "msg": "关联成功" }`

写入表 `pxb_trainer_related_logs`（对应老站 `pxb_related_log`）。
**已验证示例：**

```
GET api/get.php?opt=related_tktrainer&appid=pxb&timetamp=....&trainer_uid=31094&pxb_uid=1302678&pxb_username=EV1817&mobile=
```
---

## 四、trainer.php（2 个 opt）

**统一入口：**

```
GET|POST {BASE}/api/trainer.php?opt=...&appid=pxb&timetamp=...&signature=...
```

签名规则见 **§1.2**；Controller：`LegacyTrainerController`。  
培训宝 **师资库（tt-trainer）** 专用，与 get.php 的 `trainer`（按姓名搜）场景不同。

---

### 4.1 `get_trainer_list` — 按行业推荐讲师列表  ***已验证

| 参数 | 位置 | 说明 |
|------|------|------|
| `trade` | Query / POST | 行业：数字为 `TRAINER_INDUSTRY` 分类 id；非数字则按名称匹配（可 tab 分隔多个名称，取首个命中） |
| `keyword` | 否 | 主搜索词 |
| `extkeyword` | 否 | 扩展搜索词 |

逻辑：先按行业 + 关键词取候选（最多 100），不足 6 条时去掉行业限制；再 **随机抽 6 条**（老站行为）。

**响应：**

```json
{
  "isok": true,
  "msg": [
    {
      "id": 123456,
      "roleid": 756913,
      "realname": "张三",
      "icon": "...",
      "nickname": "",
      "username": "...",
      "company": "...",
      "goodat": "...",
      "score": 4.5,
      "signature": "...",
      "ext_trade": "金融保险",
      "quality": 1
    }
  ]
}
```

- `id`：讲师 userId（`sys_users.id`）
- `roleid`：v2 讲师 id（`user_trainers.id`），PXB 用于拼 `/trainer/{roleid}.htm`

**已验证示例：**

```
GET /api/trainer.php?opt=get_trainer_list&appid=pxb&timetamp=...&signature=...&trade=15
```

---

### 4.2 `get_trainer_detail` — 按 role_id 查讲师详情  ***已验证

| 参数 | 位置 | 说明 |
|------|------|------|
| `role_id` | Query / POST | 老站 roleid = v2 **`user_trainers.id`**（非 legacy roleid） |

**响应：**

```json
{
  "isok": true,
  "msg": {
    "id": 123456,
    "roleid": 756913,
    "realname": "张三",
    "icon": "...",
    "cates": "领导力,沟通",
    "intro": "...",
    "teaching_experience": 8,
    "course": [
      { "organid": 123456, "title": "主打课程A" }
    ]
  }
}
```

`course` 为已上架且 `is_featured=1` 的内训课列表；PXB「添加到师资库」会读取此结构。

**已验证示例：**

```
GET /api/trainer.php?opt=get_trainer_detail&appid=pxb&timetamp=...&signature=...&role_id=756913
```

参数错误：`{ "isok": false, "msg": "专家编号错误！" }`

---

## 五、移动站播放链（2 类入口）

### 5.1 taokevideo 播放（PXB 移动端）

**地址：**

```
GET|POST {BASE}/?c=taokevideo&a=player&from=pxbmobile&...
```

| Query 参数 | 必填 | 说明 |
|------------|------|------|
| `from` | 是 | 必须为 `pxbmobile` |
| `cdbid` | 是 | UCenter uid |
| `timestamp` | 是 | Unix 秒 |
| `video_id` | 是 | 淘课视频 ID |
| `video_url` | 是 | Base64(`vid=1001&child=0`) |
| `token` | 是 | 播放签名（见下） |
| `app_id` | 否 | 默认 `taoke` |
| `pxb_root_id` | 否 | |
| `callback` | 否 | JSONP 回调名 |

**播放签名（与 search_course 不同）：**

```
ksort(appid, cdbid, timetamp, video_id) → md5(query + secret)
```

**成功响应：**

```json
{
  "isok": true,
  "data": {
    "video_url": "https://...",
    "poster": "https://...",
    "online": false,
    "size": 0,
    "limit": {
      "targetId": "...",
      "resourceId": "tk_vco_{userId}_{videoId}",
      "limit": 5,
      "endtime": 1719003600
    }
  }
}
```

**失败：** `{ "isok": false, "data": "未授权不能提供服务" }` 或购买/并发错误文案

---

### 5.2 getData 并发心跳

**地址（任选其一）：**

```
GET|POST {BASE}/getData/?json={...}
GET|POST {BASE}/?c=taokeajax&a=getData&json={...}
```

**当前已实现 cmd：**

```json
{
  "cmd": "video_orders",
  "data": {
    "action": "concurrencyLimiter",
    "targetId": "abc123",
    "resourceId": "tk_vco_1_1001",
    "limit": 5,
    "endtime": 1719003600
  }
}
```

**响应：** `{ "isok": true, "tip": "success" }`

---

## 六、接口总览表

| opt / 入口 | 方法 | 完整路径示例 | 场景 |
|------------|------|--------------|------|
| `courseList` | GET/POST | `/api/search_course.php?opt=courseList&...` | 选课中心列表 |
| `courseOrder` | GET/POST | `/api/search_course.php?opt=courseOrder&...` | 已购 ID |
| `getCourseByIds` | GET/POST | `/api/search_course.php?opt=getCourseByIds&...` | 批量查课 |
| `getOrderCourseByIds` | GET/POST | `/api/search_course.php?opt=getOrderCourseByIds&...` | 同 getCourseByIds |
| `getCourseBuyStatus` | GET/POST | `/api/search_course.php?opt=getCourseBuyStatus&...` | 批量购买态 |
| `videoSupplierNext` | GET/POST | `/api/search_course.php?opt=videoSupplierNext&...` | 套餐下一集 |
| `sync_course` | GET/POST | `/api/search_course.php?opt=sync_course&...` | PXB 课程类型回写 |
| `adsList` | GET/POST | `/api/search_course.php?opt=adsList&...` | 推荐位 |
| `getAccountBuyVideos` | GET/POST | `/api/search_course.php?opt=getAccountBuyVideos&...` | 未过期已购 |
| `VideoDetail` | GET/POST | `/api/search_course.php?opt=VideoDetail&...` | 客服视频详情 |
| `getCourseTopic` | GET/POST | `/api/search_course.php?opt=getCourseTopic&...` | 套餐树 |
| `getTopicCourses` | GET/POST | `/api/search_course.php?opt=getTopicCourses&...` | 包内课程 |
| `getTopicCourseIds` | GET/POST | `/api/search_course.php?opt=getTopicCourseIds&...` | 包内 ID |
| `generateOrder` | GET/POST | `/api/search_course.php?opt=generateOrder&...` | 下单 + 出库 ✅ |
| `getOrders` | GET/POST | `/api/search_course.php?opt=getOrders&...` | 订单列表（ihr 参数格式待兼容） |
| `restoreByOrderCode` | GET/POST | `/api/search_course.php?opt=restoreByOrderCode&...` | 订单重入库 |
| `getVideoIdsByOrderCode` | GET/POST | `/api/search_course.php?opt=getVideoIdsByOrderCode&...` | 订单视频 ID |
| `trainer` | GET/POST | `/api/get.php?opt=trainer&...` | 按姓名搜讲师 |
| `video_state` | GET/POST | `/api/get.php?opt=video_state&...` | 共享视频审核态 |
| `tkvideo` | POST | `/api/get.php?opt=tkvideo&...` + body `video=` | PXB 视频共享 |
| `related_tktrainer` | GET/POST | `/api/get.php?opt=related_tktrainer&...` | 讲师关联日志 |
| `get_trainer_list` | GET/POST | `/api/trainer.php?opt=get_trainer_list&...` | 师资库推荐列表 |
| `get_trainer_detail` | GET/POST | `/api/trainer.php?opt=get_trainer_detail&...` | 师资库讲师详情 |
| taokevideo 播放 | GET/POST | `/?c=taokevideo&a=player&from=pxbmobile&...` | APP/PC 播放 |
| getData 心跳 | GET/POST | `/getData/?json=...` | 并发控制 |

---

## 七、已验证场景与待办

### 7.1 已验证（可切 test / 生产前回归）

| 场景 | appid | 关键 opt / 说明 |
|------|-------|-----------------|
| 培训宝套餐选课 / 包内课列表 | `pxb` | `getTopicCourses`（如 package 780） |
| 培训宝套餐下单 + 入库 | `pxb` | `generateOrder` → saveCourses → 培训宝 tt_course |
| 套餐多门课入库 | `pxb` | 包订单推送包内全部 video + `packages_relation` |
| i人事在线课程下单 + 入库 | `wittrain` | `generateOrder` → `signature-urls` 出库 |
| 师资库 | `pxb` | `trainer.php`：`get_trainer_list` / `get_trainer_detail` |
| 讲师关联 | `pxb` | `get.php`：`related_tktrainer` |

### 7.2 尚未实现或待验证

- **getOrders（i人事参数格式）**：`uid[uids]` 嵌套参数兼容（见 **§2.3**）
- **get.php**：`tkvideo`、`video_state` 在 PXB「视频共享 / 审核」场景实机验证
- **P2 组织**：`syncOrgMember`、`bindOrgShop`
- **播放补全**：第三方供应商 v_type 7–11 播放 URL 完整签发（宽学/快课/中欧等）
- **移动站播放**：`/?c=taokevideo&a=player` 真机 / PXB APP 回归
- **member_provider 历史数据**：生产切流前评估是否从老库 `tk_member_provider` 迁移

---

## 八、快速联调

**环境准备：**

```powershell
# 复制并编辑 Legacy 相关环境变量
cp backend/.env.example backend/.env.local
# 必填：LEGACY_SIGNATURE_KEY_PXB / TAOKE、PXB_SITE_URL；接入商另配 WITTRAIN 密钥与 URL

# 首次启动需执行 Flyway（含 member_provider 表 V132）
cd backend/taoke-app
mvn flyway:repair   # 仅 checksum 冲突时
```

```powershell
cd backend/scripts

# 校验签名算法（无需启动后端）
python pxb-legacy-smoke.py check-sign

# 冒烟（含 search_course + get.php + trainer.php，需后端已启动）
python pxb-legacy-smoke.py suite --uid 你的uc_uid

# search_course 单个 opt
python pxb-legacy-smoke.py call --opt getCourseTopic --uid 123456
python pxb-legacy-smoke.py call --opt getTopicCourses --uid 123456 --param package_id=941
python pxb-legacy-smoke.py call --opt getCourseBuyStatus --uid 123456 --param courseids=1001,1002
python pxb-legacy-smoke.py call --opt generateOrder --uid 123456 --param package_ids=941 --param total=0

# get.php
python pxb-legacy-smoke.py call-get --opt trainer --param trainer_name=刘 --param accurate=1
python pxb-legacy-smoke.py call-get --opt video_state --param video_id=1001

# trainer.php（已验证可用）
python pxb-legacy-smoke.py call-trainer --opt get_trainer_list --param trade=15
python pxb-legacy-smoke.py call-trainer --opt get_trainer_detail --param role_id=756913
```

**浏览器 / curl 示例（trainer.php，参数可全放 Query）：**

```
http://localhost:8080/api/trainer.php?opt=get_trainer_list&appid=pxb&timetamp={ts}&signature={sig}&trade=15

http://localhost:8080/api/trainer.php?opt=get_trainer_detail&appid=pxb&timetamp={ts}&signature={sig}&role_id=756913
```

**Flyway 本地启动报错（V111/V112 checksum mismatch）时：**

```powershell
cd backend/taoke-app
mvn flyway:repair
```

**相关代码路径：**

- 模块：`backend/taoke-legacy/`、`backend/taoke-course/`（PXB 视频/订单）、`backend/taoke-user/`（讲师 / MemberProvider）
- 入口 Controller：`LegacySearchCourseController`、`LegacyGetController`、`LegacyTrainerController`、`LegacyMobileController`
- 配置：`backend/taoke-app/src/main/resources/application.yaml` → `taoke.legacy-api`；密钥见 `backend/.env.example`
- 出库实现：`PxbLegacyCourseSyncServiceImpl`（saveCourses）
- 用户映射：`PxbUserResolver`、`MemberProviderServiceImpl`
- DB 迁移：`V116__pxb_legacy_get_api.sql`、`V125__extend_orders_for_pxb_legacy.sql`、`V132__create_member_provider.sql` 等
