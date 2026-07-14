package com.taoke.user.api;

import com.taoke.common.dto.PageResult;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplyRequest;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;

/**
 * 推广大使申请服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
public interface AllianceAmbassadorApplicationService {

    AllianceAmbassadorApplicationResponse getLatestByUserId(Integer userId);

    AllianceAmbassadorApplicationResponse submit(
            Integer userId, AllianceAmbassadorApplyRequest request);

    PageResult<AllianceAmbassadorApplicationResponse> pageForAdmin(
            Integer status, int page, int size);

    AllianceAmbassadorApplicationResponse getById(Integer id);

    void approve(Integer id, Integer reviewerUserId);

    void reject(Integer id, Integer reviewerUserId, String reason);
}
