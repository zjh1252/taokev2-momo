-- 站内信通知表
CREATE TABLE `sys_notifications` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`     INT          NOT NULL COMMENT '接收用户 ID',
    `type`        VARCHAR(32)  NOT NULL COMMENT '通知类型：SYSTEM / APPLY_RESULT / ORDER / COMMENT',
    `title`       VARCHAR(200) NOT NULL COMMENT '通知标题',
    `content`     TEXT                  COMMENT '通知正文',
    `related_id`  VARCHAR(64)           COMMENT '关联业务 ID（如专家申请 userId、订单 ID 等）',
    `related_url` VARCHAR(500)          COMMENT '点击跳转路径',
    `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否已读：0=未读，1=已读',
    `created_at`  DATETIME     NOT NULL,
    `updated_at`  DATETIME     NOT NULL,
    INDEX `idx_user_read` (`user_id`, `is_read`),
    INDEX `idx_user_created` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内信通知';
