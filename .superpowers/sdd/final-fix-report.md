# Final branch review fixes

- Course and video `submitForReview` now reject persisted entities with a blank `coverUrl`.
- `listRecentApproved` restores case descriptions as a maximum 120-character preview, avoiding full TEXT payloads in the trainer-list RSC.
- Added regression tests for both cover checks and description truncation.
- Verification:
  - `mvn -pl "taoke-course,taoke-user" -am "-Dtest=CourseServiceImplTest,VideoServiceImplTest,TrainerCaseServiceImplTest" "-Dsurefire.failIfNoSpecifiedTests=false" test -q`
  - `mvn -pl "taoke-course,taoke-user" -am compile -q`
- Known concern: the trainer-list `region` query parameter is still not directly bound in `TrainerController`; region resolution was intentionally left unchanged.
