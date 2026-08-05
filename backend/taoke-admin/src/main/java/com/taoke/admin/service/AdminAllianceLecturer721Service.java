package com.taoke.admin.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AllianceLecturer721ApplicationService;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台 721 讲师合作申请审核编排服务。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Service
@RequiredArgsConstructor
public class AdminAllianceLecturer721Service {

    private final AllianceLecturer721ApplicationService allianceLecturer721ApplicationService;

    public PageResult<AllianceLecturer721ApplicationResponse> page(
            Integer status, int page, int size) {
        return allianceLecturer721ApplicationService.pageForAdmin(status, page, size);
    }

    public AllianceLecturer721ApplicationResponse get(Integer id) {
        return allianceLecturer721ApplicationService.getById(id);
    }

    public void approve(Integer id) {
        allianceLecturer721ApplicationService.approve(id, SecurityUtils.getRequiredUserId());
    }

    public void reject(Integer id, String reason) {
        allianceLecturer721ApplicationService.reject(
                id, SecurityUtils.getRequiredUserId(), reason);
    }
}
