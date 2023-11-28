import { deepEqual } from 'fast-equals';

import { getActor, Named } from 'azle/property_tests';
import { CandidValueAndMeta } from 'azle/property_tests/arbitraries/candid/candid_arb';
import { Record } from 'azle/property_tests/arbitraries/candid/constructed/record_arb';
import { Test } from 'azle/test';

export function generateTests(
    functionName: string,
    namedParamRecords: Named<CandidValueAndMeta<Record>>[],
    returnRecord: CandidValueAndMeta<Record>
): Test[] {
    return [
        {
            name: `record ${functionName}`,
            test: async () => {
                const actor = getActor('./tests/record/test');

                const result = await actor[functionName](
                    ...namedParamRecords.map(
                        (param) => param.el.agentArgumentValue
                    )
                );

                return {
                    Ok: deepEqual(result, returnRecord.agentResponseValue)
                };
            }
        }
    ];
}
