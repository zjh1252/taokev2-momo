package com.taoke.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.BindingService;
import com.taoke.user.api.InstitutionEmployeeService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.common.ServiceCityItem;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.mapper.InstitutionEmployeeMapper;
import com.taoke.user.repository.InstitutionEmployeeRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 机构员工信息服务 — INSTITUTION_EMPLOYEE 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionEmployeeServiceImpl implements InstitutionEmployeeService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String DEFAULT_AGREEMENT_VERSION = "v1";

    private final InstitutionEmployeeRepository institutionEmployeeRepository;
    private final InstitutionEmployeeMapper institutionEmployeeMapper;
    private final RoleApplyService roleApplyService;
    private final BindingService bindingService;

    @Override
    public InstitutionEmployeeResponse getByUserId(Integer userId) {
        InstitutionEmployee ent = institutionEmployeeRepository.findByUserId(userId).orElse(null);
        return ent == null ? null : institutionEmployeeMapper.toResponse(ent);
    }

    @Override
    @Transactional
    public InstitutionEmployeeResponse save(Integer userId, InstitutionEmployeeRequest request) {
        return institutionEmployeeMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 员工主动申请加入机构。
     * <p>
     * 不再走平台审核（不创建 sys_user_roles 待审核记录），改为直接创建一条
     * INSTITUTION_EMPLOYEE 绑定（status=PENDING, initiator=员工），由目标机构在
     * 用户中心审核确认；机构确认后由 {@link com.taoke.user.service.binding.BindingServiceImpl}
     * 自动授予 INSTITUTION_EMPLOYEE 角色。
     */
    @Override
    @Transactional
    public void apply(Integer userId, InstitutionEmployeeRequest request) {
        if (request == null || request.getOrgId() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请选择目标机构");
        }
        if (!Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "请先勾选并同意《淘课网注册培训机构员工合作协议》");
        }
        // 先落档案（真实姓名 / 联系方式 / 服务城市 / 协议），再发起 PENDING 绑定
        saveOrUpdateExtension(userId, request);
        bindingService.initiateInstitutionEmployeeFromEmployee(userId, request.getOrgId(), null);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE);
    }

    @Override
    public Page<InstitutionEmployee> searchForAdmin(String search, Pageable pageable) {
        Specification<InstitutionEmployee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("position"), pattern),
                        cb.like(root.get("department"), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return institutionEmployeeRepository.findAll(spec, pageable);
    }

    @Override
    public List<InstitutionEmployee> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return institutionEmployeeRepository.findByUserIdIn(userIds);
    }

    private InstitutionEmployee saveOrUpdateExtension(Integer userId, InstitutionEmployeeRequest request) {
        InstitutionEmployee ent = institutionEmployeeRepository.findByUserId(userId).orElseGet(() -> {
            InstitutionEmployee e = new InstitutionEmployee();
            e.setUserId(userId);
            return e;
        });

        if (request.getOrgId() != null) ent.setOrgId(request.getOrgId());
        if (request.getRealName() != null) ent.setRealName(request.getRealName());
        if (request.getContactPhone() != null) ent.setContactPhone(request.getContactPhone());
        if (request.getEmail() != null) ent.setEmail(request.getEmail());
        if (request.getServiceCities() != null) {
            ent.setServiceCities(serializeServiceCities(request.getServiceCities()));
        }

        // legacy 字段：仅在前端显式提交时才更新
        if (request.getPosition() != null) ent.setPosition(request.getPosition());
        if (request.getDepartment() != null) ent.setDepartment(request.getDepartment());

        // 协议：首次同意时回写时间与版本，已签署则不覆盖时间
        if (Boolean.TRUE.equals(request.getAgreementSigned())) {
            if (ent.getAgreementSignedAt() == null) {
                ent.setAgreementSignedAt(LocalDateTime.now());
            }
            String version = request.getAgreementVersion();
            ent.setAgreementVersion(version != null && !version.isBlank()
                    ? version : DEFAULT_AGREEMENT_VERSION);
        }

        return institutionEmployeeRepository.save(ent);
    }

    /** 把多服务城市列表序列化成 JSON 字符串，失败时记录日志并返回空数组。 */
    private String serializeServiceCities(List<ServiceCityItem> cities) {
        if (cities == null || cities.isEmpty()) {
            return "[]";
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(cities);
        } catch (Exception ex) {
            log.warn("序列化机构员工服务城市失败: {}", cities, ex);
            return "[]";
        }
    }
}
