-- 录播课企业采购价与人数上限
ALTER TABLE videos
    ADD COLUMN company_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '企业采购封顶价（元）' AFTER price,
    ADD COLUMN max_purchase_qty INT NOT NULL DEFAULT 20 COMMENT '单次最多购买人数' AFTER company_price;

-- 视频包分组（全系列购买单元）,老库 tk_video_topic + tk_video_topic_item的结合，顶级结点（parent_id=0）即表示原来tk_video_topic 中的专题，其他节点则表示tk_video_topic_item中的系列课，video_package_labels则只是给video_package_groups 映射系列课/专题 名字的
CREATE TABLE video_package_groups (
    id                INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    package_id        INT             NOT NULL                    COMMENT '视频包 ID',
    topic_id          INT             NOT NULL DEFAULT 0          COMMENT '专题 ID',
    parent_id         INT             NOT NULL DEFAULT 0          COMMENT '父级专题 ID，顶级结点（parent_id=0）表示专题',
    name              VARCHAR(150)    NOT NULL DEFAULT ''         COMMENT '系列名称',
    price             DECIMAL(10, 2)  NOT NULL DEFAULT 0.00       COMMENT '系列单价（元/人/年）',
    company_price     DECIMAL(10, 2)  NOT NULL DEFAULT 0.00       COMMENT '企业采购封顶价（元）',
    max_purchase_qty  INT             NOT NULL DEFAULT 20         COMMENT '单次最多购买人数',
    video_count       INT             NOT NULL DEFAULT 0          COMMENT '系列内视频数',
    created_at        DATETIME        NOT NULL,
    updated_at        DATETIME        NOT NULL,
    UNIQUE KEY uk_pkg_group (package_id, topic_id, parent_id)
) COMMENT '录播课视频包分组（全系列购买）';
