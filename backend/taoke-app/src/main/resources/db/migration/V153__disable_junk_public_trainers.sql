-- 下线公开列表中的占位/测试专家档案（status=4 禁用，不再出现在 C 端列表）
-- 规则保守：占位简介文案、或未完成的英文账号型档案（低互动 + 无有效标签 + 无头衔）
-- 可重复执行（仅 status=2 命中）

UPDATE user_trainers
SET status = 4,
    is_trusted = 0,
    updated_at = NOW()
WHERE status = 2
  AND (
    TRIM(IFNULL(one_line_intro, '')) LIKE '%一句话简介%定位%'
    OR TRIM(IFNULL(one_line_intro, '')) LIKE '%一句话简介自己%'
    OR TRIM(IFNULL(one_line_intro, '')) = '80 字内简短介绍自己'
    OR (
      name REGEXP '^[A-Za-z][A-Za-z0-9._-]{0,15}$'
      AND COALESCE(comment_count, 0) = 0
      AND COALESCE(view_count, 0) < 1000
      AND (title IS NULL OR TRIM(title) = '')
      AND (
        expertise_tags IS NULL
        OR TRIM(expertise_tags) = ''
        OR TRIM(expertise_tags) = '其它'
      )
    )
    OR (
      COALESCE(comment_count, 0) = 0
      AND COALESCE(view_count, 0) < 200
      AND (title IS NULL OR TRIM(title) = '')
      AND (intro IS NULL OR TRIM(intro) = '')
      AND (good_at IS NULL OR TRIM(good_at) = '')
      AND (
        expertise_tags IS NULL
        OR TRIM(expertise_tags) = ''
        OR TRIM(expertise_tags) = '其它'
      )
      AND (
        avatar LIKE '%ui-avatars%'
        OR avatar LIKE '%nophoto%'
        OR avatar LIKE '%expert-main%'
        OR avatar LIKE '%placeholder%'
      )
    )
  );
