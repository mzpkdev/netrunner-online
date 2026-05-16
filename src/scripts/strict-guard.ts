/**
 * Regression guard for `strict: true` in `tsconfig.json`.
 *
 * Each `@ts-expect-error` below is satisfied only while the corresponding
 * strict sub-flag is active. If `strict: true` is ever removed, TypeScript
 * reports "Unused '@ts-expect-error' directive" on the now-unneeded
 * suppression, and `npm run typecheck` fails.
 *
 * Do not add production code here. This file exists solely to anchor the
 * strict compiler flag against accidental removal.
 */

// --- strictFunctionTypes -------------------------------------------------
// Parameter types are checked contravariantly under strictFunctionTypes.
// Without it, the check is bivariant: assigning (x: "a") => void to
// (x: string) => void succeeds because "a" extends string. Under
// strictFunctionTypes the target's parameter (string) must extend the
// source's parameter ("a"), which it does not — so the assignment is a
// type error, satisfying the directive below.
type _StringFn = (x: string) => void;
// @ts-expect-error strictFunctionTypes: contravariant parameter mismatch
const _fnGuard: _StringFn = (_x: "a") => {};

// --- useUnknownInCatchVariables ------------------------------------------
// Catch-clause variables are typed as `unknown` under this flag (rather than
// `any`). Accessing a property on `unknown` is a type error, satisfying the
// directive below. Without the flag, `e` is `any` and the access is silent.
try {
    JSON.parse("{}"); // any call that can throw keeps the catch block reachable
} catch (e) {
    // @ts-expect-error useUnknownInCatchVariables: property access on unknown
    void e.message;
}

// --- strictBindCallApply -------------------------------------------------
// Under this flag, .call() / .bind() / .apply() are typed precisely against
// their target's signature. Without it, those methods accept `any[]` arguments
// and no mismatch is reported. Passing a string where number is required is
// only a type error when strictBindCallApply is active.
function _numFn(_x: number): void {}
// @ts-expect-error strictBindCallApply: mismatched argument type in .call()
_numFn.call(null, "not-a-number");

// Convert file to module scope to prevent global namespace pollution.
// Without this line TypeScript treats the file as a script and every
// declaration above becomes a global identifier visible to all included files.
export {};
