import {
	Crosshair,
	DollarSign,
	FileCode,
	Layers,
	MessageSquare,
	Search,
	Stethoscope,
} from "lucide-react";
import type { EvaluationTemplate } from "./types";

export const RAG_TEMPLATES: EvaluationTemplate[] = [
	// ===== MULTIMODAL EVALUATION TEMPLATES =====
	{
		id: "multimodal-cross-modal-reasoning",
		name: "Cross-Modal Reasoning",
		category: "multimodal",
		icon: Layers,
		description: "Evaluate reasoning across text, image, audio, and video",
		type: "model_eval",
		complexity: "advanced",
		testCases: [
			{
				input: "Image of a graph + Question: 'What trend does this show?'",
				expectedOutput:
					"Accurate interpretation integrating visual and textual reasoning",
				rubric: "Must correctly interpret visual data and connect to query",
			},
			{
				input: "Video clip + Question: 'What happened between 0:30 and 1:00?'",
				expectedOutput: "Temporal reasoning with accurate event description",
				rubric:
					"Must demonstrate temporal understanding and visual comprehension",
			},
		],
		judgePrompt: `Evaluate this multimodal AI response:

Image Description: {image_description}
Text Query: {query}
AI Response: {response}

Assess on:
1. Visual Understanding (0-5): How well did it interpret the image?
2. Text-Image Integration (0-5): Connection between modalities?
3. Reasoning Quality (0-5): Logic and cross-modal inference?
4. Response Completeness (0-5): Addressed all query aspects?

Output format:
{
  "overall_score": 0-100,
  "visual_understanding": 0-5,
  "integration": 0-5,
  "reasoning": 0-5,
  "completeness": 0-5,
  "reasoning": "detailed analysis",
  "strengths": ["what worked well"],
  "weaknesses": ["areas for improvement"]
}`,
	},
	{
		id: "multimodal-visual-grounding",
		name: "Visual Grounding Assessment",
		category: "multimodal",
		icon: Crosshair,
		description: "Test ability to ground language in visual elements",
		type: "model_eval",
		complexity: "advanced",
		testCases: [
			{
				input: "Image with multiple objects + 'Count the red objects'",
				expectedOutput: "Accurate count with spatial awareness",
				rubric: "Must correctly identify, localize, and count objects",
			},
			{
				input:
					"Scene image + 'Describe the spatial relationship between X and Y'",
				expectedOutput: "Accurate spatial relationship description",
				rubric: "Must understand and articulate spatial relationships",
			},
		],
		judgePrompt: `Evaluate visual grounding capabilities:

Image: {image_description}
Query: {query}
AI Response: {response}

Assess:
1. Object Localization (0-5): Correctly identifies object positions?
2. Counting Accuracy (0-5): Accurate object counting?
3. Spatial Understanding (0-5): Understands relationships?
4. Fine-grained Details (0-5): Notices subtle visual features?

Output format:
{
  "overall_score": 0-100,
  "localization": 0-5,
  "counting": 0-5,
  "spatial_understanding": 0-5,
  "detail_recognition": 0-5,
  "errors": ["list mistakes"],
  "reasoning": "detailed analysis"
}`,
	},

	// ===== INDUSTRY-SPECIFIC TEMPLATES =====
	{
		id: "industry-customer-support",
		name: "Customer Support Chatbot",
		category: "industry",
		icon: MessageSquare,
		description: "Comprehensive evaluation for support chatbots",
		type: "model_eval",
		complexity: "intermediate",
		testCases: [
			{
				input: "Customer complaint about delayed order",
				expectedOutput: "Empathetic response with clear resolution path",
				rubric: "Must show empathy, provide solution, and maintain brand voice",
			},
			{
				input: "Technical support request for product issue",
				expectedOutput: "Accurate technical guidance with escalation options",
				rubric:
					"Technical accuracy, clear instructions, appropriate escalation",
			},
		],
		judgePrompt: `Evaluate customer support chatbot performance:

Customer Issue: {issue}
Bot Response: {response}
Brand Guidelines: {brand_guidelines}

Assess:
1. Empathy (0-5): Shows understanding and compassion
2. Resolution (0-5): Provides clear solution or next steps
3. Brand Voice (0-5): Maintains consistent brand personality
4. Accuracy (0-5): Information is correct and helpful
5. Escalation (0-5): Knows when to escalate to human

Output format:
{
  "overall_score": 0-100,
  "empathy": 0-5,
  "resolution": 0-5,
  "brand_voice": 0-5,
  "accuracy": 0-5,
  "escalation": 0-5,
  "customer_satisfaction": "high|medium|low",
  "reasoning": "detailed analysis"
}`,
	},
	{
		id: "industry-financial",
		name: "Financial Assistant",
		category: "industry",
		icon: DollarSign,
		description: "Evaluation for financial advice and services",
		type: "model_eval",
		complexity: "advanced",
		testCases: [
			{
				input: "Investment advice request for retirement planning",
				expectedOutput:
					"Responsible financial guidance with appropriate disclaimers",
				rubric:
					"Must include risk warnings, diversification advice, and regulatory compliance",
			},
			{
				input: "Question about loan eligibility and requirements",
				expectedOutput: "Accurate loan information with qualification criteria",
				rubric:
					"Financial accuracy, regulatory compliance, clear eligibility criteria",
			},
		],
		judgePrompt: `Evaluate financial AI assistant:

Financial Query: {query}
AI Response: {response}
Regulatory Requirements: {regulations}

Assess:
1. Accuracy (0-5): Financial information is correct
2. Compliance (0-5): Meets regulatory requirements
3. Risk Disclosure (0-5): Appropriate risk warnings
4. Clarity (0-5): Easy to understand for consumers
5. Responsibility (0-5): Avoids guaranteed returns, unrealistic promises

Output format:
{
  "overall_score": 0-100,
  "accuracy": 0-5,
  "compliance": 0-5,
  "risk_disclosure": 0-5,
  "clarity": 0-5,
  "responsibility": 0-5,
  "compliance_status": "compliant|needs_review|non_compliant",
  "reasoning": "detailed analysis"
}`,
	},
	{
		id: "industry-code-generation",
		name: "Code Generation Assistant",
		category: "industry",
		icon: FileCode,
		description: "Evaluate generated code quality and security",
		type: "unit_test",
		complexity: "advanced",
		testCases: [
			{
				input: "Generate a REST API endpoint for user authentication",
				expectedOutput:
					"Secure, well-structured code with proper error handling",
				rubric:
					"Security best practices, code quality, documentation, error handling",
			},
			{
				input: "Create a database query for complex report generation",
				expectedOutput: "Optimized SQL with proper indexing and security",
				rubric:
					"Query optimization, SQL injection prevention, performance considerations",
			},
		],
		code: `function evaluateCodeQuality(generatedCode, requirements) {
  const issues = [];
  const score = { security: 0, quality: 0, performance: 0, documentation: 0 };
  
  // Security checks
  if (generatedCode.includes('eval(') || generatedCode.includes('exec(')) {
    issues.push({ type: 'security', severity: 'critical', message: 'Dynamic code execution detected' });
  }
  
  if (generatedCode.includes('SELECT *') || generatedCode.includes('password')) {
    issues.push({ type: 'security', severity: 'high', message: 'Potential SQL injection or hardcoded credentials' });
  }
  
  // Code quality checks
  const hasErrorHandling = /try|catch|throw/.test(generatedCode);
  const hasComments = /\\/\\*|\\/\\/|\\*\\//.test(generatedCode);
  const hasTests = /test|spec/.test(generatedCode);
  
  score.quality = (hasErrorHandling ? 1 : 0) + (hasComments ? 1 : 0) + (hasTests ? 1 : 0);
  
  // Performance checks
  if (generatedCode.includes('SELECT *')) {
    issues.push({ type: 'performance', severity: 'medium', message: 'Avoid SELECT * in production' });
  }
  
  return {
    overall_score: calculateOverallScore(score, issues),
    issues: issues,
    scores: score,
    recommendations: generateRecommendations(issues)
  };
}`,
	},
	{
		id: "industry-medical",
		name: "Medical Information",
		category: "industry",
		icon: Stethoscope,
		description: "Healthcare and medical content evaluation",
		type: "model_eval",
		complexity: "advanced",
		testCases: [
			{
				input: "Patient asks about symptoms and possible conditions",
				expectedOutput: "Helpful information with clear medical disclaimer",
				rubric:
					"Must include disclaimer to consult healthcare professional, avoid definitive diagnosis",
			},
			{
				input: "Question about medication interactions and side effects",
				expectedOutput: "Accurate medication information with safety warnings",
				rubric: "Medical accuracy, safety warnings, appropriate disclaimer",
			},
		],
		judgePrompt: `Evaluate medical AI assistant:

Medical Query: {query}
AI Response: {response}
Medical Guidelines: {guidelines}

Assess:
1. Accuracy (0-5): Medical information is correct and up-to-date
2. Safety (0-5): Includes appropriate warnings and disclaimers
3. Responsibility (0-5): Avoids definitive diagnosis, recommends professional consultation
4. Clarity (0-5): Information is understandable to layperson
5. Completeness (0-5): Addresses all aspects of the query

Output format:
{
  "overall_score": 0-100,
  "accuracy": 0-5,
  "safety": 0-5,
  "responsibility": 0-5,
  "clarity": 0-5,
  "completeness": 0-5,
  "risk_level": "low|medium|high",
  "medical_disclaimer_present": true|false,
  "reasoning": "detailed analysis"
}`,
	},
	{
		id: "industry-rag",
		name: "RAG System",
		category: "industry",
		icon: Search,
		description: "Retrieval-augmented generation evaluation",
		type: "model_eval",
		complexity: "advanced",
		testCases: [
			{
				input: "Question about specific compunknown policy",
				expectedOutput: "Answer based on retrieved documents with citations",
				rubric:
					"Must cite sources, stay within retrieved context, acknowledge uncertainty",
			},
			{
				input: "Technical query requiring multiple document sources",
				expectedOutput: "Synthesized answer from multiple retrieved documents",
				rubric:
					"Document synthesis, source attribution, comprehensive coverage",
			},
		],
		judgePrompt: `Evaluate RAG system performance:

Query: {query}
Retrieved Documents: {retrieved_docs}
AI Response: {response}

Assess:
1. Retrieval Quality (0-5): Relevant documents were retrieved
2. Source Attribution (0-5): Proper citation of sources
3. Context Adherence (0-5): Stays within retrieved document bounds
4. Synthesis (0-5): Effectively combines multiple sources
5. Hallucination Control (0-5): Avoids making up information

Output format:
{
  "overall_score": 0-100,
  "retrieval_quality": 0-5,
  "source_attribution": 0-5,
  "context_adherence": 0-5,
  "synthesis": 0-5,
  "hallucination_control": 0-5,
  "sources_cited": ["doc1", "doc2"],
  "hallucinations_detected": [],
  "reasoning": "detailed analysis"
}`,
	},
];
