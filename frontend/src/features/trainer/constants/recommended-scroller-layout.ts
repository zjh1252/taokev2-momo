/**
 * 专家列表页「热门培训领域」推荐大卡尺寸 — 与老站 tkw/ 保持一致，禁止改宽高比。
 *
 * 老站单卡约 227×306px；间距 20px（Tailwind mr-5）。
 * 改 CARDS_PER_PAGE 时只扩容器宽度，勿缩放单卡尺寸。
 *
 * @see frontend/src/features/trainer/components/list/TrainerFilters.tsx（侧栏同高 306px）
 */
export const TRAINER_RECOMMENDED_CARD_WIDTH = 227;
export const TRAINER_RECOMMENDED_CARD_HEIGHT = 306;
/** 227 / 306，与老站一致 */
export const TRAINER_RECOMMENDED_CARD_ASPECT = `${TRAINER_RECOMMENDED_CARD_WIDTH}/${TRAINER_RECOMMENDED_CARD_HEIGHT}` as const;
export const TRAINER_RECOMMENDED_CARD_GAP = 20;

export const TRAINER_RECOMMENDED_CARDS_PER_PAGE = 4;

/** 一屏 N 张卡时的容器最大宽度：N×宽 + (N-1)×间距 */
export function trainerRecommendedScrollerMaxWidth(cardsPerPage: number): number {
  return (
    cardsPerPage * TRAINER_RECOMMENDED_CARD_WIDTH
    + (cardsPerPage - 1) * TRAINER_RECOMMENDED_CARD_GAP
  );
}

export const TRAINER_RECOMMENDED_SCROLLER_MAX_WIDTH = trainerRecommendedScrollerMaxWidth(
  TRAINER_RECOMMENDED_CARDS_PER_PAGE,
);
