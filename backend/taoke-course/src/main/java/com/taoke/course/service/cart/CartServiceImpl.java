package com.taoke.course.service.cart;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.cart.AddCartRequest;
import com.taoke.course.dto.cart.CartItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.cart.Cart;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoPackageGroup;
import com.taoke.course.enums.ProductType;
import com.taoke.course.mapper.CartMapper;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.cart.CartRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 购物车业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl {

    private final CartRepository cartRepository;
    private final CourseRepository courseRepository;
    private final VideoRepository videoRepository;
    private final VideoPackageGroupRepository packageGroupRepository;
    private final CartMapper cartMapper;

    /**
     * 添加商品到购物车
     */
    @Transactional
    public CartItemVO addItem(Integer userId, AddCartRequest request) {
        ProductType productType = ProductType.valueOf(request.getProductType());

        // 已存在则更新数量
        cartRepository.findByUserIdAndProductTypeAndProductId(userId, productType, request.getProductId())
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.CART_ITEM_EXISTS);
                });

        Cart cart = new Cart();
        cart.setUserId(userId);
        cart.setProductType(productType);
        cart.setProductId(request.getProductId());
        cart.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);

        // 填充商品快照信息
        fillProductSnapshot(cart, productType, request.getProductId(), userId);

        cartRepository.save(cart);
        return cartMapper.toVO(cart);
    }

    /**
     * 获取当前用户购物车列表
     */
    public List<CartItemVO> listItems(Integer userId) {
        List<Cart> carts = cartRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<CartItemVO> voList = cartMapper.toVOList(carts);

        // 比对最新价格
        for (int i = 0; i < carts.size(); i++) {
            Cart cart = carts.get(i);
            CartItemVO vo = voList.get(i);
            try {
                java.math.BigDecimal currentPrice = getCurrentPrice(cart.getProductType(), cart.getProductId());
                vo.setCurrentPrice(currentPrice);
            } catch (Exception ignored) {
                // 商品已下架，保持快照价格
            }
        }
        return voList;
    }

    /**
     * 修改购物车条目数量
     */
    @Transactional
    public CartItemVO updateQuantity(Integer userId, Integer cartId, Integer quantity) {
        Cart cart = cartRepository.findById(cartId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        cart.setQuantity(quantity);
        cartRepository.save(cart);
        return cartMapper.toVO(cart);
    }

    /**
     * 删除单条购物车
     */
    @Transactional
    public void removeItem(Integer userId, Integer cartId) {
        cartRepository.deleteByIdAndUserId(cartId, userId);
    }

    /**
     * 清空购物车
     */
    @Transactional
    public void clearCart(Integer userId) {
        cartRepository.deleteByUserId(userId);
    }

    /**
     * 获取购物车数量
     */
    public int countItems(Integer userId) {
        return cartRepository.countByUserId(userId);
    }

    /**
     * 根据ID批量查购物车条目（下单使用）
     */
    public List<Cart> findByIdsAndUserId(List<Integer> ids, Integer userId) {
        return cartRepository.findByIdInAndUserId(ids, userId);
    }

    /**
     * 批量删除（下单后清除已购项）
     */
    @Transactional
    public void removeItems(List<Integer> ids) {
        cartRepository.deleteAllByIdInBatch(ids);
    }

    private void fillProductSnapshot(Cart cart, ProductType productType, Integer productId, Integer userId) {
        if (productType == ProductType.OPEN_COURSE) {
            Course course = courseRepository.findById(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            if (course.getStatus() != 2) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            if (course.getIsFree() == 1) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
            }
            cart.setProductTitle(course.getTitle());
            cart.setProductCover(course.getCoverUrl());
            cart.setPrice(course.getPrice());
            return;
        }

        if (productType == ProductType.VIDEO_PACKAGE) {
            VideoPackageGroup group = packageGroupRepository.findById(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            cart.setProductTitle(group.getName());
            cart.setProductCover("");
            cart.setPrice(group.getPrice());
            return;
        }

        Video video = videoRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (video.getStatus() != 2) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        if (video.getIsFree() == 1) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        }
        if (userId != null && userId.equals(video.getPublisherId())) {
            throw new BusinessException(ErrorCode.CANNOT_BUY_OWN_PRODUCT);
        }
        cart.setProductTitle(video.getTitle());
        cart.setProductCover(video.getCoverUrl());
        cart.setPrice(video.getPrice());
    }

    private java.math.BigDecimal getCurrentPrice(ProductType productType, Integer productId) {
        if (productType == ProductType.OPEN_COURSE) {
            return courseRepository.findById(productId)
                    .map(Course::getPrice)
                    .orElse(java.math.BigDecimal.ZERO);
        }
        if (productType == ProductType.VIDEO_PACKAGE) {
            return packageGroupRepository.findById(productId)
                    .map(VideoPackageGroup::getPrice)
                    .orElse(java.math.BigDecimal.ZERO);
        }
        return videoRepository.findById(productId)
                .map(Video::getPrice)
                .orElse(java.math.BigDecimal.ZERO);
    }
}
