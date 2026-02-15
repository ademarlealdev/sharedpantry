
# Refactor to Global State with React Context

The current `useSyncStore` hook maintains local state, leading to inconsistent UI states (e.g., pantry switcher doesn't update the item list) because multiple instances are created.

## Proposed Changes

### [Store] useSyncStore (store/useSyncStore.ts)
- **Create `SyncStoreContext`**: Define a context to hold the state and actions.
- **Create `SyncStoreProvider`**: A provider component that implements the `useSyncStore` logic and provides its return value via context.
- **Update `useSyncStore` hook**: Change it to `const useSyncStore = () => useContext(SyncStoreContext)`.

### [Root] index.tsx
- **Wrap App**: Wrap the root `<App />` component with `<SyncStoreProvider>`.

### Components
- No changes required to `App.tsx`, `PantrySwitcher.tsx`, or `PantryManager.tsx` as they already use `useSyncStore()`. The refactored hook will now pull from the shared context instead of local state.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no syntax errors.

### Manual Verification
- Switch between pantries using the header dropdown.
- Verify that the main grocery list updates immediately with the correct items for the selected pantry.
- Ensure adding/removing items works across all components.
