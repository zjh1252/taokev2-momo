package com.taoke.course.service.video;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 录播课购买金额计算
 *
 * @author Fangxinxin
 * @date 2026-06-10 18:00
 */
public final class VideoPurchasePricing {

    private static final int DEFAULT_MAX_QTY = 20;

    private VideoPurchasePricing() {
    }

    /** 人数不限：企业价不大于单价（老站 company_price = video_price） */
    public static boolean isQuantityUnlimited(BigDecimal unitPrice, BigDecimal companyPrice) {
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return true;
        }
        if (companyPrice == null || companyPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return true;
        }
        return companyPrice.compareTo(unitPrice) <= 0;
    }

    /** 封顶价；人数不限时返回 null */
    public static BigDecimal resolveCompanyCap(BigDecimal unitPrice, BigDecimal companyPrice) {
        return isQuantityUnlimited(unitPrice, companyPrice) ? null : companyPrice;
    }

    /** 人数上限；0 表示不限 */
    public static int resolveMaxQuantity(BigDecimal unitPrice, BigDecimal companyPrice, Integer maxPurchaseQty) {
        if (isQuantityUnlimited(unitPrice, companyPrice)) {
            return 0;
        }
        if (maxPurchaseQty != null && maxPurchaseQty > 0) {
            return maxPurchaseQty;
        }
        if (unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) > 0 && companyPrice != null) {
            return companyPrice.divide(unitPrice, 0, RoundingMode.HALF_UP).max(BigDecimal.ONE).intValue();
        }
        return DEFAULT_MAX_QTY;
    }

    public static BigDecimal calcSubtotal(BigDecimal unitPrice, int quantity, BigDecimal companyCap) {
        if (unitPrice == null) {
            return BigDecimal.ZERO;
        }
        int qty = Math.max(1, quantity);
        BigDecimal raw = unitPrice.multiply(BigDecimal.valueOf(qty));
        if (companyCap != null && companyCap.compareTo(BigDecimal.ZERO) > 0 && raw.compareTo(companyCap) > 0) {
            return companyCap;
        }
        return raw;
    }
}
