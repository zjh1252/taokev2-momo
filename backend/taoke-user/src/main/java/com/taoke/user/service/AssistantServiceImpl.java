package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.AssistantService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Assistant;
import com.taoke.user.mapper.AssistantMapper;
import com.taoke.user.repository.AssistantRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 专家助理档案服务 — ASSISTANT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements AssistantService {

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
     * 申请成为专家助理 — 无需资质认证，自动通过并发送角色生效通知
     */
    @Override
    @Transactional
    public void apply(Integer userId, AssistantRequest request) {
        saveOrUpdateExtension(userId, request);
        roleApplyService.applyAndAutoApprove(userId, BusinessRole.Code.ASSISTANT);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.ASSISTANT);
    }

    @Override
    public Page<Assistant> searchForAdmin(String search, Pageable pageable) {
        Specification<Assistant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.like(root.get("bio"), pattern));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return assistantRepository.findAll(spec, pageable);
    }

    @Override
    public List<Assistant> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return assistantRepository.findByUserIdIn(userIds);
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
