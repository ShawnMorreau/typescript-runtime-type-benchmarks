import type { ScopeRoot } from "../scope"
import { collapsibleIfSingleton } from "../utils/generics"
import { isBranchComparison } from "./branches"
import type { KeyReducerFn } from "./compose"
import {
    composeKeyedOperation,
    composeNodeOperation,
    equal,
    finalizeNodeOperation
} from "./compose"
import type { TypeNode, TypeSet } from "./node"
import { comparePredicates } from "./predicate"

export const intersection = (
    l: TypeNode,
    r: TypeNode,
    scope: ScopeRoot
): TypeNode => finalizeNodeOperation(l, nodeIntersection(l, r, scope))

export const predicateIntersection: KeyReducerFn<
    Required<TypeSet>,
    ScopeRoot
> = (domain, l, r, scope) => {
    const comparison = comparePredicates(domain, l, r, scope)
    if (!isBranchComparison(comparison)) {
        return comparison
    }
    return collapsibleIfSingleton([
        ...comparison.codependentIntersections,
        ...comparison.equalPairs.map(
            (indices) => comparison.lConditions[indices[0]]
        ),
        ...comparison.lSubconditionsOfR.map(
            (lIndex) => comparison.lConditions[lIndex]
        ),
        ...comparison.rSubconditionsOfL.map(
            (rIndex) => comparison.rConditions[rIndex]
        )
    ])
}

const typeSetIntersection = composeKeyedOperation<TypeSet, ScopeRoot>(
    (domain, l, r, scope) => {
        if (l === undefined) {
            return r === undefined ? equal : undefined
        }
        if (r === undefined) {
            return undefined
        }
        return predicateIntersection(domain, l, r, scope)
    }
)

export const nodeIntersection = composeNodeOperation(typeSetIntersection)
