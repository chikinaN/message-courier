import { AttachmentBuilder, Client, ChatInputCommandInteraction, Events, InteractionResponse, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
import * as send from "./send";

type commandHandlerType = (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | void>;

type commandType = {
  name: string;
  builder: SlashCommandOptionsOnlyBuilder;
  handler: commandHandlerType;
}


function commandsHandlers(commands: commandType[]): { [key: string]: commandHandlerType } {
  return commands.reduce((handlers, command) => {
    handlers[command.name] = command.handler;
    return handlers;
  }, {} as { [key: string]: commandHandlerType });
}

async function registerCommands(client: Client, rest: REST, commands: commandType[]) {
  try {
    await rest.put(
      Routes.applicationCommands(client.user?.id ?? ""),
      { body: commands.map(command => command.builder.toJSON()) }
    );
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

function CommandExecutor(client: Client, commands: commandType[]) {
	const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN ?? "");
	const commandHandlers = commandsHandlers(commands);

	if (process.env.DISCORD_BOT_TOKEN) {
		registerCommands(client, rest, commands).then(() => {
			console.log('Successfully registered application commands.');
			client.on(Events.InteractionCreate, async (interaction) => {
				if (interaction.isChatInputCommand()) {
					if (interaction.commandName in commandHandlers) {
						return commandHandlers[interaction.commandName](interaction);
					} else {
						return await send.SendReply(interaction, send.GenerateText(`コマンドが見つかりません。`))
					}
				}
			});
		});
	}
}

export {CommandExecutor, commandType };
