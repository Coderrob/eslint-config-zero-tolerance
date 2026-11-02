# no-raw-sql-interpolation

Disallow interpolated raw SQL and unsafe raw query helpers.

## Rule Details

| Property        | Value     |
| --------------- | --------- |
| **Type**        | `problem` |
| **Fixable**     | No        |
| **Recommended** | `warn`    |
| **Strict**      | `error`   |

## Rationale

SQL strings built with interpolation or concatenation are injection-prone. Use parameterized calls or an approved tagged query builder.

## Examples

### Correct

```typescript
db.query('select * from users where id = ?', [id]);

sql`select * from users where id = ${id}`;
```

### Incorrect

```typescript
db.query(`select * from users where id = ${id}`);

db.execute('delete from users where id = ' + id);

prisma.$queryRawUnsafe('select * from users');
```

Calls without arguments and calls that spread their first argument do not report interpolation. A diagnostic points to the interpolated argument only after it has been validated.

## Configuration

```js
'zero-tolerance/no-raw-sql-interpolation': ['error', {
  allowedTags: ['sql', 'Prisma.sql', 'db.sql'],
  additionalSinkNames: []
}]
```
