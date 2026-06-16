-- 发票申请（用户中心-我的订单 申请发票）
CREATE TABLE invoice_requests (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id        INT             NOT NULL                COMMENT '订单 ID',
    order_no        VARCHAR(32)     NOT NULL                COMMENT '订单编号',
    user_id         INT             NOT NULL                COMMENT '申请用户 ID',
    invoice_type    VARCHAR(20)     NOT NULL                COMMENT '发票类型：SPECIAL=全电发票-增值税专用发票 NORMAL=全电发票-普通发票',
    title_type      VARCHAR(20)     NOT NULL                COMMENT '抬头类型：PERSONAL=个人 COMPANY=企业',
    amount          DECIMAL(10,2)   NOT NULL                COMMENT '开票金额（订单实付金额，不可修改）',
    title           VARCHAR(200)    NOT NULL                COMMENT '发票抬头',
    tax_no          VARCHAR(50)     NOT NULL DEFAULT ''     COMMENT '纳税人识别号（企业抬头）',
    bank_name       VARCHAR(100)    NOT NULL DEFAULT ''     COMMENT '开户银行（企业抬头）',
    bank_account    VARCHAR(50)     NOT NULL DEFAULT ''     COMMENT '银行账号（企业抬头）',
    company_address VARCHAR(255)    NOT NULL DEFAULT ''     COMMENT '企业地址（企业抬头）',
    company_phone   VARCHAR(30)     NOT NULL DEFAULT ''     COMMENT '企业电话（企业抬头）',
    email           VARCHAR(100)    NOT NULL                COMMENT '接收发票的邮箱',
    status          TINYINT(2)      NOT NULL DEFAULT 0      COMMENT '状态：0=待开票 1=已开票 2=已驳回',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_invoice_requests_user (user_id, created_at),
    KEY idx_invoice_requests_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发票申请';
