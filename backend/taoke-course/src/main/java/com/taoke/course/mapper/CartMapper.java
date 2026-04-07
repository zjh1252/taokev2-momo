package com.taoke.course.mapper;

import com.taoke.course.dto.cart.CartItemVO;
import com.taoke.course.entity.cart.Cart;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 购物车对象映射器
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Component
public class CartMapper {

    public CartItemVO toVO(Cart cart) {
        if (cart == null) {
            return null;
        }
        CartItemVO vo = new CartItemVO();
        vo.setId(cart.getId());
        vo.setProductType(cart.getProductType().name());
        vo.setProductTypeLabel(cart.getProductType().getLabel());
        vo.setProductId(cart.getProductId());
        vo.setProductTitle(cart.getProductTitle());
        vo.setProductCover(cart.getProductCover());
        vo.setPrice(cart.getPrice());
        vo.setCurrentPrice(cart.getPrice());
        vo.setQuantity(cart.getQuantity());
        vo.setSubtotal(cart.getPrice().multiply(java.math.BigDecimal.valueOf(cart.getQuantity())));
        vo.setCreatedAt(cart.getCreatedAt());
        return vo;
    }

    public List<CartItemVO> toVOList(List<Cart> carts) {
        if (carts == null) {
            return null;
        }
        return carts.stream().map(this::toVO).toList();
    }
}
