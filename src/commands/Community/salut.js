import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('salut') // Numele comandei (doar litere mici, fără spații)
        .setDescription('Îți trimite un mesaj de întâmpinare'), // Descrierea
        
    async execute(interaction) {
        // Aici pui ce să facă botul când cineva scrie /salut
        await interaction.reply({ 
            content: `Salutare, ${interaction.user}! Bine ai venit pe server! 👋` 
        });
    }
};
