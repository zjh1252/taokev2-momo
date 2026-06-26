package com.taoke.common.service.impl;

import com.taoke.common.config.FileUploadProperties;
import com.taoke.common.dto.FileUploadResponse;
import com.taoke.common.enums.UploadBizType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.FileUploadService;
import com.taoke.common.storage.StoragePathUtils;
import com.taoke.common.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传业务实现 — 校验 + 拼路径 + 委托 StorageService。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {

    private final FileUploadProperties properties;
    private final StorageService storageService;

    @Override
    public FileUploadResponse uploadImage(MultipartFile file) {
        validateNotEmpty(file);
        validateSize(file);
        validateImageType(file);
        return doUpload(file, UploadBizType.IMAGES);
    }

    @Override
    public FileUploadResponse uploadFile(MultipartFile file) {
        validateNotEmpty(file);
        validateSize(file);
        validateFileExtension(file);
        return doUpload(file, UploadBizType.FILES);
    }

    @Override
    public FileUploadResponse uploadAvatar(MultipartFile file) {
        validateNotEmpty(file);
        validateSize(file);
        validateImageType(file);
        return doUpload(file, UploadBizType.AVATARS);
    }

    @Override
    public FileUploadResponse uploadVideo(MultipartFile file) {
        validateNotEmpty(file);
        validateVideoSize(file);
        validateVideoType(file);
        return doUpload(file, UploadBizType.VIDEOS);
    }

    @Override
    public FileUploadResponse upload(MultipartFile file, UploadBizType bizType) {
        validateNotEmpty(file);
        validateSize(file);
        return doUpload(file, bizType);
    }

    private FileUploadResponse doUpload(MultipartFile file, UploadBizType bizType) {
        try {
            String filename = StoragePathUtils.generateFilename(file.getOriginalFilename());
            String prefix = properties.getBaseDir() + "/" + bizType.getDir();
            String relativePath = StoragePathUtils.buildPath(prefix, filename);

            String storedPath = storageService.upload(
                    relativePath, file.getInputStream(), file.getSize(), file.getContentType());
            String publicUrl = storageService.getPublicUrl(storedPath);

            log.info("文件上传成功: bizType={}, path={}", bizType, storedPath);
            return new FileUploadResponse(publicUrl, file.getOriginalFilename(), file.getSize(), file.getContentType());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    private void validateNotEmpty(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "文件不能为空");
        }
    }

    private void validateSize(MultipartFile file) {
        if (file.getSize() > properties.getMaxFileSize()) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE,
                    String.format("文件大小不能超过 %d MB", properties.getMaxFileSize() / 1024 / 1024));
        }
    }

    private void validateImageType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !properties.getAllowedImageTypes().contains(contentType.toLowerCase())) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的图片类型，支持: " + String.join(", ", properties.getAllowedImageTypes()));
        }
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || !properties.getAllowedImageExtensions().contains(extension.toLowerCase())) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的图片格式，支持: " + String.join(", ", properties.getAllowedImageExtensions()));
        }
    }

    private void validateFileExtension(MultipartFile file) {
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || !properties.getAllowedFileExtensions().contains(extension.toLowerCase())) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的文件格式，支持: " + String.join(", ", properties.getAllowedFileExtensions()));
        }
    }

    private void validateVideoSize(MultipartFile file) {
        if (file.getSize() > properties.getMaxVideoSize()) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE,
                    String.format("视频文件大小不能超过 %d MB", properties.getMaxVideoSize() / 1024 / 1024));
        }
    }

    private void validateVideoType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !properties.getAllowedVideoTypes().contains(contentType.toLowerCase())) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的视频类型，支持: " + String.join(", ", properties.getAllowedVideoExtensions()));
        }
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || !properties.getAllowedVideoExtensions().contains(extension.toLowerCase())) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的视频格式，支持: " + String.join(", ", properties.getAllowedVideoExtensions()));
        }
    }
}
