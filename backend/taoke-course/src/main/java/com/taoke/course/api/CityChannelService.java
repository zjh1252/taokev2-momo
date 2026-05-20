package com.taoke.course.api;

import com.taoke.course.dto.city.ActiveCityVO;
import com.taoke.course.dto.city.CityChannelDetailVO;

import java.util.List;

/**
 * 城市频道服务 — 聚合「有有效公开课的城市」+ 城市拼音 URL 解析。
 *
 * <p>仅服务城市频道业务（首页底部卡片 + /cities/[pinyin] 详情页），不参与其他业务的地区选择。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-20 17:00
 */
public interface CityChannelService {

    /**
     * 查询「有有效公开课」的城市列表，按未开课的有效公开课数量倒序，限制返回条数。
     *
     * @param limit 最大返回条数（&gt;=1，建议传 9）
     * @return 按 courseCount 倒序的城市聚合项；可能少于 limit
     */
    List<ActiveCityVO> listActiveCities(int limit);

    /**
     * 按城市拼音（en_name）解析城市详情。直辖市的省级拼音（如 beijing/shanghai）自动 fallback 到下属市辖区，
     * 保证返回的 cityRegionId 与 course_plans.city_id 一致。
     *
     * @param enName URL slug 拼音
     * @return 城市详情；未匹配到时返回 null
     */
    CityChannelDetailVO resolveByEnName(String enName);
}
