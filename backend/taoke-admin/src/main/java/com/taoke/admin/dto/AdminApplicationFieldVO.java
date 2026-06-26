package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 通用申请字段（后台详情页渲染）。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
@Data
public class AdminApplicationFieldVO {
    private String fieldName;
    private String fieldLabel;
    private String value;
    /** 本批次是否变更（reapplying 时标记） */
    private Boolean changed;
}
