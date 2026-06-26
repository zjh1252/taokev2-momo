# 新旧表映射说明

> 老站 DDL 来源：`docs/ddl/taoke_ddl.sql`

## 互动模块（V23）

| 新表 | 老表 | 说明 |
|------|------|------|
| `user_favorites` | `tk_collect_trainer_contact` | 老站只收藏讲师，新表通过 `target_type` 支持课程/讲师/机构/案例通用收藏 |
| `user_likes` | `tk_comment_support` / `tk_trainer_case`（点赞字段） | 老站点赞散落在多张表，新表统一为通用点赞 |
| `training_reviews` | `tk_comment_course` / `tk_comment_other_course` | 合并课程评价与非淘课课程评价；保留三维评分（内容/水平/服务）、图片、培训信息快照等核心字段；新增 `review_scope` 区分课程/专家评价 |
| `trainer_lead_messages` | `tk_advices` | 字段基本对齐（培训主题、联系人、公司、省市等），去掉了老表冗余的 `is_del` 改用状态管理 |

## 字段映射备注

- 老表 `tk_comment_course.course_score` / `teach_score` / `service_score` → 新表 `rating_content` / `rating_teaching` / `rating_service`
- 老表 `tk_comment_course.comment_img` (逗号分隔) → 新表 `photo_urls` (JSON 数组)
- 老表 `tk_advices.advices_title` → 新表 `training_topic`
- 老表 `tk_collect_trainer_contact` 仅支持讲师 → 新表 `user_favorites` 用 `target_type` 泛化
- 老表统计汇总表 `tk_comment_total` / `tk_comment_course_info` 等 → 新系统暂用实时聚合查询，后续按需加缓存
