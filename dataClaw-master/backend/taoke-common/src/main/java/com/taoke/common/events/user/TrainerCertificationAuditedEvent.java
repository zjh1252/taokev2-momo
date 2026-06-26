package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家资质认证审核结果事件。
 * <p>
 * 涵盖实名认证、专业认证、学历认证、工作认证四个维度。
 * 由后台管理员审核（通过 / 驳回）后发布，
 * {@link com.taoke.common.events.user 站内信消费者} 据此向专家发送通知。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public class TrainerCertificationAuditedEvent extends DomainEvent {

    /** 维度：REAL_NAME / PROFESSIONAL / EDUCATION / WORK */
    private String dimension;

    /** 是否通过（true=通过，false=驳回） */
    private boolean approved;

    /** 专家用户 ID */
    private Integer trainerUserId;

    /** 维度内业务对象 ID（实名/专业认证使用 trainerId；学历/工作使用记录 ID） */
    private Integer recordId;

    /** 摘要（用于站内信正文，例如学校名称、单位名称） */
    private String summary;

    /** 驳回原因（approved=false 时有意义） */
    private String rejectReason;

    public static final class Dimension {
        public static final String REAL_NAME = "REAL_NAME";
        public static final String PROFESSIONAL = "PROFESSIONAL";
        public static final String EDUCATION = "EDUCATION";
        public static final String WORK = "WORK";
        private Dimension() {}
    }

    /** Jackson 反序列化 */
    protected TrainerCertificationAuditedEvent() {
    }

    public TrainerCertificationAuditedEvent(String dimension, boolean approved, Integer trainerUserId,
                                            Integer recordId, String summary, String rejectReason) {
        super("TrainerCertification", String.valueOf(trainerUserId));
        this.dimension = dimension;
        this.approved = approved;
        this.trainerUserId = trainerUserId;
        this.recordId = recordId;
        this.summary = summary;
        this.rejectReason = rejectReason;
    }
}
