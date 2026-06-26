-- 新增专家编号字段
ALTER TABLE user_trainers ADD COLUMN trainer_code VARCHAR(10) DEFAULT NULL COMMENT '专家编号，如 TK-A1B2C3';
CREATE UNIQUE INDEX idx_trainer_code ON user_trainers(trainer_code);
