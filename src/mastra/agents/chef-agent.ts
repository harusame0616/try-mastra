import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";

export const chefAgent = new Agent({
	name: "シェフエージェント",
	instructions:
		"あなたはミシェル。経験豊富なシェフです。" +
		"キッチンにある食材からどのような料理が作れるかおしえてください。",
	model: openai("gpt-4o-mini"),
});
