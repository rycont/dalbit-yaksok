import {
  Evaluable,
  Expression,
  Identifier,
  type Node,
} from "../../../../node/base.ts";
import { Formula, ValueWithParenthesis } from "../../../../node/calculation.ts";
import { RangeOperator } from "../../../../node/operator.ts";
import { FunctionInvoke } from "../../../../node/function.ts";
import { FunctionCallOperatorAmbiguityError } from "../../../../error/prepare.ts";

import { IndexFetch } from "../../../../node/list.ts";
import {
  EmptyLiteral,
  NumberLiteral,
} from "../../../../node/primitive-literal.ts";
import type { IndexedValue } from "../../../../value/indexed.ts";
import { getCombination } from "./combination.ts";

import type {
  FunctionTemplate,
  FunctionTemplatePiece,
} from "../../../../type/function-template.ts";
import type { PatternUnit, Rule } from "../../type.ts";
import { RULE_FLAGS } from "../../type.ts";
import { Block, TupleLiteral } from "../../../../node/index.ts";
import { EOL } from "../../../../node/misc.ts";
import { KeyValuePair, KeyValuePairSequence } from "../../../../node/dict.ts";
import { TupleValue } from "@dalbit-yaksok/core";

interface VariantedPart {
  index: number;
  candidates: string[];
}

export function createFunctionInvokeRule(
  functionTemplate: FunctionTemplate,
): Rule[] {
  const variantParts = [...getVariantParts(functionTemplate.pieces)];
  const availableCombinations = getCombination(
    variantParts.map((v) => v.candidates.map((_, i) => i)),
  );

  const templatePieces = availableCombinations.map((choice) =>
    createTemplatePieceFromChoices(
      functionTemplate.pieces,
      variantParts,
      choice,
    )
  );

  const rules = templatePieces.flatMap((pieces) =>
    createRuleFromFunctionTemplate({
      ...functionTemplate,
      pieces,
    })
  );

  return rules;
}

function* getVariantParts(
  templatePieces: FunctionTemplatePiece[],
): Iterable<VariantedPart> {
  for (const templatePieceIndex in templatePieces) {
    const templatePiece = templatePieces[templatePieceIndex];

    const isStatic = templatePiece.type === "static";
    const hasSlash = templatePiece.value.length;

    if (isStatic && hasSlash) {
      yield {
        index: +templatePieceIndex,
        candidates: templatePiece.value,
      };
    }
  }
}

function createTemplatePieceFromChoices(
  templatePieces: FunctionTemplatePiece[],
  variantParts: VariantedPart[],
  choice: number[],
): FunctionTemplatePiece[] {
  const parts = [...templatePieces];

  for (const [index, optionIndex] of choice.entries()) {
    const { candidates } = variantParts[index];
    const content = candidates[optionIndex];

    parts[variantParts[index].index] = {
      type: "static",
      value: [content],
    };
  }

  return parts;
}

function createRuleFromFunctionTemplate(
  functionTemplate: FunctionTemplate,
): Rule[] {
  const pattern = createInlineInvokerPattern(functionTemplate.pieces);
  const signatureType = getSignatureType(functionTemplate.pieces);

  if (signatureType === "bracket-call") {
    const parameterBlockRule = createParameterBlockRule(functionTemplate);
    const inlineBracketRule = createInlineBracketRule(functionTemplate);

    return [parameterBlockRule, inlineBracketRule];
  }

  const parameterNames = functionTemplate.pieces.filter((p) =>
    p.type !== "static"
  ).flatMap((p) => p.value);

  const inlineInvoker: Rule = {
    pattern,
    factory(matchedNodes, tokens) {
      const params = parseParameterFromTemplate(
        functionTemplate,
        matchedNodes,
      );

      // 어떤 인자든 괄호 없는 Formula가 들어오면 연산자 우선순위 모호성이다.
      // 예) `1 <= 배열 길이`  → 첫 인자가 Formula(1,<=,배열)
      //     `구매하기 '칫솔' '치약' == '성공'`  → 마지막 인자가 Formula('치약',==,'성공')
      //
      // 예외: `Evaluable ~ Evaluable` 형태의 범위 Formula는 허용한다.
      // 예) `1~100 사이 무작위 값 가져오기` → 인자가 RangeFormula(1,~,100)
      //     범위의 경계가 명확하므로 모호성이 없다.
      for (const param of Object.values(params)) {
        if (param instanceof Formula && !isRangeFormula(param)) {
          throw new FunctionCallOperatorAmbiguityError({ tokens });
        }
      }

      return new FunctionInvoke(
        {
          name: functionTemplate.name,
          argumentEvaluator: params,
          parameterNames,
        },
        tokens,
      );
    },
    config: {
      exported: true,
    },
    flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
  };

  return [inlineInvoker];
}

function createInlineBracketRule(functionTemplate: FunctionTemplate) {
  const pattern = createInlineBracketPattern(
    functionTemplate.pieces,
  );

  const parseArgumentTuple = createArgumentTupleParser(
    functionTemplate.pieces,
  );

  const parameterNames = functionTemplate.pieces.filter((p) =>
    p.type !== "static"
  ).flatMap((p) => p.value);

  const rule: Rule = {
    pattern,
    factory(matchedNodes, tokens) {
      const argumentTuple = matchedNodes[matchedNodes.length - 1];
      const params = parseArgumentTuple(argumentTuple);

      if (!params) {
        return null;
      }

      return new FunctionInvoke(
        {
          name: functionTemplate.name,
          argumentEvaluator: params,
          parameterNames,
        },
        tokens,
      );
    },
    config: {
      exported: true,
    },
    flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
  };

  return rule;
}

function createArgumentTupleParser(
  pieces: FunctionTemplatePiece[],
) {
  const parameterNames = pieces[pieces.length - 1].value;

  return function parseArgument(node: Node) {
    if (node instanceof TupleLiteral) {
      const parsedArgument = Object.fromEntries(
        parameterNames.map((name, index) => [name, node.items[index]]),
      );

      return parsedArgument;
    }

    if (node instanceof ValueWithParenthesis) {
      return {
        [parameterNames[0]]: node.value,
      };
    }

    return null;
  };
}

function createInlineBracketPattern(
  pieces: FunctionTemplatePiece[],
): PatternUnit[] {
  const pattern = pieces.filter((p) => p.type === "static").map((p) =>
    ({
      type: Identifier,
      value: p.value[0],
    }) as PatternUnit
  ).concat([{
    type: Evaluable,
  }]);

  return pattern;
}

function createParameterBlockRule(functionTemplate: FunctionTemplate) {
  const pattern = createBlockParameterInvokerPattern(
    functionTemplate.pieces,
  );

  const parameterNames = functionTemplate.pieces.filter((p) =>
    p.type !== "static"
  ).flatMap((p) => p.value);

  const rule: Rule = {
    pattern,
    factory(matchedNodes, tokens) {
      const params = extractParamsFromBlock(
        matchedNodes[matchedNodes.length - 1],
      );

      return new FunctionInvoke(
        {
          name: functionTemplate.name,
          argumentEvaluator: params,
          parameterNames,
        },
        tokens,
      );
    },
    config: {
      exported: true,
    },
    flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
  };

  return rule;
}

function extractParamsFromBlock(node: Node): Record<string, Evaluable> {
  if (!(node instanceof Block)) {
    return {};
  }

  const kvSequence = node.children[0];

  if (!(kvSequence instanceof KeyValuePairSequence)) {
    if (kvSequence instanceof KeyValuePair) {
      return { [kvSequence.key]: kvSequence.entry };
    }

    return {};
  }

  const pairs = Object.fromEntries(
    kvSequence.pairs.map((p) => [p.key, p.entry]),
  );
  return pairs;
}

function createInlineInvokerPattern(
  pieces: FunctionTemplatePiece[],
): PatternUnit[] {
  return pieces.map((piece) => {
    if (piece.type === "static") {
      return {
        type: Identifier,
        value: piece.value[0],
      };
    }

    return {
      type: Evaluable,
    };
  });
}

function createBlockParameterInvokerPattern(
  pieces: FunctionTemplatePiece[],
): PatternUnit[] {
  const functionHeader: PatternUnit[] = pieces.slice(0, -1).map((p) => ({
    type: Identifier,
    value: p.value[0],
  }));

  const invokerPattern = functionHeader.concat([{
    type: EOL,
  }, {
    type: Block,
  }]);

  return invokerPattern;
}

function getSignatureType(pieces: FunctionTemplatePiece[]) {
  const hasInterleaving = pieces.slice(0, -1).some((p) => p.type !== "static");

  if (hasInterleaving) {
    return "interleaving";
  }

  const lastPiece = pieces[pieces.length - 1];

  if (lastPiece.type === "static") {
    return "no-parameter";
  }

  return "bracket-call";
}

export function parseParameterFromTemplate(
  template: FunctionTemplate,
  matchedNodes: Node[],
): Record<string, Evaluable> {
  let nodeIndex = 0;
  const parameters: [string, Evaluable][] = [];

  for (const piece of template.pieces) {
    if (piece.type === "static") {
      nodeIndex++;
      continue;
    }

    const matchedNode = matchedNodes[nodeIndex] as Evaluable;
    nodeIndex++;

    if (piece.type === "destructure") {
      for (let i = 0; i < piece.value.length; i++) {
        const paramName = piece.value[i];
        const indexFetch = new IndexFetch(
          matchedNode as Evaluable<IndexedValue>,
          new NumberLiteral(i, matchedNode.tokens),
          matchedNode.tokens,
        );
        parameters.push([paramName, indexFetch]);
      }
    } else {
      parameters.push([piece.value[0], matchedNode]);
    }
  }

  return Object.fromEntries(parameters);
}

/**
 * `Evaluable ~ Evaluable` 형태의 범위 Formula인지 확인한다.
 * 이 경우는 모호성이 없으므로 FunctionCallOperatorAmbiguityError를 던지지 않는다.
 * 예) `1~100 사이 무작위 값 가져오기` → isRangeFormula(Formula(1, ~, 100)) === true
 */
function isRangeFormula(formula: Formula): boolean {
  const { terms } = formula;
  return (
    terms.length === 3 &&
    terms[0] instanceof Evaluable &&
    terms[1] instanceof RangeOperator &&
    terms[2] instanceof Evaluable
  );
}
