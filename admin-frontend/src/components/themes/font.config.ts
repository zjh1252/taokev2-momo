/**
 * 字体配置 — 使用系统字体栈替代 Google Fonts（避免 build 时网络请求）
 *
 * <p>如后续需要恢复 Google Fonts，参考 git history 或 docs/themes.md</p>
 *
 * @author Fangxinxin
 * @date 2026-06-09 16:30
 */

import { cn } from '@/lib/utils';

/**
 * 模拟 next/font/google 的 variable 注入 ——
 * 返回 { variable: string } 以便与现有 fontVariables 拼接方式兼容。
 * CSS 变量值通过 globals.css 或 layout 中的 :root 定义，此处仅声明变量名。
 */

function systemFont(name: string): { variable: string } {
  return { variable: name };
}

// ---- Sans-serif 字体 ----
const fontSans = systemFont('--font-sans');
const fontMono = systemFont('--font-mono');
const fontInstrument = systemFont('--font-instrument');
const fontNotoMono = systemFont('--font-noto-mono');
const fontMullish = systemFont('--font-mullish');
const fontInter = systemFont('--font-inter');
const fontArchitectsDaughter = systemFont('--font-architects-daughter');
const fontDMSans = systemFont('--font-dm-sans');
const fontFiraCode = systemFont('--font-fira-code');
const fontOutfit = systemFont('--font-outfit');
const fontSpaceMono = systemFont('--font-space-mono');
const fontJetBrainsMono = systemFont('--font-jetbrains-mono');
const fontMerriweather = systemFont('--font-merriweather');
const fontPlayfairDisplay = systemFont('--font-playfair-display');

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable,
  fontArchitectsDaughter.variable,
  fontDMSans.variable,
  fontFiraCode.variable,
  fontOutfit.variable,
  fontSpaceMono.variable,
  fontJetBrainsMono.variable,
  fontMerriweather.variable,
  fontPlayfairDisplay.variable
);
