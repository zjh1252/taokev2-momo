package com.taoke.course.controller.cart;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.cart.AddCartRequest;
import com.taoke.course.dto.cart.CartItemVO;
import com.taoke.course.service.cart.CartServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 购物车接口 — 需登录
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Tag(name = "购物车", description = "购物车增删改查")
@RestController
@RequiredArgsConstructor
public class CartController {

    private final CartServiceImpl cartService;

    @Operation(summary = "添加购物车")
    @PostMapping("/cart/items")
    public ApiResponse<CartItemVO> addItem(@Valid @RequestBody AddCartRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(cartService.addItem(userId, request));
    }

    @Operation(summary = "获取购物车列表")
    @GetMapping("/cart/items")
    public ApiResponse<List<CartItemVO>> listItems() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(cartService.listItems(userId));
    }

    @Operation(summary = "修改购物车条目数量")
    @PutMapping("/cart/items/{id}")
    public ApiResponse<CartItemVO> updateQuantity(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(cartService.updateQuantity(userId, id, body.get("quantity")));
    }

    @Operation(summary = "删除购物车条目")
    @DeleteMapping("/cart/items/{id}")
    public ApiResponse<Void> removeItem(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        cartService.removeItem(userId, id);
        return ApiResponse.ok();
    }

    @Operation(summary = "清空购物车")
    @DeleteMapping("/cart/items")
    public ApiResponse<Void> clearCart() {
        Integer userId = SecurityUtils.getRequiredUserId();
        cartService.clearCart(userId);
        return ApiResponse.ok();
    }

    @Operation(summary = "获取购物车商品数量")
    @GetMapping("/cart/count")
    public ApiResponse<Integer> countItems() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(cartService.countItems(userId));
    }
}
