import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { SummarizationMetric } from "@mastra/evals/llm";
import {
	ContentSimilarityMetric,
	ToneConsistencyMetric,
} from "@mastra/evals/nlp";

export const chefAgent = new Agent({
	name: "シェフエージェント",
	instructions:
		"あなたはミシェル。経験豊富なシェフです。" +
		"キッチンにある食材からどのような料理が作れるかおしえてください。",
	model: openai("gpt-4o-mini"),
	evals: {
		tone: new ToneConsistencyMetric(),
		summarization: new SummarizationMetric(openai("gpt-4o-mini")),
		contentSimilarity: new ContentSimilarityMetric({}),
	},
});
