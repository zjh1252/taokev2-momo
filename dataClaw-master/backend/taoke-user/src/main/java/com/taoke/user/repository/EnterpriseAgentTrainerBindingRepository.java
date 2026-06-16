package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseAgentTrainerBinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 经纪公司-专家绑定关系持久化。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:10
 */
public interface EnterpriseAgentTrainerBindingRepository extends JpaRepository<EnterpriseAgentTrainerBinding, Integer> {

    List<EnterpriseAgentTrainerBinding> findByEnterpriseAgentId(Integer enterpriseAgentId);

    List<EnterpriseAgentTrainerBinding> findByTrainerUserId(Integer trainerUserId);

    Optional<EnterpriseAgentTrainerBinding> findByEnterpriseAgentIdAndTrainerUserId(
            Integer enterpriseAgentId, Integer trainerUserId);

    List<EnterpriseAgentTrainerBinding> findByEnterpriseAgentIdInAndStatus(
            List<Integer> enterpriseAgentIds, Integer status);

    List<EnterpriseAgentTrainerBinding> findByEnterpriseAgentIdAndStatus(
            Integer enterpriseAgentId, Integer status);
}
