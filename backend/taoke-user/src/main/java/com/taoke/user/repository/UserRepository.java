package com.taoke.user.repository;

import com.taoke.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 用户实体持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface UserRepository extends JpaRepository<User, Integer>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    /** 按 UCenter 用户 ID 查找（接入 UCenter 账号中心后用于关联本地用户） */
    Optional<User> findByUcUid(Integer ucUid);

    List<User> findByUcUidIn(Collection<Integer> ucUids);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findByStatus(Integer status);

    long countByCreatedAtAfter(LocalDateTime time);
}
