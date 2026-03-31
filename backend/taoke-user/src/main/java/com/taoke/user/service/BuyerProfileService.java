package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.buyer.BuyerProfileRequest;
import com.taoke.user.dto.buyer.BuyerProfileResponse;
import com.taoke.user.entity.BuyerProfile;
import com.taoke.user.repository.BuyerProfileRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 学员档案服务 — BUYER 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class BuyerProfileService {

    private final BuyerProfileRepository buyerProfileRepository;
    private final UserRoleRepository userRoleRepository;

    public BuyerProfileResponse getByUserId(Integer userId) {
        checkRole(userId);
        BuyerProfile bp = buyerProfileRepository.findByUserId(userId).orElse(null);
        if (bp == null) {
            return null;
        }
        return toResponse(bp);
    }

    /**
     * 保存学员档案（有则更新、无则创建）
     */
    @Transactional
    public BuyerProfileResponse save(Integer userId, BuyerProfileRequest request) {
        checkRole(userId);
        BuyerProfile bp = buyerProfileRepository.findByUserId(userId).orElseGet(() -> {
            BuyerProfile b = new BuyerProfile();
            b.setUserId(userId);
            return b;
        });

        if (request.getOccupation() != null) bp.setOccupation(request.getOccupation());
        if (request.getLearningTags() != null) bp.setLearningTags(request.getLearningTags());

        bp = buyerProfileRepository.save(bp);
        return toResponse(bp);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "BUYER")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 BUYER 角色");
        }
    }

    private BuyerProfileResponse toResponse(BuyerProfile bp) {
        BuyerProfileResponse resp = new BuyerProfileResponse();
        resp.setId(bp.getId());
        resp.setOccupation(bp.getOccupation());
        resp.setLearningTags(bp.getLearningTags());
        resp.setCreatedAt(bp.getCreatedAt());
        resp.setUpdatedAt(bp.getUpdatedAt());
        return resp;
    }
}
