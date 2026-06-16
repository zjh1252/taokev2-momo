-- courses.type 列增加默认值 INTERNAL（内训课）
ALTER TABLE courses ALTER COLUMN type SET DEFAULT 'INTERNAL';
