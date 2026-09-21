import { Node } from '@dalbit-yaksok/core'
import { bold, border, dim } from './terminal.ts'

export function printTree(node: Node): string {
    const traitKeys = Array.from(
        new Set(Reflect.ownKeys(node)).difference(
            new Set(['tokens', 'subnode']),
        ),
    )

    const traits = traitKeys
        .map((k) =>
            node[k] === null || node[k] === undefined
                ? undefined
                : `${dim(k.toString())} ${stringify(node[k])}`,
        )
        .filter(Boolean)

    const traitString = traits.join('\n')
    const childrenString = renderChildren(node)

    if (traits.length === 1) {
        return [
            bold(node.constructor.name) + border(' │ ') + traitString,
            childrenString,
        ]
            .filter(Boolean)
            .join('\n')
    } else {
        return [bold(node.constructor.name), traitString, childrenString]
            .filter(Boolean)
            .join('\n')
    }
}

function stringify(content: unknown): string {
    if (content instanceof Node) {
        return printTree(content)
    }

    if (content instanceof Object && content.constructor === Object) {
        const entries = Object.entries(content).map(
            ([k, v]) => `${dim(k + ':')} ${stringify(v)}`,
        )

        if (entries.length === 0) {
            return `{ empty }`
        }

        return (
            '\n' +
            border('┌(dict)──────') +
            '\n' +
            indent(entries.join('\n')) +
            '\n' +
            border('└──────')
        )
    }

    return JSON.stringify(content)
}

function renderChildren(node: Node) {
    const children = node.subnode
        ? Array.isArray(node.subnode)
            ? node.subnode.map(printTree)
            : node.subnode instanceof Node
              ? [printTree(node.subnode)]
              : node.subnode instanceof Object
                ? Object.entries(node.subnode).map(([k, v]) => k + printTree(v))
                : (() => {
                      console.log(node.subnode)
                      throw new Error('Not implemented')
                  })()
        : []

    const childrenWidth = 6

    const subbox = children.length
        ? border('┌(subnode)' + '─'.repeat(childrenWidth - 1) + '\n') +
          indent(
              children
                  .map((c) =>
                      c.split('\n').length === 1 ? c + '\n' : c + '\n\n',
                  )
                  .join('')
                  .trim(),
          ) +
          '\n' +
          border('└' + '─'.repeat(childrenWidth - 1))
        : ''

    return subbox
}

function indent(content: string) {
    if (!content) {
        return ''
    }

    return `${border('│')} ` + content.replaceAll('\n', `\n${border('│')} `)
}
