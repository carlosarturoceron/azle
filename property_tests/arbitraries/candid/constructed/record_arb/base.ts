import fc from 'fast-check';

import { CandidValueAndMeta } from '../../candid_arb';
import { CandidType } from '../../candid_type_arb';
import { UniqueIdentifierArb } from '../../../unique_identifier_arb';
import { JsFunctionNameArb } from '../../../js_function_name_arb';
import { Record } from './index';

type Field = [string, CandidValueAndMeta<CandidType>];

export function RecordArb(
    candidTypeArb: fc.Arbitrary<CandidValueAndMeta<CandidType>>
) {
    return fc
        .tuple(
            UniqueIdentifierArb('typeDeclaration'),
            fc.uniqueArray(fc.tuple(JsFunctionNameArb, candidTypeArb), {
                selector: (entry) => entry[0]
            }),
            fc.boolean()
        )
        .map(
            ([
                name,
                fields,
                useTypeDeclaration
            ]): CandidValueAndMeta<Record> => {
                const candidType = useTypeDeclaration
                    ? name
                    : generateCandidType(fields);

                const typeDeclaration = generateTypeDeclaration(
                    name,
                    fields,
                    useTypeDeclaration
                );

                const imports = generateImports(fields);

                const valueLiteral = generateValueLiteral(fields);

                const agentArgumentValue = generateValue(fields);

                const agentResponseValue = generateValue(fields, true);

                return {
                    src: {
                        candidType,
                        typeDeclaration,
                        imports,
                        valueLiteral
                    },
                    agentArgumentValue,
                    agentResponseValue
                };
            }
        );
}

function generateImports(fields: Field[]): Set<string> {
    const fieldImports = fields.flatMap((field) => [...field[1].src.imports]);
    return new Set([...fieldImports, 'Record']);
}

function generateCandidType(fields: Field[]): string {
    return `Record({${fields
        .map(
            ([fieldName, fieldDataType]) =>
                `${fieldName}: ${fieldDataType.src.candidType}`
        )
        .join(',')}})`;
}

function generateTypeDeclaration(
    name: string,
    fields: Field[],
    useTypeDeclaration: boolean
): string {
    const fieldTypeDeclarations = fields
        .map((field) => field[1].src.typeDeclaration)
        .join('\n');
    if (useTypeDeclaration) {
        return `${fieldTypeDeclarations}\nconst ${name} = ${generateCandidType(
            fields
        )};`;
    }
    return fieldTypeDeclarations;
}

function generateValue(fields: Field[], returned: boolean = false): Record {
    return fields.length === 0
        ? {}
        : fields.reduce((record, [fieldName, fieldDataType]) => {
              return {
                  ...record,
                  [fieldName]: returned
                      ? fieldDataType.agentResponseValue
                      : fieldDataType.agentArgumentValue
              };
          }, {});
}

function generateValueLiteral(fields: Field[]): string {
    if (fields.length === 0) {
        return '{}';
    }

    const fieldLiterals = fields
        .map(
            ([fieldName, fieldValue]) =>
                `${fieldName}: ${fieldValue.src.valueLiteral}`
        )
        .join(',\n');

    return `{
        ${fieldLiterals}
    }`;
}
