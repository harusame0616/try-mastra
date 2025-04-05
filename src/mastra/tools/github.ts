import { createTool } from "@mastra/core";
import { z } from "zod";
import { github } from "../integrations/github";

export const getPullRequest = createTool({
	id: "get_pull_request",
	description: "pull request の内容を取得する",
	inputSchema: z.object({
		owner: z.string(),
		repo: z.string(),
		prNumber: z.number(),
	}),
	execute: async ({ context }) => {
		const client = await github.getApiClient();

		const pr = await client.pullsGet({
			path: {
				owner: context.owner,
				repo: context.repo,
				pull_number: context.prNumber,
			},
		});
		console.log(pr);

		return pr;
	},
});
