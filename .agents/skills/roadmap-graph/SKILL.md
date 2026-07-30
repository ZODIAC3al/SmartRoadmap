---
name: roadmap-graph-builder
description: Builds and maintains the adaptive per-track learning roadmap graph for SmartRoadmap — Mongoose schema for topics/prerequisites, $graphLookup traversal, exam grading, and AI-driven remedial node insertion based on fail percentage. Trigger on requests mentioning roadmap graph, adaptive roadmap, remedial node, track prerequisites, or exam-driven node generation.
turbo_safe: false
dependencies: []
---

## Mission
This skill ensures the roadmap graph stays consistent with the spec: one graph
per (user, track), reset on track switch, mutated only through the documented
fail-percentage trigger — never through ad-hoc edits.

## Reference
Full feature spec and JSON schema: `resources/spec.md` (read this first, every
time, before writing graph logic).

## Instructions
1. Read `resources/spec.md` sections 1 and 3 before touching any graph code.
2. Model topics as a Mongoose collection with a `prerequisites: ObjectId[]`
   field. Use `$graphLookup` for traversal — do not introduce a separate graph
   database.
3. When implementing exam grading:
   - Update `fail_percentage` on the topic-result document per the formula in
     `resources/spec.md` section 3.3.
   - If `fail_percentage >= REMEDIAL_THRESHOLD`, call the AI node-generation
     service (queued via BullMQ, not inline) — never generate nodes
     synchronously in the request/response cycle.
4. New AI-generated nodes must be tagged `type: "ai_generated"` with a
   `generated_from_topic` and `generated_reason` field, exactly as shown in
   `resources/spec.md` section 3.2.
5. Track switch: archive the old `UserTrackProgress` document (do not delete)
   and create a fresh one for the new track. Never mutate the old track's
   progress after switching.
6. After any schema change, stop and ask for confirmation before running
   migrations — this repo's deny rules in `.agents/rules/team-and-deny-rules.md` require it.
7. Write a unit test for the trigger logic in step 3 alongside any change to
   it — this is the single most fragile piece of business logic in the repo.
