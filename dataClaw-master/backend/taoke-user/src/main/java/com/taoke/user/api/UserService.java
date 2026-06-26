package com.taoke.user.api;

import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 用户资料与账号相关能力（查询资料、修改资料、改密、改手机号、账号状态）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface UserService {

    /**
     * 根据用户 ID 查询用户资料。
     *
     * @param userId 用户 ID
     * @return 用户资料
     */
    UserProfileResponse getProfile(Integer userId);

    /**
     * 更新用户资料。
     *
     * @param userId  用户 ID
     * @param request 更新内容
     */
    void updateProfile(Integer userId, UpdateProfileRequest request);

    /**
     * 修改登录密码。
     *
     * @param userId  用户 ID
     * @param request 改密请求
     */
    void changePassword(Integer userId, ChangePasswordRequest request);

    /**
     * 修改绑定手机号。
     *
     * @param userId  用户 ID
     * @param request 改手机号请求
     */
    void changePhone(Integer userId, ChangePhoneRequest request);

    /**
     * 更新用户账号状态（如冻结等）。
     *
     * @param userId       用户 ID
     * @param status       状态值
     * @param freezeReason 冻结原因（非冻结场景可为空）
     */
    void updateStatus(Integer userId, Integer status, String freezeReason);

    /**
     * 分页搜索用户（支持手机号/昵称/真名模糊匹配 + 状态筛选）
     *
     * @param search   搜索关键词（可为 null）
     * @param status   状态（可为 null 表示不筛选）
     * @param pageable 分页参数
     * @return 用户分页结果
     */
    Page<User> searchUsers(String search, Integer status, Pageable pageable);

    /**
     * 判断用户是否存在
     */
    boolean existsById(Integer userId);

    /**
     * 获取所有正常状态用户的 ID 列表
     */
    List<Integer> getActiveUserIds();

    /**
     * 批量查询用户
     *
     * @param ids 用户 ID 列表
     * @return 用户列表
     */
    List<User> findAllByIds(List<Integer> ids);

    /**
     * 创建外部爬虫导入专用用户。
     * <p>
     * 用于管理员审核外部专家数据后，给正式专家档案提供 user_trainers.user_id。
     * 调用方需要保证导入数据已经通过审核。
     * </p>
     *
     * @param preferredUsername 首选账号，服务内会处理重名
     * @param nickname          昵称
     * @param avatarUrl         头像 URL
     * @return 新建用户
     */
    User createCrawlerImportedUser(String preferredUsername, String nickname, String avatarUrl);
}
