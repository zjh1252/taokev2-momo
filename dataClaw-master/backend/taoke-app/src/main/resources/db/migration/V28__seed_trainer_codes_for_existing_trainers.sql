-- 为已有且尚未分配专家编号的专家批量生成 trainer_code
-- 规则: TK-{6位大写字母数字混合}，使用 MD5(id) 取不同位置片段，减少碰撞概率
UPDATE user_trainers
SET trainer_code = CONCAT('TK-',
    UPPER(SUBSTRING(MD5(CONCAT('taoke_trainer_seed_', id)), 1, 6)))
WHERE trainer_code IS NULL
   OR trainer_code = '';
