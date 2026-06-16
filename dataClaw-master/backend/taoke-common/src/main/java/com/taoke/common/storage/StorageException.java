package com.taoke.common.storage;

/**
 * 存储操作异常
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public class StorageException extends RuntimeException {

    private final String provider;
    private final String path;

    public StorageException(String provider, String path, String message) {
        super(message);
        this.provider = provider;
        this.path = path;
    }

    public StorageException(String provider, String path, String message, Throwable cause) {
        super(message, cause);
        this.provider = provider;
        this.path = path;
    }

    public String getProvider() {
        return provider;
    }

    public String getPath() {
        return path;
    }
}
