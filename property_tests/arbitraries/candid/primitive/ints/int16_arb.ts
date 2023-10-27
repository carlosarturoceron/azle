import fc from 'fast-check';
import { Candid } from '../..';

export const Int16Arb = fc.bigIntN(16).map(
    (value): Candid<number> => ({
        value: Number(value),
        src: { candidType: 'int16', imports: new Set(['int16']) }
    })
);
