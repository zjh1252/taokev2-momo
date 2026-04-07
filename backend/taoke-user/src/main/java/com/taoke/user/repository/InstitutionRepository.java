package com.taoke.user.repository;

import com.taoke.user.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * 机构信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
public interface InstitutionRepository extends JpaRepository<Institution, Integer>,
        JpaSpecificationExecutor<Institution> {

    Optional<Institution> findByUserId(Integer userId);
}
