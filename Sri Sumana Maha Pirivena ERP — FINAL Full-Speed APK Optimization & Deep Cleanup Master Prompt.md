# FINAL MASTER PROMPT
# SRI SUMANA MAHA PIRIVENA ERP
# FULL-SPEED APK OPTIMIZATION + DEEP CODE CLEANUP + ANDROID HARDENING

You are a senior production React/TypeScript/Vite engineer, Capacitor Android engineer, Android performance engineer, memory optimization engineer, API performance engineer, security engineer, and QA engineer.

You are working on the EXISTING real Sri Sumana Maha Pirivena ERP Android APK.



CURRENT ARCHITECTURE MUST REMAIN:

React + TypeScript + Vite
→ Centralized API client
→ PHP backend
→ MySQL

Android:

React/Vite
→ Capacitor
→ Android WebView/native bridge
→ PHP API
→ MySQL

========================================================
0. ABSOLUTE RULES
========================================================

DO NOT:

- create a new project
- rebuild the app from scratch
- replace the existing app with a demo
- replace the existing UI with unrelated UI
- remove working ERP modules
- remove business functionality without proving it obsolete
- create fake/demo users
- create fake/demo classes
- create fake/demo subjects
- use mock production API data
- use JSON as database
- use localStorage as database
- create SQLite as replacement for MySQL
- create another unrelated backend
- weaken authentication
- bypass authorization
- expose API keys
- break existing ERP rules
- break Sri Sumana Maha Pirivena branding
- claim success without testing

PRIMARY OBJECTIVE:

Make the EXISTING APK:

FAST
SMOOTH
LIGHT
LOW-MEMORY
LOW-CPU
LOW-BATTERY-IMPACT
RESPONSIVE
STABLE
SECURE
NATIVE-LIKE

without removing required functionality.

========================================================
1. FIRST STEP — AUDIT CURRENT REPOSITORY
========================================================

Before editing anything, inspect the repository completely.

Inspect:

- package.json
- package-lock.json
- vite.config.ts
- tsconfig.json
- capacitor.config.ts
- src/App.tsx
- src/api/*
- src/components/*
- src/context/*
- src/hooks/*
- src/services/*
- src/utils/*
- src/views/*
- AdminDashboard
- TeacherPortal
- StudentPortal
- PHP API
- php/schema.sql
- php/migrations/*
- android/*
- AndroidManifest.xml
- MainActivity.java
- Gradle files
- ProGuard/R8
- network security configuration
- FileProvider
- build scripts
- scripts/*
- public/*
- configuration files

Create an internal audit table:

FILE
PURPOSE
RUNTIME ROLE
PROBLEM
SEVERITY
ROOT CAUSE
FIX
TEST
RISK

Do not delete anything before verifying repository-wide references.

========================================================
2. PERFORMANCE BASELINE
========================================================

Measure BEFORE changes:

- APK size
- release APK size
- JS total size
- CSS size
- largest JS chunk
- largest CSS chunk
- cold startup time
- warm startup time
- login time
- dashboard first render
- initial API request count
- duplicate API requests
- RAM usage
- CPU usage where measurable
- tab switching responsiveness
- scrolling/jank
- background/resume behavior

After fixes create BEFORE vs AFTER measurements.

Never invent performance numbers.

========================================================
3. APP STARTUP OPTIMIZATION
========================================================

Audit:

`src/App.tsx`

Current app startup includes:

- auth restore
- notification initialization
- OneSignal
- Live OTA
- modal listeners
- navigation
- mobile enhancements
- splash handling

Separate critical and non-critical work.

CRITICAL:

- auth restore
- minimal session validation
- initial screen rendering

NON-CRITICAL:

- notification channels
- OneSignal initialization
- OTA checks
- optional prefetch
- background synchronization
- secondary services

The first usable UI MUST appear before non-critical work.

Do not block startup on:

- OTA
- push setup
- optional APIs
- secondary services

========================================================
4. App.tsx USER EFFECT FIX
========================================================

Audit the `useEffect` currently dependent on `[user]`.

Prevent:

- repeated notification initialization
- repeated notification permission request
- repeated OneSignal initialization
- repeated OTA initialization
- repeated OTA checks
- repeated logout calls
- repeated listeners
- repeated refreshes

Use:

ONE-TIME APP INITIALIZATION
+
SESSION-SPECIFIC USER SYNC

Do not use a whole object identity if only user ID matters.

Only call OneSignal `setUser()` when authenticated identity actually changes.

Only request notification permission when required and when permission has not already been handled.

========================================================
5. APP LIFECYCLE OPTIMIZATION
========================================================

Audit:

`src/services/appLifecycleManager.ts`

Current implementation uses:

- Capacitor appStateChange
- document visibilitychange
- window focus
- window blur

Make:

Capacitor native lifecycle = PRIMARY

Browser lifecycle = FALLBACK

Prevent duplicate lifecycle transitions.

Guarantees:

- one actual transition = one processing cycle
- no duplicated resume
- no duplicated background handling
- no duplicate API refresh
- no interval multiplication
- no timer leaks

Every polling task must:

- have at most one active timer
- not overlap with itself
- stop when unnecessary
- unregister cleanly
- stop on logout
- not run in background unless required

========================================================
6. REMOVE POLLING / LOOP WASTE
========================================================

Audit the whole project for:

- setInterval
- setTimeout
- recursive timers
- requestAnimationFrame loops
- polling loops
- retry loops
- refresh loops
- reconnect loops

For EVERY loop answer:

WHY?
WHO STARTS IT?
HOW OFTEN?
WHO STOPS IT?
CAN IT RUN TWICE?
CAN IT RUN IN BACKGROUND?

Replace unnecessary polling with:

- event-driven updates
- cache
- targeted refresh
- mutation invalidation
- manual refresh

Never allow duplicated timers.

========================================================
7. GLOBAL EVENT SYSTEM OPTIMIZATION
========================================================

Audit:

`src/context/SocketContext.tsx`

Current architecture uses BroadcastChannel and many global `CustomEvent` dispatches.

One database change currently can generate multiple global events.

Reduce event fan-out.

Create ONE canonical internal database-change event system.

Then notify only the affected subscribers/modules.

Example:

Student mutation
→ student subscribers

NOT:

student mutation
→ all dashboards
→ all portals
→ all lists
→ all modules

Prevent refresh storms.

========================================================
8. SOCKET CONTEXT CLEANUP
========================================================

Audit `SocketContext`.

If no actual socket connection exists, do not pretend:

`isConnected = true`

and:

`socket = null`

unless intentionally designed as a compatibility facade.

Either:

A) implement the real socket connection correctly

OR

B) simplify the provider to a clear realtime event bus

Do not keep fake socket state that causes unnecessary logic.

Preserve real-time functionality if currently required.

========================================================
9. BROADCASTCHANNEL OPTIMIZATION
========================================================

Guarantee:

- one BroadcastChannel instance
- created once
- closed correctly
- no duplicate channels
- no duplicate event handling
- no event feedback loops

Prevent:

BroadcastChannel
→ CustomEvent
→ refresh
→ mutation
→ BroadcastChannel

recursive cycles.

========================================================
10. API CLIENT PERFORMANCE
========================================================

Audit:

`src/api/apiClient.ts`

Keep:

- centralized API client
- in-flight GET deduplication
- proper auth
- timeout
- retry where safe

Improve:

- normalized dedupe key
- query parameters included
- identity context included where appropriate
- cancellation
- stale response prevention
- retry backoff
- timeout by operation

Normal GET timeout:

approximately 10–15 seconds

Large reports/uploads:

explicit longer timeout

Never blindly retry:

POST
PUT
PATCH
DELETE

unless explicitly idempotent and safe.

========================================================
11. DUPLICATE FETCH AUDIT
========================================================

Search all Admin/Teacher/Student components.

Find:

parent fetch
+
child fetch same data

Find:

multiple children calling same endpoint.

Replace with:

- shared fetch
- shared cache
- request dedupe
- targeted invalidation

Do not allow 5–10 requests for same dataset.

========================================================
12. DASHBOARD API OPTIMIZATION
========================================================

Dashboard must request ONLY visible/required information.

Do not download full:

- users
- students
- teachers
- attendance
- exams
- materials
- results

when only counts/summaries are required.

Use:

- server-side aggregation
- pagination
- filtering
- limited field selection

========================================================
13. CACHE OPTIMIZATION
========================================================

Audit:

`src/utils/dataCache.ts`

Keep useful memory caching.

Separate:

PUBLIC
AUTHENTICATED
SENSITIVE

Never cache:

- passwords
- tokens
- sensitive security data
- private backups

Private cache keys must include relevant:

- user ID
- role
- query
- class
- subject
- academic year

Mutation invalidation must be TARGETED.

Do not invalidate entire application for one small mutation.

========================================================
14. REACT RENDER OPTIMIZATION
========================================================

Audit:

- App.tsx
- AdminDashboard
- TeacherPortal
- StudentPortal
- large modals
- tables
- lists
- charts

Find:

- unnecessary re-renders
- unstable props
- unstable callbacks
- redundant state
- derived state
- excessive context updates
- expensive calculations
- repeated JSON.parse
- repeated localStorage reads
- state/effect loops

Use:

- React.memo
- useMemo
- useCallback
- context splitting

ONLY where beneficial.

Do not blindly memoize everything.

========================================================
15. ACTIVE TAB ONLY RENDERING
========================================================

Do not fully render every hidden portal tab.

Render expensive content only when active.

Lazy-load heavy views.

Prioritize:

- reports
- certificates
- file viewer
- AI
- advanced admin screens
- heavy charts

Keep the initial bundle small.

========================================================
16. LARGE LIST OPTIMIZATION
========================================================

For potentially large data:

- server pagination
- filtering
- sorting
- limited page sizes
- virtualization when necessary

Do not render thousands of DOM nodes.

Do not render hidden rows with CSS.

Filter before rendering.

========================================================
17. IMAGE OPTIMIZATION
========================================================

Audit all image usage.

Use:

- lazy loading
- explicit dimensions
- compressed assets
- thumbnails
- responsive sizing
- correct formats

Never load huge original images for small cards.

Remove only proven-unused assets.

========================================================
18. ANIMATION OPTIMIZATION
========================================================

Audit:

Motion
CSS animation
infinite effects
background animation
blur
heavy shadows

Reduce expensive effects on low-end devices.

Prefer:

transform
opacity

Respect:

`prefers-reduced-motion`

Do not sacrifice smoothness for visual effects.

========================================================
19. MOBILE KEYBOARD OPTIMIZATION
========================================================

Audit:

`useMobileNativeEnhancements.ts`

Current focus handler uses global `focusin` and smooth `scrollIntoView`.

Optimize so:

- already visible fields are not scrolled
- keyboard overlap is actually detected
- unnecessary smooth scrolling is avoided
- repeated focus events do not trigger excessive work
- listener is registered once

Use stable callbacks.

Avoid unnecessary effect re-registration caused by unstable function props.

========================================================
20. ANDROID BACK BUTTON
========================================================

Audit:

`useAndroidBackButton.ts`

`navigationHistoryManager.ts`

Create ONE authoritative back system.

Priority:

1. File viewer
2. modal
3. nested modal
4. subtab history
5. portal overview
6. exit confirmation

Remove unnecessary:

- DOM modal searching
- huge querySelectorAll selectors
- fake Escape key events
- duplicate event dispatch
- duplicated history logic

Use application state as source of truth.

Guarantee:

one physical Android back press
=
one logical action

No double handling.

No accidental app exit.

No protected page after logout.

========================================================
21. NOTIFICATION ARCHITECTURE
========================================================

Audit:

`notificationService.ts`

`oneSignalService.ts`

Use:

OneSignal = REMOTE PUSH

LocalNotifications = LOCAL/SCHEDULED

Prevent:

- duplicate notification
- duplicate sound
- duplicate vibration
- duplicate listeners
- duplicate permission requests
- repeated channels

Native Android should NOT load OneSignal Web SDK unnecessarily.

Initialize native push once.

========================================================
22. ONE SIGNAL USER SYNC
========================================================

Only call login/setUser/tag updates when identity actually changed.

Do not send redundant:

- user_id
- role
- name
- class data
- tags

on every React render.

Logout must safely remove old identity.

========================================================
23. LIVE OTA OPTIMIZATION
========================================================

Audit:

`liveUpdateService.ts`

Keep:

- active promise lock
- bundle comparison
- rollback safety

Improve:

- startup non-blocking
- cooldown
- one check at controlled times
- no repeated download
- no update while critical action is happening
- safe failure handling

Do not reload while:

- exam is being submitted
- form data is unsaved
- upload is running
- important workflow is active

========================================================
24. ANDROID WEBVIEW OPTIMIZATION
========================================================

Audit:

`MainActivity.java`

Current aggressive settings include:

- RenderPriority.HIGH
- OffscreenPreRaster
- forced hardware layer

Do NOT assume these automatically improve speed.

Benchmark on:

LOW-END
MID-RANGE
HIGH-END

Keep hardware acceleration unless a measured problem exists.

Remove unnecessary flags that increase:

- RAM
- GPU memory
- battery
- startup time

Do not use `largeHeap` as optimization.

========================================================
25. REMOVE android:largeHeap
========================================================

Audit:

`AndroidManifest.xml`

Remove:

`android:largeHeap="true"`

unless a measured, documented requirement proves it necessary.

Fix the underlying memory issue.

========================================================
26. ANDROID FILE PROVIDER HARDENING
========================================================

Audit:

`android/app/src/main/res/xml/file_paths.xml`

Do not expose broad filesystem paths unnecessarily.

Replace:

broad external path access

with narrow app-owned paths where possible.

Only expose directories actually needed for:

- PDF
- generated documents
- temporary files

========================================================
27. PDF MEMORY OPTIMIZATION
========================================================

Audit:

`AndroidPdfOpenerInterface`

Current Base64 flow can consume excessive RAM.

Preferred:

URL
→ download/cache
→ FileProvider URI
→ external PDF viewer

Base64 = fallback only.

Add:

- maximum PDF size
- safe filenames
- cache cleanup
- temporary file cleanup
- old-file expiry

Prevent large document crashes.

========================================================
28. DOWNLOAD MANAGER
========================================================

Prevent duplicate downloads caused by:

- double tap
- repeated requests
- same URL
- same filename

Use active download tracking.

Sanitize filenames.

Handle invalid/missing MIME safely.

========================================================
29. ANDROID PERMISSIONS
========================================================

Audit all permissions.

For each ask:

IS THIS ACTUALLY USED?

Review:

CAMERA
POST_NOTIFICATIONS
READ_MEDIA_IMAGES
READ_MEDIA_VIDEO
READ_MEDIA_AUDIO
READ_EXTERNAL_STORAGE
WRITE_EXTERNAL_STORAGE
VIBRATE

Remove unused permissions.

Request dangerous permission only when the feature needs it.

Do not request all permissions during initial launch.

========================================================
30. ANDROID BACKUP
========================================================

Audit:

`android:allowBackup`

Ensure sensitive ERP session/user data is not unintentionally restored from Android backup.

Configure backup policy explicitly.

========================================================
31. NETWORK SECURITY
========================================================

Production API communication MUST remain HTTPS.

Do not enable global cleartext traffic.

Keep localhost development exceptions only when required.

Do not weaken certificate validation.

========================================================
32. CAPACITOR CONFIGURATION
========================================================

Audit:

`capacitor.config.ts`

Keep production local `dist` loading.

Review broad navigation wildcards.

Allow only required domains.

Avoid unnecessary external navigation.

Do not add remote production WebView URL when APK should use packaged assets.

========================================================
33. RELEASE BUILD OPTIMIZATION
========================================================

Audit:

`android/app/build.gradle`

Current release configuration must be optimized.

Evaluate:

- minifyEnabled
- shrinkResources
- R8
- ProGuard
- resource optimization

Enable release optimization only after verifying:

- Capacitor
- OneSignal
- notifications
- PDF
- printing
- FileProvider
- OTA

still work.

========================================================
34. VITE BUNDLE OPTIMIZATION
========================================================

Audit:

`vite.config.ts`

Keep code splitting.

Review manual chunks.

Prevent giant bundles.

Important:

Do not ship server-only modules into browser runtime.

Check whether these are accidentally included:

- express
- mysql2
- multer
- adm-zip
- dotenv
- backend utilities

========================================================
35. NPM DEPENDENCY CLEANUP
========================================================

Classify every package:

FRONTEND RUNTIME
BUILD TOOL
SCRIPT ONLY
BACKEND ONLY
UNUSED

Potential backend/build packages must not become APK runtime dependencies unless genuinely required.

Check all imports before removal.

After cleanup:

npm install
npm run build
npm run lint

========================================================
36. DEAD CODE CLEANUP
========================================================

Find:

- unused imports
- unused exports
- unused components
- unused hooks
- unused services
- unused utils
- duplicate constants
- obsolete branches
- duplicate CSS
- unused assets
- unused dependencies
- dev-only runtime leakage

Only remove code after repository-wide reference verification.

========================================================
37. MEMORY LEAK AUDIT
========================================================

Search every:

addEventListener
setInterval
setTimeout
ResizeObserver
MutationObserver
IntersectionObserver
Capacitor listener
OneSignal listener
Socket listener
BroadcastChannel
subscription

Every resource must have proper cleanup.

Singletons must not register listeners repeatedly.

========================================================
38. ASYNC RACE CONDITION FIX
========================================================

Prevent:

old request
→ returns late
→ overwrites newer state

Use:

AbortController
request IDs
latest-response-wins
proper cancellation

Do not allow stale API responses to overwrite fresh data.

========================================================
39. OFFLINE PERFORMANCE
========================================================

When offline:

- stop unnecessary retries
- avoid polling
- avoid API request storms
- show network state
- safely use cached data where appropriate

When online returns:

- trigger controlled refresh
- do not refresh every dataset multiple times

========================================================
40. AUTH / SECURITY MUST STAY INTACT
========================================================

Never optimize by bypassing security.

Keep:

authentication
authorization
PHP role guards
teacher assignment enforcement
student ownership enforcement

`teacher_assignments` remains authoritative.

Teacher:

10A + Math
11B + Science

must NOT access:

10A + Science
11B + Math

Authenticated student identity remains authoritative.

Student A must never access Student B protected data.

========================================================
41. LOGOUT CLEANUP
========================================================

On logout:

- stop background tasks
- clear protected cache
- clear user-specific state
- clear notification identity
- stop user-specific realtime updates
- clear navigation history
- prevent returning to private pages
- cancel sensitive pending operations where appropriate

========================================================
42. NO MOCK DATA
========================================================

Never introduce fake production data.

No:

mock students
mock teachers
mock exams
mock results
mock attendance
mock timetable
mock notifications

Production data remains:

PHP API
+
MySQL

========================================================
43. PRESERVE ALL ERP MODULES
========================================================

Do not remove:

- Admin
- Teacher
- Student
- Exams
- Materials
- Lessons
- Assignments
- Submissions
- Results
- Attendance
- Notifications
- Timetable
- Certificates
- Reports
- Admissions
- Library
- Gallery
- News
- Events
- Downloads
- Donations
- Website Management
- Audit Logs
- Backup
- Settings

========================================================
44. TESTING
========================================================

After changes run:

npm install
npm run build
npm run lint

Then Android:

Gradle release build
Gradle debug build

Test:

LOGIN
LOGOUT
ADMIN
TEACHER
STUDENT
BACK BUTTON
MODALS
TABS
NOTIFICATIONS
ONESIGNAL
LOCAL NOTIFICATIONS
PDF
DOWNLOAD
PRINT
FILE VIEWER
OTA
OFFLINE
ONLINE RECOVERY

========================================================
45. PERFORMANCE REGRESSION TEST
========================================================

Test:

cold start
warm start
login
dashboard
tab switching
large list
scrolling
modal open/close
background
foreground
logout/login repeatedly
notification click
PDF open
download

Check:

NO LOOP
NO TIMER MULTIPLICATION
NO LISTENER MULTIPLICATION
NO API REQUEST STORM
NO MEMORY LEAK
NO CRASH

========================================================
46. LOW-END ANDROID TESTING
========================================================

Do not validate only on flagship devices.

Test low-end Android.

Measure:

startup
scrolling
memory
CPU
keyboard
navigation
large lists
images
PDF
notifications
background/resume

========================================================
47. BUILD SIZE OPTIMIZATION
========================================================

After changes compare:

BEFORE APK SIZE
AFTER APK SIZE

BEFORE JS SIZE
AFTER JS SIZE

BEFORE INITIAL CHUNK
AFTER INITIAL CHUNK

BEFORE API REQUEST COUNT
AFTER API REQUEST COUNT

Do not fabricate results.

========================================================
48. FINAL CLEANUP RULE
========================================================

Do NOT add complexity merely to "optimize".

Optimization means:

REMOVE unnecessary work.

REMOVE duplicate work.

REDUCE rendering.

REDUCE network requests.

REDUCE timers.

REDUCE listeners.

REDUCE memory usage.

REDUCE startup work.

REDUCE bundle size.

REDUCE background activity.

LOAD ONLY WHAT IS NEEDED.

FETCH ONLY WHAT IS NEEDED.

RENDER ONLY WHAT IS NEEDED.

========================================================
49. FINAL REPORT
========================================================

At completion report:

1. Files changed
2. Files removed
3. Dependencies removed
4. Duplicate code removed
5. Loops/timers removed
6. Event listeners optimized
7. API duplicates fixed
8. Cache optimized
9. React render bottlenecks fixed
10. Android changes
11. WebView changes
12. PDF memory changes
13. Notification changes
14. OTA changes
15. APK size before/after
16. Bundle size before/after
17. Startup performance before/after
18. API request count before/after
19. Memory observations
20. Build results
21. Test results
22. Remaining issues
23. Risks

Never claim "100% optimized" unless actual verification proves it.

========================================================
50. FINAL SUCCESS CONDITION
========================================================

The FINAL APK must remain the SAME Sri Sumana Maha Pirivena ERP application.

It must:

- start quickly
- respond quickly
- scroll smoothly
- switch tabs quickly
- use minimal unnecessary RAM
- minimize background CPU
- avoid duplicate requests
- avoid loops
- avoid listener storms
- avoid memory leaks
- avoid duplicate notifications
- handle Android back correctly
- handle PDF safely
- handle downloads correctly
- remain secure
- keep all ERP functionality

DO NOT trade security for speed.

DO NOT trade functionality for speed.

DO NOT trade data integrity for speed.

OPTIMIZE THE EXISTING APPLICATION, DO NOT REPLACE IT.