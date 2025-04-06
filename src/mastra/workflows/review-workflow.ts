import { Step, Workflow } from "@mastra/core/workflows";
import * as z from "zod";
import { prReviewAgent } from "../agents/pr-reqview-agent";
import { github } from "../integrations/github";

const pullRequestPathSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	pullRequestNumber: z.number(),
});
type PullRequestPath = z.infer<typeof pullRequestPathSchema>;

const pullRequestSchema = z.object({
	title: z.string(),
	body: z.string().nullable(),
	diff: z.string(),
	comments: z.string(),
	commits: z.string(),
	reviewComments: z.string(),
});

const pullRequestReviewSchema = z.object({
	event: z.enum(["REQUEST_CHANGES", "COMMENT", "APPROVE"]),
	body: z.string(),
	comments: z.array(
		z.object({
			body: z.string(),
			line: z.number().optional(),
			path: z.string(),
			position: z.number().optional(),
			side: z.string().optional(),
			start_line: z.number().optional(),
			start_side: z.string().optional(),
		}),
	),
});

const triggerSchema = pullRequestPathSchema;
type Trigger = z.infer<typeof triggerSchema>;

export const prReviewWorkflow = new Workflow({
	name: "pr-review-workflow",
	triggerSchema,
});

const getPRInfo = new Step({
	id: "getPRInfo",
	outputSchema: z.object({
		pullRequestPath: pullRequestPathSchema,
		pullRequest: pullRequestSchema,
	}),
	execute: async ({ context }) => {
		const { owner, repo, pullRequestNumber } =
			context.getStepResult<Trigger>("trigger");

		const ghClient = await github.getApiClient();

		const pullRequest = await ghClient.pullsGet({
			path: {
				owner,
				repo,
				pull_number: pullRequestNumber,
			},
		});

		if (!pullRequest.data) {
			throw new Error("PRが見つかりません");
		}

		const [diff, comments, commits, reviewComments] = await Promise.all([
			fetch(pullRequest.data.diff_url).then((res) => res.text()),
			fetch(pullRequest.data.comments_url).then((res) => res.text()),
			fetch(pullRequest.data.commits_url).then((res) => res.text()),
			fetch(pullRequest.data.review_comment_url).then((res) => res.text()),
		]);

		return {
			pullRequest: {
				title: pullRequest.data.title,
				body: pullRequest.data.body,
				diff,
				comments,
				commits,
				reviewComments,
			},
			pullRequestPath: {
				owner,
				repo,
				pullRequestNumber: pullRequestNumber,
			},
		};
	},
});

// PRをレビューするステップ
const reviewPR = new Step({
	id: "reviewPR",
	inputSchema: z.object({
		pullRequest: pullRequestSchema,
		pullRequestPath: pullRequestPathSchema,
	}),
	outputSchema: z.object({
		pullRequestPath: pullRequestPathSchema,
		pullRequestReview: pullRequestReviewSchema,
	}),
	execute: async ({ context }) => {
		const { pullRequestPath, pullRequest } = context.getStepResult(getPRInfo);

		const prompt = `タイトル: ${pullRequest.title}
			説明: ${pullRequest.body || ""}

			差分:
			${pullRequest.diff}`;

		const reviewResponse = await prReviewAgent.generate(prompt, {
			output: pullRequestReviewSchema,
		});

		return {
			pullRequestReview: reviewResponse.object,
			pullRequestPath: pullRequestPath,
		};
	},
});

const sendReview = new Step({
	id: "sendReview",
	inputSchema: z.object({
		pullRequestPath: pullRequestPathSchema,
		pullRequestReview: pullRequestReviewSchema,
	}),
	execute: async ({ context }) => {
		const { pullRequestPath, pullRequestReview } =
			context.getStepResult(reviewPR);

		const ghClient = await github.getApiClient();
		const result = await ghClient.pullsCreateReview({
			path: {
				owner: pullRequestPath.owner,
				repo: pullRequestPath.repo,
				pull_number: pullRequestPath.pullRequestNumber,
			},
			body: {
				body: pullRequestReview.body,
				// event: pullRequestReview.event,
				// 自分の PR だと自分に REQUESTED CHANGE を送れないため暫定的に COMMENT
				event: "COMMENT",
				comments: pullRequestReview.comments,
			},
		});

		return result;
	},
});

prReviewWorkflow.step(getPRInfo).then(reviewPR).then(sendReview).commit();
