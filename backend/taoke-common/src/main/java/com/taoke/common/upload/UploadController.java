package com.taoke.common.upload;

import com.taoke.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器 — 登录即可访问，无需角色/权限注解。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Tag(name = "文件上传", description = "通用文件上传接口")
@RestController
@RequiredArgsConstructor
public class UploadController {

    private final FileUploadService fileUploadService;

    @Operation(summary = "上传图片", description = "支持 jpg、jpeg、png、gif、webp 格式")
    @PostMapping("/uploads/images")
    public ApiResponse<FileUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(fileUploadService.uploadImage(file));
    }

    @Operation(summary = "上传文件", description = "支持 pdf、doc、docx、xls、xlsx、ppt、pptx、txt、zip、rar 格式")
    @PostMapping("/uploads/files")
    public ApiResponse<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(fileUploadService.uploadFile(file));
    }

    @Operation(summary = "上传头像", description = "支持 jpg、jpeg、png、gif、webp 格式")
    @PostMapping("/uploads/avatars")
    public ApiResponse<FileUploadResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(fileUploadService.uploadAvatar(file));
    }
}
