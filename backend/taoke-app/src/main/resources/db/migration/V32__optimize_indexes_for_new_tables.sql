-- 优化 V29/V30/V31 中的低效单列索引，替换为实际查询场景所需的联合索引

-- sys_sensitive_words: enabled 仅两个值，单列索引无意义
ALTER TABLE `sys_sensitive_words` DROP INDEX `idx_enabled`;

-- user_trainer_cases: 替换为联合索引 (trainer_id, status, sort_order)
ALTER TABLE `user_trainer_cases` DROP INDEX `idx_trainer_cases_trainer_id`;
ALTER TABLE `user_trainer_cases` DROP INDEX `idx_trainer_cases_status`;
ALTER TABLE `user_trainer_cases` DROP INDEX `idx_trainer_cases_sort_order`;
ALTER TABLE `user_trainer_cases` ADD INDEX `idx_trainer_cases_trainer_status_sort` (`trainer_id`, `status`, `sort_order`);

-- user_trainer_case_files: 替换为联合索引 (case_id, sort_order)
ALTER TABLE `user_trainer_case_files` DROP INDEX `idx_trainer_case_files_trainer_id`;
ALTER TABLE `user_trainer_case_files` DROP INDEX `idx_trainer_case_files_case_id`;
ALTER TABLE `user_trainer_case_files` DROP INDEX `idx_trainer_case_files_status`;
ALTER TABLE `user_trainer_case_files` DROP INDEX `idx_trainer_case_files_sort_order`;
ALTER TABLE `user_trainer_case_files` ADD INDEX `idx_trainer_case_files_case_sort` (`case_id`, `sort_order`);

-- user_trainer_highlights: 替换为联合索引 (trainer_id, status, sort_order)
ALTER TABLE `user_trainer_highlights` DROP INDEX `idx_trainer_highlights_trainer_id`;
ALTER TABLE `user_trainer_highlights` DROP INDEX `idx_trainer_highlights_status`;
ALTER TABLE `user_trainer_highlights` DROP INDEX `idx_trainer_highlights_sort_order`;
ALTER TABLE `user_trainer_highlights` ADD INDEX `idx_trainer_highlights_trainer_status_sort` (`trainer_id`, `status`, `sort_order`);
