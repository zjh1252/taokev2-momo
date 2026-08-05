package com.taoke.user.api;

import com.taoke.common.dto.PageResult;
import com.taoke.user.dto.alliance.AlliancePartnerApplyRequest;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;

/**
 * 培训合伙人申请服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
public interface AlliancePartnerApplicationService {

    AlliancePartnerApplicationResponse getLatestByUserId(Integer userId);

    AlliancePartnerApplicationResponse submit(
            Integer userId, AlliancePartnerApplyRequest request);

    PageResult<AlliancePartnerApplicationResponse> pageForAdmin(
            Integer status, int page, int size);

    AlliancePartnerApplicationResponse getById(Integer id);

    void approve(Integer id, Integer reviewerUserId);

    void reject(Integer id, Integer reviewerUserId, String reason);
}
