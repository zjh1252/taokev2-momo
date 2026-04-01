package com.taoke.common.service.impl;

import com.taoke.common.dto.RegionDetailVO;
import com.taoke.common.dto.RegionVO;
import com.taoke.common.entity.Region;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.repository.RegionRepository;
import com.taoke.common.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 行政区划查询服务实现。
 * <p>
 * 地区数据为静态字典，本服务使用应用内 ConcurrentHashMap 缓存，
 * 避免每次请求都查库。缓存按 parentCode 维度存储子级列表。
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {

    /** 顶级省份的 parentCode 约定值 */
    private static final String ROOT_PARENT_CODE = "0";

    private final RegionRepository regionRepository;

    /** 子级列表缓存：parentCode → List<RegionVO> */
    private final Map<String, List<RegionVO>> childrenCache = new ConcurrentHashMap<>();

    /** hasChildren 缓存：code → Boolean */
    private final Map<String, Boolean> hasChildrenCache = new ConcurrentHashMap<>();

    @Override
    public List<RegionVO> getChildren(String parentCode) {
        String key = normalizeParentCode(parentCode);
        return childrenCache.computeIfAbsent(key, this::loadChildren);
    }

    @Override
    public RegionDetailVO getDetail(String code) {
        Region region = regionRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "地区不存在: " + code));

        List<RegionVO> path = buildPath(region);

        RegionDetailVO detail = new RegionDetailVO();
        detail.setCode(region.getCode());
        detail.setName(region.getName());
        detail.setLevel(region.getLevel());
        detail.setPath(path);
        return detail;
    }

    @Override
    public List<RegionVO> search(String keyword, Integer level) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        List<Region> regions = regionRepository.searchByKeyword(keyword.trim(), level);
        return regions.stream()
                .map(r -> new RegionVO(r.getCode(), r.getName(), r.getLevel(), checkHasChildren(r.getCode())))
                .toList();
    }

    // ==================== 内部方法 ====================

    private List<RegionVO> loadChildren(String parentCode) {
        List<Region> children = regionRepository.findByParentCodeOrderByCodeAsc(parentCode);
        return children.stream()
                .map(r -> new RegionVO(r.getCode(), r.getName(), r.getLevel(), checkHasChildren(r.getCode())))
                .toList();
    }

    /**
     * 从当前地区向上递归，构建从省到当前层级的路径链
     */
    private List<RegionVO> buildPath(Region current) {
        List<RegionVO> path = new ArrayList<>();
        Region node = current;
        while (node != null) {
            path.add(new RegionVO(node.getCode(), node.getName(), node.getLevel(), null));
            if (ROOT_PARENT_CODE.equals(node.getParentCode())) {
                break;
            }
            node = regionRepository.findByCode(node.getParentCode()).orElse(null);
        }
        Collections.reverse(path);
        return path;
    }

    private Boolean checkHasChildren(String code) {
        return hasChildrenCache.computeIfAbsent(code, regionRepository::existsByParentCode);
    }

    private String normalizeParentCode(String parentCode) {
        if (parentCode == null || parentCode.isBlank()) {
            return ROOT_PARENT_CODE;
        }
        return parentCode.trim();
    }
}
