package com.taoke.common.service;

import com.taoke.common.util.LegacyAvatarUrls;

/**
 * 运营素材库默认素材解析（跨模块只读能力，实现位于 course 模块）。
 * <p>
 * 系统从默认素材池自动填充时不计入 {@code usage_count}。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-06-15 18:00
 */
public interface OpsMaterialResolver {

    /**
     * 从已启用且标记为默认的素材池中，按种子稳定随机选取一条 URL。
     *
     * @param materialType {@code COVER} 或 {@code AVATAR}
     * @param category     封面分类名；头像传 null
     * @param scene        适用场景编码，如 {@code OPEN}、{@code VIDEO}、{@code TRAINER}
     * @param seed         稳定随机种子（如实体 ID）
     * @return 素材 URL，池为空时返回 null
     */
    String pickDefaultMaterialUrl(String materialType, String category, String scene, int seed);

    /**
     * 课程封面展示：自定义封面 &gt; 可用讲师头像 &gt; 默认封面池 &gt; 空串。
     */
    default String resolveCourseCoverUrl(String coverUrl, String trainerAvatar,
                                         String categoryName, String scene, int seed) {
        if (LegacyAvatarUrls.isUsableCourseCover(coverUrl)) {
            return LegacyAvatarUrls.normalize(coverUrl);
        }
        if (LegacyAvatarUrls.isUsableAvatar(trainerAvatar)) {
            return LegacyAvatarUrls.normalize(trainerAvatar);
        }
        String picked = pickDefaultMaterialUrl("COVER", categoryName, scene, seed);
        return picked != null ? picked : "";
    }

    /**
     * 头像展示：可用自定义头像 &gt; 默认头像池（可选）&gt; 空串。
     */
    default String resolveAvatarUrl(String avatarUrl, String scene, boolean allowDefault, int seed) {
        if (LegacyAvatarUrls.isUsableAvatar(avatarUrl)) {
            return LegacyAvatarUrls.normalize(avatarUrl);
        }
        if (!allowDefault) {
            return "";
        }
        String picked = pickDefaultMaterialUrl("AVATAR", null, scene, seed);
        return picked != null ? picked : "";
    }
}
