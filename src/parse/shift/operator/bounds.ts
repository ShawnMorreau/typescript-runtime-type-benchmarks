import type { Bound, Range } from "../../../nodes/rules/range"
import {
    buildEmptyRangeMessage,
    compareStrictness
} from "../../../nodes/rules/range"
import type { error } from "../../../utils/generics"
import { isKeyOf } from "../../../utils/generics"
import { tryParseWellFormedNumber } from "../../../utils/numericLiterals"
import type { DynamicState } from "../../reduce/dynamic"
import { buildUnpairableComparatorMessage } from "../../reduce/shared"
import type { state, StaticState } from "../../reduce/static"
import { Scanner } from "../scanner"

export const parseBound = (
    s: DynamicState,
    start: Scanner.ComparatorStartChar
) => {
    const comparator = shiftComparator(s, start)
    const maybeMin = s.ejectRootIfLimit()
    return maybeMin === undefined
        ? parseRightBound(s, comparator)
        : s.reduceLeftBound(maybeMin, comparator)
}

export type parseBound<
    s extends StaticState,
    start extends Scanner.ComparatorStartChar,
    unscanned extends string
> = shiftComparator<start, unscanned> extends infer shiftResultOrError
    ? shiftResultOrError extends Scanner.shiftResult<
          infer comparator extends Scanner.Comparator,
          infer nextUnscanned
      >
        ? s["root"] extends number
            ? state.reduceLeftBound<s, s["root"], comparator, nextUnscanned>
            : parseRightBound<s, comparator, nextUnscanned>
        : shiftResultOrError
    : never

const shiftComparator = (
    s: DynamicState,
    start: Scanner.ComparatorStartChar
): Scanner.Comparator =>
    s.scanner.lookaheadIs("=")
        ? `${start}${s.scanner.shift()}`
        : isKeyOf(start, Scanner.oneCharComparators)
        ? start
        : s.error(singleEqualsMessage)

type shiftComparator<
    start extends Scanner.ComparatorStartChar,
    unscanned extends string
> = unscanned extends `=${infer nextUnscanned}`
    ? [`${start}=`, nextUnscanned]
    : start extends Scanner.OneCharComparator
    ? [start, unscanned]
    : error<singleEqualsMessage>

export const singleEqualsMessage = `= is not a valid comparator. Use == to check for equality`
type singleEqualsMessage = typeof singleEqualsMessage

export const parseRightBound = (
    s: DynamicState,
    comparator: Scanner.Comparator
) => {
    const limitToken = s.scanner.shiftUntilNextTerminator()
    const limit = tryParseWellFormedNumber(
        limitToken,
        buildInvalidLimitMessage(comparator, limitToken + s.scanner.unscanned)
    )
    const openRange = s.ejectRangeIfOpen()
    let range
    if (openRange) {
        if (!isKeyOf(comparator, Scanner.pairableComparators)) {
            return s.error(buildUnpairableComparatorMessage(comparator))
        }
        range = deserializeRange(openRange[0], openRange[1], comparator, limit)
        if (compareStrictness(range.min, range.max, "min") === "l") {
            return s.error(buildEmptyRangeMessage(range.min!, range.max!))
        }
    } else {
        range = deserializeBound(comparator, limit)
    }
    s.intersect({
        number: { range },
        string: { range },
        object: { kind: "Array", range }
    })
}

export type parseRightBound<
    s extends StaticState,
    comparator extends Scanner.Comparator,
    unscanned extends string
> = Scanner.shiftUntilNextTerminator<unscanned> extends Scanner.shiftResult<
    infer scanned,
    infer nextUnscanned
>
    ? tryParseWellFormedNumber<
          scanned,
          buildInvalidLimitMessage<comparator, scanned>
      > extends infer limit
        ? limit extends number
            ? s["branches"]["range"] extends {}
                ? comparator extends Scanner.PairableComparator
                    ? state.reduceRange<
                          s,
                          s["branches"]["range"][0],
                          s["branches"]["range"][1],
                          comparator,
                          limit,
                          nextUnscanned
                      >
                    : error<buildUnpairableComparatorMessage<comparator>>
                : state.reduceSingleBound<s, comparator, limit, nextUnscanned>
            : error<limit & string>
        : never
    : never

export const buildInvalidLimitMessage = <
    comparator extends Scanner.Comparator,
    limit extends string
>(
    comparator: comparator,
    limit: limit
): buildInvalidLimitMessage<comparator, limit> =>
    `Comparator ${comparator} must be followed by a number literal (was '${limit}')`

export type buildInvalidLimitMessage<
    comparator extends Scanner.Comparator,
    limit extends string
> = `Comparator ${comparator} must be followed by a number literal (was '${limit}')`

const deserializeBound = (
    comparator: Scanner.Comparator,
    limit: number
): Range => {
    const bound: Bound =
        comparator.length === 1
            ? {
                  limit,
                  exclusive: true
              }
            : { limit }
    if (comparator === "==") {
        return { min: bound, max: bound }
    } else if (comparator === ">" || comparator === ">=") {
        return {
            min: bound
        }
    } else {
        return {
            max: bound
        }
    }
}

const deserializeRange = (
    minLimit: number,
    minComparator: Scanner.PairableComparator,
    maxComparator: Scanner.PairableComparator,
    maxLimit: number
): Range => {
    const min: Bound =
        minComparator === "<"
            ? {
                  limit: minLimit,
                  exclusive: true
              }
            : { limit: minLimit }
    const max: Bound =
        maxComparator === "<"
            ? {
                  limit: maxLimit,
                  exclusive: true
              }
            : { limit: maxLimit }
    return {
        min,
        max
    }
}
