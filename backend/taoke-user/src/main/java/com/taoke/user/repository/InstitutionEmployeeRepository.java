package com.taoke.user.repository;

import com.taoke.user.entity.InstitutionEmployee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 机构员工信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
public interface InstitutionEmployeeRepository extends JpaRepository<InstitutionEmployee, Integer> {

    Optional<InstitutionEmployee> findByUserId(Integer userId);
}
