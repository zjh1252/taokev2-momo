package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
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

    public AssistantResponse getByUserId(Integer userId) {
        checkRole(userId);
        Assistant assistant = assistantRepository.findByUserId(userId).orElse(null);
        if (assistant == null) {
            return null;
        }
        return assistantMapper.toResponse(assistant);
    }

    /**
     * 保存专家助理档案（有则更新、无则创建）
     */
    @Transactional
    public AssistantResponse save(Integer userId, AssistantRequest request) {
        checkRole(userId);
        Assistant assistant = assistantRepository.findByUserId(userId).orElseGet(() -> {
            Assistant a = new Assistant();
            a.setUserId(userId);
            return a;
        });

        if (request.getBio() != null) assistant.setBio(request.getBio());
        if (request.getAuthScope() != null) assistant.setAuthScope(request.getAuthScope());

        assistant = assistantRepository.save(assistant);
        return assistantMapper.toResponse(assistant);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "ASSISTANT")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 ASSISTANT 角色");
        }
    }
}
