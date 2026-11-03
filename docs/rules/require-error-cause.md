# require-error-cause

Keep the original exception when throwing a replacement error.

Type: problem. No automatic fix. Enable this rule individually; it is not included in a preset.

## What it checks

Checks replacement errors thrown directly inside a catch block. Supports Error, TypeError, RangeError, ReferenceError, SyntaxError, URIError, EvalError, and AggregateError, with or without new.

The cause must refer to the exception caught by that block. Stable aliases and TypeScript assertions preserve that identity. A different value with a matching type does not.

## Examples

```typescript
try {
  readData();
} catch (error) {
  throw new Error('Reading data failed', { cause: error }); // Allowed.
}

try {
  readData();
} catch (error) {
  throw new Error('Reading data failed'); // Reported: loses the original exception.
}
```

Rethrowing the original exception is allowed. AggregateError takes its options object as the third argument. Nested catch blocks must preserve their own caught exception. Use a simple catch parameter when wrapping an error so the original exception remains available.

## Options

| Option              | Default | Meaning                                                                                          |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `errorFactoryNames` | []      | Factory names whose thrown return values must receive the caught exception as a direct argument. |

```js
'zero-tolerance/require-error-cause': ['error', {
  errorFactoryNames: ['wrapError'],
}]
```

## Limits

Reassigning the caught variable before using it as a cause is reported, including conditional writes. An alias or options object that captured the original value before reassignment remains valid. Directly modified options are not trusted. This includes overwriting or deleting a cause through a type assertion or non-null assertion around the options object.

The rule uses source order; it does not trace every possible execution path. Custom or shadowed constructors, nested function bodies, and errors created earlier and thrown through variables are outside its scope.
