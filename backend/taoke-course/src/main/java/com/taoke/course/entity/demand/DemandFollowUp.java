package com.taoke.course.entity.demand;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;

/**
 * 需求跟进记录实体 — 对应 demand_follow_ups 表
 * <p>
 * 记录需求的每一次跟进操作（客服备注、状态变更、沟通记录等），形成完整的需求处理链路。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
@Setter
@Entity
@Table(name = "demand_follow_ups")
@DynamicInsert
public class DemandFollowUp extends BaseEntity {

    /** 关联 demands.id */
    @Column(name = "demand_id", nullable = false)
    private Integer demandId;

    /** 操作人 ID，关联 users.id（系统/游客操作时为空） */
    @Column(name = "operator_id")
    private Integer operatorId;

    /** 操作类型 */
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    /** 操作内容/备注详情 */
    @Column(name = "content", columnDefinition = "text")
    private String content;

    /** 变更前状态 */
    @Column(name = "old_status", columnDefinition = "tinyint(2)")
    private Integer oldStatus;

    /** 变更后状态 */
    @Column(name = "new_status", columnDefinition = "tinyint(2)")
    private Integer newStatus;
}
