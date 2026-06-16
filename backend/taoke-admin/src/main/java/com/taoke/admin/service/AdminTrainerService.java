package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.admin.mapper.AdminUserMapper;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerBookService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台专家管理编排服务 — 专家列表 + 申请审核。
 * <p>
 * 通过 {@code api/} 契约接口访问 taoke-user 能力，不直接依赖 Repository。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminTrainerService {

    private final TrainerService trainerService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;
    private final TrainerCaseService trainerCaseService;
    private final TrainerBookService trainerBookService;
    private final CourseService courseService;
    private final VideoService videoService;
    private final AdminUserMapper adminUserMapper;

    /**
     * 分页查询专家列表（三段式：条件分页 → 回表 → 组装）
     */
    public PageResult<AdminTrainerVO> listTrainers(AdminTrainerQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<Trainer> page = trainerService.searchForAdmin(query.getSearch(), query.getStatus(), pageable);
        List<Trainer> trainers = page.getContent();

        if (trainers.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminTrainerVO> voList = trainers.stream().map(this::toTrainerVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 分页查询专家申请列表（三段式：UserRole 分页 → 批量查用户+专家 → 组装）。
     * <p>待审核（含资料重审）置顶，组内按最近提交时间倒序 — 排序由 findApplications 内部 JPQL 固定。</p>
     */
    public PageResult<AdminTrainerApplicationVO> listApplications(AdminTrainerApplicationQuery query) {
        PageRequest pageable = PageRequest.of(query.getPage() - 1, query.getSize());

        Page<UserRole> rolePage =
                userRoleService.findApplications(BusinessRole.Code.TRAINER, query.getStatus(), pageable);

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, Trainer> trainerMap = trainerService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(Trainer::getUserId, Function.identity()));

        List<AdminTrainerApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminTrainerApplicationVO vo = new AdminTrainerApplicationVO();
            vo.setId(ur.getId());
            vo.setUserId(ur.getUserId());
            vo.setStatus(ur.getStatus());
            vo.setReapplying(Boolean.TRUE.equals(ur.getReapplying()));
            vo.setRejectReason(ur.getRejectReason());
            vo.setCreatedAt(ur.getCreatedAt());
            vo.setUpdatedAt(ur.getUpdatedAt());
            vo.setApprovedAt(ur.getApprovedAt());

            User user = userMap.get(ur.getUserId());
            if (user != null) {
                vo.setPhone(user.getPhone());
                vo.setNickname(user.getNickname());
            }

            Trainer trainer = trainerMap.get(ur.getUserId());
            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
                vo.setTrainerTitle(trainer.getTitle());
                vo.setTrainerAvatar(trainer.getAvatar());
                // 专家 ID（正式档案唯一标识）：角色审核通过后才展示
                if (ur.getStatus() == 1) {
                    vo.setTrainerId(trainer.getId());
                }
            }

            return vo;
        }).toList();

        // 搜索过滤（内存过滤，因为涉及跨表字段）
        List<AdminTrainerApplicationVO> filtered = voList;
        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String kw = query.getSearch().trim().toLowerCase();
            filtered = voList.stream().filter(vo ->
                    (vo.getPhone() != null && vo.getPhone().contains(kw)) ||
                    (vo.getNickname() != null && vo.getNickname().toLowerCase().contains(kw)) ||
                    (vo.getTrainerName() != null && vo.getTrainerName().toLowerCase().contains(kw))
            ).toList();
        }

        return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), filtered);
    }

    /**
     * 审核通过专家申请
     */
    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.TRAINER);
    }

    /**
     * 驳回专家申请
     */
    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.TRAINER, reason);
    }

    /**
     * 切换专家推荐位（仅修改 is_recommended）
     */
    public void setRecommended(Integer trainerId, Integer value) {
        trainerService.setRecommended(trainerId, value);
    }

    /**
     * 专家详情（含资源统计与认证摘要）
     */
    public AdminTrainerDetailVO getTrainerDetail(Integer trainerId) {
        List<Trainer> trainers = trainerService.findByIds(List.of(trainerId));
        if (trainers.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }
        Trainer trainer = trainers.getFirst();
        AdminTrainerDetailVO vo = new AdminTrainerDetailVO();
        AdminTrainerVO base = toTrainerVO(trainer);
        copyTrainerFields(base, vo);

        vo.setEmail(trainer.getEmail());
        vo.setTrainerCode(trainer.getTrainerCode());
        vo.setTeachingName(trainer.getTeachingName());
        vo.setGender(trainer.getGender());
        vo.setIntro(trainer.getIntro());
        vo.setExpertiseTags(trainer.getExpertiseTags());
        vo.setRealNameCertStatus(trainer.getRealNameStatus());
        vo.setProfessionalCertStatus(trainer.getProfessionalStatus());

        Integer userId = trainer.getUserId();
        if (userId != null) {
            List<User> users = userService.findAllByIds(List.of(userId));
            if (!users.isEmpty()) {
                vo.setNickname(users.getFirst().getNickname());
            }
            vo.setCourseCount(courseService.countByPublisherIds(List.of(userId))
                    .getOrDefault(userId, 0L).intValue());
            vo.setVideoCount(videoService.countByPublisherIds(List.of(userId))
                    .getOrDefault(userId, 0L).intValue());
            List<UserRole> roles = userRoleService.findByUserId(userId);
            vo.setRoles(roles.stream().map(adminUserMapper::toRoleItem).toList());
        } else {
            vo.setCourseCount(0);
            vo.setVideoCount(0);
        }

        vo.setCaseCount(trainerCaseService.countByTrainerIds(List.of(trainerId))
                .getOrDefault(trainerId, 0L).intValue());
        vo.setBookCount(trainerBookService.listPublicBooks(trainerId).size());
        vo.setReviewCount(0);
        vo.setAgentBindingCount(0);
        vo.setInstitutionBindingCount(0);

        return vo;
    }

    private void copyTrainerFields(AdminTrainerVO src, AdminTrainerDetailVO dest) {
        dest.setId(src.getId());
        dest.setUserId(src.getUserId());
        dest.setName(src.getName());
        dest.setAvatar(src.getAvatar());
        dest.setTitle(src.getTitle());
        dest.setPhone(src.getPhone());
        dest.setStatus(src.getStatus());
        dest.setScore(src.getScore());
        dest.setCertLevel(src.getCertLevel());
        dest.setIsSigned(src.getIsSigned());
        dest.setIsRecommended(src.getIsRecommended());
        dest.setViewCount(src.getViewCount());
        dest.setApprovedAt(src.getApprovedAt());
        dest.setCreatedAt(src.getCreatedAt());
    }

    private AdminTrainerVO toTrainerVO(Trainer trainer) {
        AdminTrainerVO vo = new AdminTrainerVO();
        vo.setId(trainer.getId());
        vo.setUserId(trainer.getUserId());
        vo.setName(trainer.getName());
        vo.setAvatar(trainer.getAvatar());
        vo.setTitle(trainer.getTitle());
        vo.setPhone(trainer.getPhone());
        vo.setStatus(trainer.getStatus());
        vo.setScore(trainer.getScore());
        vo.setCertLevel(trainer.getCertLevel());
        vo.setIsSigned(trainer.getIsSigned());
        vo.setIsRecommended(trainer.getIsRecommended());
        vo.setViewCount(trainer.getViewCount());
        vo.setApprovedAt(trainer.getApprovedAt());
        vo.setCreatedAt(trainer.getCreatedAt());
        return vo;
    }
}
