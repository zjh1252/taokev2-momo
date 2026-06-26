package com.taoke.user.repository;

import com.taoke.user.entity.UserUcMemberLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * UC 成员关联 Repository。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
public interface UserUcMemberLinkRepository extends JpaRepository<UserUcMemberLink, Integer> {

    Optional<UserUcMemberLink> findByIdAndOrgLinkId(Integer id, Integer orgLinkId);

    List<UserUcMemberLink> findByOrgLinkIdOrderByCreatedAtDesc(Integer orgLinkId);

    Optional<UserUcMemberLink> findByBindingRefTypeAndBindingRefId(String bindingRefType, Integer bindingRefId);

    List<UserUcMemberLink> findByBindingRefTypeAndBindingRefIdIn(String bindingRefType, List<Integer> bindingRefIds);

    void deleteByOrgLinkId(Integer orgLinkId);
}
