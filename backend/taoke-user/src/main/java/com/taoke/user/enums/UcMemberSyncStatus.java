package com.taoke.user.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * UC 成员详情同步状态。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Getter
@RequiredArgsConstructor
public enum UcMemberSyncStatus {

    LOOKUP_ONLY(0),
    PROFILE_SYNCED(1);

    private final int code;
}
