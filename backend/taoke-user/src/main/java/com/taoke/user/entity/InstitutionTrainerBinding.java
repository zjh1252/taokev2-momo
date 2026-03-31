package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 机构-专家绑定关系实体。
 * <p>
 * 绑定状态：1=生效，2=待确认，3=已解绑
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_institution_trainer_bindings")
public class InstitutionTrainerBinding extends BaseEntity {

    /** 机构 ID */
    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    /** 专家用户 ID */
    @Column(name = "trainer_user_id", nullable = false)
    private Integer trainerUserId;

    /** 绑定状态：1=生效，2=待确认，3=已解绑 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 2;

    /** 确认时间 */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
