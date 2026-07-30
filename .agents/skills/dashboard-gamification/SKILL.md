---
name: dashboard-gamification
description: Builds SmartRoadmap's learning dashboard — calendar with deadlines, AI progress tracking, cheatsheets, learning streaks, achievements, certification export, and offline AI-narrated audio. Trigger on requests mentioning dashboard, calendar, deadlines, streaks, achievements, certification, cheatsheet, or offline audio.
turbo_safe: true
dependencies: []
---

## Mission
This skill covers everything the user sees outside the roadmap graph itself —
the home surface, gamification, and offline mode. It intentionally does not
touch graph/exam logic; use the `roadmap-graph` skill for that.

## Reference
Full feature spec: `resources/spec.md` (sections 2 and 4).

## Instructions
1. Calendar: use FullCalendar on the frontend; backend endpoints should accept
   a `dueDate` on any assigned work item and emit an event (via
   `@nestjs/event-emitter`) that the notification scheduler consumes — do not
   hardcode calendar-to-notification logic inline.
2. Streaks: increment on any qualifying daily activity (define "qualifying" by
   checking existing exam/lesson-completion events — do not invent a new
   activity type without flagging it).
3. Achievements: unlock via event listeners on streak/completion milestones,
   not via polling.
4. Certification export and any endpoint under `apps/api/src/export/` requires
   explicit approval per `.agents/rules/team-and-deny-rules.md` deny rules — do not mark this turbo_safe
   even though the rest of this skill is.
5. Offline audio: summarize the topic via the existing AI service, then
   generate narration via the TTS provider. Cache the resulting audio file
   through the PWA service worker (`next-pwa`) — do not attempt to store audio
   in browser storage APIs directly.
6. Cheatsheets: generate from completed/struggling topics only — check the
   user's `topic_results` (from the `roadmap-graph` skill's data) before
   generating, so cheatsheets stay relevant to actual weak areas.
