package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.mapper.InstitutionEmployeeMapper;
import com.taoke.user.repository.InstitutionEmployeeRepository;
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
public class InstitutionEmployeeServiceImpl implements com.taoke.user.api.InstitutionEmployeeService {

    private final InstitutionEmployeeRepository institutionEmployeeRepository;
    private final InstitutionEmployeeMapper institutionEmployeeMapper;
    private final RoleApplyService roleApplyService;

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

    @Override
    @Transactional
    public void apply(Integer userId, InstitutionEmployeeRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE);
        saveOrUpdateExtension(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE);
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
