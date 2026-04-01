package com.taoke.user.api;

import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;

/**
 * 企业买家档案的查询与保存能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface EnterpriseBuyerService {

    /**
     * 根据用户 ID 查询企业买家档案。
     *
     * @param userId 用户 ID
     * @return 企业买家档案；不存在时由实现约定（可为 null 或抛业务异常）
     */
    EnterpriseBuyerResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的企业买家档案。
     *
     * @param userId  用户 ID
     * @param request 企业买家档案内容
     * @return 保存后的企业买家档案
     */
    EnterpriseBuyerResponse save(Integer userId, EnterpriseBuyerRequest request);
}
