import './globals';
import { IDL } from '@dfinity/candid';
export { Principal } from '@dfinity/principal';

export * from './ic';
export * from './method_decorators';
export * from './record';
export * from './variant';
export * from './func';
export * from './property_decorators';

export const bool = IDL.Bool;
export const empty = IDL.Empty;
export const int = IDL.Int;
export const int8 = IDL.Int8;
export const int16 = IDL.Int16;
export const int32 = IDL.Int32;
export const int64 = IDL.Int64;
export const nat = IDL.Nat;
export const nat8 = IDL.Nat8;
export const nat16 = IDL.Nat16;
export const nat32 = IDL.Nat32;
export const nat64 = IDL.Nat64;
export const candidNull = IDL.Null;
export const reserved = IDL.Reserved;
export const text = IDL.Text;
export const float32 = IDL.Float32;
export const float64 = IDL.Float64;
export const principal = IDL.Principal;
export const blob = IDL.Vec(IDL.Nat8);
export const Vec = IDL.Vec;
export const Opt = IDL.Opt;