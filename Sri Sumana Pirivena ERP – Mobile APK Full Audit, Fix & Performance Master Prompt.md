# MASTER PROMPT — FULL EXISTING PROJECT AUDIT, FIX, SECURE, SPEED-UP & MOBILE APK HARDENING

You are an expert senior full-stack engineer, Android/Capacitor engineer, security engineer, database engineer, and performance engineer.

You are working on the EXISTING Sri Sumana Maha Pirivena ERP project:

Repository:
`chathura4003-blip/Mudduwamy.apk`

Git:
`git@github.com:chathura4003-blip/Mudduwamy.apk.git`

IMPORTANT:
This is an EXISTING REAL ERP + Android APK project.

DO NOT:
- create a new project
- rebuild the application from scratch
- replace the existing UI with a demo UI
- delete working modules
- replace the ERP with mock/demo data
- use fake users/classes/subjects
- replace MySQL with JSON/localStorage as a database
- create a second unrelated backend
- remove existing working functionality without proving it is obsolete
- claim success without testing
- silently change business rules
- break the existing Sri Sumana Maha Pirivena visual identity

The goal is:

EXISTING PROJECT
→ FULL AUDIT
→ FIX
→ SECURITY HARDENING
→ PERFORMANCE OPTIMIZATION
→ MOBILE UX IMPROVEMENT
→ ANDROID HARDENING
→ TESTING
→ PRODUCTION-READY APK

==================================================
1. FIRST RULE — AUDIT BEFORE MODIFYING
==================================================

Before changing code, inspect the entire repository.

Inspect at minimum:

- package.json
- vite.config.ts
- capacitor.config.ts
- tsconfig.json
- all src/
- all src/api/
- all src/components/
- all src/context/
- all src/hooks/
- all src/services/
- all src/utils/
- all src/views/
- all php/
- all php/api/
- php/schema.sql
- php/migrations/
- android/
- AndroidManifest.xml
- Gradle configuration
- native Java/Kotlin files
- scripts/
- public/
- uploads configuration
- .env.example
- gitignore
- build scripts

Create an internal audit matrix:

FILE
PURPOSE
PROBLEM
SEVERITY
ROOT CAUSE
FIX
TEST REQUIRED
DEPENDENCIES/RISK

Severity:
CRITICAL
HIGH
MEDIUM
LOW

Do NOT start random edits before understanding dependencies.

==================================================
2. PRESERVE THE EXISTING SYSTEM
==================================================

Keep the current architecture unless there is a proven reason to improve a specific part.

Target architecture:

React + TypeScript + Vite
        ↓
Central API Client
        ↓
PHP REST API
        ↓
MySQL

Android:

React/Vite
        ↓
Capacitor
        ↓
Android WebView/native bridge
        ↓
PHP API
        ↓
MySQL

Do not create SQLite as the primary backend database.

MySQL remains the single source of truth.

==================================================
3. CRITICAL SECURITY FIXES — DO FIRST
==================================================

### 3.1 Release keystore security

Inspect:

`android/app/build.gradle`

Remove ALL hard-coded:

- storePassword
- keyPassword
- sensitive signing credentials

Move secrets to secure configuration.

Allowed:

- environment variables
- Gradle properties outside source control
- CI/CD secrets

Do not commit secrets.

Search the entire repo and git history for exposed credentials.

Do not publish old compromised credentials again.

Preserve applicationId:

`lk.srisumana.erp`

Do not change package identity unless absolutely required.

==================================================
4. PASSWORD SECURITY
==================================================

Remove production dependence on:

`plain_password`

Passwords must be stored only as secure hashes.

Use:

`password_hash()`

and:

`password_verify()`

Do NOT:
- compare raw password to database password
- return plain passwords to frontend
- expose password hashes through API responses
- store passwords in localStorage
- store passwords in user JSON
- log passwords

Audit:
- auth.php
- users.php
- teachers.php
- students.php
- password change endpoints
- login
- reset password

Add migration path from legacy plain password data to hashes.

Do not break existing valid users during migration.

==================================================
5. DATABASE ARCHITECTURE
==================================================

Remove runtime schema mutation from API requests.

Do NOT do:

CREATE TABLE IF NOT EXISTS
ALTER TABLE
schema creation
runtime migration logic

inside normal API endpoints.

Use:

`php/migrations/`

for all schema changes.

Create proper migration scripts.

Use:
- primary keys
- foreign keys
- indexes
- unique constraints
- NOT NULL where appropriate
- timestamps
- transaction safety

Do not break existing production data.

==================================================
6. AUTHENTICATION
==================================================

Create a clean authentication flow:

Login
→ backend verifies credentials
→ backend creates secure session/token
→ API receives token
→ backend validates token
→ role/user authorization
→ response

Inspect and fix:

`php/api/auth.php`
`src/context/AuthContext.tsx`
`src/api/apiClient.ts`

Prevent:
- token leakage
- token logging
- stale session
- unauthorized cached data
- authenticated pages appearing after logout
- duplicate login state
- race conditions
- multiple session refreshes

On logout:
- stop background tasks
- clear auth state
- clear protected cache
- clear private navigation history
- clear notifications tied to old identity
- prevent back navigation into protected pages

==================================================
7. ROLE-BASED ACCESS CONTROL
==================================================

Roles:

ADMIN
TEACHER
STUDENT
PUBLIC

Backend authorization is authoritative.

Frontend hiding a tab is NOT security.

Every protected endpoint must enforce:
- authentication
- role
- resource ownership
- relationship/assignment rules

==================================================
8. TEACHER ASSIGNMENT RULE — CRITICAL
==================================================

The authoritative teacher access model is:

`teacher_assignments`

with:

- id
- teacher_id
- class_id
- subject_id
- section_id
- academic_year_id
- status
- created_at
- updated_at

Unique relationship:

teacher + class + subject + section + academic year

Teacher access must be based on exact relationship.

Example:

Teacher A:
10A + Math
11B + Science

Teacher A MUST NOT access:

10A + Science
11B + Math

Never trust:

- classesAssigned
- subjectsTaught
- subjectsAssigned
- categoriesTaught
- pirivenaClass
- URL teacherId alone
- body teacherId alone

Backend must calculate authorization from database relationships.

Create tests for:

Teacher A → 10A Math = 200
Teacher A → 10A Science = 403
Teacher A → 11B Science = 200
Teacher A → 11B Math = 403

==================================================
9. STUDENT OWNERSHIP SECURITY
==================================================

Authenticated student identity is authoritative.

Do NOT trust arbitrary:

`studentId`

from URL/body for protected student operations.

Student A MUST NOT access Student B data.

Test:

Student A → own results = 200
Student A → Student B results = 403

Apply to:
- profile
- results
- attendance
- exams
- submissions
- assignments
- timetable
- materials
- certificates
- notifications
- library where restricted
- personal documents

==================================================
10. API STANDARDIZATION
==================================================

Centralize API communication through:

`src/api/apiClient.ts`

All APIs should use consistent response format.

Success:

{
  "success": true,
  "data": {},
  "message": "Success"
}

Error:

{
  "success": false,
  "message": "...",
  "error": "...",
  "code": "FORBIDDEN"
}

Use proper HTTP status codes.

Do not swallow important backend errors.

Do not convert real API failures into fake successful empty arrays.

==================================================
11. API PERFORMANCE
==================================================

Inspect every API call for:

- duplicate requests
- repeated polling
- unnecessary refresh loops
- repeated fetches on render
- missing pagination
- over-fetching
- downloading full tables
- repeated identical GETs
- slow joins
- missing indexes

Optimize.

Prefer:

GET /api/students?page=1&limit=20

instead of downloading all students.

For dashboards:
- request only required fields
- aggregate server-side where useful
- avoid fetching same endpoint 5–10 times

Maintain the existing in-flight GET deduplication, but verify it does not hide legitimate requests.

==================================================
12. CACHE ARCHITECTURE
==================================================

Keep useful in-memory caching.

But classify data:

PUBLIC CACHEABLE
AUTHENTICATED CACHEABLE
SENSITIVE / NEVER CACHE

Never cache:
- passwords
- tokens
- private backups
- sensitive admin security data

Cache keys MUST contain appropriate user identity/role when private.

Invalidate cache after mutations.

Avoid stale data after:
- create
- edit
- delete
- login
- logout
- role change

==================================================
13. REMOVE LEGACY DUPLICATION
==================================================

Search whole project for duplicated data models and legacy fields.

Especially inspect:

- classesAssigned
- subjectsTaught
- subjectsAssigned
- categoriesTaught
- classId
- pirivenaClass
- enrolledSubjects
- studentSubjects
- teacherAssignments

Keep compatibility only where necessary.

Gradually migrate to authoritative relational backend structures.

Do not silently remove fields required by existing APIs until all consumers are migrated.

==================================================
14. FRONTEND PERFORMANCE
==================================================

Audit all React components for:

- unnecessary re-renders
- huge component files
- repeated state
- unstable callbacks
- unnecessary context updates
- effects running repeatedly
- missing dependency arrays
- expensive derived calculations
- duplicate event listeners
- timers not cleaned up
- async race conditions

Use where appropriate:

- React.memo
- useMemo
- useCallback
- proper context boundaries
- lazy loading
- code splitting
- virtualization
- pagination

Do NOT blindly wrap everything with memoization.

Optimize actual bottlenecks.

==================================================
15. LARGE COMPONENT REFACTORING
==================================================

Split oversized files without changing behavior.

Priority:

AdminDashboard
TeacherPortal
StudentPortal
large tabs
large modals

Use structure such as:

views/
  AdminDashboard/
    index.tsx
    tabs/
    components/
    modals/
    hooks/
    utils/
    types.ts

Do not duplicate business logic during splitting.

Create shared components for genuinely repeated UI.

==================================================
16. MOBILE-FIRST UI
==================================================

The APK must feel like a real mobile application.

Do NOT simply shrink desktop UI.

Improve:
- touch targets
- spacing
- cards
- bottom navigation
- headers
- sheets
- dialogs
- forms
- table alternatives
- list views
- loading indicators
- error states
- empty states
- keyboard handling
- safe-area insets

Minimum touch target should be appropriately sized for Android use.

Avoid horizontal scrolling unless required.

==================================================
17. NAVIGATION / BACK BUTTON
==================================================

Android back button must behave correctly.

Expected:

Modal open
→ close modal

Nested tab
→ previous tab/navigation state

Portal page
→ previous portal state

Login screen
→ normal Android exit behavior

Do NOT let Android back immediately close the application when the user should navigate backward.

Ensure no authenticated screen is recoverable after logout using back navigation.

Audit:

`src/hooks/`
`src/services/navigationHistoryManager`
Capacitor App listeners
browser history

==================================================
18. ANDROID WEBVIEW OPTIMIZATION
==================================================

Inspect `MainActivity.java`.

Do not blindly enable performance flags.

Audit:

- hardware acceleration
- cache policy
- DOM storage
- database storage
- rendering settings
- pre-raster
- layer settings
- WebView lifecycle
- memory usage

Remove unnecessary settings that increase RAM/battery usage without measurable benefit.

Do NOT use:

`android:largeHeap="true"`

as a substitute for memory optimization.

Remove it unless a measured, justified requirement exists.

Test on low-end Android hardware.

==================================================
19. APK MEMORY OPTIMIZATION
==================================================

Find:
- large images
- duplicate assets
- oversized splash files
- duplicate icons
- unnecessary libraries
- unused Capacitor plugins
- unused npm dependencies
- excessive JavaScript bundles

Optimize images using correct density/format.

Use lazy loading for large content.

Do not remove an asset until confirming it is unused.

==================================================
20. VITE / BUNDLE OPTIMIZATION
==================================================

Inspect:

`vite.config.ts`

Improve:
- production minification
- chunking
- lazy routes/views
- vendor splitting
- tree shaking
- asset compression where appropriate

Prevent giant single bundles.

Measure actual bundle output.

Do not expose private secrets through `VITE_*`.

==================================================
21. AI API SECURITY
==================================================

AI providers:

Gemini
OpenRouter

API keys MUST remain server-side.

Architecture:

APK
 ↓
PHP `/api/ai/*`
 ↓
Gemini/OpenRouter

Never put production secret AI API keys into:
- React source
- Vite define()
- VITE_GEMINI_API_KEY
- VITE_OPENROUTER_API_KEY
- APK assets
- browser JavaScript

Remove client-side secret exposure.

Use backend environment variables.

Add role/rate limits for AI endpoints.

Prevent abuse and unlimited API usage.

==================================================
22. FILE UPLOAD SECURITY
==================================================

Audit uploads.

Validate:
- extension
- MIME
- actual file signature
- file size
- filename
- storage path
- permissions

Do not trust client-provided MIME type.

Prevent:
- PHP upload execution
- path traversal
- executable uploads
- overwrite attacks
- malicious filenames

Uploaded files should not become executable server-side code.

==================================================
23. STUDY MATERIAL AUTHORIZATION
==================================================

Materials must be filtered using authenticated identity.

Students:
- own class
- enrolled subjects
- permitted materials

Teachers:
- only materials/classes/subjects they are authorized to manage

Do not rely only on:
- classId from request
- subjectId from request
- uploadedBy string

Authorization must be server-side.

==================================================
24. NOTIFICATIONS
==================================================

Clean notification architecture.

Primary mobile push:

OneSignal

Use Local Notifications only where truly needed.

Prevent:
- duplicate listeners
- duplicate notifications
- notifications after logout
- wrong-user notifications
- stale tags
- repeated push registration
- unnecessary polling

User identity mapping must be stable.

Teacher/student/admin segmentation must be server-controlled.

==================================================
25. LIFECYCLE / BACKGROUND TASKS
==================================================

Audit:

`appLifecycleManager`
all timers
all intervals
all event listeners
all polling services

Every background task must have:
- start
- stop
- cleanup

Prevent duplicate intervals after:
- login
- logout
- app resume
- portal switch
- hot reload
- navigation

Example bad behavior:

open portal
→ interval 1

open portal again
→ interval 2

open portal again
→ interval 3

Fix this class of problems completely.

==================================================
26. DUPLICATE CODE SEARCH
==================================================

Search entire codebase for:

- duplicate functions
- duplicate helpers
- duplicate API wrappers
- duplicate validation
- duplicate state
- duplicate event listeners
- duplicate components
- repeated SQL
- repeated authorization checks
- repeated formatting logic

Consolidate only when behavior remains unchanged.

Do not create giant “utils.ts” files containing unrelated code.

==================================================
27. LOOP / INFINITE RENDER AUDIT
==================================================

Search for:

useEffect loops
state update inside effect
effect → API → state → effect
timer recursion
recursive callbacks
event listener duplication
BroadcastChannel loops
cross-tab refresh loops

Examples to detect:

useEffect(...)
  setState(...)
    dependency changes
      effect runs again

or:

mutation
→ dispatch many refresh events
→ many components fetch
→ mutation/event again
→ endless refresh

Replace with controlled invalidation.

==================================================
28. GLOBAL REFRESH SYSTEM
==================================================

The current application dispatches many custom events.

Audit all:

- refresh-portal-data
- site-data-updated
- users-data-updated
- database-changed
- classes-updated
- subjects-updated
- curriculum-updated
- exams-updated
- materials-updated
- notices-updated
- admissions-updated
- donations-updated
- pirivena-users-updated
- pirivena-classes-updated
- pirivena-subjects-updated
- pirivena-notices-updated

Reduce excessive event storms.

Prefer targeted invalidation rather than firing many events after every mutation.

==================================================
29. ADMIN PORTAL
==================================================

Preserve all working admin features.

Verify:
- dashboard
- users
- teachers
- students
- classes
- sections
- subjects
- academic years
- teacher assignments
- student enrollments
- admissions
- content
- certificates
- reports
- audit logs
- settings
- backup
- notifications
- timetable

Every tab must:
- load correctly
- display loading state
- display empty state
- display errors
- support mobile interaction
- avoid unnecessary API requests

==================================================
30. TEACHER PORTAL
==================================================

Verify:

Dashboard
My Classes
Students
Lessons
Materials
Assignments
Exams
Results
Attendance
Timetable
Profile
Notifications
Settings

Teacher class cards should use backend-authorized student counts.

Teacher sees ONLY assigned:
teacher + class + subject (+ section/year)

==================================================
31. STUDENT PORTAL
==================================================

Verify:

Dashboard
Profile
Class
Subjects
Lessons
Materials
Assignments
Exams
Submissions
Results
Attendance
Timetable
Notifications
Library
Settings

Students see only:
- own account
- own class
- enrolled subjects
- authorized content

==================================================
32. TIMETABLE
==================================================

Use database-backed timetable.

Admin creates timetable.

Teacher sees assigned timetable.

Student sees class timetable.

Do not hard-code timetable data.

Avoid client-side timetable guessing.

Current period/dashboard information must derive from actual timetable + current time.

==================================================
33. OFFLINE / NETWORK HANDLING
==================================================

Do not fake offline database behavior.

When offline:
- show clear network state
- preserve safe locally cached read-only information
- avoid destructive writes
- queue only operations that are explicitly safe to queue
- retry when appropriate

Never silently fake success.

Example:

Failed attendance save
≠
show “Saved”

Show actual failure.

==================================================
34. PDF / DOWNLOAD / PRINT
==================================================

Audit native PDF bridges.

Fix:
- file URL handling
- content URI handling
- FileProvider
- MIME types
- secure filenames
- download permissions
- Android version compatibility

PDF opening should work without crashing.

Print should gracefully fail when no printer exists.

==================================================
35. ANDROID PERMISSIONS
==================================================

Audit all permissions.

Remove permissions not actually required.

Check:
- INTERNET
- notifications
- camera
- media access
- storage
- vibration

Do not request sensitive permission before necessary.

Use Android-version appropriate APIs.

==================================================
36. CAPACITOR CONFIG
==================================================

Review:

`capacitor.config.ts`

Clean:
- navigation allowlist
- HTTPS behavior
- cleartext configuration
- splash screen
- keyboard behavior
- status bar
- updater
- allowed domains

Do not allow broad navigation unnecessarily.

Do not enable mixed content in production.

Ensure external URLs open intentionally.

==================================================
37. WEBVIEW URL SECURITY
==================================================

Prevent arbitrary navigation from trusted WebView.

Allow only required domains.

Review links:
- YouTube
- PDF URLs
- uploads
- OneSignal
- Google
- stackstaging backend
- AI backend

Do not make everything universally allowed.

==================================================
38. API DATABASE PERFORMANCE
==================================================

Inspect all important tables and queries.

Create indexes for frequently used:
- foreign keys
- teacher_id
- student_id
- class_id
- subject_id
- academic_year_id
- section_id
- status
- created_at

Avoid:
SELECT *
where a small field subset is enough.

Avoid N+1 queries.

Use joins/aggregates intelligently.

==================================================
39. PHP QUALITY
==================================================

Standardize:
- authentication
- authorization
- input validation
- JSON responses
- error handling
- prepared statements
- transactions
- logging

Do not reveal SQL errors directly to users.

Log technical errors securely.

Return user-friendly errors.

==================================================
40. CORS / HTTP SECURITY
==================================================

Do not leave:

`Access-Control-Allow-Origin: *`

unless there is a documented and proven requirement.

Prefer explicit production origins.

Review:
- CORS
- security headers
- cache-control
- content type
- referrer policy
- frame options
- permissions policy

Do not break legitimate APK API traffic.

==================================================
41. SENSITIVE DATA RESPONSE AUDIT
==================================================

Never return:
- password
- password hash
- plain_password
- reset secrets
- database credentials
- private AI keys
- backend secrets

unless specifically required by a secure backend-only operation.

==================================================
42. PUBLIC API SECURITY
==================================================

Public endpoints should reveal only public information.

Private APIs must require authentication.

Do not rely on browser-generated hidden tabs as protection.

==================================================
43. ERROR HANDLING
==================================================

Do not use empty catch blocks when failure matters.

Bad:

catch (e) {}

Replace with meaningful handling:
- log safe technical information
- show user-friendly message where appropriate
- preserve app stability

Never hide security failures.

==================================================
44. BROWSER ALERT / CONFIRM / PROMPT
==================================================

Remove:
- alert()
- confirm()
- prompt()

Use existing UI:
- modal
- dialog
- toast
- inline validation
- bottom sheet

Do this without changing business behavior.

==================================================
45. TYPESCRIPT CLEANUP
==================================================

Run TypeScript checks.

Fix:
- any where safely replaceable
- inconsistent types
- duplicate interfaces
- dead imports
- unused variables
- unreachable code

Do not rewrite the complete type system unnecessarily.

==================================================
46. DEPENDENCY AUDIT
==================================================

Inspect package.json.

For every dependency:

KEEP
UPDATE
REMOVE

based on actual usage.

Do not remove:
- Capacitor
- React
- required ERP libraries
- required notification functionality

Remove genuinely unused packages only.

==================================================
47. BUILD CONFIGURATION
==================================================

Production build must support:

npm run build

npx cap sync android

Gradle release build

Fix any build issues discovered.

Do not assume a successful TypeScript compile means the APK works.

==================================================
48. RELEASE BUILD SECURITY
==================================================

Release should have:

- secure signing
- release-only configuration
- minification where safe
- ProGuard/R8 rules where required
- no debugging secrets
- no test users
- no mock data
- no development server URL
- no cleartext HTTP unless absolutely required

==================================================
49. VERSIONING
==================================================

Update:

versionCode
versionName

only when needed.

Keep versioning deterministic.

Do not randomly change package identity.

==================================================
50. TESTING REQUIREMENT
==================================================

After fixes, perform:

TypeScript check
ESLint
Vite build
Capacitor sync
Android Gradle build

Then test:

LOGIN
LOGOUT
BACK BUTTON
ADMIN
TEACHER
STUDENT
NOTIFICATIONS
PDF
DOWNLOAD
UPLOAD
EXAMS
RESULTS
ATTENDANCE
TIMETABLE
MATERIALS
PROFILE
SETTINGS
OFFLINE
RECONNECT
APP RESUME
APP BACKGROUND
APP RESTART

==================================================
51. AUTHORIZATION TEST MATRIX
==================================================

Test at minimum:

Admin → all permitted modules

Teacher A:
10A + Math = ALLOW
10A + Science = DENY
11B + Science = ALLOW
11B + Math = DENY

Student A:
Own profile = ALLOW
Own results = ALLOW
Own attendance = ALLOW
Student B profile = DENY
Student B results = DENY
Student B attendance = DENY

Unauthenticated:
Protected API = DENY

==================================================
52. PERFORMANCE TESTING
==================================================

Measure before and after where possible.

Track:
- initial APK startup
- login response
- dashboard render
- tab switching
- API request count
- duplicate request count
- memory usage
- APK size
- JS bundle size
- image payload size

Do not claim “faster” without evidence.

==================================================
53. LOW-END DEVICE TARGET
==================================================

Optimize especially for low-end Android devices.

Avoid:
- huge memory allocations
- unnecessary animations
- giant DOM trees
- excessive blur
- excessive shadows
- heavy chart rendering
- repeated polling
- large images

App must remain responsive.

==================================================
54. UI/UX PRESERVATION
==================================================

Preserve:

Sri Sumana Maha Pirivena identity
existing logo
existing colors where appropriate
Sinhala + English UX
monastic visual style

Improve usability, not branding.

Do not turn the application into a generic Material demo.

==================================================
55. CODE QUALITY RULE
==================================================

Prefer:

small reusable components
clear naming
single responsibility
centralized API access
centralized authorization helpers
centralized validation
typed data
explicit error handling

Avoid:
- duplicate logic
- giant utility files
- hidden side effects
- magical constants
- hard-coded production data

==================================================
56. IMPLEMENTATION ORDER
==================================================

Perform fixes in this EXACT order:

PHASE 1
Critical security:
- signing secrets
- password handling
- AI keys
- auth
- authorization
- upload security
- CORS

PHASE 2
Database:
- runtime schema mutation
- migrations
- indexes
- foreign keys
- relational authorization

PHASE 3
API:
- standard responses
- validation
- ownership
- teacher assignment enforcement
- query optimization

PHASE 4
Frontend architecture:
- duplicate API calls
- effects
- loops
- event storms
- state management
- component splitting

PHASE 5
Mobile:
- WebView
- Android back
- permissions
- lifecycle
- notifications
- PDF/download
- deep links

PHASE 6
Performance:
- bundle
- images
- lazy loading
- caching
- rendering
- memory

PHASE 7
UI/UX:
- mobile spacing
- navigation
- forms
- dialogs
- accessibility

PHASE 8
Testing:
- unit
- integration
- authorization
- Android
- build

==================================================
57. IMPORTANT — DO NOT MAKE MASSIVE UNSAFE CHANGES
==================================================

For each major change:

1. identify root cause
2. make smallest safe fix
3. check dependent files
4. run relevant test/build
5. continue

Do not modify hundreds of unrelated lines just for formatting.

Do not combine unrelated refactors with security fixes.

==================================================
58. GIT SAFETY
==================================================

Before major modifications:

Create a clear checkpoint/branch.

Use meaningful commits.

Example:

security/remove-exposed-signing-secrets
security/remove-plaintext-passwords
security/secure-ai-api
security/teacher-assignment-rbac
perf/reduce-duplicate-api-calls
perf/mobile-webview
refactor/split-admin-dashboard
android/fix-back-navigation
android/notification-cleanup

Never destroy working history.

==================================================
59. FINAL REPORT
==================================================

At the end, provide:

A. CRITICAL FIXES
B. HIGH PRIORITY FIXES
C. MEDIUM FIXES
D. PERFORMANCE IMPROVEMENTS
E. ANDROID IMPROVEMENTS
F. SECURITY IMPROVEMENTS
G. DATABASE IMPROVEMENTS
H. FILES CHANGED
I. TESTS EXECUTED
J. TEST RESULTS
K. BUILD RESULTS
L. KNOWN REMAINING ISSUES

For every change mention:

FILE
WHAT WAS WRONG
WHAT WAS FIXED
WHY
TEST RESULT

Do NOT say “100% complete” unless all required tests actually passed.

==================================================
60. FINAL DEFINITION OF DONE
==================================================

The project is complete only when:

[ ] Existing ERP functionality preserved
[ ] No fake production data
[ ] MySQL remains source of truth
[ ] No plaintext passwords
[ ] No exposed production secrets
[ ] No hard-coded signing credentials
[ ] AI keys server-side
[ ] Teacher assignment RBAC enforced
[ ] Student ownership enforced
[ ] Runtime DB migrations removed
[ ] Secure uploads
[ ] Consistent API responses
[ ] Duplicate API requests reduced
[ ] Infinite refresh loops removed
[ ] Background tasks cleaned up
[ ] Android back navigation fixed
[ ] Notifications stable
[ ] PDF/download stable
[ ] Mobile UI responsive
[ ] Low-end performance improved
[ ] TypeScript passes
[ ] Lint passes
[ ] Vite production build passes
[ ] Capacitor sync passes
[ ] Android release build passes
[ ] Authorization tests pass
[ ] Logout/back-navigation security passes
[ ] Offline/reconnect behavior verified
[ ] No known CRITICAL security issue remains

MOST IMPORTANT:

Do not rebuild the project.

Do not replace working functionality.

Do not create demo/mock substitutes.

Audit first.

Fix root causes.

Preserve existing data and business logic.

Make the final result a secure, fast, maintainable, production-ready Android mobile application for the Sri Sumana Maha Pirivena ERP.