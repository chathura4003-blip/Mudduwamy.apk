# MASTER PROMPT — FULL MOBILE APK UI/UX OVERHAUL
# RESPONSIVE • ALL ANDROID DEVICES • MODERN NATIVE FEEL • ACCESSIBILITY • PERFORMANCE

You are a senior mobile UI/UX architect, React responsive-design engineer, Android/Capacitor engineer, accessibility specialist, and frontend performance engineer.

Repository:

`chathura4003-blip/Mudduwamy.apk`

Git:

`git@github.com:chathura4003-blip/Mudduwamy.apk.git`

The existing application is the real Sri Sumana Maha Pirivena ERP and its Android mobile application.

YOUR PRIMARY TASK:

Audit the ENTIRE EXISTING MOBILE UI and upgrade it into a polished, modern, responsive, production-quality mobile ERP application that looks excellent across Android devices and screen sizes.

DO NOT rebuild the project from scratch.

DO NOT replace existing business functionality.

DO NOT create demo screens.

DO NOT use mock data.

DO NOT remove working ERP modules merely to simplify the UI.

Preserve the Sri Sumana Maha Pirivena visual identity.

==================================================
1. FIRST — COMPLETE UI AUDIT
==================================================

Before changing UI, inspect every user-facing screen.

Audit:

- Login
- Splash
- Welcome / onboarding if present
- Admin dashboard
- Admin tabs
- Admin modals
- Teacher portal
- Teacher tabs
- Teacher modals
- Student portal
- Student tabs
- Student modals
- Online exams
- Exam question pages
- Results
- Attendance
- Materials
- Lessons
- Assignments
- Submissions
- Timetable
- Library
- Notifications
- Chat
- Profile
- Settings
- Backup
- Admissions
- Certificates
- Reports
- Website/content screens
- Error pages
- Empty states
- Loading states
- Offline states

Inspect ALL components under:

`src/components/`

`src/views/`

`src/views/AdminDashboard/`

`src/views/TeacherPortal/`

`src/views/StudentPortal/`

and all shared CSS/Tailwind styles.

Create an internal UI audit matrix:

SCREEN
CURRENT PROBLEM
DEVICE IMPACT
RESPONSIVE ISSUE
UX ISSUE
ACCESSIBILITY ISSUE
PERFORMANCE ISSUE
PROPOSED FIX
TEST REQUIRED

==================================================
2. MOBILE-FIRST DESIGN SYSTEM
==================================================

Do NOT design desktop first and then shrink it.

Use mobile-first responsive design.

Base target:

320px width

Then verify:

360px
375px
390px
412px
430px
480px
600px
768px
834px
1024px+
large tablets

Also test device heights:

640px
720px
800px
844px
900px+
large screens

The UI must never:
- overflow horizontally
- clip buttons
- clip text
- create unusable dialogs
- hide important actions
- break navigation
- create microscopic controls

==================================================
3. RESPONSIVE BREAKPOINT STRATEGY
==================================================

Do not rely on one breakpoint.

Use logical responsive ranges such as:

Small phone
< 360px

Normal phone
360–430px

Large phone
431–600px

Small tablet
601–768px

Tablet
769–1024px

Large tablet / desktop
1025px+

Adapt:
- layout
- columns
- typography
- padding
- navigation
- cards
- modal width
- form layout
- tables
- charts
- sidebars

Do not simply scale everything proportionally.

==================================================
4. SAFE AREA SUPPORT
==================================================

Full-screen mobile devices must correctly support:

- status bar
- navigation bar
- gesture navigation
- display cutouts
- notches
- rounded corners

Use safe-area insets where required.

Examples:

env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)

Do not allow content or bottom navigation to overlap system controls.

==================================================
5. GLOBAL APP SHELL
==================================================

Create a consistent mobile application shell.

The application should visually feel like one professional product.

Standardize:

Top app bar
Page title
Back button
Optional action button
Content area
Bottom navigation where appropriate
Floating action only where useful
Safe-area handling

Avoid every screen having a completely different header.

==================================================
6. LOGIN SCREEN
==================================================

Upgrade the login UI.

Requirements:

- attractive Sri Sumana branding
- responsive background
- readable Sinhala text
- English support
- comfortable input fields
- password visibility toggle
- clear validation
- loading state
- network failure state
- keyboard-aware layout
- no content hidden behind keyboard
- accessible labels
- touch-friendly controls

Do not overload the login page with animations.

Keep startup fast.

==================================================
7. SPLASH SCREEN
==================================================

Splash screen should:

- display correct logo
- look professional
- load quickly
- not remain unnecessarily long
- adapt to portrait and landscape
- support modern Android safe areas

Avoid heavy animated assets.

==================================================
8. WELCOME / ONBOARDING
==================================================

If onboarding exists:

Make it:
- simple
- fast
- skippable where appropriate
- responsive
- readable at different text sizes

Do not force users through unnecessary pages.

==================================================
9. ADMIN UI
==================================================

Admin UI should feel like a professional ERP mobile application.

Improve:

Dashboard cards
Statistics
Quick actions
Navigation
Tables
Search
Filters
Forms
Modals
Settings
Reports

On phones:
convert wide tables into:
- cards
- stacked rows
- horizontal scroll only where absolutely necessary

On tablets:
use wider multi-column layouts.

==================================================
10. TEACHER UI
==================================================

Teacher portal should prioritize daily actions.

Recommended hierarchy:

Today
Current Class
Current Subject
Timetable
Students
Attendance
Assignments
Materials
Exams
Results
Notifications

Make important actions easy to reach with one or two taps.

==================================================
11. STUDENT UI
==================================================

Student portal should prioritize:

Today's class
Timetable
Subjects
Lessons
Materials
Assignments
Exams
Results
Attendance
Notifications

Use visual hierarchy rather than dense tables.

==================================================
12. NAVIGATION
==================================================

Audit all navigation.

Use a consistent mobile navigation model.

Where appropriate:

Bottom navigation for primary sections.

Secondary content:
nested navigation / tabs / sheets.

Do not put 15–20 tabs into one horizontal row.

Do not require tiny horizontally scrolling navigation.

Navigation must remain usable at 320px width.

==================================================
13. ANDROID BACK BUTTON
==================================================

UI/navigation must work correctly with Android back.

Expected:

Modal open
→ close modal

Nested page
→ previous page

Nested tab
→ previous tab

Search/filter overlay
→ close overlay

Portal
→ previous navigation state

Only exit application when actually appropriate.

==================================================
14. CARDS
==================================================

Standardize card components.

Cards should:
- have consistent padding
- clear title hierarchy
- readable metadata
- appropriate elevation/shadow
- avoid excessive gradients
- avoid giant empty spaces
- adapt to screen width

Avoid extremely rounded “toy-like” UI.

Keep professional ERP appearance.

==================================================
15. TYPOGRAPHY
==================================================

Typography must support Sinhala and English properly.

Use:
- clear Sinhala font
- readable English font
- consistent font weights
- consistent line heights

Do not use tiny text for important information.

Recommended minimums should be practical for mobile reading.

Do not let Sinhala glyphs get clipped.

Ensure:
- buttons
- labels
- headings
- notifications
- dialogs
- error messages

support Sinhala correctly.

==================================================
16. TEXT SIZE SYSTEM
==================================================

Create a coherent typography scale:

Display
Heading
Subheading
Body
Label
Caption

Do not randomly choose font sizes per screen.

Ensure the existing user text-size setting continues to work.

When text size increases:
- layouts must reflow
- buttons must expand
- cards must grow
- dialogs must remain usable
- content must not clip

==================================================
17. ACCESSIBILITY
==================================================

Audit every interactive element.

Requirements:

- sufficient touch target
- visible focus where relevant
- semantic buttons
- accessible labels
- readable contrast
- no icon-only ambiguous actions
- screen-reader compatible names
- no important information conveyed only by color

Buttons should be comfortably tappable.

Do not put multiple tiny icons next to each other.

==================================================
18. FORMS
==================================================

Improve all forms.

Inputs:
- consistent height
- clear label
- placeholder where useful
- validation message
- focus state
- error state
- success state

Forms must adapt between:

one-column phone layout

and

two-column tablet layout

Do not create giant forms inside tiny fixed-height dialogs.

==================================================
19. KEYBOARD HANDLING
==================================================

Every form must be tested with Android keyboard.

Ensure:

- focused field scrolls into view
- buttons are not hidden
- modal content can scroll
- bottom navigation does not overlap keyboard
- login works without manual scrolling hacks

Audit Capacitor keyboard configuration.

==================================================
20. MODALS / DIALOGS
==================================================

This is a major area.

Replace oversized desktop dialogs with responsive mobile patterns.

For small screens:

Bottom sheet or full-height sheet where appropriate.

For large screens:

Centered modal.

Requirements:

- max width
- max height
- internal scrolling
- sticky header where useful
- sticky footer actions where useful
- clear close action
- keyboard-safe layout

Never allow modal content to overflow viewport.

==================================================
21. TABLES
==================================================

Tables are one of the biggest mobile problems.

For phones:
convert tables into responsive cards/list rows.

For tablets:
allow wider tables where useful.

Never force users to zoom the app.

Horizontal scrolling should only be used when the data genuinely requires it.

==================================================
22. SEARCH
==================================================

Build a consistent mobile search pattern.

Search:
- large enough input
- clear icon
- clear button
- keyboard support
- loading state
- no-result state
- debounce where appropriate

Avoid firing API requests on every keystroke.

==================================================
23. FILTERS
==================================================

On phones:
use filter bottom sheet.

On tablets:
use inline filter bar.

Do not crowd 5–10 filters into one row.

==================================================
24. LISTS
==================================================

Standardize lists:

avatar/icon
title
subtitle
metadata
status
action

Use skeleton/loading states where appropriate.

Avoid huge lists rendered unnecessarily.

Use pagination or virtualization for large datasets.

==================================================
25. DASHBOARD
==================================================

Optimize dashboard for mobile.

Do not show 20–30 large cards at once.

Use:

Important statistics
Today's information
Quick actions
Recent activity
Relevant alerts

Organize vertically on phones.

Use multi-column grids only when screen width supports it.

==================================================
26. CHARTS
==================================================

Audit charts.

Charts must:
- resize responsively
- avoid overflow
- remain readable
- avoid unnecessary animation
- not render huge datasets on mobile

Simplify charts for phones when necessary.

==================================================
27. TIMETABLE UI
==================================================

Timetable must be mobile-friendly.

Phone:

Day selector
↓
Today's schedule
↓
Periods

Tablet:

grid timetable can be used.

Highlight:

Current period
Next period
Completed periods

Do not force tiny timetable cells onto phones.

==================================================
28. NOTIFICATION UI
==================================================

Notification cards must handle long Sinhala text.

Support:
- large text
- unread state
- timestamp
- type/severity
- attachment/action
- wrapping text

Never truncate important notification content without an accessible expansion.

==================================================
29. CHAT UI
==================================================

Audit chat UI.

Requirements:
- mobile keyboard support
- message bubbles
- attachment handling
- reply UI
- reaction UI
- scrolling
- unread marker
- loading states
- send button
- long-message wrapping

Do not create layout jumps when keyboard opens.

==================================================
30. EXAMS
==================================================

Online exam UI is critical.

Optimize for:
- small phones
- touch controls
- question navigation
- timer visibility
- answer selection
- long questions
- Sinhala text
- images
- scrolling

Timer should remain visible without covering content.

Do not lose answers when navigating.

==================================================
31. RESULT / ATTENDANCE UI
==================================================

Use mobile cards instead of desktop-heavy grids.

Important data should be visually prioritized.

Example:

Subject
Marks
Grade
Status

Use responsive summary cards.

==================================================
32. MATERIALS / LIBRARY
==================================================

Improve:
- search
- filter
- file type badges
- download
- open PDF
- preview
- metadata

Large thumbnails must be optimized.

Do not load every large image at once.

==================================================
33. SETTINGS
==================================================

Group settings into logical sections.

Example:

Appearance
Notifications
Text Size
Security
Account
Application
About

Avoid very long single-page settings.

Use native-looking rows.

==================================================
34. DARK / LIGHT THEME
==================================================

Audit every screen in both themes.

Ensure:
- readable text
- correct borders
- correct cards
- correct icons
- correct inputs
- proper dialog backgrounds
- no white flashes
- no unreadable muted text

Maintain Sri Sumana visual identity.

Do not use pure black everywhere unless appropriate.

==================================================
35. COLORS
==================================================

Create a central design-token system.

Centralize:

primary
secondary
accent
background
surface
text
muted
border
success
warning
error
info

Do not hard-code different colors in every component.

Preserve existing branding while improving consistency.

==================================================
36. SPACING
==================================================

Create a consistent spacing system.

Example conceptual scale:

4
8
12
16
20
24
32

Use consistent vertical rhythm.

Avoid random margins throughout the project.

==================================================
37. ICONS
==================================================

Use one consistent icon family.

The project already uses Lucide.

Prefer the existing icon system.

Do not mix random icon libraries unnecessarily.

Ensure icon sizes are consistent.

==================================================
38. ANIMATIONS
==================================================

Use animations sparingly.

Good:
- page transitions
- sheet opening
- button feedback
- subtle loading

Avoid:
- long intro animations
- constant bouncing
- heavy blur
- large parallax
- unnecessary particle effects
- animations on every list item

Low-end Android devices must remain smooth.

==================================================
39. PERFORMANCE
==================================================

UI modernization must NOT make the APK slower.

Audit:
- large DOM trees
- unnecessary rerenders
- repeated API calls
- heavy shadows
- CSS blur
- large images
- chart rendering
- animation
- unnecessary component mounts

Use:
- lazy loading
- memoization where appropriate
- virtualization
- responsive images
- code splitting

Measure before/after where possible.

==================================================
40. IMAGE OPTIMIZATION
==================================================

Audit all app images.

Optimize:
- logo
- splash
- backgrounds
- avatars
- gallery
- thumbnails
- banners

Use modern image formats where supported.

Avoid shipping multiple identical oversized assets.

Never upscale small images unnecessarily.

==================================================
41. LANDSCAPE MODE
==================================================

Every important screen must be tested in landscape.

For landscape phones:
- content should remain usable
- navigation should remain reachable
- dialogs should resize
- keyboard should work
- exams should remain usable

For tablets:
use available width intelligently.

==================================================
42. SMALL SCREEN MODE
==================================================

Explicitly test 320px width.

Nothing should:
- overlap
- clip
- become inaccessible
- require zoom
- overflow horizontally

This is mandatory.

==================================================
43. LARGE SCREEN MODE
==================================================

For large tablets:

Do not create a stretched phone UI.

Use:
- max content width
- multi-column cards
- side navigation where appropriate
- balanced whitespace
- responsive panels

Avoid excessively wide text lines.

==================================================
44. TABLET UX
==================================================

Design tablet layouts intentionally.

Examples:

Phone:
1-column

Tablet:
2-column

Large tablet:
2–3-column

Admin:
navigation + content split

Teacher:
dashboard + current class information

Student:
dashboard + schedule/content

==================================================
45. RESPONSIVE COMPONENT ARCHITECTURE
==================================================

Create reusable responsive primitives:

ResponsiveContainer
ResponsiveGrid
MobileSheet
ResponsiveDialog
AppHeader
PageHeader
MobileBottomNav
ResponsiveCard
StatCard
ListRow
EmptyState
LoadingState
ErrorState
SearchBar
FilterSheet

Do not duplicate these patterns in every portal.

==================================================
46. MOBILE-SPECIFIC COMPONENTS
==================================================

Where desktop behavior is unsuitable, create mobile components instead of forcing the desktop component into a tiny layout.

Use responsive rendering:

Phone:
Mobile component

Tablet:
Responsive component

Desktop:
Desktop component

Business logic should remain shared.

==================================================
47. NO HARDCODED SCREEN HEIGHTS
==================================================

Avoid:

height: 100vh

as the universal solution.

Account for modern mobile viewport behavior.

Avoid fixed heights for forms, dialogs, lists, and content containers unless genuinely required.

Use flexible sizing.

==================================================
48. NO HORIZONTAL OVERFLOW
==================================================

Audit the entire application for:

overflow-x
min-width
fixed widths
absolute positioning
wide buttons
wide forms
large tables

Use browser/device testing and fix every unintended horizontal scroll.

==================================================
49. BOTTOM NAVIGATION
==================================================

Where used, bottom navigation must:

- support safe-area inset
- remain visible
- not cover content
- hide appropriately when keyboard opens
- have clear active state
- support larger text settings
- avoid overcrowding

Do not put too many primary destinations into it.

==================================================
50. STATUS BAR / SYSTEM UI
==================================================

Make system UI consistent.

Audit:
- status bar color
- icon contrast
- navigation bar
- splash transition
- dark/light theme behavior

Do not allow white flash during launch.

==================================================
51. LOADING STATES
==================================================

Replace blank screens with intentional loading states.

Use:
- skeletons
- progress indicators
- button loading
- section loading

Do not animate huge skeleton trees unnecessarily.

==================================================
52. EMPTY STATES
==================================================

Every major module needs meaningful empty states.

Examples:

No classes assigned
No students
No materials
No exams
No notifications
No results
No timetable

Do not show misleading zeros or fake data.

==================================================
53. ERROR STATES
==================================================

Every screen must support:

Network failure
Server error
Unauthorized
Forbidden
Not found
Empty

Error UI should give a useful action:

Retry
Back
Refresh
Login again

==================================================
54. OFFLINE STATE
==================================================

Show clear network state.

Do not redesign the app around fake offline data.

Cached safe data may remain visible, but clearly communicate stale/offline state.

==================================================
55. ACCESSIBILITY + LARGE TEXT
==================================================

Test:
normal text
large text
very large text

Ensure layout reflows naturally.

Never use:
white-space: nowrap

for important text unless absolutely necessary.

Avoid fixed one-line labels.

==================================================
56. LANGUAGE SUPPORT
==================================================

The UI must support:

Sinhala
English

Ensure:
- buttons
- labels
- cards
- notifications
- errors
- dialog titles
- navigation
- settings

do not break because Sinhala text is longer.

Do not assume English text length.

==================================================
57. RTL / TEXT DIRECTION
==================================================

Do not incorrectly force RTL for Sinhala.

Respect proper language direction.

Ensure mixed Sinhala/English text displays correctly.

==================================================
58. USER PROFILE / AVATARS
==================================================

Avatar components must:
- load fast
- use placeholders
- support missing image
- avoid layout shift
- crop consistently

Do not download the same avatar repeatedly.

==================================================
59. MOBILE TOUCH INTERACTION
==================================================

Avoid:
- hover-only actions
- tiny dropdown arrows
- tiny close buttons
- desktop right-click assumptions

Everything important must work with touch.

==================================================
60. GESTURE SAFETY
==================================================

Do not interfere with system gestures.

Avoid placing critical actions too close to:
- screen edges
- bottom gesture area
- status bar

Use safe-area support.

==================================================
61. PERFORMANCE OF MOTION LIBRARY
==================================================

The project uses Motion.

Audit every animation.

Remove animations that:
- run continuously
- trigger on every render
- animate huge lists
- cause frame drops

Respect reduced-motion preferences where appropriate.

==================================================
62. UI DUPLICATION
==================================================

Search for repeated UI code.

Examples:
- repeated cards
- repeated page headers
- repeated modal shell
- repeated search input
- repeated filters
- repeated loading states
- repeated empty states
- repeated buttons

Create reusable components where appropriate.

Do not create unnecessary abstraction.

==================================================
63. CSS / TAILWIND CLEANUP
==================================================

Audit:
- duplicate classes
- conflicting media queries
- fixed widths
- random z-index values
- unnecessary !important
- duplicated colors
- duplicated spacing
- unused styles

Create a clean responsive design system.

==================================================
64. Z-INDEX / LAYERING
==================================================

Standardize layers:

app
header
bottom nav
overlay
modal
toast
dropdown

Do not solve every overlap issue by assigning random giant z-index values.

==================================================
65. DROPDOWNS / SELECTS
==================================================

On small screens, standard dropdown behavior can be difficult.

Use:
- bottom sheet
- full-screen selector
- searchable selector

for large option sets.

Ensure the selected value is readable.

==================================================
66. TOASTS
==================================================

Toasts must:
- not cover navigation
- respect safe-area
- support long Sinhala text
- stack correctly
- not remain too long

Do not use browser `alert()`.

==================================================
67. CONFIRMATION UI
==================================================

Do not use:

alert()
confirm()
prompt()

Use responsive app dialogs.

Dangerous actions must clearly identify:
- what will happen
- cancel
- confirm

==================================================
68. MOBILE FILE PICKER / UPLOAD UX
==================================================

Improve upload interfaces.

Show:
- selected file
- size
- type
- upload progress
- success
- error
- retry

Keep upload controls touch friendly.

==================================================
69. PDF VIEWER UX
==================================================

PDF open/download controls should be mobile-friendly.

Buttons must not overflow.

External viewer fallback should be clear.

==================================================
70. ADMIN TABLE UX
==================================================

For admin data-heavy modules:

PHONE:
Search
Filter
Card/List
Action menu

TABLET:
Compact responsive table

DESKTOP:
Full table

Reuse business logic.

==================================================
71. REPORTS
==================================================

Reports should adapt.

Phone:
summary + downloadable report

Tablet:
preview + controls

Desktop:
full report layout

Do not render oversized printable content directly as the primary mobile UI.

==================================================
72. MODAL ACTION BUTTONS
==================================================

Mobile modal footer:

Cancel
Primary action

Buttons should stack when width is small.

Never produce two tiny buttons squeezed into one line.

==================================================
73. FORMS WITH MANY FIELDS
==================================================

Large forms must be divided into sections.

Example:

Personal Information
Academic Information
Contact Information
Guardian Information
Additional Information

Use expandable sections where appropriate.

==================================================
74. SEARCH / FILTER PERSISTENCE
==================================================

Preserve useful navigation state without causing stale or insecure data.

When leaving a screen:
restore state only where appropriate.

Never restore another user's private state after logout/login.

==================================================
75. UI STATE CLEANUP
==================================================

Ensure unmounted components do not:
- update state
- continue polling
- keep listeners
- keep timers

Prevent memory leaks.

==================================================
76. RESPONSIVE TEST MATRIX
==================================================

Mandatory UI test sizes:

320 × 640
360 × 800
375 × 812
390 × 844
412 × 915
430 × 932
480 × 960
600 × 1024
768 × 1024
834 × 1194
1024 × 1366
1280+

Test:
portrait
landscape

==================================================
77. DEVICE TESTING
==================================================

Where possible test on:

low-end Android
mid-range Android
high-end Android
small phone
large phone
tablet

Pay special attention to:
- startup
- scrolling
- modal opening
- keyboard
- navigation
- exam screens
- image loading
- dashboard
- long lists

==================================================
78. LOW-END DEVICE PERFORMANCE
==================================================

Do not make the UI beautiful at the cost of performance.

Target:
smooth scrolling
responsive touch
fast navigation
low memory pressure
minimal startup time

Reduce:
blur
heavy shadows
continuous animation
large images
unnecessary DOM

==================================================
79. DESIGN CONSISTENCY
==================================================

All screens must feel like the SAME APP.

Standardize:
- header
- buttons
- cards
- icon sizes
- typography
- spacing
- colors
- dialogs
- inputs
- loading states
- empty states
- error states

Avoid every screen looking independently designed.

==================================================
80. SRI SUMANA VISUAL IDENTITY
==================================================

Preserve:

Sri Sumana Maha Pirivena identity
existing logo
traditional/monastic visual character
appropriate warm/golden accent
Sinhala typography
professional institutional appearance

Do not transform the design into:
- gaming UI
- generic SaaS
- overly colorful social-media app
- childish rounded UI

Aim for:

Elegant
Professional
Calm
Modern
Monastic
Institutional
Readable

==================================================
81. DO NOT OVERDESIGN
==================================================

Avoid excessive:
glassmorphism
blur
gradients
neon colors
giant shadows
floating elements
animations
huge border radius

The ERP must remain professional and usable.

==================================================
82. IMPLEMENTATION STRATEGY
==================================================

Do NOT rewrite the whole UI in one massive change.

Work in phases.

PHASE 1
Global design system

PHASE 2
App shell/navigation

PHASE 3
Login/splash

PHASE 4
Student portal

PHASE 5
Teacher portal

PHASE 6
Admin portal

PHASE 7
Exam/material/library/report screens

PHASE 8
Settings/notifications/chat

PHASE 9
Responsive/device fixes

PHASE 10
Performance/accessibility

PHASE 11
Final UI testing

After each phase:
- compile
- inspect affected screens
- fix regressions

==================================================
83. KEEP BUSINESS LOGIC SEPARATE FROM UI
==================================================

During refactoring:

UI changes MUST NOT alter:
- authentication
- API behavior
- RBAC
- teacher assignments
- student ownership
- exam scoring
- attendance logic
- timetable logic

Extract UI components while preserving existing data flow.

==================================================
84. NO MOCK DATA
==================================================

Never make the UI “look better” by inserting fake:
- students
- teachers
- classes
- subjects
- results
- notifications
- timetable entries

Use real API data.

==================================================
85. NO MOBILE WEB WRAPPER FEEL
==================================================

The application should feel like a real Android ERP.

Use:
- touch-first interactions
- responsive sheets
- proper back navigation
- mobile app shell
- native-feeling transitions
- system-safe spacing

But do NOT rebuild the whole application as a separate native Java/Kotlin app.

Continue using the existing React + Capacitor architecture unless a specific screen genuinely requires native functionality.

==================================================
86. FINAL UI QUALITY CHECK
==================================================

Before declaring completion, inspect every screen for:

[ ] No horizontal overflow
[ ] No clipped Sinhala text
[ ] No clipped English text
[ ] No tiny controls
[ ] No broken dialogs
[ ] No hidden buttons
[ ] No keyboard overlap
[ ] No unsafe-area overlap
[ ] No landscape breakage
[ ] No tablet stretching
[ ] No excessive blank space
[ ] No inconsistent typography
[ ] No inconsistent colors
[ ] No inconsistent buttons
[ ] No duplicate UI patterns
[ ] No unnecessary animations
[ ] No obvious performance regression
[ ] Loading state works
[ ] Empty state works
[ ] Error state works
[ ] Offline state works
[ ] Back navigation works
[ ] Dark theme works
[ ] Light theme works
[ ] Large text works
[ ] Sinhala works
[ ] English works

==================================================
87. FINAL PERFORMANCE CHECK
==================================================

Compare before and after:

- APK size
- JS bundle size
- initial load
- dashboard render
- tab switching
- scrolling FPS where measurable
- memory usage where measurable
- number of API calls
- repeated API calls
- image payload

Never claim performance improvement without evidence.

==================================================
88. FINAL TESTING
==================================================

Run:

npm run lint
npm run build
npx cap sync android
Android Gradle release build

Then UI-test:

Login
Logout
Back
Admin
Teacher
Student
Dashboard
Search
Filters
Modals
Forms
Exam
Results
Attendance
Materials
Library
Timetable
Notifications
Chat
Settings
PDF
Uploads
Offline
Reconnect
Dark mode
Light mode
Large text
Portrait
Landscape

==================================================
89. FINAL REPORT
==================================================

At completion report:

1. UI audit findings
2. Screens redesigned
3. Responsive improvements
4. Components created
5. Components refactored
6. Mobile-specific improvements
7. Tablet improvements
8. Accessibility improvements
9. Performance improvements
10. Android UI improvements
11. Files changed
12. Tests executed
13. Test results
14. Build results
15. Remaining issues

For each major fix provide:

FILE
PROBLEM
FIX
REASON
TEST RESULT

==================================================
90. DEFINITION OF DONE
==================================================

The UI upgrade is complete only when:

[ ] Existing ERP functionality preserved
[ ] Existing backend preserved
[ ] Existing MySQL data flow preserved
[ ] Modern mobile-first design applied
[ ] 320px layout works
[ ] Normal phones work
[ ] Large phones work
[ ] Tablets work
[ ] Landscape works
[ ] Safe-area works
[ ] Keyboard works
[ ] Android back works
[ ] Dialogs work
[ ] Forms work
[ ] Tables are mobile-friendly
[ ] Sinhala text works
[ ] English text works
[ ] Large text works
[ ] Dark/light themes work
[ ] Accessibility improved
[ ] Loading/empty/error states complete
[ ] No unintended horizontal scrolling
[ ] No major UI duplication
[ ] No obvious memory leaks
[ ] No unnecessary animation
[ ] Low-end devices remain responsive
[ ] Build passes
[ ] No critical UI regression

MOST IMPORTANT:

DO NOT rebuild the ERP.

DO NOT replace existing functionality.

DO NOT create fake screens/data.

DO NOT optimize only for one phone.

DO NOT design only for desktop.

DO NOT make every screen independently styled.

Build one coherent, professional, responsive Sri Sumana Maha Pirivena mobile ERP experience that adapts intelligently to every Android screen size.