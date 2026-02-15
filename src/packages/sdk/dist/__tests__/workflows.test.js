"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const workflows_1 = require("../workflows");
const client_1 = require("../client");
// Mock fetch
const mockFetch = vitest_1.vi.fn();
function createMockClient() {
    vitest_1.vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, traceId: 'trace-1', name: 'test' }),
        status: 200,
    });
    return new client_1.AIEvalClient({ apiKey: 'test-key', baseUrl: 'http://localhost:3000', organizationId: 1 });
}
(0, vitest_1.describe)('WorkflowTracer', () => {
    let client;
    let tracer;
    (0, vitest_1.beforeEach)(() => {
        client = createMockClient();
        tracer = new workflows_1.WorkflowTracer(client, { organizationId: 1 });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
        mockFetch.mockReset();
    });
    (0, vitest_1.describe)('workflow lifecycle', () => {
        (0, vitest_1.it)('should start and end a workflow', async () => {
            const workflow = await tracer.startWorkflow('Test Pipeline');
            (0, vitest_1.expect)(workflow.name).toBe('Test Pipeline');
            (0, vitest_1.expect)(tracer.isWorkflowActive()).toBe(true);
            await tracer.endWorkflow({ status: 'success' });
            (0, vitest_1.expect)(tracer.isWorkflowActive()).toBe(false);
        });
        (0, vitest_1.it)('should throw if starting a second workflow', async () => {
            await tracer.startWorkflow('First');
            await (0, vitest_1.expect)(tracer.startWorkflow('Second')).rejects.toThrow('already active');
        });
        (0, vitest_1.it)('should throw if ending without starting', async () => {
            await (0, vitest_1.expect)(tracer.endWorkflow()).rejects.toThrow('No active workflow');
        });
    });
    (0, vitest_1.describe)('agent spans', () => {
        (0, vitest_1.it)('should start and end agent spans', async () => {
            await tracer.startWorkflow('Pipeline');
            const span = await tracer.startAgentSpan('RouterAgent', { input: 'hello' });
            (0, vitest_1.expect)(span.agentName).toBe('RouterAgent');
            (0, vitest_1.expect)(span.spanId).toBeTruthy();
            await tracer.endAgentSpan(span, { result: 'routed' });
            await tracer.endWorkflow();
        });
        (0, vitest_1.it)('should throw if no workflow is active', async () => {
            await (0, vitest_1.expect)(tracer.startAgentSpan('Agent')).rejects.toThrow('No active workflow');
        });
    });
    (0, vitest_1.describe)('decision recording', () => {
        (0, vitest_1.it)('should record decisions', async () => {
            await tracer.startWorkflow('Pipeline');
            await tracer.recordDecision({
                agent: 'Router',
                type: 'route',
                chosen: 'technical_support',
                alternatives: [{ action: 'billing', confidence: 30 }],
                reasoning: 'Detected technical keywords',
                confidence: 85,
            });
            const decisions = tracer.getDecisions();
            (0, vitest_1.expect)(decisions).toHaveLength(1);
            (0, vitest_1.expect)(decisions[0].agent).toBe('Router');
            (0, vitest_1.expect)(decisions[0].chosen).toBe('technical_support');
            (0, vitest_1.expect)(decisions[0].confidence).toBe(85);
            await tracer.endWorkflow();
        });
        (0, vitest_1.it)('should throw if no workflow is active', async () => {
            await (0, vitest_1.expect)(tracer.recordDecision({
                agent: 'Agent',
                type: 'action',
                chosen: 'x',
                alternatives: [],
            })).rejects.toThrow('No active workflow');
        });
    });
    (0, vitest_1.describe)('handoff recording', () => {
        (0, vitest_1.it)('should record handoffs between agents', async () => {
            await tracer.startWorkflow('Pipeline');
            await tracer.recordHandoff('Router', 'TechAgent', { issue: 'API' }, 'delegation');
            const handoffs = tracer.getHandoffs();
            (0, vitest_1.expect)(handoffs).toHaveLength(1);
            (0, vitest_1.expect)(handoffs[0].fromAgent).toBe('Router');
            (0, vitest_1.expect)(handoffs[0].toAgent).toBe('TechAgent');
            (0, vitest_1.expect)(handoffs[0].handoffType).toBe('delegation');
            await tracer.endWorkflow();
        });
    });
    (0, vitest_1.describe)('cost tracking', () => {
        (0, vitest_1.it)('should record and calculate costs', async () => {
            await tracer.startWorkflow('Pipeline');
            const cost = await tracer.recordCost({
                provider: 'openai',
                model: 'gpt-4o',
                inputTokens: 1000,
                outputTokens: 500,
            });
            // gpt-4o pricing: $5/1M input, $15/1M output
            (0, vitest_1.expect)(cost.totalTokens).toBe(1500);
            (0, vitest_1.expect)(parseFloat(cost.inputCost)).toBeCloseTo(0.005, 4);
            (0, vitest_1.expect)(parseFloat(cost.outputCost)).toBeCloseTo(0.0075, 4);
            (0, vitest_1.expect)(parseFloat(cost.totalCost)).toBeCloseTo(0.0125, 4);
            (0, vitest_1.expect)(tracer.getTotalCost()).toBeCloseTo(0.0125, 4);
            await tracer.endWorkflow();
        });
        (0, vitest_1.it)('should track cost breakdown by category', async () => {
            await tracer.startWorkflow('Pipeline');
            await tracer.recordCost({
                provider: 'openai',
                model: 'gpt-4o',
                inputTokens: 1000,
                outputTokens: 500,
                category: 'llm',
            });
            await tracer.recordCost({
                provider: 'openai',
                model: 'gpt-4o',
                inputTokens: 200,
                outputTokens: 100,
                category: 'tool',
            });
            const breakdown = tracer.getCostBreakdown();
            (0, vitest_1.expect)(breakdown.llm).toBeGreaterThan(0);
            (0, vitest_1.expect)(breakdown.tool).toBeGreaterThan(0);
            (0, vitest_1.expect)(breakdown.embedding).toBe(0);
            await tracer.endWorkflow();
        });
        (0, vitest_1.it)('should use default pricing for unknown models', async () => {
            await tracer.startWorkflow('Pipeline');
            const cost = await tracer.recordCost({
                provider: 'custom',
                model: 'unknown-model',
                inputTokens: 1000000,
                outputTokens: 1000000,
            });
            // Default: $1/1M input, $3/1M output = $4 total
            (0, vitest_1.expect)(parseFloat(cost.totalCost)).toBeCloseTo(4.0, 1);
            await tracer.endWorkflow();
        });
    });
    (0, vitest_1.describe)('state resets', () => {
        (0, vitest_1.it)('should reset state when starting a new workflow', async () => {
            await tracer.startWorkflow('First');
            await tracer.recordCost({
                provider: 'openai',
                model: 'gpt-4o',
                inputTokens: 1000,
                outputTokens: 500,
            });
            await tracer.recordHandoff(undefined, 'Agent1');
            await tracer.recordDecision({
                agent: 'A',
                type: 'action',
                chosen: 'x',
                alternatives: [],
            });
            await tracer.endWorkflow();
            // Start fresh workflow
            await tracer.startWorkflow('Second');
            (0, vitest_1.expect)(tracer.getCosts()).toHaveLength(0);
            (0, vitest_1.expect)(tracer.getHandoffs()).toHaveLength(0);
            (0, vitest_1.expect)(tracer.getDecisions()).toHaveLength(0);
            (0, vitest_1.expect)(tracer.getTotalCost()).toBe(0);
            await tracer.endWorkflow();
        });
    });
});
(0, vitest_1.describe)('createWorkflowTracer', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1, traceId: 't', name: 'n' }),
            status: 200,
        }));
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('should create a WorkflowTracer instance', () => {
        const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
        const tracer = (0, workflows_1.createWorkflowTracer)(client, { organizationId: 1 });
        (0, vitest_1.expect)(tracer).toBeInstanceOf(workflows_1.WorkflowTracer);
    });
});
(0, vitest_1.describe)('traceWorkflowStep', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1, traceId: 't', name: 'n' }),
            status: 200,
        }));
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('should trace a function execution', async () => {
        const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000', organizationId: 1 });
        const tracer = new workflows_1.WorkflowTracer(client, { organizationId: 1 });
        await tracer.startWorkflow('Test');
        const result = await (0, workflows_1.traceWorkflowStep)(tracer, 'Agent', async () => {
            return 'output';
        });
        (0, vitest_1.expect)(result).toBe('output');
        await tracer.endWorkflow();
    });
    (0, vitest_1.it)('should re-throw errors from the traced function', async () => {
        const client = new client_1.AIEvalClient({ apiKey: 'key', baseUrl: 'http://localhost:3000', organizationId: 1 });
        const tracer = new workflows_1.WorkflowTracer(client, { organizationId: 1 });
        await tracer.startWorkflow('Test');
        await (0, vitest_1.expect)((0, workflows_1.traceWorkflowStep)(tracer, 'Agent', async () => {
            throw new Error('agent error');
        })).rejects.toThrow('agent error');
        await tracer.endWorkflow({ status: 'failed' }, 'failed');
    });
});
