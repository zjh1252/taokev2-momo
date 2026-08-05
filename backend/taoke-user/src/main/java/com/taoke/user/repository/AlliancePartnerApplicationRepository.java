package com.taoke.user.repository;

import com.taoke.user.entity.AlliancePartnerApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AlliancePartnerApplication a SET a.status = 2, a.reviewedAt = :reviewedAt,"
            + " a.reviewedBy = :reviewedBy, a.updatedAt = :reviewedAt"
            + " WHERE a.id = :id AND a.status = 1")
    int approveIfPending(
            @Param("id") Integer id,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewedBy") Integer reviewedBy);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AlliancePartnerApplication a SET a.status = 3, a.rejectReason = :reason,"
            + " a.reviewedAt = :reviewedAt, a.reviewedBy = :reviewedBy, a.updatedAt = :reviewedAt"
            + " WHERE a.id = :id AND a.status = 1")
    int rejectIfPending(
            @Param("id") Integer id,
            @Param("reason") String reason,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewedBy") Integer reviewedBy);
}
