package com.taoke.user.repository;

import com.taoke.user.entity.TrainerBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 专家著作仓储
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
public interface TrainerBookRepository extends JpaRepository<TrainerBook, Integer> {

    /** 按专家 ID 取著作列表，sort_order 倒序、id 倒序 */
    List<TrainerBook> findByTrainerIdOrderBySortOrderDescIdDesc(Integer trainerId);
}
