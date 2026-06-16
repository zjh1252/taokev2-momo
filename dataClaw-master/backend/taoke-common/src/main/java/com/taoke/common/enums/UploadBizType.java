package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 上传业务类型枚举 — 决定文件存储的子目录。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Getter
@AllArgsConstructor
public enum UploadBizType {

    IMAGES("images", "通用图片"),
    AVATARS("avatars", "头像"),
    FILES("files", "通用文件"),
    CERTIFICATES("certificates", "资质证书"),
    COURSES("courses", "课程封面/课件"),
    CASES("cases", "案例图片"),
    VIDEOS("videos", "视频文件");

    /** 子目录名 */
    private final String dir;

    /** 中文描述 */
    private final String label;
}
