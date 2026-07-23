import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lockall')
        .setDescription('Blochează trimiterea de mesaje pe TOATE canalele (Lockdown).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());

        let count = 0;
        for (const [id, channel] of channels) {
            try {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    SendMessages: false
                });
                count++;
            } catch (err) {}
        }

        await interaction.editReply(`🔒 **SERVER LOCKDOWN:** Au fost blocate **${count}** canale!`);
    }
};
