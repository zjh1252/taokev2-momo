package com.taoke.admin.service;

import com.taoke.admin.dto.AdminVideoQuery;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.video.VideoApprovedEvent;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.VideoDetailVO;
import com.taoke.course.dto.video.VideoListItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台录播课管理编排服务
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:30
 */
@Service
@RequiredArgsConstructor
public class AdminVideoService {

    private final VideoService videoService;
    private final EventPublisher eventPublisher;

    /**
     * 分页查询录播课列表
     */
    public PageResponse<VideoListItemVO> listVideos(AdminVideoQuery query) {
        return videoService.listForAdmin(query.getStatus(), query.getKeyword(),
                query.getPage(), query.getSize());
    }

    /**
     * 录播课详情
     */
    public VideoDetailVO getDetail(Integer videoId) {
        return videoService.getAdminDetail(videoId);
    }

    /**
     * 审核通过，并发布领域事件
     */
    public void approve(Integer videoId) {
        VideoDetailVO detail = videoService.getAdminDetail(videoId);
        videoService.approve(videoId);
        eventPublisher.publish(new VideoApprovedEvent(videoId, detail.getPublisherId(), detail.getTitle()));
    }

    /**
     * 驳回
     */
    public void reject(Integer videoId, String reason) {
        videoService.reject(videoId, reason);
    }

    /**
     * 后台下架
     */
    public void unpublish(Integer videoId) {
        videoService.adminUnpublish(videoId);
    }

    /**
     * 后台重新上架（已下架 → 已上架）
     */
    public void publish(Integer videoId) {
        videoService.adminPublish(videoId);
    }
}
