package com.taoke.user.api;

import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.InstitutionEmployee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 机构员工档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface InstitutionEmployeeService {

    InstitutionEmployeeResponse getByUserId(Integer userId);

    InstitutionEmployeeResponse save(Integer userId, InstitutionEmployeeRequest request);

    void apply(Integer userId, InstitutionEmployeeRequest request);

    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    /**
     * 后台分页查询机构员工列表（可选关键词搜索 position / department）。
     */
    Page<InstitutionEmployee> searchForAdmin(String search, Pageable pageable);

    /**
     * 根据用户 ID 批量查询机构员工档案。
     */
    List<InstitutionEmployee> findByUserIds(List<Integer> userIds);
}
