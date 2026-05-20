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
     * 注销账号（硬删除）。
     * <p>会同步删除：</p>
     * <ul>
     *   <li>sys_users 本身（不留 status=3 标记，直接物理删除）</li>
     *   <li>sys_user_roles 所有角色记录</li>
     *   <li>用户作为「主体」的各业务子表（user_trainers / user_agents / user_assistants /
     *       user_enterprise_agents / user_institutions / user_institution_employees /
     *       user_buyers / user_enterprise_buyers）</li>
     *   <li>所有绑定关系（agent_trainer / assistant_trainer / institution_trainer /
     *       institution_employee / enterprise_agent_trainer / enterprise_agent_member）</li>
     * </ul>
     * <p>OSS 文件等远端资源暂不联动删除，仅删除数据库记录。</p>
     *
     * @throws com.taoke.common.exception.BusinessException 当账号下仍有进行中的订单、已上架课程、
     *                                                     待结算提现等阻断业务时拒绝注销
     */
    void deleteOwnAccount(Integer userId);

    /**
     * 注销单一身份（硬删除）。
     * <p>仅可注销非默认 BUYER 角色，会删除：</p>
     * <ul>
     *   <li>sys_user_roles 中该角色记录</li>
     *   <li>对应业务子表记录</li>
     *   <li>该角色相关的绑定关系</li>
     * </ul>
     *
     * @param userId   当前用户 ID
     * @param roleCode 要注销的角色编码（如 TRAINER / AGENT / ...）
     */
    void withdrawRole(Integer userId, String roleCode);
}
