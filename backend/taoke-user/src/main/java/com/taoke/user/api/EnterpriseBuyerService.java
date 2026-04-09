package com.taoke.user.api;

import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.EnterpriseBuyer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 企业买家档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface EnterpriseBuyerService {

    /**
     * 根据用户 ID 查询企业买家档案。
     */
    EnterpriseBuyerResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的企业买家档案。
     */
    EnterpriseBuyerResponse save(Integer userId, EnterpriseBuyerRequest request);

    /**
     * 提交企业采购方角色申请。
     */
    void apply(Integer userId, EnterpriseBuyerRequest request);

    /**
     * 查询当前用户企业采购方角色的申请状态。
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    // ==================== 后台管理查询 ====================

    /**
     * 后台分页搜索企业采购方（支持公司名/联系电话模糊匹配）
     */
    Page<EnterpriseBuyer> searchForAdmin(String search, Pageable pageable);

    /**
     * 根据 userId 列表批量查询企业采购方档案
     */
    List<EnterpriseBuyer> findByUserIds(List<Integer> userIds);
}
