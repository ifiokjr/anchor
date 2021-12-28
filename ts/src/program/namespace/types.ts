import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  Idl,
  IdlField,
  IdlInstruction,
  IdlType,
  IdlTypeDef,
  IdlTypeDefTyEnum,
  IdlTypeDefTyStruct,
} from "../../idl";
import { Accounts, Context } from "../context";

/**
 * All instructions for an IDL.
 */
export type AllInstructions<IDL extends Idl> = IDL["instructions"][number];

/**
 * Returns a type of instruction name to the IdlInstruction.
 */
export type InstructionMap<I extends IdlInstruction> = {
  [K in I["name"]]: I & { name: K };
};

/**
 * Returns a type of instruction name to the IdlInstruction.
 */
export type AllInstructionsMap<IDL extends Idl> = InstructionMap<
  AllInstructions<IDL>
>;

/**
 * All accounts for an IDL.
 */
export type AllAccounts<IDL extends Idl> = IDL["accounts"] extends undefined
  ? IdlTypeDef
  : NonNullable<IDL["accounts"]>[number];

/**
 * Returns a type of instruction name to the IdlInstruction.
 */
export type AccountMap<I extends IdlTypeDef> = {
  [K in I["name"]]: I & { name: K };
};

/**
 * Returns a type of instruction name to the IdlInstruction.
 */
export type AllAccountsMap<IDL extends Idl> = AccountMap<AllAccounts<IDL>>;

export type MakeInstructionsNamespace<
  IDL extends Idl,
  I extends IdlInstruction,
  Ret,
  Mk extends { [M in keyof InstructionMap<I>]: unknown } = {
    [M in keyof InstructionMap<I>]: unknown;
  }
> = {
  [M in keyof InstructionMap<I>]: InstructionContextFn<
    IDL,
    InstructionMap<I>[M],
    Ret
  > &
    Mk[M];
};

export type InstructionContextFn<
  IDL extends Idl,
  I extends AllInstructions<IDL>,
  Ret
> = (...args: InstructionContextFnArgs<IDL, I>) => Ret;

export type InstructionContextFnArgs<
  IDL extends Idl,
  I extends IDL["instructions"][number]
> = [
  ...ArgsTuple<I["args"], IdlTypes<IDL>>,
  Context<Accounts<I["accounts"][number]>>
];

type TypeMap = {
  publicKey: PublicKey;
  bool: boolean;
} & {
  [K in "u8" | "i8" | "u16" | "i16" | "u32" | "i32"]: number;
} &
  {
    [K in "u64" | "i64" | "u128" | "i128"]: BN;
  };

/**
 * Infer the TypeScript type from the provided Idl.
 */
export type DecodeType<T extends IdlType, Defined> = T extends keyof TypeMap
  ? TypeMap[T]
  : T extends { defined: keyof Defined }
  ? Defined[T["defined"]]
  : T extends { option: keyof TypeMap }
  ? TypeMap[T["option"]] | null
  : T extends { option: { defined: keyof Defined } }
  ? Defined[T["option"]["defined"]] | null
  : T extends { vec: keyof TypeMap }
  ? Array<TypeMap[T["vec"]]>
  : T extends { vec: { defined: keyof Defined } }
  ? Defined[T["vec"]["defined"]][]
  : T extends { array: [idlType: keyof TypeMap, size?: number] }
  ? Array<TypeMap[T["array"][0]]>
  : T extends { array: [idlType: { defined: keyof Defined }, size?: number] }
  ? Array<Defined[T["array"][0]["defined"]]>
  : unknown;

/**
 * Tuple of arguments.
 */
type ArgsTuple<A extends IdlField[], Defined> = {
  [K in keyof A]: A[K] extends IdlField
    ? DecodeType<A[K]["type"], Defined>
    : unknown;
} &
  unknown[];

type FieldsOfType<I extends IdlTypeDef> = NonNullable<
  I["type"] extends IdlTypeDefTyStruct
    ? I["type"]["fields"]
    : I["type"] extends IdlTypeDefTyEnum
    ? I["type"]["variants"][number]["fields"]
    : any[]
>[number];

export type TypeDef<I extends IdlTypeDef, Defined> = {
  [F in FieldsOfType<I>["name"]]: DecodeType<
    (FieldsOfType<I> & { name: F })["type"],
    Defined
  >;
};

type TypeDefDictionary<T extends IdlTypeDef[], Defined> = {
  [K in T[number]["name"]]: TypeDef<T[number] & { name: K }, Defined>;
};

export type IdlTypes<T extends Idl> = TypeDefDictionary<
  NonNullable<T["types"]>,
  Record<string, never>
>;

export type IdlAccounts<T extends Idl> = TypeDefDictionary<
  NonNullable<T["accounts"]>,
  Record<string, never>
>;

export type IdlErrorInfo<IDL extends Idl> = NonNullable<IDL["errors"]>[number];
