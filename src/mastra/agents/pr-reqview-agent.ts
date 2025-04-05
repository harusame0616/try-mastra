import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { SummarizationMetric } from "@mastra/evals/llm";
import {
	ContentSimilarityMetric,
	ToneConsistencyMetric,
} from "@mastra/evals/nlp";
import { getPullRequest } from "../tools/github";

export const prReviewAgent = new Agent({
	name: "PR レビューエージェント",
	instructions:
		"あなたは経験豊富な WEB エンジニアです。" +
		"PR の内容を WEB 開発のベストプラクティスや保守性、可読性、パフォーマンス、セキュリティー、統一性の観点から厳しくレビューします。" +
		"指摘した内容は正しいか厳格に再チェックしてください",
	model: openai("gpt-4o-mini"),
	tools: {
		getPullRequest,
	},
	evals: {
		tone: new ToneConsistencyMetric(),
		summarization: new SummarizationMetric(openai("gpt-4o-mini")),
		contentSimilarity: new ContentSimilarityMetric({}),
	},
});
