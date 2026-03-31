package com.taoke.common.storage;

import java.io.InputStream;

/**
 * 通用文件存储服务接口 — 纯存储抽象，不感知业务类型。
 * <p>
 * 所有方法操作的 {@code path} 均为相对路径（如 {@code uploads/images/202603/20260319/abc.jpg}），
 * 具体物理位置由实现决定（本地磁盘 / 阿里云 OSS 等）。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public interface StorageService {

    /**
     * 上传文件
     *
     * @param path        相对存储路径（含文件名）
     * @param data        文件输入流
     * @param size        文件大小（字节）
     * @param contentType MIME 类型
     * @return 实际存储的相对路径
     */
    String upload(String path, InputStream data, long size, String contentType);

    /**
     * 删除文件（幂等）
     */
    void delete(String path);

    /**
     * 获取可公开访问的 URL
     */
    String getPublicUrl(String path);

    /**
     * 判断文件是否存在
     */
    default boolean exists(String path) {
        return false;
    }
}
