import { getCanisterId } from 'azle/dfx';
import { runTests } from 'azle/test';
// @ts-ignore
import { createActor } from './dfx_generated/quicksort';
import { getTests } from './tests';

const quicksortCanister = createActor(getCanisterId('quicksort'), {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

runTests(getTests(quicksortCanister));
