package com.taoke.admin.dto;

import com.taoke.common.entity.SensitiveWord;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 敏感词展示对象
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
@Data
public class SensitiveWordVO {

    private Integer id;
    private String word;
    private Integer category;
    private String replacement;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SensitiveWordVO from(SensitiveWord entity) {
        SensitiveWordVO vo = new SensitiveWordVO();
        vo.setId(entity.getId());
        vo.setWord(entity.getWord());
        vo.setCategory(entity.getCategory());
        vo.setReplacement(entity.getReplacement());
        vo.setEnabled(entity.getEnabled());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }
}
