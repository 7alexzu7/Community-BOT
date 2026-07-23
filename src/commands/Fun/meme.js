import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Afișează un meme aleatoriu'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await fetch('https://meme-api.com/gimme/memes');
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setTitle(data.title)
                .setURL(data.postLink)
                .setImage(data.url)
                .setColor('#FF4500')
                .setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('❌ Nu am putut încărca un meme momentan!');
        }
    }
};
