/**
 * Vitest/Jest matcher: expect(result).toPassGate()
 * Use with openAIChatEval: expect(await openAIChatEval(...)).toPassGate()
 *
 * @example
 * ```ts
 * import { openAIChatEval } from '@pauly4010/evalai-sdk';
 * import { expect } from 'vitest';
 * import { extendExpectWithToPassGate } from '@pauly4010/evalai-sdk/matchers';
 *
 * extendExpectWithToPassGate(expect);
 *
 * it('passes gate', async () => {
 *   const result = await openAIChatEval({ name: 'test', cases: [...] });
 *   expect(result).toPassGate();
 * });
 * ```
 */
import type { OpenAIChatEvalResult } from "../integrations/openai-eval";
export declare function toPassGate(this: {
    isNot?: boolean;
}, received: OpenAIChatEvalResult): {
    pass: boolean;
    message: () => string;
};
/** Register toPassGate matcher with expect. Call in test setup. */
export declare function extendExpectWithToPassGate(expect: {
    extend: (matchers: object) => void;
}): void;
