package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台专家详情 — 著作摘要。
 *
 * @author Fangxinxin
 * @date 2026-06-25 20:00
 */
@Data
public class AdminTrainerBookItemVO {

    private Integer id;
    private String title;
    private String author;
    private Integer status;
    private String statusLabel;
}
