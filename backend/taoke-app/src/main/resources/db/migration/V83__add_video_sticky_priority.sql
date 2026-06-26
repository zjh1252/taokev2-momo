-- V83: 录播课添加置顶优先级字段，管理端操作下拉框直接控制
-- 0=不限 1=列表推荐 2=列表置顶
ALTER TABLE videos ADD COLUMN sticky_priority TINYINT NOT NULL DEFAULT 0 COMMENT '置顶优先级: 0=不限 1=列表推荐 2=列表置顶' AFTER is_featured;

-- 将已有推荐数据迁移到新字段
-- 置顶（sortOrder >= 99999）→ sticky_priority=2
UPDATE videos SET sticky_priority = 2 WHERE sort_order >= 99999;
-- 推荐（is_featured=1 且非置顶）→ sticky_priority=1
UPDATE videos SET sticky_priority = 1 WHERE is_featured = 1 AND sort_order < 99999;

-- 为新字段建索引（默认排序时优先按此字段降序）
CREATE INDEX idx_videos_sticky_priority ON videos(sticky_priority);
