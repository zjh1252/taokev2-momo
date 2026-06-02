package com.taoke.user.api;

import com.taoke.user.dto.trainercase.*;
import com.taoke.user.entity.TrainerCase;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 专家授课案例服务接口
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
public interface TrainerCaseService {

    // ==================== 专家自服务 ====================

    /** 获取当前专家的案例列表 */
    List<TrainerCaseResponse> listMyCases(Integer userId);

    /** 获取案例详情（含文件） */
    TrainerCaseResponse getMyCaseDetail(Integer userId, Integer caseId);

    /** 新增案例（draft=true 保存为草稿，不进入审核队列） */
    TrainerCaseResponse createCase(Integer userId, SaveTrainerCaseRequest request, boolean draft);

    /** 编辑案例（draft=true 保存为草稿，不进入审核队列） */
    TrainerCaseResponse updateCase(Integer userId, Integer caseId, SaveTrainerCaseRequest request, boolean draft);

    /** 删除案例 */
    void deleteCase(Integer userId, Integer caseId);

    /** 给案例添加文件 */
    TrainerCaseFileResponse addCaseFile(Integer userId, Integer caseId, SaveTrainerCaseFileRequest request);

    /** 删除案例文件 */
    void deleteCaseFile(Integer userId, Integer caseId, Integer fileId);

    // ==================== C端公开 ====================

    /** 获取某专家已审核通过的案例列表（公开） */
    List<TrainerCaseResponse> listApprovedCases(Integer trainerId);

    /**
     * 全平台最近的已审核案例（专家列表页/首页轮播）
     * <p>按 sort_order DESC、id DESC 取前 limit 条，附带 trainerName/trainerAvatar 便于前端跳转。</p>
     */
    List<TrainerCaseRecentResponse> listRecentApproved(int limit);

    // ==================== 后台管理 ====================

    /** 后台获取案例详情（含文件，不限状态） */
    TrainerCaseResponse adminGetDetail(Integer caseId);

    /** 后台分页查询 */
    Page<TrainerCase> adminSearch(Integer trainerId, Integer status, int page, int size);

    /** 后台审核通过 */
    void approve(Integer caseId, Integer reviewerUserId);

    /** 后台审核驳回 */
    void reject(Integer caseId, Integer reviewerUserId, String reason);
}
