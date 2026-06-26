-- V70: 清理 V68 回填产生的脏数据
-- V68 错误地将 goodat（擅长课题长文本）填入了 expertise_tags（关键标签）
-- 并将无效的 job 数据（如纯标点）填入了 title

-- 1. 清空被填入长文本的 expertise_tags（真正标签字符串总长度不会超过 200）
UPDATE user_trainers
SET expertise_tags = NULL,
    updated_at = NOW()
WHERE expertise_tags IS NOT NULL
  AND TRIM(expertise_tags) <> ''
  AND CHAR_LENGTH(expertise_tags) > 200;

-- 2. 清空纯标点的无效 title
UPDATE user_trainers
SET title = NULL,
    updated_at = NOW()
WHERE title IS NOT NULL
  AND TRIM(title) <> ''
  AND title REGEXP '^[[:space:][:punct:]]+$';
