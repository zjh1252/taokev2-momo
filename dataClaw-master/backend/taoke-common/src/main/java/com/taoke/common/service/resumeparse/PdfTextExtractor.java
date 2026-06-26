package com.taoke.common.service.resumeparse;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

/**
 * PDF 简历文本抽取器（基于 Apache PDFBox）。
 *
 * <p>对应老站 PHP <code>handlePdfDoc</code> 行为：使用默认布局解析器，
 * 输出按页面顺序拼接的纯文本，保留换行。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Component
public class PdfTextExtractor {

    public String extract(InputStream input) throws IOException {
        try (PDDocument doc = Loader.loadPDF(input.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String content = stripper.getText(doc);
            return content == null ? "" : content;
        }
    }
}
