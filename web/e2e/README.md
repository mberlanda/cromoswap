# E2E tests & the test-id naming convention

Two Playwright suites:

- **`web/e2e/`** — local-mode flows against the Vite preview (`npm run e2e`).
- **`web/e2e-docker/`** — full-stack flows against the composed image
  (`npm run e2e:docker`, see `scripts/validate-e2e.sh`).

## ⚠️ Two different test-id attributes — do not confuse them

This repo deliberately uses **two** attributes, because Playwright and Testing
Library default to different names:

| Attribute | Used by | Why |
|-----------|---------|-----|
| **`data-test-id`** (with hyphens) | **Playwright e2e** | Both Playwright configs set `use.testIdAttribute: 'data-test-id'`, so `page.getByTestId('view-board')` resolves `data-test-id="view-board"`. |
| **`data-testid`** (no hyphen) | **Vitest / Testing Library unit tests** | Testing Library's default `testIdAttribute` is `data-testid`. Only a couple of elements use it (e.g. `MaskOverlay`'s `sticker-frame`, `roi-box`). |

### Consequences (the trap)

- `screen.getByTestId('x')` in a **unit test** looks for **`data-testid="x"`** —
  it will **NOT** find an element that only has `data-test-id="x"`.
- `page.getByTestId('x')` in an **e2e test** looks for **`data-test-id="x"`**.

So a `data-test-id` you add for e2e is invisible to `getByTestId` in unit tests,
and vice-versa.

## Rules of thumb

1. **Add `data-test-id` for e2e hooks.** When a Playwright spec needs to click or
   read an element, give it a stable `data-test-id` and select with
   `getByTestId`. Never select by styling class or copy in e2e.
2. **Unit tests query by role/label/text**, the accessible way
   (`getByRole`, `getByLabelText`, `getByText`). Reserve `getByTestId`
   (→ `data-testid`) for the rare cases where there's no accessible handle.
3. **Don't flip the global `testIdAttribute`** in `test/setup.ts` to
   `data-test-id` — it would break the existing `data-testid` unit lookups.
4. The `data-test-id` registry lives in [`../../docs/test-matrix.md`](../../docs/test-matrix.md).
