package com.taoke.user.repository;

import com.taoke.user.entity.TrainerHighlightFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

/**
 * 精彩瞬间文件 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 20:00
 */
public interface TrainerHighlightFileRepository extends JpaRepository<TrainerHighlightFile, Integer> {

    List<TrainerHighlightFile> findByHighlightIdOrderBySortOrderAsc(Integer highlightId);

    List<TrainerHighlightFile> findByHighlightIdInOrderBySortOrderAsc(Collection<Integer> highlightIds);

    @Modifying
    @Query("DELETE FROM TrainerHighlightFile f WHERE f.highlightId = :highlightId")
    void deleteByHighlightId(Integer highlightId);
}
