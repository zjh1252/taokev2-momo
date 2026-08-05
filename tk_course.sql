/*
 Navicat Premium Dump SQL

 Source Server         : taoke
 Source Server Type    : MySQL
 Source Server Version : 80025 (8.0.25)
 Source Host           : 10.0.14.20:3306
 Source Schema         : taoke

 Target Server Type    : MySQL
 Target Server Version : 80025 (8.0.25)
 File Encoding         : 65001

 Date: 04/08/2026 16:03:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tk_course
-- ----------------------------
DROP TABLE IF EXISTS `tk_course`;
CREATE TABLE `tk_course`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程编号',
  `cid` int NOT NULL DEFAULT 0 COMMENT '课程id',
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户ID',
  `type` tinyint NOT NULL DEFAULT 1 COMMENT '类型1、公开课;2、内训课',
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `begin` int NOT NULL DEFAULT 0 COMMENT '开课时间',
  `finish` int NOT NULL DEFAULT 0 COMMENT '结束时间',
  `price` int NOT NULL DEFAULT 0 COMMENT '课程价格(内训课：元/天；公开课：元)',
  `special_price` int NULL DEFAULT 0 COMMENT '优惠价格',
  `province` int NOT NULL COMMENT '省份',
  `city` int NOT NULL DEFAULT 0 COMMENT '城市 ',
  `address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '上课地址',
  `hit` int NOT NULL DEFAULT 0 COMMENT '点击数',
  `level` int NOT NULL DEFAULT 1 COMMENT '星级',
  `homeRanking` tinyint NOT NULL DEFAULT 0 COMMENT '讲师主页课程排序',
  `comments` int NOT NULL DEFAULT 0 COMMENT '评论数',
  `isrecommend` tinyint(1) NOT NULL DEFAULT 0 COMMENT '推荐',
  `isopen` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否开启',
  `states` tinyint(1) NOT NULL DEFAULT 0 COMMENT '审核状态',
  `refresh_time` int NOT NULL DEFAULT 0,
  `special` int NOT NULL DEFAULT 0 COMMENT '课程特价',
  `isspecial` tinyint NOT NULL DEFAULT 0 COMMENT '是否特价课程(0:否,1:是) ',
  `modified` int NULL DEFAULT NULL COMMENT '更新时间',
  `old_userid` int NOT NULL DEFAULT 0 COMMENT '原用户id',
  `old_info` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '原课程信息',
  `class_status` tinyint NULL DEFAULT 0 COMMENT '招生进展：1:确定开班;-1:课程已取消;2:还差x人即开班',
  `class_status_diff_number` int NULL DEFAULT 0 COMMENT '还差X人即开班',
  `store_price` int NULL DEFAULT NULL,
  `store_price_text` varchar(15) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '文本价格',
  `sales_price` int NULL DEFAULT 0 COMMENT '双12价格',
  `rebate_cash` float NULL DEFAULT NULL COMMENT '返现金额',
  `taobi` float NULL DEFAULT NULL COMMENT '可用淘币',
  `cos_price` float NULL DEFAULT 0 COMMENT 'costco价格',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_uid`(`uid` ASC) USING BTREE,
  INDEX `index_begin`(`begin` ASC) USING BTREE,
  INDEX `index_price`(`price` ASC) USING BTREE,
  INDEX `idx_status_type`(`cid` ASC, `states` ASC, `type` ASC) USING BTREE,
  INDEX `idx_title`(`title` ASC) USING BTREE,
  INDEX `idx_t_s_u`(`type` ASC, `states` ASC, `uid` ASC) USING BTREE,
  INDEX `idx_rt`(`refresh_time` ASC) USING BTREE,
  INDEX `index_modified`(`modified` ASC) USING BTREE,
  INDEX `index_cid`(`cid` ASC, `begin` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 441062 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程列表' ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
