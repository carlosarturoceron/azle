import {
    ic,
    init,
    nat,
    query,
    Service,
    StableBTreeMap,
    text,
    update
} from 'azle';

let stableStorage = StableBTreeMap(text, nat, 0);

export default Service({
    init: init([], () => {
        stableStorage.insert('counter', 0n);
    }),
    increment: update([], nat, () => {
        const counterOpt = stableStorage.get('counter');
        const counter =
            counterOpt.length === 0
                ? ic.trap('counter not defined')
                : counterOpt[0] + 1n;

        stableStorage.insert('counter', counter);

        return counter;
    }),
    get: query([], nat, () => {
        const counterOpt = stableStorage.get('counter');
        const counter =
            counterOpt.length === 0
                ? ic.trap('counter not defined')
                : counterOpt[0];

        return counter;
    }),
    reset: update([], nat, () => {
        stableStorage.insert('counter', 0n);

        const counterOpt = stableStorage.get('counter');
        const counter =
            counterOpt.length === 0
                ? ic.trap('counter not defined')
                : counterOpt[0];

        return counter;
    })
});
