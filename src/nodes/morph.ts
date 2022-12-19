import type { Dictionary } from "../utils/generics"
import type { TypeNode, TypeSet } from "./node"

export const morph = (name: MorphName, type: TypeNode) => morphs[name](type)

export type MorphName = keyof typeof morphs

const morphs = {
    array: (node): TypeSet => ({
        object: {
            kind: "Array",
            propTypes: {
                number: node
            }
        }
    })
} satisfies Dictionary<(input: TypeNode) => TypeNode>
