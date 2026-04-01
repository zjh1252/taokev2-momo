package com.taoke.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 地区列表项 VO，用于级联选择器的逐级加载
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegionVO {

    /** 行政区划编码 */
    private String code;

    /** 地区名称 */
    private String name;

    /** 层级：1=省，2=市，3=区/县，4=街道/乡镇 */
    private Integer level;

    /** 是否有下级地区（前端据此判断能否继续展开） */
    private Boolean hasChildren;
}
