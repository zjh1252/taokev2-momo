package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.mapper.InstitutionEmployeeMapper;
import com.taoke.user.repository.InstitutionEmployeeRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 机构员工信息服务 — INSTITUTION_EMPLOYEE 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class InstitutionEmployeeService {

    private final InstitutionEmployeeRepository institutionEmployeeRepository;
    private final UserRoleRepository userRoleRepository;
    private final InstitutionEmployeeMapper institutionEmployeeMapper;

    public InstitutionEmployeeResponse getByUserId(Integer userId) {
        checkRole(userId);
        InstitutionEmployee ent = institutionEmployeeRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return institutionEmployeeMapper.toResponse(ent);
    }

    /**
     * 保存机构员工信息（有则更新、无则创建）
     */
    @Transactional
    public InstitutionEmployeeResponse save(Integer userId, InstitutionEmployeeRequest request) {
        checkRole(userId);
        InstitutionEmployee ent = institutionEmployeeRepository.findByUserId(userId).orElseGet(() -> {
            InstitutionEmployee e = new InstitutionEmployee();
            e.setUserId(userId);
            return e;
        });

        if (request.getOrgId() != null) ent.setOrgId(request.getOrgId());
        if (request.getPosition() != null) ent.setPosition(request.getPosition());
        if (request.getDepartment() != null) ent.setDepartment(request.getDepartment());

        ent = institutionEmployeeRepository.save(ent);
        return institutionEmployeeMapper.toResponse(ent);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "INSTITUTION_EMPLOYEE")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 INSTITUTION_EMPLOYEE 角色");
        }
    }
}
