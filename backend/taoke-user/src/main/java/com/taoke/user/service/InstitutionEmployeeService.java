package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.mapper.InstitutionEmployeeMapper;
import com.taoke.user.repository.InstitutionEmployeeRepository;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
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
    private final InstitutionEmployeeMapper institutionEmployeeMapper;
    private final RoleApplyService roleApplyService;

    public InstitutionEmployeeResponse getByUserId(Integer userId) {
        InstitutionEmployee ent = institutionEmployeeRepository.findByUserId(userId).orElse(null);
        return ent == null ? null : institutionEmployeeMapper.toResponse(ent);
    }

    /**
     * 保存机构员工信息（有则更新、无则创建）
     */
    @Transactional
    public InstitutionEmployeeResponse save(Integer userId, InstitutionEmployeeRequest request) {
        return institutionEmployeeMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请 INSTITUTION_EMPLOYEE 角色并保存扩展信息
     */
    @Transactional
    public void apply(Integer userId, InstitutionEmployeeRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE);
        saveOrUpdateExtension(userId, request);
    }

    /**
     * 查询当前用户的 INSTITUTION_EMPLOYEE 角色申请状态
     */
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
