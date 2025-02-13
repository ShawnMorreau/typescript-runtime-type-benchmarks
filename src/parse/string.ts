import { morph } from "../nodes/morph"
import type { TypeNode } from "../nodes/node"
import type { ScopeRoot } from "../scope"
import type { Dictionary, error, stringKeyOf } from "../utils/generics"
import type { inferAst, validateAstSemantics } from "./ast"
import { DynamicState } from "./reduce/dynamic"
import type { state, StaticState } from "./reduce/static"
import { parseOperand } from "./shift/operand/operand"
import type { isResolvableIdentifier } from "./shift/operand/unenclosed"
import { parseOperator } from "./shift/operator/operator"
import type { Scanner } from "./shift/scanner"

export const parseString = (def: string, scope: ScopeRoot) =>
    scope.memoizedParse(def)

export type parseString<
    def extends string,
    alias extends string
> = maybeNaiveParse<def, alias>

export type inferString<
    def extends string,
    scope extends Dictionary,
    aliases
> = inferAst<
    parseString<def, stringKeyOf<aliases> | stringKeyOf<scope>>,
    scope,
    aliases
>

export type validateString<
    def extends string,
    scope extends Dictionary
> = parseString<def, stringKeyOf<scope>> extends infer astOrError
    ? astOrError extends error<infer message>
        ? message
        : validateAstSemantics<astOrError, scope> extends infer semanticResult
        ? semanticResult extends undefined
            ? def
            : semanticResult
        : never
    : never

/**
 * Try to parse the definition from right to left using the most common syntax.
 * This can be much more efficient for simple definitions.
 */
type maybeNaiveParse<
    def extends string,
    alias extends string
> = def extends `${infer child}[]`
    ? isResolvableIdentifier<child, alias> extends true
        ? [child, "[]"]
        : fullStringParse<def, alias>
    : isResolvableIdentifier<def, alias> extends true
    ? def
    : fullStringParse<def, alias>

export const maybeNaiveParse = (
    def: string,
    scope: ScopeRoot
): TypeNode | undefined => {
    if (def.endsWith("[]")) {
        const elementDef = def.slice(0, -2)
        if (scope.isResolvable(elementDef)) {
            return morph("array", elementDef)
        }
    }
    if (scope.isResolvable(def)) {
        return def
    }
}

export const fullStringParse = (def: string, scope: ScopeRoot) => {
    const s = new DynamicState(def, scope)
    parseOperand(s)
    return loop(s)
}

type fullStringParse<def extends string, alias extends string> = loop<
    state.initialize<def>,
    alias
>

// TODO: Recursion perf?
const loop = (s: DynamicState) => {
    while (!s.scanner.finalized) {
        next(s)
    }
    return s.ejectFinalizedRoot()
}

type loop<s extends StaticState | error, alias extends string> = s extends error
    ? s
    : // TODO: Check type impact of reverse check
      // @ts-expect-error If s is not an error, it must be a StaticState
      loopValid<s, alias>

type loopValid<
    s extends StaticState,
    alias extends string
> = s["unscanned"] extends Scanner.finalized
    ? s["root"]
    : loop<next<s, alias>, alias>

const next = (s: DynamicState) =>
    s.hasRoot() ? parseOperator(s) : parseOperand(s)

type next<
    s extends StaticState,
    alias extends string
> = s["root"] extends undefined ? parseOperand<s, alias> : parseOperator<s>
