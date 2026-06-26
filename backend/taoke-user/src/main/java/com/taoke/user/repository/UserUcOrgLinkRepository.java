package com.taoke.user.repository;

import com.taoke.user.entity.UserUcOrgLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * UC 组织映射 Repository。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
public interface UserUcOrgLinkRepository extends JpaRepository<UserUcOrgLink, Integer> {

    Optional<UserUcOrgLink> findByOrgTypeAndOrgId(String orgType, Integer orgId);
}
