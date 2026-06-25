package com.taoke.admin.dto;

import com.taoke.user.dto.trainer.TrainerHonorDTO;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 后台运营编辑专家档案请求。
 *
 * @author Fangxinxin
 * @date 2026-06-25 20:00
 */
@Data
public class AdminTrainerUpdateRequest {

    private String name;
    private String teachingName;
    private String avatar;
    private String title;
    private Integer gender;
    private String phone;
    private String email;
    private Integer provinceId;
    private Integer cityId;
    private String idCardNo;
    private String resumeUrl;

    private String bio;
    private String oneLineIntro;
    private String intro;
    private String background;
    private String partialClients;
    private String goodAt;
    private String specialties;
    private String expertiseTags;
    private String teachingStyle;
    private Integer experienceYears;
    private Integer teachingYears;

    private BigDecimal quoteMin;
    private BigDecimal quoteMax;
    private String quoteUnit;
    private String quoteRemark;
    private BigDecimal taokePrice;
    private BigDecimal taokeCommission;

    private List<Integer> industryCategoryIds;
    private List<Integer> expertiseCategoryIds;
    private List<TrainerHonorDTO> honors;
    private List<SaveTrainerBookRequest> books;
}
