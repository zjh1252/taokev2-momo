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
