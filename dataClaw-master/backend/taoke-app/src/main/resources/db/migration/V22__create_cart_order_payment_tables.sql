-- ==============================================================
-- V22: 购物车 + 订单 + 支付 + 公开课报名 相关表
-- ==============================================================

-- 购物车
CREATE TABLE carts (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL                    COMMENT '用户ID',
    product_type    VARCHAR(20)     NOT NULL                    COMMENT '商品类型：OPEN_COURSE/VIDEO_COURSE',
    product_id      INT             NOT NULL                    COMMENT '商品ID（课程ID或录播课ID）',
    product_title   VARCHAR(200)    NOT NULL DEFAULT ''         COMMENT '商品标题（冗余快照）',
    product_cover   VARCHAR(500)    DEFAULT ''                  COMMENT '商品封面（冗余快照）',
    price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '加入时单价快照',
    quantity        INT             NOT NULL DEFAULT 1           COMMENT '数量',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_user_product (user_id, product_type, product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车';

-- 订单主表
CREATE TABLE orders (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_no        VARCHAR(32)     NOT NULL                    COMMENT '订单编号',
    user_id         INT             NOT NULL                    COMMENT '下单用户ID',
    total_amount    DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '订单原价合计',
    pay_amount      DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '实付金额',
    status          TINYINT         NOT NULL DEFAULT 0           COMMENT '订单状态：0=待支付 1=已支付 2=已取消 3=已退款 4=已过期',
    remark          VARCHAR(500)    DEFAULT ''                  COMMENT '用户备注',
    paid_at         DATETIME                                    COMMENT '支付时间',
    expired_at      DATETIME                                    COMMENT '过期时间（超时自动取消）',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_order_no (order_no),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- 订单明细
CREATE TABLE order_items (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id        INT             NOT NULL                    COMMENT '关联订单ID',
    product_type    VARCHAR(20)     NOT NULL                    COMMENT '商品类型：OPEN_COURSE/VIDEO_COURSE',
    product_id      INT             NOT NULL                    COMMENT '商品ID',
    product_title   VARCHAR(200)    NOT NULL DEFAULT ''         COMMENT '商品标题（下单快照）',
    product_cover   VARCHAR(500)    DEFAULT ''                  COMMENT '商品封面（下单快照）',
    price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '下单时单价',
    quantity        INT             NOT NULL DEFAULT 1           COMMENT '数量',
    subtotal        DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '小计金额',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细';

-- 支付记录
CREATE TABLE payments (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    payment_no      VARCHAR(32)     NOT NULL                    COMMENT '支付流水号',
    order_id        INT             NOT NULL                    COMMENT '关联订单ID',
    order_no        VARCHAR(32)     NOT NULL                    COMMENT '关联订单编号（冗余）',
    user_id         INT             NOT NULL                    COMMENT '支付用户ID',
    amount          DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '支付金额',
    method          VARCHAR(20)     NOT NULL DEFAULT 'MOCK'     COMMENT '支付方式：MOCK/ALIPAY/WECHAT',
    status          TINYINT         NOT NULL DEFAULT 0           COMMENT '支付状态：0=待支付 1=支付成功 2=支付失败 3=已退款',
    trade_no        VARCHAR(100)    DEFAULT ''                  COMMENT '第三方交易号',
    paid_at         DATETIME                                    COMMENT '支付完成时间',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_payment_no (payment_no),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录';

-- 公开课报名记录（结构与 video_enrollments 对齐）
CREATE TABLE course_enrollments (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_id       INT             NOT NULL                    COMMENT '公开课ID',
    user_id         INT             NOT NULL                    COMMENT '报名用户ID',
    order_id        INT             NOT NULL DEFAULT 0          COMMENT '关联订单ID',
    price_paid      DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '实付金额',
    enrolled_at     DATETIME                                    COMMENT '报名时间',
    expired_at      DATETIME                                    COMMENT '过期时间',
    status          TINYINT         NOT NULL DEFAULT 1           COMMENT '状态：1=有效 0=已取消/退款',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    INDEX idx_course_user (course_id, user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开课报名记录';
