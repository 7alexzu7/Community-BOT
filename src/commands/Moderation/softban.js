import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Dă ban și unban imediat unui utilizator (șterge mesajele recente).')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
        .addStringOption(opt => opt.setName('motiv').setDescription('Motivul').setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('motiv') || 'Softban executat.';

        try {
            // Banăm userul și îi ștergem mesajele din ultimele 7 zile
            await interaction.guild.members.ban(target, { deleteMessageSeconds: 604800, reason });
            // Îi dăm unban imediat
            await interaction.guild.members.unban(target.id, 'Softban automatic unban');

            await interaction.reply({ content: `🧹 Softban aplicat cu succes pentru **${target.tag}**.` });
        } catch (err) {
            await interaction.reply({ content: '❌ Nu am putut aplica softban pe acest utilizator.', ephemeral: true });
        }
    }
};
