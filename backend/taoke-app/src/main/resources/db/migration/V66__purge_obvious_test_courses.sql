-- 清理公开课/内训课明显测试数据（手工录入、纯数字标题、测试讲师等）
-- 规则与 data-trans/scripts/_purge_obvious_test_courses.py 保持一致

DROP TEMPORARY TABLE IF EXISTS tmp_purge_test_course_ids;
CREATE TEMPORARY TABLE tmp_purge_test_course_ids (id INT PRIMARY KEY);

INSERT INTO tmp_purge_test_course_ids (id)
SELECT c.id
FROM courses c
WHERE c.type IN ('INTERNAL', 'OPEN_OFFLINE', 'OPEN_ONLINE')
  AND (
    c.id BETWEEN 21 AND 26
    OR c.title LIKE '测试课程%'
    OR c.title = 'test'
    OR c.title LIKE '发布测试%'
    OR (
      c.title LIKE '%测试课程%'
      AND c.title NOT REGEXP '软件测试|硬件测试|TestBank|测试工程师|测试技术|测试过程|测试管理|测试培训|心理测试|性格测试|测评软件|白盒测试|国际化软件'
    )
    OR c.title REGEXP '^[0-9]{6,}$'
    OR (c.title REGEXP '^[0-9]{2,5}$' AND c.view_count <= 100)
    OR c.title IN ('32423423', '564364', '1111')
    OR EXISTS (
      SELECT 1 FROM user_trainers t
      WHERE t.id = c.trainer_id AND t.name = '测试aaa'
    )
  );

DELETE cp FROM course_plans cp
INNER JOIN tmp_purge_test_course_ids t ON t.id = cp.course_id;

DELETE ce FROM course_enrollments ce
INNER JOIN tmp_purge_test_course_ids t ON t.id = ce.course_id;

DELETE tr FROM training_reviews tr
INNER JOIN tmp_purge_test_course_ids t ON t.id = tr.course_id;

DELETE f FROM user_favorites f
INNER JOIN tmp_purge_test_course_ids t ON t.id = f.target_id
WHERE f.target_type = 'COURSE';

DELETE l FROM user_likes l
INNER JOIN tmp_purge_test_course_ids t ON t.id = l.target_id
WHERE l.target_type = 'COURSE';

DELETE c FROM carts c
INNER JOIN tmp_purge_test_course_ids t ON t.id = c.product_id
WHERE c.product_type = 'OPEN_COURSE';

UPDATE demands d
INNER JOIN tmp_purge_test_course_ids t ON t.id = d.source_course_id
SET d.source_course_id = NULL;

DELETE c FROM courses c
INNER JOIN tmp_purge_test_course_ids t ON t.id = c.id;

DROP TEMPORARY TABLE IF EXISTS tmp_purge_test_course_ids;
