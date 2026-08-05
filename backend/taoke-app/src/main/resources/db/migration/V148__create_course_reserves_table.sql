-- 线上公开课预约记录（免费预约 / 付费购买后自动生成）
CREATE TABLE course_reserves (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL                    COMMENT '预约学员用户 ID',
    course_id       INT             NOT NULL                    COMMENT '课程 ID',
    order_id        INT             NOT NULL DEFAULT 0          COMMENT '关联订单 ID（免费预约为 0）',
    reserve_status  TINYINT         NOT NULL DEFAULT 1          COMMENT '1=预约成功 0=已取消',
    reserved_at     DATETIME        NOT NULL                    COMMENT '预约时间',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_user_course (user_id, course_id),
    INDEX idx_course_id (course_id),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='线上公开课预约记录';
