package com.taoke.user.api;

import com.taoke.user.dto.buyer.BuyerRequest;
import com.taoke.user.dto.buyer.BuyerResponse;

/**
 * 个人买家档案的查询与保存能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface BuyerService {

    /**
     * 根据用户 ID 查询买家档案。
     *
     * @param userId 用户 ID
     * @return 买家档案；不存在时由实现约定（可为 null 或抛业务异常）
     */
    BuyerResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的买家档案。
     *
     * @param userId  用户 ID
     * @param request 买家档案内容
     * @return 保存后的买家档案
     */
    BuyerResponse save(Integer userId, BuyerRequest request);
}
