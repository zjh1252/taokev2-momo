# Task 6 Report: Flyway V160 + User.oldUser（§79）

## Done
- `V160__add_users_old_user.sql`: `old_user TINYINT(1) NOT NULL DEFAULT 0` after `user_source`; backfill `old_user=1 WHERE uc_uid IS NOT NULL`
- `User.oldUser` entity field; `UserProfileResponse.oldUser` (MapStruct auto-maps in `getProfile`)
- `run_legacy_users_migrate.py`: INSERT includes `old_user=1`; test updated

## Validation
- Flyway V160: OK (1 non-blocking ALTER TABLE warning)
- `mvn -pl taoke-user -am compile`: OK
- `test_legacy_user_role_profile_migrate`: OK

## Notes
- Only `run_legacy_users_migrate.py` INSERTs into `sys_users`; other scripts reference table for FK checks only
- No explicit `UserServiceImpl` mapping needed — MapStruct handles `oldUser`

---

## Review fix (§79 old_user correctness)

### Changes
1. **V160 backfill** — `UPDATE sys_users SET old_user = 1 WHERE user_source = 2` (was `uc_uid IS NOT NULL`, which incorrectly flagged new UCenter regs with `user_source=1`). ADD COLUMN unchanged.
2. **AuthServiceImpl.provisionFromUcenter** — new lazy-provision path sets `user.setOldUser(true)` alongside `user_source=2`; linking path sets `oldUser=true` only when `user_source=2` (never for `user_source=1` new-register accounts).

### Validation / compile
- Flyway V160 validate: SQL OK; **checksum mismatch** in local DB (1536935480 vs repo 1517908826) — expected after editing an already-applied migration; run Flyway repair in affected envs before deploy.
- `mvn -pl taoke-user -am compile`: OK
