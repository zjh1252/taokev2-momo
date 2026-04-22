package com.taoke.user.repository;

import com.taoke.user.entity.InstitutionVenue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 机构场地持久化。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
public interface InstitutionVenueRepository extends JpaRepository<InstitutionVenue, Integer> {

    List<InstitutionVenue> findByInstitutionIdOrderBySortOrderDescIdDesc(Integer institutionId);

    long countByInstitutionId(Integer institutionId);
}
