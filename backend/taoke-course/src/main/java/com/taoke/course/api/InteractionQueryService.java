package com.taoke.course.api;

/**
 * 互动数据只读查询接口 — 供其他模块（如 taoke-admin）注入调用
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface InteractionQueryService {

    /**
     * 查询某资源被收藏次数
     *
     * @param targetType 资源类型（COURSE / TRAINER / INSTITUTION / CASE）
     * @param targetId   资源主键
     */
    long countFavorites(String targetType, int targetId);

    /**
     * 查询某课程/专家已通过评价数
     *
     * @param scope    评价范围（COURSE / TRAINER）
     * @param targetId 课程 ID 或专家 user_id
     */
    long countApprovedReviews(String scope, int targetId);

    /**
     * 判断用户是否已收藏某资源
     */
    boolean isFavorited(int userId, String targetType, int targetId);
}
