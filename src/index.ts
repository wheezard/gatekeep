import { GatekeepError } from "./errors";

const GateKeepTag = Symbol('GateKeepTag');
const VoidTag = Symbol('Void');
const AnyTag = Symbol('Any');

const NullishTag = Symbol('Nullish');
const BooleanTag = Symbol('Boolean');

const StringTag = Symbol('String')
const NumberTag = Symbol('Number')
const SymbolTag = Symbol('Symbol')
const FunctionTag = Symbol('Function')
const ObjectTag = Symbol('Object')

const StringCheckerTag = Symbol('StringChecker');
const NumberCheckerTag = Symbol('NumberChecker');
const SymbolCheckerTag = Symbol('SymbolChecker');
const FunctionCheckerTag = Symbol('FunctionChecker');
const ObjectCheckerTag = Symbol('ObjectChecker');

const ArrayTag = Symbol('Array')
const RecordTag = Symbol('Record')
const ObjectOptionalTag = Symbol('ObjectOptional')

const UnionTag = Symbol('Union');

type Tagged<Tag = symbol> = { tag: Tag, gk: typeof GateKeepTag }

type CheckerType<T, Tag> = ((val: T) => boolean | string) & Tagged<Tag>;

type GateKeepInternalType = (
	(GateKeepType[] & Tagged<typeof UnionTag>) |
	Tagged<typeof StringTag> |
	Tagged<typeof NumberTag> |
	Tagged<typeof SymbolTag> |
	Tagged<typeof FunctionTag> |
	Tagged<typeof ObjectTag> |
	CheckerType<string, typeof StringCheckerTag> | CheckerType<number, typeof NumberCheckerTag> |
	CheckerType<symbol, typeof SymbolCheckerTag> | CheckerType<Function, typeof FunctionCheckerTag> |
	CheckerType<Object, typeof ObjectCheckerTag> |
	({ of: GateKeepType } & Tagged<typeof ArrayTag>) |
	({ values: GateKeepType } & Tagged<typeof RecordTag>) |
	({ required: Record<any, GateKeepType>, optional: Record<any, GateKeepType> } & Tagged<typeof ObjectOptionalTag>) |
	Tagged<typeof VoidTag> | Tagged<typeof AnyTag> | Tagged<typeof NullishTag> | Tagged<typeof BooleanTag>
)
export type GateKeepType = (GateKeepInternalType | string | number | symbol |
{ [k: string | number | symbol]: GateKeepType } | GateKeepType[] | ((v: any) => string | boolean))

export const DefaultKey = Symbol('[DefaultKey]');

export const Void: GateKeepInternalType = { gk: GateKeepTag, tag: VoidTag };
export const Any: GateKeepInternalType = { gk: GateKeepTag, tag: AnyTag };

export const Nullish: GateKeepInternalType = { gk: GateKeepTag, tag: NullishTag };
export const Bool: GateKeepInternalType = { gk: GateKeepTag, tag: BooleanTag };

export const Str = function(arg: (n: string) => boolean) {
	const checker = arg as GateKeepInternalType & { tag: typeof StringCheckerTag }

	checker.gk = GateKeepTag;
	checker.tag = StringCheckerTag;
	return checker;
}
Str.gk = GateKeepTag;
Str.tag = StringTag;

export const Num = function (arg: (n: number) => boolean) {
	const checker = arg as GateKeepInternalType & { tag: typeof NumberCheckerTag }

	checker.gk = GateKeepTag;
	checker.tag = NumberCheckerTag;
	return checker;
}
Num.gk = GateKeepTag;
Num.tag = NumberTag;

export const Sym = function (arg: (n: symbol) => boolean) {
	const checker = arg as GateKeepInternalType & { tag: typeof SymbolCheckerTag }

	checker.gk = GateKeepTag;
	checker.tag = SymbolCheckerTag;
	return checker;
}
Sym.gk = GateKeepTag;
Sym.tag = SymbolTag;

export const Func = function (arg: (n: Function) => boolean) {
	const checker = arg as GateKeepInternalType & { tag: typeof FunctionCheckerTag }

	checker.gk = GateKeepTag;
	checker.tag = FunctionCheckerTag;
	return checker;
}
Func.gk = GateKeepTag;
Func.tag = FunctionTag;

export const Obj = function (arg: (n: Object) => boolean) {
	const checker = arg as GateKeepInternalType & { tag: typeof ObjectCheckerTag }

	checker.gk = GateKeepTag;
	checker.tag = ObjectCheckerTag;
	return checker;
}
Obj.gk = GateKeepTag;
Obj.tag = ObjectTag;

export function ArrayOf(type: GateKeepType): GateKeepInternalType {
	return { of: type, tag: ArrayTag, gk: GateKeepTag }
}
export function RecordOf(type: GateKeepType): GateKeepInternalType {
	return { gk: GateKeepTag, tag: RecordTag, values: type }
}
/** `required` must not contain a `[DefaultKey]`. */
export function WithOptional(required: Record<any, GateKeepType>, optional: Record<any, GateKeepType>) {
	if (DefaultKey in required) {
		throw RangeError("The required object may not contain a [DefaultKey]. Please move it to the optional one.")
	}
	// Object assign is needed so that the checkObject() doesn't error because required props aren't present in the optional type.
	return { gk: GateKeepTag, tag: ObjectOptionalTag, required, optional: Object.assign({}, required, optional) }
}

export function uni(types: GateKeepType[]) {
	(types as GateKeepInternalType).gk = GateKeepTag;
	(types as GateKeepInternalType).tag = UnionTag;
	return types as GateKeepInternalType;
}
/** An alias for `Object.assign({}, ...types)` */
export function join(types: GateKeepType[]) {
	if (types.length == 1) return types[0];
	if (types.length == 2) {
		// For performance
		return Object.assign({}, types[0], types[1])
	}
	return Object.assign({}, ...types)
}

function isThing(v: any, typeofValue: string, classOfValue: any) {
	return typeof v == typeofValue || (typeof v == 'object' && v instanceof classOfValue)
}
function incorrectTypeConstructor(it: GatekeepError & { e: "IncorrectType" }) {
	return function(bool: boolean): true | GatekeepError {
		if (bool == false) return it;
		return bool;
	}
}
function checkerResultCheck(result: boolean | string): true | GatekeepError {
	if (result === true) return result;
	return { e: "CheckerFailed", result }
}
/** `strict` means return an error when the key from the value isn't found in type */
function checkObject(type: Record<string | number | symbol, GateKeepType>, value: Record<any, any>, strict = true): true | GatekeepError {
	for (const key in value) {
		if (Object.prototype.hasOwnProperty.call(value, key) != true) continue;

		if (!(key in type)) if (DefaultKey in type) {
			const resDefault = check(type[DefaultKey], value[key]);
			if (resDefault !== true) return { e: "ObjectError", error: resDefault, key: `${key} -> [DefaultKey]` };

			continue;

		} else if (strict) return { e: "ObjectIllegalExtraKey", key }
		else continue;

		const res = check(type[key], value[key]);
		if (res !== true) return { e: "ObjectError", error: res, key };
	}
	return true;
}
export function check(type: GateKeepType, value: any): true | GatekeepError {
	const incorrectType = { e: "IncorrectType" as const, expected: type, got: value };

	if (type['gk'] && type['gk'] == GateKeepTag) {
		const gkType = type as GateKeepInternalType;
		const incorrectTypeIfFalse = incorrectTypeConstructor(incorrectType);

		switch (gkType.tag) {
			case UnionTag: {
				let i = -1;
				const errors: GatekeepError[] = [];
				while (++i < gkType.length) {
					const result = check(gkType[i], value);
					if (result === true) return true;
					else errors.push(result);
				}
				return { e: "UnionNoMatch", errors }
			}

			case VoidTag: {
				return incorrectTypeIfFalse(value === undefined || value === null)
			}
			case AnyTag: {
				return true;
			}
			case NullishTag: {
				if (value) return incorrectType;
				return true;
			}
			case BooleanTag: return incorrectTypeIfFalse(isThing(value, 'boolean', Boolean))
			case StringTag: return incorrectTypeIfFalse(isThing(value, 'string', String))
			case NumberTag: return incorrectTypeIfFalse(isThing(value, 'number', Number))
			case SymbolTag: return incorrectTypeIfFalse(typeof value === 'symbol')
			case FunctionTag: return incorrectTypeIfFalse(typeof value === 'function')
			case ObjectTag: return incorrectTypeIfFalse(typeof value === 'object' && value !== null)

			case ArrayTag: {
				if (!Array.isArray(value)) return incorrectType;
				let i = -1;
				while (++i < value.length) {
					const result = check(gkType.of, value[i]);
					if (result !== true) return { e: "ArrayError", error: result as any, index: i };
				}
				return true;
			}
			case RecordTag: {
				if (typeof value !== 'object' || value === null) return incorrectType;
				for (const key in value) {
					if (Object.prototype.hasOwnProperty.call(value, key) != true) continue;

					const element = value[key];
					const result = check(gkType.values, element);
					if (result !== true) return { e: "RecordError", error: result as any, key };
				}
				return true;
			}
			case ObjectOptionalTag: {
				if (typeof value !== 'object' || value === null) return incorrectType;
				const requiredRes = checkObject(gkType.required, value, false);
				if (requiredRes !== true) return requiredRes;

				for (const key in gkType.required) {
					if (!(key in value)) return { e: "ObjectRequiredKeyMissing", key };
				}

				const optionalRes = checkObject(gkType.optional, value);
				if (optionalRes !== true) return optionalRes;

				return true;
			}

			case StringCheckerTag: {
				if (!isThing(value, 'string', String)) return incorrectType;
				return checkerResultCheck(gkType(value));
			}
			case NumberCheckerTag: {
				if (!isThing(value, 'number', Number)) return incorrectType;
				return checkerResultCheck(gkType(value));
			}
			case SymbolCheckerTag: {
				if (typeof value !== 'symbol') return incorrectType;
				return checkerResultCheck(gkType(value));
			}
			case FunctionCheckerTag: {
				if (typeof value !== 'function') return incorrectType;
				return checkerResultCheck(gkType(value));
			}
			case ObjectCheckerTag: {
				if (typeof value !== 'object' || value === null) return incorrectType;
				return checkerResultCheck(gkType(value));
			}
		}
	}

	if (typeof type === 'function') {
		return checkerResultCheck(type(value as never))
	}

	if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
		if (typeof type !== 'object' || type === null) return incorrectType;

		const res = checkObject(type as any, value);
		if (res !== true) return res;

		for (const key in type) {
			if (!(key in value)) return { e: "ObjectRequiredKeyMissing", key };
		}
		return true;

	} else if ((typeof type === 'object' && type !== null)) return incorrectType;

	if (isNaN(value) && typeof type == 'number' && isNaN(type)) {
		return true;
	}
	return value === type ? true : { e: "IncorrectValue", expected: type, got: value };
}
export function type(type: GateKeepType) {
	return {
		check: (val: any) => check(type, val)
	}
}