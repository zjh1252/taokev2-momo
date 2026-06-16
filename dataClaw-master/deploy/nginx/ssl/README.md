# Nginx 自签证书（Test 环境）

Nginx **仅监听容器内 443**，宿主机只映射 `443:443`，**不占用宿主机 80**。

证书需包含 SAN：`v2.taoke.com`、`adminv2.taoke.com`。浏览器会提示不受信任，测试环境可继续访问或导入为受信任根证书。

## 一键生成（Linux / macOS / Git Bash）

```bash
cd deploy/nginx/ssl
chmod +x gen-selfsigned.sh
./gen-selfsigned.sh
```

脚本使用 **CSR + 自签 x509** 两步，并带 SAN 扩展；**兼容 macOS 自带 LibreSSL**（不再使用易报错的 `req -x509` 单步）。若在 Apple Silicon / Intel Mac 上安装了 Homebrew `openssl@3`，脚本会**优先使用**其 `openssl` 二进制。

仓库内已配置 `deploy/nginx/ssl/.gitattributes`（`*.sh` / `*.cnf` 强制 `eol=lf`），避免 Windows 检出 CRLF。若仍出现 `env: sh\r: No such file or directory`，在 Mac 上执行：

```bash
sed -i '' $'s/\r$//' gen-selfsigned.sh
```

## 手动生成（与脚本等价）

```bash
cd deploy/nginx/ssl
openssl genrsa -out taoke-selfsigned.key 2048
openssl req -new -key taoke-selfsigned.key -out server.csr -config openssl-req.cnf
openssl x509 -req -days 825 -in server.csr -signkey taoke-selfsigned.key \
  -out taoke-selfsigned.crt \
  -extfile openssl-san.cnf -extensions v3_req
rm -f server.csr
chmod 600 taoke-selfsigned.key
```

## Windows（PowerShell，需已安装 OpenSSL）

在 `deploy\nginx\ssl` 下按上节「手动生成」逐条执行（将 `openssl` 换为完整路径亦可）。

## 文件约定

| 文件名 | 说明 |
|--------|------|
| `openssl-req.cnf` | 生成 CSR 用（无扩展段，兼容 LibreSSL） |
| `openssl-san.cnf` | `x509 -extfile` 用，含 SAN |
| `taoke-selfsigned.crt` | 证书 → 容器内 `/etc/nginx/ssl/taoke-selfsigned.crt` |
| `taoke-selfsigned.key` | 私钥 → 容器内 `/etc/nginx/ssl/taoke-selfsigned.key` |

私钥与证书已加入 `.gitignore`，勿提交仓库。
