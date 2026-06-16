package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.AdminVideoCommentListItemVO;

import java.util.List;

/**
 * 录播课评论管理接口 — 供 taoke-admin 编排层调用
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoCommentAdminService {

    PageResponse<AdminVideoCommentListItemVO> list(Integer auditStatus, String keyword,
                                                      Integer videoId, int page, int size);

    void approve(Integer id);

    void reject(Integer id, String reason);

    void delete(Integer id);

    void batchApprove(List<Integer> ids);

    void batchReject(List<Integer> ids, String reason);

    void batchDelete(List<Integer> ids);
}
