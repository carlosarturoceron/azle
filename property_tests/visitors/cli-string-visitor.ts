import { IDL } from '@dfinity/candid';

export type VisitorData = { value: any };

/**
 * The Bash string visitor will convert the value given in the VisitorData to
 * a string version that will work as an argument in a command line tool such
 * as dfx deploy
 */
export class CliStringVisitor extends IDL.Visitor<VisitorData, string> {
    visitFloat(_t: IDL.FloatClass, data: VisitorData) {
        /**
         * If a float doesn't have a decimal it won't serialize properly, so 10 while
         * is a float won't serialize unless it's 10.0
         */
        const floatString = data.value.toString();
        if (floatString.includes('.') || floatString.includes('e')) {
            return floatString;
        }
        return floatString + '.0';
    }
    visitType<T>(t: IDL.Type<T>, data: VisitorData): string {
        return t.valueToString(data.value);
    }
    visitText(_t: IDL.TextClass, data: VisitorData): string {
        return `"${escapeForBash(data.value)}"`;
    }
    visitTuple<T extends any[]>(
        _t: IDL.TupleClass<T>,
        components: IDL.Type<any>[],
        data: VisitorData
    ): string {
        const fields = components.map((value, index) =>
            value.accept(this, {
                value: data.value[index]
            })
        );
        return `record {${fields.join('; ')}}`;
    }
    visitOpt<T>(
        _t: IDL.OptClass<T>,
        ty: IDL.Type<T>,
        data: VisitorData
    ): string {
        if (data.value.length === 0) {
            return 'null';
        } else {
            return `opt ${ty.accept(this, { value: data.value[0] })}`;
        }
    }
    visitVec<T>(
        _t: IDL.VecClass<T>,
        ty: IDL.Type<T>,
        data: VisitorData
    ): string {
        const arr = asAnyArray(data.value); // TO REVIEW Do you like this or the any down bellow?
        const elements = data.value.map((e: any) => {
            return ty.accept(this, { value: e });
        });
        return 'vec {' + elements.join('; ') + '}';
    }
    visitRec<T>(
        _t: IDL.RecClass<T>,
        ty: IDL.ConstructType<T>,
        data: VisitorData
    ): string {
        return ty.accept(this, { value: data.value });
    }
    visitRecord(
        _t: IDL.RecordClass,
        fields: [string, IDL.Type<any>][],
        data: VisitorData
    ): string {
        const fieldStrings = fields.map(([fieldName, fieldType]) => {
            const value = fieldType.accept(this, {
                value: data.value[fieldName]
            });
            return `${fieldName} = ${value}`;
        });
        return `record {${fieldStrings.join('; ')}}`;
    }
    visitVariant(
        _t: IDL.VariantClass,
        fields: [string, IDL.Type<any>][],
        data: VisitorData
    ): string {
        for (const [name, type] of fields) {
            // eslint-disable-next-line
            if (data.value.hasOwnProperty(name)) {
                const value = type.accept(this, { value: data.value[name] });
                if (value === 'null') {
                    return `variant {${name}}`;
                } else {
                    return `variant {${name}=${value}}`;
                }
            }
        }
        throw new Error('Variant has no data: ' + data.value);
    }
}

type AnyArray =
    | Array<any>
    | ReadonlyArray<any>
    | Uint8Array
    | Int8Array
    | Uint8ClampedArray
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

function asAnyArray(input: any): AnyArray {
    if (
        Array.isArray(input) ||
        input instanceof Int8Array ||
        input instanceof Uint8Array ||
        input instanceof Uint8ClampedArray ||
        input instanceof Int16Array ||
        input instanceof Uint16Array ||
        input instanceof Int32Array ||
        input instanceof Uint32Array ||
        input instanceof Float32Array ||
        input instanceof Float64Array ||
        input instanceof BigInt64Array ||
        input instanceof BigUint64Array
    ) {
        return input;
    }
    throw new Error("It wasn't an array");
}

function escapeForBash(input: string) {
    return input
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/'/g, "'\\''") // Escape single quotes
        .replace(/"/g, '\\"'); // Escape double quotes
}
