package com.taoke.user.service;

import com.taoke.user.dto.buyer.BuyerRequest;
import com.taoke.user.dto.buyer.BuyerResponse;
import com.taoke.user.entity.Buyer;
import com.taoke.user.mapper.BuyerMapper;
import com.taoke.user.repository.BuyerRepository;
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
public class BuyerServiceImpl implements com.taoke.user.api.BuyerService {

    private final BuyerRepository buyerRepository;
    private final BuyerMapper buyerMapper;

    @Override
    public BuyerResponse getByUserId(Integer userId) {
        Buyer buyer = buyerRepository.findByUserId(userId).orElse(null);
        if (buyer == null) {
            return null;
        }
        return buyerMapper.toResponse(buyer);
    }

    @Override
    @Transactional
    public BuyerResponse save(Integer userId, BuyerRequest request) {
        Buyer buyer = buyerRepository.findByUserId(userId).orElseGet(() -> {
            Buyer b = new Buyer();
            b.setUserId(userId);
            return b;
        });

        if (request.getOccupation() != null) buyer.setOccupation(request.getOccupation());
        if (request.getLearningTags() != null) buyer.setLearningTags(request.getLearningTags());

        buyer = buyerRepository.save(buyer);
        return buyerMapper.toResponse(buyer);
    }
}
