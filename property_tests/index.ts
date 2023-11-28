import { execSync } from 'child_process';
import fc from 'fast-check';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

import { runTests } from '../test';
import { CanisterArb } from './arbitraries/canister_arb';
import { TestSample } from './arbitraries/test_sample_arb';

export { getActor } from './get_actor';

export function runPropTests(testArb: fc.Arbitrary<TestSample>) {
    fc.assert(
        fc.asyncProperty(CanisterArb(testArb), async (canister) => {
            if (!existsSync('src')) {
                mkdirSync('src');
            }

            writeFileSync('src/index.ts', canister.sourceCode);

            execSync(`npx prettier --write src`, {
                stdio: 'inherit'
            });

            execSync(`dfx canister uninstall-code canister || true`, {
                stdio: 'inherit'
            });

            execSync(`dfx deploy canister`, {
                stdio: 'inherit'
            });

            execSync(`dfx generate canister`, {
                stdio: 'inherit'
            });

            const result = await runTests(
                canister.tests,
                process.env.AZLE_PROPTEST_VERBOSE !== 'true'
            );

            execSync(
                `node_modules/.bin/tsc --noEmit --skipLibCheck --target es2020 --strict --moduleResolution node --allowJs`,
                {
                    stdio: 'inherit'
                }
            );

            return result;
        }),
        {
            numRuns: Number(process.env.AZLE_PROPTEST_NUM_RUNS ?? 1),
            endOnFailure: true // TODO This essentially disables shrinking. We don't know how to do shrinking well yet
        }
    );
}
