package com.taoke.user.api;

import java.util.Set;

/**
 * 角色绑定鉴权对外 API。
 * <p>用于其它模块（课程、案例、视频、著作等）按 trainer 代管权限做横向越权校验。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 16:30
 */
public interface BindingAuthority {

    /**
     * 列出当前用户能代管的所有专家 user_id。
     */
    Set<Integer> listManagedTrainerUserIds(Integer operatorUserId);

    /**
     * 列出当前用户能代管的所有专家 ID（user_trainers.id）。
     */
    Set<Integer> listManagedTrainerIds(Integer operatorUserId);

    /**
     * 校验当前用户能否代管指定专家（按 user_id），无权抛 FORBIDDEN。
     */
    void requireCanManageTrainer(Integer operatorUserId, Integer targetTrainerUserId);

    /**
     * 解析请求中的目标专家 user_id；为 null 时回退为 operatorUserId 本身，并完成权限校验。
     */
    Integer resolveTargetTrainerUserId(Integer operatorUserId, Integer requestedTrainerUserId);
}
