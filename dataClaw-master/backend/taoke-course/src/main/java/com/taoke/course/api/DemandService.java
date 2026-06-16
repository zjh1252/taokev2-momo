package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.demand.*;
import com.taoke.course.entity.demand.Demand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 培训需求管理能力接口
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
public interface DemandService {

    // ==================== C 端操作 ====================

    /**
     * 发布需求
     *
     * @param userId 提交人用户 ID
     * @param req    创建请求
     * @return 需求详情
     */
    DemandDetailResponse create(Integer userId, CreateDemandRequest req);

    /**
     * 我的需求列表（分页 + 可选状态筛选）
     *
     * @param userId 当前用户 ID
     * @param status 状态筛选，null 表示全部
     * @param page   页码（从 1 开始）
     * @param size   每页条数
     */
    PageResponse<DemandListResponse> listByUser(Integer userId, Integer status, int page, int size);

    /**
     * 需求详情（C 端，校验归属）
     */
    DemandDetailResponse getDetail(Integer demandId, Integer userId);

    /**
     * 取消需求（企业采购者操作）
     */
    void cancel(Integer demandId, Integer userId);

    // ==================== 后台管理 ====================

    /**
     * 后台分页搜索
     */
    PageResponse<DemandListResponse> adminSearch(Integer status, String demandType,
                                                  String keyword, int page, int size);

    /**
     * 后台需求详情（含跟进记录）
     */
    DemandDetailResponse adminGetDetail(Integer demandId);

    /**
     * 变更需求状态（管理端操作）
     */
    void changeStatus(Integer demandId, Integer newStatus, String content, Integer operatorId);

    /**
     * 添加跟进记录（管理端操作）
     */
    void addFollowUp(Integer demandId, String action, String content, Integer operatorId);
}
