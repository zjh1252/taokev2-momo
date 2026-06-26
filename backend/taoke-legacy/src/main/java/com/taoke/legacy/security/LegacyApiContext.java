package com.taoke.legacy.security;

/**
 * 经签名校验后写入 request attribute 的上下文。
 */
public final class LegacyApiContext {

    public static final String ATTR = "legacyApiContext";

    private final String apiFile;
    private final String appid;
    private final String opt;
    private final long timestamp;

    public LegacyApiContext(String apiFile, String appid, String opt, long timestamp) {
        this.apiFile = apiFile;
        this.appid = appid;
        this.opt = opt;
        this.timestamp = timestamp;
    }

    public String getApiFile() {
        return apiFile;
    }

    public String getAppid() {
        return appid;
    }

    public String getOpt() {
        return opt;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
