import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import {
    RecordArb,
    Record
} from '../../../arbitraries/candid/constructed/record_arb';
import { TestSample } from '../../../arbitraries/test_sample_arb';
import { UniqueIdentifierArb } from '../../../arbitraries/unique_identifier_arb';
import { getActor, runPropTests } from '../../..';
import { AzleResult, Test } from '../../../../test';
import { CandidMeta } from '../../../arbitraries/candid/candid_arb';

const RecordTestArb = fc
    .tuple(
        UniqueIdentifierArb('canisterMethod'),
        fc.uniqueArray(RecordArb, {
            selector: (entry) => entry.src.candidType
        }),
        RecordArb
    )
    .map(([functionName, paramRecords, defaultReturnRecord]): TestSample => {
        const imports = new Set([
            ...paramRecords.flatMap((record) => [...record.src.imports]),
            ...defaultReturnRecord.src.imports
        ]);

        const candidTypeDeclarations = [
            ...paramRecords.map((record) => record.src.typeDeclaration ?? ''),
            defaultReturnRecord.src.typeDeclaration ?? ''
        ];

        const paramNames = paramRecords.map((_, index) => `param${index}`);

        const paramCandidTypes = paramRecords
            .map((record) => record.src.candidType)
            .join(', ');

        const returnRecord =
            paramRecords.length === 0 ? defaultReturnRecord : paramRecords[0];
        const returnCandidType = returnRecord.src.candidType;

        const body = generateBody(paramRecords, returnRecord);

        const test = generateTest(functionName, paramRecords, returnRecord);

        return {
            imports,
            candidTypeDeclarations,
            functionName,
            paramNames,
            paramCandidTypes,
            returnCandidType,
            body,
            test
        };
    });

runPropTests(RecordTestArb);

function generateBody(
    paramRecords: CandidMeta<Record>[],
    returnRecord: CandidMeta<Record>
): string {
    const paramsAreRecords = paramRecords
        .map((record, index) => {
            const paramName = `param${index}`;
            const fieldsCount = Object.keys(record.value).length;

            const paramIsObject = `typeof ${paramName} === 'object'`;
            const paramHasCorrectNumberOfFields = `Object.keys(${paramName}).length === ${fieldsCount}`;
            const throwError = `throw new Error('${paramName} must be a Record');`;

            return `if (!(${paramIsObject} && ${paramHasCorrectNumberOfFields})) ${throwError}`;
        })
        .join('\n');

    const paramsCorrectlyOrdered = paramRecords
        .map((record, index) => {
            const paramName = `param${index}`;

            const fieldNamesMatch = Object.entries(record.value)
                .map(([fieldName, _]) => {
                    return `Object.keys(${paramName}).includes('${fieldName}')`;
                })
                .join(' && ');

            const throwError = `throw new Error('${paramName} is incorrectly ordered')`;

            if (Object.entries(record.value).length === 0) {
                return `if (Object.keys(${paramName}).length !== 0) ${throwError}`;
            }

            return `if (!(${fieldNamesMatch})) ${throwError}`;
        })
        .join('\n');

    const returnStatement =
        paramRecords.length === 0 ? returnRecord.src.valueLiteral : `param0`;

    return `
        ${paramsAreRecords}

        ${paramsCorrectlyOrdered}

        return ${returnStatement};
    `;
}

function generateTest(
    functionName: string,
    paramRecords: CandidMeta<Record>[],
    returnRecord: CandidMeta<Record>
): Test {
    return {
        name: `record ${functionName}`,
        test: async () => {
            const actor = getActor('./tests/record/test');

            const result = await actor[functionName](
                ...paramRecords.map((record) => record.value)
            );

            return { Ok: deepEqual(result, returnRecord.value) };
        }
    };
}
