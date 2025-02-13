import { classifyObject, hasDomain } from "./classify"
import type { Dictionary, List } from "./generics"

/**
 * Simple check for deep strict equality. Recurses into dictionaries and arrays,
 * shallowly tests === for any other value. Does not handle cyclic data.
 */
export const deepEquals = (a: unknown, b: unknown) => {
    if (a === b) {
        return true
    }
    if (!hasDomain(a, "object") || !hasDomain(b, "object")) {
        return false
    }
    const aObjectDomain = classifyObject(a)
    const bObjectDomain = classifyObject(b)
    if (aObjectDomain !== bObjectDomain) {
        return false
    }
    return aObjectDomain === "Array"
        ? deepEqualsArray(a as List, b as List)
        : deepEqualsDict(a as Dictionary, b as Dictionary)
}

const deepEqualsDict = (a: Dictionary, b: Dictionary) => {
    const unseenBKeys = { ...b }
    for (const k in a) {
        if (k in b && deepEquals(a[k], b[k])) {
            delete unseenBKeys[k]
        } else {
            return false
        }
    }
    if (Object.keys(unseenBKeys).length) {
        return false
    }
    return true
}

const deepEqualsArray = (a: List, b: List) => {
    if (a.length !== b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++) {
        if (!deepEquals(a[i], b[i])) {
            return false
        }
    }
    return true
}
