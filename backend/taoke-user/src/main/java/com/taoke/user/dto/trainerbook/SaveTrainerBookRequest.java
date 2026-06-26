package com.taoke.user.dto.trainerbook;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 保存（新增/更新）专家著作请求 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
@Data
public class SaveTrainerBookRequest {

    @NotBlank(message = "书名不能为空")
    @Size(max = 200, message = "书名长度不超过 200 字符")
    private String title;

    @Size(max = 200, message = "作者名长度不超过 200 字符")
    private String authorName;

    @Size(max = 500, message = "封面图 URL 长度不超过 500 字符")
    private String coverUrl;

    @Size(max = 200, message = "出版社长度不超过 200 字符")
    private String publisher;

    private LocalDate publishDate;

    @Size(max = 1000, message = "简介长度不超过 1000 字符")
    private String description;

    @Size(max = 500, message = "购买链接长度不超过 500 字符")
    private String buyUrl;

    private Integer sortOrder;
}
