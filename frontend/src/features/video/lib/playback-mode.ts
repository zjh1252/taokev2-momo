import { resolveVideoPlaybackSrc } from '@/lib/media';

export type PlaybackMode = 'direct' | 'embed' | 'unsupported';

/** 实际可播放时的模式（不含 unsupported） */
export type PlayablePlaybackMode = 'direct' | 'embed';

const DIRECT_MEDIA_RE = /\.(mp4|m3u8|webm|mov|m4v|mpd)(\?|$)/i;

const EMBED_HOST_PATTERNS = [
  'youku.com',
  'bilibili.com',
  'tudou.com',
  'iqiyi.com',
  'qq.com',
  'ixigua.com',
  'gensee.com',
  'polyv.net',
  '56.com',
  'ku6.com',
  'sohu.com',
  'haokan.baidu.com',
  'pan.baidu.com',
];

function normalizeForParse(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

function hostMatchesEmbedPlatform(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return EMBED_HOST_PATTERNS.some((pattern) => host.includes(pattern));
}

/** 是否为第三方 iframe 平台（优酷/土豆/B站等，非 PXB 直链） */
export function isThirdPartyEmbedHost(url: string): boolean {
  try {
    return hostMatchesEmbedPlatform(new URL(normalizeForParse(url)).hostname);
  } catch {
    const lower = url.toLowerCase();
    return EMBED_HOST_PATTERNS.some((pattern) => lower.includes(pattern));
  }
}

export function isYoukuPlaybackUrl(url: string): boolean {
  try {
    return new URL(normalizeForParse(url)).hostname.toLowerCase().includes('youku.com');
  } catch {
    return url.toLowerCase().includes('youku.com');
  }
}

export function getThirdPartyWatchLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('youku.com')) return '在优酷观看';
  if (lower.includes('tudou.com')) return '在土豆观看';
  if (lower.includes('bilibili.com')) return '在 B 站观看';
  if (lower.includes('v.qq.com') || lower.includes('qq.com')) return '在腾讯视频观看';
  if (lower.includes('iqiyi.com')) return '在爱奇艺观看';
  return '站外打开';
}

/** 判断解析后的地址应使用的播放方式 */
export function classifyPlaybackUrl(resolved: string, raw = ''): PlaybackMode {
  const value = resolved.trim();
  const rawValue = raw.trim();
  if (!value) return 'unsupported';

  const lower = value.toLowerCase();
  const rawLower = rawValue.toLowerCase();

  if (rawLower.includes('@@') || /^<embed/i.test(rawLower)) {
    return 'unsupported';
  }

  if (/^(eceibs|kuaike|kuanxue|scho):/i.test(rawLower)) {
    return 'embed';
  }

  if (/^courseId=/i.test(rawLower) || /^\/lease\//i.test(rawLower)) {
    return 'embed';
  }

  if (lower.endsWith('.swf')) {
    const embedFromSwf = resolveEmbedPlaybackUrl(value);
    if (embedFromSwf) return 'embed';
    if (!/(youku\.com|polyv\.net)/.test(lower)) {
      return 'unsupported';
    }
  }

  if (
    DIRECT_MEDIA_RE.test(lower)
    || lower.includes('pxb-videos.taoke.com')
    || lower.includes('sc.cdn.kuanxue.com')
    || lower.startsWith('/pxb-videos/')
    || lower.includes('vod-qcloud.com')
    || lower.includes('vod2.myqcloud.com')
    || lower.startsWith('/uploads/')
  ) {
    return 'direct';
  }

  if (lower.includes('preview.kuanxue.com/fsm/')) {
    return 'embed';
  }

  try {
    const host = new URL(normalizeForParse(value)).hostname.toLowerCase();
    if (EMBED_HOST_PATTERNS.some((pattern) => host.includes(pattern))) {
      return 'embed';
    }
  } catch {
    return 'unsupported';
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return 'embed';
  }

  return 'unsupported';
}

/** 第三方页面地址 → iframe embed 地址 */
export function resolveEmbedPlaybackUrl(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;

  const schemeMatch = raw.match(/^(eceibs|kuaike|kuanxue):([^:]+):?(.*)$/i);
  if (schemeMatch) {
    // 第三方需后端签发；kuanxue 签发结果为 mp4 直链
    return null;
  }

  if (/^courseId=/i.test(raw) || /^\/lease\//i.test(raw) || /^scho:/i.test(raw)) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizeForParse(raw));
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const href = parsed.href;

  if (host.includes('youku.com')) {
    const idFromEmbed = href.match(/\/embed\/([^/?#]+)/i)?.[1];
    if (idFromEmbed) return `/legacy-video/youku/${encodeURIComponent(idFromEmbed)}`;
    const idFromPath = href.match(/\/id_([^./?#]+)/i)?.[1];
    if (idFromPath) return `/legacy-video/youku/${encodeURIComponent(idFromPath)}`;
    const sid = href.match(/sid\/([^/?#]+)/i)?.[1];
    if (sid) return `/legacy-video/youku/${encodeURIComponent(sid)}`;
  }

  if (host.includes('bilibili.com')) {
    const bvid = href.match(/\/video\/(BV[^/?#]+)/i)?.[1] ?? parsed.searchParams.get('bvid');
    if (bvid) {
      return `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0&high_quality=1`;
    }
  }

  if (host.includes('iqiyi.com')) {
    const tvid = parsed.searchParams.get('tvid') ?? href.match(/[?&]tvid=([^&]+)/)?.[1];
    if (tvid) {
      return `https://open.iqiyi.com/developer/player_js/coopPlayerIndex.html?vid=${tvid}&tvId=${tvid}`;
    }
  }

  if (host.includes('v.qq.com')) {
    const vid = parsed.searchParams.get('vid') ?? href.match(/[?&]vid=([^&]+)/)?.[1];
    if (vid) return `https://v.qq.com/txp/iframe/player.html?vid=${vid}`;
  }

  if (host.includes('gensee.com')) {
    return href.replace(/^http:/i, 'https:');
  }

  if (host.includes('polyv.net')) {
    const polyvId = href.match(/\/videos\/([^/?#]+)/i)?.[1]?.replace(/_\d+\.swf$/i, '').replace(/\.swf$/i, '');
    if (polyvId) {
      return `https://player.polyv.net/secure/${polyvId}.html`;
    }
  }

  if (host.includes('qq.com') && /\.swf(\?|$)/i.test(href)) {
    const vid = parsed.searchParams.get('vid') ?? href.match(/[?&]vid=([^&]+)/i)?.[1];
    if (vid) return `https://v.qq.com/txp/iframe/player.html?vid=${vid}`;
  }

  if (host.includes('56.com')) {
    const token = href.match(/\/v_([^./?#]+)\.swf/i)?.[1];
    if (token) {
      let vid = token;
      try {
        vid = atob(token.replace(/=+$/, '') + '='.repeat((4 - (token.length % 4)) % 4));
      } catch {
        /* keep token */
      }
      return `https://player.56.com/vod.html?vid=${encodeURIComponent(vid)}`;
    }
  }

  if (host.includes('tudou.com')) {
    const codeFromQuery = parsed.searchParams.get('code');
    if (codeFromQuery) {
      return `https://www.tudou.com/programs/view/html5/embed.action?type=0&code=${encodeURIComponent(codeFromQuery)}`;
    }
    const programCode = href.match(/\/programs\/view\/([^/?#]+)/i)?.[1];
    if (programCode && !programCode.toLowerCase().includes('embed')) {
      return `https://www.tudou.com/programs/view/html5/embed.action?type=0&code=${encodeURIComponent(programCode)}`;
    }
    const legacyCode = href.match(/\/v\/([^/&?#]+)/i)?.[1];
    if (legacyCode) {
      return `https://www.tudou.com/programs/view/html5/embed.action?type=0&code=${encodeURIComponent(legacyCode)}`;
    }
  }

  if (host.includes('ku6.com')) {
    const ku6Id = href.match(/(?:sid\/|v\/)([^/?#]+)/i)?.[1];
    if (ku6Id) return `https://www.ku6.com/embed/${ku6Id}`;
  }

  if (/\.swf(\?|$)/i.test(href)) {
    return null;
  }

  return href.replace(/^http:/i, 'https:');
}

/** 第三方 embed / 原始地址 → 站外观看页（优酷/B站/腾讯等） */
export function resolveThirdPartyWatchUrl(raw: string): string | null {
  const candidates = [raw.trim(), resolveEmbedPlaybackUrl(raw.trim()) ?? ''].filter(Boolean);
  for (const candidate of candidates) {
    let parsed: URL;
    try {
      parsed = new URL(normalizeForParse(candidate));
    } catch {
      continue;
    }
    const host = parsed.hostname.toLowerCase();
    const href = parsed.href;

    if (host.includes('youku.com')) {
      const id =
        href.match(/\/embed\/([^/?#]+)/i)?.[1]
        ?? href.match(/\/id_([^./?#]+)/i)?.[1]
        ?? href.match(/sid\/([^/?#]+)/i)?.[1];
      if (id) return `https://v.youku.com/v_show/id_${id}.html`;
    }

    if (host.includes('bilibili.com')) {
      const bvid =
        href.match(/\/video\/(BV[^/?#]+)/i)?.[1]
        ?? parsed.searchParams.get('bvid');
      if (bvid) return `https://www.bilibili.com/video/${bvid}`;
    }

    if (host.includes('v.qq.com') || (host.includes('qq.com') && parsed.searchParams.get('vid'))) {
      const vid = parsed.searchParams.get('vid') ?? href.match(/[?&]vid=([^&]+)/i)?.[1];
      if (vid) return `https://v.qq.com/x/page/${vid}.html`;
    }

    if (host.includes('iqiyi.com')) {
      const tvid = parsed.searchParams.get('tvid') ?? href.match(/[?&]tvid=([^&]+)/i)?.[1];
      if (tvid) return `https://www.iqiyi.com/v_${tvid}.html`;
    }

    if (host.includes('tudou.com')) {
      const code =
        parsed.searchParams.get('code')
        ?? href.match(/\/programs\/view\/([^/?#]+)/i)?.[1];
      if (code && !code.toLowerCase().includes('embed')) {
        return `https://www.tudou.com/programs/view/${code}/`;
      }
    }

    if (host.includes('56.com') || host.includes('ku6.com') || host.includes('sohu.com')) {
      return href.replace(/^http:/i, 'https:');
    }

    if (host.includes('polyv.net') || host.includes('gensee.com')) {
      return href.replace(/^http:/i, 'https:');
    }

    if (hostMatchesEmbedPlatform(host)) {
      return href.replace(/^http:/i, 'https:');
    }
  }
  return null;
}

/** 章节 raw 是否需后端签发播放地址 */
export function isSignedChapterPlayback(raw?: string | null): boolean {
  const rawValue = raw?.trim() ?? '';
  if (!rawValue) return false;
  return /^(eceibs|kuaike|kuanxue|scho):/i.test(rawValue)
    || rawValue.includes('@@')
    || /^courseId=/i.test(rawValue)
    || /^\/lease\//i.test(rawValue);
}

/** 章节 raw video_url → 可播放地址 + 模式；不可播返回 null */
export function resolveChapterPlayback(raw?: string | null): {
  url: string;
  mode: PlayablePlaybackMode;
  /** 需后端签发播放地址 */
  signed?: boolean;
} | null {
  const rawValue = raw?.trim() ?? '';
  if (isSignedChapterPlayback(rawValue)) {
    return { url: rawValue, mode: 'embed', signed: true };
  }

  if (/\.swf(\?|$)/i.test(rawValue)) {
    const embedFromSwf = resolveEmbedPlaybackUrl(rawValue);
    if (embedFromSwf) {
      return { url: embedFromSwf, mode: 'embed' };
    }
  }

  const resolved = resolveVideoPlaybackSrc(raw);
  if (!resolved) return null;
  const mode = classifyPlaybackUrl(resolved, rawValue);
  if (mode === 'unsupported') return null;
  return { url: resolved, mode };
}
