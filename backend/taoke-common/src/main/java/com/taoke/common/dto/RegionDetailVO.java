package com.taoke.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 地区详情 VO，包含从省到当前层级的完整路径链。
 * <p>
 * 用于回显已选地区时展示完整路径，如"北京市 / 北京市 / 东城区"。
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegionDetailVO {

    /** 行政区划编码 */
    private String code;

    /** 地区名称 */
    private String name;

    /** 层级 */
    private Integer level;

    /** 从省到当前层级的路径链（按层级升序） */
    private List<RegionVO> path;
}
