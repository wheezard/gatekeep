# Gatekeep

A runtime type-checker, with a focus on performance

### Usage

Import gatekeep:

```js
const { check, Str, ... } = require("gkeep"); // Or:
import { check, Str, ... } from "gkeep";
```

Use the `check()` function to quickly check a type

```js
check(Str, "Hi!") // true
check(Str, true) // { e: 'IncorrectType', got: true, expected: Str }
```

This function returns `true | GatekeepError`, where every `GatekeepError` has an `e` property, which describes the error.

Here's all the types:

```js
const myObject = { ... };
const hello = type({
  string: Str,
  number: Num,
  boolean: Bool,
  arrayOfStrings: ArrayOf(Str),
  objectWithBoolsAsValues: RecordOf(Bool),
  objectWithKeys: {
    customChecker: val => val in myObject,
    checkerButOnlyForNumbers: Num(num => !isNaN(num)),
    specificString: "Hello world",
    onlyNull: null,
    typeUnion: uni([
      "This can be a string",
      { message: "but also an object" }
    ]),
    [DefaultKey]: Str(s => s.includes("any other key"))
  },
  someOptional: WithOptional({
    required: Bool
  }, {
    optional: "string",
    [DefaultKey]: "DefaultKey is only permitted here"
  })
})

hello.check({ ... }) // An alias for `check(hello, { ... })`
```

All unknown symbols here are exported from `gkeep`.

It's worth mentioning that `DefaultKey` is a `symbol`, also exported from `gkeep`. When using `WithOptional(required, optional)`, you may only put `DefaultKey` in the optional object.

### Working with errors

The `check()` function returns either `true`, if the check was successful, or a `GatekeepError`, which describes what went wrong. To simplify working with errors, you may also use `gkeep/errors` and `gkeep/parser` exports.

#### /errors

Exports the `errToJSON()` function that will turn any error into an JSON-serializable object (except if there are any functions)

Also, `typeToJSON()` will return a `{ t: string }` if it's a loose type (string, boolean, checker), and `{ v: any }` if it's a concrete type (like `"sth"`, `false`, `3`, etc.)

#### /parser

Exported function `parse()` will turn any error into a human-readable string.
