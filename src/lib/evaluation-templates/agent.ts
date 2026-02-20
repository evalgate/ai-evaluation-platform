import {
  Award,
  BarChart,
  Bot,
  Brain,
  Clock,
  RefreshCw,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type { EvaluationTemplate } from "./types";

export const AGENT_TEMPLATES: EvaluationTemplate[] = [
  // ===== AI AGENT EVALUATION TEMPLATES =====
  {
    id: "agent-multistep-completion",
    name: "Multi-Step Task Completion",
    category: "agent_eval",
    icon: Bot,
    description: "Evaluate agent's ability to complete complex multi-step tasks",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Book a restaurant reservation for 4 people on Friday at 7pm",
        expectedOutput: "Successful booking with proper planning and execution",
        rubric: "Planning (25%), Execution (25%), Adaptation (25%), Efficiency (25%)",
      },
    ],
    judgePrompt: `Evaluate the AI agent's multi-step task completion:

Task: {task_description}
Agent Trace: {agent_trace}

Scoring Framework (0-100):
1. Planning Quality (0-25): Initial task breakdown and strategy
2. Execution Accuracy (0-25): Correctness of individual steps
3. Error Recovery (0-25): Response to failures and adaptation
4. Efficiency (0-25): Optimal tool usage and resource management

Agent Trace Schema:
{
  "planning_phase": {
    "initial_plan": ["step 1", "step 2"],
    "plan_quality_score": 4
  },
  "execution_steps": [
    {
      "step_id": 1,
      "action": "search_restaurants",
      "success": true,
      "tools_used": ["restaurant_api"]
    }
  ],
  "final_outcome": {
    "task_completed": true,
    "total_steps": 6,
    "efficiency_score": 4
  }
}

Output format:
{
  "total_score": 0-100,
  "planning_score": 0-25,
  "execution_score": 0-25,
  "adaptation_score": 0-25,
  "efficiency_score": 0-25,
  "task_completed": true|false,
  "reasoning": "detailed analysis",
  "improvement_areas": ["suggestions"]
}`,
  },
  {
    id: "agent-user-simulation",
    name: "Interactive User Simulation",
    category: "agent_eval",
    icon: UserCheck,
    description: "Test agent performance with simulated human users (τ-bench methodology)",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Simulated user with specific goals and preferences",
        expectedOutput: "Natural conversation with successful problem resolution",
        rubric:
          "Communication (20%), Information Gathering (20%), Policy Compliance (20%), Problem Resolution (20%), User Experience (20%)",
      },
    ],
    judgePrompt: `Evaluate agent's interaction with simulated user:

User Profile: {user_profile}
Conversation: {conversation_transcript}
User Goals: {goals}

Scoring Framework (0-100):
1. Communication Quality (0-20): Natural, helpful conversation
2. Information Gathering (0-20): Asks relevant follow-up questions
3. Policy Compliance (0-20): Follows guidelines and constraints
4. Problem Resolution (0-20): Successfully addresses user needs
5. User Experience (0-20): Smooth, efficient interaction

Output format:
{
  "total_score": 0-100,
  "communication": 0-20,
  "information_gathering": 0-20,
  "policy_compliance": 0-20,
  "problem_resolution": 0-20,
  "user_experience": 0-20,
  "goals_achieved": true|false,
  "reasoning": "detailed analysis",
  "conversation_quality": "excellent|good|fair|poor"
}`,
  },

  // ===== ADVANCED METRICS TEMPLATES =====
  {
    id: "metrics-geval",
    name: "G-Eval Framework",
    category: "advanced_metrics",
    icon: Award,
    description: "GPT-based evaluation with natural language criteria",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Complex response requiring nuanced evaluation",
        expectedOutput: "Detailed assessment across multiple dimensions",
        rubric: "Comprehensive evaluation with specific criteria and scoring",
      },
    ],
    judgePrompt: `G-Eval Framework Assessment:

Task: {task}
Response: {response}
Evaluation Criteria: {criteria}

Assessment Dimensions:
1. Task Completion (0-25): How well was the task completed?
2. Content Quality (0-25): Accuracy, relevance, completeness
3. Language Quality (0-25): Grammar, clarity, coherence
4. Safety/Compliance (0-25): Adherence to guidelines

Output format:
{
  "overall_score": 0-100,
  "task_completion": 0-25,
  "content_quality": 0-25,
  "language_quality": 0-25,
  "safety_compliance": 0-25,
  "detailed_feedback": {
    "strengths": ["list strengths"],
    "weaknesses": ["list areas for improvement"],
    "suggestions": ["specific recommendations"]
  },
  "reasoning": "comprehensive evaluation rationale"
}`,
  },
  {
    id: "metrics-ragas",
    name: "RAGAS Metrics",
    category: "advanced_metrics",
    icon: BarChart,
    description: "Retrieval-Augmented Generation Assessment metrics",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "RAG system response with retrieved context",
        expectedOutput: "Comprehensive RAGAS evaluation",
        rubric: "Faithfulness, answer relevance, context relevance, context recall",
      },
    ],
    judgePrompt: `RAGAS Metrics Evaluation:

Question: {question}
Context: {context}
Answer: {answer}
Ground Truth: {ground_truth}

RAGAS Metrics:
1. Faithfulness (0-1): Answer is faithful to context
2. Answer Relevance (0-1): Answer addresses the question
3. Context Relevance (0-1): Context is relevant to question
4. Context Recall (0-1): Context contains all ground truth info

Output format:
{
  "faithfulness": 0.0-1.0,
  "answer_relevance": 0.0-1.0,
  "context_relevance": 0.0-1.0,
  "context_recall": 0.0-1.0,
  "overall_score": 0-100,
  "analysis": {
    "faithfulness_analysis": "detailed explanation",
    "relevance_analysis": "detailed explanation",
    "improvements": ["suggestions for better performance"]
  }
}`,
  },

  // ===== CHAIN-OF-THOUGHT EVALUATION TEMPLATES =====
  {
    id: "cot-reasoning-quality",
    name: "CoT Reasoning Quality",
    category: "cot_evaluation",
    icon: Brain,
    description: "Evaluate chain-of-thought reasoning process and quality",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Complex problem requiring step-by-step reasoning",
        expectedOutput: "Clear logical reasoning with intermediate steps",
        rubric: "Logical flow, step completeness, accuracy of reasoning",
      },
    ],
    judgePrompt: `Chain-of-Thought Reasoning Assessment:

Problem: {problem}
CoT Response: {response}
Expected Steps: {expected_steps}

Assessment Criteria:
1. Logical Flow (0-25): Reasoning follows logical progression
2. Step Completeness (0-25): All necessary reasoning steps included
3. Accuracy (0-25): Each step is factually correct
4. Clarity (0-25): Reasoning is clearly explained

Output format:
{
  "overall_score": 0-100,
  "logical_flow": 0-25,
  "step_completeness": 0-25,
  "accuracy": 0-25,
  "clarity": 0-25,
  "reasoning_steps": [
    {
      "step": 1,
      "description": "what was done",
      "correctness": true|false,
      "clarity": "clear|unclear"
    }
  ],
  "missing_steps": ["list missing reasoning"],
  "reasoning": "detailed analysis of CoT quality"
}`,
  },

  // ===== CONTEXT WINDOW TEMPLATES =====
  {
    id: "context-window-utilization",
    name: "Context Window Utilization",
    category: "context_window",
    icon: Clock,
    description: "Test ability to handle and utilize large context windows",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Long document with specific question about content",
        expectedOutput: "Accurate answer utilizing information from throughout the document",
        rubric: "Information retrieval accuracy, context utilization, attention distribution",
      },
    ],
    judgePrompt: `Context Window Utilization Assessment:

Document Length: {doc_length} tokens
Question: {question}
Response: {response}
Key Information Location: {info_location}

Assessment:
1. Information Retrieval (0-25): Finds relevant info in large context
2. Context Utilization (0-25): Uses appropriate context portions
3. Attention Distribution (0-25): Balances attention across relevant sections
4. Accuracy (0-25): Answer is correct based on context

Output format:
{
  "overall_score": 0-100,
  "information_retrieval": 0-25,
  "context_utilization": 0-25,
  "attention_distribution": 0-25,
  "accuracy": 0-25,
  "context_efficiency": "excellent|good|fair|poor",
  "missed_information": ["list important info missed"],
  "reasoning": "detailed analysis"
}`,
  },

  // ===== MODEL STEERING TEMPLATES =====
  {
    id: "model-steering-effectiveness",
    name: "Model Steering Effectiveness",
    category: "model_steering",
    icon: RefreshCw,
    description: "Test ability to steer model behavior with system prompts",
    type: "model_eval",
    complexity: "intermediate",
    testCases: [
      {
        input: "Query with specific persona/style requirements",
        expectedOutput: "Response follows steering instructions precisely",
        rubric: "Persona adherence, style consistency, instruction following",
      },
    ],
    judgePrompt: `Model Steering Assessment:

System Prompt: {system_prompt}
User Query: {query}
Model Response: {response}
Expected Behavior: {expected_behavior}

Assessment:
1. Instruction Following (0-25): Adheres to steering instructions
2. Persona Consistency (0-25): Maintains specified persona
3. Style Adherence (0-25): Follows requested style/format
4. Naturalness (0-25): Response feels natural, not forced

Output format:
{
  "overall_score": 0-100,
  "instruction_following": 0-25,
  "persona_consistency": 0-25,
  "style_adherence": 0-25,
  "naturalness": 0-25,
  "steering_effectiveness": "excellent|good|fair|poor",
  "violations": ["list steering violations"],
  "reasoning": "detailed analysis"
}`,
  },

  // ===== REGRESSION TESTING TEMPLATES =====
  {
    id: "regression-version-comparison",
    name: "Version Comparison Regression",
    category: "regression",
    icon: TrendingUp,
    description: "Compare model performance across versions",
    type: "model_eval",
    complexity: "intermediate",
    testCases: [
      {
        input: "Same query tested on multiple model versions",
        expectedOutput: "Consistent or improved performance across versions",
        rubric: "Performance consistency, improvement detection, regression identification",
      },
    ],
    judgePrompt: `Version Regression Assessment:

Query: {query}
Version A Response: {response_a}
Version B Response: {response_b}
Baseline Performance: {baseline}

Assessment:
1. Quality Consistency (0-25): Similar quality across versions
2. Performance Change (0-25): Improvement or degradation
3. Feature Retention (0-25): Important features maintained
4. Regression Detection (0-25): Identify performance regressions

Output format:
{
  "overall_score": 0-100,
  "quality_consistency": 0-25,
  "performance_change": 0-25,
  "feature_retention": 0-25,
  "regression_detected": true|false,
  "regression_areas": ["list regression areas"],
  "improvements": ["list improvements"],
  "recommendation": "deploy|rollback|investigate",
  "reasoning": "detailed version comparison"
}`,
  },

  // ===== CALIBRATION TEMPLATES =====
  {
    id: "calibration-confidence-alignment",
    name: "Confidence-Accuracy Alignment",
    category: "calibration",
    icon: Target,
    description: "Test alignment between confidence scores and actual accuracy",
    type: "model_eval",
    complexity: "advanced",
    testCases: [
      {
        input: "Responses with confidence scores",
        expectedOutput: "Confidence scores align with actual accuracy",
        rubric: "Calibration quality, confidence accuracy, reliability assessment",
      },
    ],
    judgePrompt: `Confidence Calibration Assessment:

Response: {response}
Confidence Score: {confidence}
Actual Accuracy: {accuracy}
Expected Calibration: {expected_calibration}

Assessment:
1. Confidence Accuracy (0-25): Confidence matches actual accuracy
2. Calibration Quality (0-25): Well-calibrated across confidence levels
3. Reliability (0-25): Confidence scores are trustworthy
4. Consistency (0-25): Consistent calibration across queries

Output format:
{
  "overall_score": 0-100,
  "confidence_accuracy": 0-25,
  "calibration_quality": 0-25,
  "reliability": 0-25,
  "consistency": 0-25,
  "calibration_error": 0.0-1.0,
  "calibration_quality": "well_calibrated|overconfident|underconfident|poorly_calibrated",
  "reasoning": "detailed calibration analysis"
}`,
  },
];
