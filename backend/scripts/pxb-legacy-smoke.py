#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培训宝 legacy API 联调脚本 — 复刻 PHP create_signature / checked_signature。

用法示例：
  # 冒烟（默认 localhost:8080）
  python pxb-legacy-smoke.py suite

  # 单个 opt
  python pxb-legacy-smoke.py call --opt courseList --uid 123456
  python pxb-legacy-smoke.py call --opt getCourseTopic --uid 123456
  python pxb-legacy-smoke.py call-get --opt trainer --param trainer_name=张三
  python pxb-legacy-smoke.py call-get --opt video_state --param video_id=1001
  python pxb-legacy-smoke.py call-trainer --opt get_trainer_list --param trade=1
  python pxb-legacy-smoke.py call-trainer --opt get_trainer_detail --param role_id=123
  python pxb-legacy-smoke.py call --opt adsList

  # 仅打印签名（不发起 HTTP）
  python pxb-legacy-smoke.py sign --opt courseList

  # 移动站播放 + 并发心跳
  python pxb-legacy-smoke.py player --cdbid 123456 --video-id 1001
  python pxb-legacy-smoke.py getdata --action concurrencyLimiter --resource-id tk_vco_1_1001 --target-id abc123

环境变量（可选）：
  PXB_LEGACY_BASE_URL   默认 http://localhost:8080
  PXB_LEGACY_APPID      默认 pxb
  PXB_LEGACY_SECRET     默认 fn234gyty4542（与 application.yaml taoke.legacy-api 一致）
  PXB_LEGACY_UID        培训宝 cdbid / uc_uid
  PXB_LEGACY_ROOT_ID    pxb_root_id
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_SECRET = "fn234gyty4542"
DEFAULT_APPID = "pxb"
DEFAULT_BASE = "http://localhost:8080"

def sign_get(appid: str, opt: str, secret: str, timestamp: int | None = None) -> tuple[int, str]:
    """get.php 与 search_course 使用相同签名串（appid + opt + timetamp）。"""
    return sign_search_course(appid, opt, secret, timestamp)


# 冒烟套件：opt -> POST body 字段（不含 uid，由 CLI 注入）
SUITE_OPTS: list[tuple[str, dict[str, str], str]] = [
    ("adsList", {"type": "video"}, "search_course"),
    ("getCourseTopic", {"order_supplier": "no"}, "search_course"),
    ("courseList", {"ctype": "3", "start": "0", "perpage": "5"}, "search_course"),
    ("getAccountBuyVideos", {}, "search_course"),
    ("getCourseBuyStatus", {"ctype": "3", "courseids": "1"}, "search_course"),
    ("videoSupplierNext", {"video_id": "1"}, "search_course"),
    ("trainer", {"trainer_name": "张"}, "get"),
    ("video_state", {"video_id": "1"}, "get"),
    ("get_trainer_list", {"trade": "1"}, "trainer"),
    ("get_trainer_detail", {"role_id": "1"}, "trainer"),
]


def php_urlencode(value: str) -> str:
    """对齐 PHP urlencode / Java URLEncoder（空格为 +）。"""
    return urllib.parse.quote_plus(value, safe="")


def sign_sorted(data: dict[str, str], secret: str) -> str:
    """ksort → http_build_query → md5(query + secret)。"""
    query = "&".join(
        f"{php_urlencode(k)}={php_urlencode(v)}" for k, v in sorted(data.items())
    )
    return hashlib.md5((query + secret).encode("utf-8")).hexdigest()


def sign_search_course(appid: str, opt: str, secret: str, timestamp: int | None = None) -> tuple[int, str]:
    ts = int(timestamp if timestamp is not None else time.time())
    payload = {"appid": appid, "opt": opt, "timetamp": str(ts)}
    return ts, sign_sorted(payload, secret)


def sign_player(appid: str, cdbid: int, video_id: int, secret: str, timestamp: int | None = None) -> tuple[int, str]:
    ts = int(timestamp if timestamp is not None else time.time())
    payload = {
        "appid": appid,
        "cdbid": str(cdbid),
        "timetamp": str(ts),
        "video_id": str(video_id),
    }
    return ts, sign_sorted(payload, secret)


def http_post_form(url: str, query: dict[str, str], body: dict[str, str] | None = None, timeout: float = 30.0) -> tuple[int, str]:
    full_url = url + "?" + urllib.parse.urlencode(query)
    data = urllib.parse.urlencode(body or {}).encode("utf-8")
    req = urllib.request.Request(
        full_url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def http_get(url: str, query: dict[str, str], timeout: float = 30.0) -> tuple[int, str]:
    full_url = url + "?" + urllib.parse.urlencode(query)
    req = urllib.request.Request(full_url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def pretty_json(raw: str) -> str:
    try:
        return json.dumps(json.loads(raw), ensure_ascii=False, indent=2)
    except json.JSONDecodeError:
        return raw


def call_search_course(
    base: str,
    appid: str,
    secret: str,
    opt: str,
    uid: int = 0,
    pxb_root_id: int = 0,
    extra_body: dict[str, str] | None = None,
    verbose: bool = True,
) -> bool:
    ts, sig = sign_search_course(appid, opt, secret)
    query = {"opt": opt, "appid": appid, "timetamp": str(ts), "signature": sig}
    body: dict[str, str] = dict(extra_body or {})
    if uid > 0:
        body["uid"] = str(uid)
    if pxb_root_id > 0:
        body["pxb_root_id"] = str(pxb_root_id)

    url = base.rstrip("/") + "/api/search_course.php"
    if verbose:
        print(f"\n=== POST {url}")
        print(f"    query: {query}")
        if body:
            print(f"    body:  {body}")

    status, text = http_post_form(url, query, body)
    ok = status == 200 and text.strip() != "Access Denied"

    if verbose:
        print(f"    HTTP {status}  {'OK' if ok else 'FAIL'}")
        print(pretty_json(text))

    return ok


def call_get(
    base: str,
    appid: str,
    secret: str,
    opt: str,
    extra_query: dict[str, str] | None = None,
    extra_body: dict[str, str] | None = None,
    verbose: bool = True,
) -> bool:
    ts, sig = sign_get(appid, opt, secret)
    query = {"opt": opt, "appid": appid, "timetamp": str(ts), "signature": sig}
    if extra_query:
        query.update(extra_query)
    body: dict[str, str] = dict(extra_body or {})

    url = base.rstrip("/") + "/api/get.php"
    if verbose:
        print(f"\n=== POST {url}")
        print(f"    query: {query}")
        if body:
            print(f"    body:  {body}")

    status, text = http_post_form(url, query, body)
    ok = status == 200 and text.strip() != "Access Denied"

    if verbose:
        print(f"    HTTP {status}  {'OK' if ok else 'FAIL'}")
        print(pretty_json(text))

    return ok


def call_trainer(
    base: str,
    appid: str,
    secret: str,
    opt: str,
    extra_body: dict[str, str] | None = None,
    verbose: bool = True,
) -> bool:
    ts, sig = sign_get(appid, opt, secret)
    query = {"opt": opt, "appid": appid, "timetamp": str(ts), "signature": sig}
    body: dict[str, str] = dict(extra_body or {})

    url = base.rstrip("/") + "/api/trainer.php"
    if verbose:
        print(f"\n=== POST {url}")
        print(f"    query: {query}")
        if body:
            print(f"    body:  {body}")

    status, text = http_post_form(url, query, body)
    ok = status == 200 and text.strip() != "Access Denied"
    if ok:
        try:
            parsed = json.loads(text)
            ok = parsed.get("isok") is True
        except json.JSONDecodeError:
            ok = False

    if verbose:
        print(f"    HTTP {status}  {'OK' if ok else 'FAIL'}")
        print(pretty_json(text))

    return ok


GOLDEN_COURSE_LIST_SIG = "354c97b0688a485da6d818584dd6247e"  # ts=1719000000, appid=pxb, opt=courseList


def cmd_check_sign(_: argparse.Namespace) -> int:
    """离线校验 Python 签名与 Java/PHP 金样一致（无需启动服务）。"""
    ts = 1719000000
    sig = sign_search_course("pxb", "courseList", DEFAULT_SECRET, ts)[1]
    if sig != GOLDEN_COURSE_LIST_SIG:
        print(f"FAIL: expected {GOLDEN_COURSE_LIST_SIG}, got {sig}", file=sys.stderr)
        return 1
    print(f"OK: courseList signature = {sig}")
    return 0


def cmd_sign(args: argparse.Namespace) -> int:
    if args.kind == "player":
        if args.cdbid <= 0 or args.video_id <= 0:
            print("player 签名需要 --cdbid 与 --video-id", file=sys.stderr)
            return 1
        ts, sig = sign_player(args.appid, args.cdbid, args.video_id, args.secret, args.timestamp)
        print(f"timetamp={ts}")
        print(f"signature={sig}")
        q = urllib.parse.urlencode({
            "c": "taokevideo", "a": "player", "from": "pxbmobile",
            "cdbid": args.cdbid, "timestamp": ts, "video_id": args.video_id,
            "token": sig, "app_id": args.appid,
        })
        print(f"curl示例: curl '{args.base.rstrip('/')}/?{q}&video_url=...'")
    else:
        ts, sig = sign_search_course(args.appid, args.opt, args.secret, args.timestamp)
        print(f"timetamp={ts}")
        print(f"signature={sig}")
        print(f"curl示例:")
        q = urllib.parse.urlencode({"opt": args.opt, "appid": args.appid, "timetamp": ts, "signature": sig})
        print(f"  curl -X POST '{args.base.rstrip('/')}/api/search_course.php?{q}' -d 'uid={args.uid}'")
    return 0


def cmd_call(args: argparse.Namespace) -> int:
    extra = parse_kv_pairs(args.param)
    if getattr(args, "api", "search_course") == "get":
        ok = call_get(args.base, args.appid, args.secret, args.opt, extra_body=extra)
    else:
        ok = call_search_course(
            args.base, args.appid, args.secret, args.opt,
            uid=args.uid, pxb_root_id=args.root_id, extra_body=extra,
        )
    return 0 if ok else 1


def cmd_call_get(args: argparse.Namespace) -> int:
    extra = parse_kv_pairs(args.param)
    ok = call_get(args.base, args.appid, args.secret, args.opt, extra_body=extra)
    return 0 if ok else 1


def cmd_call_trainer(args: argparse.Namespace) -> int:
    extra = parse_kv_pairs(args.param)
    ok = call_trainer(args.base, args.appid, args.secret, args.opt, extra_body=extra)
    return 0 if ok else 1


def cmd_suite(args: argparse.Namespace) -> int:
    print(f"Base URL : {args.base}")
    print(f"AppID    : {args.appid}")
    print(f"UID      : {args.uid or '(未设置，部分 opt 可能返回空)'}")
    print(f"Root ID  : {args.root_id or 0}")

    passed = 0
    failed = 0
    for opt, extra, api in SUITE_OPTS:
        if api == "get":
            ok = call_get(args.base, args.appid, args.secret, opt, extra_body=extra)
        elif api == "trainer":
            ok = call_trainer(args.base, args.appid, args.secret, opt, extra_body=extra)
        else:
            ok = call_search_course(
                args.base, args.appid, args.secret, opt,
                uid=args.uid, pxb_root_id=args.root_id, extra_body=extra,
            )
        if ok:
            passed += 1
        else:
            failed += 1

    print(f"\n=== 结果: {passed} 通过, {failed} 失败 / 共 {passed + failed} ===")
    if args.uid <= 0:
        print("提示: 设置 PXB_LEGACY_UID 或 --uid 为已映射 sys_users.uc_uid，courseList 等才非空。")
    return 0 if failed == 0 else 1


def cmd_player(args: argparse.Namespace) -> int:
    ts, sig = sign_player(args.appid, args.cdbid, args.video_id, args.secret)
    video_url_raw = args.video_url or f"vid={args.video_id}&child=0"
    video_url_b64 = base64.b64encode(video_url_raw.encode("utf-8")).decode("ascii")

    query = {
        "c": "taokevideo",
        "a": "player",
        "from": "pxbmobile",
        "cdbid": str(args.cdbid),
        "timestamp": str(ts),
        "video_id": str(args.video_id),
        "video_url": video_url_b64,
        "token": sig,
        "app_id": args.appid,
    }
    if args.root_id > 0:
        query["pxb_root_id"] = str(args.root_id)

    url = args.base.rstrip("/") + "/"
    print(f"\n=== GET {url}")
    print(f"    query: {query}")
    status, text = http_get(url, query)
    ok = status == 200
    try:
        body = json.loads(text)
        ok = ok and body.get("isok") is True
    except json.JSONDecodeError:
        ok = False
    print(f"    HTTP {status}  {'OK' if ok else 'FAIL'}")
    print(pretty_json(text))
    return 0 if ok else 1


def cmd_getdata(args: argparse.Namespace) -> int:
    payload: dict[str, Any] = {
        "cmd": "video_orders",
        "data": {"action": args.action},
    }
    if args.action == "concurrencyLimiter":
        payload["data"].update({
            "targetId": args.target_id,
            "resourceId": args.resource_id,
            "limit": args.limit,
            "endtime": args.endtime or int(time.time()) + 3600,
        })

    json_str = json.dumps(payload, separators=(",", ":"))
    url = args.base.rstrip("/") + "/getData"
    print(f"\n=== POST {url}")
    print(f"    json: {json_str}")

    status, text = http_post_form(url, {"json": json_str}, body=None)
    ok = status == 200
    try:
        body = json.loads(text)
        ok = ok and body.get("isok") is True
    except json.JSONDecodeError:
        ok = False
    print(f"    HTTP {status}  {'OK' if ok else 'FAIL'}")
    print(pretty_json(text))
    return 0 if ok else 1


def parse_kv_pairs(pairs: list[str] | None) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in pairs or []:
        if "=" not in item:
            continue
        k, v = item.split("=", 1)
        result[k.strip()] = v.strip()
    return result


def env_int(name: str, default: int = 0) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="培训宝 legacy API 联调（签名 + opt）")
    p.add_argument("--base", default=os.environ.get("PXB_LEGACY_BASE_URL", DEFAULT_BASE), help="服务根 URL")
    p.add_argument("--appid", default=os.environ.get("PXB_LEGACY_APPID", DEFAULT_APPID))
    p.add_argument("--secret", default=os.environ.get("PXB_LEGACY_SECRET", DEFAULT_SECRET))
    p.add_argument("--uid", type=int, default=env_int("PXB_LEGACY_UID"), help="培训宝 cdbid / uc_uid")
    p.add_argument("--root-id", type=int, default=env_int("PXB_LEGACY_ROOT_ID"), dest="root_id")

    sub = p.add_subparsers(dest="command", required=True)

    sign_p = sub.add_parser("sign", help="仅计算签名")
    sign_p.add_argument("--opt", default="courseList", help="search_course opt")
    sign_p.add_argument("--kind", choices=["search", "player"], default="search")
    sign_p.add_argument("--cdbid", type=int, default=env_int("PXB_LEGACY_UID"))
    sign_p.add_argument("--video-id", type=int, default=0)
    sign_p.add_argument("--timestamp", type=int, default=None)
    sign_p.set_defaults(func=cmd_sign)

    call_p = sub.add_parser("call", help="调用单个 search_course opt")
    call_p.add_argument("--opt", required=True)
    call_p.add_argument("--param", action="append", help="额外 POST 字段，如 package_id=1")
    call_p.set_defaults(func=cmd_call, api="search_course")

    call_get_p = sub.add_parser("call-get", help="调用单个 get.php opt")
    call_get_p.add_argument("--opt", required=True)
    call_get_p.add_argument("--param", action="append", help="query/body 字段，如 trainer_name=张三")
    call_get_p.set_defaults(func=cmd_call_get)

    call_trainer_p = sub.add_parser("call-trainer", help="调用单个 trainer.php opt")
    call_trainer_p.add_argument("--opt", required=True)
    call_trainer_p.add_argument("--param", action="append", help="POST 字段，如 trade=1 或 role_id=123")
    call_trainer_p.set_defaults(func=cmd_call_trainer)

    suite_p = sub.add_parser("suite", help="运行预设冒烟 opt 列表")
    suite_p.set_defaults(func=cmd_suite)

    check_p = sub.add_parser("check-sign", help="离线校验签名算法（无需 HTTP）")
    check_p.set_defaults(func=cmd_check_sign)

    player_p = sub.add_parser("player", help="taokevideo pxbmobile 播放")
    player_p.add_argument("--cdbid", type=int, default=env_int("PXB_LEGACY_UID"))
    player_p.add_argument("--video-id", type=int, required=True)
    player_p.add_argument("--video-url", default="", help="原始 vid=&child=，默认 vid={video_id}&child=0")
    player_p.set_defaults(func=cmd_player)

    gd_p = sub.add_parser("getdata", help="getData 并发心跳等")
    gd_p.add_argument("--action", default="concurrencyLimiter")
    gd_p.add_argument("--target-id", default="")
    gd_p.add_argument("--resource-id", default="")
    gd_p.add_argument("--limit", type=int, default=1)
    gd_p.add_argument("--endtime", type=int, default=None)
    gd_p.set_defaults(func=cmd_getdata)

    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
