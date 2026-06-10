'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import {
  resolveImageSrc,
  DEFAULT_TRAINER_AVATAR,
  isUnreliableLegacyImageHost,
} from '@/lib/media';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onError'> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
  fill?: boolean;
  priority?: boolean;
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;

function needsNoReferrer(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/** 旧站 middle 头像常见 jpg/png 互斥，失败时尝试另一扩展名 */
function alternateMiddleAvatarUrl(url: string): string | null {
  const m = url.match(/^(.*\/attachments\/user\/middle\/\d+\/\d+)\.(jpe?g|png)$/i);
  if (!m) return null;
  const base = m[1];
  const ext = m[2].toLowerCase();
  return ext === 'png' ? `${base}.jpg` : `${base}.png`;
}

/**
 * 带加载失败回退的图片（原生 img，受控 src）。
 */
export function SafeImage({
  src,
  fallback = DEFAULT_TRAINER_AVATAR,
  alt,
  priority,
  loading,
  fill,
  width,
  height,
  className,
  style,
  ...rest
}: SafeImageProps) {
  const resolved = useMemo(() => resolveImageSrc(src, fallback), [src, fallback]);
  const [displaySrc, setDisplaySrc] = useState(resolved);
  const retryCountRef = useRef(0);
  const onFallbackRef = useRef(false);
  const triedAltExtRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplaySrc(resolved);
    retryCountRef.current = 0;
    onFallbackRef.current = false;
    triedAltExtRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [resolved]);

  useEffect(
    () => () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    },
    [],
  );

  const handleError = () => {
    if (onFallbackRef.current) return;
    if (displaySrc === fallback) return;

    if (!triedAltExtRef.current) {
      const alt = alternateMiddleAvatarUrl(displaySrc);
      if (alt && alt !== displaySrc) {
        triedAltExtRef.current = true;
        setDisplaySrc(alt);
        return;
      }
    }

    // 91pxb 等源站大面积失效，跳过重试直接降级占位图
    if (isUnreliableLegacyImageHost(displaySrc) || isUnreliableLegacyImageHost(resolved)) {
      onFallbackRef.current = true;
      setDisplaySrc(fallback);
      return;
    }

    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      retryTimerRef.current = setTimeout(() => {
        const sep = resolved.includes('?') ? '&' : '?';
        setDisplaySrc(`${resolved}${sep}_retry=${retryCountRef.current}`);
      }, RETRY_DELAY_MS * retryCountRef.current);
      return;
    }

    onFallbackRef.current = true;
    setDisplaySrc(fallback);
  };

  const imgStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={displaySrc}
      alt={alt ?? ''}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : loading === 'eager' ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy={needsNoReferrer(displaySrc) ? 'no-referrer' : undefined}
      className={className}
      style={imgStyle}
      onError={handleError}
    />
  );
}
