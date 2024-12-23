import {
  Collection,
  EmbedBuilder,
  Message,
  SlashCommandBuilder,
  TextBasedChannel,
  TextChannel,
} from "discord.js";
import { commandType } from "./lib/command";
import * as send from "./lib/send";

async function processAndSendMessages(
  allMessages: Message[],
  reply2: Message,
  channel: TextChannel
) {
  const imageKeywords = ["image", "png", "jpg", "jpeg", "gif", "webp"];

  for (const msg of allMessages) {
    if (msg.id === reply2.id) continue;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: msg.author.username,
        iconURL: msg.author.displayAvatarURL(),
      })
      .setDescription(
        msg.content != "" ? msg.content : "メッセージがありません"
      )
      .setColor("#666666")
      .setTimestamp(msg.createdTimestamp);

    if (msg.attachments.size > 0) {
      for (const attachment of msg.attachments.values()) {
        if (imageKeywords.some((keyword) => attachment.url.includes(keyword))) {
          embed.setImage(attachment.url);
        } else {
					await send.SendMessage(channel, { embeds: [embed] });
          await channel.send({
            content: `${new Date(msg.createdTimestamp).toLocaleString(
              "ja-JP",
              { timeZone: "Asia/Tokyo" }
            )}`,
            files: [attachment.url],
          });
					continue;
        }
      }
    }

    const embeds = msg.embeds;
    if (embeds.length > 0) {
			await send.SendMessage(channel, { embeds: [embed] });
      for (const embed of embeds) {
        await channel.send({ embeds: [embed] });
      }
			continue;
    }

    if (embed) {
      await send.SendMessage(channel, { embeds: [embed] });
    }
  }
}

async function getAllMessages(channel: TextBasedChannel) {
  const messages = new Collection<string, Message>();
  const fetch = async (before: string | undefined) => {
    const fetched = await channel.messages.fetch({
      before: before,
      limit: 100,
    });
    if (fetched.size === 0) return;
    fetched.forEach((msg) => messages.set(msg.id, msg));
    await fetch(fetched.last()?.id);
  };
  await fetch(undefined);
  return messages;
}

const commands: commandType[] = [
  {
    name: "courier",
    builder: new SlashCommandBuilder()
      .setName("courier")
      .setDescription("チャンネル移動の時に使います")
      .addStringOption((option) =>
        option
          .setName("channel")
          .setDescription("移動先のチャンネル名")
          .setRequired(true)
      ),
    handler: async (interaction) => {
      const currentChannel = interaction.channel;
      if (!currentChannel)
        return await send.SendReply(
          interaction,
          send.GenerateText("チャンネルが見つかりませんでした。")
        );
      const channelId = interaction.options.getString("channel");
      const channel = (await interaction.client.channels.fetch(
        channelId ?? ""
      )) as TextChannel;
      if (!channel)
        return send.SendReply(
          interaction,
          send.GenerateText("チャンネル名が見つかりませんでした。")
        );
      if (currentChannel.id === channel.id)
        return send.SendReply(
          interaction,
          send.GenerateText("既にそのチャンネルにいます。")
        );
      const reply = await send.SendReply(
        interaction,
        send.GenerateText(
          `チャンネルを${channel}に移動します。\n メッセージを読み込み中`
        )
      );
      const allMessages = await getAllMessages(currentChannel);
      const reply2 = await send.SendEdit(
        reply,
        send.GenerateText(
          `チャンネルを${channel}に移動します。\n メッセージの読み込みが完了しました。 \n メッセージを転送中`
        )
      );
      await send.SendMessage(
        channel,
        send.GenerateText(`${currentChannel}からこのチャンネルに移動しました。`)
      );

      const formatMessages = Array.from(allMessages.values()).reverse();
      await processAndSendMessages(formatMessages, reply2, channel);

      await send.SendEdit(
        reply,
        send.GenerateText(`${channel}に移動が完了しました。`)
      );
    },
  },
];

export default commands;
