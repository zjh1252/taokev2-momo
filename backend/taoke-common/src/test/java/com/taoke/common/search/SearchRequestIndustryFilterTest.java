package com.taoke.common.search;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SearchRequestIndustryFilterTest {

    @Test
    void carriesTrainerIndustryCategoryId() {
        SearchRequest request = new SearchRequest();

        request.setIndustryCategoryId(158);

        assertEquals(158, request.getIndustryCategoryId());
    }
}
