package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.BindingService;
import com.taoke.user.api.InstitutionEmployeeService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.mapper.InstitutionEmployeeMapper;
import com.taoke.user.repository.InstitutionEmployeeRepository;
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
 * 机构员工信息服务 — INSTITUTION_EMPLOYEE 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class InstitutionEmployeeServiceImpl implements InstitutionEmployeeService {

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
        // 先落档案（位置/部门），再发起 PENDING 绑定
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
        if (request.getPosition() != null) ent.setPosition(request.getPosition());
        if (request.getDepartment() != null) ent.setDepartment(request.getDepartment());

        return institutionEmployeeRepository.save(ent);
    }
}
