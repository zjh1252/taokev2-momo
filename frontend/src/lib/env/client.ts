// 客户端环境变量（NEXT_PUBLIC_* 前缀）

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL 未配置');
  }
  return url;
}

export function getCdnBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CDN_BASE_URL || getApiBaseUrl();
}
