package com.taoke.user.search;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TrainerDocumentIndustryTest {

    @Test
    void storesIndustryIdsForExactTermFiltering() {
        TrainerDocument document = new TrainerDocument();

        document.setIndustryCategoryIds(List.of(158, 162));

        assertEquals(List.of(158, 162), document.getIndustryCategoryIds());
    }
}
