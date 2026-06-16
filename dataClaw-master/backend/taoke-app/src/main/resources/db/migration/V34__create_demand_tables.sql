-- ============================================================
-- 培训需求模块：需求主表 + 跟进记录表
-- ============================================================

CREATE TABLE demands (
    id              INT           NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id         INT           NOT NULL                COMMENT '提交人用户 ID，关联 users.id',
    enterprise_id   INT           NULL                    COMMENT '企业信息 ID，关联 user_enterprise_buyers.id',
    demand_type     VARCHAR(30)   NOT NULL                COMMENT '需求类型：DEFAULT=首页发布, TRAINING=企业培训, CASE_CUSTOM=案例定制, INTERNAL_RESERVATION=内训课预约',
    title           VARCHAR(200)  NOT NULL DEFAULT ''     COMMENT '需求标题',
    training_topic  VARCHAR(200)  NOT NULL DEFAULT ''     COMMENT '培训主题',
    trainee_count   INT           NULL                    COMMENT '培训人数',
    budget_min      DECIMAL(12,2) NULL                    COMMENT '预算最低金额',
    budget_max      DECIMAL(12,2) NULL                    COMMENT '预算最高金额',
    expected_start_date DATE      NULL                    COMMENT '期望开始日期',
    format          VARCHAR(20)   NULL                    COMMENT '培训形式：ONLINE=线上, OFFLINE=线下, HYBRID=混合',
    description     TEXT          NULL                    COMMENT '需求详细描述',
    source_case_id  INT           NULL                    COMMENT '来源案例 ID（案例定制时关联 cases.id）',
    source_course_id INT          NULL                    COMMENT '来源课程 ID（内训课预约时关联）',
    status          TINYINT(2)    NOT NULL DEFAULT 1      COMMENT '状态：1=已提交, 2=处理中, 3=已匹配, 4=已完成, 5=已取消',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_demands_user_id (user_id),
    INDEX idx_demands_enterprise_id (enterprise_id),
    INDEX idx_demands_status (status),
    INDEX idx_demands_demand_type (demand_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训需求主表';


CREATE TABLE demand_follow_ups (
    id          INT           NOT NULL AUTO_INCREMENT COMMENT '主键',
    demand_id   INT           NOT NULL                COMMENT '关联 demands.id',
    operator_id INT           NOT NULL                COMMENT '操作人 ID，关联 users.id',
    action      VARCHAR(50)   NOT NULL                COMMENT '操作类型：STATUS_CHANGE=状态变更, CS_NOTE=客服备注, CONTACT_RECORD=沟通记录, ASSIGN_CS=分派客服, MATCH_TRIGGER=触发匹配, SYNC_RETRY=同步重试',
    content     TEXT          NULL                    COMMENT '操作内容/备注详情',
    old_status  TINYINT(2)    NULL                    COMMENT '变更前状态（STATUS_CHANGE 时记录）',
    new_status  TINYINT(2)    NULL                    COMMENT '变更后状态（STATUS_CHANGE 时记录）',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_demand_follow_ups_demand_id (demand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='需求跟进记录表';
