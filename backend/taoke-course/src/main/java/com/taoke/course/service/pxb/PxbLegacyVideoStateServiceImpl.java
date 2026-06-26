package com.taoke.course.service.pxb;

import com.taoke.common.enums.BusinessRole;
import com.taoke.course.api.PxbLegacyVideoStateService;
import com.taoke.course.entity.video.Video;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PxbLegacyVideoStateServiceImpl implements PxbLegacyVideoStateService {

    private final VideoRepository videoRepository;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;

    @Override
    public Map<String, Object> getDetailStatus(int videoId) {
        if (videoId <= 0) {
            return Map.of("isok", false, "info", "视频Id不能为空。");
        }
        return videoRepository.findById(videoId)
                .map(this::toStatusMap)
                .orElseGet(() -> Map.of(
                        "isok", false,
                        "info", "视频Id " + videoId + " 内容不存在。"));
    }

    private Map<String, Object> toStatusMap(Video video) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("isok", true);

        int status = video.getStatus() != null ? video.getStatus() : VideoStatus.DRAFT.getValue();
        if (status == VideoStatus.PUBLISHED.getValue()) {
            result.put("isapprove", 1);
            result.put("info", "视频Id " + video.getId() + " 内容审核通过。");
            result.put("detail_url", buildDetailUrl(video));
        } else if (status == VideoStatus.PENDING.getValue()) {
            result.put("isapprove", 0);
            result.put("info", "视频Id " + video.getId() + " 内容待审核。");
        } else if (status == VideoStatus.REJECTED.getValue()) {
            result.put("isapprove", -1);
            result.put("info", "视频Id " + video.getId() + " 内容审核失败。");
            result.put("approveinfo", video.getRejectReason() != null ? video.getRejectReason() : "");
        } else {
            result.put("isapprove", 0);
            result.put("info", "视频Id " + video.getId() + " 内容待审核。");
        }
        return result;
    }

    private String buildDetailUrl(Video video) {
        Integer publisherId = video.getPublisherId();
        if (publisherId == null || publisherId <= 0) {
            return "/video/" + video.getId() + ".htm";
        }
        if (Objects.equals(BusinessRole.Code.INSTITUTION, video.getPublisherType())) {
            List<Institution> institutions = institutionService.findByUserIds(List.of(publisherId));
            if (!institutions.isEmpty() && institutions.get(0).getLegacyRoleId() != null
                    && institutions.get(0).getLegacyRoleId() > 0) {
                return "/company/" + institutions.get(0).getLegacyRoleId()
                        + "/video_detail/" + video.getId() + ".htm";
            }
        }
        List<Trainer> trainers = trainerService.findByUserIds(List.of(publisherId));
        if (!trainers.isEmpty()) {
            return "/trainer/" + trainers.get(0).getId()
                    + "/video_detail/" + video.getId() + ".htm";
        }
        return "/member/" + publisherId + "/video_detail/" + video.getId() + ".htm";
    }
}
