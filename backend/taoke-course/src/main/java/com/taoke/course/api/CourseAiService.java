package com.taoke.course.api;

import com.taoke.course.dto.course.AiParseMaterialResultVO;
import org.springframework.web.multipart.MultipartFile;

/**
 * 课程模块 AI 编排服务。
 *
 * <p>负责把「上传文件 → 抽取全文 → 调用 LLM → 结构化字段 → 分类映射」整个流程串起来，
 * 屏蔽通用 {@link com.taoke.common.ai.AiChatService} 与领域细节（分类候选、提示词等）。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
public interface CourseAiService {

    /**
     * 解析课程资料文件，返回上传 URL、全文及 AI 提取出的结构化字段。
     *
     * @param file 上传的 docx / pdf 文件
     * @return 解析结果
     */
    AiParseMaterialResultVO parseMaterial(MultipartFile file);
}
