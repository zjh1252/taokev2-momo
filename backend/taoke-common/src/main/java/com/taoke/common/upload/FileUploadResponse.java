package com.taoke.common.upload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    /** 文件访问 URL */
    private String url;

    /** 文件原始名称 */
    private String originalName;

    /** 文件大小（字节） */
    private Long size;

    /** MIME 类型 */
    private String contentType;
}
