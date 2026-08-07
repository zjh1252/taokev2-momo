package com.taoke.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacyAvatarUrlsTest {

    @Test
    void usableCourseCoverAcceptsNormalPortraitAndCourseImage() {
        assertTrue(LegacyAvatarUrls.isUsableCourseCover(
                "https://www.taoke.com/attachments/user/middle/1142161/1142161.png"));
        assertTrue(LegacyAvatarUrls.isUsableCourseCover(
                "https://www.taoke.com/attachments/course/123/cover_leadership.jpg"));
    }

    @Test
    void usableCourseCoverRejectsQrLikeUrls() {
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(
                "https://www.taoke.com/attachments/course/1/wechat_qrcode.jpg"));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(
                "https://cdn.example.com/uploads/qr_code_rdm.png"));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(
                "/uploads/images/course-qr.jpg"));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(
                "https://www.taoke.com/attachments/course/1/erweima.png"));
    }

    @Test
    void usableCourseCoverRejectsPlaceholderAndBlank() {
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(null));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(""));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover(
                "https://www.taoke.com/attachments/user/middle/00/1.jpg"));
        assertFalse(LegacyAvatarUrls.isUsableCourseCover("/statics/images/taoke-new-logo.jpg"));
    }

    @Test
    void normalizeRewritesLocalUploadPrefixToPxbCdn() {
        assertEquals(
                "https://cdn5-pxb-videos.taoke.com/taoke/upload/images/202608/a.png",
                LegacyAvatarUrls.normalize("/uploads/taoke/upload/images/202608/a.png"));
        assertEquals(
                "https://cdn5-pxb-videos.taoke.com/taoke/upload/images/202608/a.png",
                LegacyAvatarUrls.normalize("/taoke/upload/images/202608/a.png"));
    }
}
