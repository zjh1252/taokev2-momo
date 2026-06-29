# 微信小程序 · 真机预览说明

## 1. 导入哪个目录

| 场景 | 目录 | 命令 |
|------|------|------|
| 模拟器联调本地后端 | `dist/dev/mp-weixin` | `pnpm dev:mp-weixin`（需保持终端运行） |
| 一次性编译（本地 API + CDN 图片） | `dist/build/mp-weixin` | `pnpm build:mp-weixin:dev` |
| **手机扫码预览（推荐）** | `dist/build/mp-weixin` | `pnpm preview:mp-weixin` |

改 `.env*` 后若模拟器仍走旧地址，先停掉 `dev:mp-weixin` 再重新运行，或直接 `pnpm build:mp-weixin:dev` 后重新导入 `dist/build/mp-weixin`。

## 2. 二维码预览「请求拒绝」

上传成功但手机扫码后提示拒绝，**99% 是微信号权限问题**，与代码无关。

### 检查清单

1. **开发者工具登录的微信**，必须是该小程序 AppID（`wx87516f22952283b1`）的**管理员或开发者**
   - 右上角头像 → 退出后，用有权限的微信号重新登录

2. **扫码的手机微信**，也要加入小程序成员：
   - 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com)
   - 开发管理 → 开发设置 → 成员管理
   - 把扫码微信号加为 **项目成员（开发者）** 或 **体验成员**

3. **AppID 一致**
   - 开发者工具项目 AppID = `manifest.json` → `mp-weixin.appid`
   - 不要用「测试号」打开正式 AppID 的项目

4. **用手机预览 test 包**（真机无法访问 `localhost`）：
   ```bash
   pnpm preview:mp-weixin
   ```
   微信开发者工具导入 `dist/build/mp-weixin` → 预览扫码

5. 仍失败时：换 **稳定版** 微信开发者工具（少用 Nightly），清缓存后重试

## 3. 域名白名单（真机必配）

公众平台 → 开发管理 → 开发设置 → 服务器域名：

- request：`https://v2.taoke.com`
- downloadFile：`https://v2.taoke.com`、`https://www.taoke.com`、`https://cdn5-pxb-videos.taoke.com`
- uploadFile：`https://v2.taoke.com`（如有头像上传）

> 迁移自老站的专家头像（`/attachments/`）、案例封面（`taoke/upload/`）分别走 `www.taoke.com` 与 PXB CDN，**downloadFile 白名单必须包含这两个域名**，否则图片会显示空白。
