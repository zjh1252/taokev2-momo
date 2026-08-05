package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.CityChannelService;
import com.taoke.course.dto.city.ActiveCityVO;
import com.taoke.course.dto.city.CityChannelDetailVO;
import com.taoke.course.dto.city.CityChannelHomeVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 城市频道公开接口 — 首页底部「城市频道卡片」+ `/cities/[pinyin]` 详情页 SSR 数据源。
 *
 * @author Fangxinxin
 * @date 2026-05-20 17:30
 */
@Tag(name = "城市频道-公开", description = "城市频道聚合接口（游客可访问）")
@RestController
@RequiredArgsConstructor
public class PublicCityChannelController {

    private final CityChannelService cityChannelService;

    @Public
    @Operation(summary = "首页城市频道卡片 — 有有效公开课的城市，按课程数倒序")
    @GetMapping("/cities/active")
    public ApiResponse<List<ActiveCityVO>> activeCities(
            @RequestParam(name = "limit", defaultValue = "9") Integer limit) {
        int safe = limit == null || limit <= 0 ? 9 : Math.min(limit, 50);
        return ApiResponse.ok(cityChannelService.listActiveCities(safe));
    }

    @Public
    @Operation(summary = "按拼音解析城市详情（直辖市拼音自动 fallback 到市辖区）")
    @GetMapping("/cities/{enName}")
    public ApiResponse<CityChannelDetailVO> detail(@PathVariable String enName) {
        return ApiResponse.ok(cityChannelService.resolveByEnName(enName));
    }

    @Public
    @Operation(summary = "城市综合页聚合（详情 + 公开课/内训/录播/机构/专家块）")
    @GetMapping("/cities/{enName}/home")
    public ApiResponse<CityChannelHomeVO> home(@PathVariable String enName) {
        return ApiResponse.ok(cityChannelService.loadHome(enName));
    }
}
