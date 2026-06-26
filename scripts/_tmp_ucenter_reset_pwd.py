# -*- coding: utf-8 -*-
"""临时脚本：通过 UCenter API 重置指定手机号密码"""
import hashlib
import random
import time
import base64
import urllib.request
import urllib.parse
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

UC_KEY = "506cq/cuxBy/XFc5nX4AvOiTDe3QSraUZCV6q+g"
UC_API_URL = "http://shequ.taoke.com/uc_server"
UC_APPID = 2
UC_USER_AGENT = "Taoke-UCenter-Client/2.0"
MOBILE = sys.argv[1] if len(sys.argv) > 1 else "19174428137"
NEW_PASSWORD = sys.argv[2] if len(sys.argv) > 2 else "123456"


def md5_hex(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def rc4(data: bytes, key: bytes) -> bytes:
    key_len = len(key)
    box = list(range(256))
    rndkey = [key[i % key_len] for i in range(256)]
    j = 0
    for i in range(256):
        j = (j + box[i] + rndkey[i]) % 256
        box[i], box[j] = box[j], box[i]
    result = bytearray(len(data))
    a = j = 0
    for i in range(len(data)):
        a = (a + 1) % 256
        j = (j + box[a]) % 256
        box[a], box[j] = box[j], box[a]
        k = box[(box[a] + box[j]) % 256]
        result[i] = data[i] ^ k
    return bytes(result)


def authcode_encode(plaintext: str, key: str) -> str:
    L1 = "latin-1"
    key_md5 = md5_hex(key.encode(L1))
    keya = md5_hex(key_md5[:16].encode(L1))
    keyb = md5_hex(key_md5[16:32].encode(L1))
    rnd = md5_hex(random.randbytes(16))
    keyc = rnd[-4:]
    cryptkey = keya + md5_hex((keya + keyc).encode(L1))
    cryptkey_bytes = cryptkey.encode(L1)
    head = "0000000000"
    mac = md5_hex((plaintext + keyb).encode(L1))[:16]
    prefix = (head + mac).encode(L1)
    body = plaintext.encode(L1)
    data = prefix + body
    result = rc4(data, cryptkey_bytes)
    b64 = base64.b64encode(result).decode("ascii").rstrip("=")
    return keyc + b64


def ucenter_post(action: str, args: dict) -> str:
    agent = md5_hex(UC_USER_AGENT.encode("latin-1"))
    now_sec = int(time.time())
    data = "&".join(f"{k}={v}" for k, v in args.items())
    plain = f"{data}&agent={agent}&time={now_sec}"
    encrypted = authcode_encode(plain, UC_KEY)
    form_data = {
        "m": "user",
        "a": action,
        "inajax": "2",
        "input": encrypted,
        "appid": str(UC_APPID),
    }
    body = urllib.parse.urlencode(form_data).encode("latin-1")
    url = f"{UC_API_URL}/index.php"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": UC_USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="replace")


def first_group(body: str, pattern: str) -> str | None:
    m = re.search(pattern, body, re.DOTALL)
    return m.group(1).strip() if m else None


def main() -> None:
    print(f"=== 查询手机号 {MOBILE} ===")
    lookup = ucenter_post(
        "select_users_by_contact",
        {
            "email": "",
            "mobile": MOBILE,
            "telephone": "",
            "emailstatus": "",
            "mobilestatus": "",
        },
    )
    uid = first_group(lookup, r"<item id=\"uid\"><!\[CDATA\[(\d+)\]\]></item>")
    username = first_group(lookup, r"<item id=\"username\"><!\[CDATA\[([^\]]*)\]\]></item>")
    email = first_group(lookup, r"<item id=\"email\"><!\[CDATA\[([^\]]*)\]\]></item>")
    print(f"uid={uid}, username={username}, email={email}")

    if not username:
        print("未找到该手机号对应的 UCenter 账号")
        sys.exit(1)

    print(f"\n=== 重置密码 {username} -> {NEW_PASSWORD} ===")
    edit_resp = ucenter_post(
        "edit",
        {
            "username": username,
            "oldpw": "",
            "newpw": NEW_PASSWORD,
            "email": "",
            "ignoreoldpw": "1",
        },
    ).strip()
    print("edit 响应:", edit_resp)

    print(f"\n=== 验证登录 {MOBILE} / {NEW_PASSWORD} ===")
    login_resp = ucenter_post(
        "login",
        {"username": MOBILE, "password": NEW_PASSWORD, "isuid": "0"},
    ).strip()
    if uid and uid in login_resp:
        print("登录成功")
    else:
        print("登录失败")
    print(login_resp[:600])


if __name__ == "__main__":
    main()
