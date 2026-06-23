package com.taoke.legacy.handler.trainer;

import jakarta.servlet.http.HttpServletRequest;

/**
 * trainer.php opt 处理器。
 */
public interface TrainerPhpOptHandler {

    String opt();

    Object handle(HttpServletRequest request);
}
