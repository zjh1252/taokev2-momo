package com.taoke.user.api;

import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Assistant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 助理档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface AssistantService {

    AssistantResponse getByUserId(Integer userId);

    AssistantResponse save(Integer userId, AssistantRequest request);

    void apply(Integer userId, AssistantRequest request);

    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    /**
     * 后台分页查询助理列表（可选关键词搜索 bio）。
     */
    Page<Assistant> searchForAdmin(String search, Pageable pageable);

    /**
     * 根据用户 ID 批量查询助理档案。
     */
    List<Assistant> findByUserIds(List<Integer> userIds);
}
