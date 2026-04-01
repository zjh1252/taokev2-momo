package com.taoke.common.service;

import com.taoke.common.dto.FileUploadResponse;
import com.taoke.common.enums.UploadBizType;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传业务接口 — 负责校验与路径生成，委托 StorageService 完成实际存储。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public interface FileUploadService {

    /**
     * 上传图片
     */
    FileUploadResponse uploadImage(MultipartFile file);

    /**
     * 上传普通文件
     */
    FileUploadResponse uploadFile(MultipartFile file);

    /**
     * 上传头像
     */
    FileUploadResponse uploadAvatar(MultipartFile file);

    /**
     * 按指定业务类型上传
     */
    FileUploadResponse upload(MultipartFile file, UploadBizType bizType);
}
