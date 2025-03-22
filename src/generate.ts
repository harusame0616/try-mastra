import { chefAgent } from "./mastra/agents/chef-agent";
async function main() {
	const query =
		"パスタ、トマト、ガーリック、オリーブオイル、いくつかの乾燥ハーブ（バジル、オルガノ）";

	console.log(`Query: ${query}`);

	const response = await chefAgent.generate([
		{
			role: "user",
			content: query,
		},
	]);

	console.log(response);
}

main();
