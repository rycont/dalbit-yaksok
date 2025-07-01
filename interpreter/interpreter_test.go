package interpreter

import (
	"bytes"
	"io"
	"math"
	"os"
	"strings" // Added strings import
	"testing"
)

func TestEvaluateIntegerLiterals(t *testing.T) {
	tests := []struct {
		input    string
		expected int64
		hasError bool
	}{
		{"123", 123, false},
		{"0", 0, false},
		{"-5", -5, false},
		{"9223372036854775807", math.MaxInt64, false},
		{"-9223372036854775808", math.MinInt64, false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := Evaluate(tt.input)

			if tt.hasError {
				if err == nil {
					t.Errorf("expected an error for input %s, but got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("for input %s, unexpected error: %v", tt.input, err)
				return
			}

			val, ok := result.(int64)
			if !ok {
				t.Errorf("for input %s, expected result type int64, got %T (value: %v)", tt.input, result, result)
				return
			}

			if val != tt.expected {
				t.Errorf("for input %s, expected %d, got %d", tt.input, tt.expected, val)
			}
		})
	}
}

func TestEvaluateMultiplicationDivision(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedValue interface{}
		expectedError bool
		errorContains string // Substring to check in the error message
	}{
		{"int multiply", "2 * 3", int64(6), false, ""},
		{"int divide", "10 / 2", float64(5.0), false, ""},
		{"float multiply", "2.5 * 2", float64(5.0), false, ""},
		{"float divide", "5.0 / 2.0", float64(2.5), false, ""},
		{"mixed multiply int float", "3 * 1.5", float64(4.5), false, ""},
		{"mixed divide float int", "7.0 / 2", float64(3.5), false, ""},
		{"mixed divide int float", "10 / 2.5", float64(4.0), false, ""},
		{"int division to float", "7 / 2", float64(3.5), false, ""},
		{"multiple ops left to right", "3 * 4 / 2", float64(6.0), false, ""},   // (3*4)/2 = 12/2=6
		{"multiple ops left to right 2", "10 / 2 * 3", float64(15.0), false, ""}, // (10/2)*3 = 5*3=15
		{"divide by zero int", "5 / 0", nil, true, "division by zero"},
		{"divide by zero float", "5.0 / 0.0", nil, true, "division by zero"},
		{"spaced input", " 2 * 3 ", int64(6), false, ""},
		// Literals that should be handled by parseFactor (called by evaluateTerm)
		{"integer literal", "123", int64(123), false, ""},
		{"float literal", "3.14", float64(3.14), false, ""},
		{"string literal", `"hello"`, "hello", false, ""}, // String literals won't be part of arithmetic but parseFactor should handle them
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// For this test, we are directly testing evaluateTerm (or parseFactor for literals)
			// The actual implementation will determine which one to call.
			// Let's assume evaluateTerm is the entry point for these expressions.
			result, err := evaluateTerm(tt.input) // evaluateTerm will call parseFactor for literals

			if tt.expectedError {
				if err == nil {
					t.Errorf("expected an error for input '%s', but got nil", tt.input)
				} else if tt.errorContains != "" && !strings.Contains(err.Error(), tt.errorContains) {
					t.Errorf("for input '%s', expected error containing '%s', got '%v'", tt.input, tt.errorContains, err)
				}
				return
			}

			if err != nil {
				t.Errorf("for input '%s', unexpected error: %v", tt.input, err)
				return
			}

			switch expected := tt.expectedValue.(type) {
			case int64:
				val, ok := result.(int64)
				if !ok {
					t.Errorf("for input '%s', expected result type int64, got %T (value: %v)", tt.input, result, result)
					return
				}
				if val != expected {
					t.Errorf("for input '%s', expected int64 %d, got %d", tt.input, expected, val)
				}
			case float64:
				val, ok := result.(float64)
				if !ok {
					// Allow int64 result if it's a whole number float, e.g. 6.0 vs 6
					if iVal, iOk := result.(int64); iOk && float64(iVal) == expected {
						// This is acceptable
					} else {
						t.Errorf("for input '%s', expected result type float64, got %T (value: %v)", tt.input, result, result)
						return
					}
				}
				if math.Abs(val-expected) > 1e-9 {
					t.Errorf("for input '%s', expected float64 %f, got %f", tt.input, expected, val)
				}
			case string:
				val, ok := result.(string)
				if !ok {
					t.Errorf("for input '%s', expected result type string, got %T (value: %v)", tt.input, result, result)
					return
				}
				if val != expected {
					t.Errorf("for input '%s', expected string '%s', got '%s'", tt.input, expected, val)
				}
			default:
				t.Errorf("unsupported expected type in test case: %T", tt.expectedValue)
			}
		})
	}
}

func TestEvaluateArithmeticWithPrecedence(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedValue interface{}
		expectedError bool
	}{
		{"add then multiply", "1 + 2 * 3", float64(7.0), false}, // 1 + (2*3) = 7
		{"subtract then divide", "10 - 6 / 2", float64(7.0), false}, // 10 - (6/2) = 7
		{"multiply add divide subtract", "2 * 3 + 6 / 2 - 1", float64(8.0), false}, // (2*3) + (6/2) - 1 = 6 + 3 - 1 = 8
		{"divide add multiply", "10 / 2.5 + 3 * 1.5", float64(8.5), false},      // (10/2.5) + (3*1.5) = 4 + 4.5 = 8.5
		{"complex with negatives", "-5 + 2 * -3", float64(-11.0), false},         // -5 + (2*-3) = -5 + -6 = -11
		{"division resulting in float", "1 + 4 / 2", float64(3.0), false},       // 1 + 2 = 3
		{"all int to float due to division", "1*2 + 7/2", float64(5.5), false}, // 2 + 3.5 = 5.5
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.input) // Evaluate is the main entry point

			if tt.expectedError {
				if err == nil {
					t.Errorf("expected an error for input '%s', but got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("for input '%s', unexpected error: %v", tt.input, err)
				return
			}

			// Since results involving division or float literals become float64,
			// we primarily expect float64.
			expectedF64, okExpectedFloat := tt.expectedValue.(float64)
			expectedI64, okExpectedInt := tt.expectedValue.(int64)

			valF64, okResultFloat := result.(float64)
			valI64, okResultInt := result.(int64)

			if okExpectedFloat {
				if !okResultFloat {
					// If result is int but expected is float (e.g. expected 7.0, got 7)
					if okResultInt && float64(valI64) == expectedF64 {
						// This is acceptable
					} else {
						t.Errorf("for input '%s', expected result type float64, got %T (value: %v)", tt.input, result, result)
						return
					}
				}
				if math.Abs(valF64-expectedF64) > 1e-9 {
					t.Errorf("for input '%s', expected float64 %f, got %f", tt.input, expectedF64, valF64)
				}
			} else if okExpectedInt { // Expected is int64
				if !okResultInt {
					t.Errorf("for input '%s', expected result type int64, got %T (value: %v)", tt.input, result, result)
					return
				}
				if valI64 != expectedI64 {
					t.Errorf("for input '%s', expected int64 %d, got %d", tt.input, expectedI64, valI64)
				}
			} else {
				t.Errorf("unsupported expected type in test case: %T", tt.expectedValue)
			}
		})
	}
}


func TestEvaluateArithmeticSimple(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedValue interface{}
		expectedError bool
	}{
		{"int add", "1 + 2", int64(3), false},
		{"int subtract", "5 - 3", int64(2), false},
		{"int add negative", "10 + -5", int64(5), false}, // Evaluate("-5") should work
		{"int add two negatives", "-2 + -3", int64(-5), false},
		{"float add", "1.5 + 2.5", float64(4.0), false},
		{"float subtract", "3.0 - 1.5", float64(1.5), false},
		{"mixed add int float", "10 + 2.5", float64(12.5), false},
		{"mixed subtract float int", "7.5 - 2", float64(5.5), false},
		{"multiple int add", "1 + 2 + 3", int64(6), false},         // Left-to-right
		{"multiple int subtract", "10 - 3 - 2", int64(5), false},   // Left-to-right
		{"mixed ops add subtract", "5 + 10 - 3", int64(12), false}, // Left-to-right
		{"spaced input", " 1 + 2 ", int64(3), false},
		// TODO: Add tests for error cases like "1 + abc", "1 + ", " + 2" etc.
		// For now, assuming valid structure for operands.
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.input)

			if tt.expectedError {
				if err == nil {
					t.Errorf("expected an error for input '%s', but got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("for input '%s', unexpected error: %v", tt.input, err)
				return
			}

			switch expected := tt.expectedValue.(type) {
			case int64:
				val, ok := result.(int64)
				if !ok {
					t.Errorf("for input '%s', expected result type int64, got %T (value: %v)", tt.input, result, result)
					return
				}
				if val != expected {
					t.Errorf("for input '%s', expected int64 %d, got %d", tt.input, expected, val)
				}
			case float64:
				val, ok := result.(float64)
				if !ok {
					t.Errorf("for input '%s', expected result type float64, got %T (value: %v)", tt.input, result, result)
					return
				}
				if math.Abs(val-expected) > 1e-9 {
					t.Errorf("for input '%s', expected float64 %f, got %f", tt.input, expected, val)
				}
			default:
				t.Errorf("unsupported expected type in test case: %T", tt.expectedValue)
			}
		})
	}
}

// captureStdout captures everything written to os.Stdout during the execution of a function.
func captureStdout(fn func()) string {
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	fn()

	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	return buf.String()
}

func TestExecuteLineShowStatement(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expectedOut   string
		expectedError bool // if we expect ExecuteLine itself to return an error
	}{
		{`show integer`, `123 보여주기`, "123\n", false},
		{`show float`, `3.14 보여주기`, "3.14\n", false},
		{`show string`, `"안녕하세요" 보여주기`, "안녕하세요\n", false}, // Note: Evaluate expects "안녕하세요"
		{`show zero`, `0 보여주기`, "0\n", false},
		{`show empty string`, `"" 보여주기`, "\n", false}, // Note: Evaluate expects ""
		// TODO: Add tests for invalid "보여주기" statements, e.g. "보여주기" (no value)
		// TODO: Add tests for when Evaluate returns an error, e.g. "\"잘못된값\" 보여주기" (if "잘못된값" is not a valid literal)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var err error
			output := captureStdout(func() {
				err = ExecuteLine(tt.input)
			})

			if tt.expectedError {
				if err == nil {
					t.Errorf("expected an error, but got nil")
				}
				// Optionally, check for specific error messages if needed
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if output != tt.expectedOut {
					t.Errorf("expected output '%s', got '%s'", tt.expectedOut, output)
				}
			}
		})
	}
}

func TestEvaluateStringLiterals(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		hasError bool
	}{
		{`"안녕하세요"`, "안녕하세요", false},
		{`""`, "", false},
		{`"여기는 공백이 있는 문자열입니다"`, "여기는 공백이 있는 문자열입니다", false},
		{`"숫자 123과 함께"`, "숫자 123과 함께", false},
		// TODO: Add tests for strings with escaped quotes if that feature is added e.g. "\"Hello \\\"World\\\"\""
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := Evaluate(tt.input)

			if tt.hasError {
				if err == nil {
					t.Errorf("expected an error for input %s, but got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("for input %s, unexpected error: %v", tt.input, err)
				return
			}

			val, ok := result.(string)
			if !ok {
				t.Errorf("for input %s, expected result type string, got %T (value: %v)", tt.input, result, result)
				return
			}

			if val != tt.expected {
				t.Errorf("for input %s, expected '%s', got '%s'", tt.input, tt.expected, val)
			}
		})
	}
}

func TestEvaluateFloatLiterals(t *testing.T) {
	tests := []struct {
		input    string
		expected float64
		hasError bool
	}{
		{"3.14", 3.14, false},
		{"-0.5", -0.5, false},
		{"0.0", 0.0, false},
		{"123.0", 123.0, false},
		// TODO: Add test cases for very small/large floats, precision issues if necessary
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := Evaluate(tt.input)

			if tt.hasError {
				if err == nil {
					t.Errorf("expected an error for input %s, but got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("for input %s, unexpected error: %v", tt.input, err)
				return
			}

			val, ok := result.(float64)
			if !ok {
				t.Errorf("for input %s, expected result type float64, got %T (value: %v)", tt.input, result, result)
				return
			}

			// Comparing floats requires tolerance for precision issues
			// However, for these specific literals, direct comparison should be fine.
			if math.Abs(val-tt.expected) > 1e-9 { // A small tolerance
				t.Errorf("for input %s, expected %f, got %f", tt.input, tt.expected, val)
			}
		})
	}
}
