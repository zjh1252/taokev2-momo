package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 录播课评论展示 VO
 *
 * @author Fangxinxin
 * @date 2026-06-10 16:00
 */
@Data
public class VideoCommentVO {

    private Integer id;
    private Integer videoId;
    private String userName;
    private String content;
    private Integer rating;
    private LocalDateTime createdAt;
}
