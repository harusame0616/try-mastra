import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";
import { Step, Workflow } from "@mastra/core/workflows";

const recruiter = new Agent({
	name: "Recruiter Agent",
	instructions: "You are a recruiter.",
	model: openai("gpt-4o-mini"),
});

const gatherCandidateInfo = new Step({
	id: "gatherCandidateInfo",
	inputSchema: z.object({
		resumeText: z.string(),
	}),
	outputSchema: z.object({
		candidateName: z.string(),
		isTechnical: z.boolean(),
		specialty: z.string(),
		resumeText: z.string(),
	}),
	execute: async ({ context }) => {
		const resumeText = context?.getStepResult<{
			resumeText: string;
		}>("trigger")?.resumeText;

		const prompt = `
          Extract details from the resume text:
          "${resumeText}"
        `;

		const res = await recruiter.generate(prompt, {
			output: z.object({
				candidateName: z.string(),
				isTechnical: z.boolean(),
				specialty: z.string(),
				resumeText: z.string(),
			}),
		});

		return res.object;
	},
});

interface CandidateInfo {
	candidateName: string;
	isTechnical: boolean;
	specialty: string;
	resumeText: string;
}

const askAboutSpecialty = new Step({
	id: "askAboutSpecialty",
	outputSchema: z.object({
		question: z.string(),
	}),
	execute: async ({ context }) => {
		const candidateInfo = context?.getStepResult<CandidateInfo>(
			"gatherCandidateInfo",
		);

		const prompt = `
          You are a recruiter. Given the resume below, craft a short question
          for ${candidateInfo?.candidateName} about how they got into "${candidateInfo?.specialty}".
          Resume: ${candidateInfo?.resumeText}
        `;
		const res = await recruiter.generate(prompt);

		return { question: res?.text?.trim() || "" };
	},
});

const askAboutRole = new Step({
	id: "askAboutRole",
	outputSchema: z.object({
		question: z.string(),
	}),
	execute: async ({ context }) => {
		const candidateInfo = context?.getStepResult<CandidateInfo>(
			"gatherCandidateInfo",
		);

		const prompt = `
          You are a recruiter. Given the resume below, craft a short question
          for ${candidateInfo?.candidateName} asking what interests them most about this role.
          Resume: ${candidateInfo?.resumeText}
        `;
		const res = await recruiter.generate(prompt);
		return { question: res?.text?.trim() || "" };
	},
});

export const candidateWorkflow = new Workflow({
	name: "candidate-workflow",
	triggerSchema: z.object({
		resumeText: z.string(),
	}),
});

candidateWorkflow
	.step(gatherCandidateInfo)
	.then(askAboutSpecialty, {
		when: { "gatherCandidateInfo.isTechnical": true },
	})
	.after(gatherCandidateInfo)
	.step(askAboutRole, {
		when: { "gatherCandidateInfo.isTechnical": false },
	});

candidateWorkflow.commit();
