import type { Keyword, Keywords } from "../nodes/keywords"
import type {
    Dictionary,
    Downcastable,
    error,
    evaluate,
    isAny,
    RegexLiteral
} from "../utils/generics"
import type { inferDefinition } from "./definition"
import type { StringLiteral } from "./shift/operand/enclosed"
import type { Scanner } from "./shift/scanner"

export type inferAst<
    ast,
    scope extends Dictionary,
    aliases
> = ast extends readonly unknown[]
    ? ast[1] extends "[]"
        ? inferAst<ast[0], scope, aliases>[]
        : ast[1] extends "|"
        ? inferAst<ast[0], scope, aliases> | inferAst<ast[2], scope, aliases>
        : ast[1] extends "&"
        ? evaluate<
              inferAst<ast[0], scope, aliases> &
                  inferAst<ast[2], scope, aliases>
          >
        : ast[1] extends Scanner.Comparator
        ? ast[0] extends number
            ? inferAst<ast[2], scope, aliases>
            : inferAst<ast[0], scope, aliases>
        : ast[1] extends "%"
        ? inferAst<ast[0], scope, aliases>
        : never
    : inferTerminal<ast, scope, aliases>

export type validateAstSemantics<
    ast,
    scope extends Dictionary
> = ast extends string
    ? undefined
    : ast extends [infer child, unknown]
    ? validateAstSemantics<child, scope>
    : ast extends [infer left, infer token, infer right]
    ? token extends Scanner.BranchToken
        ? validateAstSemantics<left, scope> extends error<infer leftMessage>
            ? leftMessage
            : validateAstSemantics<right, scope> extends error<
                  infer rightMessage
              >
            ? rightMessage
            : undefined
        : token extends Scanner.Comparator
        ? left extends number
            ? validateAstSemantics<right, scope>
            : isBoundable<inferAst<left, scope, {}>> extends true
            ? validateAstSemantics<left, scope>
            : error<buildUnboundableMessage<astToString<ast[0]>>>
        : token extends "%"
        ? isDivisible<inferAst<left, scope, {}>> extends true
            ? validateAstSemantics<left, scope>
            : error<buildIndivisibleMessage<astToString<ast[0]>>>
        : validateAstSemantics<left, scope>
    : undefined

type isNonLiteralNumber<t> = t extends number
    ? number extends t
        ? true
        : false
    : false

type isNonLiteralString<t> = t extends string
    ? string extends t
        ? true
        : false
    : false

type isDivisible<inferred> = isAny<inferred> extends true
    ? true
    : isNonLiteralNumber<inferred>

type isBoundable<inferred> = isAny<inferred> extends true
    ? true
    : isNonLiteralNumber<inferred> extends true
    ? true
    : isNonLiteralString<inferred> extends true
    ? true
    : inferred extends readonly unknown[]
    ? true
    : false

type inferTerminal<
    token,
    scope extends Dictionary,
    aliases
> = token extends Keyword
    ? Keywords[token]
    : token extends keyof scope
    ? scope[token]
    : token extends keyof aliases
    ? inferDefinition<aliases[token], scope, aliases>
    : token extends StringLiteral<infer Text>
    ? Text
    : token extends RegexLiteral
    ? string
    : token extends number | bigint
    ? token
    : never

export type astToString<ast, result extends string = ""> = ast extends [
    infer head,
    ...infer tail
]
    ? astToString<tail, `${result}${astToString<head>}`>
    : ast extends Downcastable
    ? `${result}${ast extends bigint ? `${ast}n` : ast}`
    : "..."

export const buildIndivisibleMessage = <root extends string>(
    root: root
): buildIndivisibleMessage<root> =>
    `Divisibility operand ${root} must be a non-literal number`

type buildIndivisibleMessage<root extends string> =
    `Divisibility operand ${root} must be a non-literal number`

export const buildUnboundableMessage = <root extends string>(
    root: root
): buildUnboundableMessage<root> =>
    `Bounded expression ${root} must be a non-literal number, string or array`

type buildUnboundableMessage<root extends string> =
    `Bounded expression ${root} must be a non-literal number, string or array`
