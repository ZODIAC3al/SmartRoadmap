# Wamdh — Interactive Roadmap & Learning Dashboard — SKILL.md

## 0. Overview

This document specifies two connected feature sets for Wamdh:

1. **Interactive Roadmap v1** — an AI-adaptive learning path per track (e.g. Frontend, Backend), driven by diagnostic exams and live fail-percentage data.
2. **Learning Dashboard** — the home surface where a user manages calendar/deadlines, tracks AI-scored progress, collects cheatsheets, builds streaks/achievements, earns certification, and can go offline via AI narration.

Both features share one core idea: **the AI doesn't just deliver static content — it re-shapes the roadmap and dashboard in real time based on how the user is actually performing.**

---

## 1. Feature: Interactive Roadmap v1

### 1.1 Track selection & reset behavior
- The roadmap a user sees depends entirely on **which track** they're enrolled in (e.g. Frontend, Backend, Mobile).
- A user can only be actively progressing on **one track at a time**.
- If a user switches to a new track, their roadmap for that track **starts fresh from the beginning** — no carryover of node state from the previous track.

### 1.2 Placement / knowledge check
- Before generating a live roadmap, the user takes a **table of exams**, one per topic in the track.
- This establishes a baseline "knowledge map" — which topics the user already knows vs. doesn't.

### 1.3 Adaptive node generation (the core AI loop)
- As the user progresses and **fails a topic's exam**, that failure is logged with a **fail percentage** for that topic within the track.
- The AI uses each topic's fail percentage to **dynamically generate/insert roadmap nodes** — e.g. remedial sub-topics, extra practice nodes, or prerequisite review nodes — targeted at the weak area.
- This means the roadmap graph is **not static**: nodes can appear (and presumably be reordered) in response to real performance data, not just a fixed curriculum sequence.

### 1.4 Progress tracking & notifications
- Continuous progress tracking sits underneath the roadmap.
- An **auto-notification system** nudges the user to continue learning when they've gone idle.
- Notifications should include an **AI-generated encouraging message**, personalized to that specific user's current progress (not a generic templated string).

### 1.5 Open implementation questions
- Does node generation happen synchronously after each exam, or via a batch/background AI job?
- Is "fail percentage" per-attempt, or a rolling average across attempts?
- What's the max roadmap depth/breadth the AI can inject before it's considered "off track" from the core curriculum?

---

## 2. Feature: Learning Dashboard

The dashboard is the model's home surface — described as needing to feel like **"a learning model you can own."**

### 2.1 Calendar
- Full calendar view.
- User can **assign work items to dates** with **deadlines**.
- Deadlines likely feed back into the notification system (Feature 1.4) and into streak logic (2.4).

### 2.2 AI progress tracking
- Same progress-tracking engine as the roadmap (1.4), surfaced visually on the dashboard — a single source of truth for "where am I."

### 2.3 Cheatsheets
- AI-generated cheatsheets, likely tied to topics the user has completed or is struggling with.

### 2.4 Streaks & achievements (gamification)
- **Learning streaks**, presented "like a game" — daily/weekly continuity tracking.
- **Achievements** unlocked alongside streaks.
- **Certification** — a formal credential earned on track/topic completion, distinct from the gamified achievements.

### 2.5 Offline mode
- Audio mode: **AI narration** of summaries so the user can learn without a screen (e.g. commuting).
- Needs a **narration/summarization strategy** — likely: AI condenses a topic into a script, then TTS renders it for offline playback.

### 2.6 Export
- User can **export** their learning artifacts — streaks, achievements, and certification — implying a shareable/portable record (PDF or image card, e.g. for LinkedIn).

---

## 3. Data Model / Graph Schema

The roadmap is fundamentally a **directed graph per (user, track)**: topics are nodes, prerequisites are edges, and the AI mutates the graph based on exam results.

### 3.1 Core entities

| Entity | Purpose |
|---|---|
| `Track` | A learning path (Frontend, Backend, Mobile, etc.) |
| `Topic` (node) | A unit of content within a track |
| `Exam` | The knowledge check tied to a topic |
| `Edge` | Prerequisite/sequence relationship between two topics |
| `UserTrackProgress` | A user's state within one track (resets on track switch) |
| `UserTopicResult` | A user's exam attempts + fail % per topic |
| `GeneratedNode` | An AI-inserted remedial/extra node, linked to the topic that triggered it |
| `Notification` | Queued nudge + AI-generated message |
| `StreakRecord` | Daily/weekly activity log |
| `Achievement` | Unlocked badge/milestone |
| `Certification` | Formal completion credential |

### 3.2 Sample JSON graph shape

```json
{
  "track": {
    "id": "track_frontend",
    "name": "Frontend",
    "nodes": [
      {
        "id": "topic_html_basics",
        "type": "core",
        "title": "HTML Basics",
        "prerequisites": []
      },
      {
        "id": "topic_css_layout",
        "type": "core",
        "title": "CSS Layout",
        "prerequisites": ["topic_html_basics"]
      },
      {
        "id": "topic_flexbox_remedial_gen_4821",
        "type": "ai_generated",
        "title": "Flexbox Fundamentals (Remedial)",
        "generated_from_topic": "topic_css_layout",
        "generated_reason": "fail_percentage_threshold",
        "prerequisites": ["topic_html_basics"],
        "unlocks": ["topic_css_layout"]
      }
    ]
  },
  "user_progress": {
    "user_id": "user_123",
    "track_id": "track_frontend",
    "current_node": "topic_flexbox_remedial_gen_4821",
    "topic_results": [
      {
        "topic_id": "topic_css_layout",
        "attempts": 2,
        "fail_percentage": 63,
        "status": "remedial_inserted"
      }
    ],
    "streak": {
      "current_days": 4,
      "longest_days": 11,
      "last_activity": "2026-07-29"
    },
    "achievements": ["first_topic_complete", "5_day_streak"]
  }
}
```

### 3.3 Node generation trigger (pseudo-logic)

```
on exam_submitted(user, topic):
    result = grade(exam)
    fail_pct = update_fail_percentage(user, topic, result)

    if fail_pct >= REMEDIAL_THRESHOLD:
        remedial_node = ai_generate_node(
            base_topic=topic,
            fail_pct=fail_pct,
            user_history=user.topic_results
        )
        insert_node(track_graph, remedial_node, before=topic)
        notify(user, ai_generate_encouragement(user, topic, fail_pct))
```

---

## 4. AI Integration Points (Gemini 1.5 Flash)

| Use case | Input | Output |
|---|---|---|
| Remedial node generation | Topic, fail %, user history | New node(s): title, content outline, difficulty |
| Encouragement notifications | User progress snapshot | Short personalized message |
| Cheatsheet generation | Completed/struggling topic | Condensed reference doc |
| Offline audio narration | Topic summary text | Narration script for TTS |

---

## 5. Suggested Next Steps
- Define the exact `REMEDIAL_THRESHOLD` and whether it's global or tunable per track.
- Decide storage: graph-native DB (e.g. Neo4j) vs. relational tables with adjacency (simpler, fits existing Django stack).
- Spec the export format for streaks/achievements/certification (PDF card vs. shareable image).
- Decide whether track-switch truly discards prior progress or archives it (for later resume).
