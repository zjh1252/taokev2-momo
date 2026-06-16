package com.taoke.admin.service;

import com.taoke.admin.dto.AdminTrainerMessageVO;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.entity.interaction.TrainerLeadMessage;
import com.taoke.course.repository.interaction.TrainerLeadMessageRepository;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台留言管理服务 — 列表查询 / 详情 / 标记已处理。
 *
 * <p>不引入 assignee 字段，仅做"标记处理"语义；状态流转：
 * 0=新建, 1=已分配, 2=已处理。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Service
@RequiredArgsConstructor
public class AdminTrainerMessageService {

    private final TrainerLeadMessageRepository repository;
    private final UserService userService;

    /**
     * 分页查询留言列表
     *
     * @param status        状态过滤（0/1/2，可空表示全部）
     * @param trainerUserId 目标专家 user_id（可空）
     * @param keyword       关键字模糊匹配（联系人 / 公司名 / 培训主题，可空）
     * @param page          页码，从 1 开始
     * @param size          每页条数
     */
    public Page<AdminTrainerMessageVO> list(Integer status, Integer trainerUserId,
                                            String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page - 1), size,
                Sort.by(Sort.Direction.DESC, "id")
        );

        Specification<TrainerLeadMessage> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (trainerUserId != null && trainerUserId > 0) {
                predicates.add(cb.equal(root.get("trainerUserId"), trainerUserId));
            }
            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("contactName"), like),
                        cb.like(root.get("companyName"), like),
                        cb.like(root.get("trainingTopic"), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<TrainerLeadMessage> result = repository.findAll(spec, pageable);
        Map<Integer, User> userMap = loadUserMap(result.getContent());
        return result.map(entity -> toVO(entity, userMap));
    }

    /**
     * 留言详情
     */
    public AdminTrainerMessageVO detail(Integer id) {
        TrainerLeadMessage entity = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "留言不存在"));
        Map<Integer, User> userMap = loadUserMap(List.of(entity));
        return toVO(entity, userMap);
    }

    /**
     * 标记为已处理（状态 0/1 → 2）；已处理则保持原样。
     */
    @Transactional
    public void markProcessed(Integer id) {
        TrainerLeadMessage entity = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "留言不存在"));
        if (entity.getStatus() != null && entity.getStatus() == 2) {
            return;
        }
        entity.setStatus(2);
        repository.save(entity);
    }

    /**
     * 批量加载留言中涉及的用户（专家 + 提交人）昵称。
     */
    private Map<Integer, User> loadUserMap(List<TrainerLeadMessage> messages) {
        Set<Integer> userIds = new HashSet<>();
        for (TrainerLeadMessage m : messages) {
            if (m.getTrainerUserId() != null && m.getTrainerUserId() > 0) {
                userIds.add(m.getTrainerUserId());
            }
            if (m.getUserId() != null && m.getUserId() > 0) {
                userIds.add(m.getUserId());
            }
        }
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userService.findAllByIds(new ArrayList<>(userIds)).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));
    }

    private AdminTrainerMessageVO toVO(TrainerLeadMessage entity, Map<Integer, User> userMap) {
        AdminTrainerMessageVO vo = AdminTrainerMessageVO.from(entity);
        if (entity.getTrainerUserId() != null) {
            User trainer = userMap.get(entity.getTrainerUserId());
            if (trainer != null) {
                vo.setTrainerNickname(trainer.getNickname());
            }
        }
        if (entity.getUserId() != null) {
            User submitter = userMap.get(entity.getUserId());
            if (submitter != null) {
                vo.setUserNickname(submitter.getNickname());
            }
        }
        return vo;
    }
}
