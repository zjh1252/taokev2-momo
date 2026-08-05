import importlib.util
import sys
import unittest
from datetime import date, datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script(name: str):
    path = SCRIPTS / name
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class LegacyUserRoleProfileMigrateTest(unittest.TestCase):
    def test_user_row_preserves_legacy_id_and_dedupes_login_fields(self):
        module = load_script("run_legacy_users_migrate.py")
        uniques = {
            "ids": set(),
            "usernames": {"fred"},
            "phones": set(),
            "emails": {"shenfeng@shciic.com"},
            "uc_uids": set(),
        }

        row = module.build_user_row(
            {
                "id": 30187,
                "username": "fred",
                "password": "96e79218965eb72c92a549dd5a330112",
                "gender": 2,
                "realname": "自由战士",
                "nickname": "沈丰",
                "province": 33,
                "city": 330900,
                "email": "shenfeng@shciic.com",
                "icon": "attachments/user/middle/30187/30187.jpg",
                "state": 1,
                "approveinfo": "",
                "regtime": 1076570144,
                "logintime": 1501834612,
                "modified": 1729042139,
                "is_del": 0,
                "reg_origin": 21,
                "cdbid": 773741,
                "ext_mobile": "13800138000",
                "ext_address": "Shanghai",
                "ext_postcode": "200000",
            },
            uniques,
            "https://www.taoke.com",
        )

        self.assertEqual(row["id"], 30187)
        self.assertEqual(row["uc_uid"], 773741)
        self.assertEqual(row["username"], "fred_30187")
        self.assertEqual(row["email"], "30187_shenfeng@shciic.com")
        self.assertEqual(row["phone"], "13800138000")
        self.assertEqual(row["avatar_url"], "https://www.taoke.com/attachments/user/middle/30187/30187.jpg")
        self.assertEqual(row["source"], "old")
        self.assertEqual(row["user_source"], 2)

    def test_role_row_maps_legacy_group_to_active_business_role(self):
        module = load_script("run_legacy_roles_migrate.py")

        self.assertEqual(module.ROLE_BY_GROUP[9], "TRAINER")
        self.assertEqual(module.ROLE_BY_GROUP[3], "INSTITUTION")

        row = module.build_role_row({"id": 30187, "is_del": 0, "regtime": 1076570144, "modified": 1729042139}, "TRAINER")

        self.assertEqual(row["user_id"], 30187)
        self.assertEqual(row["role"], "TRAINER")
        self.assertEqual(row["status"], 1)
        self.assertEqual(row["reapplying"], 0)
        self.assertIsNone(row["approved_at"])

    def test_trainer_row_combines_member_and_extension_profile(self):
        module = load_script("run_legacy_trainers_migrate.py")

        row = module.build_trainer_row(
            {
                "id": 30225,
                "username": "wangwangjun",
                "gender": 2,
                "realname": "cs",
                "nickname": "王望君",
                "cid": "508",
                "province": 13,
                "city": 130300,
                "email": "wangwangjun@vip.sina.com",
                "icon": "attachments/user/middle/30225/30225.jpg",
                "intro": "更多简介",
                "companyintro": "部分客户",
                "goodat": "",
                "isapprove": 1,
                "approveinfo": "",
                "regtime": 1078498204,
                "modified": 1736161141,
                "clicknum": 1932,
                "commentnum": 0,
                "isrec": 0,
                "issign": 0,
                "score": 0,
                "is_del": 0,
                "ext_mobile": "",
                "ext_address": "",
                "ext_postcode": "",
                "ext_customer": "部分客户",
                "ext_price": 0,
                "ext_price_lowest": 0,
                "ext_price_medium": 0,
                "ext_price_taoke": 2000,
                "ext_lowest_price_taoke": 1200,
                "ext_job": "",
                "ext_work_year": 0,
                "ext_space_pic": "",
                "ext_trainer_name": "cs",
                "ext_teaching_experience": 0,
                "ext_qualification_certificate": "",
                "ext_accented": "一句话介绍",
                "ext_demands_city": "310000",
                "ext_tags": "",
                "ext_credential": "身份资质",
                "ext_style": "风格特色",
                "ext_customer_word": "客户感言",
                "ext_classic_case": "典型案列",
                "ext_topic": "擅长课题",
                "ext_intro_bak": "更多简介备份",
                "auth_id_code": "",
                "auth_id_front": "",
                "auth_id_back": "",
                "auth_ctime": 0,
                "auth_isapprove": None,
                "auth_reason": "",
            },
            "https://www.taoke.com",
        )

        self.assertEqual(row["id"], 30225)
        self.assertEqual(row["user_id"], 30225)
        self.assertEqual(row["name"], "cs")
        self.assertEqual(row["teaching_name"], "cs")
        self.assertEqual(row["status"], 2)
        self.assertEqual(row["bio"], "身份资质")
        self.assertEqual(row["one_line_intro"], "一句话介绍")
        self.assertEqual(row["intro"], "更多简介\n典型案列")
        self.assertEqual(row["partial_clients"], "部分客户\n客户感言")
        self.assertEqual(row["good_at"], "擅长课题")
        self.assertEqual(str(row["taoke_price"]), "2000.00")
        self.assertEqual(str(row["taoke_commission"]), "1200.00")

    def test_institution_row_uses_company_identity_and_public_eligibility(self):
        module = load_script("run_legacy_institutions_migrate.py")

        row = module.build_institution_row(
            {
                "id": 30830,
                "username": "furuicorp",
                "realname": "老方",
                "nickname": "老方",
                "cid": "领导力",
                "trade": "金融",
                "province": 310000,
                "city": 310100,
                "company": "上海复锐企业管理咨询有限公司",
                "company_simple": "复锐",
                "icon": "attachments/user/middle/30830/30830.png",
                "intro": "",
                "companyintro": "机构简介",
                "goodat": "宝钢集团",
                "isapprove": 1,
                "approveinfo": "",
                "regtime": 1450000000,
                "modified": 1720000000,
                "openingnum": 39,
                "trainingnum": 5,
                "clicknum": 3917,
                "commentnum": 0,
                "isrec": 1,
                "iscontact": 1,
                "roleid": 1234,
                "is_del": 0,
                "ext_mobile": "13265717020",
                "ext_tel": "",
                "ext_address": "",
                "ext_postcode": "",
                "ext_website": "https://example.com",
                "ext_persons": "100-499人",
                "ext_workforce": "",
                "ext_turnover": "1000万",
                "ext_company_nature": "民营",
                "ext_corporate_representative": "",
                "ext_establishment": "2010-01-01",
                "ext_registered_capital": "500万",
                "ext_registered_address": "",
                "ext_primary_business": "",
                "ext_public_class_commission_ratio": 15,
                "ext_org_demands_payment_mode": "公对公",
                "ext_copyright_status": 1,
                "ext_yard_status": 0,
                "ext_primary_trainer_status": 1,
                "ext_contact": "老方",
                "ext_contact_mobile": "13265717020",
                "ext_bank_account": "6222",
                "ext_bank_name": "招商银行",
                "ext_bank_branch": "上海支行",
                "ext_client_base": "宝钢集团",
                "ext_company_logo": "",
                "ext_classic_case": "成功案例",
                "auth_license_no": "91310000MA1FL7XX1K",
                "auth_legal": "方先生",
                "auth_license_pic": "attachments/license.png",
                "auth_ctime": 1450000000,
                "auth_isapprove": 1,
                "auth_reason": "",
            },
            "https://www.taoke.com",
        )

        self.assertEqual(row["id"], 30830)
        self.assertEqual(row["legacy_role_id"], 1234)
        self.assertEqual(row["org_name"], "上海复锐企业管理咨询有限公司")
        self.assertEqual(row["status"], 1)
        self.assertEqual(row["public_list_eligible"], 1)
        self.assertEqual(row["company_info_status"], 2)
        self.assertEqual(row["license_no"], "91310000MA1FL7XX1K")
        self.assertEqual(row["payment_methods"], '["公对公"]')
        self.assertEqual(row["open_course_count"], 39)

    def test_trainer_education_row_maps_approval_and_attachment(self):
        module = load_script("run_legacy_trainer_educations_migrate.py")

        row = module.build_education_row(
            {
                "edu_id": 1,
                "uid": 958922,
                "edu_startdate": "2002-09-29",
                "edu_enddate": "2004-07-15",
                "is_graduated": 1,
                "edu_caname": "冯昌银",
                "edu_school": "沈阳航空工业学院",
                "edu_major": "汽车技术与运输管理",
                "edu_caimg": "/attachments/member/vedu/2018/06/a.jpg",
                "status": 1,
                "edu_approvetime": 1530272571,
                "edu_approvememo": "",
                "createtime": "2018-06-29 07:48:15",
                "updatetime": "2018-06-29 11:42:51",
            },
            "https://www.taoke.com",
        )

        self.assertEqual(row["id"], 1)
        self.assertEqual(row["trainer_id"], 958922)
        self.assertEqual(row["school_name"], "沈阳航空工业学院")
        self.assertEqual(row["start_date"], date(2002, 9, 29))
        self.assertEqual(row["end_date"], date(2004, 7, 15))
        self.assertEqual(row["status"], 2)
        self.assertEqual(row["proof_file"], "https://www.taoke.com/attachments/member/vedu/2018/06/a.jpg")
        self.assertIsInstance(row["created_at"], datetime)


if __name__ == "__main__":
    unittest.main()
