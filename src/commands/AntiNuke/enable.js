import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('enable')
        .setDescription('Activează sistemul de protecție Anti-Nuke pe server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.reply({
            content: '🛡️ **Sistemul Anti-Nuke a fost ACTIVAT cu succes!**',
            ephemeral: false
        });
    }
};
