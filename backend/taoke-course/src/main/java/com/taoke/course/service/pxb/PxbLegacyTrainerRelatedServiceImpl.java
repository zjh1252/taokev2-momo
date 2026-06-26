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
        String username = pxbUsername != null ? pxbUsername.trim() : "";
        String mobileValue = mobile != null ? mobile.trim() : "";

        PxbTrainerRelatedLog log = relatedLogRepository.findByTrainerUidAndPxbUid(trainerUid, pxbUid)
                .orElseGet(PxbTrainerRelatedLog::new);
        if (log.getId() == null) {
            log.setTrainerUid(trainerUid);
            log.setPxbUid(pxbUid);
            log.setCreatedAt(LocalDateTime.now());
        }
        log.setPxbUsername(username);
        log.setMobile(mobileValue);
        relatedLogRepository.save(log);
    }
}
