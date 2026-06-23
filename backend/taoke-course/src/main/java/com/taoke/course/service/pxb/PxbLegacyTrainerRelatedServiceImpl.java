package com.taoke.course.service.pxb;

import com.taoke.course.api.PxbLegacyTrainerRelatedService;
import com.taoke.course.entity.pxb.PxbTrainerRelatedLog;
import com.taoke.course.repository.pxb.PxbTrainerRelatedLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PxbLegacyTrainerRelatedServiceImpl implements PxbLegacyTrainerRelatedService {

    private final PxbTrainerRelatedLogRepository relatedLogRepository;

    @Override
    @Transactional
    public void addRelated(int trainerUid, int pxbUid, String pxbUsername, String mobile) {
        PxbTrainerRelatedLog log = new PxbTrainerRelatedLog();
        log.setTrainerUid(trainerUid);
        log.setPxbUid(pxbUid);
        log.setPxbUsername(pxbUsername != null ? pxbUsername.trim() : "");
        log.setMobile(mobile != null ? mobile.trim() : "");
        log.setCreatedAt(LocalDateTime.now());
        relatedLogRepository.save(log);
    }
}
