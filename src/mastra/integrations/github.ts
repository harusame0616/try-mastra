import { GithubIntegration } from "@mastra/github";
import { z } from "zod";

const { GITHUB_PAT: githubPat } = z
	.object({
		GITHUB_PAT: z.string(),
	})
	.parse(process.env);

export const github = new GithubIntegration({
	config: {
		PERSONAL_ACCESS_TOKEN: githubPat,
	},
});
