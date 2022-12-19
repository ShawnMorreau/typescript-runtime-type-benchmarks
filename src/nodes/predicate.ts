import type { ScopeRoot } from "../scope"
import { checkRules } from "../traverse/check"
import type { Domain, inferDomain } from "../utils/classify"
import { hasObjectDomain } from "../utils/classify"
import type { CollapsibleList, Dictionary } from "../utils/generics"
import { listFrom } from "../utils/generics"
import type { BranchComparison } from "./branches"
import { compareBranches } from "./branches"
import type { SetOperationResult } from "./compose"
import { empty, equal } from "./compose"
import type { Identifier } from "./node"
import type { RuleSet } from "./rules/rules"
import { rulesIntersection } from "./rules/rules"
import { isExactValuePredicate, resolvePredicateIfIdentifier } from "./utils"

export type Predicate<
    domain extends Domain = Domain,
    scope extends Dictionary = Dictionary
> = true | CollapsibleList<Condition<domain, scope>>

export type Condition<
    domain extends Domain = Domain,
    scope extends Dictionary = Dictionary
> = RuleSet<domain, scope> | ExactValue<domain> | Identifier<scope>

export type ExactValue<domain extends Domain = Domain> = {
    readonly value: inferDomain<domain>
}

export type PredicateContext = {
    domain: Domain
    scope: ScopeRoot
}

export type ResolvedPredicate<
    domain extends Domain = Domain,
    scope extends Dictionary = Dictionary
> = Exclude<Predicate<domain, scope>, string>

export type PredicateComparison =
    | SetOperationResult<Predicate>
    | BranchComparison

export const comparePredicates = (
    domain: Domain,
    l: Predicate,
    r: Predicate,
    scope: ScopeRoot
): PredicateComparison => {
    const lResolution = resolvePredicateIfIdentifier(domain, l, scope)
    const rResolution = resolvePredicateIfIdentifier(domain, r, scope)
    if (lResolution === true) {
        return rResolution === true ? equal : r
    }
    if (rResolution === true) {
        return l
    }
    if (
        hasObjectDomain(lResolution, "Object") &&
        hasObjectDomain(rResolution, "Object")
    ) {
        return isExactValuePredicate(lResolution)
            ? isExactValuePredicate(rResolution)
                ? lResolution.value === rResolution.value
                    ? equal
                    : empty
                : checkRules(domain, lResolution.value, rResolution, scope)
                ? l
                : empty
            : isExactValuePredicate(rResolution)
            ? checkRules(domain, rResolution.value, lResolution, scope)
                ? r
                : empty
            : rulesIntersection(lResolution, rResolution, { domain, scope })
    }
    const lComparisons = listFrom(lResolution)
    const rComparisons = listFrom(rResolution)
    const comparison = compareBranches(
        domain,
        lComparisons,
        rComparisons,
        scope
    )
    if (
        comparison.equalPairs.length === lComparisons.length &&
        comparison.equalPairs.length === rComparisons.length
    ) {
        return equal
    }
    if (
        comparison.lSubconditionsOfR.length + comparison.equalPairs.length ===
        lComparisons.length
    ) {
        return l
    }
    if (
        comparison.rSubconditionsOfL.length + comparison.equalPairs.length ===
        rComparisons.length
    ) {
        return r
    }
    return comparison
}
