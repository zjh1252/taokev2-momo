package com.taoke.course.dto.learning;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 继续学习 VO — 用于 Dashboard "继续学习"卡片
 * <p>
 * 在 {@link MyVideoLearningVO} 基础上增加上次学到的章节标题。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:30
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ContinueLearningVO extends MyVideoLearningVO {

    /** 上次学到的章节标题 */
    private String lastChapterTitle;
}
