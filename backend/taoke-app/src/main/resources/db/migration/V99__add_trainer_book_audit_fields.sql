-- 著作管理：增加审核流程与作者/提交人字段

ALTER TABLE `user_trainer_books`
    ADD COLUMN `author_name` VARCHAR(200) NULL COMMENT '专家/作者展示名' AFTER `title`,
    ADD COLUMN `submitter_user_id` INT NULL COMMENT '提交著作的用户 ID' AFTER `trainer_id`,
    ADD COLUMN `status` TINYINT(2) NOT NULL DEFAULT 1 COMMENT '0=待审核 1=已通过 2=已驳回' AFTER `sort_order`,
    ADD COLUMN `reject_reason` VARCHAR(500) NULL COMMENT '驳回原因' AFTER `status`,
    ADD COLUMN `reviewer_id` INT NULL COMMENT '审核人 ID' AFTER `reject_reason`,
    ADD COLUMN `reviewed_at` DATETIME NULL COMMENT '审核时间' AFTER `reviewer_id`;

UPDATE `user_trainer_books`
SET `status` = 1
WHERE `status` IS NULL OR `status` = 0;
