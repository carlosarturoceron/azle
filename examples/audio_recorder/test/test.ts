import { run_tests } from 'azle/test';
import { createActor } from '../test/dfx_generated/audio_recorder';
import { get_tests } from './tests';

const audio_recorder_canister = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

run_tests(get_tests(audio_recorder_canister));
