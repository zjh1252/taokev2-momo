package com.taoke.user.api;

import com.taoke.user.dto.venue.InstitutionVenueRequest;
import com.taoke.user.dto.venue.InstitutionVenueResponse;

import java.util.List;

/**
 * 机构场地服务接口。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
public interface InstitutionVenueService {

    /** 当前机构主体的场地列表 */
    List<InstitutionVenueResponse> listMyVenues(Integer institutionUserId);

    /** 创建场地 */
    InstitutionVenueResponse createVenue(Integer institutionUserId, InstitutionVenueRequest request);

    /** 更新场地 */
    InstitutionVenueResponse updateVenue(Integer institutionUserId, Integer venueId, InstitutionVenueRequest request);

    /** 切换启停 */
    void toggleStatus(Integer institutionUserId, Integer venueId);

    /** 删除场地 */
    void deleteVenue(Integer institutionUserId, Integer venueId);

    /** 公开：按机构 ID 查询启用的场地（机构详情页可用） */
    List<InstitutionVenueResponse> listPublicByInstitutionId(Integer institutionId);
}
