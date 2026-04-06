# UX Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 UX issues: month-level timeframe picker, dark mode for all Ionic overlays, equal-height stats cards, step-graph with hover tooltip.

**Architecture:** All changes are to existing components. No new files needed except i18n keys.

**Tech Stack:** Angular 20, Ionic 8, SVG, CSS

---

## Task 1: Enhanced Timeframe Picker with Month Navigation

**Files:**
- Modify: `app2/src/app/shared/components/timeframe-selector/timeframe-selector.component.ts`
- Modify: `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts`
- Modify: `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts`

### What to do:

1. Extend `Timeframe` type to include `'month'`
2. Add `activeMonth` and `activeYear` signals + `showMonthNav` signal
3. Export `getMonthRange(month, year)` function returning `{ start: Date; end: Date }`
4. When user taps "1M", show a second row with arrow-left, "März 2026", arrow-right for month browsing
5. Add `monthChange` output emitting `{ month: number; year: number }`
6. Tapping other segments (1W, 3M, 6M, 1J, Max) hides month nav
7. Update dashboard + contact-detail to listen to `monthChange` and filter by month range
8. Import IonButton, IonIcon; register chevronBack/chevronForward icons

### Consumer changes (dashboard + contact-detail):

Add `activeMonthRange` signal. In `filteredTransactions` computed, when `timeframe() === 'month'`, filter by `monthRange.start <= date <= monthRange.end`.

For graph `graphData` computed: when month mode, calculate starting balance from transactions before the month start (same pattern as existing timeframe logic).

---

## Task 2: Dark Mode for Ionic Overlays

**Files:**
- Modify: `app2/src/styles.scss`

### What to add (append to styles.scss):

Dark mode CSS overrides for:

**ion-alert**: `--background: #2a2a2a`, `.alert-wrapper` bg/color, `.alert-head h2` color, `.alert-message` color, `.alert-input` bg/border/color, `.alert-button` color primary, destructive buttons danger color.

**ion-action-sheet**: `--background: #2a2a2a`, `.action-sheet-group` bg, `.action-sheet-title` color, `.action-sheet-button` primary color, destructive danger color.

**ion-item-divider**: `--background: #2a2a2a`, `--color: #fff`, font-weight 600, font-size 13px.

---

## Task 3: Equal-Height Stats Cards

**Files:**
- Modify: `app2/src/app/features/contacts/components/stats-cards/stats-cards.component.ts`

### What to do:

Replace `ion-grid` / `ion-row` / `ion-col` layout with CSS Grid:

```css
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 16px;
}
.stats-grid ion-card {
  margin: 0;
  min-height: 90px;
  display: flex;
}
.stats-grid ion-card-content { flex: 1; }
```

Remove IonGrid/IonRow/IonCol imports, replace with simple div container.

---

## Task 4: Step-Graph + Hover Tooltip

**Files:**
- Modify: `app2/src/app/features/contacts/components/balance-graph/balance-graph.component.ts`

### Step-graph (horizontal then vertical lines):

Replace the diagonal polyline with a step path. For each consecutive point pair:
- Draw horizontal line from point[i].x to point[i+1].x at point[i].y
- Draw vertical line from point[i].y to point[i+1].y at point[i+1].x

Use SVG `path` with `H` (horizontal) and `V` (vertical) commands instead of `polyline`.

Same for the area fill path — step shape + close to bottom.

### Hover tooltip:

For each data point, render:
1. An invisible rect covering the x-range between midpoints of adjacent points (full chart height) — acts as hover zone
2. A tooltip group (hidden, opacity 0) containing: vertical dashed line, highlighted dot, rounded rect background, value text, date text

After setting SVG content, attach `mouseenter`/`mouseleave`/`touchstart` event listeners to hover zones that toggle tooltip visibility by matching `data-idx` attributes.

Note: The existing render method uses element.textContent assignment for SVG building (via string concatenation). The tooltip event listeners should be attached after the SVG content is set.

---

## Verification

1. **Timeframe**: Contact detail -> tap "1M" -> month nav with arrows -> browse to specific month -> graph/stats filter correctly
2. **Dark mode**: Create contact alert -> dark bg. Contact action sheet -> dark bg. Transaction date dividers -> dark bg.
3. **Stats cards**: All 4 cards same height on any screen size
4. **Step graph**: No diagonal lines, only horizontal+vertical steps. Hover/tap a point -> tooltip with date + balance value.
