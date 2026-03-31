package com.taoke.user.repository;

import com.taoke.user.entity.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 学员档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface BuyerRepository extends JpaRepository<Buyer, Integer> {

    Optional<Buyer> findByUserId(Integer userId);
}
