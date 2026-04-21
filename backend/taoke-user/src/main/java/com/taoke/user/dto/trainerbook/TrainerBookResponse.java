package com.taoke.user.dto.trainerbook;

import com.taoke.user.entity.TrainerBook;
import lombok.Data;

import java.time.LocalDate;

/**
 * 专家著作响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
@Data
public class TrainerBookResponse {

    private Integer id;
    private Integer trainerId;
    private String title;
    private String coverUrl;
    private String publisher;
    private LocalDate publishDate;
    private String description;
    private String buyUrl;
    private Integer sortOrder;

    public static TrainerBookResponse from(TrainerBook b) {
        TrainerBookResponse r = new TrainerBookResponse();
        r.setId(b.getId());
        r.setTrainerId(b.getTrainerId());
        r.setTitle(b.getTitle());
        r.setCoverUrl(b.getCoverUrl());
        r.setPublisher(b.getPublisher());
        r.setPublishDate(b.getPublishDate());
        r.setDescription(b.getDescription());
        r.setBuyUrl(b.getBuyUrl());
        r.setSortOrder(b.getSortOrder());
        return r;
    }
}
