package com.taoke.common.repository;

import com.taoke.common.entity.SensitiveWord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 敏感词 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
public interface SensitiveWordRepository extends JpaRepository<SensitiveWord, Integer> {

    Optional<SensitiveWord> findByWord(String word);

    boolean existsByWord(String word);

    /** 查询所有已启用的敏感词 */
    @Query("SELECT s.word, s.replacement FROM SensitiveWord s WHERE s.enabled = true")
    List<Object[]> findAllEnabledWordAndReplacement();

    /** 按分类分页查询 */
    Page<SensitiveWord> findByCategory(Integer category, Pageable pageable);

    /** 按关键词模糊搜索 */
    @Query("SELECT s FROM SensitiveWord s WHERE (:keyword IS NULL OR s.word LIKE %:keyword%) " +
            "AND (:category IS NULL OR s.category = :category) " +
            "AND (:enabled IS NULL OR s.enabled = :enabled)")
    Page<SensitiveWord> search(@Param("keyword") String keyword,
                               @Param("category") Integer category,
                               @Param("enabled") Boolean enabled,
                               Pageable pageable);
}
