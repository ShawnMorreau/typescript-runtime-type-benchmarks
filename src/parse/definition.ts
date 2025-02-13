import type { TypeNode } from "../nodes/node"
import type { ScopeRoot } from "../scope"
import type { Domain, ObjectDomain, Primitive } from "../utils/classify"
import { classify, classifyObject } from "../utils/classify"
import { throwParseError } from "../utils/errors"
import type {
    Dictionary,
    evaluate,
    isAny,
    isTopType,
    List
} from "../utils/generics"
import type { inferRecord } from "./record"
import { parseRecord } from "./record"
import type { inferString, validateString } from "./string"
import { parseString } from "./string"
import type { inferTuple, validateTuple } from "./tuple"
import { parseTuple } from "./tuple"

export const parseDefinition = (def: unknown, scope: ScopeRoot): TypeNode => {
    const domain = classify(def)
    if (domain === "string") {
        return parseString(def as string, scope)
    }
    if (domain === "object") {
        const objectDomain = classifyObject(def as object)
        if (objectDomain === "Object") {
            return parseRecord(def as Dictionary, scope)
        } else if (objectDomain === "Array") {
            return parseTuple(def as List, scope)
        }
        return throwParseError(buildBadDefinitionTypeMessage(objectDomain))
    }
    return throwParseError(buildBadDefinitionTypeMessage(domain))
}

export type inferDefinition<
    def,
    scope extends Dictionary,
    aliases
> = isTopType<def> extends true
    ? never
    : def extends string
    ? inferString<def, scope, aliases>
    : def extends List
    ? inferTuple<def, scope, aliases>
    : def extends Dictionary
    ? inferRecord<def, scope, aliases>
    : never

export type validateDefinition<
    def,
    scope extends Dictionary
> = isTopType<def> extends true
    ? buildUninferableDefinitionMessage<
          isAny<def> extends true ? "any" : "unknown"
      >
    : def extends []
    ? def
    : def extends string
    ? validateString<def, scope>
    : def extends List
    ? validateTuple<def, scope>
    : def extends Primitive
    ? buildBadDefinitionTypeMessage<classify<def>>
    : // At runtime we implicitly check for other invalid object domains, so that,
    // for example, if an Error or Map were passed as a definition, we would not
    // try and parse it. However, that seems too niche a case to incur the type
    // performance penalty for checking against all non Dictionary/List object
    // domains, especially given that there would be a type error in these
    // situations anyways (albeit a convaluted one).
    def extends Function
    ? buildBadDefinitionTypeMessage<"Function">
    : evaluate<{
          [k in keyof def]: validateDefinition<def[k], scope>
      }>

export type buildUninferableDefinitionMessage<
    typeName extends "any" | "unknown"
> =
    `Cannot statically parse a definition inferred as ${typeName}. Use 'type.dynamic(...)' instead.`

export const buildBadDefinitionTypeMessage = <
    actual extends Domain | ObjectDomain
>(
    actual: actual
): buildBadDefinitionTypeMessage<actual> =>
    `Type definitions must be strings or objects (was ${actual})`

export type buildBadDefinitionTypeMessage<
    actual extends Domain | ObjectDomain
> = `Type definitions must be strings or objects (was ${actual})`
