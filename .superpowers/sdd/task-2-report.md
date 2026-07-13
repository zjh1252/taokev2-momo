# Task 2 Report: Entity / Repository / DTO / Service API（TDD）

## Status

DONE_WITH_CONCERNS

## Summary

Implemented the training-partner alliance application domain layer in `taoke-user`:

- JPA entity mapped to `alliance_partner_applications`, extending `BaseEntity` and using `@DynamicInsert` / `@DynamicUpdate`.
- Spring Data repository with latest-user, user/status, and status-page queries.
- Validated application request DTO and complete application response DTO.
- Public `AlliancePartnerApplicationService` API.
- Transactional service implementation covering submit, latest/detail queries, admin paging, approve, reject, and best-effort review notifications.
- Mockito/JUnit service tests covering agreement consent, duplicate pending/approved applications, creation and partner code, paging, missing records, state transitions, rejection validation, and notification calls.

No controller was added.

## TDD Evidence

### RED

Initial required command:

```text
mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest
```

Result: `BUILD FAILURE` in `taoke-common` before `taoke-user` test compilation:

```text
No tests matching pattern "AlliancePartnerApplicationServiceImplTest" were executed!
```

The reactor applies the selected test name to upstream modules. To reach the intended test compilation while retaining `-am`, the upstream no-match failure was disabled:

```text
mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest "-Dsurefire.failIfNoSpecifiedTests=false"
```

Expected RED result:

```text
AlliancePartnerApplicationServiceImplTest.java: package com.taoke.user.dto.alliance does not exist
cannot find symbol: AlliancePartnerApplication
cannot find symbol: AlliancePartnerApplicationRepository
cannot find symbol: AlliancePartnerApplicationServiceImpl
BUILD FAILURE
```

This confirmed the tests failed because the requested production feature did not yet exist.

### GREEN

After implementing the production classes, the same reactor-safe command was run:

```text
mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest "-Dsurefire.failIfNoSpecifiedTests=false"
```

Result:

```text
Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
taoke-common ....................................... SUCCESS
taoke-user ......................................... SUCCESS
BUILD SUCCESS
```

IDE diagnostics for all seven changed Java files reported no linter errors.

## Implementation Notes

- Application statuses are local to this table: `1` pending, `2` approved, `3` rejected.
- Submission rejects unsigned agreements and existing pending/approved records.
- Rejected users can submit a new row, preserving audit history.
- Partner code follows the task brief formula: `TPC_` + `yyyyMMddHHmmss` + six-digit zero-padded `userId`.
- Agreement version defaults to `v1` when omitted or blank.
- Approve/reject only accept pending applications and record reviewer/time.
- Rejection requires a nonblank reason.
- Notification template rendering and sending are wrapped in `try/catch`; failures are logged and do not undo the persisted review state.
- Admin pages are one-based externally and sorted by descending ID.

## Commit

`ba40e50f feat(user): implement alliance partner application service`

## Concerns

The exact requested Maven command cannot reach the target module in this multi-module reactor because Surefire fails in upstream `taoke-common` when that module has no test matching the selected class. Adding `"-Dsurefire.failIfNoSpecifiedTests=false"` is required for this targeted `-am` invocation; with that reactor-safe option all 11 tests pass.

## Review Fixes

- Moved approve/reject notifications to an `afterCommit` callback, so no notification work runs inside the audit transaction.
- Added `AlliancePartnerNotificationSender` with `REQUIRES_NEW`, ensuring notification persistence uses an independent transaction after the audit commit.
- Notification/template failures are caught and logged by the after-commit caller and cannot roll back the approved/rejected status.
- Added approve and reject regression tests proving the status save occurs before notification dispatch and notification exceptions are swallowed after commit.
- Added coverage for template rendering and the sender's `REQUIRES_NEW` transaction contract.
- Kept the existing pending/approved business guard. A database-only uniqueness constraint for `status = 1` is not practical without a generated column or more complex locking, so the small concurrent-submit race remains documented rather than over-engineered.
- No controller or Flyway changes were made.

### Review Fix Verification

```text
mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest "-Dsurefire.failIfNoSpecifiedTests=false"
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
taoke-common ....................................... SUCCESS
taoke-user ......................................... SUCCESS
BUILD SUCCESS
```

IDE diagnostics reported no linter errors in the three changed Java files.

## Concurrency Fix

- Added `approveIfPending` / `rejectIfPending` conditional JPQL updates on `AlliancePartnerApplicationRepository` (`WHERE status = 1`).
- `approve` / `reject` now use these updates; `0` rows updated throws `BusinessException` ("当前状态不可审核") for concurrent double-review.
- Submit keeps `findFirst` guards and adds a second pending check immediately before `save` to shrink the duplicate-pending window; remaining race without a partial unique index is documented in `submit_recheckBeforeSaveRejectsLatePending`.
- No Flyway partial unique index (MySQL portability).

### Concurrency Fix Verification

```text
mvn -pl taoke-user -Dtest=AlliancePartnerApplicationServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test
Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## Commit

`fix(user): conditional approve/reject for alliance partner applications`
