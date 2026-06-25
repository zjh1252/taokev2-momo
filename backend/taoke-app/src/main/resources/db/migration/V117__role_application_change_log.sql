-- V111: role application change log — track field-level diffs when active users re-submit for re-review
CREATE TABLE role_application_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  role VARCHAR(32) NOT NULL COMMENT '角色编码',
  change_batch VARCHAR(64) NOT NULL COMMENT '变更批次号，同一次提交共享',
  field_name VARCHAR(64) NOT NULL COMMENT '变更字段名',
  field_label VARCHAR(64) NOT NULL COMMENT '字段中文名',
  old_value TEXT COMMENT '旧值',
  new_value TEXT COMMENT '新值',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_role (user_id, role),
  INDEX idx_batch (change_batch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色申请资料变更日志';
