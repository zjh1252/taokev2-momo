/** 从底部分类导航 href 解析课程分类 ID */
export function parseCourseCategoryIdFromHref(href: string): number | undefined {
  const query = href.includes('?') ? href.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const multi = params.get('categoryIds');
  if (multi) {
    const n = Number(multi);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const single = params.get('categoryId');
  if (!single) return undefined;
  const n = Number(single);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** 从底部分类导航 href 解析机构擅长领域分类 ID */
export function parseInstitutionCategoryIdFromHref(href: string): number | undefined {
  const query = href.includes('?') ? href.split('?')[1] : '';
  const id = new URLSearchParams(query).get('expertiseCategoryId');
  if (!id) return undefined;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
