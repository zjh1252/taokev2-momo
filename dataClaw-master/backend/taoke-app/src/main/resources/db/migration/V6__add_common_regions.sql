CREATE TABLE `common_regions` (
  `id`   INT   NOT NULL AUTO_INCREMENT  COMMENT '主键',
  `code` CHAR(36) NOT NULL,
  `name` VARCHAR(765) NOT NULL,
  `parent_code` CHAR(36) NOT NULL,
  `level` INT NOT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_code` (`code`),
    INDEX `idx_parent_code` (`parent_code`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;