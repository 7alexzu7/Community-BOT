import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Gestionează utilizatorii și rolurile din Whitelist-ul de securitate.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('add_user')
               .setDescription('Adaugă un utilizator în Whitelist')
               .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('remove_user')
               .setDescription('Scoate un utilizator din Whitelist')
               .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        if (subcommand === 'add_user') {
            await interaction.reply({ 
                content: `✅ Utilizatorul **${user.tag}** a fost adăugat în Whitelist!` 
            });
        } else if (subcommand === 'remove_user') {
            await interaction.reply({ 
                content: `🗑️ Utilizatorul **${user.tag}** a fost scos din Whitelist!` 
            });
        }
    }
};
