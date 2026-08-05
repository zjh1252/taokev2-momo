package com.taoke.user.dto.trainerhighlight;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SaveTrainerHighlightRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void blankCoverImageIsAllowedForOptionalHighlightAlbum() {
        SaveTrainerHighlightRequest request = new SaveTrainerHighlightRequest();
        request.setTitle("授课花絮");
        request.setCoverImage("");

        assertTrue(validator.validate(request).isEmpty());
    }
}
