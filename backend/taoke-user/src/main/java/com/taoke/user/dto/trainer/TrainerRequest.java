package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存专家档案请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class TrainerRequest {

    @Size(max = 64, message = "头衔不超过64个字符")
    private String title;

    /** 个人简介（支持富文本） */
    private String bio;

    /** 擅长领域，JSON 数组字符串 */
    @Size(max = 512, message = "擅长领域不超过512个字符")
    private String specialties;

    /** 从业年限 */
    private Integer experienceYears;

    @Size(max = 64, message = "最高学历不超过64个字符")
    private String education;

    /** 资质等级：0=普通，1=认证，2=高级认证 */
    private Integer qualificationLevel;

    /** 主页配置，JSON 字符串 */
    private String homepageConfig;

    /** 授课城市 ID 列表，JSON 数组字符串 */
    @Size(max = 512, message = "授课城市列表不超过512个字符")
    private String serviceCityIds;

    @Size(max = 128, message = "联系偏好不超过128个字符")
    private String contactPreference;
}
