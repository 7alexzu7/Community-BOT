import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { verifyUser } from '../services/verificationService.js';

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // --- 1. GESTIONARE COMANDI SLASH ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'A apărut o eroare la executarea acestei comenzi!',
                    flags: 64
                }).catch(() => {});
            }
        } 
        
        // --- 2. GESTIONARE BUTOANE (Inclusiv Captcha Verificare) ---
        else if (interaction.isButton()) {

            // INTERCEPTARE BUTON DE VERIFICARE CU CAPTCHA
            if (interaction.customId === 'verify_user') {
                const CAPTCHA_OPTIONS = [
                    { label: 'Măr', emoji: '🍎', id: 'apple' },
                    { label: 'Mașină', emoji: '🚗', id: 'car' },
                    { label: 'Minge', emoji: '⚽', id: 'ball' },
                    { label: 'Racheta', emoji: '🚀', id: 'rocket' },
                    { label: 'Pizza', emoji: '🍕', id: 'pizza' }
                ];

                // Alegem opțiunea corectă aleatoriu și amestecăm butoanele
                const correctTarget = CAPTCHA_OPTIONS[Math.floor(Math.random() * CAPTCHA_OPTIONS.length)];
                const shuffledOptions = [...CAPTCHA_OPTIONS].sort(() => Math.random() - 0.5);

                const row = new ActionRowBuilder();
                shuffledOptions.forEach(opt => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`captcha_${opt.id}`)
                            .setLabel(opt.label)
                            .setEmoji(opt.emoji)
                            .setStyle(ButtonStyle.Secondary)
                    );
                });

                const captchaEmbed = new EmbedBuilder()
                    .setTitle('🔒 Verificare Anti-Bot (Captcha)')
                    .setDescription(`Pentru a primi acces pe server, apasă pe butonul cu: **${correctTarget.emoji} ${correctTarget.label}**.\n\n⏱️ Ai **30 de secunde** la dispoziție!`)
                    .setColor('#5865F2');

                const response = await interaction.reply({
                    embeds: [captchaEmbed],
                    components: [row],
                    flags: 64 // Ephemeral: vizibil doar pentru utilizator
                });

                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 30000
                });

                collector.on('collect', async i => {
                    const selectedId = i.customId.replace('captcha_', '');

                    if (selectedId === correctTarget.id) {
                        try {
                            // Răspuns corect: apelează serviciul existent din botul tău
                            await verifyUser(interaction.client, interaction.guild.id, interaction.user.id);
                            
                            await i.update({
                                content: '🎉 **Verificare reușită!** Ai primit acces complet pe server.',
                                embeds: [],
                                components: []
                            });
                        } catch (err) {
                            console.error('Eroare la verificare:', err);
                            await i.update({
                                content: '❌ Eroare la adăugarea rolului. Verifică ierarhia rolurilor din server.',
                                embeds: [],
                                components: []
                            });
                        }
                    } else {
                        await i.update({
                            content: '❌ **Captcha greșit!** Apasă din nou pe butonul de verificare pentru a încerca iar.',
                            embeds: [],
                            components: []
                        });
                    }
                    collector.stop();
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        interaction.editReply({
                            content: '⏱️ **Timpul a expirat!** Apasă din nou pe butonul de verificare.',
                            embeds: [],
                            components: []
                        }).catch(() => {});
                    }
                });

                return;
            }

            // Alte butoane existente din botul tău (ex: shared_todo)
            if (interaction.customId.startsWith('shared_todo_')) {
                const parts = interaction.customId.split('_');
                const buttonType = parts.slice(0, 3).join('_');
                const button = client.buttons?.get(buttonType);

                if (button) {
                    await button.execute(interaction, client);
                }
            }
        }
    }
};
