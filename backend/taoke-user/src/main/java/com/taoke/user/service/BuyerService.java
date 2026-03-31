package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.buyer.BuyerRequest;
import com.taoke.user.dto.buyer.BuyerResponse;
import com.taoke.user.entity.Buyer;
import com.taoke.user.repository.BuyerRepository;
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
public class BuyerService {

    private final BuyerRepository buyerRepository;
    private final UserRoleRepository userRoleRepository;

    public BuyerResponse getByUserId(Integer userId) {
        checkRole(userId);
        Buyer buyer = buyerRepository.findByUserId(userId).orElse(null);
        if (buyer == null) {
            return null;
        }
        return toResponse(buyer);
    }

    /**
     * 保存学员档案（有则更新、无则创建）
     */
    @Transactional
    public BuyerResponse save(Integer userId, BuyerRequest request) {
        checkRole(userId);
        Buyer buyer = buyerRepository.findByUserId(userId).orElseGet(() -> {
            Buyer b = new Buyer();
            b.setUserId(userId);
            return b;
        });

        if (request.getOccupation() != null) buyer.setOccupation(request.getOccupation());
        if (request.getLearningTags() != null) buyer.setLearningTags(request.getLearningTags());

        buyer = buyerRepository.save(buyer);
        return toResponse(buyer);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "BUYER")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 BUYER 角色");
        }
    }

    private BuyerResponse toResponse(Buyer buyer) {
        BuyerResponse resp = new BuyerResponse();
        resp.setId(buyer.getId());
        resp.setOccupation(buyer.getOccupation());
        resp.setLearningTags(buyer.getLearningTags());
        resp.setCreatedAt(buyer.getCreatedAt());
        resp.setUpdatedAt(buyer.getUpdatedAt());
        return resp;
    }
}
