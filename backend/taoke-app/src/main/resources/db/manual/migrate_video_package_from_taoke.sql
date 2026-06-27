-- =============================================================================
-- 录播课视频包：老库 taoke → 新库 手工迁移脚本
-- =============================================================================
-- 模型说明：
--   video_package_groups  = tk_video_topic（专题头，topic_id=0,parent_id=0）
--                         + tk_video_topic_item（系列课节点）
--   video_package_labels  = topic_item.id → name（供 relations 快速取展示名）
--   video_package_relations = tk_video_package_relation
--
-- 前置条件：
--   1. 同一 MySQL 实例可访问 taoke 库与本库（如 v3test）
--   2. 已执行 Flyway V86/V87/V130/V131（groups 含 is_open 及 PXB 展示列）
--   3. videos 表已迁入（relations 仅导入已存在视频）
--
-- 用法（在服务器 mysql 客户端）：
--   USE v3test;          -- 改成你的新库名
--   SOURCE /path/to/migrate_video_package_from_taoke.sql;
--
-- 可重复执行：groups/labels/relations 使用 ON DUPLICATE KEY UPDATE
-- =============================================================================

SET NAMES utf8mb4;
SET @legacy_schema = 'taoke';

-- ---------------------------------------------------------------------------
-- Step 0（可选）：清空目标表后全量重迁 — 首次迁移请去掉注释
-- ---------------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE video_package_relations;
-- TRUNCATE TABLE video_package_labels;
-- TRUNCATE TABLE video_package_groups;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Step 1：专题头 tk_video_topic → video_package_groups
--   (package_id=topic.id, topic_id=0, parent_id=0)
-- ---------------------------------------------------------------------------
INSERT INTO video_package_groups (
    package_id, topic_id, parent_id, name,
    price, company_price, max_purchase_qty, video_count,
    type, serial_index, item_index, package_code, descr, cover, is_open,
    created_at, updated_at
)
SELECT
    t.id,
    0,
    0,
    IFNULL(t.topic_name, ''),
    0.00,
    0.00,
    20,
    0,
    0,
    0,
    0,
    '',
    NULL,
    NULL,
    IFNULL(t.is_open, 1),
    IF(t.createtime > 0, FROM_UNIXTIME(t.createtime), NOW()),
    IF(t.updatetime > 0, FROM_UNIXTIME(t.updatetime), NOW())
FROM taoke.tk_video_topic t
WHERE t.disabled = 0
ON DUPLICATE KEY UPDATE
    name       = VALUES(name),
    is_open    = VALUES(is_open),
    updated_at = VALUES(updated_at);

-- ---------------------------------------------------------------------------
-- Step 2：系列课 tk_video_topic_item → video_package_groups
--   (package_id=topic_id, topic_id=item.id, parent_id=item_parent)
-- ---------------------------------------------------------------------------
INSERT INTO video_package_groups (
    package_id, topic_id, parent_id, name,
    price, company_price, max_purchase_qty, video_count,
    type, serial_index, item_index, package_code, descr, cover,
    created_at, updated_at
)
SELECT
    i.topic_id,
    i.id,
    IFNULL(i.item_parent, 0),
    IFNULL(i.item_name, ''),
    IFNULL(i.price, 0),
    IFNULL(i.company_price, 0.00),
    20,
    0,
    IFNULL(i.type, 0),
    IFNULL(i.serial_index, 0),
    IFNULL(i.item_index, 0),
    IFNULL(i.package, ''),
    i.descr,
    i.cover,
    IF(i.createtime > 0, FROM_UNIXTIME(i.createtime), NOW()),
    IF(i.updatetime > 0, FROM_UNIXTIME(i.updatetime), NOW())
FROM taoke.tk_video_topic_item i
WHERE i.disabled = 0
ON DUPLICATE KEY UPDATE
    name           = VALUES(name),
    price          = VALUES(price),
    company_price  = VALUES(company_price),
    type           = VALUES(type),
    serial_index   = VALUES(serial_index),
    item_index     = VALUES(item_index),
    package_code   = VALUES(package_code),
    descr          = VALUES(descr),
    cover          = VALUES(cover),
    updated_at     = VALUES(updated_at);

-- ---------------------------------------------------------------------------
-- Step 3：labels（仅 topic_item.id → name）
-- ---------------------------------------------------------------------------
INSERT INTO video_package_labels (id, name, created_at, updated_at)
SELECT
    i.id,
    IFNULL(i.item_name, ''),
    IF(i.createtime > 0, FROM_UNIXTIME(i.createtime), NOW()),
    IF(i.updatetime > 0, FROM_UNIXTIME(i.updatetime), NOW())
FROM taoke.tk_video_topic_item i
WHERE i.disabled = 0
ON DUPLICATE KEY UPDATE
    name       = VALUES(name),
    updated_at = VALUES(updated_at);

-- ---------------------------------------------------------------------------
-- Step 4：relations（仅 videos 已存在的记录）
-- ---------------------------------------------------------------------------
INSERT INTO video_package_relations (
    video_id, package_id, topic_id, parent_id, is_primary, sort_order,
    created_at, updated_at
)
SELECT
    r.videoId,
    r.packageId,
    IFNULL(r.topicId, 0),
    IFNULL(r.parentId, 0),
    IF(r.is_first = 1, 1, 0),
    IFNULL(r.serial, 0),
    NOW(),
    NOW()
FROM taoke.tk_video_package_relation r
INNER JOIN videos v ON v.id = r.videoId
ON DUPLICATE KEY UPDATE
    parent_id  = VALUES(parent_id),
    is_primary = VALUES(is_primary),
    sort_order = VALUES(sort_order),
    updated_at = VALUES(updated_at);

-- ---------------------------------------------------------------------------
-- Step 5a：系列节点 video_count（按 relations 三元组聚合）
-- ---------------------------------------------------------------------------
UPDATE video_package_groups g
INNER JOIN (
    SELECT
        r.package_id,
        r.topic_id,
        r.parent_id,
        COUNT(DISTINCT r.video_id) AS cnt
    FROM video_package_relations r
    GROUP BY r.package_id, r.topic_id, r.parent_id
) x ON g.package_id = x.package_id
   AND g.topic_id = x.topic_id
   AND g.parent_id = x.parent_id
SET g.video_count = x.cnt,
    g.updated_at  = NOW()
WHERE g.topic_id > 0;

-- ---------------------------------------------------------------------------
-- Step 5b：专题头 video_count（该专题下全部视频数）
-- ---------------------------------------------------------------------------
UPDATE video_package_groups g
INNER JOIN (
    SELECT r.package_id, COUNT(DISTINCT r.video_id) AS cnt
    FROM video_package_relations r
    GROUP BY r.package_id
) x ON g.package_id = x.package_id
SET g.video_count = x.cnt,
    g.updated_at  = NOW()
WHERE g.topic_id = 0 AND g.parent_id = 0;
