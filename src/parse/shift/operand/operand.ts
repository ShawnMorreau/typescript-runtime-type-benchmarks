import type { error } from "../../../utils/generics"
import type { DynamicState } from "../../reduce/dynamic"
import type { state, StaticState } from "../../reduce/static"
import type { Scanner } from "../scanner"
import type { EnclosingChar } from "./enclosed"
import { enclosingChar, parseEnclosed } from "./enclosed"
import { buildMissingOperandMessage, parseUnenclosed } from "./unenclosed"

export const parseOperand = (s: DynamicState): void =>
    s.scanner.lookahead === ""
        ? s.error(buildMissingOperandMessage(s))
        : s.scanner.lookahead === "("
        ? s.shiftedByOne().reduceGroupOpen()
        : s.scanner.lookaheadIsIn(enclosingChar)
        ? parseEnclosed(s, s.scanner.shift())
        : parseUnenclosed(s)

export type parseOperand<
    s extends StaticState,
    alias extends string
> = s["unscanned"] extends Scanner.shift<infer lookahead, infer unscanned>
    ? lookahead extends "("
        ? state.reduceGroupOpen<s, unscanned>
        : lookahead extends EnclosingChar
        ? parseEnclosed<s, lookahead, unscanned>
        : parseUnenclosed<s, alias>
    : error<buildMissingOperandMessage<s>>
