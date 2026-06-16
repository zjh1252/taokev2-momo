/** 机构公开页 URL 段：与老站 /company/{roleid}.htm 对齐 */
export function institutionPublicPathId(
  institution: { id: number; legacyRoleId?: number | null },
): number {
  return institution.legacyRoleId != null && institution.legacyRoleId > 0
    ? institution.legacyRoleId
    : institution.id;
}

export function institutionPublicHref(
  institution: { id: number; legacyRoleId?: number | null },
  basePath = '/company',
): string {
  return `${basePath}/${institutionPublicPathId(institution)}.htm`;
}
