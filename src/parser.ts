import { GatekeepError, JSONType, typeToJSON } from "./errors";

function parseJSONType(jt: JSONType) {
	if ('t' in jt) {
		return '<' + jt.t + '>';
	}

	if (typeof jt.v == 'object' && jt.v !== null) {
		for (const key in jt.v) {
			jt.v[key] = parseJSONType(jt.v[key])
		}
	}

	return JSON.stringify(jt.v)
}
export function parse(error: GatekeepError, ident = '') {
	let string = ident;
	if (error.e == 'ArrayError') string += `The array element #${error.index} doesn't match the specified type:\n` + parse(error.error, ident + '  ');
	if (error.e == 'CheckerFailed') string += "Checker function failed: " + error.result;
	if (error.e == 'IncorrectType') {
		const jsonType = typeToJSON(error.expected);
		if ('t' in jsonType) string += `The value ${String(error.got)} isn't assignable to type ${jsonType.t}`;
		else string += `The value ${String(error.got)} doesn't match ${parseJSONType(jsonType)}`;
	}
	if (error.e == 'IncorrectValue') string += `The value ${String(error.got)} isn't ${String(error.expected)}`;
	if (error.e == 'ObjectError') string += `The key "${error.key}" of this object is invalid:\n` + parse(error.error, ident + '  ');
	if (error.e == 'ObjectIllegalExtraKey') string += `This object has an extra key "${error.key}"`;
	if (error.e == 'ObjectRequiredKeyMissing') string += `The required key "${error.key}" is missing from this object`;
	if (error.e == 'RecordError') string += `The key "${error.key}" doesn't match the Record type:\n` + parse(error.error, ident + '  ');
	if (error.e == 'UnionNoMatch') {
		string += `The value isn't assignable to any of the union types:\n` + error.errors.map(e => parse(e, ident + '-  ')).join('\n')
	}

	return string;
}