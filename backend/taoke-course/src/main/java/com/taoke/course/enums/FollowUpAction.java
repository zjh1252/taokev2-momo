package com.taoke.course.enums;

import lombok.Getter;

/**
 * 需求跟进操作类型枚举
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public enum FollowUpAction {

    STATUS_CHANGE("状态变更"),
    CS_NOTE("客服备注"),
    CONTACT_RECORD("沟通记录"),
    ASSIGN_CS("分派客服"),
    MATCH_TRIGGER("触发匹配"),
    SYNC_RETRY("同步重试");

    private final String label;

    FollowUpAction(String label) {
        this.label = label;
    }
}
