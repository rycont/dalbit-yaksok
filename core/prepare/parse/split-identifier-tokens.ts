import { Identifier } from "../../node/base.ts";
import { Token, TOKEN_TYPE } from "../tokenize/token.ts";
import type { Rule } from "./type.ts";

const SKIPPABLE_TOKEN_TYPES = new Set([TOKEN_TYPE.SPACE]);

export function splitIdentifierTokens(
  tokens: Token[],
  dynamicRules: [Rule[][], Rule[][]],
): Token[] {
  const staticIdentifierPieces = collectStaticIdentifierPieces(dynamicRules);

  if (staticIdentifierPieces.size === 0) {
    return tokens;
  }

  const sortedSuffixes = [...staticIdentifierPieces].sort(
    (a, b) => b.length - a.length,
  );

  const result: Token[] = [];
  const declaredIdentifiers = new Set<string>();

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token.type === TOKEN_TYPE.IDENTIFIER) {
      const splitted = splitIdentifierToken(
        token,
        sortedSuffixes,
        declaredIdentifiers,
      );

      if (splitted) {
        result.push(...splitted);
      } else {
        result.push(token);
      }

      if (isAssignmentTarget(tokens, index)) {
        declaredIdentifiers.add(token.value);
      }
    } else {
      result.push(token);
    }
  }

  return result;
}

function collectStaticIdentifierPieces(dynamicRules: [Rule[][], Rule[][]]) {
  const pieces = new Set<string>();

  const allRules = [
    ...dynamicRules[0].flat(),
    ...dynamicRules[1].flat(),
  ];

  for (const rule of allRules) {
    for (const patternUnit of rule.pattern) {
      if (patternUnit.type !== Identifier) {
        continue;
      }

      if (!patternUnit.value) {
        continue;
      }

      pieces.add(patternUnit.value);
    }
  }

  return pieces;
}

function splitIdentifierToken(
  token: Token,
  suffixes: string[],
  declaredIdentifiers: Set<string>,
): Token[] | null {
  if (declaredIdentifiers.size === 0) {
    return null;
  }

  for (const suffix of suffixes) {
    if (!token.value.endsWith(suffix)) {
      continue;
    }

    if (suffix.length === token.value.length) {
      continue;
    }

    const prefix = token.value.slice(0, token.value.length - suffix.length);

    if (!declaredIdentifiers.has(prefix)) {
      continue;
    }

    const prefixToken = cloneToken(
      token,
      prefix,
      token.position.column,
    );

    const suffixToken = cloneToken(
      token,
      suffix,
      token.position.column + getColumnWidth(prefix),
    );

    return [prefixToken, suffixToken];
  }

  return null;
}

function cloneToken(token: Token, value: string, column: number): Token {
  return {
    type: TOKEN_TYPE.IDENTIFIER,
    value,
    position: {
      line: token.position.line,
      column,
    },
  };
}

function getColumnWidth(text: string) {
  return Array.from(text).length;
}

function isAssignmentTarget(tokens: Token[], index: number) {
  const token = tokens[index];
  if (token.type !== TOKEN_TYPE.IDENTIFIER) {
    return false;
  }

  const nextTokenIndex = findNextSignificantTokenIndex(tokens, index + 1);

  if (nextTokenIndex === -1) {
    return false;
  }

  return tokens[nextTokenIndex].type === TOKEN_TYPE.ASSIGNER;
}

function findNextSignificantTokenIndex(tokens: Token[], startIndex: number) {
  for (let index = startIndex; index < tokens.length; index++) {
    const token = tokens[index];
    if (SKIPPABLE_TOKEN_TYPES.has(token.type)) {
      continue;
    }

    return index;
  }

  return -1;
}
