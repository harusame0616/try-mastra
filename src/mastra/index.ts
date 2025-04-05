import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows";
import { weatherAgent } from "./agents";
import { chefAgent } from "./agents";
import { stockAgent } from "./agents/stock-agent";
import { candidateWorkflow } from "./workflows/workflow";
import { prReviewAgent } from "./agents/pr-reqview-agent";

export const mastra = new Mastra({
	workflows: { weatherWorkflow, candidateWorkflow },
	agents: { weatherAgent, chefAgent, stockAgent, prReviewAgent },
	logger: createLogger({
		name: "Mastra",
		level: "info",
	}),
});
