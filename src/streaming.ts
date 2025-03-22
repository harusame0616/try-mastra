import { chefAgent } from "./mastra/agents/chef-agent";
async function main() {
	const query =
		"パスタ、トマト、ガーリック、オリーブオイル、いくつかの乾燥ハーブ（バジル、オルガノ）";

	console.log(`Query: ${query}`);

	const stream = await chefAgent.stream(query, {
		onFinish: (x) => {
			console.log("onFinish", x);
		},
		onError: (x) => {
			console.log("onError", x);
		},
	});

	for await (const chunk of stream.textStream) {
		process.stdout.write(chunk);
	}
}

main()
	.then(() => {
		console.log("done");
	})
	.catch((e) => {
		console.error(e);
	});
