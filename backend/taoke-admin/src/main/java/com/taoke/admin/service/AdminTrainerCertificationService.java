package com.taoke.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.dto.cert.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.util.LegacyAvatarUrls;
import com.taoke.user.api.TrainerCertificationAdminService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerEducation;
import com.taoke.user.entity.TrainerWorkExperience;
import com.taoke.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台 — 专家四维度资质认证审核编排服务。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTrainerCertificationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final TrainerCertificationAdminService adminService;
    private final TrainerService trainerService;
    private final UserService userService;

    // ==================== 实名认证 ====================

    public PageResult<AdminRealNameCertVO> listRealName(AdminTrainerCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "realNameSubmittedAt", "id"));
        Page<Trainer> page = adminService.pageRealName(query.getStatus(), pageable);
        List<Trainer> trainers = page.getContent();
        if (trainers.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        Map<Integer, User> userMap = loadUsers(trainers.stream().map(Trainer::getUserId).toList());

        List<AdminRealNameCertVO> voList = trainers.stream().map(t -> {
            AdminRealNameCertVO vo = new AdminRealNameCertVO();
            vo.setTrainerId(t.getId());
            vo.setUserId(t.getUserId());
            vo.setRealName(t.getName());
            vo.setIdCardNo(blankToNull(t.getIdCardNo()));
            vo.setIdCardFront(normalizeCertUrl(t.getIdCardFront()));
            vo.setIdCardBack(normalizeCertUrl(t.getIdCardBack()));
            vo.setStatus(t.getRealNameStatus());
            vo.setRejectReason(t.getRealNameRejectReason());
            vo.setSubmittedAt(t.getRealNameSubmittedAt());
            vo.setAuditedAt(t.getRealNameAuditedAt());
            User u = userMap.get(t.getUserId());
            if (u != null) {
                vo.setPhone(u.getPhone());
                vo.setNickname(u.getNickname());
                if (vo.getRealName() == null || vo.getRealName().isBlank()) {
                    vo.setRealName(u.getRealName());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getRealName()))));
    }

    public void auditRealName(Integer trainerId, boolean approved, String reason) {
        adminService.auditRealName(trainerId, approved, reason);
    }

    // ==================== 专业认证 ====================

    public PageResult<AdminProfessionalCertVO> listProfessional(AdminTrainerCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "professionalSubmittedAt", "id"));
        Page<Trainer> page = adminService.pageProfessional(query.getStatus(), pageable);
        List<Trainer> trainers = page.getContent();
        if (trainers.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        Map<Integer, User> userMap = loadUsers(trainers.stream().map(Trainer::getUserId).toList());

        List<AdminProfessionalCertVO> voList = trainers.stream().map(t -> {
            AdminProfessionalCertVO vo = new AdminProfessionalCertVO();
            vo.setTrainerId(t.getId());
            vo.setUserId(t.getUserId());
            vo.setRealName(t.getName());
            vo.setFiles(parseFiles(t.getCertificationFiles()).stream()
                    .map(AdminTrainerCertificationService::normalizeCertUrl)
                    .filter(s -> s != null && !s.isBlank())
                    .toList());
            vo.setStatus(t.getProfessionalStatus());
            vo.setRejectReason(t.getProfessionalRejectReason());
            vo.setSubmittedAt(t.getProfessionalSubmittedAt());
            vo.setAuditedAt(t.getProfessionalAuditedAt());
            User u = userMap.get(t.getUserId());
            if (u != null) {
                vo.setPhone(u.getPhone());
                vo.setNickname(u.getNickname());
                if (vo.getRealName() == null || vo.getRealName().isBlank()) {
                    vo.setRealName(u.getRealName());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getRealName()))));
    }

    public void auditProfessional(Integer trainerId, boolean approved, String reason) {
        adminService.auditProfessional(trainerId, approved, reason);
    }

    // ==================== 学历认证 ====================

    public PageResult<AdminEducationCertVO> listEducations(AdminTrainerCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<TrainerEducation> page = adminService.pageEducations(query.getStatus(), pageable);
        List<TrainerEducation> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> trainerIds = records.stream().map(TrainerEducation::getTrainerId).distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));
        Map<Integer, User> userMap = loadUsers(trainerMap.values().stream().map(Trainer::getUserId).toList());

        List<AdminEducationCertVO> voList = records.stream().map(e -> {
            AdminEducationCertVO vo = new AdminEducationCertVO();
            vo.setId(e.getId());
            vo.setTrainerId(e.getTrainerId());
            vo.setHolderName(e.getHolderName());
            vo.setSchoolName(e.getSchoolName());
            vo.setMajor(e.getMajor());
            vo.setDegree(e.getDegree());
            vo.setStartDate(e.getStartDate());
            vo.setEndDate(e.getEndDate());
            vo.setIsGraduated(e.getIsGraduated());
            vo.setProofFile(normalizeCertUrl(e.getProofFile()));
            vo.setStatus(e.getStatus());
            vo.setRejectReason(e.getRejectReason());
            vo.setSubmittedAt(e.getCreatedAt());
            vo.setAuditedAt(e.getAuditedAt());
            Trainer t = trainerMap.get(e.getTrainerId());
            if (t != null) {
                vo.setUserId(t.getUserId());
                User u = userMap.get(t.getUserId());
                if (u != null) {
                    vo.setPhone(u.getPhone());
                    vo.setNickname(u.getNickname());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getHolderName()),
                                safe(v.getSchoolName()))));
    }

    public void auditEducation(Integer recordId, boolean approved, String reason) {
        adminService.auditEducation(recordId, approved, reason);
    }

    // ==================== 工作认证 ====================

    public PageResult<AdminWorkCertVO> listWorkExperiences(AdminTrainerCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<TrainerWorkExperience> page = adminService.pageWorkExperiences(query.getStatus(), pageable);
        List<TrainerWorkExperience> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> trainerIds = records.stream().map(TrainerWorkExperience::getTrainerId).distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));
        Map<Integer, User> userMap = loadUsers(trainerMap.values().stream().map(Trainer::getUserId).toList());

        List<AdminWorkCertVO> voList = records.stream().map(w -> {
            AdminWorkCertVO vo = new AdminWorkCertVO();
            vo.setId(w.getId());
            vo.setTrainerId(w.getTrainerId());
            vo.setCompanyName(w.getCompanyName());
            vo.setPosition(w.getPosition());
            vo.setStartDate(w.getStartDate());
            vo.setEndDate(w.getEndDate());
            vo.setJobDescription(w.getJobDescription());
            vo.setProofFile(normalizeCertUrl(w.getProofFile()));
            vo.setStatus(w.getStatus());
            vo.setRejectReason(w.getRejectReason());
            vo.setSubmittedAt(w.getCreatedAt());
            vo.setAuditedAt(w.getAuditedAt());
            Trainer t = trainerMap.get(w.getTrainerId());
            if (t != null) {
                vo.setUserId(t.getUserId());
                User u = userMap.get(t.getUserId());
                if (u != null) {
                    vo.setPhone(u.getPhone());
                    vo.setNickname(u.getNickname());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getCompanyName()),
                                safe(v.getPosition()))));
    }

    public void auditWorkExperience(Integer recordId, boolean approved, String reason) {
        adminService.auditWorkExperience(recordId, approved, reason);
    }

    // ==================== 工具方法 ====================

    private Map<Integer, User> loadUsers(List<Integer> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return userService.findAllByIds(userIds.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private List<String> parseFiles(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            log.warn("解析专业认证附件 JSON 失败: {}", json, ex);
            return Collections.emptyList();
        }
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    /** 资质证明文件 URL 规范化（老站 attachments/u 路径等） */
    private static String normalizeCertUrl(String url) {
        if (!LegacyAvatarUrls.isUsable(url)) {
            return null;
        }
        String normalized = LegacyAvatarUrls.normalize(url.trim());
        return normalized.isBlank() ? null : normalized;
    }

    private static <T> List<T> applySearch(List<T> list, String search, Function<T, List<String>> fields) {
        if (search == null || search.isBlank()) return list;
        String kw = search.trim().toLowerCase();
        return list.stream()
                .filter(item -> fields.apply(item).stream()
                        .anyMatch(f -> f.toLowerCase().contains(kw)))
                .toList();
    }
}
