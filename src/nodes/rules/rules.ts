import type {
    classify,
    Domain,
    inferDomain,
    ObjectDomain
} from "../../utils/classify"
import type {
    CollapsibleList,
    Dictionary,
    evaluate,
    keySet
} from "../../utils/generics"
import {
    composeIntersection,
    composeKeyedOperation,
    empty,
    equal
} from "../compose"
import type { TypeNode } from "../node"
import type { PredicateContext } from "../predicate"
import { collapsibleListUnion } from "./collapsibleSet"
import { divisorIntersection } from "./divisor"
import { propsIntersection, requiredKeysIntersection } from "./props"
import type { Range } from "./range"
import { rangeIntersection } from "./range"
import { regexIntersection } from "./regex"

export type Rules<
    domain extends Domain = Domain,
    scope extends Dictionary = Dictionary
> = {
    readonly regex?: CollapsibleList<string>
    readonly divisor?: number
    readonly requiredKeys?: keySet
    readonly props?: Dictionary<TypeNode<scope>>
    readonly propTypes?: {
        readonly number?: TypeNode<scope>
        readonly string?: TypeNode<scope>
    }
    readonly kind?: ObjectDomain
    readonly range?: Range
    readonly validator?: ValidatorRule<domain>
}

export type ValidatorRule<domain extends Domain = Domain> = CollapsibleList<
    Validator<inferDomain<domain>>
>

export type Validator<data = unknown> = (data: data) => boolean

export type DistributedValidator<data = unknown> = evaluate<{
    [domain in classify<data>]?: Validator<Extract<data, inferDomain<domain>>>
}>

export type RuleSet<
    domain extends Domain,
    scope extends Dictionary
> = Domain extends domain
    ? Rules
    : domain extends "object"
    ? defineRuleSet<
          "object",
          | "kind"
          | "props"
          | "requiredKeys"
          | "propTypes"
          | "range"
          | "validator",
          scope
      >
    : domain extends string
    ? defineRuleSet<"string", "regex" | "range" | "validator", scope>
    : domain extends number
    ? defineRuleSet<"number", "divisor" | "range" | "validator", scope>
    : defineRuleSet<domain, "validator", scope>

type defineRuleSet<
    domain extends Domain,
    keys extends keyof Rules,
    scope extends Dictionary
> = Pick<Rules<domain, scope>, keys>

export const objectKindIntersection = composeIntersection<ObjectDomain>(
    (l, r) => (l === r ? equal : empty)
)

const validatorIntersection =
    composeIntersection<CollapsibleList<Validator>>(collapsibleListUnion)

export const rulesIntersection = composeKeyedOperation<Rules, PredicateContext>(
    {
        kind: objectKindIntersection,
        divisor: divisorIntersection,
        regex: regexIntersection,
        props: propsIntersection,
        requiredKeys: requiredKeysIntersection,
        propTypes: propsIntersection,
        range: rangeIntersection,
        validator: validatorIntersection
    },
    { propagateEmpty: true }
)
