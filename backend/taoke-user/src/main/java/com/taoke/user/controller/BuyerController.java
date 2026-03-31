package com.taoke.user.controller;

import com.taoke.user.service.BuyerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 个人学员自服务接口 — BUYER 角色特有功能。
 * <p>
 * BUYER 为平台默认角色，通用资料操作（头像、昵称、密码、手机号等）统一由
 * {@link UserController} 的 {@code /users/me} 系列接口处理；
 * 本 Controller 仅承载 BUYER 角色特有的业务接口（如学习标签、职业信息等），
 * 后续按需新增。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Tag(name = "个人学员", description = "BUYER 角色特有接口（基础路由 /buyers/me）")
@RestController
@RequiredArgsConstructor
public class BuyerController {

    private final BuyerService buyerService;

    // TODO: BUYER 角色特有接口按需在此新增，路由前缀为 /buyers/me
}
