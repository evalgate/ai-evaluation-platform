/**
 * Enhanced Assertion Library
 * Tier 1.3: Pre-Built Assertion Library with 20+ built-in assertions
 * 
 * @example
 * ```typescript
 * import { expect } from '@ai-eval-platform/sdk';
 * 
 * const output = "Hello, how can I help you today?";
 * 
 * expect(output).toContainKeywords(['help', 'today']);
 * expect(output).toHaveSentiment('positive');
 * expect(output).toMatchPattern(/help/i);
 * expect(output).toHaveLength({ min: 10, max: 100 });
 * ```
 */

export interface AssertionResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  message?: string;
}

export class AssertionError extends Error {
  constructor(
    message: string,
    public expected: any,
    public actual: any,
  ) {
    super(message);
    this.name = "AssertionError";
    Object.setPrototypeOf(this, AssertionError.prototype);
  }
}

/**
 * Fluent assertion builder
 */
export class Expectation {
  constructor(private value: any) {}

  /**
   * Assert value equals expected
   * @example expect(output).toEqual("Hello")
   */
  toEqual(expected: any, message?: string): AssertionResult {
    const passed = JSON.stringify(this.value) === JSON.stringify(expected);
    return {
      name: "toEqual",
      passed,
      expected,
      actual: this.value,
      message: message || (passed ? "Values are equal" : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.value)}`)
    };
  }

  /**
   * Assert value contains substring
   * @example expect(output).toContain("help")
   */
  toContain(substring: string, message?: string): AssertionResult {
    const text = String(this.value);
    const passed = text.includes(substring);
    return {
      name: "toContain",
      passed,
      expected: substring,
      actual: text,
      message: message || (passed ? `Text contains "${substring}"` : `Text does not contain "${substring}"`)
    };
  }

  /**
   * Assert value contains all keywords
   * @example expect(output).toContainKeywords(['help', 'support'])
   */
  toContainKeywords(keywords: string[], message?: string): AssertionResult {
    const text = String(this.value).toLowerCase();
    const missingKeywords = keywords.filter(k => !text.includes(k.toLowerCase()));
    const passed = missingKeywords.length === 0;
    return {
      name: "toContainKeywords",
      passed,
      expected: keywords,
      actual: text,
      message: message || (passed ? `Contains all keywords` : `Missing keywords: ${missingKeywords.join(', ')}`)
    };
  }

  /**
   * Assert value does not contain substring
   * @example expect(output).toNotContain("error")
   */
  toNotContain(substring: string, message?: string): AssertionResult {
    const text = String(this.value);
    const passed = !text.includes(substring);
    return {
      name: "toNotContain",
      passed,
      expected: `not containing "${substring}"`,
      actual: text,
      message: message || (passed ? `Text does not contain "${substring}"` : `Text contains "${substring}"`)
    };
  }

  /**
   * Assert value does not contain PII (emails, phone numbers, SSN)
   * @example expect(output).toNotContainPII()
   */
  toNotContainPII(message?: string): AssertionResult {
    const text = String(this.value);
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    
    const foundPII = [];
    if (emailPattern.test(text)) foundPII.push('email');
    if (phonePattern.test(text)) foundPII.push('phone number');
    if (ssnPattern.test(text)) foundPII.push('SSN');
    
    const passed = foundPII.length === 0;
    return {
      name: "toNotContainPII",
      passed,
      expected: "no PII",
      actual: foundPII.length > 0 ? `Found: ${foundPII.join(', ')}` : "no PII",
      message: message || (passed ? "No PII detected" : `PII detected: ${foundPII.join(', ')}`)
    };
  }

  /**
   * Assert value matches regular expression
   * @example expect(output).toMatchPattern(/\d{3}-\d{3}-\d{4}/)
   */
  toMatchPattern(pattern: RegExp, message?: string): AssertionResult {
    const text = String(this.value);
    const passed = pattern.test(text);
    return {
      name: "toMatchPattern",
      passed,
      expected: pattern.toString(),
      actual: text,
      message: message || (passed ? `Matches pattern ${pattern}` : `Does not match pattern ${pattern}`)
    };
  }

  /**
   * Assert value is valid JSON
   * @example expect(output).toBeValidJSON()
   */
  toBeValidJSON(message?: string): AssertionResult {
    let passed = false;
    let parsedJson = null;

    try {
      parsedJson = JSON.parse(String(this.value));
      passed = true;
    } catch (e) {
      passed = false;
    }

    return {
      name: "toBeValidJSON",
      passed,
      expected: "valid JSON",
      actual: passed ? parsedJson : this.value,
      message: message || (passed ? "Valid JSON" : "Invalid JSON")
    };
  }

  /**
   * Assert JSON matches schema
   * @example expect(output).toMatchJSON({ status: 'success' })
   */
  toMatchJSON(schema: Record<string, any>, message?: string): AssertionResult {
    let passed = false;
    let parsedJson = null;

    try {
      parsedJson = JSON.parse(String(this.value));
      const requiredKeys = Object.keys(schema);
      const actualKeys = Object.keys(parsedJson);
      passed = requiredKeys.every(key => actualKeys.includes(key));
    } catch (e) {
      passed = false;
    }

    return {
      name: "toMatchJSON",
      passed,
      expected: schema,
      actual: parsedJson,
      message: message || (passed ? "JSON matches schema" : "JSON does not match schema")
    };
  }

  /**
   * Assert value has expected sentiment
   * @example expect(output).toHaveSentiment('positive')
   */
  toHaveSentiment(expected: 'positive' | 'negative' | 'neutral', message?: string): AssertionResult {
    const text = String(this.value).toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'happy', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'disappointing', 'sad', 'useless'];

    const positiveCount = positiveWords.filter(w => text.includes(w)).length;
    const negativeCount = negativeWords.filter(w => text.includes(w)).length;

    let actual: 'positive' | 'negative' | 'neutral';
    if (positiveCount > negativeCount) actual = 'positive';
    else if (negativeCount > positiveCount) actual = 'negative';
    else actual = 'neutral';

    const passed = actual === expected;
    return {
      name: "toHaveSentiment",
      passed,
      expected,
      actual,
      message: message || (passed ? `Sentiment is ${expected}` : `Expected ${expected}, got ${actual}`)
    };
  }

  /**
   * Assert string length is within range
   * @example expect(output).toHaveLength({ min: 10, max: 100 })
   */
  toHaveLength(range: { min?: number; max?: number }, message?: string): AssertionResult {
    const length = String(this.value).length;
    const passed = (range.min === undefined || length >= range.min) && 
                   (range.max === undefined || length <= range.max);
    return {
      name: "toHaveLength",
      passed,
      expected: range,
      actual: length,
      message: message || (passed ? `Length ${length} is within range` : `Length ${length} not in range`)
    };
  }

  /**
   * Assert no hallucinations (all ground truth facts present)
   * @example expect(output).toNotHallucinate(['fact1', 'fact2'])
   */
  toNotHallucinate(groundTruth: string[], message?: string): AssertionResult {
    const text = String(this.value).toLowerCase();
    const missingFacts = groundTruth.filter(fact => !text.includes(fact.toLowerCase()));
    const passed = missingFacts.length === 0;
    return {
      name: "toNotHallucinate",
      passed,
      expected: "all ground truth facts",
      actual: missingFacts.length > 0 ? `Missing: ${missingFacts.join(', ')}` : "all facts present",
      message: message || (passed ? "No hallucinations detected" : `Missing facts: ${missingFacts.join(', ')}`)
    };
  }

  /**
   * Assert response latency is within limit
   * @example expect(durationMs).toBeFasterThan(1000)
   */
  toBeFasterThan(maxMs: number, message?: string): AssertionResult {
    const duration = Number(this.value);
    const passed = duration <= maxMs;
    return {
      name: "toBeFasterThan",
      passed,
      expected: `<= ${maxMs}ms`,
      actual: `${duration}ms`,
      message: message || (passed ? `${duration}ms within limit` : `${duration}ms exceeds ${maxMs}ms`)
    };
  }

  /**
   * Assert value is truthy
   * @example expect(result).toBeTruthy()
   */
  toBeTruthy(message?: string): AssertionResult {
    const passed = Boolean(this.value);
    return {
      name: "toBeTruthy",
      passed,
      expected: "truthy value",
      actual: this.value,
      message: message || (passed ? "Value is truthy" : "Value is falsy")
    };
  }

  /**
   * Assert value is falsy
   * @example expect(error).toBeFalsy()
   */
  toBeFalsy(message?: string): AssertionResult {
    const passed = !Boolean(this.value);
    return {
      name: "toBeFalsy",
      passed,
      expected: "falsy value",
      actual: this.value,
      message: message || (passed ? "Value is falsy" : "Value is truthy")
    };
  }

  /**
   * Assert value is greater than expected
   * @example expect(score).toBeGreaterThan(0.8)
   */
  toBeGreaterThan(expected: number, message?: string): AssertionResult {
    const value = Number(this.value);
    const passed = value > expected;
    return {
      name: "toBeGreaterThan",
      passed,
      expected: `> ${expected}`,
      actual: value,
      message: message || (passed ? `${value} > ${expected}` : `${value} <= ${expected}`)
    };
  }

  /**
   * Assert value is less than expected
   * @example expect(errorRate).toBeLessThan(0.05)
   */
  toBeLessThan(expected: number, message?: string): AssertionResult {
    const value = Number(this.value);
    const passed = value < expected;
    return {
      name: "toBeLessThan",
      passed,
      expected: `< ${expected}`,
      actual: value,
      message: message || (passed ? `${value} < ${expected}` : `${value} >= ${expected}`)
    };
  }

  /**
   * Assert value is between min and max
   * @example expect(score).toBeBetween(0, 1)
   */
  toBeBetween(min: number, max: number, message?: string): AssertionResult {
    const value = Number(this.value);
    const passed = value >= min && value <= max;
    return {
      name: "toBeBetween",
      passed,
      expected: `between ${min} and ${max}`,
      actual: value,
      message: message || (passed ? `${value} is within range` : `${value} is outside range`)
    };
  }

  /**
   * Assert value contains code block
   * @example expect(output).toContainCode()
   */
  toContainCode(message?: string): AssertionResult {
    const text = String(this.value);
    const hasCodeBlock = /```[\s\S]*?```/.test(text) || /<code>[\s\S]*?<\/code>/.test(text);
    return {
      name: "toContainCode",
      passed: hasCodeBlock,
      expected: "code block",
      actual: text,
      message: message || (hasCodeBlock ? "Contains code block" : "No code block found")
    };
  }

  /**
   * Assert value is professional tone (no profanity)
   * @example expect(output).toBeProfessional()
   */
  toBeProfessional(message?: string): AssertionResult {
    const text = String(this.value).toLowerCase();
    const profanity = ['damn', 'hell', 'shit', 'fuck', 'ass', 'bitch', 'crap'];
    const foundProfanity = profanity.filter(word => text.includes(word));
    const passed = foundProfanity.length === 0;
    return {
      name: "toBeProfessional",
      passed,
      expected: "professional tone",
      actual: foundProfanity.length > 0 ? `Found: ${foundProfanity.join(', ')}` : "professional",
      message: message || (passed ? "Professional tone" : `Unprofessional language: ${foundProfanity.join(', ')}`)
    };
  }

  /**
   * Assert value has proper grammar (basic checks)
   * @example expect(output).toHaveProperGrammar()
   */
  toHaveProperGrammar(message?: string): AssertionResult {
    const text = String(this.value);
    const issues = [];
    
    // Check for double spaces
    if (/  +/.test(text)) issues.push('double spaces');
    
    // Check for missing periods at end
    if (text.length > 10 && !/[.!?]$/.test(text.trim())) issues.push('missing ending punctuation');
    
    // Check for lowercase sentence starts
    if (/\.\s+[a-z]/.test(text)) issues.push('lowercase after period');
    
    const passed = issues.length === 0;
    return {
      name: "toHaveProperGrammar",
      passed,
      expected: "proper grammar",
      actual: issues.length > 0 ? `Issues: ${issues.join(', ')}` : "proper grammar",
      message: message || (passed ? "Proper grammar" : `Grammar issues: ${issues.join(', ')}`)
    };
  }
}

/**
 * Create an expectation for fluent assertions
 * 
 * @example
 * ```typescript
 * const output = "Hello, how can I help you?";
 * 
 * expect(output).toContain("help");
 * expect(output).toHaveSentiment('positive');
 * expect(output).toHaveLength({ min: 10, max: 100 });
 * ```
 */
export function expect(value: any): Expectation {
  return new Expectation(value);
}

/**
 * Run multiple assertions and collect results
 * 
 * @example
 * ```typescript
 * const results = runAssertions([
 *   () => expect(output).toContain("help"),
 *   () => expect(output).toHaveSentiment('positive'),
 *   () => expect(output).toHaveLength({ min: 10 })
 * ]);
 * 
 * const allPassed = results.every(r => r.passed);
 * ```
 */
export function runAssertions(assertions: (() => AssertionResult)[]): AssertionResult[] {
  return assertions.map((assertion) => {
    try {
      return assertion();
    } catch (error) {
      return {
        name: "unknown",
        passed: false,
        expected: null,
        actual: null,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
}

// Re-export for convenience
export type { AssertionResult };