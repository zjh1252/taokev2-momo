package com.taoke.common.service.resumeparse;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

/**
 * DOCX 简历文本抽取器（基于 Apache POI XWPF）。
 *
 * <p>对应老站 PHP <code>handleDocx</code> 行为：遍历段落与表格，
 * 表格单元格按行拼接为「key：value」形式，最大化保留原始章节结构。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Component
public class DocxTextExtractor {

    public String extract(InputStream input) throws IOException {
        StringBuilder sb = new StringBuilder(4096);
        try (XWPFDocument doc = new XWPFDocument(input)) {
            // 段落正文
            for (XWPFParagraph p : doc.getParagraphs()) {
                String text = p.getText();
                if (text != null && !text.isEmpty()) {
                    sb.append(text).append('\n');
                }
            }
            // 表格 → 每个 cell 一行
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String text = cell.getText();
                        if (text != null && !text.isBlank()) {
                            sb.append(text.trim()).append('\n');
                        }
                    }
                }
            }
        }
        return sb.toString();
    }
}
