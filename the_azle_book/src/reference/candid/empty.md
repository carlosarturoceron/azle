# empty

This section is a work in progress.

The Azle type `empty` corresponds to the [Candid type empty](https://internetcomputer.org/docs/current/references/candid-ref#type-empty) and has no JavaScript value at runtime.

TypeScript:

```typescript
import { empty, $query } from 'azle';

$query;
export function get_empty(): empty {
    throw 'Anything you want';
}

// Note: It is impossible to call this function because it requires an argument
// but there is no way to pass an "empty" value as an argument.
$query;
export function print_empty(empty: empty): empty {
    console.log(typeof empty);
    throw 'Anything you want';
}
```

Candid:

```
service : () -> {
    get_empty : () -> (empty) query;
    print_empty : (empty) -> (empty) query;
}
```

dfx:

```bash
dfx canister call candid_canister print_empty '("You can put anything here")'
Error: Failed to create argument blob.
Caused by: Failed to create argument blob.
  Invalid data: Unable to serialize Candid values: type mismatch: "You can put anything here" cannot be of type empty
```