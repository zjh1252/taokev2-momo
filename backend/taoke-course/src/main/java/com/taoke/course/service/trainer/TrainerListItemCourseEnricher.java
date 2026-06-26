package com.taoke.course.service.trainer;

import com.taoke.course.repository.CourseRepository;
import com.taoke.user.api.TrainerListItemEnricher;
import com.taoke.user.dto.trainer.TrainerListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 专家列表项：填充已上架课程数与课程标题（培训宝 embed 等场景）。
 */
@Service
@RequiredArgsConstructor
public class TrainerListItemCourseEnricher implements TrainerListItemEnricher {

    private static final int MAX_TITLES_PER_TRAINER = 5;

    private final CourseRepository courseRepository;

    @Override
    public void enrich(List<TrainerListItemResponse> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        List<Integer> trainerIds = items.stream()
                .map(TrainerListItemResponse::getId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (trainerIds.isEmpty()) {
            return;
        }

        Map<Integer, Long> countMap = new HashMap<>();
        for (Object[] row : courseRepository.countPublishedGroupByTrainerIds(trainerIds)) {
            if (row[0] == null || row[1] == null) {
                continue;
            }
            countMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        Map<Integer, List<String>> titleMap = new HashMap<>();
        for (Object[] row : courseRepository.findPublishedTitlesByTrainerIds(trainerIds)) {
            if (row[0] == null || row[1] == null) {
                continue;
            }
            int trainerId = ((Number) row[0]).intValue();
            String title = row[1].toString().trim();
            if (title.isEmpty()) {
                continue;
            }
            List<String> titles = titleMap.computeIfAbsent(trainerId, k -> new ArrayList<>());
            if (titles.size() < MAX_TITLES_PER_TRAINER) {
                titles.add(title);
            }
        }

        for (TrainerListItemResponse item : items) {
            if (item.getId() == null) {
                continue;
            }
            item.setCourseCount(countMap.getOrDefault(item.getId(), 0L).intValue());
            item.setCourseTitles(titleMap.getOrDefault(item.getId(), List.of()));
        }
    }
}
