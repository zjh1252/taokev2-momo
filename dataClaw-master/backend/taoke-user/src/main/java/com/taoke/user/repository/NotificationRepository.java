package com.taoke.user.repository;

import com.taoke.user.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 站内信通知持久化。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    /** 分页查询用户通知（按时间倒序） */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    /** 统计用户未读通知数 */
    long countByUserIdAndIsRead(Integer userId, Integer isRead);

    /** 批量标记已读 */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = 1 WHERE n.userId = :userId AND n.isRead = 0")
    int markAllReadByUserId(@Param("userId") Integer userId);
}
