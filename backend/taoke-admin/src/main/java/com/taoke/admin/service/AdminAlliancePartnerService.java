package com.taoke.admin.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AlliancePartnerApplicationService;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台培训合伙人申请审核编排服务。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:25
 */
@Service
@RequiredArgsConstructor
public class AdminAlliancePartnerService {

    private final AlliancePartnerApplicationService alliancePartnerApplicationService;

    public PageResult<AlliancePartnerApplicationResponse> page(
            Integer status, int page, int size) {
        return alliancePartnerApplicationService.pageForAdmin(status, page, size);
    }

    public AlliancePartnerApplicationResponse get(Integer id) {
        return alliancePartnerApplicationService.getById(id);
    }

    public void approve(Integer id) {
        alliancePartnerApplicationService.approve(id, SecurityUtils.getRequiredUserId());
    }

    public void reject(Integer id, String reason) {
        alliancePartnerApplicationService.reject(
                id, SecurityUtils.getRequiredUserId(), reason);
    }
}
