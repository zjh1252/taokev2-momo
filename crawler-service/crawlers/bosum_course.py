"""博商管理科学研究院课程爬虫适配器。

bosum.com 当前官网是 Vue 单页应用，课程服务内容主要内嵌在前端包的静态课程体系文案中。
源站未提供可采集的公开课日期/城市课表，当前只将可确认的长期项目型课程作为 INTERNAL 进入审核池；
线上课程入口按线上/录播资源边界记录，不导入 courses 流程。
"""
import asyncio
import logging
import re
import ssl
import time
import urllib.request
from datetime import datetime
from html import unescape
from typing import Any, AsyncGenerator, Dict, Iterable, List

from crawlers.course_utils import append_diagnostic, enrich_course_record, set_price_fields


BASE_URL = "https://bosum.com"
APP_JS_URL = f"{BASE_URL}/static/js/app.aa91779b5568896235e8.js"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MISSING = "暂无"
logger = logging.getLogger(__name__)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


COURSE_PROJECTS: list[dict[str, Any]] = [
    {
        "source_course_id": "personal-learning-president",
        "route": "/courseServer/personalLearning",
        "source_section": "个人学习系统班",
        "title": "博商总裁班",
        "category_name_raw": "个人学习系统班 / 总裁项目",
        "audience": "企业创始人",
        "learning_outcomes": "提升总裁三大核心能力：战略、运营、领导力；快速提高自我认知，推动企业行稳致远。",
        "highlights": "长期系统课程，适合想系统提升管理能力的企业领导者、管理者，配套实战模型工具和有效解决方案。",
        "syllabus": "《战略7步——激发持续增长》；《商业模式创新——寻找新盈利区》；《运营管控——驱动战略执行》；《大财务思维——降本增效数据化管理》；《销售管理密码——打造销冠铁军》；《人才战略——支撑企业绩效突破》；《共赢领导力——让组织和团队共赢》。",
        "duration_raw": "15个月",
        "region_raw": "全国",
        "price_raw": "9.9万",
    },
    {
        "source_course_id": "personal-learning-elite",
        "route": "/courseServer/personalLearning",
        "source_section": "个人学习系统班",
        "title": "商界英才行动突破训战营",
        "category_name_raw": "个人学习系统班 / 英才项目",
        "audience": "企业高管",
        "learning_outcomes": "成为老板的左右手；激励团队，高效运营；实现流程化管理；从业务专家到管理高手，从个人成功到团队成功。",
        "highlights": "面向想成为总裁左右手的企业高管，聚焦管理角色、公众表达、战略执行、财务思维、组织绩效与人才激发。",
        "syllabus": "1. 成就自我：《管理者的角色定位与认知》《公众演讲与有效沟通》；2. 赢得结果：《战略执行与目标管控》《决策者的财务思维》《组织绩效改进工作坊》；3. 打造团队：《选人用人：团队搭建与人才选拔》《人才培养与薪酬激励》《员工辅导与激发》。",
        "duration_raw": "10个月",
        "region_raw": "全国",
        "price_raw": "4.28万",
    },
    {
        "source_course_id": "personal-learning-capital",
        "route": "/courseServer/personalLearning",
        "source_section": "个人学习系统班",
        "title": "民企资本运营实战项目",
        "category_name_raw": "个人学习系统班 / 资本项目",
        "audience": "企业创始人",
        "learning_outcomes": "培养资本运营能力；搭建资源对接平台；加强公司规范治理；推动资本运营转型升级。",
        "highlights": "面向对企业资本发展有规划的总裁，提升资本运营实战能力，有效链接资本与圈层资源。",
        "syllabus": "1. 资本思维：《企业家资本思维与投融资战略》《资本游戏与班级团队打造训练营》；2. 商业设计：《商业底层逻辑与模式创新》；3. 规范治理：《财务分析与商业价值》《公司治理与顶层设计》《企业股权设计与激励》；4. 产融联动：《创新融资策略》《企业价值评估》《私募股权投资》《多层次资本市场与企业资本运作路径》《企业并购与重组》。",
        "duration_raw": "1年",
        "region_raw": "全国",
        "price_raw": "9.9万",
    },
    {
        "source_course_id": "accompany-strategy-coach",
        "route": "/courseServer/accompanyRunners",
        "source_section": "陪跑系列",
        "title": "战略教练陪跑项目",
        "category_name_raw": "陪跑系列 / 战略教练陪跑项目",
        "audience": "创始人、高管等",
        "learning_outcomes": "完成从战略到执行的闭环，实现一个突破性目标结果、一个可执行跟踪机制、一套团队有效激励工具、一个打胜仗的团队文化。",
        "highlights": "长期陪伴学员落地执行的项目，适合执行条件欠缺、需要教练陪伴的团队组织。",
        "syllabus": "《战略教练陪跑项目》",
        "duration_raw": "6个月",
        "region_raw": "全国",
        "price_raw": "79.8万",
    },
    {
        "source_course_id": "accompany-organization-90-days",
        "route": "/courseServer/accompanyRunners",
        "source_section": "陪跑系列",
        "title": "引爆组织90天训战营",
        "category_name_raw": "陪跑系列 / 引爆组织90天",
        "audience": "创始人、高管等",
        "learning_outcomes": "合理设置核心业务目标；设计激励措施；突破目标拿到结果，引爆组织快速增长。",
        "highlights": "适合需要单点解决某个经营问题的企业团队，聚焦组织散漫和目标难以实现等经营问题。",
        "syllabus": "《引爆组织90天训战营》",
        "duration_raw": "3个月",
        "region_raw": "全国",
        "price_raw": "49.8万",
    },
    {
        "source_course_id": "accompany-lighthouse",
        "route": "/courseServer/accompanyRunners",
        "source_section": "陪跑系列",
        "title": "博商·灯塔计划",
        "category_name_raw": "陪跑系列 / 博商·灯塔计划",
        "audience": "创始人",
        "learning_outcomes": "吸取实战经验，减少踩坑；解决企业增长突破；链接企业产业资源。",
        "highlights": "面向在管理上无法获得进一步突破的创始人，跟更有结果的人学习，成为行业先锋。",
        "syllabus": "《博商·灯塔计划 薄连明-企业突破》；《博商·灯塔计划 卫哲-增长破圈》。",
        "duration_raw": "6个月",
        "region_raw": "深圳/上海",
        "price_raw": "19.8万",
    },
    {
        "source_course_id": "accompany-custom-internal",
        "route": "/courseServer/accompanyRunners",
        "source_section": "陪跑系列",
        "title": "定制化企业内训",
        "category_name_raw": "陪跑系列 / 定制化企业内训",
        "audience": "需提高公司整体管理水平、员工专业能力的企业团队",
        "learning_outcomes": "提升公司的经营管理水平及员工素质。",
        "highlights": "围绕企业团队管理水平和员工专业能力提升进行定制化内训。",
        "syllabus": "根据企业实际经营管理问题定制课程模块，源站未展示固定公开大纲。",
        "duration_raw": "按企业需求定制",
        "region_raw": "企业定制",
        "price_raw": "培训咨询",
    },
]


def fetch_text(url: str, timeout: int = 15, retries: int = 2) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                return resp.read().decode(charset, errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(0.4 * attempt)
    raise RuntimeError(f"request failed after {retries} retries: {url}; {last_error}")


def clean_html(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(?:p|div|li|tr|h[1-6])\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text).replace("&nbsp;", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    return " ".join(text.split()) or default


def price_raw_to_yuan(value: Any) -> str:
    text = clean_html(value)
    if not text:
        return ""
    match = re.search(r"(\d+(?:\.\d+)?)\s*万", text)
    if match:
        yuan = float(match.group(1)) * 10000
        return f"{int(yuan)}元" if yuan.is_integer() else f"{yuan}元"
    return text


def parse_duration_months(value: Any) -> int:
    text = clean_html(value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*个月", text)
    if match:
        return int(float(match.group(1)))
    match = re.search(r"(\d+(?:\.\d+)?)\s*年", text)
    if match:
        return int(float(match.group(1)) * 12)
    return 0


def source_available() -> dict[str, Any]:
    try:
        html = fetch_text(BASE_URL, timeout=10, retries=1)
    except Exception as exc:
        return {"collectable": False, "reason": "homepage_unreachable", "error": str(exc)[:500]}
    title = ""
    match = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, flags=re.I)
    if match:
        title = clean_html(match.group(1))
    return {
        "collectable": "博商" in clean_html(html),
        "reason": "homepage_ok" if "博商" in clean_html(html) else "homepage_without_bosum_signal",
        "title": title,
        "raw_text_sample": clean_html(html)[:500],
    }


def verify_bundle_contains_projects() -> dict[str, Any]:
    try:
        bundle = fetch_text(APP_JS_URL, timeout=20, retries=1)
    except Exception as exc:
        return {"verified": False, "reason": "app_bundle_unreachable", "error": str(exc)[:500]}
    expected = ["个人学习系统班", "博商总裁班", "商界英才行动突破训战营", "民企资本运营实战项目", "陪跑系列"]
    missing = [item for item in expected if item not in bundle]
    return {
        "verified": not missing,
        "reason": "app_bundle_course_text_found" if not missing else "app_bundle_missing_expected_course_text",
        "missing": missing,
    }


def coverage_notes() -> list[str]:
    return [
        "INTERNAL 已覆盖：官网课程服务页展示的个人学习系统班、陪跑系列和定制化企业内训等项目无公开日期课表，按项目型/内训型课程进入审核池。",
        "OPEN_OFFLINE 未覆盖：源站未发现可采集的公开课固定开课日期、城市、地址和课表接口；不伪造线下排期。",
        "OPEN_ONLINE 未导入：官网存在线上课程入口，但当前表现为线上学习/课程资源边界，未发现可确认的直播公开课排期，留给后续 video/online 独立流程。",
    ]


def build_internal_record(item: dict[str, Any]) -> Dict[str, Any]:
    source_url = f"{BASE_URL}{item['route']}"
    duration_months = parse_duration_months(item.get("duration_raw"))
    raw_price_yuan = price_raw_to_yuan(item.get("price_raw"))
    record: Dict[str, Any] = {
        "source_course_id": item["source_course_id"],
        "source_url": source_url,
        "title": item["title"],
        "type": "INTERNAL",
        "category_name_raw": item["category_name_raw"],
        "cover_url": "",
        "intro": item["highlights"],
        "summary": item["highlights"][:500],
        "syllabus": item["syllabus"],
        "audience": item["audience"],
        "target_audience": "",
        "learning_outcomes": item["learning_outcomes"],
        "highlights": item["highlights"],
        "duration_days": 0,
        "total_hours": 0,
        "original_price": 0,
        "keywords": item["category_name_raw"],
        "trainer_name_raw": "",
        "plans_json": [],
        "services_json": [],
        "raw_json": {
            "source_entry": "official_vue_bundle_course_service",
            "source_entry_name": item["source_section"],
            "content_type": "COURSE",
            "type_evidence": "官网课程服务页展示长期系统项目/陪跑项目/企业内训，无公开固定排期，按 INTERNAL 待审核。",
            "category_evidence": "官网课程服务栏目和项目分类",
            "price_raw": item["price_raw"],
            "duration_raw": item["duration_raw"],
            "duration_months": duration_months,
            "region_raw": item["region_raw"],
            "field_sources": {
                "title": "官网前端包 rbf6 中文课程服务文案",
                "category_name_raw": "官网课程服务栏目与项目分类",
                "price": "官网课程服务表格费用字段",
                "audience": "官网课程服务表格适用对象字段",
                "learning_outcomes": "官网课程服务表格课程目标字段",
                "syllabus": "官网课程服务表格课程模块字段",
                "plans_json": "源站未展示公开固定排期，人工审核可补填",
            },
            "coverage_notes": coverage_notes(),
            "diagnostics": [],
        },
    }
    set_price_fields(record, raw_price_yuan or item.get("price_raw"))
    append_diagnostic(record, "plans_json", "source_project_course_has_no_public_schedule")
    if duration_months:
        append_diagnostic(record, "duration_days", "source_uses_month_based_program_duration_not_day_based", item.get("duration_raw"))
    else:
        append_diagnostic(record, "duration_days", "source_duration_needs_manual_review", item.get("duration_raw"))
    if not record["trainer_name_raw"]:
        append_diagnostic(record, "trainer_name_raw", "source_project_page_has_no_single_trainer")
    enrich_course_record(record, fallback_type="INTERNAL")
    record["type"] = "INTERNAL"
    record["raw_json"]["content_type"] = "COURSE"
    record["raw_json"]["type_evidence"] = "官网课程服务页展示长期系统项目/陪跑项目/企业内训，无公开固定排期，按 INTERNAL 待审核。"
    return record


def parse_online_entry() -> Dict[str, Any]:
    return {
        "source_course_id": "online-course-entry",
        "source_url": f"{BASE_URL}/courseServer/onLine",
        "title": "博商线上课程",
        "content_type": "RECORDED_VIDEO",
        "reason": "online_course_entry_not_imported_to_courses",
        "evidence": "官网导航存在“线上课程”，但未发现可确认的直播公开课日期/城市/报名排期，当前不进入 courses 流程。",
    }


def iter_bosum_courses(max_items: int | None = None):
    status = source_available()
    if not status.get("collectable"):
        logger.warning("bosum homepage check failed: %s", status)
    bundle_status = verify_bundle_contains_projects()
    if not bundle_status.get("verified"):
        logger.warning("bosum bundle verification failed, use checked static mapping: %s", bundle_status)

    count = 0
    for item in COURSE_PROJECTS:
        yield build_internal_record(item)
        count += 1
        if max_items and count >= max_items:
            break


def crawl_bosum_courses(max_items: int | None = None) -> List[Dict[str, Any]]:
    return list(iter_bosum_courses(max_items))


def next_record(iterator):
    try:
        return True, next(iterator)
    except StopIteration:
        return False, None


class BosumCourseSpider:
    """博商课程爬虫适配器，供 JobManager 调用。"""

    name = "bosum_course"
    source = "bosum"
    data_type = "COURSE"
    max_items = None
    supported_course_types = ("INTERNAL",)
    coverage_note = (
        "官网课程服务页可确认项目型/内训型课程，按 INTERNAL 导入审核；"
        "未发现 OPEN_OFFLINE 固定排期和地址；线上课程入口暂不进入 courses 流程。"
    )

    def pause(self) -> None:
        return None

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        iterator = iter_bosum_courses(self.max_items)
        while True:
            has_next, record = await asyncio.to_thread(next_record, iterator)
            if not has_next:
                break
            record["_source"] = self.source
            record["_data_type"] = self.data_type
            record["_crawled_at"] = datetime.now().isoformat()
            yield record
