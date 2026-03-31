package com.taoke.user.dto.enterprise;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 企业信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class EnterpriseInfoResponse {

    private Integer id;
    private String companyName;
    private String industry;
    private String companySize;
    private String contactName;
    private String contactPhone;
    private String postCode;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;
    private String trainingTags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
