package com.taoke.user.repository;

import com.taoke.user.entity.AllianceLecturer721Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 721 讲师合作申请数据访问接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
public interface AllianceLecturer721ApplicationRepository
        extends JpaRepository<AllianceLecturer721Application, Integer> {

    Optional<AllianceLecturer721Application> findFirstByUserIdOrderByIdDesc(Integer userId);

    Optional<AllianceLecturer721Application> findFirstByUserIdAndStatusOrderByIdDesc(
            Integer userId, Integer status);

    Page<AllianceLecturer721Application> findByStatus(Integer status, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AllianceLecturer721Application a SET a.status = 2, a.reviewedAt = :reviewedAt,"
            + " a.reviewedBy = :reviewedBy, a.updatedAt = :reviewedAt"
            + " WHERE a.id = :id AND a.status = 1")
    int approveIfPending(
            @Param("id") Integer id,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewedBy") Integer reviewedBy);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AllianceLecturer721Application a SET a.status = 3, a.rejectReason = :reason,"
            + " a.reviewedAt = :reviewedAt, a.reviewedBy = :reviewedBy, a.updatedAt = :reviewedAt"
            + " WHERE a.id = :id AND a.status = 1")
    int rejectIfPending(
            @Param("id") Integer id,
            @Param("reason") String reason,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewedBy") Integer reviewedBy);
}
