package com.taoke.course.repository.pxb;

import com.taoke.course.entity.pxb.PxbTrainerRelatedLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PxbTrainerRelatedLogRepository extends JpaRepository<PxbTrainerRelatedLog, Integer> {

    Optional<PxbTrainerRelatedLog> findByTrainerUidAndPxbUid(int trainerUid, int pxbUid);
}
