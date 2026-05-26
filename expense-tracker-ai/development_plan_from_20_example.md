# ML-Powered Expense Categorization — Comprehensive Technical Analysis

**Expense Tracker AI** | 2026-05-26

---

## Table of Contents

1. [Core Technical Challenges](#1-core-technical-challenges)
2. [Data — What to Collect and How](#2-data--what-to-collect-and-how)
3. [ML Approaches — Tiered Architecture](#3-ml-approaches--tiered-architecture)
4. [Privacy and Data Security](#4-privacy-and-data-security)
5. [User Experience Flow](#5-user-experience-flow)
6. [Edge Cases and Error Handling](#6-edge-cases-and-error-handling)
7. [Deployment and Maintenance Strategy](#7-deployment-and-maintenance-strategy)
8. [Implementation Order](#implementation-order)
9. [Summary](#summary)

---

## 1. Core Technical Challenges

The app is a pure client-side SPA with no backend, no API routes, and all persistence in `localStorage`. This is the root constraint that shapes every architectural decision below.

### Challenge 1 — Cold Start
New users have zero history. A model that needs 500 labeled examples to be useful is worthless on day one. The system must be accurate from the very first expense. This mandates a rule-based fallback that operates without any user data.

### Challenge 2 — Tiny Dataset
Even active users accumulate only hundreds of expenses, not thousands. Most ML models overfit badly below ~500 examples. Statistical models (Naive Bayes, TF-IDF) outperform neural networks in this regime; complexity is the enemy.

### Challenge 3 — Ambiguous Descriptions
"Amazon" maps to Shopping, Bills, and Entertainment depending on context. "Target" is Shopping in the US but a goal in other mental models. Amount and frequency are necessary secondary signals.

### Challenge 4 — Vocabulary Variation
"McDonald's", "McD", "mcdonald", "mcdonald's drive thru #42" must all resolve to Food. Exact-match dictionaries alone fail; normalization is critical.

### Challenge 5 — No External Compute
There is no server. Training and inference both run in the browser JS thread. No GPU, no worker threads (unless we add a Web Worker), and a hard memory budget shared with the rest of the page. TensorFlow.js (~4MB) is overkill and the neural net weights cannot fit in `localStorage`'s ~5MB quota alongside expense data.

### Challenge 6 — Label Noise
Users sometimes mis-categorize expenses, then fix them later. The model must consume corrections as negative feedback without becoming brittle.

### Challenge 7 — Incremental Updates
Full retraining on every keystroke is too expensive. The model must update incrementally as expenses are added, edited, or deleted, and cache its state between renders.

### Challenge 8 — localStorage Quota
`localStorage` has a hard limit of ~5MB per origin (browser-dependent). Expense data + ML model state must coexist. The ML layer must gracefully degrade when storage is exhausted rather than blocking the app.

---

## 2. Data — What to Collect and How

### Primary Training Signal — Existing expense history

Every `Expense` object already contains `{description, category}`. This is a perfectly labeled dataset the user has been building since they started. On model initialization, all existing expenses are treated as training examples.

- **localStorage key:** `"expense-tracker-data"` (already exists)

### Secondary Training Signal — Suggestion feedback

Stored separately to keep ML state from corrupting expense data.

- **localStorage key:** `"expense-tracker-ml"`

```ts
{
  version: string,          // e.g. "1.0.0" — bump to force retrain
  trainedAt: string,        // ISO timestamp
  acceptedCount: number,    // suggestions the user accepted (didn't change)
  overrideCount: number,    // suggestions the user overrode
  vendorMap: {              // Tier 2: normalized vendor → last used category
    [normalizedKey: string]: Category
  },
  bayesModel: {             // Tier 3: Naive Bayes frequency tables
    classCounts: Record<Category, number>,
    tokenCounts: Record<Category, Record<string, number>>,
    vocabulary: string[]
  }
}
```

### Features Extracted from Description (at inference time)

1. **Normalized tokens**
   - Lowercase
   - Strip punctuation (except `$` which may signal embedded prices)
   - Remove common noise words: `"the"`, `"a"`, `"at"`, `"#"`, digits-only tokens
   - Split on whitespace and common separators (`/`, `-`, `_`)
   - Example: `"McDonald's Drive Thru #42"` → `["mcdonald", "drive", "thru"]`

2. **First-token (vendor proxy)**
   - The first normalized token is the most reliable vendor signal
   - Weighted 2× in the Naive Bayes feature vector

3. **Amount range (categorical)**

   | Label | Range |
   |---|---|
   | `micro` | amount < 5 |
   | `small` | 5 ≤ amount < 25 |
   | `medium` | 25 ≤ amount < 100 |
   | `large` | 100 ≤ amount < 500 |
   | `xl` | amount ≥ 500 |

   Added as a synthetic token (e.g., `"AMOUNT_small"`) to the feature vector.

4. **Day of week** *(optional — low weight, future enhancement)*
   - `"DOW_friday"` etc., useful for Entertainment detection (weekend concerts)

> **Privacy note:** No PII is transmitted anywhere. All features are derived locally and stored locally. The description text is tokenized and stored only as token frequency counts inside `bayesModel`, not verbatim.

---

## 3. ML Approaches — Tiered Architecture

The system uses three tiers in priority order. Each tier returns a result only when its confidence exceeds a threshold; otherwise execution falls to the next tier.

### Tier 1 — Rule-Based Keyword Lookup

*Always active. Zero data required.*

A curated dictionary of normalized merchant name fragments mapped to categories. This is the cold-start solution and always the fastest path.

- **Implementation:** `const KEYWORD_RULES: Array<{ pattern: RegExp, category: Category }>`
- **Location:** `lib/ml-categorizer.ts`
- **Confidence returned:** `0.85`
- **Fallthrough:** if no rule matches → Tier 2

Sample rules:

```
Food:           /\b(mcdonald|burger|pizza|sushi|starbucks|chipotle|subway|
                   doordash|ubereats|grubhub|coffee|bakery|restaurant|diner|
                   taco|ramen|noodle|grill|cafe|deli|eatery|panera|chick)\b/

Transportation: /\b(uber|lyft|taxi|metro|transit|gas|shell|chevron|exxon|
                   bp|citgo|parking|tolls|amtrak|delta|united|southwest|
                   airline|flight|train|bus|hertz|avis|enterprise)\b/

Entertainment:  /\b(netflix|spotify|hulu|disney|amazon prime|hbo|apple tv|
                   steam|playstation|xbox|ticketmaster|concert|cinema|movie|
                   theater|museum|bowling|golf|gym|fitness)\b/

Shopping:       /\b(amazon|target|walmart|costco|best buy|ebay|etsy|zara|
                   h&m|gap|nike|adidas|apple store|ikea|wayfair|chewy)\b/

Bills:          /\b(electric|water|gas bill|internet|comcast|xfinity|at&t|
                   verizon|t-mobile|insurance|rent|mortgage|hoa|student loan|
                   credit card|utilities|phone bill|spectrum)\b/
```

---

### Tier 2 — Vendor Memory

*Personalized exact-match. Accumulates quickly.*

A dictionary of `normalized description → last used category`, built from the user's own history. When a returning vendor is detected, this is the highest-accuracy signal available.

- **Implementation:** `vendorMap` in `"expense-tracker-ml"` localStorage state
- **Populated:** on every `addExpense` / `updateExpense` call
- **Key:** `normalize(description)` using the same tokenizer as Tier 1
- **Confidence returned:** `0.90`
- **Fallthrough:** if no vendor match → Tier 3

Example entries:

| Key | Category |
|---|---|
| `"trader joe's"` | Food |
| `"comcast"` | Bills |
| `"amazon"` | Shopping |

**Disambiguating ambiguous vendors (e.g., "Amazon"):**

The `vendorMap` uses a compound key of `vendor|amount_range` for known-ambiguous merchants:

```
vendorMap["amazon|AMOUNT_small"] → Entertainment  (e.g., Kindle book)
vendorMap["amazon|AMOUNT_large"] → Shopping       (e.g., electronics)
```

The map self-corrects over time as the user's choices accumulate.

---

### Tier 3 — Multinomial Naive Bayes Text Classifier

*Statistical ML. Activates after 15+ expenses.*

A classic probabilistic text classifier over token feature vectors. Works well with 20–1,000 labeled examples.

**Why Naive Bayes over alternatives:**

| Approach | Problem |
|---|---|
| Linear SVM | Requires matrix operations; no good pure-TS libraries |
| KNN | O(n×vocab) distance per query; too slow as n grows |
| Logistic regression | Gradient descent is complex to implement incrementally |
| **Naive Bayes** | Closed-form update, O(vocab) inference, proven for text |

**Model state (stored in localStorage):**

```ts
classCounts:  { Food: 42, Transportation: 18, ... }    // P(class)
tokenCounts:  { Food: { mcdonald: 7, coffee: 12 } }    // P(token|class)
vocabulary:   ["mcdonald", "coffee", "shell", ...]     // V
```

**Training algorithm (incremental):**

```
For each new labeled example (tokens[], category):
  classCounts[category] += 1
  for token in tokens:
    tokenCounts[category][token] = (tokenCounts[category][token] || 0) + 1
    if token not in vocabulary: vocabulary.push(token)
```

**Inference (Laplace-smoothed log-probability):**

```
For each category C:
  logP(C) = log(classCounts[C] / total_examples)
  for token in queryTokens:
    logP(C) += log(
      ((tokenCounts[C][token] || 0) + 1) /
      (sum(tokenCounts[C].values()) + vocabulary.length)
    )

prediction = argmax(logP(C))
confidence  = softmax(logP values)[prediction]
```

**Thresholds:**

| Threshold | Value |
|---|---|
| Show suggestion badge | `confidence ≥ 0.60` |
| Auto-select category | `confidence ≥ 0.82` |
| Minimum expenses to activate | `15` |

---

### Combined Prediction Pipeline

```ts
function predict(
  description: string,
  amount: number,
  expenses: Expense[]
): { category: Category; confidence: number; source: 'rules' | 'vendor' | 'bayes' } | null

// 1. Tokenize
tokens = tokenize(description)
if (tokens.length === 0) return null

// 2. Tier 1 — keyword rules
result = matchKeywordRules(tokens)
if (result.confidence >= 0.85) return result

// 3. Tier 2 — vendor memory
result = lookupVendorMap(tokens, amount)
if (result.confidence >= 0.90) return result

// 4. Tier 3 — Naive Bayes
if (expenses.length >= 15) {
  result = bayesClassify(tokens, amount)
  if (result.confidence >= 0.60) return result
}

return null  // no suggestion
```

---

### Rejected Approaches

| Approach | Reason rejected |
|---|---|
| TensorFlow.js neural net | +2–4MB bundle; weights can't fit in localStorage; no benefit over Naive Bayes below 1,000 samples |
| External API (Claude/OpenAI) | Requires exposing API key in browser; sends financial data to third party; adds latency and cost per keystroke. Noted as a future paid-tier feature with a backend proxy |
| KNN over raw descriptions | Edit-distance: O(n×len²) per query. Word embedding KNN requires ~20MB GloVe table |
| BERT / sentence-transformers | Model size alone (~100MB) is a non-starter |

---

## 4. Privacy and Data Security

> **Design guarantee:** No expense data or ML state ever leaves the browser.

### By-design protections

- All training and inference runs in-browser in TypeScript.
- No network requests. No analytics SDK.
- The Naive Bayes model stores token frequencies, not raw descriptions. Even if the ML state were exfiltrated, it reveals category associations of word fragments — not actual expense records.
- GDPR/CCPA compliant by default: no data collection, no consent required.

### XSS risk (`localStorage` is XSS-readable)

Any injected third-party script can read all `localStorage` keys.

- **Mitigation:** Strict `Content-Security-Policy` headers via Next.js `next.config.js` `headers()` — block inline scripts and restrict sources.
- **Mitigation:** Never `eval()` description strings; use only structured parsing.

### localStorage data hygiene

- ML state is versioned. Old or corrupt state is silently discarded and rebuilt from expense history. Never crash on malformed ML storage.
- Provide a **"Reset Suggestions"** option in Settings that clears `"expense-tracker-ml"` but preserves expense data.

### If a Claude API integration is added in future

- User must explicitly opt in ("Enable AI-powered suggestions").
- A clear modal must explain: *"Your expense descriptions are sent to Anthropic to generate category suggestions."*
- Descriptions should be sent without the amount (less sensitive).
- The opt-in state is stored in localStorage; **default is off**.
- A backend proxy (Next.js API route or separate server) must hold the API key — never embed it in the client bundle.

---

## 5. User Experience Flow

### Flow A — Adding a new expense (happy path)

1. User opens the "Add Expense" form.
2. User types in the Description field: `"Starbucks latte"`
3. After a 300ms debounce, `predict()` is called.
4. Tier 1 matches `/coffee|starbucks/` → Food, confidence 0.85.
5. Since confidence ≥ 0.82: Category dropdown **auto-selects "Food"**.
6. A badge appears below the dropdown: `[ 🍔 Food · Auto-suggested ✓ ]`
7. User fills in Amount and Date, clicks "Add Expense".
8. On submit:
   - `vendorMap["starbucks latte"]` updated to Food
   - `bayesModel` updated incrementally with tokens `["starbucks", "latte"]`
   - `acceptedCount++`

### Flow B — User overrides a suggestion

1. User types `"Amazon"` → Shopping is auto-suggested (confidence 0.85).
2. User opens Category dropdown and selects **Entertainment** (Kindle book).
3. On submit:
   - `vendorMap["amazon|AMOUNT_small"]` → Entertainment
   - `bayesModel` updated with `category=Entertainment`
   - `overrideCount++`
4. Next time the user types `"Amazon"` with a small amount, Tier 2 returns Entertainment at confidence 0.90.

### Flow C — No suggestion (low confidence)

1. User types `"misc stuff"` (ambiguous).
2. `predict()` returns `null` — no tier reaches its threshold.
3. Category dropdown shows default placeholder: *"Select category"*.
4. No badge is shown. User selects manually.
5. The choice is still recorded to train the model.

### Flow D — First-time user (cold start)

1. 0 expenses. Tier 2 and Tier 3 are inactive.
2. Only Tier 1 (rules) is active.
3. User types `"Netflix"` → Entertainment, confidence 0.85. Works immediately.
4. No onboarding interruption — suggestions appear naturally.
5. After 15 expenses, Tier 3 activates silently.

### UI Components Needed

| Component | Description |
|---|---|
| `CategorySuggestionBadge` | Shows icon + category name + source label. Props: `{ suggestion: Prediction \| null }`. States: auto-selected (filled badge), suggested-only (outlined badge), none |
| `ExpenseForm` (modified) | Debounced `onChange` on description input; passes suggestion to badge; auto-selects category when confidence ≥ threshold |

### Debounce Strategy

- 300ms after last keystroke → run `predict()`
- Cancels previous timer on each keystroke
- Does **not** run on empty string
- Implementation: `useRef` + `setTimeout` inside a `useCallback`

---

## 6. Edge Cases and Error Handling

| Edge Case | Input Example | Strategy |
|---|---|---|
| Empty / trivially short description | `""`, `"a"`, `"#"` | After tokenize: `tokens.length === 0` → return null |
| All-numeric description | `"12345"`, `"00004"` | Digits-only tokens are filtered → return null |
| Non-English description | `"Supermercado Pão de Açúcar"` | Tier 1 won't match; Tier 2 may; Tier 3 learns tokens. Lower accuracy — documented limitation |
| Biased training data (one category dominates) | Only Food expenses for a month | Cap any single class's prior at 80% maximum: `Math.min(classCounts[c], 0.8 * totalExamples)` |
| User edits an expense's category | Changes Food → Shopping | Decrement old token counts, increment new ones. `vendorMap` overwrites with new category |
| User deletes an expense | Any deletion | Lazy retract — rebuild full Naive Bayes model from current expense array on next page load (~5ms for 500 expenses) |
| `localStorage` quota exceeded | Storage full | Catch `QuotaExceededError`; log warning; degrade gracefully to Tier 1 only. Never block expense saving |
| Corrupt ML state | JSON parse failure, missing fields, version mismatch | Wrap reads in try/catch; discard and rebuild from expense array |
| Very long description | Pasted receipt text | Tokenizer caps input at 150 characters; feature vector stays bounded |
| Description is only stopwords | `"the at a to"` | After stopword removal: `tokens = []` → return null |
| Suggestion flicker during rapid typing | Typing "Netflix" letter by letter | Debounce timer resets on each keystroke; `predict()` fires only once the user pauses |
| Model drift (accuracy declines) | Override rate > 30% | Surface non-intrusive message: *"Suggestions don't seem to be helping. You can turn them off in Settings."* Do not auto-disable |

---

## 7. Deployment and Maintenance Strategy

### Versioning

The ML state in `localStorage` carries a `version` field matching a constant in `lib/ml-categorizer.ts`:

```ts
export const ML_VERSION = "1.0.0";
```

On app load, if `stored.version !== ML_VERSION`, discard the stored model and rebuild from the expense array. Rebuild is cheap (~5ms for 500 expenses) and transparent to the user. Bump `ML_VERSION` when:
- The Tier 1 keyword dictionary changes significantly
- The Naive Bayes model schema changes

### Shipping Keyword Dictionary Updates

The rule-based keyword dictionary in `lib/ml-categorizer.ts` is bundled with the Next.js static build. Updates ship with code deploys. No separate model artifact, no model hosting, no CDN. To add a new merchant rule: add a pattern to the relevant `KEYWORD_RULES` entry and bump `ML_VERSION`.

### Performance Budget

| Operation | Target |
|---|---|
| `tokenize()` | < 1ms |
| Tier 1 `matchKeywordRules()` | < 1ms (regex battery) |
| Tier 2 `lookupVendorMap()` | < 0.1ms (hash lookup) |
| Tier 3 `bayesClassify()` | < 5ms (vocabulary of 2,000 tokens) |
| Total `predict()` call | < 10ms |
| Model build from 500 expenses | < 20ms (runs at startup, not per-keystroke) |

All well within the 16ms frame budget. No Web Worker needed unless the user accumulates > 10,000 expenses (unlikely for a personal tracker).

### Accuracy Monitoring (client-side only, no telemetry)

Track in localStorage ML state:

```ts
acceptedCount: number   // suggestion was not changed by user
overrideCount: number   // user changed the suggestion
```

Surface in a "Smart Suggestions" settings panel:

> *"Correctly suggested 87% of the time (based on 46 suggestions)"*

### Feature Flag

- **localStorage key:** `"expense-tracker-ml-enabled"` (boolean)
- **Default:** `true`
- **Accessible via:** Settings toggle — *"Smart Category Suggestions"*
- When `false`: `predict()` short-circuits to `null`. Model state is preserved so it resumes accurately when re-enabled.

### Testing Strategy

Manual test matrix (no test runner currently configured):

- [ ] Type `"Starbucks"` → Food auto-selected
- [ ] Type `"Netflix"` → Entertainment auto-selected
- [ ] Type `"Comcast"` → Bills auto-selected
- [ ] Type `"random xyz"` → no suggestion
- [ ] Override a suggestion → next time same description, override category wins
- [ ] Clear expenses → model rebuilds gracefully on next add
- [ ] Fill `localStorage` to quota → app does not crash, expense saves succeed
- [ ] Disable suggestions in settings → no badge appears
- [ ] Re-enable suggestions → model resumes correctly

The pure ML functions (`tokenize`, `bayesClassify`, `matchKeywordRules`) can be manually unit-tested in the browser console with fixture data. When a test runner is added to the project they are straightforward to unit test.

### File Structure

**New files to create:**

| File | Role |
|---|---|
| `lib/ml-categorizer.ts` | All ML logic: tokenizer, Tier 1/2/3, `predict()`, `loadMLState()`, `saveMLState()` |
| `hooks/useMLCategorizer.ts` | React hook wrapping `predict()`, managing debounce, exposing `{ suggestion, isLoading }` |
| `components/CategorySuggestionBadge.tsx` | UI badge for the suggestion |

**Files to modify:**

| File | Change |
|---|---|
| `components/ExpenseForm.tsx` | Add description `onChange` handler; pass suggestion to badge; auto-select category when confident |
| `hooks/useExpenses.ts` | After `addExpense`/`updateExpense`, call `updateMLState()` |
| `types/expense.ts` | Add `MLState` type for typed localStorage access |

---

## Implementation Order

### Phase 1 — Core ML engine (no UI yet)

- **1a.** `lib/ml-categorizer.ts`: tokenizer + `KEYWORD_RULES` (Tier 1)
- **1b.** `lib/ml-categorizer.ts`: `vendorMap` logic (Tier 2)
- **1c.** `lib/ml-categorizer.ts`: Naive Bayes train/classify (Tier 3)
- **1d.** `lib/ml-categorizer.ts`: `predict()` orchestrator
- **1e.** `lib/ml-categorizer.ts`: `loadMLState()` / `saveMLState()` with version check

### Phase 2 — React integration

- **2a.** `hooks/useMLCategorizer.ts`: debounced prediction hook
- **2b.** `hooks/useExpenses.ts`: call `updateMLState` after mutations

### Phase 3 — UI

- **3a.** `components/CategorySuggestionBadge.tsx`
- **3b.** `components/ExpenseForm.tsx`: wire description → prediction → badge → category

### Phase 4 — Settings and polish

- **4a.** Settings toggle for enabling/disabling suggestions
- **4b.** Accuracy stats display
- **4c.** "Reset Suggestions" button

---

## Summary

The recommended system is a **three-tier hybrid**:

| Tier | Mechanism | Activates | Confidence |
|---|---|---|---|
| 1 — Rules | Keyword regex dictionary | Always (day one) | 0.85 |
| 2 — Memory | Normalized vendor lookup | After first expense | 0.90 |
| 3 — Bayes | Multinomial Naive Bayes | After 15 expenses | Variable |

All three tiers are implemented in **pure TypeScript**, run entirely in the browser, store state only in `localStorage`, and impose **zero network requests**. The system is privacy-first by architecture, not by policy.

The UX is non-intrusive: suggestions appear as badges, auto-selection only triggers at high confidence, and every user override feeds back into the model. The feature can be disabled with a single toggle and resumes accurately when re-enabled.

No external dependencies are required beyond what is already in the project.
