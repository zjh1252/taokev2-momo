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

    /** 录播课是否已解锁（免费/已购买未过期/发布者本人；仅 targetType=VIDEO 时有值） */
    private Boolean unlocked;

    /** 资源详情页相对路径（C 端用于点击跳转），如 /trainers/25、/opencourses/12 */
    private String linkUrl;

    private LocalDateTime createdAt;
}
