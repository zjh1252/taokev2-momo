package com.taoke.user.repository;

import com.taoke.user.entity.TrainerHighlight;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 专家精彩瞬间 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
public interface TrainerHighlightRepository extends JpaRepository<TrainerHighlight, Integer>,
        JpaSpecificationExecutor<TrainerHighlight> {

    List<TrainerHighlight> findByTrainerIdOrderBySortOrderAsc(Integer trainerId);

    List<TrainerHighlight> findByTrainerIdAndStatusOrderBySortOrderAsc(Integer trainerId, Integer status);

    List<TrainerHighlight> findByInstitutionIdOrderBySortOrderAsc(Integer institutionId);

    List<TrainerHighlight> findByInstitutionIdAndStatusOrderBySortOrderAsc(Integer institutionId, Integer status);

    @Query("SELECT h FROM TrainerHighlight h WHERE h.status = 1 AND (h.institutionId = :institutionId OR h.trainerId IN :trainerIds) ORDER BY h.sortOrder DESC, h.id DESC")
    List<TrainerHighlight> findApprovedForInstitution(@Param("institutionId") Integer institutionId,
                                                      @Param("trainerIds") List<Integer> trainerIds,
                                                      org.springframework.data.domain.Pageable pageable);
}
