-- 录播课「封顶价」批量采购优惠：封顶人数 + 封顶价
-- cap_count = 0 表示「不限」（不封顶）；cap_price 为 NULL 表示「不设置」
ALTER TABLE videos
    ADD COLUMN cap_count INT NOT NULL DEFAULT 0
        COMMENT '封顶人数：0=不限'
        AFTER is_free,
    ADD COLUMN cap_price DECIMAL(10,2) NULL
        COMMENT '封顶价（批量采购优惠价，单价×封顶人数），NULL=不设置'
        AFTER cap_count;
