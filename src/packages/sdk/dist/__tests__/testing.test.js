"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const testing_1 = require("../testing");
const assertions_1 = require("../assertions");
(0, vitest_1.describe)('TestSuite', () => {
    (0, vitest_1.describe)('basic execution', () => {
        (0, vitest_1.it)('should run test cases with an executor', async () => {
            const suite = (0, testing_1.createTestSuite)('basic-tests', {
                cases: [
                    {
                        input: 'Hello',
                        assertions: [
                            (output) => (0, assertions_1.expect)(output).toContain('Hello'),
                        ],
                    },
                ],
                executor: async (input) => `Echo: ${input}`,
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.name).toBe('basic-tests');
            (0, vitest_1.expect)(result.total).toBe(1);
            (0, vitest_1.expect)(result.passed).toBe(1);
            (0, vitest_1.expect)(result.failed).toBe(0);
            (0, vitest_1.expect)(result.results[0].passed).toBe(true);
        });
        (0, vitest_1.it)('should fail when assertion fails', async () => {
            const suite = (0, testing_1.createTestSuite)('fail-tests', {
                cases: [
                    {
                        input: 'Hello',
                        assertions: [
                            (output) => (0, assertions_1.expect)(output).toContain('missing keyword'),
                        ],
                    },
                ],
                executor: async (input) => `Echo: ${input}`,
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.passed).toBe(0);
            (0, vitest_1.expect)(result.failed).toBe(1);
            (0, vitest_1.expect)(result.results[0].passed).toBe(false);
        });
    });
    (0, vitest_1.describe)('default equality check', () => {
        (0, vitest_1.it)('should use toEqual when expected is provided without assertions', async () => {
            const suite = (0, testing_1.createTestSuite)('equality-tests', {
                cases: [
                    { input: 'hello', expected: 'hello' },
                ],
                // No executor — uses expected as actual
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.passed).toBe(1);
        });
        (0, vitest_1.it)('should fail when expected does not match', async () => {
            const suite = (0, testing_1.createTestSuite)('equality-fail', {
                cases: [
                    { input: 'hello', expected: 'world' },
                ],
                executor: async (input) => input, // Returns 'hello', not 'world'
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.failed).toBe(1);
        });
    });
    (0, vitest_1.describe)('parallel execution', () => {
        (0, vitest_1.it)('should run tests in parallel', async () => {
            const order = [];
            const suite = (0, testing_1.createTestSuite)('parallel-tests', {
                cases: [
                    { id: '1', input: 'a', expected: 'a' },
                    { id: '2', input: 'b', expected: 'b' },
                    { id: '3', input: 'c', expected: 'c' },
                ],
                executor: async (input) => {
                    order.push(parseInt(input, 36) - 9); // a=1, b=2, c=3
                    return input;
                },
                parallel: true,
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.total).toBe(3);
            (0, vitest_1.expect)(result.passed).toBe(3);
        });
    });
    (0, vitest_1.describe)('sequential execution', () => {
        (0, vitest_1.it)('should run tests sequentially', async () => {
            const order = [];
            const suite = (0, testing_1.createTestSuite)('sequential-tests', {
                cases: [
                    { id: 'first', input: 'a', expected: 'a' },
                    { id: 'second', input: 'b', expected: 'b' },
                ],
                executor: async (input) => {
                    order.push(input);
                    return input;
                },
                parallel: false,
            });
            const result = await suite.run();
            (0, vitest_1.expect)(order).toEqual(['a', 'b']);
            (0, vitest_1.expect)(result.passed).toBe(2);
        });
    });
    (0, vitest_1.describe)('stopOnFailure', () => {
        (0, vitest_1.it)('should stop after first failure when enabled', async () => {
            const suite = (0, testing_1.createTestSuite)('stop-on-fail', {
                cases: [
                    { id: 'pass', input: 'hello', expected: 'hello' },
                    { id: 'fail', input: 'hello', expected: 'nope' },
                    { id: 'skip', input: 'hello', expected: 'hello' },
                ],
                executor: async (input) => input,
                parallel: false,
                stopOnFailure: true,
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.total).toBe(2); // Only 2 ran
            (0, vitest_1.expect)(result.passed).toBe(1);
            (0, vitest_1.expect)(result.failed).toBe(1);
        });
    });
    (0, vitest_1.describe)('timeout', () => {
        (0, vitest_1.beforeEach)(() => {
            vitest_1.vi.useFakeTimers();
        });
        (0, vitest_1.afterEach)(() => {
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should timeout slow tests', async () => {
            const suite = (0, testing_1.createTestSuite)('timeout-tests', {
                cases: [
                    { id: 'slow', input: 'hello' },
                ],
                executor: async (_input) => {
                    return new Promise((resolve) => {
                        setTimeout(() => resolve('done'), 60000);
                    });
                },
                timeout: 100,
                parallel: false,
            });
            const runPromise = suite.run();
            // Advance timers past the timeout
            vitest_1.vi.advanceTimersByTime(200);
            const result = await runPromise;
            (0, vitest_1.expect)(result.results[0].passed).toBe(false);
            (0, vitest_1.expect)(result.results[0].error).toContain('timeout');
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should catch executor errors gracefully', async () => {
            const suite = (0, testing_1.createTestSuite)('error-tests', {
                cases: [
                    { input: 'hello' },
                ],
                executor: async () => {
                    throw new Error('executor broke');
                },
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.results[0].passed).toBe(false);
            (0, vitest_1.expect)(result.results[0].error).toBe('executor broke');
        });
        (0, vitest_1.it)('should fail when no executor and no expected', async () => {
            const suite = (0, testing_1.createTestSuite)('no-exec', {
                cases: [{ input: 'hello' }],
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.results[0].passed).toBe(false);
            (0, vitest_1.expect)(result.results[0].error).toContain('No executor');
        });
    });
    (0, vitest_1.describe)('addCase', () => {
        (0, vitest_1.it)('should allow adding cases after construction', async () => {
            const suite = (0, testing_1.createTestSuite)('dynamic', {
                cases: [],
                executor: async (input) => input,
            });
            suite.addCase({ input: 'test', expected: 'test' });
            const result = await suite.run();
            (0, vitest_1.expect)(result.total).toBe(1);
            (0, vitest_1.expect)(result.passed).toBe(1);
        });
    });
    (0, vitest_1.describe)('custom assertion IDs', () => {
        (0, vitest_1.it)('should use provided IDs', async () => {
            const suite = (0, testing_1.createTestSuite)('ids', {
                cases: [
                    { id: 'custom-id', input: 'test', expected: 'test' },
                ],
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.results[0].id).toBe('custom-id');
        });
        (0, vitest_1.it)('should generate IDs when not provided', async () => {
            const suite = (0, testing_1.createTestSuite)('auto-ids', {
                cases: [
                    { input: 'test', expected: 'test' },
                ],
            });
            const result = await suite.run();
            (0, vitest_1.expect)(result.results[0].id).toBe('case-0');
        });
    });
});
(0, vitest_1.describe)('Testing helper functions', () => {
    (0, vitest_1.it)('containsKeywords returns an assertion function', () => {
        const assertFn = (0, testing_1.containsKeywords)(['hello', 'world']);
        const result = assertFn('hello world');
        (0, vitest_1.expect)(result.passed).toBe(true);
        (0, vitest_1.expect)(result.name).toBe('toContainKeywords');
    });
    (0, vitest_1.it)('matchesPattern returns an assertion function', () => {
        const assertFn = (0, testing_1.matchesPattern)(/\d{3}/);
        const result = assertFn('code: 123');
        (0, vitest_1.expect)(result.passed).toBe(true);
    });
    (0, vitest_1.it)('hasSentiment returns an assertion function', () => {
        const assertFn = (0, testing_1.hasSentiment)('positive');
        const result = assertFn('This is great!');
        (0, vitest_1.expect)(result.passed).toBe(true);
    });
    (0, vitest_1.it)('hasLength returns an assertion function', () => {
        const assertFn = (0, testing_1.hasLength)({ min: 5, max: 50 });
        const result = assertFn('hello world');
        (0, vitest_1.expect)(result.passed).toBe(true);
    });
});
