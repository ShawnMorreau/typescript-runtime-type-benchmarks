import type { deepImmutable, Dictionary, mutable } from "./generics"

export const deepFreeze = <value>(value: value): deepImmutable<value> =>
    (Object.isFrozen(value)
        ? value
        : Array.isArray(value)
        ? Object.freeze(value.map(deepFreeze))
        : // Object.isFrozen will always be true for non-objects, so we can safely cast to Dictionary
          deepFreezeDictionary(value as Dictionary)) as deepImmutable<value>

const deepFreezeDictionary = (value: Dictionary) => {
    const result: mutable<Dictionary> = {}
    for (const k in value) {
        result[k] = deepFreeze(value[k] as any)
    }
    return Object.freeze(result)
}
