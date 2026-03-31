package com.taoke.common.storage;

import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 存储路径生成工具 — 统一目录层级与文件名规则。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public final class StoragePathUtils {

    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyyMM");
    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");

    private StoragePathUtils() {
    }

    /**
     * 构建完整相对路径：{prefix}/{yyyyMM}/{yyyyMMdd}/{filename}
     *
     * @param prefix   路径前缀（如 uploads/images）
     * @param filename 文件名
     */
    public static String buildPath(String prefix, String filename) {
        LocalDate now = LocalDate.now();
        String ym = now.format(YM);
        String ymd = now.format(YMD);
        StringBuilder sb = new StringBuilder();
        String trimmed = trimSlashes(prefix);
        if (StringUtils.hasText(trimmed)) {
            sb.append(trimmed).append("/");
        }
        sb.append(ym).append("/").append(ymd).append("/").append(filename);
        return sb.toString();
    }

    /**
     * 根据原始文件名生成唯一文件名（uuid16 + 原扩展名）
     */
    public static String generateFilename(String originalName) {
        String ext = "";
        if (StringUtils.hasText(originalName) && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }
        String uuid = uuid16();
        return StringUtils.hasText(ext) ? uuid + "." + ext : uuid;
    }

    private static String uuid16() {
        UUID uuid = UUID.randomUUID();
        long hash = Math.abs(uuid.getMostSignificantBits() ^ uuid.getLeastSignificantBits());
        String hex = Long.toHexString(hash);
        if (hex.length() < 16) {
            return "0".repeat(16 - hex.length()) + hex;
        }
        return hex.substring(0, 16);
    }

    private static String trimSlashes(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("^/+", "").replaceAll("/+$", "");
    }
}
