package com.taoke.course.dto.interaction;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏列表视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class FavoriteVO {

    private Integer id;
    private String targetType;
    private Integer targetId;

    /** 资源标题（回填快照） */
    private String title;

    /** 资源描述/副标题 */
    private String subtitle;

    /** 资源封面图 */
    private String coverUrl;

    private LocalDateTime createdAt;
}
