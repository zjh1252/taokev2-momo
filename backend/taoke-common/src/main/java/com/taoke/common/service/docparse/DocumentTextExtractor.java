package com.taoke.common.service.docparse;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.resumeparse.DocxTextExtractor;
import com.taoke.common.service.resumeparse.PdfTextExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * 通用文档文本抽取入口。
 *
 * <p>按扩展名分发到现有的 {@link DocxTextExtractor}（POI XWPF）/
 * {@link PdfTextExtractor}（PDFBox）实现。与
 * {@code com.taoke.common.service.resumeparse.ResumeTextExtractor} 行为等价，
 * 但错误文案中性化（不绑定「简历」业务），可被任意业务复用。</p>
 *
 * <p>暂不支持旧版 .doc 格式（POI 旧版 HWPF 依赖额外库），调用方需引导用户改用 docx / pdf。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentTextExtractor {

    private final DocxTextExtractor docxTextExtractor;
    private final PdfTextExtractor pdfTextExtractor;

    /**
     * 根据文件名扩展名抽取纯文本（保留换行）。
     *
     * @param fileName 原始文件名（用于判断扩展名）
     * @param input    文件流（调用方负责关闭）
     * @return 抽取后的纯文本
     */
    public String extract(String fileName, InputStream input) {
        if (fileName == null) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "文件名为空，无法判断格式");
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        try {
            if (lower.endsWith(".docx")) {
                return docxTextExtractor.extract(input);
            } else if (lower.endsWith(".pdf")) {
                return pdfTextExtractor.extract(input);
            } else if (lower.endsWith(".doc")) {
                throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                        "暂不支持旧版 .doc 文件，请将文档另存为 .docx 或 .pdf 后再上传");
            } else {
                throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                        "仅支持 .docx 或 .pdf 格式的文档");
            }
        } catch (IOException e) {
            log.warn("文档抽取失败 file={}", fileName, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文档解析失败：" + e.getMessage());
        }
    }
}
