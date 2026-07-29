package com.taoke.course.dto.city;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.trainer.TrainerListItemResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 城市综合频道页聚合数据 — 一次返回详情 + 各业务块列表。
 *
 * @author Fangxinxin
 * @date 2026-07-29 15:50
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CityChannelHomeVO {

    /** 城市解析结果（与 GET /cities/{enName} 同口径） */
    private CityChannelDetailVO detail;

    /** 最近开课公开课（ENROLLING + sortBy=time） */
    private PageResponse<CourseListItemVO> upcomingOpen;

    /** 热门内训（trainerCityId + sortBy=viewCount） */
    private PageResponse<CourseListItemVO> hotInner;

    /** 最新公开课（sortBy=published） */
    private PageResponse<CourseListItemVO> latestOpen;

    /** 最新录播课（无城市过滤，与现前端口径一致） */
    private PageResponse<VideoListItemVO> latestVideos;

    /** 最新入驻机构 */
    private PageResponse<InstitutionListItemResponse> institutions;

    /** 最新授课专家 */
    private PageResponse<TrainerListItemResponse> trainers;
}
