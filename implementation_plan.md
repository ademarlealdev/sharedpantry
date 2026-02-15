
# Refine Pantry Interactions and Management

The user reported that items are not updating correctly when switching pantries. Additionally, there is no way to delete pantries from the settings view.

## Proposed Changes

### [Component] useSyncStore (store/useSyncStore.ts)
- **Fix Sync Race Condition**: Implement an `isCurrent` flag inside the `Data Sync Effect` to ensure that stale fetches from a previously selected pantry don't overwrite current items.
- **Implement `deletePantry`**: Add logic to delete a pantry. If the user is the owner, it will delete the pantry and all its items/members.
- **Implement `leavePantry`**: Allow users to remove themselves from a pantry they joined (but don't own).

### [Component] PantryManager (components/PantryManager.tsx)
- **Delete/Leave Buttons**: Add a "Delete Pantry" button for owners and a "Leave Pantry" button for members.
- **Confirmation Dialog**: Add a simple browser `confirm()` to prevent accidental deletions.

### [Component] PantrySwitcher (components/PantrySwitcher.tsx)
- No changes needed, but ensure it relies on the store's cleared state.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no syntax or type errors.

### Manual Verification
- Create two pantries. Add different items to each.
- Switch between them and verify items update instantly and correctly.
- Delete a pantry and verify it disappears from the list.
