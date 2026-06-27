package com.taoke.legacy.tomcat;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacyMalformedRequestBodyResolverTest {

    @Test
    void detectsMalformedRequestTarget() {
        Throwable t = new IllegalArgumentException(
                "Invalid character found in the request target [/api/get.php?trainer_name=刘纯 ]. "
                        + "The valid characters are defined in RFC 7230 and RFC 3986");
        assertTrue(LegacyMalformedRequestBodyResolver.isMalformedRequestTarget(t));
    }

    @Test
    void bodyForGetPhp() {
        assertEquals("{}", LegacyMalformedRequestBodyResolver.bodyForTarget(
                "/api/get.php?opt=trainer&trainer_name=刘纯"));
    }

    @Test
    void bodyForSearchCourse() {
        assertEquals("{}", LegacyMalformedRequestBodyResolver.bodyForTarget(
                "/api/search_course.php?opt=courselist"));
    }

    @Test
    void bodyForTrainerPhp() {
        assertEquals("{\"isok\":false,\"msg\":\"参数错误\"}",
                LegacyMalformedRequestBodyResolver.bodyForTarget(
                        "/api/trainer.php?opt=get_trainer_list&trade=15"));
    }

    @Test
    void bodyForTaokeVideo() {
        assertEquals("{\"isok\":false,\"data\":\"参数错误\"}",
                LegacyMalformedRequestBodyResolver.bodyForTarget(
                        "/?c=taokevideo&a=player&from=pxbmobile&video_id=1"));
    }

    @Test
    void bodyForGetData() {
        assertEquals("{\"isok\":false,\"tip\":\"invalid json\"}",
                LegacyMalformedRequestBodyResolver.bodyForTarget("/getdata/?json={}"));
        assertEquals("{\"isok\":false,\"tip\":\"invalid json\"}",
                LegacyMalformedRequestBodyResolver.bodyForTarget(
                        "/?c=taokeajax&a=getdata&json={}"));
    }

    @Test
    void nonLegacyReturnsNull() {
        assertNull(LegacyMalformedRequestBodyResolver.bodyForTarget("/api/v1/users"));
    }
}
