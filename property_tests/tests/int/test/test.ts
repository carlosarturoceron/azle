import fc from 'fast-check';
import { IntArb } from '../../../arbitraries/candid/primitive/ints/int_arb';
import { getCanisterId } from '../../../../test';
import { createUniquePrimitiveArb } from '../../../arbitraries/unique_primitive_arb';
import { JsFunctionNameArb } from '../../../arbitraries/js_function_name_arb';
import { runPropTests } from '../../..';

const IntTestArb = fc
    .tuple(createUniquePrimitiveArb(JsFunctionNameArb), fc.array(IntArb))
    .map(([functionName, ints]) => {
        const paramCandidTypes = ints.map(() => 'int').join(', ');
        const returnCandidType = 'int';
        const paramNames = ints.map((_, index) => `param${index}`);

        const paramsAreBigInts = paramNames
            .map((paramName) => {
                return `if (typeof ${paramName} !== 'bigint') throw new Error('${paramName} must be a bigint');`;
            })
            .join('\n');

        const paramsSum = paramNames.reduce((acc, paramName) => {
            return `${acc} + ${paramName}`;
        }, '0n');

        const returnStatement = `${paramsSum}`;

        const expectedResult = ints.reduce((acc, int) => acc + int, 0n);

        const paramSamples = ints;

        const paramsCorrectlyOrdered = paramNames
            .map((paramName, index) => {
                return `if (${paramName} !== ${paramSamples[index]}n) throw new Error('${paramName} is incorrectly ordered')`;
            })
            .join('\n');

        return {
            functionName,
            imports: ['int'],
            paramCandidTypes,
            returnCandidType,
            paramNames,
            paramSamples,
            body: `
            ${paramsCorrectlyOrdered}
            
            ${paramsAreBigInts}

            return ${returnStatement};
        `,
            test: {
                name: `test ${functionName}`,
                test: async () => {
                    const { createActor } = await import(
                        `./dfx_generated/canister`
                    );

                    const actor: any = createActor(getCanisterId('canister'), {
                        agentOptions: {
                            host: 'http://127.0.0.1:8000'
                        }
                    });

                    const result = await actor[functionName](...ints);

                    return {
                        Ok: result === expectedResult
                    };
                }
            }
        };
    });

runPropTests(IntTestArb);