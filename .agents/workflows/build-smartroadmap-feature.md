---
description: Start the SmartRoadmap feature-build pipeline (PM spec check -> implementation -> review) for a given feature request
---

When the user types `/build-smartroadmap-feature <feature>`, orchestrate:

1. **PM pass**: Read `docs/specs/roadmap-dashboard-spec.md` and confirm the
   requested `<feature>` is covered there. If it isn't, stop and ask the user
   to clarify rather than inventing behavior. Otherwise, produce a short task
   breakdown scoped to either the `roadmap-graph` or `dashboard-gamification`
   skill (or both, sequenced).

2. **Implementation pass**: Load the relevant skill(s) from step 1 and
   implement the task breakdown. Respect all `turbo_safe` and deny-rule
   settings in `.agents/rules/team-and-deny-rules.md` — pause for approval wherever they require it.

3. **Review pass**: Diff the change against
   `docs/specs/roadmap-dashboard-spec.md`. Flag (don't silently accept) any
   deviation from the documented fail-percentage logic, graph schema, or
   export/auth boundaries. Only mark the cycle complete once the diff is
   clean or the deviation has been explicitly approved by the user.

4. Repeat step 2–3 (rework loop) if the review pass flags an issue, until
   clean.
