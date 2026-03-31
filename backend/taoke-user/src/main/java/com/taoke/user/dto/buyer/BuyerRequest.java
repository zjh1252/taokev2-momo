package com.taoke.user.dto.buyer;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存学员档案请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class BuyerRequest {

    @Size(max = 64, message = "职业不超过64个字符")
    private String occupation;

    /** 学习兴趣标签，JSON 数组字符串 */
    @Size(max = 512, message = "学习兴趣标签不超过512个字符")
    private String learningTags;
}
