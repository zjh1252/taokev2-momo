package com.taoke.common.storage;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 解析本地存储根目录 — 兼容 monorepo 下不同的 JVM 工作目录。
 *
 * <p>IDE 常从仓库根目录启动（{@code user.dir=taokev2-mono}），此时配置
 * {@code ../../frontend/public} 会误解析到仓库外的 {@code frontend/public}。
 * 本工具优先定位 monorepo 内的 {@code frontend/public}。</p>
 *
 * @author Fangxinxin
 * @date 2026-06-11 18:00
 */
public final class StorageDirectoryResolver {

    private StorageDirectoryResolver() {
    }

    /**
     * 将配置中的相对/绝对路径解析为可用的存储根目录。
     */
    public static Path resolve(String configuredBaseDir) {
        if (configuredBaseDir == null || configuredBaseDir.isBlank()) {
            throw new IllegalArgumentException("taoke.storage.base-dir 不能为空");
        }

        Path configured = Path.of(configuredBaseDir.trim());
        if (configured.isAbsolute()) {
            return configured.normalize();
        }

        Path cwd = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path monorepoPublic = findMonorepoFrontendPublic(cwd);
        if (monorepoPublic != null) {
            return monorepoPublic;
        }

        return cwd.resolve(configured).normalize();
    }

    /**
     * 向上查找 monorepo 根目录（同时存在 {@code frontend/public} 与 {@code backend/taoke-app}）。
     */
    private static Path findMonorepoFrontendPublic(Path start) {
        Path current = start;
        for (int depth = 0; depth < 8 && current != null; depth++) {
            Path frontendPublic = current.resolve("frontend/public");
            Path backendApp = current.resolve("backend/taoke-app");
            if (Files.isDirectory(frontendPublic) && Files.isDirectory(backendApp)) {
                return frontendPublic.normalize();
            }
            current = current.getParent();
        }
        return null;
    }
}
