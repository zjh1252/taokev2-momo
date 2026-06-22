# -*- coding: utf-8 -*-
import pymysql, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = pymysql.connect(host='10.0.14.20', port=3306, user='root', password='root', database='v3test')
try:
    cur = conn.cursor()
    # 手机号
    cur.execute("SELECT id, phone, password_hash, username, nickname, uc_uid, user_source, status FROM sys_users WHERE phone = '18867423236'")
    row = cur.fetchone()
    if row:
        print(f"v3test 找到用户: id={row[0]}, phone={row[1]}, username={row[3]}, nickname={row[4]}, uc_uid={row[5]}, source={row[6]}, status={row[7]}")
        print(f"password_hash: {row[2]}")
    else:
        print("v3test 没有这个用户")

    # 按 uc_uid=1463460 查
    cur.execute("SELECT id, phone, password_hash, username, nickname, uc_uid, user_source, status FROM sys_users WHERE uc_uid = 1463460")
    row = cur.fetchone()
    if row:
        print(f"\n按 uc_uid=1463460 找到: id={row[0]}, phone={row[1]}, username={row[3]}, nickname={row[4]}, source={row[6]}, status={row[7]}")
    else:
        print("\nv3test 中 uc_uid=1463460 不存在")

finally:
    conn.close()
