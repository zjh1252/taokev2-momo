package com.taoke.admin.service;



import com.taoke.admin.dto.*;

import com.taoke.admin.mapper.AdminUserMapper;

import com.taoke.common.dto.PageResult;

import com.taoke.common.exception.BusinessException;

import com.taoke.common.exception.ErrorCode;

import com.taoke.course.api.CourseService;

import com.taoke.course.api.VideoService;

import com.taoke.user.api.TrainerCaseService;

import com.taoke.user.api.TrainerService;

import com.taoke.user.api.UserRoleService;

import com.taoke.user.api.UserService;

import com.taoke.user.entity.Trainer;

import com.taoke.user.entity.User;

import com.taoke.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.util.*;

import java.util.stream.Collectors;



/**

 * 后台用户管理编排服务。

 *

 * @author Fangxinxin

 * @date 2026-03-20

 */

@Service

@RequiredArgsConstructor

public class AdminUserService {



    private final UserService userService;

    private final UserRoleService userRoleService;

    private final AdminUserMapper adminUserMapper;

    private final TrainerService trainerService;

    private final CourseService courseService;

    private final TrainerCaseService trainerCaseService;

    private final VideoService videoService;



    public PageResult<AdminUserVO> listUsers(AdminUserQuery query) {

        PageRequest pageable = PageRequest.of(

                query.getPage() - 1, query.getSize(),

                Sort.by(Sort.Direction.DESC, "id")

        );



        Page<User> userPage = userService.searchUsersForAdmin(

                query.getSearch(), query.getStatus(), query.getRole(),

                query.getRegOrigin(), query.getRealNameCertStatus(), pageable);

        List<User> users = userPage.getContent();



        if (users.isEmpty()) {

            return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), List.of());

        }



        List<Integer> userIds = users.stream().map(User::getId).toList();

        Map<Integer, List<UserRole>> roleMap = userRoleService.findByUserIds(userIds)

                .stream()

                .collect(Collectors.groupingBy(UserRole::getUserId));



        Map<Integer, Trainer> trainerByUserId = trainerService.findByUserIds(userIds).stream()

                .filter(t -> t.getUserId() != null)

                .collect(Collectors.toMap(Trainer::getUserId, t -> t, (a, b) -> a));



        Map<Integer, Long> courseCountMap = courseService.countByPublisherIds(userIds);

        Map<Integer, Long> videoCountMap = videoService.countByPublisherIds(userIds);



        List<Integer> trainerIds = trainerByUserId.values().stream().map(Trainer::getId).toList();

        Map<Integer, Long> caseCountByTrainerId = trainerIds.isEmpty()

                ? Map.of()

                : trainerCaseService.countByTrainerIds(trainerIds);



        List<AdminUserVO> voList = users.stream().map(user -> {

            AdminUserVO vo = adminUserMapper.toVO(user);

            vo.setRegOrigin(user.getRegOrigin());

            vo.setUserSource(user.getUserSource());

            List<UserRole> roles = roleMap.getOrDefault(user.getId(), List.of());

            vo.setRoles(roles.stream().map(adminUserMapper::toRoleItem).toList());

            vo.setCourseCount(courseCountMap.getOrDefault(user.getId(), 0L).intValue());

            Trainer trainer = trainerByUserId.get(user.getId());

            if (trainer != null) {

                vo.setRealNameCertStatus(trainer.getRealNameStatus());

                vo.setCaseCount(caseCountByTrainerId.getOrDefault(trainer.getId(), 0L).intValue());

            } else {

                vo.setCaseCount(0);

            }

            return vo;

        }).toList();



        return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), voList);

    }



    public AdminUserDetailVO getUserDetail(Integer userId) {

        List<User> users = userService.findAllByIds(List.of(userId));

        if (users.isEmpty()) {

            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");

        }

        User user = users.getFirst();

        AdminUserDetailVO vo = new AdminUserDetailVO();

        AdminUserVO base = adminUserMapper.toVO(user);

        copyUserVo(base, vo);

        vo.setEmail(user.getEmail());

        vo.setUsername(user.getUsername());

        vo.setProvinceId(user.getProvinceId());

        vo.setCityId(user.getCityId());

        vo.setAddress(user.getAddress());

        vo.setRegOrigin(user.getRegOrigin());

        vo.setUserSource(user.getUserSource());



        List<UserRole> roles = userRoleService.findByUserId(userId);

        vo.setRoles(roles.stream().map(adminUserMapper::toRoleItem).toList());



        vo.setCourseCount(courseService.countByPublisherIds(List.of(userId))

                .getOrDefault(userId, 0L).intValue());

        vo.setVideoCount(videoService.countByPublisherIds(List.of(userId))

                .getOrDefault(userId, 0L).intValue());



        List<Trainer> trainers = trainerService.findByUserIds(List.of(userId));

        if (!trainers.isEmpty()) {

            Trainer trainer = trainers.getFirst();

            vo.setTrainerId(trainer.getId());

            vo.setTrainerStatus(trainer.getStatus());

            vo.setRealNameCertStatus(trainer.getRealNameStatus());

            vo.setCaseCount(trainerCaseService.countByTrainerIds(List.of(trainer.getId()))

                    .getOrDefault(trainer.getId(), 0L).intValue());

        } else {

            vo.setCaseCount(0);

        }

        return vo;

    }



    @Transactional

    public AdminUserVO createUser(AdminCreateUserRequest request) {

        User user = userService.adminCreateUser(

                request.getPhone(), request.getNickname(), request.getRealName());

        AdminUserVO vo = adminUserMapper.toVO(user);

        vo.setRegOrigin(user.getRegOrigin());

        vo.setUserSource(user.getUserSource());

        vo.setRoles(List.of());

        vo.setCourseCount(0);

        vo.setCaseCount(0);

        return vo;

    }



    public void updateStatus(Integer userId, UpdateUserStatusRequest request) {

        userService.updateStatus(userId, request.getStatus(), request.getFreezeReason());

    }



    public List<UserBusinessRoleVO> getUserRoles(Integer userId) {

        if (!userService.existsById(userId)) {

            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");

        }

        return userRoleService.getUserPlatformRoles(userId).stream()

                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))

                .toList();

    }



    @Transactional

    public List<UserBusinessRoleVO> assignRoles(Integer userId, AssignBusinessRolesRequest request) {

        List<UserRole> result = userRoleService.assignPlatformRoles(userId, request.getRoleCodes());

        return result.stream()

                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))

                .toList();

    }



    private static void copyUserVo(AdminUserVO from, AdminUserVO to) {

        to.setId(from.getId());

        to.setPhone(from.getPhone());

        to.setNickname(from.getNickname());

        to.setRealName(from.getRealName());

        to.setAvatarUrl(from.getAvatarUrl());

        to.setGender(from.getGender());

        to.setStatus(from.getStatus());

        to.setFreezeReason(from.getFreezeReason());

        to.setLastLoginAt(from.getLastLoginAt());

        to.setCreatedAt(from.getCreatedAt());

        to.setRoles(from.getRoles());

    }

}


