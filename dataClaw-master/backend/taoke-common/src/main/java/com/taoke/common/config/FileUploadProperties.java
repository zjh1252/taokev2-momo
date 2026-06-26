package com.taoke.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 文件上传校验配置，绑定 {@code taoke.upload.*}。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.upload")
public class FileUploadProperties {

    /** 上传文件子目录（相对于 storage.base-dir） */
    private String baseDir = "uploads";

    /** 允许的最大文件大小（字节），默认 10MB */
    private long maxFileSize = 10 * 1024 * 1024;

    /** 允许的图片 MIME 类型 */
    private List<String> allowedImageTypes = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");

    /** 允许的图片扩展名 */
    private List<String> allowedImageExtensions = List.of(
            "jpg", "jpeg", "png", "gif", "webp");

    /** 允许的普通文件扩展名 */
    private List<String> allowedFileExtensions = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar");

    /** 视频最大文件大小（字节），默认 500MB */
    private long maxVideoSize = 500L * 1024 * 1024;

    /** 允许的视频 MIME 类型 */
    private List<String> allowedVideoTypes = List.of(
            "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo",
            "video/x-ms-wmv", "video/webm", "video/x-flv", "video/3gpp");

    /** 允许的视频扩展名 */
    private List<String> allowedVideoExtensions = List.of(
            "mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "mpg", "3gp");
}
