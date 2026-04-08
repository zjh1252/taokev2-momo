package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.TrainerLeadMessage;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 专家留言持久化
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface TrainerLeadMessageRepository extends JpaRepository<TrainerLeadMessage, Integer> {
}
