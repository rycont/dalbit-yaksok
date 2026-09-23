import { FunctionHeaderPart, FunctionPartType } from './type.ts'

export function createVerbalVariant(headerParts: FunctionHeaderPart[]) {
    const lastPart = headerParts[headerParts.length - 1]

    if (lastPart.type !== FunctionPartType.static) {
        return headerParts
    }

    const newLastPart = {
        ...lastPart,
        names: lastPart.names.concat(
            lastPart.names
                .filter((n) => n.endsWith('기'))
                .map((n) => n.slice(0, -1) + '고'),
        ),
    }

    return headerParts.slice(0, -1).concat([newLastPart])
}
