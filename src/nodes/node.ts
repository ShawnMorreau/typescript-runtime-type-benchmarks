import type { Domain } from "../utils/classify"
import type { Dictionary, stringKeyOf } from "../utils/generics"
import type { Keyword } from "./keywords"
import type { Predicate } from "./predicate"

export type TypeNode<scope extends Dictionary = Dictionary> =
    | Identifier<scope>
    | TypeSet<scope>

/** If scope is provided, we also narrow each predicate to match its domain.
 * Otherwise, we use a base predicate for all types, which is easier to
 * manipulate.*/
export type TypeSet<scope extends Dictionary = Dictionary> = {
    readonly [domain in Domain]?: string extends keyof scope
        ? Predicate
        : Predicate<domain, scope>
}

export type Identifier<scope extends Dictionary = Dictionary> =
    | Keyword
    | stringKeyOf<scope>
