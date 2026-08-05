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

 Date: 04/08/2026 16:02:56
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for pre_common_credit_rule
-- ----------------------------
DROP TABLE IF EXISTS `pre_common_credit_rule`;
CREATE TABLE `pre_common_credit_rule`  (
  `rid` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `rulename` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `groupname` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `action` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `cycletype` tinyint(1) NOT NULL DEFAULT 0,
  `cycletime` int NOT NULL DEFAULT 0,
  `rewardnum` tinyint NOT NULL DEFAULT 1,
  `norepeat` tinyint(1) NOT NULL DEFAULT 0,
  `extcredits1` int NOT NULL DEFAULT 0,
  `extcredits2` int NOT NULL DEFAULT 0,
  `extcredits3` int NOT NULL DEFAULT 0,
  `extcredits4` int NOT NULL DEFAULT 0,
  `extcredits5` int NOT NULL DEFAULT 0,
  `extcredits6` int NOT NULL DEFAULT 0,
  `extcredits7` int NOT NULL DEFAULT 0,
  `extcredits8` int NOT NULL DEFAULT 0,
  `fids` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '' COMMENT '规则描述',
  `displayorder` smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (`rid`) USING BTREE,
  UNIQUE INDEX `action`(`action` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 75 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pre_pxb_order
-- ----------------------------
DROP TABLE IF EXISTS `pre_pxb_order`;
CREATE TABLE `pre_pxb_order`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `creator_id` int NULL DEFAULT 0 COMMENT '创建者id',
  `realname` varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '访客姓名',
  `order_no` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '订单号',
  `order_type` tinyint(1) NULL DEFAULT 0 COMMENT '订单类型：1：手续费；2：自助申请；3：项目；4：报名；5：提现；6：课程购买',
  `order_type_id` int NULL DEFAULT 0 COMMENT '对应订单类型的物品id；（课程订单时：1:单个课程包 ，2:通用管理课程包， 3:综合课程包）',
  `trade_type` tinyint(1) NULL DEFAULT 0 COMMENT '交易方式：1：人工服务；2：微信支付；',
  `trade_type_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '0' COMMENT '交易订单号',
  `trade_account` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '交易账号标识',
  `payer_type` tinyint(1) NULL DEFAULT 0 COMMENT '付款人类型：1：公司；2：成员；3：参训人员',
  `payer_id` int NULL DEFAULT 0 COMMENT '付款人id',
  `payee_type` tinyint(1) NULL DEFAULT 0 COMMENT '收款人类型：1：公司；2：成员；',
  `payee_id` int NULL DEFAULT 0 COMMENT '收款人id',
  `pay_money` decimal(11, 2) NULL DEFAULT 0.00 COMMENT '支付金额',
  `pay_taobi` int NULL DEFAULT 0 COMMENT '淘币支付价格',
  `createtime` varchar(11) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` varchar(11) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '更改时间',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '订单状态：0：待支付；1：无效订单；2：已生效；',
  `note` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '订单备注',
  `root_company_id` int NULL DEFAULT 0 COMMENT '订单所属公司id',
  `parent_id` int NULL DEFAULT 0 COMMENT '关联id',
  `client_report_success` tinyint(1) NULL DEFAULT 0 COMMENT '客户端报告支付成功',
  `client_report_time` int NULL DEFAULT 0 COMMENT '客户端报告支付成功时间',
  `mobile` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '付款人手机号',
  `follow_uid` int NULL DEFAULT NULL COMMENT '跟进人uid',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `root_company_id`(`root_company_id` ASC) USING BTREE,
  INDEX `order_no`(`order_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23250 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pre_summary_day_tk_invite_number
-- ----------------------------
DROP TABLE IF EXISTS `pre_summary_day_tk_invite_number`;
CREATE TABLE `pre_summary_day_tk_invite_number`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '每天新增用户数',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0,
  `year` year NOT NULL DEFAULT 2000 COMMENT '年份',
  `month` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '月份',
  `week` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '一年第几周',
  `day` date NULL DEFAULT NULL COMMENT '日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `day`(`day` ASC) USING BTREE,
  INDEX `year_month`(`year` ASC, `month` ASC) USING BTREE,
  INDEX `key_week`(`week` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 168 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pre_summary_day_tk_invited_number
-- ----------------------------
DROP TABLE IF EXISTS `pre_summary_day_tk_invited_number`;
CREATE TABLE `pre_summary_day_tk_invited_number`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '每天新增用户数',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0,
  `year` year NOT NULL DEFAULT 2000 COMMENT '年份',
  `month` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '月份',
  `week` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '一年第几周',
  `day` date NULL DEFAULT NULL COMMENT '日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `day`(`day` ASC) USING BTREE,
  INDEX `year_month`(`year` ASC, `month` ASC) USING BTREE,
  INDEX `key_week`(`week` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 208 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for temp_seller_data
-- ----------------------------
DROP TABLE IF EXISTS `temp_seller_data`;
CREATE TABLE `temp_seller_data`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `tk_realname` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `companyintro` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `intro` mediumtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `groupid` mediumint NOT NULL DEFAULT 0,
  `uid` int NOT NULL DEFAULT 0,
  `cdbid` int NOT NULL DEFAULT 0,
  `clo_realname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `field22` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0表示未处理过，1表示处理过',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '卖家用户数据同步' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for temp_trainer_cooperation_160715
-- ----------------------------
DROP TABLE IF EXISTS `temp_trainer_cooperation_160715`;
CREATE TABLE `temp_trainer_cooperation_160715`  (
  `uid` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_access_share_record
-- ----------------------------
DROP TABLE IF EXISTS `tk_access_share_record`;
CREATE TABLE `tk_access_share_record`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `access_no` varchar(32) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `member_uid` int UNSIGNED NOT NULL COMMENT '用户角色 ID 同 tk_member 的 id',
  `createtime` int UNSIGNED NOT NULL COMMENT '创建时间戳',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `access_no`(`access_no` ASC, `member_uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1676 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '分享访问记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_action_config
-- ----------------------------
DROP TABLE IF EXISTS `tk_action_config`;
CREATE TABLE `tk_action_config`  (
  `actid` int NOT NULL AUTO_INCREMENT,
  `actname` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '动作名',
  `listtips` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '列表页提示',
  `detailstips` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '详情页提示',
  PRIMARY KEY (`actid`) USING BTREE,
  INDEX `index_actname`(`actname` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 164 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '(需求)操作动作配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_admingroups
-- ----------------------------
DROP TABLE IF EXISTS `tk_admingroups`;
CREATE TABLE `tk_admingroups`  (
  `adminid` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `allowadmincp` tinyint(1) NOT NULL DEFAULT 0,
  `alloweditatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowdelatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowcheckatc` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `allowlockatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowmoveatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowcopyatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowtopatc` tinyint(1) NOT NULL DEFAULT 0,
  `allowcommend` tinyint(1) NOT NULL DEFAULT 0,
  `allowshield` tinyint(1) NOT NULL DEFAULT 0,
  `allowtitlestyle` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `adminright` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `viewAll` tinyint NULL DEFAULT 0 COMMENT '是否能查看全部数据(或只能看属于自己部分的数据)[0:不能,1:可以]',
  `adminviewright` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '菜单显示项记录',
  PRIMARY KEY (`adminid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_adminlogs
-- ----------------------------
DROP TABLE IF EXISTS `tk_adminlogs`;
CREATE TABLE `tk_adminlogs`  (
  `id` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` mediumint UNSIGNED NOT NULL DEFAULT 0,
  `action` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '操作类型',
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '描述',
  `username` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '登陆用户名',
  `logdate` int UNSIGNED NOT NULL DEFAULT 0,
  `logip` char(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '登录ip',
  `result` tinyint(1) NOT NULL DEFAULT 1,
  `islog` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否登录日志',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `uid`(`uid` ASC) USING BTREE,
  INDEX `logdate`(`logdate` ASC, `islog` ASC) USING BTREE,
  INDEX `index_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1581835 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_adminonlines
-- ----------------------------
DROP TABLE IF EXISTS `tk_adminonlines`;
CREATE TABLE `tk_adminonlines`  (
  `sid` char(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `username` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `loginfo` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `logdate` int UNSIGNED NOT NULL DEFAULT 0,
  `logip` char(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `lastactivity` int UNSIGNED NOT NULL DEFAULT 0,
  `super` tinyint UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE INDEX `sid`(`sid` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_advert
-- ----------------------------
DROP TABLE IF EXISTS `tk_advert`;
CREATE TABLE `tk_advert`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '0' COMMENT '广告为类型 / 广告位展示效果',
  `uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '添加用户',
  `sub` int NULL DEFAULT 0 COMMENT '广告位id',
  `stime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '开始时间',
  `etime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '结束时间',
  `ifshow` tinyint NOT NULL DEFAULT 0 COMMENT '是否显示',
  `orderby` tinyint NOT NULL DEFAULT 0 COMMENT '排序',
  `descrip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '描述',
  `config` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '广告配置',
  `hits` int NULL DEFAULT 0 COMMENT '点击率',
  `price` decimal(8, 2) NULL DEFAULT 0.00 COMMENT '价格',
  `post_code` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '广告位编码',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_sub`(`sub` ASC) USING BTREE,
  INDEX `post_code`(`post_code` ASC, `sub` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5978 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '广告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_advices
-- ----------------------------
DROP TABLE IF EXISTS `tk_advices`;
CREATE TABLE `tk_advices`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL DEFAULT 0 COMMENT '公司id/讲师id',
  `company_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '公司名称/讲师的realname',
  `roleid` int NOT NULL DEFAULT 0 COMMENT '角色id',
  `content` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '咨询内容',
  `realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '公司名称',
  `mobile` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '手机号码',
  `telephone` varchar(15) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '固定电话',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `user_id` int NOT NULL DEFAULT 0 COMMENT '发布者id(如果未登陆发布则为0)',
  `type` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '1在机构主页咨询/在讲师主页咨询2在内训课详情页咨询3公开课详情页咨询',
  `keyid` int NOT NULL DEFAULT 0 COMMENT 'type对应的课程ID，机构ID/讲师ID',
  `title` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '在机构主页咨询/在讲师主页咨询' COMMENT '在机构主页/在讲师主页咨询或者课程标题',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态(0:未分配;1:已分配)',
  `operator_id` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  `process_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '处理状态，0：未处理；1：已处理',
  `cs_id` int NOT NULL DEFAULT 0 COMMENT 'cs顾问id',
  `cs_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'CS处理状态',
  `cs_reason` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT 'CS处理情况',
  `process_reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '处理原因',
  `cs_createtime` int NOT NULL DEFAULT 0 COMMENT '转接时间',
  `province` int NOT NULL DEFAULT 0 COMMENT '城市ID',
  `city` int NOT NULL DEFAULT 0 COMMENT '城市ID',
  `remark` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '需求备注',
  `email` char(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '用户email',
  `isdelete` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除: 0 没删除，1 删除',
  `course_cate` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程类别(存类别id,多个之间用英文逗号隔开)',
  `course_subcate` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程二级类别(存类别id,多个之间用英文逗号隔开)',
  `add_id` int NOT NULL DEFAULT 0 COMMENT '数据添加人ID',
  `add_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '数据添加人名称',
  `course_time` int NOT NULL DEFAULT 0 COMMENT '期望开课时间',
  `isnear` tinyint(1) NULL DEFAULT NULL COMMENT '是否就近上课',
  `nearinfo` varchar(1024) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '就近上课说明',
  `isTrans` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否由需求信息转换过来的0表示不是，>0表示原来的对应的ID',
  `sourcefrom` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1表示淘课网2表示微网站',
  `istransform` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0表示未转换>0表示已换',
  `invalid_reason` varchar(1024) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '废弃原因',
  `invalid_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1:虚假需求,2:重复需求3:无法满足客户4:客户改变主意5:机构/讲师测试需求',
  `isdisabled` tinyint(1) NULL DEFAULT 0,
  `crmIssueName` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'crm发布人姓名',
  `crmId` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'crm同步过来的id',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_company_id`(`company_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 47760 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '咨询信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_advices_allot
-- ----------------------------
DROP TABLE IF EXISTS `tk_advices_allot`;
CREATE TABLE `tk_advices_allot`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `advices_id` int NOT NULL DEFAULT 0 COMMENT '咨询ID',
  `company_id` int NOT NULL DEFAULT 0 COMMENT '分配到的会员id',
  `contact_time` int NOT NULL DEFAULT 0 COMMENT '联系时间',
  `status` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '是否成交(0:默认;1:是;-1:否)',
  `intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '沟通情况',
  `contact_id` int NOT NULL DEFAULT 0 COMMENT '联系信息id',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `operator_id` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  `fromType` tinyint(1) NOT NULL DEFAULT 2 COMMENT '1咨询者输入2注册信息3淘课网分配',
  `is_view` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已查看',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_advices_id`(`advices_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11655 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '咨询分配表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_advices_allot_contact
-- ----------------------------
DROP TABLE IF EXISTS `tk_advices_allot_contact`;
CREATE TABLE `tk_advices_allot_contact`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL DEFAULT 0 COMMENT '分配到的会员id',
  `userid` int NOT NULL DEFAULT 0 COMMENT '发布者id(如果未登陆发布则为0)',
  `tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `province` int NOT NULL DEFAULT 0 COMMENT '所属省份',
  `city` int NOT NULL DEFAULT 0 COMMENT '所属城市',
  `address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '具体地址',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2174 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '机构咨询联系信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_afternoon_tea_body
-- ----------------------------
DROP TABLE IF EXISTS `tk_afternoon_tea_body`;
CREATE TABLE `tk_afternoon_tea_body`  (
  `id` int NOT NULL DEFAULT 0,
  `body` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_afternoon_tea_brief
-- ----------------------------
DROP TABLE IF EXISTS `tk_afternoon_tea_brief`;
CREATE TABLE `tk_afternoon_tea_brief`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `keywords` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `lastModified` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3304 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_cate`;
CREATE TABLE `tk_agent_cate`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `agent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '代理 ID',
  `cate_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '分类名称',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  `disabled` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否禁用: 0 未禁用；1 已禁用；',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '代理讲师分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_info
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_info`;
CREATE TABLE `tk_agent_info`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户 UID',
  `show_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '真实姓名/公司名',
  `gender` tinyint(1) NULL DEFAULT 0 COMMENT '性别 1=男，2=女，0=未知',
  `signature` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '签名',
  `cate` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '领域（大分类）',
  `subcate` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '子领域',
  `province` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '省份',
  `city` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '城市',
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '邮箱',
  `mobile` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '手机号',
  `intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '介绍',
  `type` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '个人(1)，公司(2)',
  `parent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '上级代理 ID',
  `isopen` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否允许自动加入',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间戳',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间戳',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `uid`(`uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1121325 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '经纪信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_trainer
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_trainer`;
CREATE TABLE `tk_agent_trainer`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `agent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '代理 ID',
  `trainer_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '讲师 ID',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态: 0 未知；1 正常；2 申请中；3 已解除；4 已申请通过，但不显示；',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间戳',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间戳',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `agent_id`(`agent_id` ASC, `trainer_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 236 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '经纪人-讲师关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_trainer_20240729
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_trainer_20240729`;
CREATE TABLE `tk_agent_trainer_20240729`  (
  `id` int UNSIGNED NOT NULL DEFAULT 0,
  `agent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '代理 ID',
  `trainer_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '讲师 ID',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态: 0 未知；1 正常；2 申请中；3 已解除；4 已申请通过，但不显示；',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间戳',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间戳'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_trainer_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_trainer_cate`;
CREATE TABLE `tk_agent_trainer_cate`  (
  `agent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '代理 ID',
  `agent_cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT 'tk_agent_cate 表 id',
  `trainer_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '讲师 ID',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 9999 COMMENT '顺序',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`agent_cate_id`, `trainer_id`) USING BTREE,
  INDEX `agent_id`(`agent_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '代理讲师分类排序' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_agent_trainer_order
-- ----------------------------
DROP TABLE IF EXISTS `tk_agent_trainer_order`;
CREATE TABLE `tk_agent_trainer_order`  (
  `agent_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '门户 ID',
  `trainer_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '讲师 ID',
  `order_num` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '顺序',
  PRIMARY KEY (`agent_id`, `trainer_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '门户讲师排序' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_allot
-- ----------------------------
DROP TABLE IF EXISTS `tk_allot`;
CREATE TABLE `tk_allot`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_id` int NOT NULL DEFAULT 0 COMMENT '需求id',
  `company_id` int NOT NULL DEFAULT 0 COMMENT '分配到的会员id',
  `contact_time` int NOT NULL DEFAULT 0 COMMENT '联系时间',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否成交(0:默认;1:是;-1:否)',
  `intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '沟通情况',
  `contact_id` int NOT NULL DEFAULT 0 COMMENT '联系信息id',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `operator_id` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  `is_view` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否查看\'0\'为查看\'1\'已查看',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_cid_did`(`company_id` ASC, `demand_id` ASC) USING BTREE,
  INDEX `demand_id_idx`(`demand_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3201 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '需求分配表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_allot_contact
-- ----------------------------
DROP TABLE IF EXISTS `tk_allot_contact`;
CREATE TABLE `tk_allot_contact`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL DEFAULT 0 COMMENT '分配到的会员id（机构id）',
  `userid` int NOT NULL DEFAULT 0 COMMENT '发布者id(如果未登陆发布则为0)',
  `tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `province` int NOT NULL DEFAULT 0 COMMENT '所属省份',
  `city` int NOT NULL DEFAULT 0 COMMENT '所属城市',
  `address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '具体地址',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_company_id`(`company_id` ASC) USING BTREE,
  INDEX `idx_userid`(`userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1652 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '机构与需求联系信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_analytics_course_online_consultation
-- ----------------------------
DROP TABLE IF EXISTS `tk_analytics_course_online_consultation`;
CREATE TABLE `tk_analytics_course_online_consultation`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `courseId` int NOT NULL,
  `clickTime` int NOT NULL,
  `clientIp` varchar(39) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10006 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_announce
-- ----------------------------
DROP TABLE IF EXISTS `tk_announce`;
CREATE TABLE `tk_announce`  (
  `aid` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
  `subject` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '广告主题',
  `fid` smallint NOT NULL DEFAULT -1 COMMENT '所属板块',
  `ifopen` tinyint NOT NULL DEFAULT 0 COMMENT '是否开启',
  `vieworder` smallint NOT NULL DEFAULT 0 COMMENT '排序',
  `ifconvert` tinyint NOT NULL DEFAULT 0 COMMENT '是否跳转',
  `author` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '操作人',
  `url` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '链接地址',
  `stime` int NOT NULL DEFAULT 0,
  `etime` int NOT NULL DEFAULT 0,
  `content` mediumtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '公告内容',
  `type` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '公告类型',
  PRIMARY KEY (`aid`) USING BTREE,
  INDEX `idx_vieworder_startdate`(`vieworder` ASC, `stime` ASC) USING BTREE,
  INDEX `idx_fid`(`fid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 131 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '网站公告' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_app_access_token
-- ----------------------------
DROP TABLE IF EXISTS `tk_app_access_token`;
CREATE TABLE `tk_app_access_token`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` char(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'TOKEN',
  `cdbid` int NULL DEFAULT 0 COMMENT 'UC 用户 ID',
  `createtime` int NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `token`(`token` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '应用访问记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_application
-- ----------------------------
DROP TABLE IF EXISTS `tk_application`;
CREATE TABLE `tk_application`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` tinyint NOT NULL DEFAULT 1 COMMENT '类型:1=特价申请;2=下期开课提醒',
  `course_id` int NOT NULL DEFAULT 0 COMMENT '课程id',
  `course_uid` int NOT NULL DEFAULT 0 COMMENT '课程发布者(用户id)',
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '姓名',
  `mobile` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '手机号码',
  `tel` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '办公电话',
  `mail` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '公司名称',
  `positions` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '职务',
  `position_cate` int NOT NULL DEFAULT 0 COMMENT '职务类别',
  `position` int NOT NULL DEFAULT 0 COMMENT '职位信息',
  `num` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '参加人数',
  `begin` int NOT NULL DEFAULT 0 COMMENT '希望开课时间',
  `province` int NOT NULL DEFAULT 0 COMMENT '省份',
  `city` int NOT NULL DEFAULT 0 COMMENT '希望开课城市',
  `discount` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '希望折扣',
  `begins` int NOT NULL DEFAULT 0 COMMENT '希望开课时间',
  `citys` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '希望开课城市',
  `user_id` int NOT NULL DEFAULT 0 COMMENT '申请人(用户id)',
  `ctime` int NOT NULL DEFAULT 0 COMMENT '申请时间',
  `is_read` tinyint NOT NULL DEFAULT 0 COMMENT '课程发布者是否已阅读(0=否,1=是)',
  `apply_read` tinyint NOT NULL DEFAULT 1 COMMENT '申请者是否已阅读(0=否,1=是)',
  `del` tinyint NOT NULL DEFAULT 0 COMMENT '是否删除 ',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_t_cu_ir_d`(`type` ASC, `course_uid` ASC, `is_read` ASC, `del` ASC) USING BTREE,
  INDEX `idx_t_d`(`type` ASC, `del` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 82 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '个人或公司申请特价和下期开课提醒表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_appraisal
-- ----------------------------
DROP TABLE IF EXISTS `tk_appraisal`;
CREATE TABLE `tk_appraisal`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `coursetype` tinyint NOT NULL DEFAULT 1 COMMENT '1：公开课，2：内训课',
  `pname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '省份名称',
  `pid` mediumint NOT NULL DEFAULT 0 COMMENT '省份ID',
  `domain` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '领域',
  `domainid` mediumint NOT NULL DEFAULT 0 COMMENT '领域ID',
  `price` varchar(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '价格范围',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1401 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '淘课估价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_areas
-- ----------------------------
DROP TABLE IF EXISTS `tk_areas`;
CREATE TABLE `tk_areas`  (
  `areaid` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `joinname` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `parentid` mediumint UNSIGNED NOT NULL DEFAULT 0,
  `vieworder` int UNSIGNED NOT NULL DEFAULT 0,
  `type` tinyint(1) NOT NULL COMMENT '地区类型 1=>区域，2=>省、直辖市，3=>市、地区',
  PRIMARY KEY (`areaid`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_parentid_vieworder`(`parentid` ASC, `vieworder` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 990002 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '省市表\r\n' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_article_20141011
-- ----------------------------
DROP TABLE IF EXISTS `tk_article_20141011`;
CREATE TABLE `tk_article_20141011`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `aid` int UNSIGNED NOT NULL COMMENT '淘课文章编号',
  `tkuid` int UNSIGNED NOT NULL COMMENT '淘课用户 ID',
  `uid` int UNSIGNED NOT NULL COMMENT '社区用户 ID',
  `subject` varchar(250) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '标题',
  `createtime` int NULL DEFAULT 0 COMMENT '创建时间',
  `content` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '内容',
  `cate_parent` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '一级分类',
  `cate_sub` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '二级分类',
  `keyword` varchar(80) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '关键字',
  `view_num` int NULL DEFAULT NULL COMMENT '浏览次数',
  `tid` int NULL DEFAULT 0 COMMENT '帖子 ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9607 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_attention
-- ----------------------------
DROP TABLE IF EXISTS `tk_attention`;
CREATE TABLE `tk_attention`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NULL DEFAULT NULL COMMENT '当前账户uid',
  `attention_time` int NULL DEFAULT NULL COMMENT '关注时间',
  `attention_uid` int NULL DEFAULT NULL COMMENT '被关注uid',
  `attention_name` varchar(256) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '被关注的讲师或机构的名称',
  `attention_roleid` int NULL DEFAULT NULL COMMENT '用作链接',
  `iscancel` tinyint(1) NULL DEFAULT 0 COMMENT '是否是取消状态',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `keys`(`uid` ASC, `attention_uid` ASC, `iscancel` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1225 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '讲师机构关注表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_award
-- ----------------------------
DROP TABLE IF EXISTS `tk_award`;
CREATE TABLE `tk_award`  (
  `a_key` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '配置名称',
  `a_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `a_download` int NULL DEFAULT 0 COMMENT '下载次数',
  `a_taobi` float(8, 2) NULL DEFAULT 0.00 COMMENT '淘币奖励',
  `a_exp` float(8, 2) NULL DEFAULT 0.00 COMMENT '经验值奖励',
  `a_cash` float(8, 2) NULL DEFAULT 0.00 COMMENT '现金奖励',
  PRIMARY KEY (`a_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '招标奖励配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_badwords
-- ----------------------------
DROP TABLE IF EXISTS `tk_badwords`;
CREATE TABLE `tk_badwords`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `words` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = 'å±è”½è¯æ±‡è¡¨' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bid
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid`;
CREATE TABLE `tk_bid`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(300) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `bn` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '0',
  `uid` int NULL DEFAULT 0 COMMENT '投标主体',
  `tid` int NULL DEFAULT NULL COMMENT '招标id',
  `lecturer` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '讲师姓名',
  `intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '简介',
  `summary` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '摘要',
  `scheme` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '设计方案',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '1=>中标,2=>备选,3=>淘汰',
  `price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '报价',
  `ainfo` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '附件信息',
  `ctime` int NULL DEFAULT 0 COMMENT '创建时间',
  `utime` int NULL DEFAULT 0 COMMENT '更新时间',
  `ifopen` tinyint(1) NULL DEFAULT 0 COMMENT '是否开启',
  `ifshow` tinyint(1) NULL DEFAULT 1 COMMENT '是否显示',
  `israte` tinyint(1) NULL DEFAULT 0 COMMENT '是否评价',
  `rate` int NULL DEFAULT 0 COMMENT '评价积分',
  `islook` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可以看',
  `approveinfo` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '审核失败原因',
  `allowcontact` tinyint(1) NULL DEFAULT 0 COMMENT '允许查看对方的联系方式',
  `cause` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '淘汰原因',
  `issdemail` tinyint(1) NULL DEFAULT 0 COMMENT '是否已经发送延迟邮件（0：不是，1：是）',
  `issdemailbuyer` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已发送联系方式给买家',
  `sdtime` int NULL DEFAULT 0 COMMENT '延迟发送邮件的时间',
  `audiences` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '培训受众',
  `income` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '课程收益/目标',
  `classtype` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '授课方式',
  `coursehour` float(11, 2) NULL DEFAULT NULL,
  `coursehour_bak` int NOT NULL DEFAULT 0 COMMENT '培训时长备份字段',
  `outline` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '课程大纲',
  `inst_intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '机构介绍',
  `include_travel` tinyint(1) NULL DEFAULT NULL COMMENT '是否包含差旅费',
  `otherinfo` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '其它信息',
  `itemtype` enum('trainer','trainer_s') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '关联类型',
  `itemid` int NULL DEFAULT NULL COMMENT '关联 ID ',
  `member_cardid` int NULL DEFAULT NULL COMMENT '名片 ID',
  `reviewer_id` int NULL DEFAULT 0 COMMENT '审核人ID',
  `reviewer_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '审核人用户名',
  `updatestatus` tinyint(1) NULL DEFAULT 0 COMMENT '更新状态： 0 待审核；1 第一次审核通过；2 第一次审核未通过；10 第一次审核通过后修改待审核； 11 第二次审核通过；12 第二次审核失败； 20 第一次未通过后修改；21 失败后审核通过；22 第二次审核未通过；',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否逻辑删除',
  `iscomment` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否评价过　0-没有评价过　1-已经评价过',
  `is_allow` tinyint(1) NOT NULL DEFAULT 0 COMMENT '用户是否处理　0-没处理　1-处理过',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `index_bn`(`bn` ASC) USING BTREE,
  INDEX `index_tid`(`tid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15950 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bid_attachment
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid_attachment`;
CREATE TABLE `tk_bid_attachment`  (
  `aid` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `bid` int UNSIGNED NOT NULL COMMENT '投标id',
  `filesize` int UNSIGNED NOT NULL COMMENT '大小',
  `filepath` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '路径',
  `uploadtime` int NOT NULL COMMENT '上传时间',
  `descrip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '描述',
  `creator` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '创建人',
  `filetype` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '文件类型',
  `filename` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '文件名称',
  `downloads` int NULL DEFAULT 0 COMMENT '下载次数',
  `isimg` tinyint(1) NULL DEFAULT 0 COMMENT '是否图片',
  `thumb` tinyint(1) NULL DEFAULT 0 COMMENT '是否',
  `uid` int NULL DEFAULT 0 COMMENT '用户id',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否逻辑删除',
  PRIMARY KEY (`aid`) USING BTREE,
  INDEX `bid`(`bid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15895 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bid_comments
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid_comments`;
CREATE TABLE `tk_bid_comments`  (
  `cid` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `bid` int NULL DEFAULT 0 COMMENT '回复招标id',
  `sub` int NULL DEFAULT 0 COMMENT '父类id',
  `title` varchar(300) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '留言标题',
  `username` varchar(300) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '用户名',
  `uid` int NULL DEFAULT 0 COMMENT '留言用户',
  `content` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '留言内容',
  `ctime` int NULL DEFAULT 0 COMMENT '创建时间',
  `ifopen` tinyint(1) NULL DEFAULT 1 COMMENT '状态',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否逻辑删除',
  PRIMARY KEY (`cid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 373 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '投标留言表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for tk_bid_contact
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid_contact`;
CREATE TABLE `tk_bid_contact`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `bidId` int NOT NULL DEFAULT 0 COMMENT '投标id',
  `tendersId` int NOT NULL DEFAULT 0 COMMENT '招标id',
  `content` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '联系信息(数据类型JSON)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_bidId`(`bidId` ASC) USING BTREE,
  INDEX `idx_tendersId`(`tendersId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12269 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '投标方查看招标方联系信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bid_permission_apply
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid_permission_apply`;
CREATE TABLE `tk_bid_permission_apply`  (
  `apply_id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `img` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT 'ÈÏÖ¤Í¼Æ¬',
  `code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '证件号码',
  `status` int NULL DEFAULT 0 COMMENT 'ÉóºË×´Ì¬£º-1£ºÉóºËÎ´Í¨¹ý£¬0£º´ýÉóºË£¬1£ºÉóºËÍ¨¹ý',
  `reject_reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '¾Ü¾øÀíÓÉ',
  `createtime` int NULL DEFAULT NULL COMMENT 'ÉêÇëÊ±¼ä',
  `operator_id` int NULL DEFAULT NULL COMMENT 'ÉóºËÈËID',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'ÉóºËÈËÐÕÃû',
  `operator_time` int NULL DEFAULT NULL COMMENT 'ÉóºËÊ±¼ä',
  PRIMARY KEY (`apply_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 458 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = 'Í¶±ê´ÎÊýÉêÇë±í' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bid_rate
-- ----------------------------
DROP TABLE IF EXISTS `tk_bid_rate`;
CREATE TABLE `tk_bid_rate`  (
  `rid` int NOT NULL AUTO_INCREMENT,
  `uid` int NULL DEFAULT 0 COMMENT '评价用户',
  `to_uid` int NULL DEFAULT 0 COMMENT '被评价uid',
  `rate` int NULL DEFAULT 0 COMMENT '评分',
  `bid` int NULL DEFAULT 0 COMMENT '评价方案',
  `ctime` int NULL DEFAULT 0 COMMENT '评价时间',
  PRIMARY KEY (`rid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 121 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_bidtimes_log
-- ----------------------------
DROP TABLE IF EXISTS `tk_bidtimes_log`;
CREATE TABLE `tk_bidtimes_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户id',
  `num` int NOT NULL DEFAULT 0 COMMENT '操作数量',
  `reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '变更原因',
  `createtime` int NULL DEFAULT NULL COMMENT '创建时间',
  `operator_id` int NULL DEFAULT NULL COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  `operator_time` int NULL DEFAULT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '管理员添加投标机会记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_big_course_score
-- ----------------------------
DROP TABLE IF EXISTS `tk_big_course_score`;
CREATE TABLE `tk_big_course_score`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `big_course_id` int NOT NULL DEFAULT 0 COMMENT 'å¤§è¯¾ç¨‹id',
  `company_id` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹æ‰€æœ‰è€…id',
  `good_rate` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT 'å¥½è¯„çŽ‡',
  `good_num` int NOT NULL DEFAULT 0 COMMENT 'å¥½è¯„æ€»æ•°',
  `medium_num` int NOT NULL DEFAULT 0 COMMENT 'ä¸­è¯„æ€»æ•°',
  `bad_num` int NOT NULL DEFAULT 0 COMMENT 'å·®è¯„æ€»æ•°',
  `colligation_score` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT 'ç»¼åˆè¯„åˆ†',
  `quality_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹è´¨é‡éƒ¨åˆ†',
  `yard_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹åœºåœ°æ€»åˆ†',
  `service_total` int NOT NULL DEFAULT 0 COMMENT 'æœåŠ¡è´¨é‡æ€»åˆ†',
  `comment_num` int NOT NULL DEFAULT 0 COMMENT 'è¯„è®ºæ€»æ¡æ•°',
  `befservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾å‰æœåŠ¡æ€»åˆ†',
  `classtime_total` int NOT NULL DEFAULT 0 COMMENT 'å‡†æ—¶å¼€è¯¾æ€»åˆ†',
  `classmatch_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹å†…å®¹ä¸Žè¯¾ç¨‹å¤§çº²åŒ¹é…åº¦æ€»åˆ†',
  `teacherlevel_total` int NOT NULL DEFAULT 0 COMMENT 'è®²å¸ˆæŽˆè¯¾è´¨é‡æ€»åˆ†',
  `classservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹æœåŠ¡è´¨é‡æ€»åˆ†',
  `aftservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾åŽæœåŠ¡è´¨é‡æ€»åˆ†',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_b_c_i`(`big_course_id` ASC) USING BTREE,
  INDEX `idx_c_i`(`company_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = 'å¤§è¯¾ç¨‹ç»¼åˆè¯„åˆ†' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_case_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_case_cate`;
CREATE TABLE `tk_case_cate`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
  `cate_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '分类名称',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  `disabled` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否禁用: 0 未禁用；1 已禁用；',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_case_cate_relation
-- ----------------------------
DROP TABLE IF EXISTS `tk_case_cate_relation`;
CREATE TABLE `tk_case_cate_relation`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT 'tk_case_cate 表 id',
  `case_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '案例 ID',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 9999 COMMENT '顺序',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `case_id`(`cate_id` ASC, `case_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 36 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例分类排序' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_case_pic
-- ----------------------------
DROP TABLE IF EXISTS `tk_case_pic`;
CREATE TABLE `tk_case_pic`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cid` int NOT NULL DEFAULT 0 COMMENT '案例id',
  `pic` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '图片地址',
  `isdefault` tinyint NOT NULL DEFAULT 0 COMMENT '是否默认',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_cid`(`cid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '成功案例图片' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_cases
-- ----------------------------
DROP TABLE IF EXISTS `tk_cases`;
CREATE TABLE `tk_cases`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '案例标题',
  `descs` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '简介',
  `pic` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '案例标题图',
  `price` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '成交价',
  `manuscript` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '投标稿件数',
  `collection` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '收藏人数',
  `identifier` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '任务编号',
  `tenderer` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '招标方',
  `sendtime` int NOT NULL DEFAULT 0 COMMENT '发布时间',
  `endtime` int NOT NULL DEFAULT 0 COMMENT '截标时间',
  `demand` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '招标需求',
  `bid` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '中标方',
  `bid_level` tinyint NULL DEFAULT 0 COMMENT '中标方星级',
  `bid_logo` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '中标方logo',
  `bid_intro` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '中标方简介',
  `bid_explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '方案说明',
  `isopen` tinyint NOT NULL DEFAULT 0 COMMENT '是否开启',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `browse` int NOT NULL DEFAULT 0 COMMENT '浏览次数',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '添加时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '成功案例' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_cashout_apply
-- ----------------------------
DROP TABLE IF EXISTS `tk_cashout_apply`;
CREATE TABLE `tk_cashout_apply`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL DEFAULT 0 COMMENT 'ç”¨æˆ·ID',
  `amount` float(11, 2) NULL DEFAULT 0.00 COMMENT 'æçŽ°æ•°é¢',
  `isapprove` tinyint(1) NULL DEFAULT 0 COMMENT 'å®¡æ ¸çŠ¶æ€ï¼ˆ-1æœªé€šè¿‡ï¼Œ0å¾…å®¡æ ¸ï¼Œ1å®¡æ ¸é€šè¿‡ï¼‰',
  `approveinfo` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT 'å®¡æ ¸å¤±è´¥åŽŸå› ',
  `operator` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'æ“ä½œè€…ç”¨æˆ·å',
  `operatorid` int NULL DEFAULT 0 COMMENT 'æ“ä½œè€…ID',
  `createtime` int NULL DEFAULT 0,
  `updatetime` int NULL DEFAULT 0,
  `bank` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'å¼€æˆ·é“¶è¡Œ',
  `bank_s` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'å¼€æˆ·æ”¯è¡Œå…¨ç¨‹',
  `bank_account` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'é“¶è¡Œè´¦æˆ·',
  `mobile` varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'æ‰‹æœºå·',
  `alipay` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'æ·˜å®è´¦å·',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = 'æçŽ°ç”³è¯·è¡¨' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_cate`;
CREATE TABLE `tk_cate`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub` int NULL DEFAULT 0 COMMENT '父类id',
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '分类名称',
  `descr` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '分类介绍',
  `icon` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '分类图标',
  `scale_first` float(6, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '微店佣金比例（一级）',
  `scale_second` float(6, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '微店佣金比例（二级）',
  `sort` int NULL DEFAULT NULL COMMENT '排序',
  `issys` tinyint(1) NULL DEFAULT 0 COMMENT '是否为系统默认分类',
  `isopen` tinyint(1) NULL DEFAULT 1 COMMENT '是否开启',
  `opencourse` int NOT NULL DEFAULT 0 COMMENT '公开课门数',
  `enterprise` int NOT NULL DEFAULT 0 COMMENT '内训课门数',
  `bidcount` int NULL DEFAULT 0 COMMENT '招标数',
  `inscount` int NULL DEFAULT 0 COMMENT '机构数',
  `trainercount` int NULL DEFAULT 0,
  `downcount` int NULL DEFAULT 0 COMMENT '资料数',
  `topic_img` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '专题图片',
  `is_opencourse_recommand` tinyint(1) NULL DEFAULT 0 COMMENT '是否启用公开课推荐分类 0:不启用 1:启用',
  `match_cate_id` int NOT NULL DEFAULT 0 COMMENT '隶属于评价分类ID(评论大赛用)',
  `match_title` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '比赛用标题',
  `match_subtitle` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '' COMMENT '比赛用副标题',
  `keywords` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '关键词',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 684 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '分类信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_client_manage
-- ----------------------------
DROP TABLE IF EXISTS `tk_client_manage`;
CREATE TABLE `tk_client_manage`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `vGroupId` int NOT NULL COMMENT '虚拟组id，关联到tk_member表中的vGroupId字段',
  `uid` int NOT NULL COMMENT '包含的用户id',
  `type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1:内训课 2：公开课',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uid_idx`(`uid` ASC) USING BTREE,
  INDEX `index_type`(`type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 56782 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '用户分配管理关系' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_code_param
-- ----------------------------
DROP TABLE IF EXISTS `tk_code_param`;
CREATE TABLE `tk_code_param`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '唯一标识',
  `type` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '类型',
  `param` mediumtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '对应的参数数据',
  `disabled` tinyint(1) NOT NULL COMMENT '默认0 1:禁用',
  `createtime` int UNSIGNED NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 343 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '唯一标识对应的参数数据表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_collect_trainer_contact
-- ----------------------------
DROP TABLE IF EXISTS `tk_collect_trainer_contact`;
CREATE TABLE `tk_collect_trainer_contact`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '收藏id',
  `userId` int NULL DEFAULT NULL COMMENT '收藏者用户id',
  `trainerId` int NULL DEFAULT NULL COMMENT '讲师Id',
  `createTime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_addonask
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_addonask`;
CREATE TABLE `tk_comment_addonask`  (
  `ask_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `ask_from_uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '追问发起用户id',
  `ask_to_uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '被追问用户id',
  `ask_comment_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '追问的评论ID',
  `ask_content` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '追问内容',
  `ask_contact_tel` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '追问人联系电话',
  `ask_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态. 1:已处理; 0:未处理',
  `ask_operator_uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '追问后台处理人员uid',
  `ask_operate_time` int NOT NULL DEFAULT 0 COMMENT '后台人员处理时间',
  `createtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '本记录的创建时间戳',
  `updatetime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP COMMENT '本记录的最后更改时间戳',
  `is_deleted` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`ask_id`) USING BTREE,
  INDEX `commentid`(`ask_comment_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评论追问表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course`;
CREATE TABLE `tk_comment_course`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NULL DEFAULT 0 COMMENT '课程ID',
  `type` tinyint NULL DEFAULT NULL COMMENT '类型1、公开课;2、内训课;3、培训宝讲师评估数据;4、后台管理员添加未公开案例',
  `order_id` int NULL DEFAULT 0 COMMENT '订单ID',
  `big_course_id` int NULL DEFAULT 0 COMMENT '大课程ID',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `to_userid` int NOT NULL DEFAULT 0 COMMENT '被评价的机构或者讲师ID',
  `deviceId` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '评论设备Id',
  `from_userid` int NOT NULL DEFAULT 0 COMMENT '评价者ID（一般为实名学习爱好者，培训管理者等）',
  `from_groupid` tinyint NOT NULL DEFAULT 0 COMMENT '评价人角色 3 机构；9 讲师；4 培训经理； 7 学习爱好者；',
  `c_classmatch` tinyint(1) NULL DEFAULT 0 COMMENT '课程与大纲匹配度',
  `c_teacherlevel` tinyint(1) NULL DEFAULT 0 COMMENT '讲师授课质量',
  `c_service` tinyint(1) NOT NULL DEFAULT 0 COMMENT '服务态度',
  `course_time` int NULL DEFAULT 0 COMMENT '听课时间（格式为：年月日）',
  `appearing_day` float(10, 1) NULL DEFAULT 0.0 COMMENT '专家出场天数',
  `from_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评论者当时所在公司',
  `show_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '默认显示的评论者当时所在公司',
  `province` int NULL DEFAULT NULL COMMENT '省',
  `province_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `city` int NULL DEFAULT NULL COMMENT '市',
  `city_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `address` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `area` int NULL DEFAULT NULL COMMENT '区',
  `area_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '评价内容',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除',
  `edittime` int NOT NULL DEFAULT 0 COMMENT '修改评价的时间',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '解释',
  `explain_crtime` int NULL DEFAULT 0 COMMENT '解释时间',
  `add_comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加评论',
  `add_crtime` int NULL DEFAULT 0 COMMENT '追加评论的时间',
  `add_explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加解释',
  `add_explain_crtime` int NULL DEFAULT 0 COMMENT '追加解释的时间',
  `comment_type` tinyint NULL DEFAULT NULL COMMENT '评价类型（1：公开课详情，2：委托找机构（后台委托内训采购），3：自助找机构（后台自助内训采购），4：机构，5讲师，6内训课详情 7：自助找讲师（找内训讲师） 8：公开课采购（后台我的公开课采购））',
  `bid_id` int NULL DEFAULT 0 COMMENT '内训方案id',
  `item_id` int NULL DEFAULT 0 COMMENT '自助等各种id',
  `case_id` int NULL DEFAULT 0 COMMENT '案例ID',
  `bid_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '方案，投标标题或者供应商名（机构：公司名；讲师：讲师名）',
  `b_classmatch` tinyint(1) NULL DEFAULT 0 COMMENT '内训方案与要求相符（内训方案评价项，用于不计算总分的项）',
  `b_teachermatch` tinyint(1) NULL DEFAULT 0 COMMENT '讲师背景与要求相符（内训方案评价项，用于不计算总分的项）',
  `comment_agent_id` int NULL DEFAULT 0 COMMENT '代发者id，一般为管理后台的用户',
  `is_show` tinyint(1) NULL DEFAULT 1 COMMENT '（1：显示，0：不显示）是否前台显示代发评价',
  `is_count` tinyint(1) NULL DEFAULT 1 COMMENT '（0：不计算总分，1：计算总分）是否计算用户前台的评价总分',
  `is_anonymous` tinyint(1) NULL DEFAULT 0 COMMENT '是否匿名（0：不是，1是）',
  `is_realscore` tinyint(1) NULL DEFAULT 0 COMMENT '（0：不计算真实总分，1：计算真实总分）是否计算真实评价总分',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '0：待审核；1：通过；-1：驳回；',
  `checked_fail_number` tinyint(1) NULL DEFAULT 0 COMMENT '审核失败次数',
  `reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '驳回理由',
  `support_num` int NOT NULL DEFAULT 0 COMMENT '支持总数',
  `review_ifopen` int NOT NULL DEFAULT 0 COMMENT '0评价者和被评价者可见,其他访客不可见,不计入前台显示总分1都\n可见，计入前台显示总分',
  `lecturer` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '授课讲师',
  `courseins` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '开课机构',
  `lecturer_phone` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师手机',
  `ins_tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '机构电话',
  `gift_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论奖品ID',
  `is_notifytrainer` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否提醒过讲师有新评论',
  `ask_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '追问总数',
  `ask_undocount` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '未处理追问数',
  `stu_tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '客户联系电话',
  `stu_contact` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '客户联系人',
  `isrecommmend` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否推荐0不推荐1推荐',
  `picurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片URL',
  `thumbpicurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片缩略图URL',
  `taoke_auth` tinyint(1) NOT NULL DEFAULT 0 COMMENT '淘课证实',
  `tm_auth` tinyint(1) NOT NULL DEFAULT 0 COMMENT '培训经理认证',
  `send_taobi` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否送过淘币',
  `send_sms` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否发送过短信',
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '来自哪个用户分享',
  `contact_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业邮箱',
  `tel` varchar(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业座机',
  `trade` tinyint NOT NULL DEFAULT 0 COMMENT '所属行业',
  `cateid` int NOT NULL DEFAULT 0 COMMENT '所属分类ID',
  `pxb_eval_id` int NOT NULL DEFAULT 0 COMMENT '培训宝评估ID',
  `pxb_eval_score` float(5, 2) NOT NULL DEFAULT 0.00 COMMENT '培训宝评估平均分',
  `pxb_satisfied_rate` float(5, 2) NOT NULL DEFAULT 0.00 COMMENT '培训包评估满意率',
  `pxb_invalid_number` int NOT NULL DEFAULT 0 COMMENT '培训宝评卷问卷数',
  `weixin_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师微信号',
  `entry_type` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论入口类型: 11: 评价讲师；21: 评价机构；31: 课程；41 案例；',
  `match_cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '隶属比赛分类 ID',
  `is_case_chief` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是案例首席评论',
  `match_valid` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '比赛有效:0 无效；1 有效；',
  `match_review` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是最新的比赛审核: 0 不是； 1 是；',
  `review_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核人 ID',
  `review_time` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核时间戳',
  `kefu_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '客服 UID',
  `c_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '用户评价平均分',
  `from_user_realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评价人姓名',
  `invite_userid` int NULL DEFAULT NULL COMMENT '分享、邀请人uid',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_cc_bid_id`(`bid_id` ASC) USING BTREE,
  INDEX `course_id`(`course_id` ASC) USING BTREE,
  INDEX `case_id`(`case_id` ASC) USING BTREE,
  INDEX `to_userid`(`to_userid` ASC, `deviceId` ASC) USING BTREE,
  INDEX `share_uid`(`share_uid` ASC) USING BTREE,
  INDEX `review_userid`(`review_userid` ASC, `review_time` ASC) USING BTREE,
  INDEX `from_userid`(`from_userid` ASC, `match_review` ASC) USING BTREE,
  INDEX `createtime`(`createtime` ASC, `status` ASC) USING BTREE,
  INDEX `kefu_userid`(`kefu_userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 43239 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评价表-课程' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_bak1220
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_bak1220`;
CREATE TABLE `tk_comment_course_bak1220`  (
  `id` int NOT NULL DEFAULT 0,
  `course_id` int NULL DEFAULT 0 COMMENT '课程ID',
  `type` tinyint NULL DEFAULT NULL COMMENT '类型1、公开课;2、内训课;3、培训宝讲师评估数据;4、后台管理员添加未公开案例',
  `order_id` int NULL DEFAULT 0 COMMENT '订单ID',
  `big_course_id` int NULL DEFAULT 0 COMMENT '大课程ID',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `to_userid` int NOT NULL DEFAULT 0 COMMENT '被评价的机构或者讲师ID',
  `deviceId` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '评论设备Id',
  `from_userid` int NOT NULL DEFAULT 0 COMMENT '评价者ID（一般为实名学习爱好者，培训管理者等）',
  `from_groupid` tinyint NOT NULL DEFAULT 0 COMMENT '评价人角色 3 机构；9 讲师；4 培训经理； 7 学习爱好者；',
  `c_classmatch` tinyint(1) NULL DEFAULT 0 COMMENT '课程与大纲匹配度',
  `c_teacherlevel` tinyint(1) NULL DEFAULT 0 COMMENT '讲师授课质量',
  `c_service` tinyint(1) NOT NULL DEFAULT 0 COMMENT '服务态度',
  `course_time` int NULL DEFAULT 0 COMMENT '听课时间（格式为：年月日）',
  `appearing_day` float(10, 1) NULL DEFAULT 0.0 COMMENT '专家出场天数',
  `from_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评论者当时所在公司',
  `show_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '默认显示的评论者当时所在公司',
  `province` int NULL DEFAULT NULL COMMENT '省',
  `province_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `city` int NULL DEFAULT NULL COMMENT '市',
  `city_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `address` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `area` int NULL DEFAULT NULL COMMENT '区',
  `area_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '评价内容',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除',
  `edittime` int NOT NULL DEFAULT 0 COMMENT '修改评价的时间',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '解释',
  `explain_crtime` int NULL DEFAULT 0 COMMENT '解释时间',
  `add_comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加评论',
  `add_crtime` int NULL DEFAULT 0 COMMENT '追加评论的时间',
  `add_explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加解释',
  `add_explain_crtime` int NULL DEFAULT 0 COMMENT '追加解释的时间',
  `comment_type` tinyint NULL DEFAULT NULL COMMENT '评价类型（1：公开课详情，2：委托找机构（后台委托内训采购），3：自助找机构（后台自助内训采购），4：机构，5讲师，6内训课详情 7：自助找讲师（找内训讲师） 8：公开课采购（后台我的公开课采购））',
  `bid_id` int NULL DEFAULT 0 COMMENT '内训方案id',
  `item_id` int NULL DEFAULT 0 COMMENT '自助等各种id',
  `case_id` int NULL DEFAULT 0 COMMENT '案例ID',
  `bid_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '方案，投标标题或者供应商名（机构：公司名；讲师：讲师名）',
  `b_classmatch` tinyint(1) NULL DEFAULT 0 COMMENT '内训方案与要求相符（内训方案评价项，用于不计算总分的项）',
  `b_teachermatch` tinyint(1) NULL DEFAULT 0 COMMENT '讲师背景与要求相符（内训方案评价项，用于不计算总分的项）',
  `comment_agent_id` int NULL DEFAULT 0 COMMENT '代发者id，一般为管理后台的用户',
  `is_show` tinyint(1) NULL DEFAULT 1 COMMENT '（1：显示，0：不显示）是否前台显示代发评价',
  `is_count` tinyint(1) NULL DEFAULT 1 COMMENT '（0：不计算总分，1：计算总分）是否计算用户前台的评价总分',
  `is_anonymous` tinyint(1) NULL DEFAULT 0 COMMENT '是否匿名（0：不是，1是）',
  `is_realscore` tinyint(1) NULL DEFAULT 0 COMMENT '（0：不计算真实总分，1：计算真实总分）是否计算真实评价总分',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '0：待审核；1：通过；-1：驳回；',
  `checked_fail_number` tinyint(1) NULL DEFAULT 0 COMMENT '审核失败次数',
  `reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '驳回理由',
  `support_num` int NOT NULL DEFAULT 0 COMMENT '支持总数',
  `review_ifopen` int NOT NULL DEFAULT 0 COMMENT '0评价者和被评价者可见,其他访客不可见,不计入前台显示总分1都\n可见，计入前台显示总分',
  `lecturer` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '授课讲师',
  `courseins` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '开课机构',
  `lecturer_phone` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师手机',
  `ins_tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '机构电话',
  `gift_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论奖品ID',
  `is_notifytrainer` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否提醒过讲师有新评论',
  `ask_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '追问总数',
  `ask_undocount` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '未处理追问数',
  `stu_tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '客户联系电话',
  `stu_contact` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '客户联系人',
  `isrecommmend` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否推荐0不推荐1推荐',
  `picurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片URL',
  `thumbpicurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片缩略图URL',
  `taoke_auth` tinyint(1) NOT NULL DEFAULT 0 COMMENT '淘课证实',
  `tm_auth` tinyint(1) NOT NULL DEFAULT 0 COMMENT '培训经理认证',
  `send_taobi` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否送过淘币',
  `send_sms` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否发送过短信',
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '来自哪个用户分享',
  `contact_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业邮箱',
  `tel` varchar(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业座机',
  `trade` tinyint NOT NULL DEFAULT 0 COMMENT '所属行业',
  `cateid` int NOT NULL DEFAULT 0 COMMENT '所属分类ID',
  `pxb_eval_id` int NOT NULL DEFAULT 0 COMMENT '培训宝评估ID',
  `pxb_eval_score` float(5, 2) NOT NULL DEFAULT 0.00 COMMENT '培训宝评估平均分',
  `pxb_satisfied_rate` float(5, 2) NOT NULL DEFAULT 0.00 COMMENT '培训包评估满意率',
  `pxb_invalid_number` int NOT NULL DEFAULT 0 COMMENT '培训宝评卷问卷数',
  `weixin_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师微信号',
  `entry_type` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论入口类型: 11: 评价讲师；21: 评价机构；31: 课程；41 案例；',
  `match_cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '隶属比赛分类 ID',
  `is_case_chief` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是案例首席评论',
  `match_valid` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '比赛有效:0 无效；1 有效；',
  `match_review` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是最新的比赛审核: 0 不是； 1 是；',
  `review_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核人 ID',
  `review_time` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核时间戳',
  `kefu_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '客服 UID',
  `c_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '用户评价平均分',
  `from_user_realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评价人姓名',
  `invite_userid` int NULL DEFAULT NULL COMMENT '分享、邀请人uid'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_company
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_company`;
CREATE TABLE `tk_comment_course_company`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '机构 / 讲师ID',
  `groupid` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '评价者角色: 0 所有； 3 培训机构； 4 培训经理； 7 学习爱好者； 9 培训讲师；',
  `comment_total` int NULL DEFAULT 0 COMMENT '评价总数',
  `c_classmatch_total` int NULL DEFAULT 0 COMMENT '课程与大纲匹配度 总分',
  `c_teacherlevel_total` int NULL DEFAULT 0 COMMENT '讲师授课质量 总分',
  `c_service_total` int NULL DEFAULT 0 COMMENT '服务态度 总分',
  `c_classmatch_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '课程与大纲匹配度 平均分',
  `c_teacherlevel_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '讲师授课质量 平均分',
  `c_service_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '服务态度 平均分',
  `c_classmatch_rate` float(11, 2) NULL DEFAULT 0.00 COMMENT '课程与大纲匹配度 行业比重',
  `c_teacherlevel_rate` float(11, 2) NULL DEFAULT 0.00 COMMENT '讲师授课质量 行业比重',
  `c_service_rate` float(11, 2) NULL DEFAULT 0.00 COMMENT '服务态度 行业比重',
  `c_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '用户前台显示的数据平均分',
  `r_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '真实评价数据平均分',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id_UNIQUE`(`user_id` ASC, `groupid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15279 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '机构 / 讲师的课程评分' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_info
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_info`;
CREATE TABLE `tk_comment_course_info`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL DEFAULT 0 COMMENT '课程ID',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `comment_total` int NULL DEFAULT 0 COMMENT '评价总数',
  `c_classmatch_total` int NULL DEFAULT 0 COMMENT '课程与大纲匹配度 总分',
  `c_teacherlevel_total` int NULL DEFAULT 0 COMMENT '讲师授课质量 总分',
  `c_service_total` int NULL DEFAULT 0 COMMENT '服务态度 总分',
  `c_classmatch_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '课程与大纲匹配度 平均分',
  `c_teacherlevel_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '讲师授课质量 平均分',
  `c_service_av` float(11, 1) NULL DEFAULT 0.0 COMMENT '服务态度 平均分',
  `c_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '用户前台显示的数据平均分',
  `r_all_av` float(11, 2) NULL DEFAULT 0.00 COMMENT '真实评价数据平均分',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_course`(`course_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 329 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程的评价总分表（一条记录一个课程）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_match
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_match`;
CREATE TABLE `tk_comment_course_match`  (
  `comment_id` int UNSIGNED NOT NULL COMMENT '评论 ID (tk_comment_course 表 ID)',
  `to_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '被评论人 ID',
  `from_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论人 ID',
  `match_cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '比赛分类 ID',
  `is_case_chief` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是首席评论',
  `appearing_day` float(11, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '出场天数',
  `score_avg` float(11, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '得分',
  PRIMARY KEY (`comment_id`) USING BTREE,
  INDEX `to_userid`(`to_userid` ASC, `match_cate_id` ASC) USING BTREE,
  INDEX `from_uid`(`from_userid` ASC, `is_case_chief` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '点评大赛有效数据表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_match_bak1220
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_match_bak1220`;
CREATE TABLE `tk_comment_course_match_bak1220`  (
  `comment_id` int UNSIGNED NOT NULL COMMENT '评论 ID (tk_comment_course 表 ID)',
  `to_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '被评论人 ID',
  `from_userid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论人 ID',
  `match_cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '比赛分类 ID',
  `is_case_chief` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是首席评论',
  `appearing_day` float(11, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '出场天数',
  `score_avg` float(11, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '得分'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_match_tm
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_match_tm`;
CREATE TABLE `tk_comment_course_match_tm`  (
  `from_userid` int UNSIGNED NOT NULL COMMENT '培训经理 UID',
  `chief_num` int UNSIGNED NOT NULL COMMENT '首席数',
  `comment_num` float(11, 2) UNSIGNED NOT NULL COMMENT '出场天数',
  PRIMARY KEY (`from_userid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '培训经理培训统计' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_match_trainer
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_match_trainer`;
CREATE TABLE `tk_comment_course_match_trainer`  (
  `to_userid` int UNSIGNED NOT NULL COMMENT '讲师 UID',
  `match_cate_id` int UNSIGNED NOT NULL COMMENT '比赛分类 ID',
  `appearing_day` float(11, 2) UNSIGNED NOT NULL COMMENT '出场天数',
  PRIMARY KEY (`to_userid`, `match_cate_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '讲师出场天数统计' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_course_match_trainer_bak1220
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_course_match_trainer_bak1220`;
CREATE TABLE `tk_comment_course_match_trainer_bak1220`  (
  `to_userid` int UNSIGNED NOT NULL COMMENT '讲师 UID',
  `match_cate_id` int UNSIGNED NOT NULL COMMENT '比赛分类 ID',
  `appearing_day` float(11, 2) UNSIGNED NOT NULL COMMENT '出场天数'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_ext
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_ext`;
CREATE TABLE `tk_comment_ext`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` int UNSIGNED NOT NULL DEFAULT 0,
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '公司名称',
  `company_trade` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '公司所属行业',
  `training_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '培训城市',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uid`(`uid` ASC, `company_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1154 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '评论人扩展信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_gift
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_gift`;
CREATE TABLE `tk_comment_gift`  (
  `gift_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '奖品自增id',
  `gift_code` char(8) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '每个奖品一个唯一文本编码',
  `gift_name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '奖品名',
  `gift_img` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '奖品图片url',
  `gift_status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '1:正常;0:下线;',
  PRIMARY KEY (`gift_id`) USING BTREE,
  UNIQUE INDEX `gift_code_UNIQUE`(`gift_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '评论奖品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_info_relation
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_info_relation`;
CREATE TABLE `tk_comment_info_relation`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `share_id` int NOT NULL DEFAULT 0 COMMENT '分享表ID',
  `first_uid` int NOT NULL DEFAULT 0 COMMENT '上级邀请人UID',
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '当前邀请人UID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uqi_key`(`share_id` ASC, `share_uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2497 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '邀请关系-评论信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_luckydog
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_luckydog`;
CREATE TABLE `tk_comment_luckydog`  (
  `dog_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  `dog_name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '获奖幸运儿名字',
  `gift_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '奖品id',
  PRIMARY KEY (`dog_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 284 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '评论获奖动态表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_other_course
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_other_course`;
CREATE TABLE `tk_comment_other_course`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_type` tinyint NOT NULL DEFAULT 1 COMMENT '类型1、公开课;2、内训课',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `from_userid` int NOT NULL DEFAULT 0 COMMENT '评价者ID（一般为实名学习爱好者，培训管理者等）',
  `c_classmatch` tinyint(1) NOT NULL DEFAULT 0 COMMENT '课程与大纲匹配度',
  `c_teacherlevel` tinyint(1) NOT NULL DEFAULT 0 COMMENT '讲师授课质量',
  `c_service` tinyint(1) NOT NULL DEFAULT 0 COMMENT '服务态度',
  `course_time` int NULL DEFAULT 0 COMMENT '培训时间',
  `appearing_day` float(10, 1) NULL DEFAULT 0.0 COMMENT '专家出场天数',
  `from_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评论者当时所在的公司',
  `stu_contact` varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '评论人本次所填姓名',
  `stu_tel` varchar(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '评论人本次所填电话',
  `show_user_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '默认显示的评论者当时所在公司',
  `province` int NULL DEFAULT NULL COMMENT '省',
  `province_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `city` int NULL DEFAULT NULL COMMENT '市',
  `city_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `address` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `area` int NULL DEFAULT NULL COMMENT '区',
  `area_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `info_type` tinyint NOT NULL DEFAULT 1 COMMENT '授课方信息1、留讲师信息；2、留机构信息',
  `info_name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '讲师名/机构名',
  `info_tel` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '讲师/机构联系方式',
  `info_description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '讲师/机构简介',
  `comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '评价内容',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除',
  `edittime` int NOT NULL DEFAULT 0 COMMENT '修改评价的时间',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '解释',
  `explain_crtime` int NULL DEFAULT 0 COMMENT '解释时间',
  `add_comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加评论',
  `add_crtime` int NULL DEFAULT 0 COMMENT '追加评论的时间',
  `add_explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加解释',
  `add_explain_crtime` int NULL DEFAULT 0 COMMENT '追加解释的时间',
  `comment_type` tinyint(1) NULL DEFAULT 1 COMMENT '评价类型（1：课程评价，2：委托采购评价，3：自助采购评价，4：讲师评价，5：机构评价）',
  `b_classmatch` tinyint(1) NULL DEFAULT 0 COMMENT '内训方案与要求相符（内训方案评价项，用于不计算总分的项）',
  `b_teachermatch` tinyint(1) NULL DEFAULT 0 COMMENT '讲师背景与要求相符（内训方案评价项，用于不计算总分的项）',
  `is_show` tinyint(1) NULL DEFAULT 1 COMMENT '（1：显示，0：不显示）是否前台显示代发评价',
  `is_count` tinyint(1) NULL DEFAULT 1 COMMENT '（0：不计算总分，1：计算总分）是否计算用户前台的评价总分',
  `is_anonymous` tinyint(1) NULL DEFAULT 0 COMMENT '是否匿名（0：不是，1是）',
  `is_realscore` tinyint(1) NOT NULL DEFAULT 1 COMMENT '（0：不计算真实总分，1：计算真实总分）是否计算真实评价总分',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '0：待审核；1：审核通过；-1：审核未通过；',
  `checked_fail_number` tinyint(1) NULL DEFAULT 0 COMMENT '审核失败次数',
  `reason` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '驳回理由',
  `support_num` int NOT NULL DEFAULT 0 COMMENT '支持总数',
  `review_ifopen` int NOT NULL DEFAULT 0 COMMENT '0评价者和被评价者可见,其他访客不可见,不计入前台显示总分1都可见，计入前台显示总分',
  `isrecommend` tinyint(1) NULL DEFAULT 0 COMMENT '是否推荐0不推荐1推荐',
  `picurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片URL',
  `thumbpicurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '学员照片缩略图URL',
  `lecturer_description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '讲师简介',
  `ins_description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '机构简介',
  `taoke_auth` tinyint(1) NOT NULL DEFAULT 0 COMMENT '淘课证实',
  `send_taobi` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否送过淘币',
  `send_sms` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否发送过短信',
  `lecturer` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '授课讲师',
  `courseins` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '开课机构',
  `lecturer_phone` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师手机',
  `ins_tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '机构电话',
  `gift_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论奖品ID',
  `is_notifytrainer` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否提醒过讲师有新评论',
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '来自哪个用户分享',
  `contact_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业邮箱',
  `tel` varchar(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '企业座机',
  `trade` tinyint NOT NULL DEFAULT 0 COMMENT '所属行业',
  `weixin_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '讲师微信号',
  `entry_type` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论入口类型: 11: 评价讲师；21: 评价机构；31: 课程；41 案例；',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `share_uid`(`share_uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2237 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评价非淘课网课程表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_share
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_share`;
CREATE TABLE `tk_comment_share`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '分享者uid',
  `comment_id` int NULL DEFAULT 0 COMMENT '评价id',
  `comment_type` tinyint(1) NULL DEFAULT 0 COMMENT '1、淘课网评论 2、非淘课网评论',
  `comment_uid` int NULL DEFAULT 0 COMMENT '评价人uid',
  `lecturer` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '被评老师',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '0、待审核 1、已审核通过 -1不通过',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uqi_scc`(`share_uid` ASC, `comment_id` ASC, `comment_type` ASC) USING BTREE,
  INDEX `comment_uid`(`comment_uid` ASC) USING BTREE,
  INDEX `lecturer`(`lecturer` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32570 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评论分享关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_share_invite
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_share_invite`;
CREATE TABLE `tk_comment_share_invite`  (
  `uid` int NOT NULL DEFAULT 0 COMMENT '评论uid',
  `from_realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '邀请人',
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评论分享关系表-临时表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_support
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_support`;
CREATE TABLE `tk_comment_support`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户ID',
  `commentid` int NOT NULL DEFAULT 0 COMMENT '评论ID',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '点赞的时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uid_comid`(`uid` ASC, `commentid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 850 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '对评论的支持' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_total
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_total`;
CREATE TABLE `tk_comment_total`  (
  `uid` int UNSIGNED NOT NULL,
  `trainer_comment` int UNSIGNED NULL DEFAULT 0 COMMENT '审核通过的讲师评论数',
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评论管理后台审核通过统计' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_touser
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_touser`;
CREATE TABLE `tk_comment_touser`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_course_id` int NOT NULL DEFAULT 0 COMMENT '课程评价表ID',
  `to_userid` int NOT NULL DEFAULT 0 COMMENT '被评价的用户ID',
  `com_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '评价类型：1：好评；0：差评',
  `score` tinyint NOT NULL DEFAULT 0 COMMENT '好评或差评的分值',
  `comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '评价内容',
  `from_userid` int NOT NULL DEFAULT 0 COMMENT '评价者ID（一般为机构，讲师）',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '1：删除',
  `createtime` int NOT NULL DEFAULT 0,
  `updatetime` int NOT NULL DEFAULT 0,
  `edittime` int NOT NULL DEFAULT 0 COMMENT '修改评价的时间',
  `explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '解释',
  `explain_crtime` int NULL DEFAULT 0 COMMENT '解释时间',
  `add_comment` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加评论',
  `add_crtime` int NULL DEFAULT 0 COMMENT '追加评论的时间',
  `add_explain` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '追加解释',
  `add_explain_crtime` int NULL DEFAULT 0 COMMENT '追加解释时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `comment_course_id`(`comment_course_id` ASC) USING BTREE,
  INDEX `to_userid`(`to_userid` ASC) USING BTREE,
  INDEX `from_userid`(`from_userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '评价表-用户（学习爱好者，培训管理者等）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_user_info
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_user_info`;
CREATE TABLE `tk_comment_user_info`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL DEFAULT 0 COMMENT '用户ID',
  `comment_total` int NOT NULL DEFAULT 0 COMMENT '评价总数',
  `good_total` int NOT NULL DEFAULT 0 COMMENT '好评数',
  `bad_total` int NOT NULL DEFAULT 0 COMMENT '差评数',
  `good_score_total` int NOT NULL DEFAULT 0 COMMENT '好评总分值',
  `bad_score_total` int NOT NULL DEFAULT 0 COMMENT '差评总分值',
  `week_good_total` int NOT NULL DEFAULT 0 COMMENT '一周好评数',
  `month_good_total` int NOT NULL DEFAULT 0 COMMENT '一个月好评数',
  `sixmonth_good_total` int NOT NULL DEFAULT 0 COMMENT '6个月内好评数',
  `week_bad_total` int NOT NULL DEFAULT 0 COMMENT '一周差评数',
  `month_bad_total` int NOT NULL DEFAULT 0 COMMENT '一个月内差评数',
  `sixmonth_bad_total` int NOT NULL DEFAULT 0 COMMENT '6个月内差评数',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userid`(`userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '用户评价详细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_comment_user_relation
-- ----------------------------
DROP TABLE IF EXISTS `tk_comment_user_relation`;
CREATE TABLE `tk_comment_user_relation`  (
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户 UID',
  `share_uid` int NOT NULL DEFAULT 0 COMMENT '邀请人UID',
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '邀请关系-用户关系' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_common_config
-- ----------------------------
DROP TABLE IF EXISTS `tk_common_config`;
CREATE TABLE `tk_common_config`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '键名',
  `val` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '值',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6824 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '通用键值对存储表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_commonlogs
-- ----------------------------
DROP TABLE IF EXISTS `tk_commonlogs`;
CREATE TABLE `tk_commonlogs`  (
  `id` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` mediumint UNSIGNED NOT NULL DEFAULT 0,
  `action` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `logdate` int UNSIGNED NOT NULL DEFAULT 0,
  `logip` char(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `uid`(`uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '前台日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_company_contact
-- ----------------------------
DROP TABLE IF EXISTS `tk_company_contact`;
CREATE TABLE `tk_company_contact`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_demand_id` int NOT NULL DEFAULT 0 COMMENT '咨询公司信息ID',
  `tel` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `province` int NOT NULL DEFAULT 0 COMMENT '所属省份',
  `city` int NOT NULL DEFAULT 0 COMMENT '所属城市',
  `address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '具体地址',
  `contact_time` int NULL DEFAULT NULL COMMENT '联系时间',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '是否成交：0:未成交；1：已成交',
  `intro` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '沟通情况',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_company_demand_id`(`company_demand_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '机构与需求联系信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_company_course_score
-- ----------------------------
DROP TABLE IF EXISTS `tk_company_course_score`;
CREATE TABLE `tk_company_course_score`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL DEFAULT 0 COMMENT 'æœºæž„id',
  `good_rate` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT 'å¥½è¯„çŽ‡',
  `good_num` int NOT NULL DEFAULT 0 COMMENT 'å¥½è¯„æ€»æ•°',
  `medium_num` int NOT NULL DEFAULT 0 COMMENT 'ä¸­è¯„æ€»æ•°',
  `bad_num` int NOT NULL DEFAULT 0 COMMENT 'å·®è¯„æ€»æ•°',
  `colligation_score` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT 'ç»¼åˆè¯„åˆ†',
  `quality_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹è´¨é‡éƒ¨åˆ†',
  `yard_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹åœºåœ°æ€»åˆ†',
  `service_total` int NOT NULL DEFAULT 0 COMMENT 'æœåŠ¡è´¨é‡æ€»åˆ†',
  `comment_num` int NOT NULL DEFAULT 0 COMMENT 'è¯„è®ºæ€»æ¡æ•°',
  `week_good_num` int NOT NULL DEFAULT 0 COMMENT '1å‘¨çš„å¥½è¯„æ•°',
  `month_good_num` int NOT NULL DEFAULT 0 COMMENT '1ä¸ªæœˆçš„å¥½è¯„æ•°',
  `sixmonth_good_num` int NOT NULL DEFAULT 0 COMMENT '6ä¸ªæœˆçš„å¥½è¯„æ•°',
  `week_medium_num` int NOT NULL DEFAULT 0 COMMENT '1å‘¨çš„ä¸­è¯„æ•°',
  `month_medium_num` int NOT NULL DEFAULT 0 COMMENT '1ä¸ªæœˆçš„ä¸­è¯„æ•°',
  `sixmonth_medium_num` int NOT NULL DEFAULT 0 COMMENT '6ä¸ªæœˆçš„ä¸­è¯„æ•°',
  `week_bad_num` int NOT NULL DEFAULT 0 COMMENT '1å‘¨çš„å·®è¯„æ•°',
  `month_bad_num` int NOT NULL DEFAULT 0 COMMENT '1ä¸ªæœˆçš„å·®è¯„æ•°',
  `sixmonth_bad_num` int NOT NULL DEFAULT 0 COMMENT '6ä¸ªæœˆçš„å·®è¯„æ•°',
  `befservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾å‰æœåŠ¡æ€»åˆ†',
  `classtime_total` int NOT NULL DEFAULT 0 COMMENT 'å‡†æ—¶å¼€è¯¾æ€»åˆ†',
  `classmatch_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹å†…å®¹ä¸Žè¯¾ç¨‹å¤§çº²åŒ¹é…åº¦æ€»åˆ†',
  `teacherlevel_total` int NOT NULL DEFAULT 0 COMMENT 'è®²å¸ˆæŽˆè¯¾è´¨é‡æ€»åˆ†',
  `classservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾ç¨‹æœåŠ¡è´¨é‡æ€»åˆ†',
  `aftservice_total` int NOT NULL DEFAULT 0 COMMENT 'è¯¾åŽæœåŠ¡è´¨é‡æ€»åˆ†',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_c_i`(`company_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = 'æœºæž„è¯¾ç¨‹ç»¼åˆè¯„åˆ†' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_company_demand
-- ----------------------------
DROP TABLE IF EXISTS `tk_company_demand`;
CREATE TABLE `tk_company_demand`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL DEFAULT 0 COMMENT '公司id',
  `company_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '公司名称',
  `roleid` int NOT NULL DEFAULT 0 COMMENT '角色id',
  `content` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '咨询内容',
  `realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '公司名称',
  `mobile` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '手机号码',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `user_id` int NOT NULL DEFAULT 0 COMMENT '发布者id(如果未登陆发布则为0)',
  `is_view` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已查看',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_company_id`(`company_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 404 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '咨询公司信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_company_recommend
-- ----------------------------
DROP TABLE IF EXISTS `tk_company_recommend`;
CREATE TABLE `tk_company_recommend`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL DEFAULT 0 COMMENT '会员id',
  `status` tinyint(1) NULL DEFAULT NULL COMMENT '状态信息：-9 已删除，-1 不显示，1 显示',
  `title` varchar(120) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `position` tinyint(1) NULL DEFAULT NULL COMMENT '显示位置',
  `sequence` int NULL DEFAULT NULL COMMENT '顺序',
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '描述',
  `createTime` int NULL DEFAULT NULL COMMENT '创建时间',
  `updateTime` int NULL DEFAULT NULL COMMENT '更新时间',
  `deleteTime` int NULL DEFAULT NULL COMMENT '删除时间',
  `operator` int NULL DEFAULT NULL COMMENT '操作者',
  `begin` int NULL DEFAULT NULL,
  `end` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_uid_status`(`userId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1040 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '开通名师通记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_concact_hit_log
-- ----------------------------
DROP TABLE IF EXISTS `tk_concact_hit_log`;
CREATE TABLE `tk_concact_hit_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '1公开课详情2内训详情3机构4讲师',
  `keyid` int NOT NULL DEFAULT 0 COMMENT 'type对应的课程ID，机构ID，讲师ID',
  `date_times` int NULL DEFAULT 0 COMMENT '点击时间',
  `username` varchar(80) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT '游客' COMMENT '点击的用户名',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `type_keyid`(`type` ASC, `keyid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15882 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '记录用户点击咨询开课方表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for tk_concact_hit_total_num
-- ----------------------------
DROP TABLE IF EXISTS `tk_concact_hit_total_num`;
CREATE TABLE `tk_concact_hit_total_num`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '1公开课详情2内训详情3机构4讲师',
  `keyid` int NOT NULL DEFAULT 0 COMMENT 'type对应的课程ID，机构ID，讲师ID',
  `total` int NULL DEFAULT 0 COMMENT '记录总数',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `total_type_keyid`(`type` ASC, `keyid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9706 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '记录用户点击咨询开课方总数表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for tk_configs
-- ----------------------------
DROP TABLE IF EXISTS `tk_configs`;
CREATE TABLE `tk_configs`  (
  `ckey` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '配置项',
  `cvalue` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '对应的值',
  PRIMARY KEY (`ckey`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_contact_account
-- ----------------------------
DROP TABLE IF EXISTS `tk_contact_account`;
CREATE TABLE `tk_contact_account`  (
  `uid` int UNSIGNED NOT NULL,
  `default_time_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '默认次数',
  `default_trainer_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '默认讲师次数',
  `remain_time_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '剩余查看次数',
  `remain_trainer_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '剩余可查看讲师数',
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '查看讲师联系方式账户' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_contact_order
-- ----------------------------
DROP TABLE IF EXISTS `tk_contact_order`;
CREATE TABLE `tk_contact_order`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int UNSIGNED NOT NULL,
  `order_subject` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '订单标题',
  `order_code` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '订单编号',
  `trade_no` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT '第三方交易编号',
  `package_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '套餐 ID',
  `price` float(20, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '价格',
  `pay_status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '支付状态: 0 待支付；1 已支付；',
  `trainer_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '可看讲师数量',
  `time_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '可查看次数',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `remark` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_code`(`order_code` ASC) USING BTREE,
  INDEX `trade_no`(`trade_no` ASC) USING BTREE,
  INDEX `package_id`(`uid` ASC, `package_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3704 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '联系方式查看 - 订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_contact_package
-- ----------------------------
DROP TABLE IF EXISTS `tk_contact_package`;
CREATE TABLE `tk_contact_package`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '套餐名称',
  `show_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '前台显示名称',
  `show_sort` tinyint(1) NOT NULL DEFAULT 0 COMMENT '显示顺序',
  `trainer_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '可看讲师数',
  `time_num` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '可看讲师次数',
  `market_price` float(20, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '市场价',
  `discount_price` float(20, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '折扣价',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  `is_visible` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否前端可见: 0 不可见； 1 可见；',
  `disabled` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否禁用: 0 不是； 1 是；',
  `is_default` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '默认套餐： 0 不是； 1 是；',
  `is_init` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否是初始化套餐: 0 不是； 1 是；',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10004 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '查看联系方式套餐' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_costco_auth
-- ----------------------------
DROP TABLE IF EXISTS `tk_costco_auth`;
CREATE TABLE `tk_costco_auth`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `target_id` int NOT NULL DEFAULT 0 COMMENT '关联ID',
  `root_company_id` int UNSIGNED NULL DEFAULT 0 COMMENT '集团id',
  `manager_identity` tinyint NULL DEFAULT 0 COMMENT '集团身份 0:普通成员 1:分级管理员 2:超级管理员',
  `type` tinyint NULL DEFAULT 0 COMMENT '1公开课 2内训课 3在线课 4讲师 5在线课程包',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `begintime` int NOT NULL DEFAULT 0 COMMENT '开通时间',
  `endtime` int NOT NULL DEFAULT 0 COMMENT '截止时间',
  `is_volid` tinyint NOT NULL DEFAULT 0 COMMENT '是否生效',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `target_type`(`target_id` ASC, `type` ASC) USING BTREE,
  INDEX `target_id`(`target_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 245 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'Costco认证表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_costco_member
-- ----------------------------
DROP TABLE IF EXISTS `tk_costco_member`;
CREATE TABLE `tk_costco_member`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户ID',
  `root_company_id` int UNSIGNED NULL DEFAULT 0 COMMENT '集团id',
  `manager_identity` tinyint NULL DEFAULT 0 COMMENT '集团身份 0:普通成员 1:分级管理员 2:超级管理员',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `begintime` int NOT NULL DEFAULT 0 COMMENT '开通时间',
  `endtime` int NOT NULL DEFAULT 0 COMMENT '截止时间',
  `is_volid` tinyint NOT NULL DEFAULT 0 COMMENT '是否生效',
  `query_total_num` int NOT NULL DEFAULT 0 COMMENT '查询总的次数',
  `query_every_num` int NOT NULL DEFAULT 0 COMMENT '每次查询条数',
  `query_use_num` int NOT NULL DEFAULT 0 COMMENT '查询已使用次数',
  `money` int NOT NULL DEFAULT 0 COMMENT 'Costco会费',
  `price_show_total` int NOT NULL DEFAULT 0 COMMENT 'arp价格显示总数',
  `price_show_num` int NOT NULL DEFAULT 0 COMMENT 'ARP价格已显示次数',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uid`(`uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'Costco会员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_costco_records
-- ----------------------------
DROP TABLE IF EXISTS `tk_costco_records`;
CREATE TABLE `tk_costco_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cos_id` int NOT NULL DEFAULT 0 COMMENT 'costco会员ID',
  `uid` int NOT NULL DEFAULT 0 COMMENT '开通人ID',
  `type` tinyint NULL DEFAULT 0 COMMENT '1公开课 2内训课 3在线课 4讲师 5会员',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 142 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'Costco认证和开通记录表' ROW_FORMAT = Dynamic;

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

-- ----------------------------
-- Table structure for tk_course_bak202409051832
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_bak202409051832`;
CREATE TABLE `tk_course_bak202409051832`  (
  `id` int UNSIGNED NOT NULL DEFAULT 0,
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
  `cos_price` float NULL DEFAULT 0 COMMENT 'costco价格'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_cate`;
CREATE TABLE `tk_course_cate`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
  `cate_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '分类名称',
  `createtime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  `disabled` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否禁用: 0 未禁用；1 已禁用；',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 464 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '课程分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_cate_relation
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_cate_relation`;
CREATE TABLE `tk_course_cate_relation`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `cate_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT 'tk_case_cate 表 id',
  `course_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT 'tk_courseinfo 课程 ID',
  `sort` smallint UNSIGNED NOT NULL DEFAULT 9999 COMMENT '顺序',
  `updatetime` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `course_id`(`cate_id` ASC, `course_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5796 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '课程分类排序' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_comment
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_comment`;
CREATE TABLE `tk_course_comment`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `order_course_id` int NOT NULL DEFAULT 0 COMMENT '订单课程id',
  `big_course_id` int NOT NULL DEFAULT 0 COMMENT '大课程id',
  `course_id` int NOT NULL DEFAULT 0 COMMENT '课程id',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `company_id` int NOT NULL DEFAULT 0 COMMENT '课程发布者id',
  `company_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程发布者公司名称',
  `rank` tinyint(1) NOT NULL DEFAULT 0 COMMENT '评价等级(-1:差评;0:中评;1:好评)',
  `rank_name` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评价等级名称',
  `content` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评价内容',
  `quality` tinyint(1) NOT NULL DEFAULT 0 COMMENT '课程质量',
  `yard` tinyint(1) NOT NULL DEFAULT 0 COMMENT '课程场地',
  `service` tinyint(1) NOT NULL DEFAULT 0 COMMENT '服务质量',
  `userid` int NOT NULL DEFAULT 0 COMMENT '评论者id',
  `username` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '评论者用户名',
  `createtime` int NULL DEFAULT 0 COMMENT '评论时间',
  `is_edit` tinyint(1) NOT NULL DEFAULT 0 COMMENT '评价者是否修改过0、否;1、是',
  `is_show` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否显示',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_course`(`course_id` ASC, `big_course_id` ASC) USING BTREE,
  INDEX `idx_company`(`company_id` ASC) USING BTREE,
  INDEX `idx_userid`(`userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程评价' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_comment_reply
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_comment_reply`;
CREATE TABLE `tk_course_comment_reply`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL DEFAULT 0 COMMENT '评价id',
  `company_id` int NOT NULL DEFAULT 0 COMMENT '解释者id(机构id)',
  `explain` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '解释内容',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_comment_id`(`comment_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程评价解释' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_fav
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_fav`;
CREATE TABLE `tk_course_fav`  (
  `fid` int NOT NULL AUTO_INCREMENT,
  `tid` int NULL DEFAULT 0,
  `uid` int NULL DEFAULT 0,
  `ctime` int NULL DEFAULT NULL,
  PRIMARY KEY (`fid`) USING BTREE,
  INDEX `index_uid`(`uid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 752 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_key_word
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_key_word`;
CREATE TABLE `tk_course_key_word`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pre_key_word` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '预设关键字',
  `define_key_word` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '自定义匹配关键字@符号分割',
  `define_rule` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '自定匹配规则',
  `tips` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '字段提示语',
  `data_type` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '数据类型: 0 未知；1 文本；2 数字; 3 HTML; 4 日期;',
  `module` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '模块',
  `shortname` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '' COMMENT '简称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '自定义匹配课程关键字' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order`;
CREATE TABLE `tk_course_order`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '订单编号',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `message` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT '给机构留言',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 169 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_alipay
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_alipay`;
CREATE TABLE `tk_course_order_alipay`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `alipay_account` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '支付宝帐号',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单支付宝帐号信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_bank
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_bank`;
CREATE TABLE `tk_course_order_bank`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `bank_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `bank_account` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单银行帐号信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_course
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_course`;
CREATE TABLE `tk_course_order_course`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `operate_id` int NOT NULL COMMENT '操作id',
  `order_id` int NOT NULL COMMENT '订单id',
  `course_id` int NOT NULL DEFAULT 0 COMMENT '课程id',
  `course_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程标题',
  `course_price` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT '课程价格',
  `course_num` int NOT NULL DEFAULT 0 COMMENT '课程数量',
  `course_userid` int NOT NULL DEFAULT 0 COMMENT '课程所属机构id',
  `course_company` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '课程所属机构公司名称',
  `opencourse_discount` float(11, 0) NOT NULL DEFAULT 0 COMMENT '课程佣金',
  `course_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '课程开课状态(0:未开始；1:已结束)',
  `satisfaction` tinyint(1) NOT NULL DEFAULT 0 COMMENT '满意度(0:默认未填写；1:基本满意；2:非常满意；-1:不满意；-2:非常不满意)',
  `questionnaire` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已填写调查表(0:否;1:是)',
  `all_status` int NULL DEFAULT 0 COMMENT '所有状态汇总(tk_course_order_operate表状态汇总, 其中开票情况为前8位，给机构付款为第9至16位，客户付款为第17至24位，其他为第25至32位)',
  `is_read` tinyint NOT NULL DEFAULT 0 COMMENT '是否只读(0：否;1:是)',
  `is_demand` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否转换为需求(0=否;1=是)',
  `tuan_id` int NULL DEFAULT 0 COMMENT '----ID ',
  `earnest` float(11, 2) NULL DEFAULT 0.00 COMMENT '定金金额',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_opid_orid`(`operate_id` ASC, `order_id` ASC) USING BTREE,
  INDEX `idx_cid_cuid`(`course_id` ASC, `course_userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 158 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单课程' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_current_status
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_current_status`;
CREATE TABLE `tk_course_order_current_status`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `operate_type_id` int NOT NULL DEFAULT 0 COMMENT '操作类型id',
  `operate_id` int NOT NULL DEFAULT 0 COMMENT '操作id',
  `order_course_id` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_oid_otid_opid`(`order_id` ASC, `operate_type_id` ASC, `operate_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 673 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '当前订单操作关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_invoice
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_invoice`;
CREATE TABLE `tk_course_order_invoice`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `operate_id` int NOT NULL DEFAULT 0 COMMENT '操作id',
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `invoice_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '开票情况(0、未开票;1、淘课代开；2、机构自已开)',
  `invoice_amount` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT '开票金额',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `operator_userid` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_opid_oid`(`operate_id` ASC, `order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单发票表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_operate
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_operate`;
CREATE TABLE `tk_course_order_operate`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `type_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '订单操作类型(1、客户付款；2、给机构付款;3、开票情况；0、其他)',
  `type_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '订单操作解释',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '操作状态',
  `status_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作状态解释',
  `title` varchar(250) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作标题',
  `intro` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作说明',
  `createtime` int NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_oid_tid_s`(`order_id` ASC, `type_id` ASC, `status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 194 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '订单操作记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_pay
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_pay`;
CREATE TABLE `tk_course_order_pay`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `userid` int NOT NULL DEFAULT 0 COMMENT '购买者用户id',
  `realname` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '购买者真实姓名',
  `mobile` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '购买者手机号码',
  `company` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '购买者公司名称',
  `pay_type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '支付方式(1、支付宝;2、线下支付)',
  `pay_form` tinyint(1) NOT NULL DEFAULT 0 COMMENT '付款类型(0、在线下单;1、代理下单)',
  `trade_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '交易号(支付宝支付则自动生成，线下支付手动后台填写)',
  `total` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `earnest` float(11, 2) NULL DEFAULT 0.00 COMMENT '定金金额',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_oid_uid`(`order_id` ASC, `userid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 169 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程订单付款信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_pay2company
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_pay2company`;
CREATE TABLE `tk_course_order_pay2company`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `operate_id` int NOT NULL DEFAULT 0 COMMENT '操作id',
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `pay_amount` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT '付款金额',
  `pay_proof` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '付款凭证',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `operator_userid` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_opid_orid`(`operate_id` ASC, `order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '付款给机构记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_order_refund
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_order_refund`;
CREATE TABLE `tk_course_order_refund`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `operate_id` int NOT NULL DEFAULT 0 COMMENT '操作id',
  `order_id` int NOT NULL DEFAULT 0 COMMENT '订单id',
  `reason` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '退款理由',
  `communication` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '沟通情况',
  `intro` varchar(500) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '拒绝理由',
  `refund_amount` float(11, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额',
  `is_agree` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否同意退款',
  `is_over` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否完成退款',
  `is_accept` tinyint(1) NOT NULL DEFAULT 0 COMMENT '客户是否已收款',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `operator_userid` int NOT NULL DEFAULT 0 COMMENT '操作者id',
  `operator_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '操作者用户名',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_oid_orid`(`operate_id` ASC, `order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程订单退款记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_pic
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_pic`;
CREATE TABLE `tk_course_pic`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL DEFAULT 0 COMMENT '用户ID',
  `cid` int NOT NULL DEFAULT 0 COMMENT '课程ID',
  `pic` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '图片地址',
  `up_time` int NOT NULL DEFAULT 0 COMMENT '添加时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_uid`(`uid` ASC) USING BTREE,
  INDEX `index_cid`(`cid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 57330 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程图片' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_price_config
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_price_config`;
CREATE TABLE `tk_course_price_config`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `price` int NOT NULL DEFAULT 0 COMMENT '课酬',
  `tk_times` decimal(3, 2) NOT NULL DEFAULT 0.00 COMMENT '淘课价倍率',
  `market_times` decimal(3, 2) NOT NULL DEFAULT 0.00 COMMENT '市场价倍率',
  `tk_price` int NOT NULL DEFAULT 0 COMMENT '淘课价',
  `market_price` int NOT NULL DEFAULT 0 COMMENT '市场价',
  `percent` decimal(10, 4) NOT NULL DEFAULT 0.0000 COMMENT '淘课价优惠率 0.9300=93.00%',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '讲师内训课定价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_question
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_question`;
CREATE TABLE `tk_course_question`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `subject_title` varchar(80) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '问题主题',
  `course_tags` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT '问题关注字多个以逗号隔开',
  `sorting` int NOT NULL DEFAULT 0 COMMENT '排序降序',
  `if_open` tinyint(1) NOT NULL DEFAULT 1 COMMENT '(0:未启用,1:启用) ',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `subject_title`(`subject_title` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 65 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程问题列表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_recommend_cate
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_recommend_cate`;
CREATE TABLE `tk_course_recommend_cate`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL DEFAULT 0 COMMENT '课程ID',
  `r_position` tinyint(1) NOT NULL DEFAULT 0 COMMENT '推荐位置',
  `r_cate` int NOT NULL DEFAULT 0 COMMENT '会员所属推荐领域',
  `coursetj_id` int NOT NULL DEFAULT 0 COMMENT '表 tk_coursetj 主键',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `coursetj_id`(`coursetj_id` ASC, `r_cate` ASC, `course_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 370 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程推荐领域表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tk_course_refresh
-- ----------------------------
DROP TABLE IF EXISTS `tk_course_refresh`;
CREATE TABLE `tk_course_refresh`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseid` int NOT NULL DEFAULT 0 COMMENT '课程id',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_courseid`(`courseid` ASC) USING BTREE,
  INDEX `index_courseid_createtime`(`courseid` ASC, `createtime` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 87395 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '课程刷新记录表' ROW_FORMAT = Dynamic;
