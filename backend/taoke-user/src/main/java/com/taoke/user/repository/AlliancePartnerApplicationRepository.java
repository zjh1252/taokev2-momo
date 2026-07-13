package com.taoke.user.repository;

import com.taoke.user.entity.AlliancePartnerApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 培训合伙人申请数据访问接口。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
public interface AlliancePartnerApplicationRepository
        extends JpaRepository<AlliancePartnerApplication, Integer> {

    Optional<AlliancePartnerApplication> findFirstByUserIdOrderByIdDesc(Integer userId);

    Optional<AlliancePartnerApplication> findFirstByUserIdAndStatusOrderByIdDesc(
            Integer userId, Integer status);

    Page<AlliancePartnerApplication> findByStatus(Integer status, Pageable pageable);
}
