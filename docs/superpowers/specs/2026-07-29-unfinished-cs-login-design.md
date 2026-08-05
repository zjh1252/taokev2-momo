# 待优化记录未完成项（本仓可闭环）设计

**日期**：2026-07-29  
**来源**：`docs/tmp/待优化记录.pdf` #18  
**范围**：仅 `frontend/`  

## 非目标

- #15–#17、#19–20 智能客服相关：代码不在本仓，**不做**  
- Batch C/D（#1/#2/#4/#7/#8）另开  

## #18 登录协议链接（新站页）

老站 `about/27.htm`（服务条款）、`about/29.htm`（隐私保护）正文**已迁入**新站：

| 登录文案 | 新站路径 | 内容来源 |
|----------|----------|----------|
| 《用户服务协议》 | `/about/terms` | `LEGACY_ABOUT_HTML.terms` |
| 《隐私政策》 | `/about/privacy` | `LEGACY_ABOUT_HTML.privacy` |

登录/注册用 `Link` 打开上述路径（`target="_blank"`），**不**再跳老站 `taoke.com`。

常量：`features/auth/constants/legal.ts`

## 验收

登录/注册点击协议 → 新标签打开本站 `/about/terms`、`/about/privacy`，正文与老站一致。
