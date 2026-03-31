package com.taoke.user.repository;

import com.taoke.user.entity.InstitutionEmployeeBinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 机构-员工绑定关系持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface InstitutionEmployeeBindingRepository extends JpaRepository<InstitutionEmployeeBinding, Integer> {

    List<InstitutionEmployeeBinding> findByOrgId(Integer orgId);

    Optional<InstitutionEmployeeBinding> findByEmployeeUserId(Integer employeeUserId);
}
