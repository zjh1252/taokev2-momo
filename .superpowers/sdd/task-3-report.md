# Task 3 Report: C 端与 Admin Controllers

## Status

DONE_WITH_CONCERNS

## Summary

Implemented the training-partner alliance HTTP layer:

- Added `AlliancePartnerController` in `taoke-user` with authenticated-user GET/POST self-service routes and no business-role annotation.
- Added `AdminAlliancePartnerController` with list, detail, approve, and reject routes.
- Applied `@RequirePermission("alliance:partner:audit")` to every Admin endpoint.
- Reused `RejectApplicationRequest` for validated rejection bodies.
- Added thin `AdminAlliancePartnerService`, delegating exclusively to `AlliancePartnerApplicationService` and recording the current admin user ID for approve/reject.

## Routes

- `GET /alliance/partners/me/application`
- `POST /alliance/partners/me/application`
- `GET /admin/alliance/partners/applications`
- `GET /admin/alliance/partners/applications/{id}`
- `PUT /admin/alliance/partners/applications/{id}/approve`
- `PUT /admin/alliance/partners/applications/{id}/reject`

## Verification

IDE diagnostics reported no linter errors in the three new Java files.

Requested command:

```text
mvn -pl taoke-app -am compile -DskipTests
```

Result: `BUILD FAILURE` in a pre-existing, untouched file:

```text
taoke-user ......................................... SUCCESS
taoke-course ....................................... SUCCESS
taoke-admin ........................................ FAILURE
AdminCrawlService.java:[277,41] String cannot be converted to ErrorCode
```

The failing line is `throw new BusinessException("内置数据源不可删除");` in
`AdminCrawlService.deleteSource`. It is outside Task 3 and is not modified by this work.

No new automated tests were required by Task 3; verification was the specified compile.

## Concerns

- The referenced `.superpowers/sdd/task-3-brief.md` was absent from the worktree. Implementation followed Task 3 in `docs/superpowers/plans/2026-07-13-alliance-partner.md`, which contains the same files, routes, permission, and compile requirements.
- Full reactor compilation cannot pass until the unrelated `AdminCrawlService` constructor mismatch is corrected.
