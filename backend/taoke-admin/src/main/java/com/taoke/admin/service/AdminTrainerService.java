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
import com.taoke.common.service.RegionService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.VideoStatus;
import com.taoke.user.api.BindingService;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.binding.BindingType;
import com.taoke.user.dto.trainer.CategoryRefDTO;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerCase;
import com.taoke.user.entity.TrainerHighlight;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.service.RoleApplicationChangeLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final BindingService bindingService;
    private final TrainerHighlightService trainerHighlightService;
    private final RegionService regionService;
    private final AdminUserMapper adminUserMapper;
    private final RoleApplicationChangeLogService changeLogService;

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
                vo.setTrainerId(trainer.getId());
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
     * 专家详情（完整档案 + 维护人 + 资源列表）
     */
    public AdminTrainerDetailVO getTrainerDetail(Integer trainerId) {
        List<Trainer> trainers = trainerService.findByIds(List.of(trainerId));
        if (trainers.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }
        Trainer trainer = trainers.getFirst();
        Integer userId = trainer.getUserId();

        AdminTrainerDetailVO vo = new AdminTrainerDetailVO();
        AdminTrainerVO base = toTrainerVO(trainer);
        copyTrainerFields(base, vo);

        TrainerResponse profile = userId != null ? trainerService.getByUserId(userId) : null;
        if (profile != null) {
            fillProfileFields(vo, profile);
            vo.setRealNameCertStatus(trainer.getRealNameStatus());
            vo.setProfessionalCertStatus(trainer.getProfessionalStatus());
        } else {
            vo.setEmail(trainer.getEmail());
            vo.setTrainerCode(trainer.getTrainerCode());
            vo.setTeachingName(trainer.getTeachingName());
            vo.setGender(trainer.getGender());
            vo.setIntro(trainer.getIntro());
            vo.setExpertiseTags(trainer.getExpertiseTags());
            vo.setRealNameCertStatus(trainer.getRealNameStatus());
            vo.setProfessionalCertStatus(trainer.getProfessionalStatus());
        }

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

            List<BindingItemResponse> bindings = bindingService.listMyAgents(userId);
            vo.setMaintainers(buildMaintainers(bindings));
            vo.setAgentBindingCount((int) bindings.stream()
                    .filter(b -> b.getBindingType() == BindingType.AGENT_TRAINER).count());
            vo.setInstitutionBindingCount((int) bindings.stream()
                    .filter(b -> b.getBindingType() == BindingType.INSTITUTION_TRAINER).count());

            vo.setCourses(loadCourseResources(userId, trainerId));
            vo.setVideos(loadVideoResources(userId));
        } else {
            vo.setCourseCount(0);
            vo.setVideoCount(0);
            vo.setMaintainers(List.of());
            vo.setCourses(List.of());
            vo.setVideos(List.of());
        }

        vo.setCaseCount(trainerCaseService.countByTrainerIds(List.of(trainerId))
                .getOrDefault(trainerId, 0L).intValue());
        vo.setCases(loadCaseResources(trainerId));
        vo.setHighlights(loadHighlightResources(trainerId));

        List<TrainerBookResponse> bookList = trainerBookService.listPublicBooks(trainerId);
        vo.setBookCount(bookList.size());
        vo.setBooks(bookList.stream().map(this::toBookItem).toList());
        vo.setReviewCount(trainer.getCommentCount() != null ? trainer.getCommentCount() : 0);

        return vo;
    }

    /**
     * 运营编辑专家档案（主表 + 荣誉 + 分类 + 著作）
     */
    @Transactional
    public AdminTrainerDetailVO updateTrainerDetail(Integer trainerId, AdminTrainerUpdateRequest req) {
        Trainer trainer = trainerService.findByIds(List.of(trainerId)).stream()
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        Integer userId = trainer.getUserId();
        if (userId == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "专家未关联用户，无法编辑");
        }

        TrainerRequest request = toTrainerRequest(req);
        trainerService.save(userId, request);

        if (req.getHonors() != null) {
            trainerService.saveHonors(userId, req.getHonors());
        }
        if (req.getExpertiseCategoryIds() != null) {
            List<CategoryRefDTO> refs = req.getExpertiseCategoryIds().stream().map(cid -> {
                CategoryRefDTO dto = new CategoryRefDTO();
                dto.setCategoryId(cid);
                return dto;
            }).toList();
            trainerService.saveExpertiseCategories(userId, refs);
        }
        if (req.getIndustryCategoryIds() != null) {
            List<CategoryRefDTO> refs = req.getIndustryCategoryIds().stream().map(cid -> {
                CategoryRefDTO dto = new CategoryRefDTO();
                dto.setCategoryId(cid);
                return dto;
            }).toList();
            trainerService.saveIndustryCategories(userId, refs);
        }
        if (req.getBooks() != null) {
            TrainerRequest bookReq = new TrainerRequest();
            bookReq.setBooks(req.getBooks());
            trainerService.save(userId, bookReq);
        }

        return getTrainerDetail(trainerId);
    }

    private void fillProfileFields(AdminTrainerDetailVO vo, TrainerResponse profile) {
        vo.setEmail(profile.getEmail());
        vo.setTrainerCode(profile.getTrainerCode());
        vo.setTeachingName(profile.getTeachingName());
        vo.setGender(profile.getGender());
        vo.setIntro(profile.getIntro());
        vo.setExpertiseTags(profile.getExpertiseTags());

        vo.setResumeUrl(profile.getResumeUrl());
        vo.setIdCardNo(profile.getIdCardNo());
        vo.setProvinceId(profile.getProvinceId());
        vo.setCityId(profile.getCityId());

        List<Integer> regionIds = new ArrayList<>();
        if (profile.getProvinceId() != null && profile.getProvinceId() > 0) {
            regionIds.add(profile.getProvinceId());
        }
        if (profile.getCityId() != null && profile.getCityId() > 0) {
            regionIds.add(profile.getCityId());
        }
        if (!regionIds.isEmpty()) {
            Map<Integer, String> names = regionService.getNamesByIds(regionIds);
            vo.setProvinceName(names.get(profile.getProvinceId()));
            vo.setCityName(names.get(profile.getCityId()));
        }

        vo.setBio(profile.getBio());
        vo.setOneLineIntro(profile.getOneLineIntro());
        vo.setBackground(profile.getBackground());
        vo.setPartialClients(profile.getPartialClients());
        vo.setGoodAt(profile.getGoodAt());
        vo.setSpecialties(profile.getSpecialties());
        vo.setTeachingStyle(profile.getTeachingStyle());
        vo.setExperienceYears(profile.getExperienceYears());
        vo.setTeachingYears(profile.getTeachingYears());
        vo.setQuoteMin(profile.getQuoteMin());
        vo.setQuoteMax(profile.getQuoteMax());
        vo.setQuoteUnit(profile.getQuoteUnit());
        vo.setQuoteRemark(profile.getQuoteRemark());
        vo.setTaokePrice(profile.getTaokePrice());
        vo.setTaokeCommission(profile.getTaokeCommission());
        vo.setHonors(profile.getHonors());
        vo.setExpertiseCategories(profile.getExpertiseCategories());
        vo.setIndustryCategories(profile.getIndustryCategories());
    }

    private List<AdminTrainerMaintainerVO> buildMaintainers(List<BindingItemResponse> bindings) {
        if (bindings == null || bindings.isEmpty()) {
            return List.of();
        }
        List<AdminTrainerMaintainerVO> list = new ArrayList<>();
        for (BindingItemResponse b : bindings) {
            AdminTrainerMaintainerVO m = new AdminTrainerMaintainerVO();
            switch (b.getBindingType()) {
                case ASSISTANT_TRAINER -> {
                    m.setRoleType("assistant");
                    m.setRoleLabel("助理");
                }
                case AGENT_TRAINER -> {
                    m.setRoleType("agent");
                    m.setRoleLabel("经纪");
                }
                case ENTERPRISE_AGENT_TRAINER -> {
                    m.setRoleType("enterprise_agent");
                    m.setRoleLabel("经纪公司");
                }
                case INSTITUTION_TRAINER -> {
                    m.setRoleType("institution");
                    m.setRoleLabel("机构");
                }
                default -> { continue; }
            }
            m.setContactName(firstNonBlank(b.getCounterpartRealName(), b.getCounterpartNickname()));
            m.setContactPhone(b.getCounterpartPhone());
            m.setOrgName(b.getCounterpartOrgName());
            list.add(m);
        }
        return list;
    }

    private List<AdminTrainerResourceItemVO> loadCourseResources(Integer userId, Integer trainerId) {
        Page<Course> page = courseService.searchForAdmin(
                null, null, null, trainerId, null, null, null,
                userId != null ? List.of(userId) : null,
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "id")));
        if (page.isEmpty()) {
            return List.of();
        }
        return courseService.assembleListItems(page.getContent()).stream()
                .map(this::toCourseResource)
                .toList();
    }

    private AdminTrainerResourceItemVO toCourseResource(CourseListItemVO c) {
        AdminTrainerResourceItemVO item = new AdminTrainerResourceItemVO();
        item.setId(c.getId());
        item.setType("course");
        item.setTitle(c.getTitle());
        item.setStatus(c.getStatus());
        item.setStatusLabel(c.getStatusLabel() != null ? c.getStatusLabel()
                : CourseStatus.of(c.getStatus() != null ? c.getStatus() : 0).getLabel());
        item.setAdminPath("/dashboard/courses?id=" + c.getId());
        return item;
    }

    private List<AdminTrainerResourceItemVO> loadCaseResources(Integer trainerId) {
        Page<TrainerCase> page = trainerCaseService.adminSearch(trainerId, null, 1, 50);
        return page.getContent().stream().map(c -> {
            AdminTrainerResourceItemVO item = new AdminTrainerResourceItemVO();
            item.setId(c.getId());
            item.setType("case");
            item.setTitle(c.getCaseTitle());
            item.setStatus(c.getStatus());
            item.setStatusLabel(caseStatusLabel(c.getStatus()));
            item.setAdminPath("/dashboard/trainers/cases/" + c.getId());
            return item;
        }).toList();
    }

    private List<AdminTrainerResourceItemVO> loadVideoResources(Integer userId) {
        return videoService.listByPublisherForAdmin(userId, 50).stream().map(v -> {
            AdminTrainerResourceItemVO item = new AdminTrainerResourceItemVO();
            item.setId(v.getId());
            item.setType("video");
            item.setTitle(v.getTitle());
            item.setStatus(v.getStatus());
            item.setStatusLabel(v.getStatusLabel() != null ? v.getStatusLabel()
                    : VideoStatus.of(v.getStatus() != null ? v.getStatus() : 0).getLabel());
            item.setAdminPath("/dashboard/videos?id=" + v.getId());
            return item;
        }).toList();
    }

    private List<AdminTrainerResourceItemVO> loadHighlightResources(Integer trainerId) {
        Page<TrainerHighlight> page = trainerHighlightService.adminSearch(trainerId, null, null, 1, 50);
        return page.getContent().stream().map(h -> {
            AdminTrainerResourceItemVO item = new AdminTrainerResourceItemVO();
            item.setId(h.getId());
            item.setType("highlight");
            item.setTitle(h.getTitle() != null ? h.getTitle() : "精彩瞬间");
            item.setStatus(h.getStatus());
            item.setStatusLabel(highlightStatusLabel(h.getStatus()));
            item.setAdminPath("/dashboard/trainers/highlights/" + h.getId());
            return item;
        }).toList();
    }

    private AdminTrainerBookItemVO toBookItem(TrainerBookResponse b) {
        AdminTrainerBookItemVO item = new AdminTrainerBookItemVO();
        item.setId(b.getId());
        item.setTitle(b.getTitle());
        item.setAuthor(b.getAuthorName());
        item.setStatus(b.getStatus());
        item.setStatusLabel(b.getStatus() != null && b.getStatus() == 1 ? "已发布" : "草稿");
        return item;
    }

    private TrainerRequest toTrainerRequest(AdminTrainerUpdateRequest req) {
        TrainerRequest r = new TrainerRequest();
        r.setName(req.getName());
        r.setTeachingName(req.getTeachingName());
        r.setAvatar(req.getAvatar());
        r.setTitle(req.getTitle());
        r.setGender(req.getGender());
        r.setPhone(req.getPhone());
        r.setEmail(req.getEmail());
        r.setProvinceId(req.getProvinceId());
        r.setCityId(req.getCityId());
        r.setIdCardNo(req.getIdCardNo());
        r.setResumeUrl(req.getResumeUrl());
        r.setBio(req.getBio());
        r.setOneLineIntro(req.getOneLineIntro());
        r.setIntro(req.getIntro());
        r.setBackground(req.getBackground());
        r.setPartialClients(req.getPartialClients());
        r.setGoodAt(req.getGoodAt());
        r.setSpecialties(req.getSpecialties());
        r.setExpertiseTags(req.getExpertiseTags());
        r.setTeachingStyle(req.getTeachingStyle());
        r.setExperienceYears(req.getExperienceYears());
        r.setTeachingYears(req.getTeachingYears());
        r.setQuoteMin(req.getQuoteMin());
        r.setQuoteMax(req.getQuoteMax());
        r.setQuoteUnit(req.getQuoteUnit());
        r.setQuoteRemark(req.getQuoteRemark());
        r.setTaokePrice(req.getTaokePrice());
        r.setTaokeCommission(req.getTaokeCommission());
        r.setIndustryCategoryIds(req.getIndustryCategoryIds());
        r.setExpertiseCategoryIds(req.getExpertiseCategoryIds());
        r.setBooks(req.getBooks());
        return r;
    }

    private static String caseStatusLabel(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "待审核";
            case 1 -> "已通过";
            case 2 -> "已驳回";
            default -> "未知";
        };
    }

    private static String highlightStatusLabel(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "待审核";
            case 1 -> "已通过";
            case 2 -> "已驳回";
            default -> "未知";
        };
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
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

    /**
     * 获取专家申请详情（用于后台申请列表的「查看详情」入口）。
     */
    public AdminApplicationDetailVO getApplicationDetail(Integer userId) {
        UserRole userRole = userRoleService.findByUserId(userId).stream()
                .filter(ur -> BusinessRole.Code.TRAINER.equals(ur.getRole()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "未找到该用户的专家申请记录"));

        Trainer trainer = trainerService.findByUserIds(List.of(userId)).stream()
                .findFirst().orElse(null);
        User user = userService.findAllByIds(List.of(userId)).stream().findFirst().orElse(null);

        AdminApplicationDetailVO vo = new AdminApplicationDetailVO();
        vo.setId(userRole.getId());
        vo.setUserId(userId);
        vo.setPhone(user != null ? user.getPhone() : null);
        vo.setNickname(user != null ? user.getNickname() : null);
        vo.setRole(BusinessRole.Code.TRAINER);
        vo.setRoleName(BusinessRole.TRAINER.getLabel());
        vo.setStatus(userRole.getStatus());
        vo.setReapplying(Boolean.TRUE.equals(userRole.getReapplying()));
        vo.setRejectReason(userRole.getRejectReason());
        vo.setCreatedAt(userRole.getCreatedAt());
        vo.setApprovedAt(userRole.getApprovedAt());
        vo.setEntityId(trainer != null ? trainer.getId() : null);
        vo.setApplicantName(trainer != null ? trainer.getName() : null);

        // 构建字段列表
        Set<String> changedFields = vo.getReapplying()
                ? changeLogService.getLastChangedFields(userId, BusinessRole.Code.TRAINER)
                : Set.of();

        java.util.List<AdminApplicationFieldVO> fields = new java.util.ArrayList<>();
        if (trainer != null) {
            fields.add(field("name", "真实姓名", trainer.getName(), changedFields));
            fields.add(field("teachingName", "授课姓名", trainer.getTeachingName(), changedFields));
            fields.add(field("title", "头衔", trainer.getTitle(), changedFields));
            fields.add(field("gender", "性别", trainer.getGender() != null ? (trainer.getGender() == 1 ? "男" : "女") : null, changedFields));
            fields.add(field("phone", "联系电话", trainer.getPhone(), changedFields));
            fields.add(field("email", "邮箱", trainer.getEmail(), changedFields));
            fields.add(field("idCardNo", "身份证号", trainer.getIdCardNo(), changedFields));
            fields.add(field("oneLineIntro", "一句话介绍", trainer.getOneLineIntro(), changedFields));
            fields.add(field("bio", "个人简介", trainer.getBio(), changedFields));
            fields.add(field("background", "从业背景", trainer.getBackground(), changedFields));
            fields.add(field("partialClients", "服务过客户", trainer.getPartialClients(), changedFields));
            fields.add(field("goodAt", "擅长领域", trainer.getGoodAt(), changedFields));
            fields.add(field("expertiseTags", "擅长标签", trainer.getExpertiseTags(), changedFields));
            fields.add(field("teachingStyle", "授课风格", trainer.getTeachingStyle(), changedFields));
            fields.add(field("experienceYears", "从业年限", trainer.getExperienceYears(), changedFields));
            fields.add(field("teachingYears", "授课年限", trainer.getTeachingYears(), changedFields));
            fields.add(field("quoteMin", "最低报价", trainer.getQuoteMin(), changedFields));
            fields.add(field("quoteMax", "最高报价", trainer.getQuoteMax(), changedFields));
            fields.add(field("quoteUnit", "报价单位", trainer.getQuoteUnit(), changedFields));
            fields.add(field("quoteRemark", "报价备注", trainer.getQuoteRemark(), changedFields));
            fields.add(field("taokePrice", "淘课网售价", trainer.getTaokePrice(), changedFields));
            fields.add(field("taokeCommission", "合作课酬", trainer.getTaokeCommission(), changedFields));
        }
        vo.setFields(fields);
        return vo;
    }

    private static AdminApplicationFieldVO field(String name, String label, Object val, Set<String> changed) {
        AdminApplicationFieldVO f = new AdminApplicationFieldVO();
        f.setFieldName(name);
        f.setFieldLabel(label);
        f.setValue(val != null ? String.valueOf(val) : null);
        f.setChanged(changed.contains(name));
        return f;
    }

    /** 供其他 AdminService 共用的字段构造方法 */
    public static AdminApplicationFieldVO fieldRef(String name, String label, Object val, Set<String> changed) {
        return field(name, label, val, changed);
    }
}
