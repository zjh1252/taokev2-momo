package com.taoke.user.repository;

import com.taoke.user.entity.MemberProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberProviderRepository extends JpaRepository<MemberProvider, Integer> {

    Optional<MemberProvider> findByTkwId(Integer tkwId);

    List<MemberProvider> findByTkwTypeAndRootCompanyIdIn(String tkwType, Collection<Integer> rootCompanyIds);
}
