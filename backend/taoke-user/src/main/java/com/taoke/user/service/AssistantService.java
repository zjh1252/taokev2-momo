package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Assistant;
import com.taoke.user.mapper.AssistantMapper;
import com.taoke.user.repository.AssistantRepository;
import com.taoke.user.repository.UserRoleRepository;
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
public class AssistantService {

    private final AssistantRepository assistantRepository;
    private final UserRoleRepository userRoleRepository;
    private final AssistantMapper assistantMapper;
    private final RoleApplyService roleApplyService;

    public AssistantResponse getByUserId(Integer userId) {
        checkRole(userId);
        Assistant assistant = assistantRepository.findByUserId(userId).orElse(null);
        return assistant == null ? null : assistantMapper.toResponse(assistant);
    }

    /**
     * 保存专家助理档案（有则更新、无则创建，要求角色已生效）
     */
    @Transactional
    public AssistantResponse save(Integer userId, AssistantRequest request) {
        checkRole(userId);
        return assistantMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请成为专家助理 — 提交扩展信息并创建待审核角色记录
     */
    @Transactional
    public void apply(Integer userId, AssistantRequest request) {
        roleApplyService.apply(userId, "ASSISTANT");
        saveOrUpdateExtension(userId, request);
    }

    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, "ASSISTANT");
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

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRoleAndStatus(userId, "ASSISTANT", 1)) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 ASSISTANT 角色");
        }
    }
}
