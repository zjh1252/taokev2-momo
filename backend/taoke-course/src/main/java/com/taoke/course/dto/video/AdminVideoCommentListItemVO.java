package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理后台录播课评论列表项
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminVideoCommentListItemVO {

    private Integer id;

    private Integer videoId;

    private String videoTitle;

    private Integer userId;

    private String userName;

    private String userRoleLabel;

    private String content;

    private Integer auditStatus;

    private String auditStatusLabel;

    private String rejectReason;

    private LocalDateTime createdAt;
}
