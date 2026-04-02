package com.taoke.user.repository;

import com.taoke.user.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 通知模板持久化。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Integer> {

    Optional<NotificationTemplate> findByCode(String code);

    List<NotificationTemplate> findByEnabled(Integer enabled);

    boolean existsByCode(String code);
}
