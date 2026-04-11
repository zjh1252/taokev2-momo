package com.taoke.user.repository;

import com.taoke.user.entity.TrainerCaseFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 专家案例文件 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
public interface TrainerCaseFileRepository extends JpaRepository<TrainerCaseFile, Integer> {

    List<TrainerCaseFile> findByCaseIdOrderBySortOrderAsc(Integer caseId);

    List<TrainerCaseFile> findByTrainerIdAndCaseId(Integer trainerId, Integer caseId);

    void deleteByCaseId(Integer caseId);
}
