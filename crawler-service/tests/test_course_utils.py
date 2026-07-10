from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from crawlers.course_utils import detect_content_type, infer_course_type, parse_price  # noqa: E402
from crawlers.course_utils import enrich_course_record  # noqa: E402
from crawlers.champconsult_course import parse_internal_detail_html as parse_champ_internal_detail  # noqa: E402
from crawlers.champconsult_course import parse_open_detail_html as parse_champ_open_detail  # noqa: E402
from crawlers.champconsult_course import parse_open_list_rows as parse_champ_open_rows  # noqa: E402
from crawlers.easyfinance_course import parse_internal_detail_html as parse_easyfinance_internal_detail  # noqa: E402
from crawlers.easyfinance_course import parse_live_list_rows as parse_easyfinance_live_rows  # noqa: E402
from crawlers.easyfinance_course import parse_live_record as parse_easyfinance_live_record  # noqa: E402
from crawlers.easyfinance_course import parse_open_detail_html as parse_easyfinance_open_detail  # noqa: E402
from crawlers.easyfinance_course import parse_open_list_rows as parse_easyfinance_open_rows  # noqa: E402
from crawlers.chinacpx_course import parse_internal_detail_html as parse_chinacpx_internal_detail  # noqa: E402
from crawlers.chinacpx_course import parse_internal_list_rows as parse_chinacpx_internal_rows  # noqa: E402
from crawlers.chinacpx_course import parse_online_entry as parse_chinacpx_online_entry  # noqa: E402
from crawlers.chinacpx_course import parse_open_detail_html as parse_chinacpx_open_detail  # noqa: E402
from crawlers.chinacpx_course import parse_open_list_rows as parse_chinacpx_open_rows  # noqa: E402
from crawlers.beiuec_course import parse_detail_html as parse_beiuec_detail  # noqa: E402
from crawlers.beiuec_course import parse_list_rows as parse_beiuec_rows  # noqa: E402
from crawlers.bosum_course import build_internal_record as build_bosum_internal_record  # noqa: E402
from crawlers.bosum_course import parse_online_entry as parse_bosum_online_entry  # noqa: E402
from crawlers.free863_course import parse_internal_detail_html as parse_free863_internal_detail  # noqa: E402
from crawlers.free863_course import parse_internal_list_rows as parse_free863_internal_rows  # noqa: E402
from crawlers.free863_course import parse_open_detail_html as parse_free863_open_detail  # noqa: E402
from crawlers.free863_course import parse_open_list_rows as parse_free863_open_rows  # noqa: E402
from crawlers.gaopei_course import parse_internal_detail_html as parse_gaopei_internal_detail  # noqa: E402
from crawlers.gaopei_course import parse_internal_list_rows as parse_gaopei_internal_rows  # noqa: E402
from crawlers.hztbc_course import parse_internal_detail_html as parse_hztbc_internal_detail  # noqa: E402
from crawlers.hztbc_course import parse_online_entry as parse_hztbc_online_entry  # noqa: E402
from crawlers.hztbc_course import parse_open_detail_html as parse_hztbc_open_detail  # noqa: E402
from crawlers.hztbc_course import parse_open_plan_rows as parse_hztbc_open_rows  # noqa: E402
from crawlers.hjcn_course import classify_probe_error as classify_hjcn_probe_error  # noqa: E402
from crawlers.hjcn_course import parse_site_status as parse_hjcn_site_status  # noqa: E402
from crawlers.huide_course import parse_dates as parse_huide_dates  # noqa: E402
from crawlers.huide_course import parse_detail_html as parse_huide_detail  # noqa: E402
from crawlers.huide_course import parse_open_table_items as parse_huide_table_items  # noqa: E402
from crawlers.huashijingji_course import parse_copyright_detail, parse_list as parse_huashi_list, parse_online_entry  # noqa: E402
from crawlers.jiangshibao_course import parse_internal_detail, parse_open_detail  # noqa: E402
from crawlers.jiangshitai_course import clean_teaches as clean_jiangshitai_teaches  # noqa: E402
from crawlers.jiangshitai_course import parse_course_detail_html as parse_jiangshitai_detail  # noqa: E402
from crawlers.jyqc_course import parse_site_status as parse_jyqc_site_status  # noqa: E402
from crawlers.keycourse_course import build_online_exclusion as build_keycourse_online_exclusion  # noqa: E402
from crawlers.keycourse_course import build_record_from_item as build_keycourse_record  # noqa: E402
from crawlers.learnbank_course import classify_probe_error as classify_learnbank_probe_error  # noqa: E402
from crawlers.learnbank_course import parse_site_status as parse_learnbank_site_status  # noqa: E402
from crawlers.lmschina_course import enrich_course_from_detail, map_course as map_lmschina_course  # noqa: E402
from crawlers.nlypx_course import extract_detail_sections as extract_nlypx_sections, parse_list  # noqa: E402
from crawlers.qiyingschool_course import parse_internal_detail_html as parse_qiying_internal_detail  # noqa: E402
from crawlers.qiyingschool_course import parse_open_detail_html as parse_qiying_open_detail  # noqa: E402
from crawlers.qiyingschool_course import parse_open_list_rows as parse_qiying_open_rows  # noqa: E402
from crawlers.qiyingschool_course import parse_video_entry as parse_qiying_video_entry  # noqa: E402
from crawlers.qianjinyuan_course import classify_probe_error as classify_qianjinyuan_probe_error  # noqa: E402
from crawlers.qianjinyuan_course import parse_site_status as parse_qianjinyuan_site_status  # noqa: E402
from crawlers.qgpx_course import parse_internal_detail_html as parse_qgpx_internal_detail  # noqa: E402
from crawlers.qgpx_course import parse_internal_list_rows as parse_qgpx_internal_rows  # noqa: E402
from crawlers.qgpx_course import parse_online_entry as parse_qgpx_online_entry  # noqa: E402
from crawlers.qgpx_course import parse_open_detail_html as parse_qgpx_open_detail  # noqa: E402
from crawlers.qgpx_course import parse_open_list_rows as parse_qgpx_open_rows  # noqa: E402
from crawlers.shchance_course import extract_list_rows as extract_shchance_rows  # noqa: E402
from crawlers.shchance_course import parse_course_detail_html as parse_shchance_detail  # noqa: E402
from crawlers.vmta_course import build_open_record as build_vmta_open_record  # noqa: E402
from crawlers.vmta_course import parse_online_entry as parse_vmta_online_entry  # noqa: E402
from crawlers.vmta_course import parse_open_list_rows as parse_vmta_open_rows  # noqa: E402
from crawlers.vmta_course import parse_study_tour_detail_html as parse_vmta_study_tour_detail  # noqa: E402
from crawlers.zpedu_course import parse_course_detail_html as parse_zpedu_detail  # noqa: E402
from crawlers.zqzhpx_course import classify_probe_error as classify_zqzhpx_probe_error  # noqa: E402
from crawlers.zqzhpx_course import parse_site_status as parse_zqzhpx_site_status  # noqa: E402


def test_parse_price_statuses():
    assert parse_price("3980元").status == "NUMERIC"
    assert parse_price("3980元").value == 3980
    assert parse_price("咨询价 3980 元").status == "NUMERIC"
    assert parse_price("免费").status == "FREE"
    assert parse_price("待商量").status == "NEGOTIABLE"
    assert parse_price("").status == "MISSING"


def test_infer_course_type_from_plans():
    online_type, online_evidence = infer_course_type(plans=[{"location": "在线课程"}])
    assert online_type == "OPEN_ONLINE"
    assert "online" in online_evidence

    offline_type, offline_evidence = infer_course_type(plans=[{"location": "上海"}])
    assert offline_type == "OPEN_OFFLINE"
    assert "schedule" in offline_evidence

    internal_type, internal_evidence = infer_course_type(text="企业内训定制方案")
    assert internal_type == "INTERNAL"
    assert "internal" in internal_evidence


def test_detect_non_course_content_type():
    assert detect_content_type("录播视频课，支持回放") == "RECORDED_VIDEO"
    assert detect_content_type("直播在线课程") == "LIVE"
    assert detect_content_type("企业内训课程") == "COURSE"


def test_nlypx_list_parse_keeps_category_and_price_raw():
    html = """
    <tr>
      <td><a href="/gkk_detail/123.html">营销增长实战</a></td>
      <td><a>在线课程</a></td>
      <td>2026-08-01</td>
      <td>张老师</td>
      <td>待商量</td>
      <td>2天</td>
      <td>100</td>
    </tr>
    """
    rows = parse_list(html, "营销管理", "OPEN_OFFLINE")
    assert len(rows) == 1
    row = rows[0]
    assert row["type"] == "OPEN_ONLINE"
    assert row["category_name_raw"] == "营销管理"
    assert row["raw_json"]["price_raw"] == "待商量"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"


def test_nlypx_list_city_plan_overrides_online_category_default():
    html = """
    <tr>
      <td><a href="/gkk_detail/124.html">质量管理体系标准理解</a></td>
      <td><a>杭州</a></td>
      <td>2026-07-13</td>
      <td>杨老师</td>
      <td>¥3000元/人</td>
      <td>2天</td>
      <td>80</td>
    </tr>
    """
    rows = parse_list(html, "线上课程", "OPEN_ONLINE")
    assert rows[0]["type"] == "OPEN_OFFLINE"
    assert rows[0]["plans_json"][0]["location"] == "杭州"


def test_nlypx_detail_sections_stop_before_syllabus_and_signup():
    text = """
    课程目标
    掌握客户开发技巧
    提升销售业绩
    课程大纲
    第一章 客户画像
    第二章 拜访流程
    授课讲师 张老师
    在线报名 联系人 手机号码
    """
    sections = extract_nlypx_sections(text, "")
    assert sections["learning_outcomes"] == "掌握客户开发技巧 提升销售业绩"
    assert "在线报名" not in sections["learning_outcomes"]
    assert sections["highlights"] == "暂无"


def test_nlypx_detail_sections_stop_before_teacher_and_attendees():
    text = """
    二、【课程目标】：
    1、提升业务人员市场分析能力
    2、提高客户经理实战技巧
    三、【师资介绍】
    李老师 资深培训讲师
    四、参会对象
    支行行长、客户经理
    """
    sections = extract_nlypx_sections(text, "")
    assert sections["learning_outcomes"] == "1、提升业务人员市场分析能力 2、提高客户经理实战技巧"
    assert "师资介绍" not in sections["learning_outcomes"]


def test_jiangshibao_internal_detail_maps_to_internal():
    html = """
    <h1>非人力资源管理</h1>
    <div class="teacher-name">张老师</div>
    <div class="course-info">面授课程 企业内训 人力资源 课程时长：2天</div>
    <div class="main-content">
      一、课程背景 帮助业务管理者理解人才管理。
      二、课程目标 掌握选用育留的方法。
      三、课程对象 企业中层管理者。
      四、课程特色 案例演练，工具落地。
      五、课程大纲 模块一 人才画像 模块二 绩效辅导
    </div>
    """
    row = parse_internal_detail(html, "https://www.jiangshi99.com/course/content/1.html")
    enrich_course_record(row, fallback_type=row["type"])
    assert row["type"] == "INTERNAL"
    assert row["price_raw"] == "培训咨询"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["audience"] == "企业中层管理者。"


def test_jiangshibao_open_detail_keeps_offline_plan():
    html = """
    <h1>战略绩效公开课</h1>
    <div class="course_intro">
      面授课程 公开课 企业经营 ￥ 6,800
      开课时间：2026-07-18 至 2026-07-19
      开课地点：浙江省 - 杭州 微信咨询 在线咨询
    </div>
    <div class="div_content">
      课程背景 帮助企业解决战略落地问题。
      培训对象 企业负责人、中高层管理者
      课程时长 2天
      核心目标 掌握战略解码方法。
      详细日程安排 第一天 战略共识 第二天 绩效落地
      主讲：曹扬老师
    </div>
    """
    row = parse_open_detail(
        html,
        "https://www.jiangshi99.com/open_course/content/1.html",
        {"price_raw": "¥ 6,800"},
    )
    enrich_course_record(row, fallback_type=row["type"])
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 6800
    assert row["plans_json"][0]["city"] == "杭州"
    assert row["trainer_name_raw"] == "曹扬老师"
    assert row["audience"] == "企业负责人、中高层管理者"


def test_jiangshibao_open_detail_skips_weak_audience_summary():
    html = """
    <h1>业务1号位</h1>
    <div class="course_intro">
      面授课程 公开课 企业经营 ￥ 12,800
      开课时间：2026-07-31 至 2026-08-01
      开课地点：广东省 - 广州 在线咨询
      培训对象：面授课程 公开课 企业经营
    </div>
    <div class="div_content">
      课程名称：《业务1号位》——AI时代的增长引擎
      怎么解决？2天1夜，四大模块，每个模块给一个拿回去就能用的工具。
      适合谁？所有对业务单元经营结果负责的人——事业部总经理、区域总、品牌总监、项目经理、电商负责人、工厂厂长、门店店长。
      谁已经在用？美的、安踏、京东等企业已持续采购。
    </div>
    """
    row = parse_open_detail(html, "https://www.jiangshi99.com/open_course/content/2.html")
    enrich_course_record(row, fallback_type=row["type"])
    assert row["type"] == "OPEN_OFFLINE"
    assert row["audience"].startswith("所有对业务单元经营结果负责的人")


def test_jiangshitai_teaches_filters_non_outcome_headings():
    teaches = clean_jiangshitai_teaches(
        [
            "掌握AI赋能的精准获客与拜访技巧",
            "【授课时间】",
            "课程大纲",
            "掌握AI辅助的异议处理与成交策略",
        ]
    )
    assert teaches == [
        "掌握AI赋能的精准获客与拜访技巧",
        "掌握AI辅助的异议处理与成交策略",
    ]


def test_jiangshitai_training_entry_stays_internal_and_cleans_audience():
    html = """
    <script type="application/ld+json">
    {
      "@type": "Course",
      "name": "高绩效团队领导力与管理技能提升（3天2夜）",
      "description": "现场研讨与管理演练。",
      "timeRequired": "3天2夜",
      "about": {"name": "团队管理"},
      "instructor": {"name": "刘老师"},
      "audience": {"audienceType": "中高层管理者、储备干部等 【培训课时】 3天2夜（视公司实际需求和现场情况）"},
      "teaches": ["掌握目标拆解和责任协同", "【授课时间】"]
    }
    </script>
    """
    row = parse_jiangshitai_detail("https://www.jiangshitai.com/training/team-management/", html)
    assert row["type"] == "INTERNAL"
    assert row["raw_json"]["type_evidence"] == "jiangshitai_training_entry_internal"
    assert row["audience"] == "中高层管理者、储备干部等"
    assert "授课时间" not in row["learning_outcomes"]


def test_huashijingji_list_maps_course_library_to_internal():
    html = """
    <a href="/index/course/details?id=31812" class="course-box">
      <img data-original="http://example.com/cover.jpg">
      <h5 class="title">逾期账款催收策略与合规清欠技巧</h5>
      <p class="text">课程收益：掌握逾期分类管理方法，提升催收效率。</p>
      <label>信贷风险</label>
      <p>授课对象：企业销售、客户经理、银行风控人员</p>
      <p>讲师：范文伟</p>
    </a>
    """
    rows = parse_huashi_list(html)
    assert len(rows) == 1
    row = rows[0]
    enrich_course_record(row, fallback_type=row["type"])
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "信贷风险"
    assert row["learning_outcomes"].startswith("课程收益")
    assert row["audience"] == "企业销售、客户经理、银行风控人员"
    assert row["trainer_name_raw"] == "范文伟"


def test_huashijingji_copyright_maps_to_internal_consulting_product():
    html = """
    <html>
      <head><title>赢战山河</title><meta name="description" content="大客户营销全景策略地图"></head>
      <body>
        <h1>赢战山河</h1>
        <img src="/assets/images/new-winning/banner.jpg">
        <section>课程特色 方法论成熟，可用于企业内训落地。课程体系 大客户经营、客户关系、策略地图。</section>
      </body>
    </html>
    """
    row = parse_copyright_detail(html, "https://www.huashijingji.com/index/project/winning")
    enrich_course_record(row, fallback_type=row["type"])
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "版权课程"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"


def test_huashijingji_online_entry_is_identified_but_not_course_record():
    html = "<html><head><title>电子课件</title></head><body>线上课程 电子课件 API 内容资源</body></html>"
    info = parse_online_entry(html, "https://www.huashijingji.com/index/online/dzkj")
    assert info["reason"] == "online_or_courseware_entry_not_imported_to_courses"
    assert "电子课件" in info["title"]


def test_zpedu_open_detail_with_city_schedule_is_offline():
    html = """
    <h1 class="art-tit">PMP项目管理认证培训</h1>
    <div class="blk pos">首页 &gt; 公开课 &gt; 项目管理</div>
    <div class="detail">
      培训费用：3980元
      开课安排：2026年8月15日 北京
      培训对象：项目经理、项目骨干。
      培训收益：掌握项目管理体系。
      培训大纲：项目启动、计划、执行、监控。
    </div>
    """
    row = parse_zpedu_detail({"url": "https://www.zpedu.com/nx/100.html", "source_entry": "open"}, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["category_name_raw"] == "项目管理"
    assert row["price"] == 3980
    assert row["plans_json"][0]["location"] == "北京"
    assert row["city_name_raw"] == "北京"
    assert "2026年8月15日" in row["schedule"]
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"


def test_zpedu_open_detail_with_live_schedule_is_online():
    html = """
    <h1 class="art-tit">软考高级线上直播班</h1>
    <div class="blk pos">首页 &gt; 公开课 &gt; 软考认证</div>
    <div class="detail">
      培训费用：咨询
      开课安排：2026年9月12日 直播
      培训对象：IT项目经理。
      课程收益：掌握软考高级核心知识。
    </div>
    """
    row = parse_zpedu_detail({"url": "https://www.zpedu.com/nx/101.html", "source_entry": "open"}, html)
    assert row["type"] == "OPEN_ONLINE"
    assert row["category_name_raw"] == "软考认证"
    assert row["city_name_raw"] is None
    assert "直播" in row["schedule"]
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"


def test_zpedu_internal_seed_stays_internal_even_with_online_text():
    html = """
    <h1 class="art-tit">企业数字化转型内训</h1>
    <div class="blk pos">首页 &gt; 企业内训 &gt; 数字化转型</div>
    <div class="detail">
      可根据企业需求安排线上或线下交付。
      培训费用：面议
      培训对象：企业中高层管理者。
      培训收益：形成数字化转型行动方案。
    </div>
    """
    row = parse_zpedu_detail({"url": "https://www.zpedu.com/nx/102.html", "source_entry": "internal"}, html)
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "数字化转型"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"


def test_lmschina_class_with_offline_schedule_is_open_offline():
    row = map_lmschina_course(
        {
            "id": "A1",
            "activity_name": "项目管理公开课",
            "activity_type": "CLASS",
            "train_time_range": "2026-08-01 上海",
            "city_name": "上海",
            "enroll_fee": 3980,
            "catalogs": [{"name": "项目管理"}],
            "teachers": [{"teacher_name": "李老师"}],
        }
    )
    assert row["type"] == "OPEN_OFFLINE"
    assert row["plans_json"][0]["location"] == "上海"
    assert row["category_name_raw"] == "项目管理"
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"


def test_lmschina_courseware_resource_is_online_course():
    row = map_lmschina_course(
        {
            "id": "A2",
            "activity_name": "领导力线上课程",
            "activity_type": "COURSE",
            "has_courseware": True,
            "course_count": 3,
            "enroll_fee": 0,
            "catalogs": [{"name": "领导力"}],
        }
    )
    assert row["type"] == "OPEN_ONLINE"
    assert row["raw_json"]["content_type"] in {"COURSE", "LIVE"}
    assert row["raw_json"]["type_evidence"] == "courseware_or_course_resource"


def test_lmschina_video_resource_is_marked_non_course():
    row = map_lmschina_course(
        {
            "id": "A3",
            "activity_name": "销售技巧录播视频课",
            "activity_type": "COURSE",
            "activity_subtype": "VIDEO",
            "has_courseware": True,
            "enroll_fee": 99,
            "catalogs": [{"name": "市场营销"}],
        }
    )
    assert row["raw_json"]["content_type"] == "RECORDED_VIDEO"


def test_lmschina_detail_enriches_fields_and_detects_image_detail():
    row = map_lmschina_course(
        {
            "id": "A4",
            "activity_name": "企业内训方案",
            "activity_type": "CLASS",
            "enroll_fee": 0,
            "catalogs": [{"name": "经营策略"}],
        }
    )
    enrich_course_from_detail(
        row,
        {
            "summary": "",
            "target_users": "企业中高层管理者",
            "objective": "形成经营策略落地方案",
            "catalogs": [{"name": "经营策略"}],
            "summary_media_texts": [{"type": "img", "value": "https://example.com/detail.png"}],
        },
    )
    assert row["audience"] == "企业中高层管理者"
    assert row["learning_outcomes"] == "形成经营策略落地方案"
    assert row["services_json"][0]["type"] == "summary_image"


def test_shchance_list_row_keeps_offline_plan_fields():
    html = """
    <tbody>
      <tr>
        <td><a href="/home/coursedetail/2553">工业智能体全景实战</a></td>
        <td>2026年07月03日-07月10日</td>
        <td>上海</td>
        <td>￥ 5200</td>
        <td><a href="/home/appointment?courseid=2553">预约报名</a></td>
      </tr>
    </tbody>
    """
    rows = extract_shchance_rows(html, "AI、数字化及智能制造")
    assert rows[0]["source_course_id"] == "2553"
    assert rows[0]["category_name_raw"] == "AI、数字化及智能制造"
    assert rows[0]["date_text"] == "2026年07月03日-07月10日"
    assert rows[0]["city"] == "上海"
    assert rows[0]["price_raw"] == "￥ 5200"


def test_shchance_detail_outputs_reviewable_offline_course():
    item = {
        "url": "http://www.shchance.com.cn/home/coursedetail/2553",
        "source_course_id": "2553",
        "title": "工业智能体全景实战",
        "date_text": "2026年07月03日-07月10日",
        "city": "上海",
        "price_raw": "￥ 5200",
        "signup_url": "http://www.shchance.com.cn/home/appointment?courseid=2553",
        "category_name_raw": "AI、数字化及智能制造",
    }
    html = """
    <div class="weizhi">当前位置：<a href="/">首页</a> &gt; <a href="/home/course">线下公开课</a></div>
    <h1 class="biaoti1">工业智能体全景实战</h1>
    <div class="indexgkk2">
      <div class="neirong1">
        <table><thead><tr><th>城市</th><th>天数</th><th>价格</th><th>7月</th></tr></thead>
        <tbody><tr><td>上海</td><td>2</td><td>5200</td><td>3、10</td></tr></tbody></table>
      </div>
      <a href="/files/demo.pdf">下载完整课程大纲</a>
    </div>
    <div class="clear"></div>
    <div class="neirong1">
      课程目标：<br />学习AI智能体设计和开发流程<br />
      参训对象：<br />工业场景AI智能体开发需求的工程师<br />
      授课形式：<br />案例分析讨论、互动交流<br />
    </div>
    </div>
    """
    row = parse_shchance_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["category_name_raw"] == "AI、数字化及智能制造"
    assert row["price"] == 5200
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["learning_outcomes"] == "学习AI智能体设计和开发流程"
    assert row["audience"] == "工业场景AI智能体开发需求的工程师"
    assert row["plans_json"][0]["startDate"] == "2026-07-03"
    assert row["plans_json"][0]["start_date"] == "2026-07-03"
    assert row["plans_json"][0]["city"] == "上海"
    assert row["plans_json"][0]["address"] == "上海"
    assert row["plans_json"][0]["signupUrl"].endswith("courseid=2553")
    assert row["services_json"][0]["type"] == "syllabus_pdf"
    assert row["raw_json"]["type_evidence"] == "shchance_offline_public_course_list_has_date_city_price"


def test_qiyingschool_open_list_rows_keep_schedule_city_price():
    html = """
    <table>
      <tr>
        <td><p class="txts"><a href='https://www.qiyingschool.com/gongkaike/373928.html'>《卓越领导力--高绩效团队建设》</a></p></td>
        <td><a href='/gongkaike/tuanduiguanli/'>团队管理</a></td>
        <td>2026-07-23至2026-07-24</td>
        <td>济南</td>
        <td><a href='https://www.qiyingschool.com/teacher/17092.html'>讲师团</a></td>
        <td>3800元</td>
      </tr>
    </table>
    """
    rows = parse_qiying_open_rows(html)
    assert rows[0]["source_course_id"] == "373928"
    assert rows[0]["category_name_raw"] == "团队管理"
    assert rows[0]["date_text"] == "2026-07-23至2026-07-24"
    assert rows[0]["city"] == "济南"
    assert rows[0]["trainer_name_raw"] == "讲师团"
    assert rows[0]["price_raw"] == "3800元"


def test_qiyingschool_open_detail_outputs_offline_plan_and_fields():
    item = {
        "url": "https://www.qiyingschool.com/gongkaike/373928.html",
        "source_course_id": "373928",
        "title": "《卓越领导力--高绩效团队建设》",
        "category_name_raw": "团队管理",
        "date_text": "2026-07-23至2026-07-24",
        "city": "济南",
        "trainer_name_raw": "讲师团",
        "price_raw": "3800元",
    }
    html = """
    <div class="location clear">当前位置：首页 > 公开课 > 团队管理 > 《卓越领导力--高绩效团队建设》</div>
    <div class="title_bg"><h1>《卓越领导力--高绩效团队建设》</h1></div>
    <div class="courses_dt clear">
      济南 2026-07-23至2026-07-24 3800元 讲师团 详情了解
      《卓越领导力--高绩效团队建设》课程简介
      【适合人员】中高层管理者、部门负责人、项目负责人、后备管理干部等
      【培训费用】3800元/人
      课程背景 帮助管理者升级团队管理认知。
      课程收获
      1. 掌握高绩效团队画像与诊断方法。
      2. 学会目标拆解与责任分工。
      授课方式 理论讲授＋案例研讨。
      课程大纲
      第一部分：卓越领导力认知与角色转型
    </div>
    """
    row = parse_qiying_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 3800
    assert row["category_name_raw"] == "团队管理"
    assert row["plans_json"][0]["startDate"] == "2026-07-23"
    assert row["plans_json"][0]["city"] == "济南"
    assert row["plans_json"][0]["address"] == "济南"
    assert row["audience"].startswith("中高层管理者")
    assert "掌握高绩效团队画像" in row["learning_outcomes"]
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"


def test_qiyingschool_internal_detail_outputs_internal_and_duration():
    item = {
        "url": "https://www.qiyingschool.com/neixunke/419756.html",
        "source_course_id": "419756",
        "title": "AIGC工具赋能办公训练营",
        "cover_url": "https://www.qiyingschool.com/Uploads/nxk/202410/1729220560.jpg",
    }
    html = """
    <div class="location clear">当前位置：首页 > 内训课 > 职业技能 > AIGC工具赋能办公训练营</div>
    <div class="title_bg"><h1>AIGC工具赋能办公训练营</h1></div>
    <div>AIGC工具赋能办公训练营授课老师 <a href="https://www.qiyingschool.com/teacher/22189.html">孔令涛</a></div>
    <div class="courses_dt clear">
      课程简介
      【课程背景】在数字化时代，人工智能已经成为提升工作效率的关键力量。
      【课程收益】
      AI技术全面认识：了解人工智能基本概念与主流工具。
      技能提升：掌握高效写作、PPT制作和数据分析技巧。
      【课程特色】课程内容为时下流行AI工具。
      【课程对象】职场人士、非技术人员
      【课程时间】2天（6小时/天）
      【课程大纲】一、认识人工智能（AI）
    </div>
    """
    row = parse_qiying_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "职业技能"
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["trainer_name_raw"] == "孔令涛"
    assert row["audience"] == "职场人士、非技术人员"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []


def test_qiyingschool_video_entry_is_not_courses_flow():
    html = """
    <div class="location clear">当前位置：首页 > 线上网课 > DeepSeek赋能高效办公</div>
    <div class="title_bg"><h1>DeepSeek赋能高效办公，开启高效工作新时代</h1></div>
    <div class="courses_dt clear">
      课程价格：399.00 元 共8集 课程讲师：张伟崇 购买咨询 选集
      课程简介 课程介绍：帮助学员掌握AI工具。
    </div>
    """
    info = parse_qiying_video_entry(html, "https://www.qiyingschool.com/video/43957-1.html")
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "recorded_video_entry_not_imported_to_courses"


def test_champconsult_open_list_rows_keep_schedule_city_price():
    html = """
    <table>
      <tr>
        <td><img src="images/min5.gif" /></td>
        <td><a href="curriculum_detail.aspx?one=2&two=64&three=104&id=1271">大客户开发与维护策略技巧</a></td>
        <td>2</td>
        <td>4980元</td>
        <td>北京</td>
        <td>2026-7-9</td>
      </tr>
    </table>
    """
    rows = parse_champ_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "1271"
    assert row["title"] == "大客户开发与维护策略技巧"
    assert row["category_name_raw"] == "通用管理系列"
    assert row["duration_days"] == "2"
    assert row["price_raw"] == "4980元"
    assert row["city"] == "北京"
    assert row["date_text"] == "2026-7-9"


def test_champconsult_open_detail_outputs_offline_plan():
    item = {
        "url": "http://www.champconsult.com/curriculum_detail.aspx?one=2&two=64&three=104&id=1271",
        "source_course_id": "1271",
        "title": "大客户开发与维护策略技巧",
        "category_name_raw": "通用管理系列",
        "duration_days": "2",
        "price_raw": "4980元",
        "city": "北京",
        "date_text": "2026-7-9",
    }
    html = """
    <div class="incrltm">当前位置： 首页 > 公开课程 > 课程体系 > 通用管理系列 > 课程详细</div>
    <div class="incrlcont">
      <h1>大客户开发与维护策略技巧</h1>
      参加对象： 董事长、总裁、总经理、大客户总监、销售经理
      课时： 2 天
      价格： 4980元
      课程简介 课程纲要 讲师简介 客户评价
      【课程背景】B2B企业的大客户销售团队需要系统的客户关系开发管理。
      【课程收益】掌握市场竞争分析矩阵；掌握客户关系升级方法。
      【课程特色】案例研讨、工具演练。
      课程纲要 第一部分 客户开发与竞争分析
    </div>
    """
    row = parse_champ_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 4980
    assert row["category_name_raw"] == "通用管理系列"
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["plans_json"][0]["startDate"] == "2026-07-09"
    assert row["plans_json"][0]["endDate"] == "2026-07-10"
    assert row["plans_json"][0]["city"] == "北京"
    assert row["audience"].startswith("董事长")
    assert "市场竞争分析矩阵" in row["learning_outcomes"]
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"


def test_champconsult_internal_solution_outputs_internal():
    item = {
        "url": "http://www.champconsult.com/consult_factory_con.aspx?one=4&two=17",
        "source_course_id": "consult_factory_con_17",
        "title": "TWI班组长胜任力提升",
        "category_name_raw": "企业内训/咨询方案",
    }
    html = """
    <div class="incrltm">当前位置： 首页 > 工厂运营管理咨询 > TWI班组长胜任力提升</div>
    <div class="incrlcont">
      <div class="incrlmadecontent">
        咨询热线：400-090-5388
        TWI班组长胜任力提升--冠卓独家、版权所有
        针对现状：基层管理是企业所有管理的基础。
        咨询内容：建立班组长完整的胜任力模型；培养班组长管理胜任力。
        项目收益：建立符合公司实际需要的班组长胜任力模型；培养内部导师。
        部分客户：
      </div>
    </div>
    """
    row = parse_champ_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "工厂运营管理咨询"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert "胜任力模型" in row["learning_outcomes"]
    assert "培养班组长" in row["syllabus"]


def test_free863_open_list_rows_keep_multiple_offline_plans():
    html = """
    <table>
      <tr>
        <td><a href="class.php?id=63744" class="mc">中层经理通用管理技能训练（MTP）</a></td>
        <td>2</td>
        <td>4600</td>
        <td>田胜波</td>
        <td>15-16<br>上海<br></td>
        <td></td><td></td><td></td>
        <td>22-23<br>北京<br></td>
        <td></td>
        <td>09-10<br>上海<br>29-30<br>青岛<br></td>
        <td></td><td></td><td></td><td></td><td></td>
      </tr>
    </table>
    """
    rows = parse_free863_open_rows(html, course_type="OPEN_OFFLINE")
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "63744"
    assert row["title"] == "中层经理通用管理技能训练（MTP）"
    assert row["duration_days"] == "2"
    assert row["price_raw"] == "4600"
    assert row["trainer_name_raw"] == "田胜波"
    assert len(row["plans_json"]) == 4
    assert row["plans_json"][0]["startDate"] == "2026-01-15"
    assert row["plans_json"][0]["endDate"] == "2026-01-16"
    assert row["plans_json"][1]["city"] == "北京"
    assert row["plans_json"][3]["city"] == "青岛"


def test_free863_open_list_rows_keep_online_live_plans_only():
    html = """
    <table>
      <tr>
        <td><a href="class.php?id=70001" class="mc">ITSS-IT服务工程师认证（线上）</a></td>
        <td>2</td>
        <td>3400元培训费 1400元考试费</td>
        <td>陈老师等</td>
        <td>17-18<br>直播<br></td>
        <td>25-26<br>直播<br></td>
        <td>20-21<br>上海<br></td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    </table>
    """
    rows = parse_free863_open_rows(html, course_type="OPEN_ONLINE", category_hint="线上课程")
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "70001_online"
    assert row["type"] == "OPEN_ONLINE"
    assert row["category_name_raw"] == "线上课程"
    assert len(row["plans_json"]) == 2
    assert row["plans_json"][0]["onlineUrl"].endswith("id=70001")
    assert all(plan["type"] == "ONLINE" for plan in row["plans_json"])


def test_free863_internal_list_rows_keep_training_fields():
    html = """
    <table>
      <tr>
        <td><a href="class.php?id=62302" class="mc">创新方程式——5大工具引爆快速创新</a></td>
        <td>通用管理类、研发创新类</td>
        <td>中层管理技能</td>
        <td>鄢老师</td>
        <td>1</td>
        <td>课程收益：掌握创新工具和方法。</td>
        <td>可按企业需求定制。</td>
      </tr>
    </table>
    """
    rows = parse_free863_internal_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "62302"
    assert row["type"] == "INTERNAL"
    assert row["category_name_raw"] == "通用管理类"
    assert row["trainer_name_raw"] == "鄢老师"
    assert row["duration_days"] == "1"
    assert "创新工具" in row["learning_outcomes_hint"]


def test_free863_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.free863.com/class.php?id=63744",
        "source_course_id": "63744",
        "title": "中层经理通用管理技能训练（MTP）",
        "category_name_raw": "通用管理类",
        "duration_days": "2",
        "price_raw": "4600",
        "trainer_name_raw": "田胜波",
        "type": "OPEN_OFFLINE",
        "plans_json": [
            {
                "startDate": "2026-01-15",
                "start_date": "2026-01-15",
                "endDate": "2026-01-16",
                "end_date": "2026-01-16",
                "city": "上海",
                "location": "上海",
                "address": "上海",
            }
        ],
    }
    html = """
    <html><head><meta name="description" content="中层经理通用管理公开课"></head><body>
      中层经理通用管理技能训练（MTP）
      开课时间： 2026 课程时长： 12 授课讲师： 田胜波 课程价格： ￥4600 天数： 2
      开课地点： 上海 专业分类： 通用管理类、管理沟通 行业分类： 岗位分类： 关键字： 中层经理,通用管理 内训说明：
      背景与目标 课程背景：帮助中层管理者完成角色转换。
      课程目标：深刻理解管理者的角色特征；训练通用管理技能。
      适合人员概述 企业各个部门经理、中基层主管。
      主要内容 课程大纲： 第一部分 认识管理、角色定位、能力构建
    </body></html>
    """
    row = parse_free863_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 4600
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["plans_json"][0]["city"] == "上海"
    assert row["audience"].startswith("企业各个部门经理")
    assert "角色特征" in row["learning_outcomes"]
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"


def test_free863_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "https://www.free863.com/class.php?id=62302",
        "source_course_id": "62302",
        "title": "创新方程式——5大工具引爆快速创新",
        "category_name_raw": "通用管理类",
        "duration_days": "1",
        "trainer_name_raw": "鄢老师",
        "learning_outcomes_hint": "课程收益：掌握创新工具和方法。",
        "type": "INTERNAL",
    }
    html = """
    <html><body>
      创新方程式——5大工具引爆快速创新
      开课时间： 2025 课程时长： 6 授课讲师： 鄢老师 课程价格： ￥3200 天数： 1
      专业分类： 通用管理类、研发创新类 行业分类： 岗位分类： 关键字： 创新方程式 内训说明：
      背景与目标 课程设计：国际经典创新方法论。
      课程收益：帮助学员掌握创新工具和方法，并掌握创新落地流程。
      适合人员概述 希望了解创新、掌握创新的职场人士
      主要内容 课程大纲： 第一部分 破冰热身 第二部分 初探创新
    </body></html>
    """
    row = parse_free863_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["trainer_name_raw"] == "鄢老师"
    assert "创新工具" in row["learning_outcomes"]


def test_chinacpx_open_list_rows_keep_city_date_price():
    html = """
    <ul>
      <li>
        <a href="/opencourse/2025265583.shtm">
          <img src="/x.jpg" alt="">
          <p>行政工作统筹管理</p>
          <p>上海 2026年07月14日-15日</p>
          <p class="last"><span>￥4800</span><span>查看详情</span></p>
        </a>
      </li>
    </ul>
    """
    rows = parse_chinacpx_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "2025265583"
    assert row["title"] == "行政工作统筹管理"
    assert row["price_raw"] == "4800"
    assert row["plans_json"][0]["startDate"] == "2026-07-14"
    assert row["plans_json"][0]["endDate"] == "2026-07-15"
    assert row["plans_json"][0]["city"] == "上海"


def test_chinacpx_internal_list_rows_keep_teacher_days_category():
    html = """
    <ul>
      <li>
        <a href="/inhousecourse/202330106.shtm">
          创新领导力与突破性思维
          内训编号：<span>NX43774</span>主讲老师：<span>肖凤德</span>培训天数：<span>2天</span>课程类别：<span>领导力</span>
          <div class="font2"><span>课程内容：</span><p>课程大纲 第一讲 创新与现代企业管理</p></div>
        </a>
      </li>
    </ul>
    """
    rows = parse_chinacpx_internal_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "202330106"
    assert row["title"] == "创新领导力与突破性思维"
    assert row["trainer_name_raw"] == "肖凤德"
    assert row["duration_days"] == "2天"
    assert row["category_name_raw"] == "领导力"


def test_chinacpx_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.chinacpx.com/opencourse/2025265583.shtm",
        "source_course_id": "2025265583",
        "title": "行政工作统筹管理",
        "price_raw": "4800",
        "date_text": "2026年07月14日-15日",
        "plans_json": [
            {
                "startDate": "2026-07-14",
                "start_date": "2026-07-14",
                "endDate": "2026-07-15",
                "end_date": "2026-07-15",
                "city": "上海",
                "location": "上海",
                "address": "上海",
            }
        ],
    }
    html = """
    <html><head><meta name="description" content="行政工作统筹管理公开课"></head><body>
      您的位置：首页 &gt; 公开课 &gt; 综合管理 &gt; 行政工作统筹管理
      课程编号：265583 时间：2026年07月14日-15日 讲师：博文 地点：上海 学习费用： 4800 元 /位
      培训对象：行政后勤综合管理相关人员。
      课程收益：费用说明 培训目标：提升行政统筹新能力。
      课程背景：企业行政管理工作是企业运营创造价值不可或缺的保障支持。
      课程大纲：第一讲 行政管理新理念
    </body></html>
    """
    row = parse_chinacpx_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 4800
    assert row["duration_days"] == 2
    assert row["trainer_name_raw"] == "博文"
    assert row["plans_json"][0]["city"] == "上海"
    assert row["audience"].startswith("行政后勤")


def test_chinacpx_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "https://www.chinacpx.com/inhousecourse/202330106.shtm",
        "source_course_id": "202330106",
        "title": "创新领导力与突破性思维",
        "category_name_raw": "领导力",
        "trainer_name_raw": "肖凤德",
        "duration_days": "2天",
        "type": "INTERNAL",
    }
    html = """
    <html><body>
      您的位置：首页 &gt; 企业内训 &gt; 领导力 &gt; 创新领导力与突破性思维
      课程编号：NX43774 课程类型：企业内训课 培训天数：2天 授课老师：肖凤德 培训预算：按照方案进行定价
      课程收益/背景：课程背景：经理人通过该课程的学习，将掌握获得并运用创新力的方法。
      培训对象：相关人员等。
      课程简介：一、创新与现代企业管理与发展
    </body></html>
    """
    row = parse_chinacpx_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["duration_days"] == 2
    assert "创新力" in row["learning_outcomes"]


def test_chinacpx_online_entry_is_not_courses_flow():
    html = """
    <html><head><title>打造有战斗力的管理团队-在线课程</title></head><body>
      打造有战斗力的管理团队 主讲老师：韩鹏 课程价格:99.9元 课程背景：在线网课内容
    </body></html>
    """
    info = parse_chinacpx_online_entry(html, "https://www.chinacpx.com/onlinecourse/202319.shtm")
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "online_course_entry_not_imported_to_courses"


def test_qgpx_open_list_rows_keep_schedule_location_price():
    html = """
    <div class="course-syllabus-title underline"><a href="https://www.qgpx.com/courses/guanli/">管理技能公开课</a></div>
    <table>
      <tr class="table-row">
        <td class="left"><a href="/2025/guanli_1031/12387.html"><span>MTP中层管理才能训练计划</span></a></td>
        <td nowrap=""><span>2025-11-28</span></td>
        <td nowrap=""><a href=/2>江苏省</a>><a href=/2>苏州市</a></td>
        <td nowrap=""><span>3980.00</span></td>
      </tr>
    </table>
    """
    rows = parse_qgpx_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "12387"
    assert row["title"] == "MTP中层管理才能训练计划"
    assert row["category_name_raw"] == "管理技能"
    assert row["date_text"] == "2025-11-28"
    assert row["location_text"] == "江苏省 > 苏州市"
    assert row["price_raw"] == "3980.00"


def test_qgpx_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.qgpx.com/2025/guanli_1031/12387.html",
        "source_course_id": "12387",
        "title": "MTP中层管理才能训练计划",
        "category_name_raw": "管理技能",
        "date_text": "2025-11-28",
        "location_text": "江苏省 > 苏州市",
        "price_raw": "3980.00",
        "type": "OPEN_OFFLINE",
    }
    html = """
    <html><head><meta name="description" content="中华企业培训网"><meta name="keywords" content="MTP,中层管理"></head><body>
      <ol class="breadcrumb"><li>中华企管培训网</li><li>公开课</li><li>管理技能</li><li>MTP中层管理才能训练计划</li></ol>
      <h1 class="event-detail-title">MTP中层管理才能训练计划</h1>
      <span class="label-time">主讲老师</span><span>许老师</span>
      <span class="label-time">参加费用</span><span>3980元</span>
      <span class="label-time">课时安排</span><span>2天</span>
      <div class="article">
        <p>【课程背景】</p><p>帮助中层管理者提升管理效能。</p>
        <p>【课程对象】</p><p>企业中高层干部、新任经理、储备主管。</p>
        <p>【课程收益】</p><p>掌握目标、计划、组织、控制、协调等基本管理技能。</p>
        <p>【课程风格】</p><p>案例研讨、工具演练。</p>
        <p>【课程大纲】</p><p>第一模块：自我管理篇。第二模块：工作管理篇。</p>
      </div>
    </body></html>
    """
    row = parse_qgpx_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 3980
    assert row["category_name_raw"] == "管理技能"
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["trainer_name_raw"] == "许老师"
    assert row["plans_json"][0]["city"] == "苏州市"
    assert row["plans_json"][0]["province_name_raw"] == "江苏省"
    assert row["audience"].startswith("企业中高层干部")
    assert "基本管理技能" in row["learning_outcomes"]


def test_qgpx_internal_list_rows_keep_course_links_only():
    html = """
    <a href="https://www.qgpx.com/2026/qudaoyingxiao_0608/24960.html">《数字化渠道管理与产品动销》</a>
    <a href="https://www.qgpx.com/annce/20210422_show95c28666p1.html">陈凯课程圆满结束</a>
    <a href="https://www.qgpx.com/neixun/weiyingxiao/showd20210603c547c16906p1.html">《流量池思维：黑客模型AARRR解析》</a>
    """
    rows = parse_qgpx_internal_rows(html)
    assert len(rows) == 2
    assert rows[0]["type"] == "INTERNAL"
    assert rows[0]["title"] == "数字化渠道管理与产品动销"


def test_qgpx_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "https://www.qgpx.com/neixun/weiyingxiao/showd20210603c547c16906p1.html",
        "source_course_id": "16906",
        "title": "流量池思维：黑客模型AARRR解析",
        "type": "INTERNAL",
    }
    html = """
    <html><head><meta name="description" content="微营销内训课程"><meta name="keywords" content="流量池,微营销"></head><body>
      <ol class="breadcrumb"><li>中华企管培训网</li><li>企业内训</li><li>市场营销</li><li>微营销</li><li>流量池思维</li></ol>
      <h1>《流量池思维：黑客模型AARRR解析》</h1>
      内训讲师： 李勇 需要此内训课程请联系中华企管培训网 微营销
      内训时长 ：1天
      内训课程大纲
      讲授专家： 李勇
      培训对象：互联网时代，希望学习直播营销技巧的人士；企业内从事营销与服务工作的相关人士。
      课程时间：1天（6小时）
      课程背景：帮助企业理解流量池思维。
      课程收益：了解互联网+时代下直播建立流量池的思路和方法；掌握AARRR黑客增长模型。
      课程大纲：单元一 流量之困。单元二 品牌是最稳定的流量池。
    </body></html>
    """
    row = parse_qgpx_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["duration_days"] == 1
    assert row["total_hours"] == 6
    assert row["trainer_name_raw"] == "李勇"
    assert row["category_name_raw"] == "微营销"
    assert "AARRR" in row["learning_outcomes"]


def test_qgpx_online_entry_is_not_courses_flow():
    html = "<html><head><title>音视频课-销售技巧</title></head><body>音视频课 在线学习 视频课程</body></html>"
    info = parse_qgpx_online_entry(html, "https://www.qgpx.com/online/123.html")
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "online_audio_video_entry_not_imported_to_courses"


def test_gaopei_internal_list_rows_keep_training_fields():
    html = """
    <a href="/gaopei/nxkcxt/yxyyjts_1898_127.html">
      《谈判“胜”经》--双赢商务谈判 培训天数2天 营销与业绩提升 主讲老师：刘老师
    </a>
    <a href="/gaopei/szxt/zjzn_1747_70.html">查看详细</a>
    """
    rows = parse_gaopei_internal_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "127"
    assert row["title"] == "谈判“胜”经》--双赢商务谈判"
    assert row["category_name_raw"] == "营销与业绩提升"
    assert row["duration_days"] == "2天"
    assert row["trainer_name_raw"] == "刘老师"
    assert row["type"] == "INTERNAL"


def test_gaopei_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "http://www.gaopei.org/gaopei/nxkcxt/yxyyjts_1898_127.html",
        "source_course_id": "127",
        "title": "谈判“胜”经--双赢商务谈判",
        "category_name_raw": "营销与业绩提升",
        "duration_days": "2天",
        "trainer_name_raw": "刘老师",
        "type": "INTERNAL",
    }
    html = """
    <html><head><meta name="description" content="商务谈判策略课程"><meta name="keywords" content="谈判,销售"></head><body>
      <p>当前位置：<a>高培商院</a> >> <a>企业内训</a> >> <a>营销与业绩提升</a> >> 浏览文章</p>
      <div class="nxtitle_bg"><h1>《谈判“胜”经》--双赢商务谈判策略</h1></div>
      <div class="neixuninfo_img"><img src="/UploadFiles/2024-05-21/x.jpg" alt="课程封面"></div>
      <div class="course_show"><h3><b>刘老师</b>销售技能提升专家</h3><p>销售技能提升专家。</p></div>
      <h2>课程简介：</h2>
      <div id="MyContent">
        <p><strong>课程背景：</strong></p><p>在全球化协作深化、商业竞争与共生并存的当下，商务谈判已成为核心能力。</p>
        <p><strong>课程核心亮点：</strong></p><p>独创利益挖掘-价值创造-风险管控谈判三角模型。</p>
        <p><strong>课程对象：</strong></p><p>销售经理、商务负责人、渠道管理人员。</p>
      </div>
      <h3>课程大纲</h3>
      <p>1.商务谈判的六大要素、三大核心、五大局势</p>
      <p>2.谈判前的情报收集</p>
    </body></html>
    """
    row = parse_gaopei_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["trainer_name_raw"] == "刘老师"
    assert row["category_name_raw"] == "营销与业绩提升"
    assert "价值创造" in row["learning_outcomes"]
    assert "商务谈判的六大要素" in row["syllabus"]
    assert any("OPEN_OFFLINE 未导入" in note for note in row["raw_json"]["coverage_notes"])


def test_vmta_open_list_rows_keep_schedule_location_price():
    html = """
    <div class="li1"><a href="/xk/pxckx1/773.html" target="_blank" class="m-none"></a>
      <div class="h2"><a href="/xk/pxckx1/773.html"><strong class="ai_jia">HR战略领航——人力资源主管进阶转型实战营</strong></a></div>
      <div class="span"><span>开课时间</span><em></em></div>
      <div class="span"><span>开课区域</span><em>健峰培训城</em></div>
      <div class="span"><span>天 数</span><em>3 天</em></div>
      <div class="span"><span>价 格</span><em>¥ 5800</em></div>
      <div class="tt2">课程预览</div><div class="p">三天密集实战，直击八大核心痛点。</div>
      <div class="tt2">参加对象</div><div class="p">HR主管、HRBP。</div>
      <table><tbody>
        <tr><td>开课时间</td><td>地点</td><td>价格</td></tr>
        <tr><td>2026-07-27 至 2026-07-29</td><td>健峰培训城</td><td>5800</td></tr>
      </tbody></table>
    </div><div class="pages"></div>
    """
    rows = parse_vmta_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "773"
    assert row["title"] == "HR战略领航——人力资源主管进阶转型实战营"
    assert row["price_raw"] == "¥ 5800"
    assert row["duration_days"] == "3 天"
    assert row["plans_json"][0]["startDate"] == "2026-07-27"
    assert row["plans_json"][0]["endDate"] == "2026-07-29"
    assert row["plans_json"][0]["province_name_raw"] == "浙江省"
    assert row["plans_json"][0]["city"] == "余姚市"
    assert row["plans_json"][0]["address"] == "浙江省余姚市梁弄镇健峰城路8号"


def test_vmta_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.vmta.com/xk/pxckx1/773.html",
        "source_course_id": "773",
        "title": "HR战略领航——人力资源主管进阶转型实战营",
        "category_name_raw": "开班计划",
        "duration_days": "3 天",
        "price_raw": "¥ 5800",
        "type": "OPEN_OFFLINE",
    }
    html = """
    <html><head><title>HR战略领航——人力资源主管进阶转型实战营_健峰企管集团官网</title></head><body>
      <h1>HR战略领航——人力资源主管进阶转型实战营</h1>
      <div class="span"><span>开课区域</span><em>健峰培训城</em></div>
      <div class="span"><span>天 数</span><em>3 天</em></div>
      <div class="span"><span>价 格</span><em>¥ 5800</em></div>
      <h2>课程日程表</h2>
      <table><tbody>
        <tr><td>开课时间</td><td>地点</td><td>价格</td></tr>
        <tr><td>2026-07-27 至 2026-07-29</td><td>健峰培训城</td><td>5800</td></tr>
      </tbody></table>
      <div>课程详情 课程宗旨 在当前人才竞争白热化、组织变革加速的时代，企业对 HR 的期待已从行政执行升级为战略驱动。
      课程效益 战略升级：掌握 HR 战略与业务战略联动方法。破解招人难：精准人才画像。
      课程内容 DAY1：战略视角下的 HR 定位。DAY2：薪酬激励进阶。
      参加对象 人力资源部门主管、副经理、HRBP、即将晋升管理层的 HR 骨干 获取定制化课程大纲</div>
    </body></html>
    """
    row = build_vmta_open_record(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 5800
    assert row["duration_days"] == 3
    assert row["total_hours"] == 18
    assert row["plans_json"][0]["city"] == "余姚市"
    assert "HR 战略" in row["learning_outcomes"]
    assert row["audience"].startswith("人力资源部门主管")


def test_vmta_study_tour_detail_keeps_year_missing_diagnostic():
    html = """
    <html><head><title>健峰创智双核企业家苏州研学团_健峰企管集团官网</title></head><body>
      <h1>健峰创智双核企业家苏州研学团</h1>
      健峰创智双核企业家苏州研学团 中国·苏州
      出团时间：8月26日-8月28日，3天3夜（含授课、用餐、住宿、参访点移动交通费用）
      参加对象：董事长、总裁、总经理、副总经理
      参加费用：每人团费人民币 8,800元/人（含税）
      研学详情 研学特色 健峰创智研学团 发现苏州的智创力量
      课程学习：数字化攻略理论授课
      课纲：1. 大模型智能评价企业现有的数字化系统真实水平
    </body></html>
    """
    row = parse_vmta_study_tour_detail("https://www.vmta.com/rc/kc/34.html", html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["category_name_raw"] == "企业考察研学"
    assert row["price"] == 8800
    assert row["duration_days"] == 3
    assert row["plans_json"][0]["city"] == "苏州市"
    assert row["plans_json"][0]["sourceDateText"].startswith("8月26日-8月28日")
    assert any(item["reason"] == "study_tour_schedule_year_missing" for item in row["raw_json"]["diagnostics"])


def test_vmta_online_entry_is_not_courses_flow():
    html = "<html><head><title>健峰云会员平台</title></head><body>制造业的专属线上学习引擎，随时随地在线学习。</body></html>"
    info = parse_vmta_online_entry(html)
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "elearning_platform_not_imported_to_courses"


def test_hztbc_open_schedule_rows_keep_date_price_location():
    html = """
    <table>
      <tr><th>时间</th><th>课程模块</th><th>课程名称</th><th colspan="2">讲师/简介</th><th>培训对象</th><th>非会员价</th><th>会员套票</th><th>地点</th></tr>
      <tr>
        <td rowspan="2">8月</td>
        <td>08月14日08月15日 周五、周六</td>
        <td class="color11">市场营销</td>
        <td class="color11"><a href="/public/info_5012.html">AI+短视频全域营销</a></td>
        <td class="color11">秦老师</td>
        <td class="color11">AI+短视频全域营销导师</td>
        <td class="color11">总裁、高层管理、中层管理</td>
        <td class="color11">4980</td>
        <td class="color11">6张/人</td>
        <td class="color11">杭州</td>
      </tr>
    </table>
    """
    rows = parse_hztbc_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "5012"
    assert row["title"] == "AI+短视频全域营销"
    assert row["category_name_raw"] == "市场营销"
    assert row["price_raw"] == "4980"
    assert row["trainer_name_raw"] == "秦老师"
    assert row["plans_json"][0]["startDate"] == "2026-08-14"
    assert row["plans_json"][0]["endDate"] == "2026-08-15"
    assert row["plans_json"][0]["province_name_raw"] == "浙江省"
    assert row["plans_json"][0]["city"] == "杭州市"


def test_hztbc_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.hztbc.com/public/info_5012.html",
        "source_course_id": "5012",
        "title": "AI+短视频全域营销",
        "category_name_raw": "市场营销",
        "price_raw": "4980",
        "trainer_name_raw": "秦老师",
        "audience": "总裁、高层管理、中层管理",
        "plans_json": [
            {
                "startDate": "2026-08-14",
                "start_date": "2026-08-14",
                "endDate": "2026-08-15",
                "end_date": "2026-08-15",
                "sourceDateText": "08月14日08月15日",
                "city": "杭州市",
                "province_name_raw": "浙江省",
                "location": "杭州",
                "address": "杭州",
                "type": "OFFLINE",
            }
        ],
        "type": "OPEN_OFFLINE",
    }
    html = """
    <html><head><title>AI+短视频全域营销-时代光华管理培训网</title></head><body>
      <h1>AI+短视频全域营销</h1>
      公开课详情
      开课时间： 2026年08月14日 09:30
      结束时间： 2026年08月15日 16:30
      课程价格： 光华商学院学习券6张/人 现金票 4980元/人
      授课讲师： 秦老师
      开课地点： 杭州 文一西路522号西溪科创园8幢
      课程类别： 市场营销
      适用对象 总裁、高层管理、中层管理
      课程时长 2天
      课程收益 掌握短视频矩阵搭建和内容增长方法。
      课程大纲 第一讲 短视频定位。第二讲 矩阵运营。
      相关课程
    </body></html>
    """
    row = parse_hztbc_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 4980
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["trainer_name_raw"] == "秦老师"
    assert row["plans_json"][0]["startDate"] == "2026-08-14"
    assert row["plans_json"][0]["city"] == "杭州市"
    assert "内容增长" in row["learning_outcomes"]


def test_hztbc_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "https://www.hztbc.com/lesson/info_2206.html",
        "source_course_id": "2206",
        "title": "赢在中层-经营管理人员素质提升必修课程",
        "type": "INTERNAL",
    }
    html = """
    <html><head><title>赢在中层-经营管理人员素质提升必修课程-时代光华管理培训网</title></head><body>
      <h1>赢在中层-经营管理人员素质提升必修课程</h1>
      领 域： 综合管理 综合管理
      培训对象：总裁 高层管理 中层管理
      课程收益 中高层经理是企业的脊梁，是企业的核心人才库。
      课程特色 授课极富激情与现场感染力，课程以实战性与实操性为显著特征。
      课程大纲 第一讲 中层管理者的角色定位。第二讲 高效执行的六大关键。
      学员评价
    </body></html>
    """
    row = parse_hztbc_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 0
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["category_name_raw"].startswith("综合管理")
    assert row["audience"].startswith("总裁")
    assert "核心人才库" in row["learning_outcomes"]
    assert "角色定位" in row["syllabus"]


def test_hztbc_online_entry_is_not_courses_flow():
    html = "<html><head><title>时代光华ELN网络学院</title></head><body>企业在线学习，网络学院，在线课件。</body></html>"
    info = parse_hztbc_online_entry(html)
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "e_learning_platform_not_imported_to_courses"


def test_easyfinance_open_list_rows_keep_schedule_city_price():
    html = """
    <a href="/course-detail?uuid=F558535F-21C5-48DC-A8D7-B3C119392812">
      风险、合规、内控一体化构建与管理实战
      7月11日 - 7月12日 2天 地点：上海 ￥ 11800
    </a>
    """
    rows = parse_easyfinance_open_rows(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["type"] == "OPEN_OFFLINE"
    assert row["title"] == "风险、合规、内控一体化构建与管理实战"
    assert row["price_raw"] == "￥11800"
    assert row["plans_json"][0]["startDate"] == "2026-07-11"
    assert row["plans_json"][0]["city"] == "上海市"
    assert row["plans_json"][0]["province_name_raw"] == "上海市"


def test_easyfinance_open_detail_outputs_offline_course():
    item = {
        "url": "https://www.easyfinance.com.cn/course-detail?uuid=F558535F-21C5-48DC-A8D7-B3C119392812",
        "source_course_id": "F558535F-21C5-48DC-A8D7-B3C119392812",
        "title": "风险、合规、内控一体化构建与管理实战",
        "type": "OPEN_OFFLINE",
        "category_name_raw": "安越财商院公开课",
        "duration_text": "2天",
        "price_raw": "￥11800",
        "plans_json": [
            {
                "startDate": "2026-07-11",
                "start_date": "2026-07-11",
                "endDate": "2026-07-12",
                "end_date": "2026-07-12",
                "city": "上海市",
                "province_name_raw": "上海市",
                "location": "上海",
                "address": "上海",
                "type": "OFFLINE",
            }
        ],
        "source_entry": "yearly_course_schedule",
    }
    html = """
    <html><head><title>风险、合规、内控一体化构建与管理实战</title></head><body>
      <h1>风险、合规、内控一体化构建与管理实战</h1>
      开课时间： 2024年7月11日 - 2024年7月12日
      培训天数： 2天
      开课地点： 上海
      课程价格： ￥11800
      培训对象： 财务、风险、内控、合规、审计、法务等部门中层以上人员
      近期排课 RECENT COURSES
      课程收益 KEY BENEFITS 全面梳理风险、内控、合规之间的关系。
      课程大纲 COURSE CONTENT 第一模块 风险管理的内涵阐述 第二模块 合规风险管理
      课程介绍 INTRODUCTION 帮助企业搭建全面风险管理体系。
      经验分享 FEEDBACK 学员评价
    </body></html>
    """
    row = parse_easyfinance_open_detail(item, html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 11800
    assert row["duration_days"] == 2
    assert row["total_hours"] == 12
    assert row["plans_json"][0]["startDate"] == "2026-07-11"
    assert row["audience"].startswith("财务、风险")
    assert "风险、内控、合规" in row["learning_outcomes"]
    assert "风险管理" in row["syllabus"]


def test_easyfinance_live_row_outputs_online_course_with_ended_diagnostic():
    html = """
    <html><body>
      精选直播 精益成本控制（二） 讲师：张梦 2026年4月16日 19:30 已预约：0人 已结束 查看更多
    </body></html>
    """
    rows = parse_easyfinance_live_rows(html)
    assert len(rows) == 1
    row = parse_easyfinance_live_record(rows[0], html)
    assert row["type"] == "OPEN_ONLINE"
    assert row["plans_json"][0]["startTime"] == "2026-04-16 19:30"
    assert row["plans_json"][0]["onlineUrl"] == "https://www.easyfinance.com.cn/live"
    assert any(item["reason"] == "source_live_is_ended" for item in row["raw_json"]["diagnostics"])


def test_easyfinance_internal_detail_outputs_internal_negotiable():
    item = {
        "url": "https://www.easyfinance.com.cn/company-energize",
        "source_course_id": "company-energize",
        "title": "定制化学习项目",
        "category_name_raw": "企业赋能",
        "source_entry": "company_energize",
    }
    html = """
    <html><head><title>安越企业赋能中心</title></head><body>
      <h1>一站式财商赋能落地解决方案</h1>
      培训对象：首席财务官、财务总监、总会计师、高级财务经理
      关于安越企业赋能中心 安越企业赋能中心致力于为企业提供定制化的财商能力和管理会计企业学习项目。
      定制化学习项目服务体系 安越的定制化内训服务始终坚持以客户需求为导向。
      咨询项目服务形式 实战工作坊 行动学习 私董会 微咨询
      请留下您的联系方式
    </body></html>
    """
    row = parse_easyfinance_internal_detail(item, html)
    assert row["type"] == "INTERNAL"
    assert row["raw_json"]["price_parse_status"] == "NEGOTIABLE"
    assert row["plans_json"] == []
    assert row["audience"].startswith("首席财务官")
    assert "客户需求" in row["learning_outcomes"]
    assert "实战工作坊" in row["syllabus"]


def test_jyqc_parked_domain_is_not_collectable():
    html = """
    <html><head><title>www.jyqc.cn is For Sale</title></head><body>
      Premium Domain www.jyqc.cn This Domain Is For Sale
      Buy on Afternic Buy on Aliyun Buy on Sedo
    </body></html>
    """
    status = parse_jyqc_site_status(html, "http://www.jyqc.cn/")
    assert status["is_parked"] is True
    assert status["collectable"] is False
    assert status["reason"] == "domain_parking_for_sale"


def test_jyqc_course_signal_page_would_be_collectable():
    html = """
    <html><head><title>公开课培训</title></head><body>
      企业管理公开课 课程列表 开课时间 培训地点 讲师 内训方案
    </body></html>
    """
    status = parse_jyqc_site_status(html, "http://www.jyqc.cn/")
    assert status["is_parked"] is False
    assert status["has_course_signals"] is True
    assert status["collectable"] is True


def test_zqzhpx_dns_error_is_not_collectable():
    status = classify_zqzhpx_probe_error(RuntimeError("request failed after 2 retries: http://www.zqzhpx.com; <urlopen error [Errno 11001] getaddrinfo failed>"))
    assert status["collectable"] is False
    assert status["reason"] == "dns_resolution_failed"


def test_zqzhpx_course_signal_page_would_be_collectable():
    html = """
    <html><head><title>中企智慧培训公开课</title></head><body>
      公开课 课程中心 企业内训 开课计划 培训地点 讲师介绍
    </body></html>
    """
    status = parse_zqzhpx_site_status(html, "http://www.zqzhpx.com/")
    assert status["is_parked"] is False
    assert status["has_course_signals"] is True
    assert status["collectable"] is True


def test_qianjinyuan_dns_error_is_not_collectable():
    status = classify_qianjinyuan_probe_error(RuntimeError("request failed after 2 retries: http://www.qianjinyuan.org; <urlopen error [Errno 11001] getaddrinfo failed>"))
    assert status["collectable"] is False
    assert status["reason"] == "dns_resolution_failed"


def test_qianjinyuan_course_signal_page_would_be_collectable():
    html = """
    <html><head><title>前锦园培训公开课</title></head><body>
      公开课 课程中心 企业内训 开课计划 培训地点 讲师介绍
    </body></html>
    """
    status = parse_qianjinyuan_site_status(html, "http://www.qianjinyuan.org/")
    assert status["is_parked"] is False
    assert status["has_course_signals"] is True
    assert status["collectable"] is True


def test_hjcn_parked_domain_is_not_collectable():
    html = """
    <html><head><title>www.hjcn.com is For Sale</title></head><body>
      Premium Domain www.hjcn.com This Domain Is For Sale
      Buy on Afternic Buy on Aliyun Buy on Sedo
    </body></html>
    """
    status = parse_hjcn_site_status(html, "http://www.hjcn.com/")
    assert status["is_parked"] is True
    assert status["collectable"] is False
    assert status["reason"] == "domain_parking_for_sale"


def test_hjcn_timeout_error_is_not_collectable():
    status = classify_hjcn_probe_error(RuntimeError("request failed after 2 retries: https://www.hjcn.com; timed out"))
    assert status["collectable"] is False
    assert status["reason"] == "source_timeout"


def test_hjcn_course_signal_page_would_be_collectable():
    html = """
    <html><head><title>HJCN 培训公开课</title></head><body>
      公开课 课程中心 企业内训 开课计划 培训地点 讲师介绍
    </body></html>
    """
    status = parse_hjcn_site_status(html, "http://www.hjcn.com/")
    assert status["is_parked"] is False
    assert status["has_course_signals"] is True
    assert status["collectable"] is True


def test_learnbank_timeout_error_is_not_collectable():
    status = classify_learnbank_probe_error(RuntimeError("request failed after 2 retries: http://www.learnbank.com.cn; timed out"))
    assert status["collectable"] is False
    assert status["reason"] == "source_timeout"


def test_learnbank_course_signal_page_would_be_collectable():
    html = """
    <html><head><title>Learnbank 企业培训公开课</title></head><body>
      公开课 课程中心 企业内训 开课计划 培训地点 讲师介绍
    </body></html>
    """
    status = parse_learnbank_site_status(html, "http://www.learnbank.com.cn/")
    assert status["is_parked"] is False
    assert status["has_course_signals"] is True
    assert status["collectable"] is True


def test_keycourse_face_record_keeps_schedule_city_price_and_sections():
    item = {
        "productId": 1075,
        "headUrl": "http://crm.sino-bestway.com.cn/bp/marketForm/downloadPic?fileId=233453",
        "trainingTarget": "设计、文案、数据分析人员",
        "productName": "AI办公效能跃迁-AI大模型全场景落地实战与智能体构建",
        "trainingDuration": "2天",
        "coursePrice": 4900,
        "courseOutList": [
            {
                "productId": 1075,
                "startTimeStr": "2026-07-17",
                "endTimeStr": "2026-07-18",
                "courseCity": "上海",
                "coursePrice": 4900,
                "courseFlag": "报名",
            }
        ],
        "teachingForm": "FACE",
        "courseProfit": "<p>从知识层面理解AI趋势</p>",
    }
    html = """
    <html><body>
      最新课程安排表 选课中心 面授课 人资行政 综合能力
      AI办公效能跃迁-AI大模型全场景落地实战与智能体构建
      AI办公效能跃迁-AI大模型全场景落地实战与智能体构建
      课程时长： 2天 课程价格： ¥4900 培训对象： 企业管理人员、HR
      索取课纲 预约报名 课后资料 课程介绍 课程大纲 开课安排 睿选观点
      本课程围绕AI办公真实场景展开。
      课程收益 掌握AI办公工具并能落地到日常工作。
      培训对象 企业管理人员、HR 培训时间 2天
      第一模块：AI工具认知 第二模块：智能体构建
      开课安排 开课城市 课程名称 资料
    </body></html>
    """
    record = build_keycourse_record(item, html)
    assert record["type"] == "OPEN_OFFLINE"
    assert record["category_name_raw"] == "面授课 / 人资行政 / 综合能力"
    assert record["price"] == 4900
    assert record["raw_json"]["price_parse_status"] == "NUMERIC"
    assert record["duration_days"] == 2
    assert record["total_hours"] == 12
    assert "AI办公工具" in record["learning_outcomes"]
    assert "第一模块" in record["syllabus"]
    assert record["plans_json"][0]["province_name_raw"] == "上海市"
    assert record["plans_json"][0]["city_name_raw"] == "上海市"
    assert record["plans_json"][0]["startDate"] == "2026-07-17"


def test_keycourse_online_item_is_excluded_from_courses_flow():
    item = {
        "productId": 1144,
        "productName": "AI赋能工作效能提升（线上版）",
        "trainingDuration": "364分钟",
        "teachingForm": "ONLINE",
        "courseOutList": [],
    }
    excluded = build_keycourse_online_exclusion(item)
    assert excluded["content_type"] == "RECORDED_VIDEO"
    assert excluded["reason"] == "online_self_paced_course_not_imported_to_courses"
    assert "无 courseOutList 排期" in excluded["evidence"]


def test_bosum_internal_project_maps_to_internal_and_yuan_price():
    item = {
        "source_course_id": "personal-learning-president",
        "route": "/courseServer/personalLearning",
        "source_section": "个人学习系统班",
        "title": "博商总裁班",
        "category_name_raw": "个人学习系统班 / 总裁项目",
        "audience": "企业创始人",
        "learning_outcomes": "提升总裁三大核心能力：战略、运营、领导力。",
        "highlights": "长期系统课程，适合想系统提升管理能力的企业领导者、管理者。",
        "syllabus": "《战略7步——激发持续增长》；《商业模式创新——寻找新盈利区》。",
        "duration_raw": "15个月",
        "region_raw": "全国",
        "price_raw": "9.9万",
    }
    row = build_bosum_internal_record(item)
    assert row["type"] == "INTERNAL"
    assert row["price"] == 99000
    assert row["raw_json"]["price_parse_status"] == "NUMERIC"
    assert row["plans_json"] == []
    assert row["raw_json"]["duration_months"] == 15
    assert any(item["field"] == "plans_json" for item in row["raw_json"]["diagnostics"])


def test_bosum_online_entry_is_not_courses_flow():
    info = parse_bosum_online_entry()
    assert info["content_type"] == "RECORDED_VIDEO"
    assert info["reason"] == "online_course_entry_not_imported_to_courses"
    assert "/courseServer/onLine" in info["source_url"]


def test_beiuec_list_and_detail_outputs_offline_course():
    list_html = """
    <tr>
      <td><a href="details.asp?id=283">静电危害评估与防护</a></td>
      <td>2026年07月14-15日</td>
      <td>4500元/人</td>
      <td><a href="message.asp?id=283">在线报名</a></td>
    </tr>
    """
    rows = parse_beiuec_rows(list_html)
    assert len(rows) == 1
    detail_html = """
    <html><head><title>静电危害评估与防护 |</title></head><body>
      静电危害评估与防护 日期：2026年07月14-15日 价格：4500元/人 地点：上海
      课程目标 学员通过此次课程可以：了解静电概念及产生机理；掌握静电防护原理；
      培训对象 ESD 工程师、ESD 审核员、产线管理人员和工程师等
      课程大纲 第一讲 静电基本概念 第二讲 电子工业中的静电问题
      版权所有
    </body></html>
    """
    row = parse_beiuec_detail(rows[0], detail_html)
    assert row["type"] == "OPEN_OFFLINE"
    assert row["price"] == 4500
    assert row["plans_json"][0]["startDate"] == "2026-07-14"
    assert row["plans_json"][0]["city_name_raw"] == "上海市"
    assert "静电概念" in row["learning_outcomes"]
    assert "ESD 工程师" in row["audience"]


def test_huide_live_detail_outputs_online_course():
    item = {
        "source_course_id": "881",
        "source_url": "http://www.huide.net/Systems.aspx?id=881",
        "url": "http://www.huide.net/Systems.aspx?id=881",
        "title": "《客户异议处理与网络危机公关》",
        "source_entry": "homepage_recent_courses",
    }
    html = """
    <html><body>
      首页 > 课程体系 > 客服体系与服务营销 > 《客户异议处理与网络危机公关》
      《客户异议处理与网络危机公关》 1天
      直播日期：2026年 7月23日 8月12日 10月7日 6课时
      授课讲师：宫同昌老师
      课程目标 1. 形成对客户投诉的正确认识 2. 掌握投诉处理体系
      课程大纲 第一部分 正确认识客户投诉 第二部分 建立完善的客户投诉管理体系
      讲师介绍：宫同昌老师
      惠德声明
    </body></html>
    """
    row = parse_huide_detail(item, html)
    assert row["type"] == "OPEN_ONLINE"
    assert row["plans_json"][0]["type"] == "ONLINE"
    assert row["plans_json"][0]["onlineUrl"].endswith("id=881")
    assert "投诉" in row["learning_outcomes"]
    assert "客户投诉" in row["syllabus"]


def test_huide_open_table_items_keep_city_price_and_registration_link():
    html = """
    <div id="con_two_1">
      <table>
        <tr><td>课程名称</td><td>天数</td><td>价格</td><td>1月</td><td>2月</td><td>3月</td><td>4月</td></tr>
        <tr><td colspan="15"><div class="btbg01"><a href="Systems.aspx?ids=90">客户关系管理系列</a></div></td></tr>
        <tr>
          <td><a href="Systems.aspx?id=90">《客户关系管理师认证》培训</a></td>
          <td>4</td>
          <td>￥9800</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td><a href="Registration.aspx?id=90&amp;tid=646">11-14</a></td>
        </tr>
      </table>
    </div>
    """
    rows = parse_huide_table_items(html)
    assert len(rows) == 1
    row = rows[0]
    assert row["source_course_id"] == "90"
    assert row["category_name_raw"] == "客户关系管理系列"
    assert row["duration_days"] == 4
    assert row["price_raw"] == "￥9800"
    assert row["plans_json"][0]["startDate"] == "2026-04-11"
    assert row["plans_json"][0]["endDate"] == "2026-04-14"
    assert row["plans_json"][0]["province_name_raw"] == "北京市"
    assert row["plans_json"][0]["signupUrl"].endswith("Registration.aspx?id=90&tid=646")


def test_huide_date_parser_keeps_city_for_offline_plan():
    plans = parse_huide_dates("2026年 8月15-16日北京/10月24-25日北京/11月21-22日深圳")
    assert plans[0]["startDate"] == "2026-08-15"
    assert plans[0]["city_name_raw"] == "北京市"
    assert plans[-1]["city_name_raw"] == "深圳市"


if __name__ == "__main__":
    test_parse_price_statuses()
    test_infer_course_type_from_plans()
    test_detect_non_course_content_type()
    test_nlypx_list_parse_keeps_category_and_price_raw()
    test_nlypx_list_city_plan_overrides_online_category_default()
    test_nlypx_detail_sections_stop_before_syllabus_and_signup()
    test_nlypx_detail_sections_stop_before_teacher_and_attendees()
    test_jiangshibao_internal_detail_maps_to_internal()
    test_jiangshibao_open_detail_keeps_offline_plan()
    test_jiangshibao_open_detail_skips_weak_audience_summary()
    test_jiangshitai_teaches_filters_non_outcome_headings()
    test_jiangshitai_training_entry_stays_internal_and_cleans_audience()
    test_huashijingji_list_maps_course_library_to_internal()
    test_huashijingji_copyright_maps_to_internal_consulting_product()
    test_huashijingji_online_entry_is_identified_but_not_course_record()
    test_zpedu_open_detail_with_city_schedule_is_offline()
    test_zpedu_open_detail_with_live_schedule_is_online()
    test_zpedu_internal_seed_stays_internal_even_with_online_text()
    test_lmschina_class_with_offline_schedule_is_open_offline()
    test_lmschina_courseware_resource_is_online_course()
    test_lmschina_video_resource_is_marked_non_course()
    test_lmschina_detail_enriches_fields_and_detects_image_detail()
    test_shchance_list_row_keeps_offline_plan_fields()
    test_shchance_detail_outputs_reviewable_offline_course()
    test_qiyingschool_open_list_rows_keep_schedule_city_price()
    test_qiyingschool_open_detail_outputs_offline_plan_and_fields()
    test_qiyingschool_internal_detail_outputs_internal_and_duration()
    test_qiyingschool_video_entry_is_not_courses_flow()
    test_champconsult_open_list_rows_keep_schedule_city_price()
    test_champconsult_open_detail_outputs_offline_plan()
    test_champconsult_internal_solution_outputs_internal()
    test_free863_open_list_rows_keep_multiple_offline_plans()
    test_free863_open_list_rows_keep_online_live_plans_only()
    test_free863_internal_list_rows_keep_training_fields()
    test_free863_open_detail_outputs_offline_course()
    test_free863_internal_detail_outputs_internal_negotiable()
    test_chinacpx_open_list_rows_keep_city_date_price()
    test_chinacpx_internal_list_rows_keep_teacher_days_category()
    test_chinacpx_open_detail_outputs_offline_course()
    test_chinacpx_internal_detail_outputs_internal_negotiable()
    test_chinacpx_online_entry_is_not_courses_flow()
    test_qgpx_open_list_rows_keep_schedule_location_price()
    test_qgpx_open_detail_outputs_offline_course()
    test_qgpx_internal_list_rows_keep_course_links_only()
    test_qgpx_internal_detail_outputs_internal_negotiable()
    test_qgpx_online_entry_is_not_courses_flow()
    test_gaopei_internal_list_rows_keep_training_fields()
    test_gaopei_internal_detail_outputs_internal_negotiable()
    test_vmta_open_list_rows_keep_schedule_location_price()
    test_vmta_open_detail_outputs_offline_course()
    test_vmta_study_tour_detail_keeps_year_missing_diagnostic()
    test_vmta_online_entry_is_not_courses_flow()
    test_hztbc_open_schedule_rows_keep_date_price_location()
    test_hztbc_open_detail_outputs_offline_course()
    test_hztbc_internal_detail_outputs_internal_negotiable()
    test_hztbc_online_entry_is_not_courses_flow()
    test_easyfinance_open_list_rows_keep_schedule_city_price()
    test_easyfinance_open_detail_outputs_offline_course()
    test_easyfinance_live_row_outputs_online_course_with_ended_diagnostic()
    test_easyfinance_internal_detail_outputs_internal_negotiable()
    test_jyqc_parked_domain_is_not_collectable()
    test_jyqc_course_signal_page_would_be_collectable()
    test_zqzhpx_dns_error_is_not_collectable()
    test_zqzhpx_course_signal_page_would_be_collectable()
    test_qianjinyuan_dns_error_is_not_collectable()
    test_qianjinyuan_course_signal_page_would_be_collectable()
    test_hjcn_parked_domain_is_not_collectable()
    test_hjcn_timeout_error_is_not_collectable()
    test_hjcn_course_signal_page_would_be_collectable()
    test_learnbank_timeout_error_is_not_collectable()
    test_learnbank_course_signal_page_would_be_collectable()
    test_keycourse_face_record_keeps_schedule_city_price_and_sections()
    test_keycourse_online_item_is_excluded_from_courses_flow()
    test_bosum_internal_project_maps_to_internal_and_yuan_price()
    test_bosum_online_entry_is_not_courses_flow()
    test_beiuec_list_and_detail_outputs_offline_course()
    test_huide_live_detail_outputs_online_course()
    test_huide_open_table_items_keep_city_price_and_registration_link()
    test_huide_date_parser_keeps_city_for_offline_plan()
    print("course utils sample tests passed")
