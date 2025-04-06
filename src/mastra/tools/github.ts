import { createTool } from "@mastra/core";
import { z } from "zod";
import { github } from "../integrations/github";

export const getDiff = createTool({
	id: "get_diff",
	description: "pull request の diff を取得する",
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

		const diffUrl = pr.data?.diff_url;
		if (!diffUrl) {
			throw new Error("diff_url がありません");
		}

		const diff = await fetch(diffUrl);
		const diffText = await diff.text();

		return diffText;
	},
});

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

		console.log("getPullRequest", { pr });

		return pr.data;
	},
});

export const getMainRef = createTool({
	id: "get_main_ref",
	description: "main ブランチの ref を取得する",
	inputSchema: z.object({
		owner: z.string(),
		repo: z.string(),
	}),
	execute: async ({ context }) => {
		const client = await github.getApiClient();

		const ref = await client.reposGet({
			path: {
				owner: context.owner,
				repo: context.repo,
			},
		});
		console.log("getMainRef", { ref });

		return ref.data?.default_branch;
	},
});

export const extractReviewComments = createTool({
	id: "extractReviewComments",
	description: "差分とレビュー分析からレビューコメントを抽出する",
	inputSchema: z.object({
		diff: z.string(),
		analysis: z.string(),
	}),
	execute: async ({ context }) => {
		// 差分を解析して、ファイルパスと行番号を特定
		const diffLines = context.diff.split("\n");
		const fileChanges = [];
		let currentFile = "";
		let currentLine = 0;

		// diff を解析して変更情報を抽出
		for (const line of diffLines) {
			if (line.startsWith("diff --git")) {
				// 新しいファイルの開始
				const match = line.match(/diff --git a\/(.*) b\/(.*)/);
				if (match) {
					currentFile = match[2];
				}
			} else if (line.startsWith("@@ ")) {
				// 行番号情報の抽出
				const match = line.match(/@@ -\d+,\d+ \+(\d+),\d+ @@/);
				if (match) {
					currentLine = Number.parseInt(match[1], 10);
				}
			} else if (line.startsWith("+") && !line.startsWith("+++")) {
				// 追加された行を記録
				fileChanges.push({
					path: currentFile,
					line: currentLine,
					content: line.substring(1).trim(),
				});
				currentLine++;
			} else if (line.startsWith(" ")) {
				// 変更なしの行もカウント
				currentLine++;
			}
		}

		// 分析からコメント生成
		// この部分はシンプルなデモ実装なので、実際のプロジェクトでは要改良
		const comments = fileChanges
			.map((change) => ({
				path: change.path,
				line: change.line,
				body: `このコードについてのレビュー: ${change.content.substring(0, 50)}...`,
				side: "RIGHT",
			}))
			.slice(0, 5); // サンプルとして最初の5つだけ

		return comments;
	},
});

export const sendReview = createTool({
	id: "send_review",
	description: "pull request にレビューを送信する",
	inputSchema: z.object({
		owner: z.string(),
		repo: z.string(),
		prNumber: z.number(),
		body: z.string(),
		comments: z.array(
			z.object({
				body: z.string(),
				line: z.number().optional(),
				path: z.string(),
				position: z.number().optional(),
				side: z.string(),
				start_line: z.number().optional(),
				start_side: z.string().optional(),
			}),
		),
	}),
	execute: async ({ context }) => {
		const client = await github.getApiClient();

		const review = await client.pullsCreateReview({
			path: {
				owner: context.owner,
				repo: context.repo,
				pull_number: context.prNumber,
			},
			body: {
				body: context.body,
				comments: context.comments,
				event: "COMMENT",
			},
		});

		console.log("sendReview", { review });

		return review.response;
	},
});
