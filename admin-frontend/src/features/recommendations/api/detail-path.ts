/** 根据模板生成推荐资源详情链接（RSC 可序列化，勿在 config 中传函数） */
export function resolveRecommendationDetailPath(
  template: string,
  resourceId: number
): string {
  if (template.includes('{id}')) {
    return template.replaceAll('{id}', String(resourceId));
  }
  return template;
}
