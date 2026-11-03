# no-query-side-effects

Keep query functions from changing shared state while allowing local calculations.

Type: suggestion. No automatic fix. No options.

## What it checks

Checks function names that start with get, is, has, can, or should followed by an uppercase letter or underscore, such as getUser and is_ready.

Reports assignments, updates, deletes, and recognized mutating method calls that affect arguments, outer variables, this, or shared objects. Optional calls and static computed property names follow the same checks.

Local variables may be reassigned. Direct writes to fresh local arrays and objects are allowed, including containers declared with TypeScript assertions. Rebinding a parameter is local; changing an object passed as a parameter is shared mutation.

## Examples

```typescript
function getItems() {
  const items = [] as number[];
  items.push(1); // Allowed: builds a fresh local result.
  return items;
}

function getUser(user) {
  user.visits++; // Reported: changes the caller's object.
  return user;
}
```

## When a local object becomes shared

Passing an object to another function, creating an alias, or capturing it in a closure can expose it outside the query. Later writes are checked. If a loop reuses and exposes the same object, writes on later iterations are also checked. A new object created inside each iteration can still be built locally before it is exposed.

Writes through getters or setters remain checked because they may change shared state. Nested property writes also remain checked: a fresh outer object can contain shared inner objects. Casting a shared object does not make it local.

## Limits

The rule does not inspect the bodies of arbitrary called functions. Method names are used to recognize likely mutations. Each nested function is checked in its own scope. Other immutability rules may reject local mutations that this rule allows.
