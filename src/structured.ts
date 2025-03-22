import { chefAgent } from "./mastra/agents/chef-agent";
import { z } from "zod";
async function main() {
	const query = "ラザニアのレシピを教えて下さい";

	console.log(`Query: ${query}`);

	const schema = z.object({
		ingredients: z.array(
			z.object({
				name: z.string(),
				amount: z.string(),
			}),
		),
		steps: z.array(z.string()),
	});
	const response = await chefAgent.generate(
		[
			{
				role: "user",
				content: query,
			},
		],
		{
			output: schema,
		},
	);

	console.log({
		ingredients: response.object.ingredients,
		steps: response.object.steps,
	});

	console.log(response);
}

main();
