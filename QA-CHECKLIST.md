# Manual QA checklist — click through the whole site

Run the automated suite first (`npm run smoke` → 44 checks). This document covers
what the script can't: the actual UI in a browser.

**Setup**

```bash
docker compose up -d
npm run dev            # API :3000 · Web :3001
open http://localhost:3001
```

Keep DevTools open (Console + Network + Application tab) for every step.

---

## A. Authentication

| #   | Feature            | Steps                                                        | Expected                                                                                                                    |
| --- | ------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| A1  | Register           | `/auth/register`, weak password `123`                        | Inline validation error, no request sent                                                                                    |
| A2  | Register           | Valid learner signup                                         | Redirects to `/onboarding`; **Application → Local Storage** shows `smart_user` + `smart_session=1` but **NO `smart_token`** |
| A3  | Cookie             | After A2, **Application → Cookies**                          | `sr_refresh` present, marked **HttpOnly**, `Path=/auth`                                                                     |
| A4  | Login              | Wrong password                                               | Toast "Invalid email or password"                                                                                           |
| A5  | Session persists   | Log in, hard-refresh the page (Cmd/Ctrl+R)                   | Still logged in — Network shows one `POST /auth/refresh` firing automatically                                               |
| A6  | Logout             | Click logout in the navbar                                   | Redirects to login; `sr_refresh` cookie gone, `smart_user` cleared                                                          |
| A7  | Google button      | With `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset                    | Google area shows "not configured", no fake modal                                                                           |
| A8  | Google button      | With a real client id set                                    | Google's own signed button renders and works                                                                                |
| A9  | Facebook           | Look for the old Facebook button                             | It's gone (was a fake `alert()`)                                                                                            |
| A10 | Forgot password    | `/auth/forgot-password`, submit your email                   | Success message; the reset link is printed in the **API console** (dev)                                                     |
| A11 | Reset password     | Open that link → `/auth/reset-password?token=…`              | New-password form; after submitting you're bounced to login                                                                 |
| A12 | Session revocation | After A11, try the app in a tab that was still logged in     | You're logged out — the reset revoked every session                                                                         |
| A13 | Verify email       | Copy the verification link from the API console after signup | `/auth/verify-email` shows "Email verified"; `/auth/me` shows `isVerified: true`                                            |

## B. Authorization (the security fixes, visible in the browser)

| #   | Test         | Steps                                                                                                                                                      | Expected                                                                     |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| B1  | Admin gate   | Log in as a learner, visit `/admin`                                                                                                                        | "Access denied" — no dashboard                                               |
| B2  | Fake admin   | In Console: `localStorage.setItem('smart_user', JSON.stringify({role:'admin'}))` then reload `/admin`                                                      | **Still denied** — the page calls `GET /auth/me` and the server says learner |
| B3  | Direct API   | In Console: `fetch('http://localhost:3000/auth/users').then(r=>r.status)`                                                                                  | `401`                                                                        |
| B4  | IDOR         | Note your user id from `/auth/me`, then in Console `fetch('http://localhost:3000/cv/user/<someone-elses-id>',{headers:{Authorization:'Bearer '+<token>}})` | `403`                                                                        |
| B5  | Company area | Learner visits `/company`                                                                                                                                  | Denied / redirected                                                          |

## C. Roadmap + adaptive quiz (core feature)

| #   | Feature             | Steps                                  | Expected                                                                                |
| --- | ------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| C1  | Onboarding          | Complete onboarding with a target role | Redirects to `/roadmap`                                                                 |
| C2  | Roadmap render      | `/roadmap`                             | Modules shown; first is `in_progress`, rest `locked`                                    |
| C3  | Start quiz          | Click a module → `/quiz/[moduleId]`    | First question + options appear                                                         |
| C4  | Adaptive difficulty | Answer 2 correct in a row              | Next question difficulty rises (easy→medium→hard)                                       |
| C5  | Finish + **pass**   | Score ≥ 70%                            | Results screen; back on `/roadmap`, next module(s) **unlock**                           |
| C6  | Finish + **fail**   | Score < 70% (answer wrong on purpose)  | A **"Review: …" remedial module** appears in the roadmap, the failed one shows `failed` |
| C7  | Progress            | Reload `/dashboard`                    | Progress % reflects completed modules                                                   |

## D. CV builder (the 1808-line page we split)

| #   | Feature    | Steps                           | Expected                                          |
| --- | ---------- | ------------------------------- | ------------------------------------------------- |
| D1  | Load       | `/cv`                           | Editor + live preview render (no console errors)  |
| D2  | Edit       | Type name/title, add experience | Preview updates live                              |
| D3  | AI enhance | Click "enhance" on a bullet     | Text is rewritten (mock text if `MOCK_MODE=true`) |
| D4  | Upload     | Upload a **non-PDF**            | Rejected with an error, not a silent mock         |
| D5  | Upload     | Upload a real PDF               | Fields auto-fill                                  |
| D6  | Save       | Click save, reload `/cv`        | Data persists                                     |
| D7  | Export     | Export to PDF                   | File downloads                                    |

## E. Hiring / matching

| #   | Feature           | Steps                                                                    | Expected                                                                                                 |
| --- | ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| E1  | Jobs list         | `/hiring`                                                                | Seeded jobs render                                                                                       |
| E2  | Matches           | View your matches                                                        | Match scores shown; only YOUR matches (no id in the URL bar you can change)                              |
| E3  | Recruiter         | Log in as a `company` user, `/company`                                   | Candidate list loads                                                                                     |
| E4  | **Close the gap** | On a job with a red ❌ skill, click "Inject missing skills into Roadmap" | Toast lists the skills added; go to `/roadmap` — **new modules are really there** (this used to be fake) |

## F. Payments

| #   | Feature         | Steps                                                              | Expected                                                                                        |
| --- | --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| F1  | Checkout        | `/pricing`, pick Pro, checkout                                     | Mock terminal opens (dev) or PayPal redirect (prod creds)                                       |
| F2  | Capture         | Complete the mock payment                                          | Toast success; `/profile` or `/auth/me` shows `plan: pro_learner`, `subscriptionStatus: active` |
| F3  | Price integrity | (Console) create an order with `{plan:'pro_learner', amount:0.01}` | Server ignores the amount; price is fixed at 19.99                                              |

## G. Messaging / notifications

| #   | Feature       | Steps                    | Expected                                 |
| --- | ------------- | ------------------------ | ---------------------------------------- |
| G1  | Notifications | Bell icon in navbar      | Unread count + list; mark-all-read works |
| G2  | Messages      | `/messages`              | Conversations load; send a message       |
| G3  | Newsletter    | Footer email box, submit | Success toast (endpoint now exists)      |

## H. i18n / theming

| #   | Feature | Steps             | Expected                                             |
| --- | ------- | ----------------- | ---------------------------------------------------- |
| H1  | Arabic  | Toggle to AR      | Layout flips to RTL, `ms-*`/`pe-*` spacing correct   |
| H2  | Theme   | Toggle dark/light | `smartdark`/`smartlight` applied, persists on reload |

## I. Resilience

| #   | Test           | Steps                                                                                             | Expected                                                               |
| --- | -------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| I1  | API down       | Stop the API, use the app                                                                         | Friendly errors, no infinite spinners, no crash                        |
| I2  | Token expiry   | Wait 15 min (or shrink `JWT_EXPIRY`), make a request                                              | Auto-refresh via cookie, request succeeds transparently                |
| I3  | Refresh expiry | Clear the `sr_refresh` cookie, make a request                                                     | Cleanly bounced to login                                               |
| I4  | Token theft    | Copy the `sr_refresh` cookie, use the app normally (it rotates), then replay the old cookie value | `401` **and every session is revoked** — you get logged out everywhere |

---

### Sign-off

- [ ] `npm run smoke` → 53/53
- [ ] `npm run build` clean
- [ ] Sections A–I walked in Chrome + one mobile viewport
- [ ] No red errors in the Console during a full walkthrough
