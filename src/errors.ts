import { GateKeepType, Void } from ".";

export type IncorrectType = { e: "IncorrectType", expected: GateKeepType, got: any };
export type IncorrectValue = { e: "IncorrectValue", expected: any, got: any };
export type UnionNoMatch = { e: "UnionNoMatch", errors: GatekeepError[] };
export type ArrayError = { e: "ArrayError", error: GatekeepError, index: number };
export type RecordError = { e: "RecordError", error: GatekeepError, key: string };
export type CheckerFailed = { e: "CheckerFailed", result: false | string };
export type ObjectError = { e: "ObjectError", error: GatekeepError, key: string };
export type ObjectRequiredKeyMissing = { e: "ObjectRequiredKeyMissing", key: string };
export type ObjectIllegalExtraKey = { e: "ObjectIllegalExtraKey", key: string };

export type GatekeepError = IncorrectType | IncorrectValue | UnionNoMatch | ArrayError |
RecordError | CheckerFailed | ObjectError | ObjectRequiredKeyMissing | ObjectIllegalExtraKey;

/** `t` means a type representation, `v` - a value, where values can contain multiple types. */
export type JSONType = { t: string } | { v: any };
export type JSONError = GatekeepError | { e: "IncorrectType", expected: JSONType, got: any }

export function typeToJSON(t: GateKeepType): JSONType {
	if (t['gk'] && t['gk'] == Void.gk) {
		return { t: t['tag']['description'] ?? '' };
	}
	if (typeof t == 'object' && t != null) {
		for (const key in t) {
			t[key] = typeToJSON(t[key]);
		}
	}
	return { v: t };
}
export function errToJSON(error: GatekeepError): JSONError {
	const jsonError = Object.assign({}, error) as JSONError;
	switch (jsonError.e) {
		case "ArrayError":
		case "ObjectError":
		case "RecordError": jsonError.error = errToJSON(jsonError.error); break;

		case "UnionNoMatch": jsonError.errors = jsonError.errors.map(errToJSON); break;

		case "IncorrectType": jsonError.expected = typeToJSON(jsonError.expected); break;
	}
	return jsonError;
}