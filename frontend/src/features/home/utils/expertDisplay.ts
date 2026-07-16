import {
  pickDisplayTitle,
  plainIntroOrUndefined,
  toPlainIntroText
} from '@/features/trainer/utils/displayTitle';
import type { Expert } from '../types';

/** 短于该长度的简介视为需从详情补全长文案 */
export const SHORT_EXPERT_BIO_CHARS = 48;
/** 首页卡片正文最大字数，避免把详情全文塞进 DOM */
export const HOME_EXPERT_BIO_MAX_CHARS = 160;

export function isShortExpertBio(bio?: string | null): boolean {
  const plain = toPlainIntroText(bio);
  return !plain || plain.length <= SHORT_EXPERT_BIO_CHARS;
}

export function textsEssentiallyEqual(a?: string | null, b?: string | null): boolean {
  const left = toPlainIntroText(a);
  const right = toPlainIntroText(b);
  return Boolean(left) && left === right;
}

/** 截取适合卡片展示的纯文本简介 */
export function clipExpertBio(text?: string | null, max = HOME_EXPERT_BIO_MAX_CHARS): string {
  const plain = toPlainIntroText(text);
  if (!plain) return '';
  if (plain.length <= max) return plain;
  const sliced = plain.slice(0, max);
  const boundary = Math.max(
    sliced.lastIndexOf('。'),
    sliced.lastIndexOf('；'),
    sliced.lastIndexOf(' ')
  );
  const clipped = boundary > max * 0.5 ? sliced.slice(0, boundary + 1) : sliced;
  return `${clipped.replace(/\s+$/g, '')}…`;
}

export interface ExpertCardCopy {
  /** 主卡姓名旁职位（与一句话去重） */
  title?: string;
  /** 主卡红字一句话 */
  subtitle?: string;
  /** 卡片正文长简介 */
  bio?: string;
  /** 侧卡姓名下方短文案 */
  underName?: string;
}

function distinctTitle(
  title: string | undefined,
  ...others: Array<string | undefined>
): string | undefined {
  if (!title) return undefined;
  if (others.some((other) => other && textsEssentiallyEqual(title, other))) {
    return undefined;
  }
  return title;
}

/**
 * 组装首页专家卡片文案：头衔 / 一句话 / 长简介去重，避免重复行与空节点。
 */
export function getExpertCardCopy(expert: Expert): ExpertCardCopy {
  const name = expert.name?.trim() || '';
  const oneLine = plainIntroOrUndefined(expert.subtitle);
  const rawBio = plainIntroOrUndefined(expert.bio);
  const title = pickDisplayTitle(expert.title, name);

  const longBio =
    rawBio && oneLine && !textsEssentiallyEqual(rawBio, oneLine)
      ? rawBio
      : rawBio && !oneLine
        ? rawBio
        : undefined;
  const shortLine = oneLine || (rawBio && !longBio ? rawBio : undefined);

  if (longBio && shortLine) {
    return {
      title: distinctTitle(title, shortLine, longBio),
      subtitle: shortLine,
      bio: longBio,
      underName: distinctTitle(title, shortLine) || shortLine
    };
  }

  if (longBio) {
    return {
      title: distinctTitle(title, longBio),
      bio: longBio,
      underName: distinctTitle(title, longBio)
    };
  }

  if (shortLine) {
    return {
      title: distinctTitle(title, shortLine),
      subtitle: shortLine,
      underName: distinctTitle(title, shortLine) || shortLine
    };
  }

  return {
    title: title || undefined,
    underName: title || undefined
  };
}
