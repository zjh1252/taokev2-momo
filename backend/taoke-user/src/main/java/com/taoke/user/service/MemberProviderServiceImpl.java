package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.MemberProviderService;
import com.taoke.user.entity.MemberProvider;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.MemberProviderRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import com.taoke.user.ucenter.UcenterClient;
import com.taoke.user.ucenter.UcenterProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 接入商用户映射（对齐老站 MemberProvider.php / get_tkw_uid_by_provider）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberProviderServiceImpl implements MemberProviderService {

    private static final int UC_USERNAME_EXISTS = -3;

    private final MemberProviderRepository memberProviderRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UcenterClient ucenterClient;
    private final UcenterProperties ucenterProperties;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<MemberProviderBinding> findByTkwUserId(int tkwUserId) {
        if (tkwUserId <= 0) {
            return Optional.empty();
        }
        return memberProviderRepository.findByTkwId(tkwUserId)
                .map(row -> new MemberProviderBinding(row.getTkwType(), row.getRootCompanyId(), row.getTkwId()));
    }

    @Override
    @Transactional
    public int resolveTkwUserId(String appid, int rootCompanyId) {
        if (!StringUtils.hasText(appid) || rootCompanyId <= 0) {
            return 0;
        }
        List<Integer> ids = resolveTkwUserIds(appid, List.of(rootCompanyId));
        return ids.isEmpty() ? 0 : ids.getFirst();
    }

    @Override
    @Transactional
    public List<Integer> resolveTkwUserIds(String appid, Collection<Integer> rootCompanyIds) {
        if (!StringUtils.hasText(appid) || rootCompanyIds == null || rootCompanyIds.isEmpty()) {
            return List.of();
        }
        String tkwType = appid.trim();
        List<Integer> companyIds = rootCompanyIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (companyIds.isEmpty()) {
            return List.of();
        }

        Map<Integer, Integer> resolved = new LinkedHashMap<>();
        memberProviderRepository.findByTkwTypeAndRootCompanyIdIn(tkwType, companyIds).forEach(row ->
                resolved.put(row.getRootCompanyId(), row.getTkwId()));

        for (Integer rootCompanyId : companyIds) {
            if (!resolved.containsKey(rootCompanyId)) {
                int tkwUserId = registerProviderUser(tkwType, rootCompanyId);
                if (tkwUserId > 0) {
                    resolved.put(rootCompanyId, tkwUserId);
                }
            }
        }

        List<Integer> userIds = new ArrayList<>();
        for (Integer rootCompanyId : companyIds) {
            Integer tkwUserId = resolved.get(rootCompanyId);
            if (tkwUserId != null && tkwUserId > 0) {
                userIds.add(tkwUserId);
            }
        }
        return userIds;
    }

    private int registerProviderUser(String appid, int rootCompanyId) {
        if (!ucenterProperties.isEnabled()) {
            log.warn("UCenter 未启用，无法注册接入商用户 appid={} rootCompanyId={}", appid, rootCompanyId);
            return 0;
        }

        int ucUid = 0;
        String username = null;
        String password = providerPassword(appid, rootCompanyId);
        for (int attempt = 0; attempt < 8 && ucUid <= 0; attempt++) {
            username = randomProviderUsername(appid);
            String email = username + "@tester-pom.com";
            ucUid = ucenterClient.register(username, password, email, null);
            if (ucUid == UC_USERNAME_EXISTS) {
                ucUid = 0;
            }
        }
        if (ucUid <= 0 || !StringUtils.hasText(username)) {
            log.error("接入商用户 UCenter 注册失败 appid={} rootCompanyId={}", appid, rootCompanyId);
            return 0;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@tester-pom.com");
        user.setUcUid(ucUid);
        user.setUserSource(1);
        user.setStatus(1);
        user.setRegOrigin(1);
        user.setNickname("接入商:" + appid);
        user.setPasswordHash(passwordEncoder.encode(password));
        user = userRepository.save(user);

        UserRole buyerRole = new UserRole();
        buyerRole.setUserId(user.getId());
        buyerRole.setRole(BusinessRole.Code.BUYER);
        buyerRole.setStatus(1);
        buyerRole.setApprovedAt(java.time.LocalDateTime.now());
        userRoleRepository.save(buyerRole);

        int now = (int) (System.currentTimeMillis() / 1000);
        MemberProvider row = new MemberProvider();
        row.setTkwId(user.getId());
        row.setTkwType(appid);
        row.setRootCompanyId(rootCompanyId);
        row.setRegtime(now);
        row.setUpdatetime(now);
        memberProviderRepository.save(row);

        log.info("接入商用户已注册 appid={} rootCompanyId={} tkwUserId={} ucUid={}",
                appid, rootCompanyId, user.getId(), ucUid);
        return user.getId();
    }

    private static String randomProviderUsername(String appid) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        char a = (char) ('A' + random.nextInt(26));
        char b = (char) ('A' + random.nextInt(26));
        char c = (char) ('A' + random.nextInt(26));
        char d = (char) ('A' + random.nextInt(26));
        return "pom_" + appid + "_" + Character.toLowerCase(a)
                + Character.toLowerCase(b) + Character.toLowerCase(c) + Character.toLowerCase(d);
    }

    /** 对齐老站 md5($appid . $root_company_id)。 */
    private static String providerPassword(String appid, int rootCompanyId) {
        return md5Hex(appid + rootCompanyId);
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 not available", e);
        }
    }
}
