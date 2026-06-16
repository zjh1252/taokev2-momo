package com.taoke.course.dto.video;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发表录播课评论请求
 *
 * @author Fangxinxin
 * @date 2026-06-10 16:00
 */
@Data
public class SubmitVideoCommentRequest {

    @NotNull(message = "请选择评分")
    @Min(1)
    @Max(5)
    private Integer rating;

    @NotBlank(message = "评论内容不能为空")
    @Size(min = 15, max = 2000, message = "评论内容需在15-2000字之间")
    private String content;
}
