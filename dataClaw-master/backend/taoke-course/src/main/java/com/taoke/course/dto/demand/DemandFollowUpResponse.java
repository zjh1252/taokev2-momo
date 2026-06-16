package com.taoke.course.dto.demand;

import com.taoke.course.entity.demand.DemandFollowUp;
import com.taoke.course.enums.DemandStatus;
import com.taoke.course.enums.FollowUpAction;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 需求跟进记录响应
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class DemandFollowUpResponse {

    private Integer id;
    private Integer demandId;
    private Integer operatorId;
    private String action;
    private String actionLabel;
    private String content;
    private Integer oldStatus;
    private String oldStatusLabel;
    private Integer newStatus;
    private String newStatusLabel;
    private LocalDateTime createdAt;

    /** 操作人名称（由上层组装） */
    private String operatorName;

    public static DemandFollowUpResponse from(DemandFollowUp f) {
        DemandFollowUpResponse r = new DemandFollowUpResponse();
        r.setId(f.getId());
        r.setDemandId(f.getDemandId());
        r.setOperatorId(f.getOperatorId());
        r.setAction(f.getAction());
        try {
            r.setActionLabel(FollowUpAction.valueOf(f.getAction()).getLabel());
        } catch (Exception ignored) {
            r.setActionLabel(f.getAction());
        }
        r.setContent(f.getContent());
        r.setOldStatus(f.getOldStatus());
        if (f.getOldStatus() != null) {
            try {
                r.setOldStatusLabel(DemandStatus.of(f.getOldStatus()).getLabel());
            } catch (Exception ignored) {
            }
        }
        r.setNewStatus(f.getNewStatus());
        if (f.getNewStatus() != null) {
            try {
                r.setNewStatusLabel(DemandStatus.of(f.getNewStatus()).getLabel());
            } catch (Exception ignored) {
            }
        }
        r.setCreatedAt(f.getCreatedAt());
        return r;
    }
}
