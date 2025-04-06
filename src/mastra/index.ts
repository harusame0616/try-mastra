import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherAgent } from "./agents";
import { chefAgent } from "./agents";
import { stockAgent } from "./agents/stock-agent";
import { candidateWorkflow } from "./workflows/workflow";
import { prReviewAgent } from "./agents/pr-reqview-agent";
import { prReviewWorkflow } from "./workflows";
import { VercelDeployer } from "@mastra/deployer-vercel";

export const mastra = new Mastra({
	workflows: { candidateWorkflow, prReviewWorkflow },
	agents: { weatherAgent, chefAgent, stockAgent, prReviewAgent },
	logger: createLogger({
		name: "try-mastra",
		level: "info",
	}),
	deployer: new VercelDeployer({
		teamSlug: "harusame-dev",
		projectName: "try-mastra",
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		token: process.env.VERCEL_TOKEN!,
	}),
});
