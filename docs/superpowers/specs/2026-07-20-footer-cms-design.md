# 首页底部栏 CMS 设计

> 版本：v1.0 | 日期：2026-07-20

## 目标

C 端首页 Footer 全部展示字段可由后台「平台运营管理 → 底部管理」配置；各导航小字点击跳转到对应站内静态页、站内路由或外链。

## 方案

采用 **static_pages + footer_links + footer_config** 三层结构，对齐 CMS PRD 的 `static_pages` 设计。

| 层 | 职责 |
|----|------|
| `footer_config` | 单行全局配置：品牌副标题、公司简介、电话、主二维码、版权/ICP 等 |
| `footer_links` | 五个分区下的链接项：展示文案、跳转类型、目标、排序、启用 |
| `static_pages` | 富文本静态页内容（关于淘课、服务条款等） |

## 链接类型

- `INTERNAL` — 站内路由，如 `/`、`/articles`
- `STATIC_PAGE` — 跳转 `/pages/{pageCode}`，内容来自 `static_pages`
- `EXTERNAL` — 外链 URL，新窗口打开
- `NONE` — 无跳转（联系我们社交项，可配二维码弹层）

## 后台分区

1. **网站导航**（6 项）：淘课网首页、淘课百科、《快乐培训》期刊、DISC性格测评、使用帮助、站点地图
2. **关于我们**（3 项）：关于淘课、联系我们、招聘英才
3. **商务服务**（2 项）：商务合作、广告服务
4. **法律声明**（3 项）：服务条款、法律声明、隐私保护
5. **联系我们**：3 个社交项 + 全局电话/主二维码（在 footer_config）

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/footer/public` | C 端 Footer 聚合数据 |
| GET | `/pages/public/{pageCode}` | C 端静态页 |
| GET | `/admin/footer` | 后台完整配置 |
| PUT | `/admin/footer/config` | 更新全局配置 |
| PUT | `/admin/footer/links/{itemCode}` | 更新单条链接 |
| GET/PUT | `/admin/footer/pages/{pageCode}` | 静态页读写 |

## C 端

- `AppFooter` 服务端/客户端拉取 `/footer/public`，失败时回退内置默认值
- 新增 `/(public)/pages/[code]/page.tsx` 渲染 HTML 内容

## 权限

后台接口 `@RequireRole(SUPER_ADMIN)`，与轮播图管理一致。
