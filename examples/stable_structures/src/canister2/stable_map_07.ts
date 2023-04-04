import {
    InsertError,
    nat64,
    Opt,
    $query,
    Result,
    StableBTreeMap,
    $update
} from 'azle';

let stableMap7 = new StableBTreeMap<null, null>(7, 100, 1_000);

$query;
export function stableMap7ContainsKey(key: null): boolean {
    return stableMap7.containsKey(key);
}

$query;
export function stableMap7Get(key: null): Opt<null> {
    return stableMap7.get(key);
}

$update;
export function stableMap7Insert(
    key: null,
    value: null
): Result<Opt<null>, InsertError> {
    return stableMap7.insert(key, value);
}

$query;
export function stableMap7IsEmpty(): boolean {
    return stableMap7.isEmpty();
}

$query;
export function stableMap7Items(): [null, null][] {
    return stableMap7.items();
}

$query;
export function stableMap7Keys(): null[] {
    return stableMap7.keys();
}

$query;
export function stableMap7Len(): nat64 {
    return stableMap7.len();
}

$update;
export function stableMap7Remove(key: null): Opt<null> {
    return stableMap7.remove(key);
}

$query;
export function stableMap7Values(): null[] {
    return stableMap7.values();
}
