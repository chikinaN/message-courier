import { Client, Events, GatewayIntentBits } from "discord.js";
import { CommandExecutor } from "./src/lib/command";
import commands from "./src/courier";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
  console.log(`起動しました ログインタグは ${c.user.tag}`);
	if (process.env.DISCORD_BOT_NAME != client.user?.username) {
		console.error('設定されたBOT名とログインしたBOT名が一致しません。');
		process.exit(1);
	}
	main();
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
	console.error('ログインに失敗しました:', error);
	process.exit(1);
});

function main() {
	try {
		client.user?.setActivity('好きな惣菜発表ドラゴン', { type: 0 })

		CommandExecutor(client, commands);

	} catch (error) {
		console.error('An error occurred:', error);
		process.exit(1);
	}
}
