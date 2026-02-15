"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const assertions_1 = require("../assertions");
(0, vitest_1.describe)('Expectation fluent API', () => {
    (0, vitest_1.describe)('toEqual', () => {
        (0, vitest_1.it)('should pass when values are equal', () => {
            const result = (0, assertions_1.expect)('hello').toEqual('hello');
            (0, vitest_1.expect)(result.passed).toBe(true);
            (0, vitest_1.expect)(result.name).toBe('toEqual');
        });
        (0, vitest_1.it)('should fail when values differ', () => {
            const result = (0, assertions_1.expect)('hello').toEqual('world');
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
        (0, vitest_1.it)('should handle objects', () => {
            const result = (0, assertions_1.expect)({ a: 1 }).toEqual({ a: 1 });
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
    });
    (0, vitest_1.describe)('toContain', () => {
        (0, vitest_1.it)('should pass when substring is found', () => {
            const result = (0, assertions_1.expect)('Hello, world!').toContain('world');
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when substring is missing', () => {
            const result = (0, assertions_1.expect)('Hello, world!').toContain('foo');
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toContainKeywords', () => {
        (0, vitest_1.it)('should pass when all keywords are present (case insensitive)', () => {
            const result = (0, assertions_1.expect)('The quick Brown fox').toContainKeywords(['quick', 'brown']);
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when keywords are missing', () => {
            const result = (0, assertions_1.expect)('The quick fox').toContainKeywords(['quick', 'brown']);
            (0, vitest_1.expect)(result.passed).toBe(false);
            (0, vitest_1.expect)(result.message).toContain('brown');
        });
    });
    (0, vitest_1.describe)('toNotContain', () => {
        (0, vitest_1.it)('should pass when substring is absent', () => {
            const result = (0, assertions_1.expect)('safe text').toNotContain('danger');
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when substring is present', () => {
            const result = (0, assertions_1.expect)('some danger ahead').toNotContain('danger');
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toNotContainPII', () => {
        (0, vitest_1.it)('should pass with no PII', () => {
            const result = (0, assertions_1.expect)('Just a normal sentence').toNotContainPII();
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail with an email', () => {
            const result = (0, assertions_1.expect)('Contact me at user@example.com').toNotContainPII();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
        (0, vitest_1.it)('should fail with a phone number', () => {
            const result = (0, assertions_1.expect)('Call 555-123-4567').toNotContainPII();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
        (0, vitest_1.it)('should fail with an SSN', () => {
            const result = (0, assertions_1.expect)('SSN is 123-45-6789').toNotContainPII();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toMatchPattern', () => {
        (0, vitest_1.it)('should pass when pattern matches', () => {
            const result = (0, assertions_1.expect)('Order #12345').toMatchPattern(/Order #\d+/);
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when pattern does not match', () => {
            const result = (0, assertions_1.expect)('No order here').toMatchPattern(/Order #\d+/);
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toBeValidJSON', () => {
        (0, vitest_1.it)('should pass for valid JSON', () => {
            const result = (0, assertions_1.expect)('{"key": "value"}').toBeValidJSON();
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail for invalid JSON', () => {
            const result = (0, assertions_1.expect)('not json').toBeValidJSON();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toMatchJSON', () => {
        (0, vitest_1.it)('should pass when all schema keys exist', () => {
            const result = (0, assertions_1.expect)('{"status":"ok","data":1}').toMatchJSON({ status: '', data: '' });
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when schema keys are missing', () => {
            const result = (0, assertions_1.expect)('{"status":"ok"}').toMatchJSON({ status: '', missing: '' });
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toHaveSentiment', () => {
        (0, vitest_1.it)('should detect positive sentiment', () => {
            const result = (0, assertions_1.expect)('This is great and amazing!').toHaveSentiment('positive');
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should detect negative sentiment', () => {
            const result = (0, assertions_1.expect)('This is terrible and awful').toHaveSentiment('negative');
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should detect neutral sentiment', () => {
            const result = (0, assertions_1.expect)('The sky is blue').toHaveSentiment('neutral');
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
    });
    (0, vitest_1.describe)('toHaveLength', () => {
        (0, vitest_1.it)('should pass when within range', () => {
            const result = (0, assertions_1.expect)('hello').toHaveLength({ min: 3, max: 10 });
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when too short', () => {
            const result = (0, assertions_1.expect)('hi').toHaveLength({ min: 5 });
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
        (0, vitest_1.it)('should fail when too long', () => {
            const result = (0, assertions_1.expect)('a very long string').toHaveLength({ max: 5 });
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toNotHallucinate', () => {
        (0, vitest_1.it)('should pass when all facts are present', () => {
            const result = (0, assertions_1.expect)('Paris is the capital of France').toNotHallucinate(['paris', 'france']);
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when facts are missing', () => {
            const result = (0, assertions_1.expect)('Berlin is great').toNotHallucinate(['paris', 'france']);
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toBeFasterThan', () => {
        (0, vitest_1.it)('should pass when value is under threshold', () => {
            const result = (0, assertions_1.expect)(500).toBeFasterThan(1000);
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when value exceeds threshold', () => {
            const result = (0, assertions_1.expect)(1500).toBeFasterThan(1000);
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toBeTruthy / toBeFalsy', () => {
        (0, vitest_1.it)('should pass for truthy values', () => {
            (0, vitest_1.expect)((0, assertions_1.expect)('hello').toBeTruthy().passed).toBe(true);
            (0, vitest_1.expect)((0, assertions_1.expect)(1).toBeTruthy().passed).toBe(true);
        });
        (0, vitest_1.it)('should pass for falsy values', () => {
            (0, vitest_1.expect)((0, assertions_1.expect)('').toBeFalsy().passed).toBe(true);
            (0, vitest_1.expect)((0, assertions_1.expect)(0).toBeFalsy().passed).toBe(true);
        });
    });
    (0, vitest_1.describe)('toBeGreaterThan / toBeLessThan / toBeBetween', () => {
        (0, vitest_1.it)('should work for greater than', () => {
            (0, vitest_1.expect)((0, assertions_1.expect)(10).toBeGreaterThan(5).passed).toBe(true);
            (0, vitest_1.expect)((0, assertions_1.expect)(3).toBeGreaterThan(5).passed).toBe(false);
        });
        (0, vitest_1.it)('should work for less than', () => {
            (0, vitest_1.expect)((0, assertions_1.expect)(3).toBeLessThan(5).passed).toBe(true);
            (0, vitest_1.expect)((0, assertions_1.expect)(10).toBeLessThan(5).passed).toBe(false);
        });
        (0, vitest_1.it)('should work for between', () => {
            (0, vitest_1.expect)((0, assertions_1.expect)(5).toBeBetween(1, 10).passed).toBe(true);
            (0, vitest_1.expect)((0, assertions_1.expect)(15).toBeBetween(1, 10).passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toContainCode', () => {
        (0, vitest_1.it)('should detect code blocks', () => {
            const result = (0, assertions_1.expect)('Here is code:\n```js\nconsole.log("hi")\n```').toContainCode();
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail without code blocks', () => {
            const result = (0, assertions_1.expect)('No code here').toContainCode();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toBeProfessional', () => {
        (0, vitest_1.it)('should pass for professional text', () => {
            const result = (0, assertions_1.expect)('Thank you for your inquiry.').toBeProfessional();
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail for unprofessional text', () => {
            const result = (0, assertions_1.expect)('This is damn stupid').toBeProfessional();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('toHaveProperGrammar', () => {
        (0, vitest_1.it)('should pass for properly formatted text', () => {
            const result = (0, assertions_1.expect)('This is a sentence.').toHaveProperGrammar();
            (0, vitest_1.expect)(result.passed).toBe(true);
        });
        (0, vitest_1.it)('should fail for double spaces', () => {
            const result = (0, assertions_1.expect)('This  has double spaces.').toHaveProperGrammar();
            (0, vitest_1.expect)(result.passed).toBe(false);
        });
    });
});
(0, vitest_1.describe)('runAssertions', () => {
    (0, vitest_1.it)('should collect all results', () => {
        const results = (0, assertions_1.runAssertions)([
            () => (0, assertions_1.expect)('hello').toContain('hello'),
            () => (0, assertions_1.expect)('hello').toContain('missing'),
        ]);
        (0, vitest_1.expect)(results).toHaveLength(2);
        (0, vitest_1.expect)(results[0].passed).toBe(true);
        (0, vitest_1.expect)(results[1].passed).toBe(false);
    });
    (0, vitest_1.it)('should catch thrown errors', () => {
        const results = (0, assertions_1.runAssertions)([
            () => { throw new Error('boom'); },
        ]);
        (0, vitest_1.expect)(results[0].passed).toBe(false);
        (0, vitest_1.expect)(results[0].message).toBe('boom');
    });
});
(0, vitest_1.describe)('Standalone assertion functions', () => {
    (0, vitest_1.it)('containsKeywords', () => {
        (0, vitest_1.expect)((0, assertions_1.containsKeywords)('The quick brown fox', ['quick', 'brown'])).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.containsKeywords)('The quick fox', ['quick', 'brown'])).toBe(false);
    });
    (0, vitest_1.it)('matchesPattern', () => {
        (0, vitest_1.expect)((0, assertions_1.matchesPattern)('abc123', /\d+/)).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.matchesPattern)('abc', /\d+/)).toBe(false);
    });
    (0, vitest_1.it)('hasLength', () => {
        (0, vitest_1.expect)((0, assertions_1.hasLength)('hello', { min: 3, max: 10 })).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.hasLength)('hi', { min: 5 })).toBe(false);
    });
    (0, vitest_1.it)('containsJSON', () => {
        (0, vitest_1.expect)((0, assertions_1.containsJSON)('{"a":1}')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.containsJSON)('not json')).toBe(false);
    });
    (0, vitest_1.it)('notContainsPII', () => {
        (0, vitest_1.expect)((0, assertions_1.notContainsPII)('Just a normal text')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.notContainsPII)('Email: user@example.com')).toBe(false);
    });
    (0, vitest_1.it)('hasSentiment', () => {
        (0, vitest_1.expect)((0, assertions_1.hasSentiment)('This is great', 'positive')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.hasSentiment)('This is terrible', 'negative')).toBe(true);
    });
    (0, vitest_1.it)('similarTo', () => {
        (0, vitest_1.expect)((0, assertions_1.similarTo)('the quick brown fox', 'the quick brown dog', 0.5)).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.similarTo)('hello world', 'completely different', 0.8)).toBe(false);
    });
    (0, vitest_1.it)('withinRange', () => {
        (0, vitest_1.expect)((0, assertions_1.withinRange)(5, 1, 10)).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.withinRange)(15, 1, 10)).toBe(false);
    });
    (0, vitest_1.it)('isValidEmail', () => {
        (0, vitest_1.expect)((0, assertions_1.isValidEmail)('user@example.com')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.isValidEmail)('not-an-email')).toBe(false);
    });
    (0, vitest_1.it)('isValidURL', () => {
        (0, vitest_1.expect)((0, assertions_1.isValidURL)('https://example.com')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.isValidURL)('not a url')).toBe(false);
    });
    (0, vitest_1.it)('hasNoHallucinations', () => {
        (0, vitest_1.expect)((0, assertions_1.hasNoHallucinations)('Paris is in France', ['Paris', 'France'])).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.hasNoHallucinations)('Berlin is great', ['Paris'])).toBe(false);
    });
    (0, vitest_1.it)('matchesSchema', () => {
        (0, vitest_1.expect)((0, assertions_1.matchesSchema)({ name: 'test', value: 1 }, { name: '', value: '' })).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.matchesSchema)({ name: 'test' }, { name: '', missing: '' })).toBe(false);
        (0, vitest_1.expect)((0, assertions_1.matchesSchema)('not an object', { key: '' })).toBe(false);
    });
    (0, vitest_1.it)('hasNoToxicity', () => {
        (0, vitest_1.expect)((0, assertions_1.hasNoToxicity)('Have a nice day')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.hasNoToxicity)('You are an idiot')).toBe(false);
    });
    (0, vitest_1.it)('followsInstructions', () => {
        (0, vitest_1.expect)((0, assertions_1.followsInstructions)('Hello world', ['Hello'])).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.followsInstructions)('Hello world', ['!goodbye'])).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.followsInstructions)('Hello world', ['missing'])).toBe(false);
    });
    (0, vitest_1.it)('containsAllRequiredFields', () => {
        (0, vitest_1.expect)((0, assertions_1.containsAllRequiredFields)({ a: 1, b: 2 }, ['a', 'b'])).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.containsAllRequiredFields)({ a: 1 }, ['a', 'b'])).toBe(false);
    });
    (0, vitest_1.it)('hasValidCodeSyntax', () => {
        (0, vitest_1.expect)((0, assertions_1.hasValidCodeSyntax)('{"valid": true}', 'json')).toBe(true);
        (0, vitest_1.expect)((0, assertions_1.hasValidCodeSyntax)('{invalid}', 'json')).toBe(false);
    });
});
