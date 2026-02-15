
# Fix Authentication and Login Flow

The recent "robustness" changes introduced a `fired` flag that inadvertently blocked subsequent login attempts. If the app initially checked for a session and found none, it marked itself as "processed," preventing the `SIGNED_IN` event from actually updating the user state.

## Proposed Changes

### [Component] useSyncStore (store/useSyncStore.ts)

I will refactor the `useEffect` responsible for authentication:
- **Remove the global `fired` flag**: This was too restrictive.
- **Implement a more granular guard**: Instead of a single flag, I'll ensure that the background pantry fetching only runs if the user has changed or if data isn't initialized yet.
- **Properly handle `SIGNED_IN` and `SIGNED_OUT` events**: Ensure they always update the `state.user` immediately.
- **Maintain the 5-second safety timeout**: This is still useful to prevent stuck loading screens due to network issues.

## Verification Plan

### Automated Tests
- I'll run `npm run build` to ensure no syntax errors were introduced.

### Manual Verification
- I'll ask the user to verify that they can now sign in correctly and that the loading screen still disappears in a timely manner.
