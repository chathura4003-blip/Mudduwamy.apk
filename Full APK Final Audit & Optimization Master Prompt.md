WORK ONLY ON THE EXISTING `chathura4003-blip/Mudduwamy.apk` PROJECT.

DO NOT create a new project.
DO NOT rebuild from scratch.
DO NOT replace existing ERP UI.
DO NOT remove working modules.
DO NOT invent mock/demo data.
DO NOT use JSON/localStorage/SQLite as the production database.
DO NOT weaken authentication or authorization.
DO NOT change business rules.
DO NOT claim completion without testing.

PRIMARY GOAL:

Turn the existing Sri Sumana Maha Pirivena ERP into a production-grade, fast, stable, low-RAM, low-CPU, low-network, native-like Android APK while preserving every existing ERP feature.

ARCHITECTURE MUST REMAIN:

React + TypeScript + Vite
→ centralized API client
→ PHP backend
→ MySQL

Android:
React/Vite
→ Capacitor
→ Android WebView/native bridge
→ PHP API
→ MySQL

==================================================
1. COMPLETE REPOSITORY AUDIT
==================================================

Audit all existing:

src/
src/api/
src/components/
src/context/
src/hooks/
src/services/
src/utils/
src/views/
AdminDashboard
TeacherPortal
StudentPortal
package.json
vite.config.ts
tsconfig.json
capacitor.config.ts
scripts/
public/
android/
AndroidManifest.xml
MainActivity.java
Gradle files
R8/ProGuard
resources
tests

Before deleting anything, verify repository-wide references.

==================================================
2. REMOVE GLOBAL 30-SECOND PORTAL POLLING
==================================================

Audit:
useStudentPortalData.ts
useTeacherPortalData.ts
all portal refresh hooks

Remove unnecessary 30000ms polling.

Replace global polling with:

- initial fetch
- active-tab fetch
- targeted mutation invalidation
- BroadcastChannel/database-change events
- foreground resume refresh only when stale
- manual pull-to-refresh

Never refresh all portal datasets every 30 seconds.

No refresh loop multiplication.

==================================================
3. STUDENT AUTHORIZATION
==================================================

Student authorization must be based on:

authenticated student identity
+
actual backend student enrollment
+
authorized class
+
authorized subjects

Do NOT trust:

pirivenaClass fallback
classLevel fallback
studentSubjects legacy fields
client-only subject lists
URL studentId
body studentId supplied by client

Remove unsafe fallback behavior such as returning all subjects when authorization data is missing.

Backend remains final authorization authority.

Student A must never access Student B data.

==================================================
4. TEACHER AUTHORIZATION
==================================================

`teacher_assignments` is the ONLY authoritative assignment relationship.

Use exact:

teacher_id
class_id
subject_id
section_id
academic_year_id
status

Do not use these as authorization authorities:

classesAssigned
subjectsTaught
subjectsAssigned
classId
classTeacher
assignedTeacherIds
pirivenaClass
name-based matching

Teacher access must be tuple-based.

Example:

Teacher A
10A + Math
11B + Science

MUST NOT access:

10A + Science
11B + Math

Do not filter class and subject independently.

The complete relationship must be checked together.

==================================================
5. STUDENT DATA FETCH OPTIMIZATION
==================================================

Do not fetch library data when Library tab is inactive.

Lazy-load Library only when needed.

Do not fetch all classes, subjects, teachers, exams, submissions and materials on every refresh unless required by the active screen.

Use targeted APIs and caching.

==================================================
6. TEACHER DATA FETCH OPTIMIZATION
==================================================

Do not call studentsApi.getStudents() globally unless the current teacher authorization permits the requested scope.

Prefer:

teacher assignment scope
→ selected class
→ selected subject
→ paginated students

Never download the complete student database unnecessarily.

==================================================
7. REMOVE DUPLICATE FETCH MONKEY PATCH
==================================================

`index.html` and `src/main.tsx` currently both patch window.fetch.

Investigate why this exists.

Remove redundant implementation.

Prefer not to monkey-patch window.fetch at all unless a proven compatibility requirement exists.

If required, keep exactly one isolated implementation with documented reason and cleanup-safe behavior.

==================================================
8. NOTIFICATION FIX
==================================================

Use:

OneSignal = remote push
LocalNotifications = local/scheduled notifications

Prevent:

duplicate permission requests
duplicate listeners
duplicate notification delivery
duplicate sound
duplicate vibration

`hasRequestedPermission` must actually prevent repeated permission requests when permission was already handled.

`requestNotificationPermission()` must be state-aware.

`scheduleNotification()` must return a correct success/failure result.

Do not report success when native notification scheduling did not occur.

==================================================
9. ONESIGNAL NATIVE SEPARATION
==================================================

Native Android must never load OneSignal Web SDK.

Keep native and browser code paths cleanly separated.

Initialize native OneSignal once.

Do not repeatedly:

login
setUser
addTags
request permission
register listeners

Only sync when authenticated identity or required tags actually changed.

==================================================
10. AI SECURITY + PERFORMANCE
==================================================

Audit:

GeminiProvider
OpenRouterProvider
@google/genai
AI API services

Never expose private production AI API keys inside:

VITE_*
Android APK
client JavaScript
bundled assets

Move private AI calls behind the existing PHP backend where appropriate.

The APK must not contain private service credentials.

Keep model configuration safe and server-controlled.

Lazy-load heavy AI functionality.

==================================================
11. ANDROID MANIFEST PERMISSION MINIMIZATION
==================================================

Audit every permission.

Keep only permissions required by actual features.

Verify:

CAMERA
POST_NOTIFICATIONS
READ_MEDIA_IMAGES
READ_MEDIA_VIDEO
READ_MEDIA_AUDIO
READ_EXTERNAL_STORAGE
WRITE_EXTERNAL_STORAGE

Remove unused permissions.

Do not request runtime permission unnecessarily.

==================================================
12. FILEPROVIDER HARDENING
==================================================

Current FileProvider contains broad `path="."` mappings.

Restrict FileProvider to only directories actually required.

Keep PDF opening functional.

Do not expose broad application storage.

==================================================
13. MAINACTIVITY PDF/DOWNLOAD OPTIMIZATION
==================================================

Keep:

PDF viewer
printing
download support

Prefer direct file/URL handling for large PDFs.

Use Base64 only when necessary.

Keep strong memory guards.

Avoid loading extremely large Base64 documents into memory.

Prevent duplicate download requests.

Sanitize download filenames.

Gracefully handle missing PDF applications.

==================================================
14. ANDROID WEBVIEW
==================================================

Keep secure defaults.

Do NOT reintroduce:

RenderPriority HIGH
forced hardware layer
OffscreenPreRaster
other aggressive settings without measured evidence

Audit:

DOM storage
database
file access
content access
mixed content
navigation
downloads
PDF
JavaScript bridge

Only enable what the application really requires.

==================================================
15. CAPACITOR NAVIGATION SECURITY
==================================================

Review `allowNavigation`.

Replace broad wildcards such as:

*.google.com
*.stackstaging.com
and unnecessary wildcard domains

with the smallest exact production allowlist possible.

Do not break required external services.

==================================================
16. ANDROID BUILD CONFIGURATION
==================================================

Unify Java target.

Do not have confusing Java 17 and Java 21 configuration conflicts.

Keep release:

minifyEnabled true
shrinkResources true

Ensure R8 rules preserve only required classes.

Do not keep huge wildcard packages unless required.

==================================================
17. RELEASE SIGNING
==================================================

Release signing must fail fast if production signing credentials are missing.

Do not silently continue with empty passwords.

Never hardcode secrets.

Use environment variables / secure CI secrets.

==================================================
18. VERSION MANAGEMENT
==================================================

Replace fixed:

versionCode 1
versionName "1.0"

with controlled release versioning.

Every release must produce a unique versionCode.

Keep versionName human-readable.

==================================================
19. BUILD SCRIPT CLEANUP
==================================================

Separate:

production release build
debug build

Do not automatically compile debug APK during every production release build.

Keep:

npm build
Capacitor sync
assembleRelease

as the main distribution path.

Optional debug build should be explicitly requested.

==================================================
20. ANDROID TEST FIX
==================================================

Current instrumented test expects:

com.getcapacitor.app

Actual applicationId is:

lk.srisumana.erp

Fix the test.

Add meaningful smoke tests for:

application startup
WebView startup
login screen
navigation
back button
PDF bridge
print bridge
notification permission
logout
session expiry

==================================================
21. ASSET CLEANUP
==================================================

Audit duplicate public assets.

Current repository contains duplicate logo variants.

Verify all references, then consolidate duplicate assets.

Do not delete an asset before proving it is unused.

==================================================
22. SPLASH OPTIMIZATION
==================================================

Audit all density/orientation splash PNG resources.

Reduce unnecessary duplicate raster resources where safe.

Preserve correct Android splash appearance.

Do not reduce quality excessively.

==================================================
23. PORTAL CODE SPLITTING
==================================================

Further split large:

AdminDashboard.tsx
TeacherPortal.tsx
StudentPortal.tsx

Lazy-load:

reports
certificates
large tables
advanced admin tools
AI
file viewers
charts
heavy modals

Only load expensive modules when the user opens them.

==================================================
24. LARGE LISTS
==================================================

Use:

server pagination
server filtering
server sorting
small page sizes
virtualization where needed

Never render thousands of rows.

Do not hide thousands of rows with CSS.

==================================================
25. EVENT SYSTEM
==================================================

Use one canonical database-change event system.

Prevent:

database event
→ many duplicate CustomEvents
→ repeated refreshes

Only affected modules should refresh.

==================================================
26. LIFECYCLE
==================================================

Native Capacitor lifecycle should be primary.

Browser lifecycle should be fallback.

Guarantee:

one transition
=
one refresh cycle

No duplicate resume handling.
No duplicate timers.
No background polling.

==================================================
27. BACK BUTTON
==================================================

Create one authoritative Android back flow.

Priority:

1. file viewer
2. active modal
3. nested modal
4. subtab history
5. portal overview
6. exit confirmation

One physical Android back press must create one logical action.

No fake Escape dispatch unless absolutely required.

==================================================
28. PERFORMANCE
==================================================

Avoid blind memoization.

Measure:

startup
login
dashboard render
tab switching
API count
duplicate API requests
RAM
CPU where measurable
scrolling
jank
background/resume
APK size
largest JS chunk
largest CSS chunk

Do not invent metrics.

==================================================
29. SECURITY
==================================================

Never weaken:

authentication
teacher assignment authorization
student ownership
session validation

Backend remains the final security boundary.

Frontend filtering is UX optimization only.

==================================================
30. FINAL VALIDATION
==================================================

Run:

TypeScript check
ESLint
Vite production build
Capacitor sync
Gradle release build
Android instrumented tests
APK installation test

Verify:

Admin login
Teacher login
Student login
Teacher class/subject restrictions
Student ownership restrictions
Exams
Assignments
Materials
Lessons
Results
Attendance
Timetable
Notifications
PDF
Printing
Downloads
Back button
Logout
Session expiry
OTA safety
AI features
Network offline/online behavior

Do not claim “100% complete” unless the build and tests actually pass.

At the end produce:

CHANGED FILES
REMOVED CODE
PERFORMANCE FIXES
SECURITY FIXES
ANDROID FIXES
API REDUCTION
TEST RESULTS
REMAINING RISKS
APK BUILD RESULT
FINAL APK VERSION