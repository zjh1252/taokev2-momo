#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


DEFAULT_LEGACY_DUMP = Path("data-trans/taoke.sql")
DEFAULT_TARGET_DUMP = Path("data-trans/v3test1.sql")
DEFAULT_TARGET_SCHEMA = Path("data-trans/v3test.sql")

CREATE_RE = re.compile(r"^CREATE TABLE `(?P<table>[^`]+)`")
COLUMN_RE = re.compile(r"^\s*`(?P<column>[^`]+)`")
INSERT_PREFIX_RE = re.compile(r"^INSERT INTO `(?P<table>[^`]+)` VALUES \(")

LEGACY_TABLES = {
    "tk_member",
    "tk_course",
    "tk_courseinfo",
    "tk_coursedata",
    "tk_course_pic",
    "tk_course_video",
}
TARGET_TABLES = {
    "sys_users",
    "sys_user_roles",
    "user_trainers",
    "user_institutions",
    "courses",
    "course_plans",
    "course_images",
    "videos",
    "video_series",
    "video_chapters",
    "video_package_labels",
    "video_package_groups",
    "video_package_relations",
    "video_suppliers",
    "video_supplier_categories",
    "video_supplier_category_videos",
    "orders",
    "order_items",
    "payments",
    "video_enrollments",
    "video_comments",
}

CATEGORY_LABELS = {
    "migrated_from_old": "由老库直接迁移",
    "derived_from_migration": "由迁移结果派生",
    "partially_migrated": "部分迁移",
    "flyway_seed_or_schema": "Flyway/种子/结构",
    "runtime_generated": "新系统运行态",
    "ops_or_external": "运营/抓取/外部数据",
    "manual_or_no_source": "手工数据/无可靠老库源",
    "backup_or_debug": "备份/排障数据",
    "empty_or_not_in_scope": "空表/暂不纳入",
    "uncategorized": "未归类",
}

TABLE_COVERAGE = {
    "agent_work_experiences": ("manual_or_no_source", "当前新库样例为 2026 年手工经纪人履历，老库无稳定来源"),
    "alliance_ambassador_applications": ("manual_or_no_source", "新联盟业务申请，老库无等价来源"),
    "alliance_lecturer721_applications": ("manual_or_no_source", "新联盟业务申请，老库无等价来源"),
    "alliance_partner_applications": ("manual_or_no_source", "新联盟业务申请，老库无等价来源"),
    "bak_course_detail_20260706_01": ("backup_or_debug", "课程详情备份表，不参与业务迁移"),
    "bak_course_detail_after_wrong_source_20260706_01": ("backup_or_debug", "课程详情备份表，不参与业务迁移"),
    "carts": ("partially_migrated", "VIDEO_COURSE 来自 tk_video_cart；OPEN_COURSE 是新系统运行态购物车"),
    "common_regions": ("flyway_seed_or_schema", "行政区划种子数据"),
    "course_enrollments": ("migrated_from_old", "来自公开课订单明细和 tk_course_signup"),
    "course_images": ("migrated_from_old", "来自 tk_course_pic"),
    "course_plans": ("migrated_from_old", "来自 tk_course"),
    "course_reserves": ("runtime_generated", "新系统公开课预约记录，老库无稳定一对一来源"),
    "courses": ("migrated_from_old", "来自 tk_courseinfo/tk_coursedata/tk_course"),
    "crawl_jobs": ("ops_or_external", "抓取任务运行数据"),
    "crawl_sources": ("ops_or_external", "抓取来源配置"),
    "crawled_courses": ("ops_or_external", "抓取中间数据"),
    "crawled_trainers": ("ops_or_external", "抓取中间数据"),
    "demand_follow_ups": ("migrated_from_old", "来自 tk_bid/tk_bid_comments"),
    "demands": ("migrated_from_old", "来自 tk_demand/tk_company_demand/tk_demand_org_find_trainer"),
    "enterprise_buyer_work_experiences": ("empty_or_not_in_scope", "当前参考库无有效业务数据"),
    "flyway_schema_history": ("flyway_seed_or_schema", "Flyway 版本表"),
    "footer_config": ("flyway_seed_or_schema", "页脚配置种子/运营配置"),
    "footer_links": ("flyway_seed_or_schema", "页脚链接种子/运营配置"),
    "home_banners": ("ops_or_external", "首页运营配置"),
    "institution_venues": ("manual_or_no_source", "新系统机构场地，当前样例为 2026 年手工数据"),
    "invoice_requests": ("runtime_generated", "新系统发票申请，老库无稳定一对一来源"),
    "member_provider": ("migrated_from_old", "来自 tk_member_provider"),
    "notification_templates": ("flyway_seed_or_schema", "通知模板种子数据"),
    "ops_materials": ("ops_or_external", "运营素材库"),
    "order_items": ("migrated_from_old", "来自公开课/录播课订单明细"),
    "orders": ("migrated_from_old", "来自公开课/录播课订单"),
    "payments": ("migrated_from_old", "来自公开课/录播课支付记录"),
    "pxb_trainer_related_logs": ("backup_or_debug", "排障记录"),
    "recommendation_slot_configs": ("flyway_seed_or_schema", "推荐位配置种子"),
    "recommended_resources": ("ops_or_external", "推荐资源运营数据"),
    "role_application_change_logs": ("runtime_generated", "新系统角色申请日志"),
    "static_pages": ("flyway_seed_or_schema", "静态页种子/运营配置"),
    "sys_categories": ("flyway_seed_or_schema", "新系统分类种子，迁移时按它做映射"),
    "sys_notifications": ("runtime_generated", "新系统通知运行态"),
    "sys_permissions": ("flyway_seed_or_schema", "权限种子"),
    "sys_role_permissions": ("flyway_seed_or_schema", "角色权限种子"),
    "sys_roles": ("flyway_seed_or_schema", "角色种子"),
    "sys_sensitive_words": ("flyway_seed_or_schema", "敏感词种子"),
    "sys_user_oauth_bindings": ("runtime_generated", "新系统 OAuth 绑定"),
    "sys_user_operation_logs": ("runtime_generated", "新系统操作日志"),
    "sys_user_role_assignments": ("runtime_generated", "新系统角色分配申请/记录"),
    "sys_user_roles": ("migrated_from_old", "来自 tk_member.groupid 和经纪人数据"),
    "sys_user_sessions": ("runtime_generated", "登录会话运行态"),
    "sys_user_tags": ("runtime_generated", "新系统用户标签"),
    "sys_users": ("migrated_from_old", "来自 tk_member/tk_member_ext"),
    "sys_verification_codes": ("runtime_generated", "验证码运行态"),
    "trainer_educations": ("migrated_from_old", "来自 tk_member_education"),
    "trainer_expertise_categories": ("migrated_from_old", "来自 tk_membercate_relation/tk_cate"),
    "trainer_honors": ("migrated_from_old", "来自 tk_member_honor"),
    "trainer_industry_categories": ("migrated_from_old", "来自 tk_membergood_relation/tk_trade"),
    "trainer_lead_messages": ("migrated_from_old", "来自 tk_advices"),
    "trainer_work_experiences": ("migrated_from_old", "来自 tk_member_work"),
    "training_reviews": ("migrated_from_old", "来自 tk_comment_course"),
    "user_agent_trainer_bindings": ("migrated_from_old", "来自 tk_agent_trainer"),
    "user_agents": ("migrated_from_old", "来自 tk_agent_info"),
    "user_assistants": ("manual_or_no_source", "新系统助理角色，当前参考库主要是样例/手工数据"),
    "user_buyers": ("migrated_from_old", "来自 tk_member/tk_member_ext"),
    "user_enterprise_agent_members": ("manual_or_no_source", "新系统企业经纪公司成员关系，老库无稳定来源"),
    "user_enterprise_agent_trainer_bindings": ("manual_or_no_source", "新系统企业经纪公司专家绑定，老库无稳定来源"),
    "user_enterprise_agents": ("manual_or_no_source", "新系统企业经纪公司，老库无稳定来源"),
    "user_enterprise_buyers": ("migrated_from_old", "来自 tk_member/tk_member_ext"),
    "user_favorites": ("migrated_from_old", "来自 tk_course_fav/tk_member_fav/tk_attention"),
    "user_institution_employee_bindings": ("manual_or_no_source", "新系统机构员工绑定，老库无稳定来源"),
    "user_institution_employees": ("manual_or_no_source", "新系统机构员工，老库无稳定来源"),
    "user_institution_trainer_bindings": ("manual_or_no_source", "新系统机构专家绑定，当前样例为 2026 年手工数据"),
    "user_institutions": ("migrated_from_old", "来自 tk_member/tk_member_ext/tk_member_authinfo"),
    "user_likes": ("empty_or_not_in_scope", "当前参考库无有效业务数据"),
    "user_trainer_assistant_bindings": ("manual_or_no_source", "新系统专家助理绑定，老库无稳定来源"),
    "user_trainer_books": ("migrated_from_old", "来自 tk_trainer_books"),
    "user_trainer_case_files": ("manual_or_no_source", "案例附件缺少可靠完整老库来源"),
    "user_trainer_cases": ("migrated_from_old", "来自 tk_comment_course 中案例型/高质量评价"),
    "user_trainer_highlight_files": ("manual_or_no_source", "新系统专家亮点附件，老库无稳定来源"),
    "user_trainer_highlights": ("manual_or_no_source", "新系统专家亮点，老库无稳定来源"),
    "user_trainers": ("migrated_from_old", "来自 tk_member/tk_member_ext/tk_member_authinfo"),
    "user_uc_member_links": ("empty_or_not_in_scope", "当前参考库无有效业务数据"),
    "user_uc_org_links": ("empty_or_not_in_scope", "当前参考库无有效业务数据"),
    "video_chapter_progress": ("runtime_generated", "真实观看进度，不能从订单或权益伪造"),
    "video_chapters": ("migrated_from_old", "来自 tk_video_series"),
    "video_comments": ("migrated_from_old", "来自 tk_video_comment"),
    "video_enrollments": ("migrated_from_old", "来自 tk_video_order/tk_video_order_detail"),
    "video_package_groups": ("migrated_from_old", "来自 tk_video_topic/tk_video_topic_item"),
    "video_package_labels": ("migrated_from_old", "来自 tk_video_topic"),
    "video_package_relations": ("migrated_from_old", "来自 tk_video_package_relation"),
    "video_series": ("migrated_from_old", "来自 tk_video_series"),
    "video_students": ("derived_from_migration", "从有效 video_enrollments 派生"),
    "video_supplier_categories": ("migrated_from_old", "来自录播专题/供应商关系"),
    "video_supplier_category_videos": ("migrated_from_old", "来自录播专题/供应商关系"),
    "video_suppliers": ("migrated_from_old", "来自 tk_video_topic/tk_member"),
    "videos": ("migrated_from_old", "来自 tk_video/tk_video_series"),
}


@dataclass
class TableStats:
    rows: int = 0
    min_id: int | None = None
    max_id: int | None = None
    counters: dict[str, Counter[str]] = field(default_factory=dict)

    def add_id(self, value: int | None) -> None:
        if value is None:
            return
        self.min_id = value if self.min_id is None else min(self.min_id, value)
        self.max_id = value if self.max_id is None else max(self.max_id, value)

    def count(self, column: str, value: object) -> None:
        key = "NULL" if value is None else str(value)
        self.counters.setdefault(column, Counter())[key] += 1


@dataclass
class AuditState:
    table_stats: dict[str, TableStats] = field(default_factory=dict)
    legacy_member_ids_by_group: dict[str, set[int]] = field(default_factory=lambda: {"3": set(), "9": set()})
    legacy_courseinfo_ids: set[int] = field(default_factory=set)
    legacy_course_ids: set[int] = field(default_factory=set)
    legacy_course_pic_ids: set[int] = field(default_factory=set)
    legacy_course_video_ids: set[int] = field(default_factory=set)
    target_user_ids: set[int] = field(default_factory=set)
    target_trainer_user_ids: set[int] = field(default_factory=set)
    target_institution_user_ids: set[int] = field(default_factory=set)
    target_course_ids: set[int] = field(default_factory=set)
    target_course_plan_legacy_ids: set[int] = field(default_factory=set)
    target_course_image_ids: set[int] = field(default_factory=set)
    target_video_ids: set[int] = field(default_factory=set)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit old/new Taoke dump coverage for trainers, institutions, courses, and videos.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--legacy-dump", type=Path, default=DEFAULT_LEGACY_DUMP)
    parser.add_argument("--target-dump", type=Path, default=DEFAULT_TARGET_DUMP)
    parser.add_argument("--target-schema", type=Path, default=DEFAULT_TARGET_SCHEMA)
    parser.add_argument(
        "--matrix",
        action="store_true",
        help="Print a lightweight per-target-table coverage matrix without parsing the legacy dump.",
    )
    parser.add_argument(
        "--with-row-counts",
        action="store_true",
        help="Count INSERT rows from the target dump when printing --matrix.",
    )
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON instead of text.")
    return parser.parse_args(argv)


def split_insert_values(line: str) -> list[str | None]:
    start = line.index("VALUES (") + len("VALUES (")
    raw = line[start:].rstrip("\r\n")
    if raw.endswith(";"):
        raw = raw[:-1]
    if raw.endswith(")"):
        raw = raw[:-1]

    values: list[str | None] = []
    token: list[str] = []
    in_quote = False
    escape = False
    was_quoted = False

    for char in raw:
        if escape:
            token.append(char)
            escape = False
            continue
        if char == "\\" and in_quote:
            escape = True
            continue
        if char == "'":
            in_quote = not in_quote
            was_quoted = True
            continue
        if char == "," and not in_quote:
            values.append(normalize_token("".join(token), was_quoted))
            token = []
            was_quoted = False
            continue
        token.append(char)
    values.append(normalize_token("".join(token), was_quoted))
    return values


def normalize_token(token: str, was_quoted: bool) -> str | None:
    value = token.strip()
    if not was_quoted and value.upper() == "NULL":
        return None
    return value


def parse_columns(path: Path, tables: set[str]) -> dict[str, list[str]]:
    columns: dict[str, list[str]] = {}
    current: str | None = None
    current_columns: list[str] = []

    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            if current is None:
                match = CREATE_RE.match(line)
                if match and match.group("table") in tables:
                    current = match.group("table")
                    current_columns = []
                continue

            column_match = COLUMN_RE.match(line)
            if column_match:
                current_columns.append(column_match.group("column"))
                continue

            if line.startswith(")") or ") ENGINE" in line:
                columns[current] = current_columns
                current = None
                current_columns = []

    return columns


def parse_create_table_names(path: Path) -> list[str]:
    tables: list[str] = []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            match = CREATE_RE.match(line)
            if match:
                tables.append(match.group("table"))
    return tables


def count_insert_rows_by_table(path: Path, tables: set[str] | None = None) -> Counter[str]:
    counts: Counter[str] = Counter()
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            match = INSERT_PREFIX_RE.match(line)
            if not match:
                continue
            table = match.group("table")
            if tables is not None and table not in tables:
                continue
            counts[table] += 1
    return counts


def build_table_matrix(schema_path: Path, target_dump_path: Path | None = None, include_row_counts: bool = False) -> dict[str, object]:
    schema_tables = parse_create_table_names(schema_path)
    table_set = set(schema_tables)
    row_counts: Counter[str] = Counter()
    if include_row_counts and target_dump_path is not None and target_dump_path.exists():
        row_counts = count_insert_rows_by_table(target_dump_path, table_set)

    rows = []
    for table in schema_tables:
        category, note = TABLE_COVERAGE.get(table, ("uncategorized", "需要人工确认覆盖归属"))
        rows.append(
            {
                "table": table,
                "category": category,
                "category_label": CATEGORY_LABELS[category],
                "target_rows": row_counts.get(table, 0) if include_row_counts else None,
                "note": note,
            }
        )

    category_counts: Counter[str] = Counter(row["category"] for row in rows)
    uncategorized = [row["table"] for row in rows if row["category"] == "uncategorized"]
    return {
        "schema_table_count": len(schema_tables),
        "category_counts": dict(sorted(category_counts.items())),
        "uncategorized": uncategorized,
        "tables": rows,
    }


def table_row(columns: dict[str, list[str]], table: str, values: list[str | None]) -> dict[str, str | None]:
    table_columns = columns.get(table, [])
    return {column: values[index] if index < len(values) else None for index, column in enumerate(table_columns)}


def as_int(value: object) -> int | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return int(text)
    except ValueError:
        try:
            return int(float(text))
        except ValueError:
            return None


def count_row(state: AuditState, table: str, row: dict[str, str | None], counter_columns: Iterable[str]) -> None:
    stats = state.table_stats.setdefault(table, TableStats())
    stats.rows += 1
    stats.add_id(as_int(row.get("id")))
    for column in counter_columns:
        if column in row:
            stats.count(column, row.get(column))


def scan_legacy_dump(path: Path, columns: dict[str, list[str]]) -> AuditState:
    state = AuditState()
    counter_columns = {
        "tk_member": ("groupid", "state", "isapprove"),
        "tk_course": ("type", "isopen", "states"),
        "tk_courseinfo": ("type", "isopen", "states", "mold"),
    }

    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            match = INSERT_PREFIX_RE.match(line)
            if not match:
                continue
            table = match.group("table")
            if table not in LEGACY_TABLES:
                continue
            row = table_row(columns, table, split_insert_values(line))
            count_row(state, table, row, counter_columns.get(table, ()))

            if table == "tk_member":
                member_id = as_int(row.get("id"))
                group_id = row.get("groupid")
                if member_id is not None and group_id in state.legacy_member_ids_by_group:
                    state.legacy_member_ids_by_group[str(group_id)].add(member_id)
            elif table == "tk_courseinfo":
                add_to_set(state.legacy_courseinfo_ids, row.get("id"))
            elif table == "tk_course":
                add_to_set(state.legacy_course_ids, row.get("id"))
            elif table == "tk_course_pic":
                add_to_set(state.legacy_course_pic_ids, row.get("id"))
            elif table == "tk_course_video":
                add_to_set(state.legacy_course_video_ids, row.get("video_id"))

    return state


def scan_target_dump(path: Path, columns: dict[str, list[str]]) -> AuditState:
    state = AuditState()
    counter_columns = {
        "sys_user_roles": ("role", "status"),
        "user_trainers": ("status",),
        "user_institutions": ("status", "public_list_eligible"),
        "courses": ("type", "status", "publisher_type", "has_plan"),
        "videos": ("status", "publisher_type", "video_type", "legacy_v_type"),
        "orders": ("status", "legacy_status"),
        "video_comments": ("audit_status", "visible"),
        "video_enrollments": ("status",),
    }

    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            match = INSERT_PREFIX_RE.match(line)
            if not match:
                continue
            table = match.group("table")
            if table not in TARGET_TABLES:
                continue
            row = table_row(columns, table, split_insert_values(line))
            count_row(state, table, row, counter_columns.get(table, ()))

            if table == "sys_users":
                add_to_set(state.target_user_ids, row.get("id"))
            elif table == "user_trainers":
                add_to_set(state.target_trainer_user_ids, row.get("user_id"))
            elif table == "user_institutions":
                add_to_set(state.target_institution_user_ids, row.get("user_id"))
            elif table == "courses":
                add_to_set(state.target_course_ids, row.get("id"))
            elif table == "course_plans":
                add_to_set(state.target_course_plan_legacy_ids, row.get("sort_order"))
            elif table == "course_images":
                add_to_set(state.target_course_image_ids, row.get("id"))
            elif table == "videos":
                add_to_set(state.target_video_ids, row.get("id"))

    return state


def add_to_set(values: set[int], raw: object) -> None:
    value = as_int(raw)
    if value is not None:
        values.add(value)


def coverage(source: set[int], target: set[int], sample_size: int = 10) -> dict[str, object]:
    matched = source & target
    missing = source - target
    extra = target - source
    return {
        "source": len(source),
        "target": len(target),
        "matched": len(matched),
        "missing": len(missing),
        "extra": len(extra),
        "coverage_percent": round((len(matched) / len(source) * 100), 2) if source else 0,
        "missing_sample": sorted(missing)[:sample_size],
        "extra_sample": sorted(extra)[:sample_size],
    }


def merge_table_stats(legacy: AuditState, target: AuditState) -> dict[str, TableStats]:
    stats = dict(legacy.table_stats)
    stats.update(target.table_stats)
    return stats


def build_report(legacy: AuditState, target: AuditState) -> dict[str, object]:
    return {
        "tables": serialize_table_stats(merge_table_stats(legacy, target)),
        "coverage": {
            "trainers_old_group9_to_user_trainers": coverage(
                legacy.legacy_member_ids_by_group["9"],
                target.target_trainer_user_ids,
            ),
            "institutions_old_group3_to_user_institutions": coverage(
                legacy.legacy_member_ids_by_group["3"],
                target.target_institution_user_ids,
            ),
            "courseinfo_to_courses": coverage(legacy.legacy_courseinfo_ids, target.target_course_ids),
            "course_rows_to_course_plans_sort_order": coverage(
                legacy.legacy_course_ids,
                target.target_course_plan_legacy_ids,
            ),
            "course_pic_to_course_images": coverage(legacy.legacy_course_pic_ids, target.target_course_image_ids),
            "course_video_referenced_video_ids_to_videos": coverage(
                legacy.legacy_course_video_ids,
                target.target_video_ids,
            ),
        },
        "notes": [
            "tk_courseinfo.id maps to courses.id for course master records.",
            "tk_course.id is stored in course_plans.sort_order by the observed dumps.",
            "tk_course_video only contains course/video relations; the uploaded legacy dump does not contain a full legacy video master table.",
        ],
    }


def serialize_table_stats(stats: dict[str, TableStats]) -> dict[str, object]:
    result = {}
    for table in sorted(stats):
        table_stats = stats[table]
        result[table] = {
            "rows": table_stats.rows,
            "min_id": table_stats.min_id,
            "max_id": table_stats.max_id,
            "counters": {name: dict(counter.most_common()) for name, counter in sorted(table_stats.counters.items())},
        }
    return result


def print_text_report(report: dict[str, object]) -> None:
    print("[tables]")
    tables = report["tables"]
    assert isinstance(tables, dict)
    for table, raw_stats in tables.items():
        stats = raw_stats
        assert isinstance(stats, dict)
        id_range = ""
        if stats.get("min_id") is not None:
            id_range = f" id={stats.get('min_id')}..{stats.get('max_id')}"
        print(f"{table}: rows={stats['rows']}{id_range}")
        counters = stats.get("counters") or {}
        assert isinstance(counters, dict)
        for column, values in counters.items():
            assert isinstance(values, dict)
            top_values = ", ".join(f"{key}={value}" for key, value in list(values.items())[:12])
            print(f"  {column}: {top_values}")

    print()
    print("[coverage]")
    coverage_map = report["coverage"]
    assert isinstance(coverage_map, dict)
    for name, raw_section in coverage_map.items():
        section = raw_section
        assert isinstance(section, dict)
        print(
            f"{name}: source={section['source']} target={section['target']} "
            f"matched={section['matched']} missing={section['missing']} "
            f"extra={section['extra']} coverage={section['coverage_percent']}%"
        )
        if section["missing_sample"]:
            print(f"  missing_sample={section['missing_sample']}")
        if section["extra_sample"]:
            print(f"  extra_sample={section['extra_sample']}")

    print()
    print("[notes]")
    for note in report["notes"]:
        print(f"- {note}")


def print_table_matrix(report: dict[str, object]) -> None:
    print("[summary]")
    print(f"schema_table_count={report['schema_table_count']}")
    category_counts = report["category_counts"]
    assert isinstance(category_counts, dict)
    for category, count in category_counts.items():
        print(f"{category} ({CATEGORY_LABELS[category]}): {count}")

    uncategorized = report["uncategorized"]
    assert isinstance(uncategorized, list)
    if uncategorized:
        print(f"uncategorized={', '.join(uncategorized)}")

    print()
    print("[tables]")
    rows = report["tables"]
    assert isinstance(rows, list)
    for row in rows:
        assert isinstance(row, dict)
        row_text = ""
        if row["target_rows"] is not None:
            row_text = f" rows={row['target_rows']}"
        print(f"{row['table']}: {row['category']} ({row['category_label']}){row_text} - {row['note']}")


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    if args.matrix:
        report = build_table_matrix(args.target_schema, args.target_dump, include_row_counts=args.with_row_counts)
        if args.json:
            print(json.dumps(report, ensure_ascii=False, indent=2))
        else:
            print_table_matrix(report)
        return

    legacy_columns = parse_columns(args.legacy_dump, LEGACY_TABLES)
    target_columns = parse_columns(args.target_schema if args.target_schema.exists() else args.target_dump, TARGET_TABLES)
    legacy = scan_legacy_dump(args.legacy_dump, legacy_columns)
    target = scan_target_dump(args.target_dump, target_columns)
    report = build_report(legacy, target)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_text_report(report)


if __name__ == "__main__":
    main()
