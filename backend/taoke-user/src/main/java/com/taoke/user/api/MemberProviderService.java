package com.taoke.user.api;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 接入商用户映射（对齐老站 MemberProvider.php）。
 */
public interface MemberProviderService {

    /**
     * 按本地用户 ID 查接入商绑定（对齐 GetProviderByTkwid）。
     */
    Optional<MemberProviderBinding> findByTkwUserId(int tkwUserId);

    /**
     * 接入商 root_company_id → 本地 userId；不存在时自动注册（对齐 get_tkw_uid_by_provider）。
     */
    int resolveTkwUserId(String appid, int rootCompanyId);

    /**
     * 批量解析接入商 root_company_id → 本地 userId 列表。
     */
    List<Integer> resolveTkwUserIds(String appid, Collection<Integer> rootCompanyIds);

    /** 接入商绑定信息 */
    record MemberProviderBinding(String tkwType, int rootCompanyId, int tkwUserId) {}
}
