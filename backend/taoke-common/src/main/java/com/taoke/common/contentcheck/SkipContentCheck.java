package com.taoke.common.contentcheck;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标注在 Controller 类或方法上，跳过内容审查。
 * <p>
 * 用于管理员敏感词管理等需要输入敏感词本身的场景。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface SkipContentCheck {
}
