const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

let posts = {};

client.on('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content.startsWith('!post') && msg.attachments.first()) {
    
    const image = msg.attachments.first().url;

    const embed = new EmbedBuilder()
      .setDescription(`Autor: ${msg.author}`)
      .setImage(image)
      .setColor('Blue');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('like').setLabel('❤️ 0').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('comment').setLabel('💬 0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('view').setLabel('⋯').setStyle(ButtonStyle.Secondary)
    );

    const sent = await msg.channel.send({ embeds: [embed], components: [row] });

    posts[sent.id] = { likes: [], comments: [] };
  }
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton()) {
    const post = posts[interaction.message.id];
    if (!post) return;

    if (interaction.customId === 'like') {
      if (!post.likes.includes(interaction.user.id)) {
        post.likes.push(interaction.user.id);
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('like').setLabel(`❤️ ${post.likes.length}`).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('comment').setLabel(`💬 ${post.comments.length}`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('view').setLabel('⋯').setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ components: [row] });
    }

    if (interaction.customId === 'comment') {
      const modal = new ModalBuilder()
        .setCustomId('modal_comment')
        .setTitle('Comentar');

      const input = new TextInputBuilder()
        .setCustomId('comment_input')
        .setLabel('Seu comentário')
        .setStyle(TextInputStyle.Paragraph);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'view') {
      const likes = post.likes.map(id => `<@${id}>`).join('\n') || 'Ninguém';
      const comments = post.comments.map(c => `<@${c.user}>: ${c.text}`).join('\n') || 'Nenhum';

      await interaction.reply({
        content: `❤️ Curtidas:\n${likes}\n\n💬 Comentários:\n${comments}`,
        ephemeral: true
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_comment') {
      const post = posts[interaction.message.id];
      const text = interaction.fields.getTextInputValue('comment_input');

      post.comments.push({ user: interaction.user.id, text });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('like').setLabel(`❤️ ${post.likes.length}`).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('comment').setLabel(`💬 ${post.comments.length}`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('view').setLabel('⋯').setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ components: [row] });
    }
  }

});

client.login(process.env.TOKEN);
