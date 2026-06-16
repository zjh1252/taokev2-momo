import type { TrainerListItem } from '../types';

/** 过滤占位/测试账号，仅保留可对外呈现的后台推荐专家 */
export function isPresentableRecommendedTrainer(trainer: TrainerListItem): boolean {
  const name = (trainer.teachingName || trainer.name || '').trim();
  if (name.length < 2) return false;
  if (/^[a-z]{2,5}$/i.test(name)) return false;

  const intro = (trainer.oneLineIntro || '').trim();
  if (intro && /^[\d\s]+$/.test(intro)) return false;

  const title = (trainer.title || '').trim();
  if (!intro && !title) return false;

  return true;
}
