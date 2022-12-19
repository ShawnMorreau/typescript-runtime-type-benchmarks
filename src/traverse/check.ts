import type { TypeNode } from "../nodes/node"
import type { ScopeRoot } from "../scope"
import type { Domain } from "../utils/classify"

export const checkRules = (
    domain: Domain,
    data: unknown,
    attributes: unknown,
    scope: ScopeRoot
) => {
    return true
}

export const checkNode = (data: unknown, node: TypeNode, scope: ScopeRoot) => {
    return true
}
