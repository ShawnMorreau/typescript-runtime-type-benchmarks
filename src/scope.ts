import { keywords } from "./nodes/keywords"
import type { TypeNode, TypeSet } from "./nodes/node"
import type { ResolvedPredicate } from "./nodes/predicate"
import type { inferDefinition, validateDefinition } from "./parse/definition"
import { parseDefinition } from "./parse/definition"
import { fullStringParse, maybeNaiveParse } from "./parse/string"
import type { Config } from "./type"
import { ArkType } from "./type"
import { chainableNoOpProxy } from "./utils/chainableNoOpProxy"
import type { Domain } from "./utils/classify"
import { throwInternalError, throwParseError } from "./utils/errors"
import { deepFreeze } from "./utils/freeze"
import type { Dictionary, evaluate, mutable } from "./utils/generics"
import { isKeyOf } from "./utils/generics"
import type { LazyDynamicWrap } from "./utils/lazyDynamicWrap"
import { lazyDynamicWrap } from "./utils/lazyDynamicWrap"

const rawScope = (aliases: Dictionary, config: Config = {}) => {
    const root = new ScopeRoot(aliases, config)
    const types: Scope<Dictionary> = { $: root as any }
    for (const name in aliases) {
        types[name] = new ArkType(root.resolve(name), config, types)
    }
    return types
}

export const scope = lazyDynamicWrap(rawScope) as any as LazyDynamicWrap<
    InferredScopeFn,
    DynamicScopeFn
>

let rootScope: Scope<{}> | undefined

export type RootScope = ScopeRoot<{}>

export const getRootScope = () => {
    rootScope ??= scope({}) as any
    return rootScope!
}

type InferredScopeFn = <aliases, inferredParent extends Dictionary = {}>(
    aliases: validateAliases<
        aliases,
        inferScopeContext<aliases, inferredParent>
    >,
    config?: Config<inferredParent>
) => Scope<inferAliases<aliases, inferredParent>>

type DynamicScopeFn = <aliases extends Dictionary>(
    aliases: aliases,
    config?: Config
) => Scope<{ [name in keyof aliases]: unknown }>

export type Scope<inferred extends Dictionary> = {
    $: ScopeRoot<inferred>
} & inferredScopeToArktypes<inferred>

export type DynamicScope = Scope<Dictionary>

type inferredScopeToArktypes<inferred> = {
    [name in keyof inferred]: ArkType<inferred[name]>
}

// TODO: decide if parsing primarily managed through scope or only resolution/caching

export class ScopeRoot<inferred extends Dictionary = Dictionary> {
    attributes = {} as { [k in keyof inferred]: TypeSet<inferred> }
    // TODO: Add intersection cache
    private cache: mutable<Dictionary<TypeNode>> = {}

    constructor(
        public aliases: Record<keyof inferred, unknown>,
        public config: Config<Dictionary>
    ) {}

    get infer(): inferred {
        return chainableNoOpProxy
    }

    isResolvable(name: string) {
        return isKeyOf(name, keywords) ||
            this.aliases[name] ||
            this.config.scope?.$.attributes[name]
            ? true
            : false
    }

    resolve(name: string) {
        return this.resolveRecurse(name, [])
    }

    private resolveRecurse(name: string, seen: string[]): TypeSet {
        if (isKeyOf(name, keywords)) {
            return keywords[name] as any
        }
        if (isKeyOf(name, this.attributes)) {
            return this.attributes[name] as TypeSet
        }
        if (!this.aliases[name]) {
            return (
                this.config.scope?.$.attributes[name] ??
                throwInternalError(
                    `Unexpectedly failed to resolve alias '${name}'`
                )
            )
        }
        let root = parseDefinition(this.aliases[name], this as ScopeRoot)
        if (typeof root === "string") {
            if (seen.includes(root)) {
                return throwParseError(
                    buildShallowCycleErrorMessage(name, seen)
                )
            }
            seen.push(root)
            root = this.resolveRecurse(root, seen)
        }
        this.attributes[name as keyof inferred] = root as TypeSet<inferred>
        return root
    }

    resolveToDomain<domain extends Domain>(name: string, domain: domain) {
        return this.resolveToDomainRecurse(name, domain, [])
    }

    private resolveToDomainRecurse<domain extends Domain>(
        name: string,
        domain: domain,
        seen: string[]
    ): ResolvedPredicate<domain, inferred> {
        const resolution = this.resolve(name)[domain]
        if (resolution === undefined) {
            return throwInternalError(
                `Expected '${name}' to have a definition including '${domain}'`
            )
        }
        if (typeof resolution !== "string") {
            return resolution as any
        }
        if (seen.includes(resolution)) {
            return throwParseError(
                buildShallowCycleErrorMessage(resolution, seen)
            )
        }
        seen.push(resolution)
        return this.resolveToDomainRecurse(resolution, domain, seen)
    }

    memoizedParse(def: string): TypeNode {
        if (def in this.cache) {
            return this.cache[def]
        }
        const root =
            maybeNaiveParse(def, this as ScopeRoot) ??
            fullStringParse(def, this as ScopeRoot)
        this.cache[def] = deepFreeze(root)
        return root
    }
}

type validateAliases<aliases, scope extends Dictionary> = evaluate<{
    [name in keyof aliases]: validateDefinition<aliases[name], scope>
}>

type inferAliases<aliases, scope extends Dictionary> = evaluate<{
    [name in keyof aliases]: inferDefinition<aliases[name], scope, aliases>
}>

type inferScopeContext<aliases, scope extends Dictionary> = inferAliases<
    aliases,
    scope
> &
    scope

export const buildShallowCycleErrorMessage = (name: string, seen: string[]) =>
    `Alias '${name}' has a shallow resolution cycle: ${[...seen, name].join(
        "=>"
    )}`
