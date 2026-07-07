package com.taoke.common.service.docparse;

import com.aliyun.ocr_api20210707.models.RecognizeBasicRequest;
import com.aliyun.ocr_api20210707.models.RecognizeBasicResponse;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.config.AliyunOcrProperties;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * 阿里云 OCR 文本抽取：支持图片和扫描 PDF。
 *
 * @author Fangxinxin
 * @date 2026-07-07 09:50
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AliyunOcrTextExtractor {

    private static final float PDF_DPI = 144f;
    private static final int MAX_IMAGE_SIDE = 1600;
    private static final float JPEG_QUALITY = 0.82f;

    private final AliyunOcrProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * 从图片或 PDF 中识别全文。PDF 会逐页 OCR 并按页顺序拼接。
     */
    public String extract(String fileName, String contentType, InputStream input) {
        ensureAvailable();
        String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        String lowerType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        try {
            if (lowerName.endsWith(".pdf") || "application/pdf".equals(lowerType)) {
                return extractPdf(input);
            }
            if (isImage(lowerName, lowerType)) {
                BufferedImage image = ImageIO.read(input);
                return recognizeImage(toJpegBytes(image));
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("OCR 文本抽取失败 file={}", fileName, e);
            throw new BusinessException(ErrorCode.OCR_CALL_FAILED);
        }
        throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "仅支持 PDF 或图片文件进行 OCR 识别");
    }

    private String extractPdf(InputStream input) throws Exception {
        List<String> pages = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(input.readAllBytes())) {
            PDFRenderer renderer = new PDFRenderer(doc);
            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, PDF_DPI, ImageType.RGB);
                String text = recognizeImage(toJpegBytes(image));
                if (text != null && !text.isBlank()) {
                    pages.add("第 " + (i + 1) + " 页\n" + text.trim());
                }
            }
        }
        String text = String.join("\n\n", pages).trim();
        if (text.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "OCR 未识别出文字内容");
        }
        return text;
    }

    private String recognizeImage(byte[] imageBytes) throws Exception {
        RecognizeBasicRequest request = new RecognizeBasicRequest()
                .setBody(new ByteArrayInputStream(imageBytes))
                .setNeedRotate(true);
        RuntimeOptions runtime = new RuntimeOptions()
                .setConnectTimeout(properties.getTimeoutMs())
                .setReadTimeout(properties.getTimeoutMs());
        RecognizeBasicResponse response = createClient().recognizeBasicWithOptions(request, runtime);
        if (response == null || response.getBody() == null) {
            throw new BusinessException(ErrorCode.OCR_CALL_FAILED);
        }
        String code = response.getBody().getCode();
        if (code != null && !"200".equals(code)) {
            log.warn("阿里云 OCR 返回失败 code={}, message={}, requestId={}",
                    code, response.getBody().getMessage(), response.getBody().getRequestId());
            throw new BusinessException(ErrorCode.OCR_CALL_FAILED);
        }
        return parseOcrData(response.getBody().getData());
    }

    private com.aliyun.ocr_api20210707.Client createClient() throws Exception {
        Config config = new Config()
                .setAccessKeyId(properties.getAccessKeyId())
                .setAccessKeySecret(properties.getAccessKeySecret());
        config.endpoint = properties.getEndpoint();
        return new com.aliyun.ocr_api20210707.Client(config);
    }

    private String parseOcrData(String data) throws IOException {
        if (data == null || data.isBlank()) {
            return "";
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(data);
        } catch (JsonProcessingException e) {
            return data.trim();
        }
        String content = textValue(root, "content");
        if (!content.isBlank()) {
            return content;
        }
        List<String> words = new ArrayList<>();
        collectWords(root.path("prism_wordsInfo"), words);
        collectWords(root.path("wordsInfo"), words);
        if (words.isEmpty()) {
            collectTextLikeFields(root, words);
        }
        return String.join("\n", words);
    }

    private static String textValue(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value != null && value.isTextual() ? value.asText("").trim() : "";
    }

    private static void collectWords(JsonNode node, List<String> words) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                addIfNotBlank(words, textValue(item, "word"));
            }
            return;
        }
        addIfNotBlank(words, textValue(node, "word"));
    }

    private static void collectTextLikeFields(JsonNode node, List<String> words) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String name = entry.getKey().toLowerCase(Locale.ROOT);
                JsonNode value = entry.getValue();
                if (value.isTextual() && ("word".equals(name) || "text".equals(name) || "content".equals(name))) {
                    addIfNotBlank(words, value.asText());
                } else {
                    collectTextLikeFields(value, words);
                }
            });
        } else if (node.isArray()) {
            for (JsonNode item : node) {
                collectTextLikeFields(item, words);
            }
        }
    }

    private static void addIfNotBlank(List<String> words, String value) {
        if (value != null && !value.isBlank()) {
            words.add(value.trim());
        }
    }

    private void ensureAvailable() {
        if (!properties.isEnabled()
                || properties.getAccessKeyId() == null
                || properties.getAccessKeyId().isBlank()
                || properties.getAccessKeySecret() == null
                || properties.getAccessKeySecret().isBlank()) {
            throw new BusinessException(ErrorCode.OCR_NOT_ENABLED);
        }
    }

    private static boolean isImage(String lowerName, String lowerType) {
        return lowerType.startsWith("image/")
                || lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png")
                || lowerName.endsWith(".webp");
    }

    private static byte[] toJpegBytes(BufferedImage source) throws IOException {
        if (source == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "图片内容为空或格式不支持");
        }
        BufferedImage normalized = resizeIfNeeded(source);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer available");
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
        }
        try (MemoryCacheImageOutputStream imageOut = new MemoryCacheImageOutputStream(out)) {
            writer.setOutput(imageOut);
            writer.write(null, new IIOImage(normalized, null, null), param);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private static BufferedImage resizeIfNeeded(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int maxSide = Math.max(width, height);
        if (maxSide <= MAX_IMAGE_SIDE && source.getType() == BufferedImage.TYPE_INT_RGB) {
            return source;
        }
        double ratio = maxSide > MAX_IMAGE_SIDE ? (double) MAX_IMAGE_SIDE / maxSide : 1.0;
        int targetWidth = Math.max(1, (int) Math.round(width * ratio));
        int targetHeight = Math.max(1, (int) Math.round(height * ratio));
        BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = target.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            g.dispose();
        }
        return target;
    }
}
