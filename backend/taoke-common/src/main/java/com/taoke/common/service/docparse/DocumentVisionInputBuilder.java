package com.taoke.common.service.docparse;

import com.taoke.common.ai.AiImageInput;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
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
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * 将 PDF / 图片转换为可传给 OpenAI 兼容视觉模型的 data URL。
 *
 * @author Fangxinxin
 * @date 2026-07-06 21:30
 */
@Slf4j
@Service
public class DocumentVisionInputBuilder {

    private static final float PDF_DPI = 144f;
    private static final int MAX_IMAGE_SIDE = 1600;
    private static final float JPEG_QUALITY = 0.78f;

    /**
     * 按原始顺序构建视觉输入；PDF 会逐页渲染，图片会原图压缩后传入。
     */
    public List<AiImageInput> build(String fileName, String contentType, InputStream input) {
        String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        String lowerType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        try {
            if (lowerName.endsWith(".pdf") || "application/pdf".equals(lowerType)) {
                return buildFromPdf(input);
            }
            if (isImage(lowerName, lowerType)) {
                return List.of(new AiImageInput(toDataUrl(ImageIO.read(input))));
            }
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            log.warn("构建视觉输入失败 file={}", fileName, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件图像解析失败");
        }
        throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "仅支持 PDF 或图片文件进行视觉识别");
    }

    private List<AiImageInput> buildFromPdf(InputStream input) throws IOException {
        List<AiImageInput> images = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(input.readAllBytes())) {
            PDFRenderer renderer = new PDFRenderer(doc);
            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, PDF_DPI, ImageType.RGB);
                images.add(new AiImageInput(toDataUrl(image)));
            }
        }
        if (images.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "PDF 文件没有可识别页面");
        }
        return images;
    }

    private static boolean isImage(String lowerName, String lowerType) {
        return lowerType.startsWith("image/")
                || lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png")
                || lowerName.endsWith(".webp");
    }

    private static String toDataUrl(BufferedImage source) throws IOException {
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
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
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
