package com.taoke.admin.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AllianceAmbassadorApplicationService;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台推广大使申请审核编排服务。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Service
@RequiredArgsConstructor
public class AdminAllianceAmbassadorService {

    private final AllianceAmbassadorApplicationService allianceAmbassadorApplicationService;

    public PageResult<AllianceAmbassadorApplicationResponse> page(
            Integer status, int page, int size) {
        return allianceAmbassadorApplicationService.pageForAdmin(status, page, size);
    }

    public AllianceAmbassadorApplicationResponse get(Integer id) {
        return allianceAmbassadorApplicationService.getById(id);
    }

    public void approve(Integer id) {
        allianceAmbassadorApplicationService.approve(id, SecurityUtils.getRequiredUserId());
    }

    public void reject(Integer id, String reason) {
        allianceAmbassadorApplicationService.reject(
                id, SecurityUtils.getRequiredUserId(), reason);
    }
}
