package com.taoke.user.api;

import com.taoke.common.dto.PageResult;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplyRequest;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;

/**
 * 721 讲师合作申请服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
public interface AllianceLecturer721ApplicationService {

    AllianceLecturer721ApplicationResponse getLatestByUserId(Integer userId);

    AllianceLecturer721ApplicationResponse submit(
            Integer userId, AllianceLecturer721ApplyRequest request);

    PageResult<AllianceLecturer721ApplicationResponse> pageForAdmin(
            Integer status, int page, int size);

    AllianceLecturer721ApplicationResponse getById(Integer id);

    void approve(Integer id, Integer reviewerUserId);

    void reject(Integer id, Integer reviewerUserId, String reason);
}
