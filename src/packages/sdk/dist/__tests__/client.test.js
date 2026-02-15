"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("../client");
// Mock fetch globally
const mockFetch = vitest_1.vi.fn();
(0, vitest_1.describe)('AIEvalClient', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockReset();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should throw if no API key is provided', () => {
            (0, vitest_1.expect)(() => new client_1.AIEvalClient({ apiKey: '' })).toThrow('API key is required');
        });
        (0, vitest_1.it)('should initialize with explicit config', () => {
            const client = new client_1.AIEvalClient({
                apiKey: 'test-key',
                baseUrl: 'https://api.test.com',
                organizationId: 42,
            });
            (0, vitest_1.expect)(client).toBeDefined();
            (0, vitest_1.expect)(client.getOrganizationId()).toBe(42);
        });
        (0, vitest_1.it)('should have all API modules', () => {
            const client = new client_1.AIEvalClient({ apiKey: 'test-key' });
            (0, vitest_1.expect)(client.traces).toBeDefined();
            (0, vitest_1.expect)(client.evaluations).toBeDefined();
            (0, vitest_1.expect)(client.llmJudge).toBeDefined();
            (0, vitest_1.expect)(client.annotations).toBeDefined();
            (0, vitest_1.expect)(client.developer).toBeDefined();
            (0, vitest_1.expect)(client.organizations).toBeDefined();
        });
    });
    (0, vitest_1.describe)('request method', () => {
        (0, vitest_1.it)('should send auth header', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: 'test' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'my-secret-key', baseUrl: 'http://localhost:3000' });
            await client.request('/api/test');
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toBe('http://localhost:3000/api/test');
            (0, vitest_1.expect)(options.headers['Authorization']).toBe('Bearer my-secret-key');
            (0, vitest_1.expect)(options.headers['Content-Type']).toBe('application/json');
        });
        (0, vitest_1.it)('should return parsed JSON on success', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ result: 'ok' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
            const data = await client.request('/api/test');
            (0, vitest_1.expect)(data).toEqual({ result: 'ok' });
        });
        (0, vitest_1.it)('should throw on non-ok response', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Not found', code: 'NOT_FOUND' }),
                status: 404,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000', retry: { maxAttempts: 1 } });
            await (0, vitest_1.expect)(client.request('/api/test')).rejects.toThrow();
        });
        (0, vitest_1.it)('should retry on rate limit errors', async () => {
            mockFetch
                .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Rate limited', code: 'RATE_LIMIT_EXCEEDED' }),
                status: 429,
            })
                .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'success' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({
                apiKey: 'key',
                baseUrl: 'http://localhost:3000',
                retry: { maxAttempts: 3, backoff: 'fixed' },
            });
            const data = await client.request('/api/test');
            (0, vitest_1.expect)(data).toEqual({ result: 'success' });
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should handle timeout', async () => {
            mockFetch.mockImplementation(() => new Promise((_, reject) => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                setTimeout(() => reject(abortError), 50);
            }));
            const client = new client_1.AIEvalClient({
                apiKey: 'key',
                baseUrl: 'http://localhost:3000',
                timeout: 10,
                retry: { maxAttempts: 1 },
            });
            await (0, vitest_1.expect)(client.request('/api/slow')).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('TraceAPI', () => {
        (0, vitest_1.it)('should call correct endpoint for traces.create', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, name: 'Test Trace', traceId: 'trace-1' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000', organizationId: 1 });
            const result = await client.traces.create({ name: 'Test Trace', traceId: 'trace-1' });
            (0, vitest_1.expect)(result.name).toBe('Test Trace');
            const [url, options] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toBe('http://localhost:3000/api/traces');
            (0, vitest_1.expect)(options.method).toBe('POST');
        });
        (0, vitest_1.it)('should call correct endpoint for traces.list', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
            await client.traces.list({ limit: 10 });
            const [url] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toContain('/api/traces');
            (0, vitest_1.expect)(url).toContain('limit=10');
        });
    });
    (0, vitest_1.describe)('EvaluationAPI', () => {
        (0, vitest_1.it)('should call correct endpoint for evaluations.create', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, name: 'Eval' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000', organizationId: 1 });
            await client.evaluations.create({
                name: 'Eval',
                type: 'unit_test',
                organizationId: 1,
                createdBy: 1,
            });
            const [url, options] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toBe('http://localhost:3000/api/evaluations');
            (0, vitest_1.expect)(options.method).toBe('POST');
        });
        (0, vitest_1.it)('should call correct endpoint for evaluations.createRun', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, status: 'running' }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
            await client.evaluations.createRun(42, { status: 'running' });
            const [url, options] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toBe('http://localhost:3000/api/evaluations/42/runs');
            (0, vitest_1.expect)(options.method).toBe('POST');
        });
    });
    (0, vitest_1.describe)('LLMJudgeAPI', () => {
        (0, vitest_1.it)('should call correct endpoint for llmJudge.evaluate', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ result: { score: 85 }, config: {} }),
                status: 200,
            });
            const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
            const result = await client.llmJudge.evaluate({
                configId: 1,
                input: 'test input',
                output: 'test output',
            });
            (0, vitest_1.expect)(result.result.score).toBe(85);
            const [url, options] = mockFetch.mock.calls[0];
            (0, vitest_1.expect)(url).toBe('http://localhost:3000/api/llm-judge/evaluate');
            (0, vitest_1.expect)(options.method).toBe('POST');
        });
    });
});
