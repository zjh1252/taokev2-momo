package com.taoke.course.dto.interaction;

import lombok.Data;

/**
 * 用户对某资源的互动状态（收藏+点赞）
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class InteractionStateVO {

    private String targetType;
    private Integer targetId;

    /** 是否已收藏 */
    private boolean favorited;

    /** 是否已点赞 */
    private boolean liked;

    /** 收藏总数 */
    private long favoriteCount;

    /** 点赞总数 */
    private long likeCount;
}
