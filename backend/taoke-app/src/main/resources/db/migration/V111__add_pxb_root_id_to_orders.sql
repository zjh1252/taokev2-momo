-- 培训宝 legacy 集成：订单/报名记录增加 pxb_root_id，对齐老站 tk_video_order.pxb_root_id
ALTER TABLE orders
    ADD COLUMN pxb_root_id INT NOT NULL DEFAULT 0 COMMENT '培训宝 root_company_id，0=不限组织' AFTER user_id;

CREATE INDEX idx_orders_pxb_root_id ON orders (pxb_root_id, status);
