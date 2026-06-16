package com.taoke.admin.service;

import com.taoke.admin.dto.AdminVideoCommentQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoCommentAdminService;
import com.taoke.course.dto.video.AdminVideoCommentListItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台录播课评论编排服务
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminVideoCommentService {

    private final VideoCommentAdminService videoCommentAdminService;

    public PageResponse<AdminVideoCommentListItemVO> list(AdminVideoCommentQuery query) {
        return videoCommentAdminService.list(
                query.getAuditStatus(), query.getKeyword(), query.getVideoId(),
                query.getPage(), query.getSize());
    }

    public void approve(Integer id) {
        videoCommentAdminService.approve(id);
    }

    public void reject(Integer id, String reason) {
        videoCommentAdminService.reject(id, reason);
    }

    public void delete(Integer id) {
        videoCommentAdminService.delete(id);
    }

    public void batchApprove(BatchIdsRequest request) {
        videoCommentAdminService.batchApprove(request.getIds());
    }

    public void batchReject(BatchIdsRequest request, String reason) {
        videoCommentAdminService.batchReject(request.getIds(), reason);
    }

    public void batchDelete(BatchIdsRequest request) {
        videoCommentAdminService.batchDelete(request.getIds());
    }
}
