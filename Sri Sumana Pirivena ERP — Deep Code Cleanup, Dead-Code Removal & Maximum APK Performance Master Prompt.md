# MASTER PROMPT
# DEEP CODE AUDIT → DEAD CODE REMOVAL → DUPLICATE CODE CLEANUP → LOOP FIX → MEMORY/CPU/API OPTIMIZATION → FAST APK



This is the EXISTING real Sri Sumana Maha Pirivena ERP + Android APK.

==================================================
ABSOLUTE RULES
==================================================

DO NOT rebuild the project.

DO NOT create a new project.

DO NOT replace the ERP architecture with a demo.

DO NOT replace MySQL with local JSON.

DO NOT replace real API data with mock data.

DO NOT delete working features.

DO NOT remove code merely because it “looks old”.

DO NOT remove files merely because they are large.

DO NOT remove dependencies merely because they are not imported from the obvious entry file.

DO NOT rewrite working modules unnecessarily.

DO NOT change business rules.

DO NOT change authentication behavior except for a proven security/performance bug.

DO NOT change teacher/student authorization rules.

DO NOT break:
- Admin
- Teacher
- Student
- Exams
- Results
- Attendance
- Timetable
- Materials
- Lessons
- Assignments
- Submissions
- Library
- Notifications
- Chat
- Certificates
- Admissions
- Reports
- Settings
- Backup
- public website/content

The objective is:

SAME APP
+
SAME FEATURES
+
SAME DATA
+
SAME BACKEND
-
DEAD CODE
-
DUPLICATION
-
UNNECESSARY WORK
-
MEMORY LEAKS
-
REQUEST LOOPS
-
RENDER LOOPS
-
UNUSED DEPENDENCIES
-
UNUSED ASSETS
-
EXCESSIVE POLLING
-
EXCESSIVE EVENT DISPATCH
=
FASTER AND LIGHTER APK

==================================================
PHASE 0 — CREATE BASELINE BEFORE CHANGES
==================================================

Before touching code, record:

- current git commit
- package.json
- package-lock.json
- bundle size
- largest JS chunks
- largest CSS
- largest images/assets
- number of source files
- Android APK size if build artifact exists
- initial load behavior
- dashboard load behavior
- API request count on login
- API request count on dashboard
- tab-switch API count
- notification initialization count
- polling task count
- memory-heavy components
- largest source files

Do NOT invent performance numbers.

Only record values that can actually be measured.

==================================================
PHASE 1 — BUILD A COMPLETE DEPENDENCY GRAPH
==================================================

Build an import/dependency graph for:

src/
android/
scripts/
php/

Identify:

ENTRY POINTS
DIRECT IMPORTS
INDIRECT IMPORTS
DYNAMIC IMPORTS
UNUSED FILES
ORPHAN FILES
UNUSED EXPORTS
UNUSED FUNCTIONS
UNUSED TYPES
UNUSED CONSTANTS
UNUSED CSS CLASSES
UNUSED ASSETS
UNUSED NPM DEPENDENCIES

IMPORTANT:

A file is removable ONLY when you verify it is not required by:
- static import
- dynamic import
- route
- Capacitor
- HTML
- native Android
- build script
- runtime reflection
- backend routing
- configuration
- plugin initialization
- generated file process

Generate a report:

FILE
USED? YES/NO
WHO USES IT?
SAFE TO REMOVE?
REASON

==================================================
PHASE 2 — DEAD FILE REMOVAL
==================================================

Find genuinely unused:

- .ts
- .tsx
- .js
- .jsx
- .css
- .html
- assets
- services
- hooks
- components
- modal files
- old utility files
- old API wrappers

Do not delete anything until verified.

For every deletion:
1. Search all references
2. Search dynamic imports
3. Search configuration references
4. Search scripts
5. Search native references
6. Remove only after confirmation

==================================================
PHASE 3 — UNUSED DEPENDENCY AUDIT
==================================================

Audit every dependency in package.json.

Classify:

RUNTIME REQUIRED
BUILD REQUIRED
DEV ONLY
LEGACY
UNUSED
DUPLICATE CAPABILITY

Pay special attention to packages such as:

express
mysql2
multer
socket.io
socket.io-client
adm-zip
bcryptjs
dotenv
@google/genai
@capgo/capacitor-updater
onesignal-cordova-plugin
motion
lucide-react

DO NOT remove server-side/build dependencies blindly.

Determine whether each dependency is:
- bundled into APK
- server only
- build only
- dev only

The Android APK should not contain unnecessary Node/server runtime logic.

==================================================
PHASE 4 — FRONTEND RENDER LOOP AUDIT
==================================================

Inspect every:

useEffect
useMemo
useCallback
useState
useReducer
useRef
event listener
observer
timer

Find:

effect → setState → dependency change → effect

API → state → rerender → API

event → refresh → event

context update → all portals rerender

parent state → child state → parent state

Find both direct and indirect loops.

For every effect verify:
- dependency array
- cleanup
- stale closure risk
- duplicate execution
- StrictMode behavior
- async cancellation
- race conditions

Do not suppress ESLint rules just to hide an effect problem.

==================================================
PHASE 5 — TIMER / INTERVAL / TIMEOUT AUDIT
==================================================

Search ALL code for:

setInterval
setTimeout
requestAnimationFrame
setImmediate
recursive async polling
poll loops

For each timer:

WHERE CREATED?
WHY?
HOW OFTEN?
WHO CLEARS IT?
WHAT HAPPENS ON UNMOUNT?
WHAT HAPPENS ON LOGOUT?
WHAT HAPPENS ON BACKGROUND?
WHAT HAPPENS ON RESUME?

No timer may remain active when it is no longer needed.

==================================================
PHASE 6 — APP LIFECYCLE MANAGER
==================================================

Audit:

`src/services/appLifecycleManager.ts`

Current architecture listens to:
- Capacitor appStateChange
- document visibilitychange
- window focus
- window blur

These can overlap.

Ensure one logical foreground/background transition does not cause repeated:
- pause
- resume
- refresh
- API request
- polling execution

Use a normalized state machine.

Requirements:

BACKGROUND:
pause unnecessary tasks

FOREGROUND:
resume required tasks

RESUME:
do not blindly refresh everything

Only refresh data that actually became stale.

Every listener must have a cleanup strategy where appropriate.

Do not allow duplicate lifecycle registration.

==================================================
PHASE 7 — POLLING OPTIMIZATION
==================================================

Audit every poll task registered in the app.

Create table:

TASK ID
OWNER
INTERVAL
BACKGROUND INTERVAL
API ENDPOINT
PURPOSE
CAN BE EVENT-DRIVEN?
CURRENT COST

Replace polling with event-driven refresh where practical.

Do not poll every 1–5 seconds for normal ERP data.

Use:
- longer interval
- foreground-only polling
- targeted refresh
- user-triggered refresh
- push notifications
- server events

Never poll the entire dashboard just to detect one small change.

==================================================
PHASE 8 — API REQUEST LOOP AUDIT
==================================================

Audit all API requests.

Find:
- same endpoint called multiple times
- same GET from multiple components
- duplicate requests on mount
- duplicate requests after tab changes
- duplicate requests after events
- repeated retries
- retry storms
- requests after logout
- requests from hidden/unmounted screens

Centralize shared reads.

Use request deduplication.

Use cache where safe.

Cancel obsolete requests where practical.

DO NOT hide server failures.

==================================================
PHASE 9 — API CACHE AUDIT
==================================================

Current application has in-memory data caching.

Audit:

`src/utils/dataCache.ts`

Ensure:
- cache keys are correct
- private data is user-specific
- cache invalidates correctly
- stale data isn't presented indefinitely
- mutations invalidate related reads
- logout clears protected cache
- role changes clear protected cache

Do not cache:
- passwords
- tokens
- private backups
- secrets

Optimize TTL based on actual data volatility.

==================================================
PHASE 10 — API CLIENT OPTIMIZATION
==================================================

Audit:

`src/api/apiClient.ts`

Check:
- duplicate GET dedupe
- retries
- timeout
- abort controller
- headers
- auth headers
- response parsing
- unnecessary JSON parsing
- request body serialization
- retry delays
- 401 handling

Avoid excessive retries.

Suggested principle:

User interaction request:
minimum retry

Background request:
low/no retry

Critical mutation:
careful retry only if idempotent

Do not retry non-idempotent POST blindly.

==================================================
PHASE 11 — CONTEXT PERFORMANCE
==================================================

Inspect global React contexts:

Auth
Theme
Language
Settings
Notifications
other providers

Find contexts causing the entire application to rerender when one small value changes.

Split contexts where useful.

Do not keep rapidly changing values in global context unnecessarily.

==================================================
PHASE 12 — HUGE COMPONENT AUDIT
==================================================

Identify very large files.

Current project contains very large portal/tab/modal files.

Prioritize:

AdminDashboard
TeacherPortal
StudentPortal
SettingsTab
OverviewTab
large exam modals
large forms

Split only where it improves:
- code ownership
- render isolation
- lazy loading
- maintainability

Avoid creating dozens of meaningless tiny files.

Share business logic.

Do not duplicate business logic during refactor.

==================================================
PHASE 13 — LAZY LOAD HEAVY FEATURES
==================================================

Features that are not needed at initial startup should not load immediately.

Candidates:

- Admin-only modules
- Teacher-only modules
- Student-only modules
- Reports
- Charts
- Exam creation tools
- AI tools
- PDF/printing helpers
- Large modals
- Backup UI
- Admissions detail
- advanced settings
- gallery/library heavy views

Use dynamic imports where safe.

Do not lazy-load the login screen or essential first-render code.

==================================================
PHASE 14 — MODAL PERFORMANCE
==================================================

Do not mount every modal permanently.

Bad:

all modals mounted
display:none

Preferred:

mount modal only when opened

Unmount when closed unless state preservation is genuinely needed.

Inspect modal stacks and event listeners.

==================================================
PHASE 15 — NAVIGATION HISTORY MANAGER
==================================================

Audit:

`src/services/navigationHistoryManager.ts`

Current back handling:
- modal stack
- DOM query
- custom event
- synthetic Escape
- tab history
- localStorage lookup
- exit modal

Simplify the flow.

Do not repeatedly scan the entire DOM for every back press if application state already knows the active modal.

Avoid:
custom event → another custom event → navigation state update → another event

Back press should perform ONE predictable action.

==================================================
PHASE 16 — CUSTOM EVENT AUDIT
==================================================

List every:

window.dispatchEvent(new CustomEvent(...))

and every:

addEventListener(...)

Create matrix:

EVENT
SOURCE
LISTENERS
PURPOSE
FREQUENCY
CAN DUPLICATE?
CAN REPLACE WITH DIRECT STATE UPDATE?

Look specifically for refresh storms.

One mutation should NOT cause:

10 events
→ 20 API requests
→ multiple rerenders

Use targeted invalidation.

==================================================
PHASE 17 — BROADCASTCHANNEL AUDIT
==================================================

Audit all BroadcastChannel usage.

Ensure channels:
- are created only when needed
- are closed
- don't cause feedback loops
- don't duplicate local events
- don't create self-triggered refresh storms

Do not open a BroadcastChannel for every small operation.

==================================================
PHASE 18 — NOTIFICATION ARCHITECTURE
==================================================

Audit:

notificationService.ts

oneSignalService.ts

Determine exact responsibility of each.

Prevent duplicate:
- initialization
- listeners
- login
- logout
- push registration
- foreground handling
- click handling

Mobile push should primarily use OneSignal where appropriate.

Local notifications should be reserved for actual local use cases.

Never send notification feedback:
- sound
- vibration
- push
twice for the same event.

==================================================
PHASE 19 — ONESIGNAL INITIALIZATION
==================================================

Ensure OneSignal initializes only once.

Do not dynamically initialize web SDK inside native APK unless genuinely needed.

Native APK should not load unnecessary web-push resources.

Do not request notification permission repeatedly.

Do not send unnecessary tags repeatedly.

==================================================
PHASE 20 — LIVE UPDATE OPTIMIZATION
==================================================

Audit:

`src/services/liveUpdateService.ts`

Requirements:
- initialize once
- listen once
- check only when needed
- no repeated site-settings requests
- no duplicate OTA downloads
- no repeated reload
- no update loop
- safe failure handling

Live update must never slow normal app startup significantly.

Do not automatically check OTA on every screen.

Check at controlled lifecycle points.

==================================================
PHASE 21 — CSS DEAD CODE
==================================================

Audit entire CSS/Tailwind system.

Find:
- duplicate selectors
- duplicate utilities
- conflicting definitions
- unused classes
- unnecessary !important
- repeated safe-area rules
- repeated typography rules
- repeated theme rules
- repeated touch-target definitions
- duplicated mobile breakpoints

Current CSS contains repeated mobile utility definitions.

Consolidate them.

Do NOT alter visual appearance unintentionally.

==================================================
PHASE 22 — CSS PERFORMANCE
==================================================

Reduce expensive CSS where possible.

Audit:
- backdrop-filter
- blur
- huge shadows
- excessive animations
- continuous transitions
- will-change
- transform promotion
- content-visibility
- complex selectors

Do not add:

will-change: transform

to everything.

Do not force GPU layers on every element.

Use paint optimization only where measured/useful.

==================================================
PHASE 23 — ANIMATION AUDIT
==================================================

Inspect Motion animations and CSS animations.

Find:
- infinite animations
- animation on every list row
- unnecessary mount animations
- expensive transforms
- large blur transitions

Honor reduced-motion preference where appropriate.

Low-end Android must stay smooth.

==================================================
PHASE 24 — IMAGE / MEDIA AUDIT
==================================================

Find largest:
- PNG
- JPEG
- WebP
- splash assets
- icons
- background images

Find duplicates.

Compress where appropriate.

Do not reduce image quality below usable quality.

Use:
- thumbnails
- responsive images
- lazy loading

for large content.

==================================================
PHASE 25 — SPLASH ASSET AUDIT
==================================================

Current Android project contains multiple density-specific splash images.

Verify whether all are actually necessary.

Do not ship duplicate oversized splash resources unnecessarily.

Generate optimized assets from one source where possible.

Keep Android launch quality high.

==================================================
PHASE 26 — APK ASSET AUDIT
==================================================

Inspect assets packaged into:

dist/
Android assets/resources

Remove only verified unused files.

Check:
- logos
- icons
- screenshots
- old exports
- temporary files
- backups
- test assets
- duplicate images

==================================================
PHASE 27 — JS BUNDLE AUDIT
==================================================

Run production Vite build.

Inspect all generated chunks.

Find largest contributors.

Look for:
- accidentally bundled server code
- large libraries
- duplicate libraries
- multiple versions
- unnecessary AI SDK code
- chart libraries
- PDF libraries
- ZIP libraries
- dev tooling

Move server-only functionality out of client bundle.

==================================================
PHASE 28 — NODE SERVER CODE
==================================================

Inspect:

dev.cjs
scripts/
express
mysql2
multer
socket.io
adm-zip
dotenv

Separate:

SERVER/BUILD-ONLY

from:

MOBILE RUNTIME

The APK must not contain unnecessary Node server runtime logic.

Do not remove PHP backend functionality.

Do not remove build tools required to create APK.

==================================================
PHASE 29 — AI BUNDLE AUDIT
==================================================

The APK should not contain secret AI API keys.

Audit AI-related code.

Prefer:

APK
 ↓
PHP `/api/ai/*`
 ↓
provider

Do not ship unnecessary provider SDK code into the mobile bundle when a backend API already exists.

==================================================
PHASE 30 — MEMORY LEAK AUDIT
==================================================

Find all subscriptions:

- addEventListener
- Capacitor addListener
- ResizeObserver
- IntersectionObserver
- MutationObserver
- BroadcastChannel
- WebSocket
- Socket.IO
- timers
- notification listeners

Every component-level subscription must have cleanup.

For global singleton listeners:
prove they are intentionally lifetime-scoped.

==================================================
PHASE 31 — SOCKET / REALTIME AUDIT
==================================================

Inspect Socket.IO usage.

Determine:
- is it actually used in production?
- where initialized?
- how often?
- reconnect behavior?
- duplicate connections?
- duplicate listeners?
- disconnect cleanup?

Never create a second socket for every component mount.

If socket.io is not required, remove client package and code only after verifying all features.

==================================================
PHASE 32 — LARGE DATASET RENDERING
==================================================

Find large arrays:

students
teachers
materials
library
notifications
chat messages
results
attendance
exam questions

Avoid rendering thousands of DOM nodes at once.

Use:
- pagination
- virtualization
- incremental rendering
- server filtering

Do not fetch entire database tables to display 20 rows.

==================================================
PHASE 33 — N+1 FRONTEND REQUEST AUDIT
==================================================

Detect patterns:

students map
→ API request per student

subjects map
→ API request per subject

cards map
→ API request per card

This must be eliminated.

Use batch APIs where appropriate.

==================================================
PHASE 34 — N+1 PHP / SQL AUDIT
==================================================

Inspect backend endpoints for:

loop
→ SQL query
→ loop
→ SQL query

Replace with efficient:
- joins
- batch queries
- aggregate queries

where behavior remains equivalent.

Add indexes for common filters and joins.

==================================================
PHASE 35 — DATABASE QUERY AUDIT
==================================================

Find:
SELECT *

where unnecessary.

Find:
full-table scans
unindexed filters
unindexed joins
repeated queries
duplicate COUNT queries
same user lookup repeated

Optimize carefully.

Do not alter schema destructively.

Use migrations for schema changes.

==================================================
PHASE 36 — TEACHER AUTHORIZATION PERFORMANCE
==================================================

Teacher authorization must remain based on exact:

teacher
+
class
+
subject
+
section
+
academic year

Do not weaken authorization for speed.

Use efficient indexed queries instead.

==================================================
PHASE 37 — STUDENT OWNERSHIP PERFORMANCE
==================================================

Student ownership must remain authenticated-user based.

Do not make security weaker to reduce query count.

Use efficient joins/indexes.

==================================================
PHASE 38 — LOCAL STORAGE AUDIT
==================================================

Search localStorage/sessionStorage usage.

Allowed:
- harmless UI preferences
- theme
- text size
- non-sensitive settings

Do not store:
- passwords
- secret API keys
- sensitive account data unnecessarily
- unencrypted security tokens where secure storage is practical

Do not use localStorage as a replacement database.

==================================================
PHASE 39 — REACT KEYS / LIST AUDIT
==================================================

Find:
- missing keys
- unstable keys
- array-index keys where bad
- duplicate keys

Fix rendering instability.

==================================================
PHASE 40 — ASYNC RACE CONDITIONS
==================================================

Find:

request A starts
request B starts
B finishes first
A finishes later
A overwrites newer state

Fix with:
- AbortController
- request IDs
- mounted guards
- stale-response checks

Especially important for:
search
tabs
filters
dashboard
exams
materials

==================================================
PHASE 41 — SEARCH PERFORMANCE
==================================================

Search input must not issue an API request for every keystroke.

Use sensible debounce.

Cancel obsolete requests.

Keep local search local when dataset is already safely loaded.

==================================================
PHASE 42 — FILTER PERFORMANCE
==================================================

Do not re-fetch the complete dataset for every filter change.

Use:
- server query parameters
- local filtering for small datasets
- debounced remote filters where appropriate

==================================================
PHASE 43 — FORM PERFORMANCE
==================================================

Large forms should not rerender every field on every keystroke unnecessarily.

Use appropriate form state partitioning.

Avoid giant controlled forms where not needed.

==================================================
PHASE 44 — TABLE PERFORMANCE
==================================================

Admin/teacher tables should:
- paginate
- filter efficiently
- avoid rendering thousands of rows
- avoid recalculating entire datasets on every render

==================================================
PHASE 45 — CHAT PERFORMANCE
==================================================

Chat must not load the entire message history every time.

Use:
- pagination
- incremental history
- message windowing if necessary
- efficient polling/socket updates

Prevent duplicate incoming messages.

==================================================
PHASE 46 — EXAM PERFORMANCE
==================================================

Exam UI must not rerender every question when one answer changes.

Keep answer state efficient.

Prevent timer from rerendering the entire exam each second.

Timer should update only the necessary UI.

==================================================
PHASE 47 — DASHBOARD PERFORMANCE
==================================================

Dashboard should not fetch every module just because dashboard mounted.

Identify:
critical above-the-fold data

and:
secondary data

Load critical data first.

Lazy-load secondary modules.

==================================================
PHASE 48 — ADMIN PERFORMANCE
==================================================

Do not preload every admin tab.

Load:
Overview first.

Load advanced tab data when selected.

Do not keep all heavy admin modals mounted.

==================================================
PHASE 49 — TEACHER PERFORMANCE
==================================================

Do not preload:
- all students
- all exams
- all materials
- all reports
- all settings
simply because TeacherPortal mounted.

Load relevant data per active section.

==================================================
PHASE 50 — STUDENT PERFORMANCE
==================================================

Same principle.

Do not download every:
lesson
material
exam
result
notification
library record

on initial login.

Prioritize the visible screen.

==================================================
PHASE 51 — ANDROID WEBVIEW AUDIT
==================================================

Inspect:

`android/app/src/main/java/lk/srisumana/erp/MainActivity.java`

and manifest.

Review:
- cache
- DOM storage
- database
- hardware acceleration
- render flags
- pre-raster
- layer type
- file access
- download listener
- JS bridges

Do not enable performance flags blindly.

Remove settings that provide no measurable benefit.

Do not use `largeHeap` as a performance trick.

==================================================
PHASE 52 — NATIVE BRIDGE AUDIT
==================================================

Audit JavaScript interfaces:

AndroidPrinter
AndroidPdfOpener
other bridges

Verify:
- only necessary methods exposed
- safe inputs
- no unnecessary bridge calls
- no repeated registrations
- no memory leak

==================================================
PHASE 53 — PERMISSION AUDIT
==================================================

Remove Android permissions not required by actual features.

Avoid requesting permission at startup when it is only needed later.

Do not request camera/media access until required.

==================================================
PHASE 54 — DOWNLOAD PERFORMANCE
==================================================

Audit file downloading.

Prevent:
- duplicate downloads
- accidental multiple DownloadManager jobs
- repeated taps
- huge memory buffering
- unnecessary base64 conversion

For large PDFs/files:
prefer streaming/file download patterns over giant base64 payloads when possible.

==================================================
PHASE 55 — BASE64 MEMORY AUDIT
==================================================

Search for:
atob
btoa
base64
data:application/pdf
data:image
large JSON blobs

Base64 can multiply memory usage.

Avoid loading huge files completely into JS memory where possible.

==================================================
PHASE 56 — PDF PERFORMANCE
==================================================

Avoid:

large PDF
→ base64
→ JS string
→ JS byte array
→ native file

when direct file download/open can be used.

Keep existing behavior intact.

==================================================
PHASE 57 — BUILD OPTIMIZATION
==================================================

Production build must use:
- tree shaking
- minification
- code splitting
- dead code elimination
- optimized assets

Inspect actual build output.

Do not increase chunk count unnecessarily.

==================================================
PHASE 58 — REMOVE DEV-ONLY CODE FROM PRODUCTION
==================================================

Find:

console.log
debug logging
development-only UI
test buttons
temporary debug flags
development URLs
dev-only diagnostics

Remove or gate them appropriately.

Do not remove useful production error logging.

==================================================
PHASE 59 — CONSOLE LOG AUDIT
==================================================

Search all:

console.log
console.warn
console.error

Classify:

KEEP
REMOVE
CONDITIONALLY ENABLE

Do not log:
- passwords
- tokens
- private user data
- API secrets

Excessive console logging can slow large applications and clutter production debugging.

==================================================
PHASE 60 — ERROR HANDLING AUDIT
==================================================

Find empty catch blocks.

Do not silently swallow:
- authentication errors
- API errors
- security errors
- upload errors
- database errors

Handle errors intentionally.

==================================================
PHASE 61 — DUPLICATE BUSINESS LOGIC
==================================================

Find repeated implementations of:
- formatting
- authorization
- validation
- API calls
- date formatting
- notifications
- cache invalidation
- modal handling
- navigation

Keep one canonical implementation where practical.

==================================================
PHASE 62 — DUPLICATE TYPES
==================================================

Audit interfaces for duplicate concepts.

Do not create:
UserA
UserRecord
UserData
UserModel
UserInfo

all representing the same thing without reason.

Consolidate carefully.

==================================================
PHASE 63 — DUPLICATE CSS
==================================================

Specifically audit:

safe-area utilities
touch target
screen height utilities
dark mode rules
buttons
cards
menu icons
mobile breakpoints
text scaling

Keep one canonical rule.

==================================================
PHASE 64 — DUPLICATE API WRAPPERS
==================================================

Audit all:

src/api/*

Ensure one endpoint is not wrapped 3 different ways unnecessarily.

Keep:
centralized API client
feature-level API modules

Remove accidental duplication.

==================================================
PHASE 65 — UNUSED EXPORTS
==================================================

Find exported:
- functions
- constants
- types
- classes

that have no consumer.

Remove only verified dead exports.

==================================================
PHASE 66 — UNUSED PROPS
==================================================

Audit major components and modals.

Find props passed but never used.

Remove unused props carefully.

Do not break parent-child contracts.

==================================================
PHASE 67 — UNUSED STATE
==================================================

Find:
useState values
that are never read.

Remove them.

Find state duplicated in:
parent + child.

Consolidate when safe.

==================================================
PHASE 68 — REDUNDANT STATE
==================================================

Do not store derived values as independent state when they can be derived cheaply.

Example:

items
+ filter
→ filteredItems

Do not maintain both unless required for performance.

==================================================
PHASE 69 — REDUNDANT EFFECTS
==================================================

Do not use useEffect to derive simple values that can be computed during render.

Use effects only for side effects.

==================================================
PHASE 70 — REDUNDANT MEMOIZATION
==================================================

Remove useless:
useMemo
useCallback
memo

when they provide no meaningful benefit.

Do not optimize by complexity alone.

==================================================
PHASE 71 — RECURSIVE REFRESH AUDIT
==================================================

Specifically trace:

mutation
→ invalidate cache
→ dispatch events
→ listeners
→ API fetch
→ setState
→ mutation/event

Break any cycle that does not have a necessary termination condition.

==================================================
PHASE 72 — DATA REFRESH POLICY
==================================================

Define:

MANUAL REFRESH
FOREGROUND REFRESH
MUTATION INVALIDATION
PUSH-TRIGGERED REFRESH
BACKGROUND REFRESH

Avoid refreshing the same data through all five mechanisms simultaneously.

==================================================
PHASE 73 — MEMORY CACHE SIZE
==================================================

Audit cache limits.

Prevent unbounded:
- arrays
- maps
- notifications
- messages
- images
- blobs
- data URLs

Use bounded caches where appropriate.

==================================================
PHASE 74 — OBJECT / ARRAY ALLOCATION
==================================================

Find hot render paths creating:
- new arrays
- new objects
- new callbacks
- new regexes
- repeated formatting

every render.

Optimize only measured hot paths.

==================================================
PHASE 75 — DATABASE CONNECTION / PHP PERFORMANCE
==================================================

Ensure PHP API:
- does not open unnecessary repeated DB connections
- uses prepared statements
- avoids repeated schema checks
- does not modify schema during normal requests
- uses indexes
- returns only needed records

==================================================
PHASE 76 — BACKEND RUNTIME DDL
==================================================

No normal endpoint should perform:

CREATE TABLE
ALTER TABLE
DROP TABLE

at runtime.

All schema changes belong in migrations.

==================================================
PHASE 77 — SECURITY MUST NOT BE SACRIFICED
==================================================

Do NOT optimize by:
- removing authorization
- removing password hashing
- bypassing ownership checks
- trusting client IDs
- caching private data globally
- removing token validation
- disabling HTTPS
- allowing unrestricted navigation

Performance improvements must preserve security.

==================================================
PHASE 78 — TEACHER RBAC MUST REMAIN EXACT
==================================================

Exact assignment:

teacher
+
class
+
subject
+
section
+
academic year

must remain authoritative.

Never replace exact RBAC with broad class/subject lists just to simplify code.

==================================================
PHASE 79 — STUDENT OWNERSHIP MUST REMAIN EXACT
==================================================

Student access must derive from authenticated identity.

Do not trust arbitrary URL/body student IDs.

==================================================
PHASE 80 — AUTOMATED DEAD CODE PROOF
==================================================

Before deleting anything, produce evidence:

TARGET
REFERENCES FOUND
DYNAMIC REFERENCES
BUILD REFERENCES
RUNTIME REFERENCES
SAFE TO DELETE

Only then delete.

==================================================
PHASE 81 — PERFORMANCE REGRESSION CHECK
==================================================

After each major phase compare:

- bundle size
- startup
- login
- dashboard
- tab switching
- API requests
- memory
- APK size

Do not accept a “refactor” that makes app slower.

==================================================
PHASE 82 — TEST EVERY PORTAL AFTER CLEANUP
==================================================

ADMIN:

login
dashboard
users
teachers
students
classes
sections
subjects
assignments
admissions
reports
settings
backup

TEACHER:

dashboard
classes
students
attendance
lessons
materials
assignments
exams
results
timetable
notifications
profile

STUDENT:

dashboard
profile
class
subjects
lessons
materials
assignments
exams
submissions
results
attendance
timetable
notifications
library

==================================================
PHASE 83 — ANDROID TESTING
==================================================

Test:
- cold start
- warm start
- background
- resume
- rotation
- portrait
- landscape
- Android back
- modal back
- keyboard
- notification click
- file download
- PDF opening
- logout
- app restart

==================================================
PHASE 84 — LOW-END DEVICE TEST
==================================================

Pay special attention to low-end Android:

- first launch
- dashboard
- large list scrolling
- exam
- chat
- materials
- image-heavy screens

There must be no obvious:
- freezing
- jank
- excessive RAM growth
- repeated loading

==================================================
PHASE 85 — BUILD
==================================================

Run:

npm install
npm run lint
npm run build
npx cap sync android

Then:

Gradle release build

Do not claim success until the build actually passes.

==================================================
PHASE 86 — FINAL SOURCE CLEANUP
==================================================

After all tests:

Remove only verified:
- dead files
- dead exports
- dead components
- dead hooks
- dead CSS
- dead assets
- dead dependencies
- duplicate utilities
- debug code

Never remove a file just because its filename sounds old.

==================================================
PHASE 87 — FINAL REPORT
==================================================

Produce a detailed report:

A. DEAD FILES REMOVED
B. DEAD FUNCTIONS REMOVED
C. DEAD EXPORTS REMOVED
D. UNUSED DEPENDENCIES REMOVED
E. DUPLICATE CODE CONSOLIDATED
F. DUPLICATE CSS REMOVED
G. TIMER/LOOP BUGS FIXED
H. API REQUESTS REDUCED
I. MEMORY LEAKS FIXED
J. RENDER LOOPS FIXED
K. BUNDLE SIZE CHANGE
L. APK SIZE CHANGE
M. STARTUP CHANGE
N. API REQUEST COUNT CHANGE
O. ANDROID OPTIMIZATIONS
P. TESTS
Q. BUILD RESULT
R. REMAINING ISSUES

For each deleted item:

FILE
WHY IT WAS DEAD
REFERENCE CHECK
SAFE TO REMOVE
TEST RESULT

==================================================
FINAL DEFINITION OF DONE
==================================================

[ ] No verified dead code remains in runtime path
[ ] No duplicate runtime implementations unnecessarily remain
[ ] No uncontrolled timers
[ ] No duplicate polling
[ ] No lifecycle duplication
[ ] No notification listener duplication
[ ] No unnecessary Socket connections
[ ] No refresh loops
[ ] No render loops
[ ] No API request storms
[ ] No N+1 frontend requests
[ ] No obvious N+1 SQL queries
[ ] No unnecessary giant initial fetches
[ ] No unnecessary initial loading of heavy features
[ ] No unused runtime dependency
[ ] No unnecessarily bundled server code
[ ] No large unused assets
[ ] No avoidable base64 memory amplification
[ ] No production debug spam
[ ] No secrets exposed
[ ] Teacher RBAC preserved
[ ] Student ownership preserved
[ ] MySQL remains source of truth
[ ] Existing ERP features preserved
[ ] TypeScript passes
[ ] Lint passes
[ ] Vite build passes
[ ] Capacitor sync passes
[ ] Android release build passes
[ ] Low-end device behavior verified

MOST IMPORTANT:

DO NOT DELETE CODE TO MAKE THE PROJECT SMALLER.

DELETE CODE ONLY WHEN YOU CAN PROVE IT IS UNUSED, DUPLICATED, BROKEN, OR UNNECESSARY.

OPTIMIZE THE EXISTING APPLICATION.

PRESERVE BUSINESS LOGIC.

PRESERVE THE UI.

PRESERVE THE DATABASE.

PRESERVE SECURITY.

MAKE THE EXISTING APK FASTER, LIGHTER, MORE STABLE, AND MORE MAINTAINABLE.