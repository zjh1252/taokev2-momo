package com.taoke.admin.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 后台录播课评论列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminVideoCommentQuery {

    private int page = 1;

    private int size = 10;

    /** 审核状态：0待审核 1已通过 2已驳回 */
    private Integer auditStatus;

    private String keyword;

    private Integer videoId;
}
