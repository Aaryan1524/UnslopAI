# Interactive Component Patterns — Accessible State-Machine Blueprints

Every interactive surface must ship with a deterministic state machine, full keyboard operation, WCAG AA contrast, `prefers-reduced-motion` support, and `>= 44×44px` mobile touch targets. Never render non-functional visual shells.

---

## Global Interaction Invariants (Apply to All 6 Patterns)

- **Keyboard & Focus:** `Tab` / `Shift+Tab` inside modals stays trapped; `Escape` closes the topmost overlay and restores focus to `triggerElement.focus()`.
- **ARIA Contract:** Keep `aria-expanded`, `aria-controls`, `aria-selected`, `aria-pressed`, `aria-invalid`, and `aria-live="polite"` synchronized with real state—never hardcoded.
- **Inert Background:** Apply `inert` (or `aria-hidden="true"` + scroll lock) to `<main>` when a modal dialog or slide-over drawer is open so screen readers and keyboard focus never escape behind the backdrop.
- **Motion & Mobile:** Transitions fall back to instant opacity/state swaps under `@media (prefers-reduced-motion: reduce)` or `[data-motion="reduced"]`. Interactive buttons/tabs maintain `min-height: 44px; min-width: 44px;` on mobile viewports (`<= 768px`).

---

## 1. Command Palette (`Cmd+K` / `Ctrl+K`)

- **States:** `closed` -> `open(query, activeIndex)` -> `executing(item)` -> `closed`
- **ARIA:** Trigger button (`aria-haspopup="dialog"`, `aria-expanded`); overlay (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`); input (`role="combobox"`, `aria-expanded="true"`, `aria-controls="cmd-list"`, `aria-activedescendant="cmd-opt-N"`); list (`role="listbox"`); rows (`role="option"`, `aria-selected`).
- **Keyboard:** Global `Meta+k` / `Ctrl+k` toggles open (ignore when typing inside another `<input>`/`<textarea>` unless explicitly desired); `ArrowDown`/`ArrowUp` wraps `activeIndex`; `Enter` activates selected option; `Escape` closes and restores focus.

**Vanilla ESM Blueprint:**
```js
export function createCommandPalette({ trigger, dialog, input, list, items, onSelect }) {
  let open = false;
  let activeIndex = 0;
  let filtered = items;
  let lastFocus = null;

  const render = () => {
    list.innerHTML = filtered
      .map(
        (item, idx) =>
          `<li id="cmd-opt-${idx}" role="option" aria-selected="${idx === activeIndex}" data-idx="${idx}">${item.label}</li>`,
      )
      .join('');
    input.setAttribute('aria-activedescendant', filtered[activeIndex] ? `cmd-opt-${activeIndex}` : '');
  };

  const setOpen = (next) => {
    open = next;
    trigger.setAttribute('aria-expanded', String(open));
    dialog.hidden = !open;
    if (open) {
      lastFocus = document.activeElement;
      input.value = '';
      filtered = items;
      activeIndex = 0;
      render();
      input.focus();
    } else if (lastFocus instanceof HTMLElement) {
      lastFocus.focus();
    }
  };

  const onKeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(!open);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown' && filtered.length) {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % filtered.length;
      render();
    } else if (e.key === 'ArrowUp' && filtered.length) {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
      render();
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      onSelect(filtered[activeIndex]);
      setOpen(false);
    }
  };

  const onInput = () => {
    const q = input.value.trim().toLowerCase();
    filtered = items.filter((it) => it.label.toLowerCase().includes(q));
    activeIndex = 0;
    render();
  };

  document.addEventListener('keydown', onKeydown);
  input.addEventListener('input', onInput);
  trigger.addEventListener('click', () => setOpen(true));
  return () => {
    document.removeEventListener('keydown', onKeydown);
    input.removeEventListener('input', onInput);
  };
}
```

**React Blueprint:** Hold `{ open, query, activeIndex }` in state, store `triggerRef` to restore focus in `useEffect` when `open` transitions `true -> false`, bind the `Meta/Ctrl+k` listener in `useEffect` with cleanup, and reset `activeIndex` to `0` whenever `query` changes.

---

## 2. Mega-Menu (Desktop Disclosure Panel + Mobile Drawer)

- **States:** `idle` -> `panelOpen(activeMenuId)` -> `idle` (mobile switches to full-height accordion drawer)
- **ARIA:** Do **not** abuse `role="menu"` for site navigation with links and descriptions—use disclosure `<button aria-expanded="false" aria-controls="panel-id">` inside `<nav aria-label="Primary">` controlling a `<div id="panel-id" hidden>`.
- **Keyboard:** `Enter`/`Space` toggles panel; `Escape` closes panel and returns focus to the owning `<button>`; moving focus outside the `<nav>` (`focusout` check against `!nav.contains(e.relatedTarget)`) closes cleanly; optional hover intent uses a `150ms` close delay so diagonal cursor travel never flickers shut.

**Vanilla ESM / React Contract:**
- **Vanilla ESM:** Maintain a single `activeId` string (`null` when closed). Clicking a trigger toggles `activeId = activeId === id ? null : id`, updates `aria-expanded` on all triggers, toggles `hidden` on all panels, and listens for `Escape` + outside `pointerdown`.
- **React:** Track `activeId` in `SiteHeader`, attach a `ref` to `<header>` for outside-click/focusout dismissal, and render mobile navigation in a dedicated `role="dialog" aria-modal="true"` drawer with `min-h-[44px]` accordion rows.

---

## 3. Filterable Catalog + Detail Drawer

- **States:** `{ category, query, sort, selectedItemId }` — keep filter state independent from drawer open/close state so closing a detail drawer preserves the visitor's active filters and scroll position.
- **ARIA:** Filter controls use `role="tablist"` / `role="tab"` (`aria-selected`) or toggle buttons (`aria-pressed`); results count announces via `<p role="status" aria-live="polite">Showing N items</p>`; detail drawer uses `role="dialog" aria-modal="true" aria-labelledby="drawer-title"`.
- **Keyboard:** Selecting a catalog card opens the drawer and focuses the drawer close button or heading; `Escape` or backdrop click closes the drawer and restores focus to the exact card button that opened it.

**Vanilla ESM / React Contract:**
- **Vanilla ESM:** Keep pure `filterItems(items, state)` returning matching records; store `lastTriggerBtn` before opening the drawer; render empty state with a working `"Reset filters"` button (`min-height: 44px`).
- **React:** Derive `visibleItems` via `useMemo([items, category, query, sort])`, keep `selectedId` in state (optionally synced to URL search params), and save `triggerRef.current` on card click so closing restores focus deterministically.

---

## 4. Pricing Toggle & Calculator

- **States:** `{ billingCycle: 'monthly' | 'annual', seats: number, usageTier: number }`
- **ARIA:** Billing switch uses `<button role="switch" aria-checked="true|false">` (or segmented radio group `role="radiogroup"` + `role="radio"`); range slider uses `<label for="seats">` + `<input id="seats" type="range" min max step aria-valuetext="25 seats">`; calculated total sits inside an `aria-live="polite"` container with `font-variant-numeric: tabular-nums` so digits never jitter horizontally.
- **Keyboard:** `Space`/`Enter` toggles billing switch; `ArrowLeft`/`ArrowRight`/`Home`/`End` adjust range inputs natively.

**Vanilla ESM Blueprint:**
```js
export function bindPricingCalculator({ toggleBtn, rangeInput, priceOutput, unitMonthly, annualDiscount = 0.2 }) {
  const state = { annual: true, seats: Number(rangeInput.value) || 10 };

  const compute = () => {
    const rate = state.annual ? unitMonthly * (1 - annualDiscount) : unitMonthly;
    const total = Math.round(rate * state.seats);
    toggleBtn.setAttribute('aria-checked', String(state.annual));
    rangeInput.setAttribute('aria-valuetext', `${state.seats} seats`);
    priceOutput.textContent = `$${total.toLocaleString()}/mo`;
  };

  toggleBtn.addEventListener('click', () => { state.annual = !state.annual; compute(); });
  rangeInput.addEventListener('input', () => { state.seats = Number(rangeInput.value); compute(); });
  compute();
}
```

**React Blueprint:** Keep `{ annual, seats }` in `useState`, compute `monthlyTotal` synchronously during render (no derived-state `useEffect`), and pass `annual` + `seats` cleanly into the CTA action so downstream checkout/drawer reflects the selected configuration.

---

## 5. Multi-Step Validated Form

- **States:** `{ step: 0..N-1, values, errors, status: 'editing' | 'submitting' | 'submitted' | 'error' }`
- **ARIA:** Step indicator uses `<ol aria-label="Progress">` with `aria-current="step"` on the active item; each invalid input sets `aria-invalid="true"` and `aria-describedby="field-error-id"`; error summary uses `role="alert"` on failed step advance; `Next`/`Back` buttons stay `>= 44px` tall.
- **Keyboard & Focus:** On failed step validation, move focus to the **first invalid input** rather than failing silently; on valid step advance, move focus to the new step's `<legend>` or heading (`tabindex="-1"`). Preserve entered values when navigating backward.

**Vanilla ESM / React Contract:**
- **Vanilla ESM:** Validate via per-step validator map `validators[step](values) -> Record<field, message>`. Block advance when `Object.keys(errors).length > 0`, render inline field messages, and swap to a clear confirmation landmark on final submit.
- **React:** Use `useReducer` (`NEXT_STEP`, `PREV_STEP`, `SET_FIELD`, `SET_ERRORS`, `SUBMIT_SUCCESS`), disable submit button with `aria-busy="true"` while `status === 'submitting'`, and render an accessible reset/done action after completion.

---

## 6. Slide-Over Cart / Booking Drawer

- **States:** `{ open, items: Array<{ id, title, unitPrice, qty }>, notes }`
- **ARIA:** Trigger badge button (`aria-haspopup="dialog"`, `aria-expanded`, `aria-label="Open cart, 2 items"`); drawer (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="cart-title"`); subtotal region (`aria-live="polite"`, `tabular-nums`); quantity steppers (`aria-label="Decrease quantity for <Item>"`, `aria-label="Increase quantity for <Item>"`, each `>= 44×44px` on mobile).
- **Keyboard:** `Escape` or backdrop click closes drawer and restores focus to trigger; `Tab` cycles inside drawer (`Close` -> line item controls -> primary checkout CTA); removing the last item shifts focus cleanly to the empty-state message or close button (never leaving focus on a detached DOM node!).

**Vanilla ESM / React Contract:**
- **Vanilla ESM:** Maintain immutable `updateQty(id, delta)` removing entries when `qty <= 0`, sync `badgeCount` on the trigger button, toggle `inert` on `<main>`, and lock body scroll (`overflow: hidden` on `document.body` only while open, restored on close).
- **React:** Manage cart state via `useReducer` + optional `localStorage` hydration inside `useEffect` (SSR-safe), render the drawer through `createPortal` into `document.body` when mounted, trap focus across focusable elements inside the drawer ref, and restore focus to the trigger ref on close.
