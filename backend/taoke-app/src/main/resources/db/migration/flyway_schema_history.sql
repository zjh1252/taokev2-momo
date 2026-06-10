-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.2 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table taokev2.flyway_schema_history: ~57 rows (approximately)
INSERT INTO `flyway_schema_history` (`installed_rank`, `version`, `description`, `type`, `script`, `checksum`, `installed_by`, `installed_on`, `execution_time`, `success`) VALUES
	(1, '1', 'create user and rbac tables', 'SQL', 'V1__create_user_and_rbac_tables.sql', -1425175134, 'root', '2026-03-31 03:00:53', 2836, 1),
	(2, '1.1', 'init permissions', 'SQL', 'V1_1__init_permissions.sql', 1340883911, 'root', '2026-03-31 03:00:53', 41, 1),
	(3, '1.2', 'init roles and super admin', 'SQL', 'V1_2__init_roles_and_super_admin.sql', 1025752260, 'root', '2026-03-31 03:00:53', 16, 1),
	(4, '2', 'create role extension and binding tables', 'SQL', 'V2__create_role_extension_and_binding_tables.sql', 198221422, 'root', '2026-03-31 04:49:25', 3243, 1),
	(5, '3', 'rename organization and enterprise tables', 'SQL', 'V3__rename_organization_and_enterprise_tables.sql', 695004582, 'root', '2026-03-31 06:16:49', 1108, 1),
	(6, '4', 'add reject reason to user roles', 'SQL', 'V4__add_reject_reason_to_user_roles.sql', 59059274, 'root', '2026-03-31 07:27:25', 671, 1),
	(7, '6', 'add common regions', 'SQL', 'V6__add_common_regions.sql', 1896886142, 'root', '2026-04-01 08:14:56', 99, 1),
	(8, '7', 'expand trainers and create sub tables', 'SQL', 'V7__expand_trainers_and_create_sub_tables.sql', 909962339, 'root', '2026-04-01 10:13:29', 2026, 1),
	(9, '8', 'create sys categories and refactor trainer categories', 'SQL', 'V8__create_sys_categories_and_refactor_trainer_categories.sql', 1977425033, 'root', '2026-04-01 11:53:00', 842, 1),
	(10, '9', 'add common regoins data', 'SQL', 'V9__add_common_regoins_data.sql', 501149083, 'root', '2026-04-01 11:55:32', 964, 1),
	(11, '10', 'seed trainer data', 'SQL', 'V10__seed_trainer_data.sql', 334411817, 'root', '2026-04-01 12:22:47', 20, 1),
	(12, '11', 'seed top5 trainer detail data', 'SQL', 'V11__seed_top5_trainer_detail_data.sql', 67235416, 'root', '2026-04-01 12:55:01', 386, 1),
	(13, '12', 'add role type and seed business roles', 'SQL', 'V12__add_role_type_and_seed_business_roles.sql', -330559966, 'root', '2026-04-02 01:41:35', 753, 1),
	(14, '13', 'seed course categories', 'SQL', 'V13__seed_course_categories.sql', -39866833, 'root', '2026-04-02 01:59:15', 578, 1),
	(15, '14', 'create notifications table', 'SQL', 'V14__create_notifications_table.sql', 941380378, 'root', '2026-04-02 03:09:49', 1029, 1),
	(16, '15', 'create notification templates table', 'SQL', 'V15__create_notification_templates_table.sql', -873602457, 'root', '2026-04-02 03:39:33', 812, 1),
	(17, '16', 'create courses and plans tables', 'SQL', 'V16__create_courses_and_plans_tables.sql', -59765433, 'root', '2026-04-02 07:41:08', 1561, 1),
	(18, '17', 'alter courses type default', 'SQL', 'V17__alter_courses_type_default.sql', 1953457760, 'root', '2026-04-02 08:25:54', 678, 1),
	(19, '18', 'seed courses and plans', 'SQL', 'V18__seed_courses_and_plans.sql', 2029659625, 'root', '2026-04-02 08:37:07', 56, 1),
	(20, '19', 'add has plan to courses', 'SQL', 'V19__add_has_plan_to_courses.sql', -1896279121, 'root', '2026-04-07 02:11:21', 685, 1),
	(21, '20', 'expand institutions and seed data', 'SQL', 'V20__expand_institutions_and_seed_data.sql', 1110081157, 'root', '2026-04-07 03:17:38', 4, 1),
	(22, '21', 'create video tables and seed categories', 'SQL', 'V21__create_video_tables_and_seed_categories.sql', -376451337, 'root', '2026-04-07 03:53:57', 1669, 1),
	(23, '22', 'create cart order payment tables', 'SQL', 'V22__create_cart_order_payment_tables.sql', -1623914257, 'root', '2026-04-07 04:58:41', 1471, 1),
	(24, '23', 'interaction tables', 'SQL', 'V23__interaction_tables.sql', 1440641690, 'root', '2026-04-08 05:26:41', 1523, 1),
	(25, '24', 'field type convention', 'SQL', 'V24__field_type_convention.sql', 1767712786, 'root', '2026-04-08 06:14:29', 1132, 1),
	(26, '25', 'create video chapter progress table', 'SQL', 'V25__create_video_chapter_progress_table.sql', -828972527, 'root', '2026-04-08 10:06:19', 884, 1),
	(27, '26', 'add trainer code to user trainers', 'SQL', 'V26__add_trainer_code_to_user_trainers.sql', -67625722, 'root', '2026-04-09 03:55:00', 780, 1),
	(28, '27', 'add association to institutions', 'SQL', 'V27__add_association_to_institutions.sql', -2056818415, 'root', '2026-04-09 05:21:32', 580, 1),
	(29, '28', 'seed trainer codes for existing trainers', 'SQL', 'V28__seed_trainer_codes_for_existing_trainers.sql', -1281556865, 'root', '2026-04-09 08:35:10', 89, 1),
	(30, '29', 'create sensitive words table', 'SQL', 'V29__create_sensitive_words_table.sql', -1907527684, 'root', '2026-04-11 07:24:50', 1142, 1),
	(31, '30', 'create trainer cases and files tables', 'SQL', 'V30__create_trainer_cases_and_files_tables.sql', -1257133485, 'root', '2026-04-11 07:26:57', 531, 1),
	(32, '31', 'create trainer highlights table', 'SQL', 'V31__create_trainer_highlights_table.sql', 1566328080, 'root', '2026-04-11 07:31:35', 181, 1),
	(33, '32', 'optimize indexes for new tables', 'SQL', 'V32__optimize_indexes_for_new_tables.sql', 1231077569, 'root', '2026-04-11 08:01:42', 2063, 1),
	(34, '33', 'create trainer highlight files table', 'SQL', 'V33__create_trainer_highlight_files_table.sql', -451459294, 'root', '2026-04-11 09:45:30', 955, 1),
	(35, '34', 'create demand tables', 'SQL', 'V34__create_demand_tables.sql', -85689854, 'root', '2026-04-16 11:11:15', 1125, 1),
	(36, '35', 'add demand contact and region fields', 'SQL', 'V35__add_demand_contact_and_region_fields.sql', 33142644, 'root', '2026-04-17 01:25:39', 362, 1),
	(37, '36', 'add partial clients and message district', 'SQL', 'V36__add_partial_clients_and_message_district.sql', 1203611002, 'root', '2026-04-21 01:37:08', 1142, 1),
	(38, '37', 'institution detail iteration', 'SQL', 'V37__institution_detail_iteration.sql', 1613665257, 'root', '2026-04-21 01:37:09', 935, 1),
	(39, '38', 'trainer books and recount comments', 'SQL', 'V38__trainer_books_and_recount_comments.sql', -1003138012, 'root', '2026-04-21 02:36:50', 348, 1),
	(40, '39', 'role bindings and institution venues', 'SQL', 'V39__role_bindings_and_institution_venues.sql', 2050729795, 'root', '2026-04-21 03:51:37', 1520, 1),
	(41, '40', 'institution venues status int and images', 'SQL', 'V40__institution_venues_status_int_and_images.sql', -1297882724, 'root', '2026-04-21 04:00:38', 555, 1),
	(42, '41', 'binding apply refactor', 'SQL', 'V41__binding_apply_refactor.sql', -1761441298, 'root', '2026-04-21 08:27:20', 917, 1),
	(43, '42', 'backfill binding initiator', 'SQL', 'V42__backfill_binding_initiator.sql', 1384023260, 'root', '2026-04-21 08:57:28', 155, 1),
	(44, '44', 'expand trainer apply fields', 'SQL', 'V44__expand_trainer_apply_fields.sql', 913000110, 'root', '2026-04-21 12:18:05', 545, 1),
	(45, '45', 'expand apply fields phase2', 'SQL', 'V45__expand_apply_fields_phase2.sql', -1512135760, 'root', '2026-04-22 03:03:49', 998, 1),
	(46, '46', 'expand apply fields phase3', 'SQL', 'V46__expand_apply_fields_phase3.sql', -138052494, 'root', '2026-04-22 03:35:25', 763, 1),
	(47, '47', 'fix institution has flags tinyint', 'SQL', 'V47__fix_institution_has_flags_tinyint.sql', -1244989161, 'root', '2026-04-22 03:47:29', 674, 1),
	(48, '48', 'expand user profile and trainer certifications', 'SQL', 'V48__expand_user_profile_and_trainer_certifications.sql', -188477136, 'root', '2026-04-23 10:45:15', 3290, 1),
	(49, '49', 'role certifications', 'SQL', 'V49__role_certifications.sql', -1289366351, 'root', '2026-04-24 10:53:49', 2176, 1),
	(50, '50', 'add user username column', 'SQL', 'V50__add_user_username_column.sql', 1286734251, 'root', '2026-04-24 10:53:50', 434, 1),
	(51, '61', 'trainer case training location', 'SQL', 'V61__trainer_case_training_location.sql', 165334079, 'root', '2026-04-28 09:02:56', 431, 1),
	(52, '62', 'course summary material and total hours', 'SQL', 'V62__course_summary_material_and_total_hours.sql', -731755943, 'root', '2026-04-29 12:27:01', 1440, 1),
	(53, '63', 'add course material text', 'SQL', 'V63__add_course_material_text.sql', -53507340, 'root', '2026-04-29 12:27:01', 45, 1),
	(54, '64', 'add en name to common regions', 'SQL', 'V64__add_en_name_to_common_regions.sql', 771068099, 'root', '2026-05-20 04:20:01', 1281, 1),
	(55, '65', 'migrate trainer avatar to users', 'SQL', 'V65__migrate_trainer_avatar_to_users.sql', -1366771269, 'root', '2026-05-20 13:10:04', 151, 1),
	(56, '66', 'add user ucenter columns', 'SQL', 'V66__add_user_ucenter_columns.sql', -1163992930, 'root', '2026-05-23 03:05:28', 848, 1),
	(57, '67', 'FROM ZJH SQL', 'SQL', 'V67__FROM_ZJH_SQL.sql', 710753747, 'root', '2026-05-25 11:58:17', 549, 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
