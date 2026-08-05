# 老站数据迁移恢复对照

本文基于当前仓库、`data-trans/v3test.sql`、`data-trans/v3test1.sql`、`data-trans/taoke.sql`，以及 2026-08-03 对测试生产老库 `taoke` 的预检结果。

## 当前结论

生产迁移入口是 `data-trans/scripts/run_production_migration.py`。按当前脚本，专家、机构、公开课、内训课、录播课、课程排期、课程图片、订单、报名、录播权益、评价、案例、需求、需求跟进、收藏、经纪人和讲师咨询留言这些主业务链路已经接入迁移。

需要区分两个口径：

- 如果目标是“生产只有老库，迁出新系统可用的老站主业务效果”，当前链路可以做到，前提是生产老库存在预检要求的源表。
- 如果目标是“逐行复制当前 `v3test1.sql` 这份新库所有数据”，只靠老库不能保证。`v3test1.sql` 里有新系统 2026 年运行产生的数据、运营配置、测试/样例绑定、备份表和日志表，这些没有老库等价来源。

真实测试老库预检已通过这些关键源表：

```text
[ok] recorded_course_master
[ok] recorded_course_chapters
[ok] trainer_work_experiences
[ok] trainer_books
[ok] trainer_exact_category_relations
[ok] institution_legacy_statistics
[ok] video_carts
[ok] video_orders
[ok] video_comments
```

上传的 `data-trans/taoke.sql` 仍然缺少部分录播和补充源表，例如 `tk_video`、`tk_video_series`、`tk_video_order*`、`tk_video_comment`、`tk_video_cart`、`tk_member_work`、`tk_trainer_books`、`tk_membercate_relation`、`tk_membergood_relation`、`tk_trade`、`tk_statistics`。所以以上传 dump 单独验证会看到缺源；以真实生产老库预检为准。

## 生产总入口

只做预检，不写数据：

```bash
uv run python data-trans/scripts/run_production_migration.py \
  --source-dsn "mysql://old_user:old_pwd@old-host:3306/taoke?charset=utf8mb4" \
  --target-dsn "mysql://new_user:new_pwd@new-host:3306/taoke_v3?charset=utf8mb4" \
  --legacy-db taoke \
  --schema-mode none \
  --preflight-only \
  --fail-on-known-gaps \
  --fail-on-missing-optional
```

生产新建目标库并执行：

```bash
uv run python data-trans/scripts/run_production_migration.py \
  --source-dsn "mysql://old_user:old_pwd@old-host:3306/taoke?charset=utf8mb4" \
  --target-dsn "mysql://new_user:new_pwd@new-host:3306/taoke_v3?charset=utf8mb4" \
  --legacy-db taoke \
  --create-target-database \
  --fail-on-known-gaps \
  --fail-on-missing-optional \
  --apply
```

默认 `--schema-mode flyway`，会先用当前项目 Flyway 建最新结构和种子数据，再跑 `data-trans` 数据脚本。目标库已经初始化时，用 `--schema-mode none --apply` 只迁数据。

## 已覆盖的老库迁移

| 模块 | 新库表 | 老库来源 |
| --- | --- | --- |
| 用户和角色 | `sys_users`、`sys_user_roles` | `tk_member`、`tk_member_ext`、`tk_member.groupid`、`tk_agent_info` |
| 买家 | `user_buyers`、`user_enterprise_buyers` | `tk_member`、`tk_member_ext` |
| 专家 | `user_trainers` | `tk_member(groupid=9)`、`tk_member_ext`、`tk_member_authinfo` |
| 机构 | `user_institutions` | `tk_member(groupid=3)`、`tk_member_ext`、`tk_member_authinfo` |
| 经纪人 | `user_agents`、`user_agent_trainer_bindings` | `tk_agent_info`、`tk_agent_trainer` |
| 专家履历 | `trainer_educations`、`trainer_honors`、`trainer_work_experiences`、`user_trainer_books` | `tk_member_education`、`tk_member_honor`、`tk_member_work`、`tk_trainer_books` |
| 专家分类 | `trainer_expertise_categories`、`trainer_industry_categories` | `tk_membercate_relation`、`tk_membergood_relation`、`tk_cate`、`tk_trade` |
| 公开课和内训课 | `courses` | `tk_courseinfo`、`tk_coursedata`、`tk_course`、`tk_member`、`tk_cate` |
| 公开课排期 | `course_plans` | `tk_course` |
| 课程图片 | `course_images` | `tk_course_pic` |
| 课程订单 | `orders`、`order_items`、`payments`、`course_enrollments` | `tk_course_order`、`tk_course_order_course`、`tk_course_order_pay`、`tk_course_signup` |
| 录播课 | `videos`、`video_series`、`video_chapters` | `tk_video`、`tk_video_series`、`tk_cate`、`tk_videocate_relation` |
| 录播订单 | `orders`、`order_items`、`payments`、`video_enrollments` | `tk_video_order`、`tk_video_order_detail` |
| 录播学员汇总 | `video_students` | 从有效 `video_enrollments` 派生 |
| 录播包 | `video_package_labels`、`video_package_groups`、`video_package_relations` | `tk_video_topic`、`tk_video_topic_item`、`tk_video_package_relation` |
| 录播供应商 | `video_suppliers`、`video_supplier_categories`、`video_supplier_category_videos` | `tk_video_topic`、`tk_video_topic_item`、`tk_video_package_relation`、`tk_member` |
| 录播评论 | `video_comments` | `tk_video_comment` |
| 录播购物车 | `carts` 中的 `VIDEO_COURSE` | `tk_video_cart` |
| 案例和评价 | `user_trainer_cases`、`training_reviews` | `tk_comment_course` |
| 需求 | `demands`、`demand_follow_ups` | `tk_demand`、`tk_company_demand`、`tk_demand_org_find_trainer`、`tk_bid`、`tk_bid_comments` |
| 留资咨询 | `trainer_lead_messages` | `tk_advices` |
| 收藏 | `user_favorites` | `tk_course_fav`、`tk_member_fav`、`tk_attention`、`tk_collect_trainer_contact` |
| 供应侧来源 | `member_provider` | `tk_member_provider` |
| 迁后补齐 | 课程统计、评价统计、机构统计、讲师认证/可信标记 | 已迁数据、`tk_member_auth`、`tk_statistics` |

## 不从老库强行迁的表

这些表不是当前老库迁移漏项。

| 类型 | 表 | 原因 |
| --- | --- | --- |
| Flyway 和种子 | `sys_roles`、`sys_permissions`、`sys_role_permissions`、`common_regions`、`sys_categories`、`notification_templates`、`sys_sensitive_words`、`footer_config`、`footer_links`、`static_pages`、`recommendation_slot_configs`、`flyway_schema_history` | 应由当前新系统 schema/种子产生 |
| 新系统运行态 | `sys_notifications`、`sys_verification_codes`、`sys_user_sessions`、`sys_user_operation_logs`、`sys_user_oauth_bindings`、`role_application_change_logs`、`sys_user_tags` | 登录、验证码、通知、操作日志等，不能从老库还原当前状态 |
| 观看进度 | `video_chapter_progress` | 真实播放进度没有老库等价源，不能从订单或权益伪造 |
| 新系统交易附属 | `course_reserves`、`invoice_requests` | 当前样例是 2026 年新系统运行数据，老库没有稳定一对一来源 |
| 运营/CMS/抓取 | `home_banners`、`recommended_resources`、`ops_materials`、`crawl_jobs`、`crawl_sources`、`crawled_courses`、`crawled_trainers` | 属于运营配置、素材库、抓取中间数据 |
| 新角色样例/手工绑定 | `user_assistants`、`user_trainer_assistant_bindings`、`user_enterprise_agents`、`user_enterprise_agent_members`、`user_enterprise_agent_trainer_bindings`、`user_institution_employees`、`user_institution_employee_bindings`、`user_institution_trainer_bindings`、`agent_work_experiences`、`institution_venues` | 当前新库里主要是 2026 年手工/样例数据，老库无可靠映射 |
| 联盟申请 | `alliance_ambassador_applications`、`alliance_lecturer721_applications`、`alliance_partner_applications` | 新业务申请数据，老库无等价业务源 |
| 专家内容附件 | `user_trainer_case_files`、`user_trainer_highlights`、`user_trainer_highlight_files` | 当前新库附件多为新系统上传；老库案例主数据已迁，但附件没有可靠完整来源 |
| 备份和排障 | `bak_course_detail_20260706_01`、`bak_course_detail_after_wrong_source_20260706_01`、`pxb_trainer_related_logs` | 备份表和临时排障记录，不参与业务迁移 |
| 空表或暂不启用 | `enterprise_buyer_work_experiences`、`user_likes`、`user_uc_member_links`、`user_uc_org_links` | 当前参考库无有效业务数据，或不是老库迁移主链路 |

`carts` 是部分覆盖：`VIDEO_COURSE` 已从 `tk_video_cart` 迁移；当前 `v3test1.sql` 里还有 3 条 `OPEN_COURSE` 购物车，属于新系统运行后产生的数据，生产只有老库时不保证复原。

## 验证命令

当前已执行并通过：

```bash
uv run python -m unittest discover -s data-trans\tests -p "test_*.py" -v
uv run python -m compileall -q data-trans\scripts
uv run python data-trans\scripts\run_production_migration.py --source-dsn "...taoke..." --target-dsn "...v3test..." --legacy-db taoke --schema-mode none --preflight-only
```

结论：剩余未覆盖表主要是新系统运行态、运营态、样例/手工数据、备份表或没有老库等价源的附件/进度数据。它们不能靠“只有老数据库”保证逐行复刻，但不影响从老库恢复淘课网主业务数据到当前新库结构。
