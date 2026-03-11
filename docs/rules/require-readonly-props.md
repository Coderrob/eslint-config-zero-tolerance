# require-readonly-props

Require JSX component props to be typed as readonly.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Component props are inputs and should be treated as immutable. Requiring readonly props makes mutation attempts fail at compile time and keeps component behavior predictable.

## Examples

### Correct

```typescript
type Props = { name: string };

function Greeting(props: Readonly<Props>) {
  return <div>{props.name}</div>;
}
```

```typescript
function Greeting(props: { readonly name: string }) {
  return <div>{props.name}</div>;
}
```

### Incorrect

```typescript
type Props = { name: string };

function Greeting(props: Props) {
  return <div>{props.name}</div>;
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-readonly-props': 'error'
```
