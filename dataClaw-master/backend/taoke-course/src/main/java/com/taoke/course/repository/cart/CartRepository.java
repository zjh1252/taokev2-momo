package com.taoke.course.repository.cart;

import com.taoke.course.entity.cart.Cart;
import com.taoke.course.enums.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 购物车持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface CartRepository extends JpaRepository<Cart, Integer> {

    List<Cart> findByUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Cart> findByUserIdAndProductTypeAndProductId(Integer userId, ProductType productType, Integer productId);

    int countByUserId(Integer userId);

    void deleteByUserId(Integer userId);

    void deleteByIdAndUserId(Integer id, Integer userId);

    List<Cart> findByIdInAndUserId(List<Integer> ids, Integer userId);
}
