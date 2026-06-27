package com.taoke.legacy.handler.get;

import jakarta.servlet.http.HttpServletRequest;

/**
 * get.php opt 处理器。
 */
public interface GetOptHandler {

    String opt();

    Object handle(HttpServletRequest request);
}
