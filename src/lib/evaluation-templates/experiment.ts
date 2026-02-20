import { Sparkles, Zap } from "lucide-react";
import type { EvaluationTemplate } from "./types";

export const EXPERIMENT_TEMPLATES: EvaluationTemplate[] = [
  // ===== A/B TESTING TEMPLATES =====
  {
    id: "ab-prompt-variation",
    name: "Prompt Variation Test",
    category: "ab_testing",
    icon: Zap,
    description: "Compare performance of different prompt variations",
    type: "ab_test",
    complexity: "intermediate",
    testCases: [
      {
        input: "Same query tested with different prompt variations",
        expectedOutput: "Comparative performance metrics",
        rubric: "Response quality, consistency, performance differences",
      },
    ],
    judgePrompt: `A/B Test Evaluation for Prompt Variations:

Query: {query}
Prompt A Response: {response_a}
Prompt B Response: {response_b}
Prompt A: {prompt_a}
Prompt B: {prompt_b}

Assessment Criteria:
1. Response Quality (0-25): Which response is better?
2. Consistency (0-25): How consistent are responses across variations?
3. Prompt Effectiveness (0-25): Which prompt produces better results?
4. Performance Metrics (0-25): Quantitative performance differences

Output format:
{
  "overall_score": 0-100,
  "winner": "A|B|TIE",
  "response_quality": {
    "variant_a": 0-25,
    "variant_b": 0-25
  },
  "consistency_score": 0-25,
  "prompt_effectiveness": {
    "variant_a": 0-25,
    "variant_b": 0-25
  },
  "performance_metrics": {
    "variant_a": {
      "accuracy": 0-100,
      "latency_ms": number,
      "token_usage": number
    },
    "variant_b": {
      "accuracy": 0-100,
      "latency_ms": number,
      "token_usage": number
    }
  },
  "recommendation": "deploy_prompt_a|deploy_prompt_b|continue_testing",
  "reasoning": "detailed A/B test analysis"
}`,
  },

  // ===== PROMPT OPTIMIZATION TEMPLATES =====
  {
    id: "prompt-optimization-eval",
    name: "Automated Prompt Optimization",
    category: "prompt_optimization",
    icon: Sparkles,
    description: "Evaluate effectiveness of optimized prompts",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Optimized prompt vs baseline prompt performance",
        expectedOutput: "Improvement assessment and optimization recommendations",
        rubric: "Performance improvement, optimization quality, generalization",
      },
    ],
    judgePrompt: `Prompt Optimization Evaluation:

Baseline Prompt: {baseline_prompt}
Optimized Prompt: {optimized_prompt}
Test Query: {query}
Baseline Response: {baseline_response}
Optimized Response: {optimized_response}

Assessment Criteria:
1. Performance Improvement (0-25): How much did the optimized prompt improve results?
2. Response Quality (0-25): Is the optimized response better?
3. Prompt Simplicity (0-25): Is the optimized prompt still simple and clear?
4. Generalization (0-25): Does the optimization work across different queries?

Output format:
{
  "overall_score": 0-100,
  "improvement_label": "SIGNIFICANT|MODERATE|MINIMAL|NO_IMPROVEMENT",
  "performance_improvement": 0-25,
  "response_quality": {
    "baseline": 0-25,
    "optimized": 0-25
  },
  "prompt_simplicity": 0-25,
  "generalization": 0-25,
  "improvement_metrics": {
    "accuracy_improvement": percentage,
    "latency_change": percentage,
    "token_efficiency": percentage
  },
  "optimization_suggestions": ["list further optimization ideas"],
  "reasoning": "detailed optimization analysis"
}`,
  },
  {
    id: "few-shot-learning-eval",
    name: "Few-Shot Learning Evaluation",
    category: "prompt_optimization",
    icon: Sparkles,
    description: "Evaluate effectiveness of few-shot examples in prompts",
    type: "model_eval",
    complexity: "intermediate",
    testCases: [
      {
        input: "Prompt with few-shot examples vs zero-shot prompt",
        expectedOutput: "Few-shot effectiveness assessment",
        rubric: "Example quality, learning effectiveness, generalization",
      },
    ],
    judgePrompt: `Few-Shot Learning Evaluation:

Zero-Shot Prompt: {zero_shot_prompt}
Few-Shot Prompt: {few_shot_prompt}
Examples Used: {examples}
Test Query: {query}
Zero-Shot Response: {zero_shot_response}
Few-Shot Response: {few_shot_response}

Assessment Criteria:
1. Example Quality (0-25): Are the few-shot examples high quality?
2. Learning Effectiveness (0-25): Did the model learn from examples?
3. Response Quality (0-25): Is the few-shot response better?
4. Generalization (0-25): Do examples help with different queries?

Output format:
{
  "overall_score": 0-100,
  "few_shot_effectiveness": "HIGHLY_EFFECTIVE|EFFECTIVE|MODERATELY|INEFFECTIVE",
  "example_quality": 0-25,
  "learning_effectiveness": 0-25,
  "response_quality": {
    "zero_shot": 0-25,
    "few_shot": 0-25
  },
  "generalization": 0-25,
  "example_analysis": {
    "relevant_examples": ["list relevant examples"],
    "irrelevant_examples": ["list irrelevant examples"],
    "missing_examples": ["list missing example types"]
  },
  "recommendation": "use_few_shot|stick_to_zero_shot|improve_examples",
  "reasoning": "detailed few-shot analysis"
}`,
  },
];
