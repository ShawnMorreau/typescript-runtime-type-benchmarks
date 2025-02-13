import type { ScopeRoot } from "../../scope"
import { checkNode } from "../../traverse/check"
import { hasObjectDomain } from "../../utils/classify"
import type { Dictionary, keySet, mutable } from "../../utils/generics"
import { hasKeys, keyCount } from "../../utils/generics"
import { tryParseWellFormedNumber } from "../../utils/numericLiterals"
import {
    composeIntersection,
    composeKeyedOperation,
    equal
} from "../compose"
import { nodeIntersection } from "../intersection"
import type { TypeNode } from "../node"
import type { PredicateContext } from "../predicate"
import type { RuleSet } from "./rules"

// TODO: Never propagation
export const propsIntersection = composeIntersection<
    Dictionary<TypeNode>,
    PredicateContext
>(
    composeKeyedOperation<Dictionary<TypeNode>, PredicateContext>(
        (propKey, l, r, context) => nodeIntersection(l, r, context.scope),
        { propagateEmpty: true }
    )
)

export const requiredKeysIntersection = composeIntersection<keySet>((l, r) => {
    const result = { ...l, ...r }
    const resultSize = keyCount(result)
    return resultSize === keyCount(l)
        ? resultSize === keyCount(r)
            ? equal
            : l
        : resultSize === keyCount(r)
        ? r
        : result
})

export const checkObject = (
    data: object,
    rules: RuleSet<"object", Dictionary>,
    scope: ScopeRoot
) => {
    if (hasObjectDomain(data, "Array") && isSimpleArray(rules)) {
        return data.every((elementData) =>
            checkNode(elementData, rules.propTypes.number, scope)
        )
    }
    const missingKeys: mutable<keySet> = { ...rules.requiredKeys }
    for (const k in data) {
        const propValue = (data as Dictionary)[k]
        if (rules.props?.[k] && !checkNode(propValue, rules.props[k], scope)) {
            return false
        }
        if (rules.propTypes) {
            const keyIsNumber = tryParseWellFormedNumber(k) !== undefined
            if (
                keyIsNumber &&
                rules.propTypes.number &&
                !checkNode(propValue, rules.propTypes.number, scope)
            ) {
                return false
            } else if (
                rules.propTypes.string &&
                !checkNode(propValue, rules.propTypes.string, scope)
            ) {
                return false
            }
        }
        delete missingKeys[k]
    }
    return hasKeys(missingKeys) ? false : true
}

const isSimpleArray = (
    rules: RuleSet<"object", Dictionary>
): rules is { type: "object"; propTypes: { number: TypeNode } } =>
    !rules.props &&
    rules.propTypes?.number !== undefined &&
    Object.keys(rules.propTypes).length === 1
