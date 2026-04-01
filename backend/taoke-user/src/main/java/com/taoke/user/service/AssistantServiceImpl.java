package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Assistant;
import com.taoke.user.mapper.AssistantMapper;
import com.taoke.user.repository.AssistantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 专家助理档案服务 — ASSISTANT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements com.taoke.user.api.AssistantService {

    private final AssistantRepository assistantRepository;
    private final AssistantMapper assistantMapper;
    private final RoleApplyService roleApplyService;

    @Override
    public AssistantResponse getByUserId(Integer userId) {
        Assistant assistant = assistantRepository.findByUserId(userId).orElse(null);
        return assistant == null ? null : assistantMapper.toResponse(assistant);
    }

    /**
     * 保存专家助理档案（有则更新、无则创建，要求角色已生效）
     */
    @Override
    @Transactional
    public AssistantResponse save(Integer userId, AssistantRequest request) {
        return assistantMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请成为专家助理 — 提交扩展信息并创建待审核角色记录
     */
    @Override
    @Transactional
    public void apply(Integer userId, AssistantRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.ASSISTANT);
        saveOrUpdateExtension(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.ASSISTANT);
    }

    private Assistant saveOrUpdateExtension(Integer userId, AssistantRequest request) {
        Assistant assistant = assistantRepository.findByUserId(userId).orElseGet(() -> {
            Assistant a = new Assistant();
            a.setUserId(userId);
            return a;
        });

        if (request.getBio() != null) assistant.setBio(request.getBio());
        if (request.getAuthScope() != null) assistant.setAuthScope(request.getAuthScope());

        return assistantRepository.save(assistant);
    }
}
