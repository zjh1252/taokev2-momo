package com.taoke.user.repository;

import com.taoke.user.entity.InstitutionTrainerBinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 机构-专家绑定关系持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface InstitutionTrainerBindingRepository extends JpaRepository<InstitutionTrainerBinding, Integer> {

    List<InstitutionTrainerBinding> findByOrgId(Integer orgId);

    List<InstitutionTrainerBinding> findByTrainerUserId(Integer trainerUserId);

    Optional<InstitutionTrainerBinding> findByOrgIdAndTrainerUserId(Integer orgId, Integer trainerUserId);

    List<InstitutionTrainerBinding> findByOrgIdAndStatus(Integer orgId, Integer status);

    List<InstitutionTrainerBinding> findByTrainerUserIdAndStatus(Integer trainerUserId, Integer status);

    List<InstitutionTrainerBinding> findByOrgIdInAndStatus(List<Integer> orgIds, Integer status);
}
