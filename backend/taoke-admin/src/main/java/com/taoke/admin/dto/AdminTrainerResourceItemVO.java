package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台专家详情 — 关联资源摘要项（课程/案例/录播课/精彩瞬间）。
 *
 * @author Fangxinxin
 * @date 2026-06-25 20:00
 */
@Data
public class AdminTrainerResourceItemVO {

    private Integer id;

    /** 资源类型：course / case / video / highlight */
    private String type;

    private String title;

    /** 状态码 */
    private Integer status;

    /** 状态文案 */
    private String statusLabel;

    /** 后台管理页相对路径（前端拼接 origin） */
    private String adminPath;
}
