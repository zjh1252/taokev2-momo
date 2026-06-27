package com.taoke.legacy.service;

import com.taoke.user.api.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 培训宝 uid（cdbid / uc_uid）→ 本地 userId。
 */
@Service
@RequiredArgsConstructor
public class PxbUserResolver {

    private final UserService userService;

    /**
     * @param pxbCdbid 培训宝 POST 参数 uid（UCenter cdbid）
     * @return 本地 sys_users.id；未关联时 0
     */
    public int resolveUserId(int pxbCdbid) {
        if (pxbCdbid <= 0) {
            return 0;
        }
        return userService.findUserIdByUcUid(pxbCdbid).orElse(0);
    }
}
