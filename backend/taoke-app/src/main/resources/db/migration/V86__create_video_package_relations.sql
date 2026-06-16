-- 录播课视频包关系（老站 tk_video_package_relation + tk_video_topic_item 名称）
CREATE TABLE video_package_labels (
    id          INT          NOT NULL PRIMARY KEY COMMENT '对应老站 tk_video_topic_item.id',
    name        VARCHAR(150) NOT NULL DEFAULT '' COMMENT '包/专题名称',
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL
) COMMENT '录播课视频包名称';

CREATE TABLE video_package_relations (
    id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id    INT          NOT NULL COMMENT '录播课 ID',
    package_id  INT          NOT NULL COMMENT '视频包 ID（老站 packageId）',
    topic_id    INT          NOT NULL DEFAULT 0 COMMENT '专题 ID（老站 topicId）',
    parent_id   INT          NOT NULL DEFAULT 0 COMMENT '父级专题 ID（老站 parentId）',
    is_primary  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否该视频的主包关系（老站 is_first）',
    sort_order  INT          NOT NULL DEFAULT 0 COMMENT '包内排序（老站 serial）',
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL,
    UNIQUE KEY uk_video_package_topic (video_id, package_id, topic_id),
    KEY idx_package_group (package_id, topic_id, parent_id, sort_order),
    KEY idx_video_id (video_id)
) COMMENT '录播课所属视频包关系';
