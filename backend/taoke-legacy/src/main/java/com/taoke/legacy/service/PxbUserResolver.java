package com.taoke.legacy.service;

import com.taoke.legacy.config.LegacyApiProperties;
import com.taoke.legacy.security.LegacyApiContext;
import com.taoke.user.api.MemberProviderService;
import com.taoke.user.api.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

/**
 * 培训宝 uid → 本地 userId（对齐 get_tkw_uid_by_provider + cdbid 映射）。
 */
@Service
@RequiredArgsConstructor
public class PxbUserResolver {

    private final LegacyApiProperties legacyApiProperties;
    private final UserService userService;
    private final MemberProviderService memberProviderService;

    /**
     * 从 request 上下文解析 appid 后映射用户。
     */
    public int resolveUserId(HttpServletRequest request, int pxbUid) {
        return resolveUserId(resolveAppid(request), pxbUid);
    }

    /**
     * 按 appid 映射：signature-urls 接入商走 MemberProvider，否则 cdbid → uc_uid。
     */
    public int resolveUserId(String appid, int pxbUid) {
        if (pxbUid <= 0) {
            return 0;
        }
        if (legacyApiProperties.isPartnerApp(appid)) {
            return memberProviderService.resolveTkwUserId(appid, pxbUid);
        }
        return userService.findUserIdByUcUid(pxbUid).orElse(0);
    }

    /** 兼容旧调用：默认按培训宝 cdbid 映射。 */
    public int resolveUserId(int pxbCdbid) {
        return resolveUserId("pxb", pxbCdbid);
    }

    /** 批量 uid 映射（getOrders filter[uids]）。 */
    public List<Integer> resolveUserIds(HttpServletRequest request, Collection<Integer> pxbUids) {
        if (pxbUids == null || pxbUids.isEmpty()) {
            return List.of();
        }
        String appid = resolveAppid(request);
        if (legacyApiProperties.isPartnerApp(appid)) {
            return memberProviderService.resolveTkwUserIds(appid, pxbUids);
        }
        return userService.findUserIdsByUcUids(pxbUids);
    }

    public String resolveAppid(HttpServletRequest request) {
        Object ctx = request.getAttribute(LegacyApiContext.ATTR);
        if (ctx instanceof LegacyApiContext legacyApiContext) {
            return legacyApiContext.getAppid();
        }
        return "pxb";
    }
}
