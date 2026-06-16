package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.TrainerLeadMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 专家留言持久化
 *
 * <p>通过 {@link JpaSpecificationExecutor} 支持后台多条件分页查询
 * （状态 / 目标专家 / 关键字模糊匹配）。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface TrainerLeadMessageRepository extends JpaRepository<TrainerLeadMessage, Integer>,
        JpaSpecificationExecutor<TrainerLeadMessage> {
}
