package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VideoPackageLabelRepository extends JpaRepository<VideoPackageLabel, Integer> {

    @Query("""
            SELECT l FROM VideoPackageLabel l
            WHERE l.disabled = 0
            ORDER BY l.type ASC, l.serialIndex ASC, l.itemIndex ASC, l.id ASC
            """)
    List<VideoPackageLabel> findAllActiveOrderByDefault();

    @Query("""
            SELECT l FROM VideoPackageLabel l
            WHERE l.disabled = 0
            ORDER BY l.topicId DESC, l.itemIndex ASC, l.id ASC
            """)
    List<VideoPackageLabel> findAllActiveOrderBySupplier();
}
