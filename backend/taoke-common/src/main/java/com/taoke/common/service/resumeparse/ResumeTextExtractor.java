package com.taoke.common.service.resumeparse;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * 简历文本抽取统一入口。
 * <p>
 * 根据文件扩展名分发到不同的抽取器：
 * <ul>
 *   <li>{@code .docx} → {@link DocxTextExtractor}（基于 Apache POI XWPF）</li>
 *   <li>{@code .pdf} → {@link PdfTextExtractor}（基于 PDFBox）</li>
 *   <li>{@code .doc} → 暂不支持，提示用户改用 docx / pdf（与老站 -2 体验对齐）</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Slf4j
@Service
public class ResumeTextExtractor {

    private final DocxTextExtractor docxTextExtractor;
    private final PdfTextExtractor pdfTextExtractor;

    public ResumeTextExtractor(DocxTextExtractor docxTextExtractor, PdfTextExtractor pdfTextExtractor) {
        this.docxTextExtractor = docxTextExtractor;
        this.pdfTextExtractor = pdfTextExtractor;
    }

    /**
     * 根据文件名后缀分发抽取，返回纯文本（保留换行）。
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
                        "暂不支持旧版 .doc 文件，请将简历另存为 .docx 或 .pdf 后再上传");
            } else {
                throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                        "仅支持 .docx 或 .pdf 格式的简历");
            }
        } catch (IOException e) {
            log.warn("简历抽取失败 file={}", fileName, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "简历解析失败：" + e.getMessage());
        }
    }
}
