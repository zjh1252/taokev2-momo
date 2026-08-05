package com.taoke.legacy.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LegacyParamResolverTest {

    private final LegacyParamResolver resolver = new LegacyParamResolver();

    @Test
    void getIntList_readsScalarParameter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("package_ids", "941");

        assertEquals(List.of(941), resolver.getIntList(request, "package_ids"));
    }

    @Test
    void getIntList_readsPhpIndexedArrayParameter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("package_ids[0]", "941");
        request.setParameter("package_ids[1]", "956");

        assertEquals(List.of(941, 956), resolver.getIntList(request, "package_ids"));
    }

    @Test
    void getIntList_readsBracketArrayParameter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addParameter("package_ids[]", "941");
        request.addParameter("package_ids[]", "956");

        assertEquals(List.of(941, 956), resolver.getIntList(request, "package_ids"));
    }
}
