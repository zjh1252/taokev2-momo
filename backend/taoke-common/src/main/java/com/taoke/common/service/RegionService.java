package com.taoke.common.service;

import com.taoke.common.dto.RegionDetailVO;
import com.taoke.common.dto.RegionVO;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 行政区划查询接口
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
public interface RegionService {

    /**
     * 查询指定 parentCode 的下级地区列表。
     * parentCode 为空或 "0" 时返回省级列表。
     *
     * @param parentCode 父级区划编码，空/"0" 表示查省级
     * @return 下级地区列表，按 code 升序
     */
    List<RegionVO> getChildren(String parentCode);

    /**
     * 查询单个地区详情，包含从省到当前层级的完整路径链。
     *
     * @param code 行政区划编码
     * @return 地区详情（含路径链）
     */
    RegionDetailVO getDetail(String code);

    /**
     * 按名称关键词搜索地区。
     *
     * @param keyword 名称关键词
     * @param level   可选层级过滤，null 表示不限
     * @return 匹配结果（最多 20 条）
     */
    List<RegionVO> search(String keyword, Integer level);

    /**
     * 根据地区主键 ID 获取名称，结果带缓存。
     *
     * @param id 地区主键 ID
     * @return 地区名称，不存在时返回空字符串
     */
    String getNameById(Integer id);

    /**
     * 批量根据地区主键 ID 获取名称 Map，高效复用缓存。
     *
     * @param ids 地区主键 ID 集合
     * @return id → name 映射，不存在的 ID 不包含在内
     */
    Map<Integer, String> getNamesByIds(Collection<Integer> ids);
}
