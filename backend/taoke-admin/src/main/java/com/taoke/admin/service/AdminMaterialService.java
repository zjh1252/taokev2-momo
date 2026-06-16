package com.taoke.admin.service;



import com.taoke.admin.dto.AdminCreateMaterialRequest;

import com.taoke.admin.dto.AdminMaterialVO;

import com.taoke.admin.dto.AdminUpdateMaterialRequest;

import com.taoke.common.dto.PageResult;

import com.taoke.course.api.OpsMaterialService;

import com.taoke.course.entity.OpsMaterial;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;



import java.util.List;



/**

 * 后台运营素材库编排

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

@Service

@RequiredArgsConstructor

public class AdminMaterialService {



    private final OpsMaterialService opsMaterialService;



    public PageResult<AdminMaterialVO> list(String materialType, String keyword, String category,

                                            String scene, Boolean enabled, Boolean isDefault,

                                            int page, int size) {

        int safePage = Math.max(1, page);

        int safeSize = size <= 0 ? 20 : Math.min(size, 100);

        PageRequest pageable = PageRequest.of(safePage - 1, safeSize,

                Sort.by(Sort.Direction.DESC, "id"));

        Page<OpsMaterial> result = opsMaterialService.listForAdmin(materialType, keyword, category,

                scene, enabled, isDefault, pageable);

        List<AdminMaterialVO> list = result.getContent().stream().map(this::toVo).toList();

        return PageResult.of(result.getTotalElements(), safePage, safeSize, list);

    }



    public AdminMaterialVO create(AdminCreateMaterialRequest request) {

        OpsMaterial m = opsMaterialService.create(

                request.getMaterialType(),

                request.getName(),

                request.getUrl(),

                request.getCategory(),

                request.getScene(),

                request.getEnabled(),

                request.getIsDefault());

        return toVo(m);

    }



    public AdminMaterialVO update(Integer id, AdminUpdateMaterialRequest request) {

        OpsMaterial m = opsMaterialService.update(id, request.getName(), request.getUrl(),

                request.getCategory(), request.getScene(), request.getEnabled(),

                request.getIsDefault());

        return toVo(m);

    }



    public void delete(Integer id) {

        opsMaterialService.delete(id);

    }



    public void setEnabled(Integer id, boolean enabled) {

        opsMaterialService.setEnabled(id, enabled);

    }



    public void setDefault(Integer id, boolean isDefault) {

        opsMaterialService.setDefault(id, isDefault);

    }



    public void batchOperate(List<Integer> ids, String action) {

        opsMaterialService.batchOperate(ids, action);

    }



    private AdminMaterialVO toVo(OpsMaterial m) {

        AdminMaterialVO vo = new AdminMaterialVO();

        vo.setId(m.getId());

        vo.setMaterialType(m.getMaterialType());

        vo.setName(m.getName());

        vo.setUrl(m.getUrl());

        vo.setCategory(m.getCategory());

        vo.setScene(m.getScene());

        vo.setEnabled(m.getEnabled());

        vo.setIsDefault(m.getIsDefault());

        vo.setUsageCount(m.getUsageCount());

        vo.setCreatedAt(m.getCreatedAt());

        return vo;

    }

}

