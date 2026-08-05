package com.taoke.course.repository;

import com.taoke.course.entity.cms.FooterLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 底部链接仓储
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public interface FooterLinkRepository extends JpaRepository<FooterLink, Integer> {

    List<FooterLink> findAllByOrderBySectionCodeAscSortOrderDescItemCodeAsc();

    List<FooterLink> findAllByEnabledTrueOrderBySectionCodeAscSortOrderDescItemCodeAsc();

    Optional<FooterLink> findByItemCode(String itemCode);
}
