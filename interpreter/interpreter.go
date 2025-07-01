package interpreter

import (
	"fmt"
	"strconv"
	"strings"
)

// parseFactor handles literals (numbers, strings) and potentially parentheses in the future.
func parseFactor(expression string) (interface{}, error) {
	expression = strings.TrimSpace(expression)
	if expression == "" {
		return nil, fmt.Errorf("cannot parse empty factor")
	}
	// 1. Check for string literal
	if len(expression) >= 2 && expression[0] == '"' && expression[len(expression)-1] == '"' {
		return expression[1 : len(expression)-1], nil
	}

	// 2. Check if it's a float
	// Check for "." must be careful if we ever parse things like object.method
	if strings.Contains(expression, ".") {
		if val, err := strconv.ParseFloat(expression, 64); err == nil {
			return val, nil
		}
		// It might be a string with a dot, or invalid float. Fall through.
	}

	// 3. Try parsing as int64
	if val, err := strconv.ParseInt(expression, 10, 64); err == nil {
		return val, nil
	}

	// If it wasn't a float (e.g. "."), strconv.ParseFloat would error.
	// If it wasn't an int, strconv.ParseInt would error.
	// If it was a string with numbers and a dot not parsable as float, it reaches here.
	return nil, fmt.Errorf("cannot parse factor: '%s'", expression)
}

// evaluateTerm handles multiplication (*) and division (/) operations.
func evaluateTerm(expression string) (interface{}, error) {
	expression = strings.TrimSpace(expression)

	mulIndex := strings.LastIndex(expression, "*")
	divIndex := strings.LastIndex(expression, "/")

	opIndex := -1
	opType := ""

	if mulIndex > divIndex {
		opIndex = mulIndex
		opType = "*"
	} else if divIndex > mulIndex {
		opIndex = divIndex
		opType = "/"
	} else if mulIndex != -1 { // Both are equal (and not -1) or only one type exists
		opIndex = mulIndex
		opType = "*"
	}

	// Check if the found operator is actually a binary operator and not part of a literal
	// e.g. in a scientific notation or some other context. This is a simple check.
	// A more robust parser would rely on token types.
	if opIndex > 0 && opIndex < len(expression)-1 { // Ensure operator is not at the very start or end
		// Potentially add more checks here if needed, e.g. character before/after opIndex
	} else if opIndex == 0 && opType == "/" { // e.g. "/ 5" is not valid
        // Let it fall through to parseFactor, which should fail for "/ 5"
    } else if opIndex == 0 && opType == "*" { // e.g. "* 5" is not valid
        // Let it fall through to parseFactor
    } else { // Operator not found in a binary context, or expression is too short
        opType = ""
    }


	if opType != "" {
		lhsStr := expression[:opIndex]
		// Ensure rhsStr starts after the operator. Operator is 1 char.
		rhsStr := expression[opIndex+1:]

		// TrimSpace is crucial here
		lhsStr = strings.TrimSpace(lhsStr)
		rhsStr = strings.TrimSpace(rhsStr)

		if lhsStr == "" || rhsStr == "" {
			return nil, fmt.Errorf("missing operand for operator %s in '%s'", opType, expression)
		}

		lhs, err := evaluateTerm(lhsStr)
		if err != nil {
			return nil, fmt.Errorf("failed to evaluate LHS ('%s') of '%s': %w", lhsStr, opType, err)
		}
		rhs, err := parseFactor(rhsStr)
		if err != nil {
			return nil, fmt.Errorf("failed to evaluate RHS ('%s') of '%s': %w", rhsStr, opType, err)
		}

		lFloat, lIsFloat := lhs.(float64)
		rFloat, rIsFloat := rhs.(float64)
		lInt, lIsInt := lhs.(int64)
		rInt, rIsInt := rhs.(int64)

		if opType == "/" {
			var numL, numR float64
			if lIsFloat { numL = lFloat } else if lIsInt { numL = float64(lInt) } else { return nil, fmt.Errorf("LHS of '/' is not a number: %T in '%s'", lhs, expression) }
			if rIsFloat { numR = rFloat } else if rIsInt { numR = float64(rInt) } else { return nil, fmt.Errorf("RHS of '/' is not a number: %T in '%s'", rhs, expression) }
			if numR == 0 { return nil, fmt.Errorf("division by zero in '%s'", expression) }
			return numL / numR, nil
		}

		if opType == "*" {
			if lIsFloat || rIsFloat {
				var numL, numR float64
				if lIsFloat { numL = lFloat } else if lIsInt { numL = float64(lInt) } else { return nil, fmt.Errorf("LHS of '*' is not a number: %T in '%s'", lhs, expression) }
				if rIsFloat { numR = rFloat } else if rIsInt { numR = float64(rInt) } else { return nil, fmt.Errorf("RHS of '*' is not a number: %T in '%s'", rhs, expression) }
				return numL * numR, nil
			} else if lIsInt && rIsInt {
				return lInt * rInt, nil
			} else { // Should not happen if types are number
				return nil, fmt.Errorf("type mismatch for '*': LHS %T, RHS %T in '%s'", lhs, rhs, expression)
			}
		}
	}
	// If no valid binary * or / operator found, or if operands were empty, parse as a single factor
	return parseFactor(expression)
}

// Evaluate handles addition (+) and subtraction (-) operations.
func Evaluate(expression string) (interface{}, error) {
	expression = strings.TrimSpace(expression)

	// Variables for actual operator index and type
	opIndex := -1
	opType := ""

	// Find the last '+'
	idxP := strings.LastIndex(expression, "+")
	// Find the last '-'
	idxM := strings.LastIndex(expression, "-")

	if idxP > idxM {
		opIndex = idxP
		opType = "+"
	} else if idxM > idxP {
        // Only consider this '-' a binary operator if it's not at the start of the expression.
        if idxM > 0 {
		    opIndex = idxM
		    opType = "-"
        }
	} else if idxP != -1 { // Both are equal (e.g. only one type, or same index which is impossible for diff ops)
		opIndex = idxP
		opType = "+"
	}
    // If opType is still "", it means no + or binary - was found (or - was at index 0).
    // In this case, we'll fall through to evaluateTerm.

	if opType != "" {
		lhsStr := strings.TrimSpace(expression[:opIndex])
		rhsStr := strings.TrimSpace(expression[opIndex+1:])

		if lhsStr != "" && rhsStr != "" { // Both operands must exist for a binary operation
			lhs, err := Evaluate(lhsStr)
			if err != nil {
				return nil, fmt.Errorf("failed to evaluate LHS ('%s') of '%s': %w", lhsStr, opType, err)
			}
			rhs, err := evaluateTerm(rhsStr)
			if err != nil {
				return nil, fmt.Errorf("failed to evaluate RHS ('%s') of '%s': %w", rhsStr, opType, err)
			}

			lFloat, lIsFloat := lhs.(float64)
			rFloat, rIsFloat := rhs.(float64)
			lInt, lIsInt := lhs.(int64)
			rInt, rIsInt := rhs.(int64)

			if opType == "+" {
				if lIsFloat || rIsFloat {
					var numL, numR float64
					if lIsFloat { numL = lFloat } else if lIsInt { numL = float64(lInt) } else { return nil, fmt.Errorf("LHS of '+' is not a number: %T in '%s'", lhs, expression) }
					if rIsFloat { numR = rFloat } else if rIsInt { numR = float64(rInt) } else { return nil, fmt.Errorf("RHS of '+' is not a number: %T in '%s'", rhs, expression) }
					return numL + numR, nil
				} else if lIsInt && rIsInt {
					return lInt + rInt, nil
				} else {
					return nil, fmt.Errorf("type mismatch for '+': LHS %T, RHS %T in '%s'", lhs, rhs, expression)
				}
			}

			if opType == "-" {
				if lIsFloat || rIsFloat {
					var numL, numR float64
					if lIsFloat { numL = lFloat } else if lIsInt { numL = float64(lInt) } else { return nil, fmt.Errorf("LHS of '-' is not a number: %T in '%s'", lhs, expression) }
					if rIsFloat { numR = rFloat } else if rIsInt { numR = float64(rInt) } else { return nil, fmt.Errorf("RHS of '-' is not a number: %T in '%s'", rhs, expression) }
					return numL - numR, nil
				} else if lIsInt && rIsInt {
					return lInt - rInt, nil
				} else {
					return nil, fmt.Errorf("type mismatch for '-': LHS %T, RHS %T in '%s'", lhs, rhs, expression)
				}
			}
		} else { // One of the operands is empty, means it's not a valid binary expression here
            // Fall through to evaluateTerm, which might parse it if it's a factor (e.g. "-5")
            return evaluateTerm(expression)
        }
	}
	// If no valid binary + or - operator found, evaluate as a term
	return evaluateTerm(expression)
}

// ExecuteLine executes a single line of Yak code.
func ExecuteLine(line string) error {
	showSuffix := " 보여주기"
	if strings.HasSuffix(line, showSuffix) {
		expressionToEvaluate := strings.TrimSpace(line[:len(line)-len(showSuffix)])

		value, err := Evaluate(expressionToEvaluate)
		if err != nil {
			return fmt.Errorf("error evaluating expression for '보여주기': %s, original error: %w", expressionToEvaluate, err)
		}

		fmt.Println(value)
		return nil
	}
	return fmt.Errorf("unsupported statement: %s", line)
}
