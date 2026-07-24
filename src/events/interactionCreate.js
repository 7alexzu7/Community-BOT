import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getGuildConfig } from '../services/config/guildConfig.js';

// Stocăm temporar în memorie răspunsurile corecte pentru fiecare utilizator
const activeCaptchas = new Map();

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // --- 1. GESTIONARE COMANDI SLASH ---
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error('Eroare comanda slash:', error);
                    await interaction.reply({
                        content: 'A apărut o eroare la executarea acestei comenzi!',
                        flags: 64
                    }).catch(() => {});
                }
            } 
            
            // --- 2. GESTIONARE BUTOANE ---
            else if (interaction.isButton()) {

                // A) APAȘARE PE BUTONUL PRINCIPAL "VERIFICA-TE"
                if (interaction.customId === 'verify_user') {
                    const CAPTCHA_OPTIONS = [
                        { label: 'Măr', emoji: '🍎', id: 'apple' },
                        { label: 'Mașină', emoji: '🚗', id: 'car' },
                        { label: 'Minge', emoji: '⚽', id: 'ball' },
                        { label: 'Racheta', emoji: '🚀', id: 'rocket' },
                        { label: 'Pizza', emoji: '🍕', id: 'pizza' }
                    ];

                    const correctTarget = CAPTCHA_OPTIONS[Math.floor(Math.random() * CAPTCHA_OPTIONS.length)];
                    const shuffledOptions = [...CAPTCHA_OPTIONS].sort(() => Math.random() - 0.5);

                    // Salvăm răspunsul corect pentru acest utilizator
                    activeCaptchas.set(`${interaction.guild.id}_${interaction.user.id}`, correctTarget.id);

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
                        .setDescription(`Pentru a primi acces pe server, apasă pe butonul cu: **${correctTarget.emoji} ${correctTarget.label}**.`)
                        .setColor('#5865F2');

                    return await interaction.reply({
                        embeds: [captchaEmbed],
                        components: [row],
                        flags: 64
                    });
                }

                // B) APAȘARE PE UN BUTON DIN CAPTCHA (ex: captcha_apple)
                if (interaction.customId.startsWith('captcha_')) {
                    // Răspundem instant pentru a preveni "didn't respond in time"
                    await interaction.deferUpdate().catch(() => {});

                    const userKey = `${interaction.guild.id}_${interaction.user.id}`;
                    const correctId = activeCaptchas.get(userKey);
                    const selectedId = interaction.customId.replace('captcha_', '');

                    if (!correctId) {
                        return await interaction.editReply({
                            content: '⏱️ **Sesiunea a expirat!** Apasă din nou pe butonul principal de verificare.',
                            embeds: [],
                            components: []
                        });
                    }

                    // Ștergem sesiunea
                    activeCaptchas.delete(userKey);

                    if (selectedId === correctId) {
                        try {
                            const guildConfig = await getGuildConfig(client, interaction.guild.id);
                            const roleId = guildConfig?.verification?.roleId;

                            if (!roleId) {
                                return await interaction.editReply({
                                    content: '⚠️ Captcha corect, dar nu este setat niciun rol! Rulează din nou `/verification setup`.',
                                    embeds: [],
                                    components: []
                                });
                            }

                            const member = await interaction.guild.members.fetch(interaction.user.id);
                            await member.roles.add(roleId);

                            return await interaction.editReply({
                                content: '🎉 **Verificare reușită!** Ai primit acces pe server.',
                                embeds: [],
                                components: []
                            });
                        } catch (err) {
                            console.error('Eroare la adăugarea rolului:', err);
                            return await interaction.editReply({
                                content: '❌ **Eroare:** Botul nu are permisiunea să-ți dea rolul. Asigură-te că rolul Botului este mai SUS decât rolul de membru în Server Settings -> Roles!',
                                embeds: [],
                                components: []
                            });
                        }
                    } else {
                        return await interaction.editReply({
                            content: '❌ **Captcha greșit!** Apasă din nou pe butonul de verificare pentru a încerca iar.',
                            embeds: [],
                            components: []
                        });
                    }
                }

                // C) ALTE BUTOANE (ex: shared_todo)
                if (interaction.customId.startsWith('shared_todo_')) {
                    const parts = interaction.customId.split('_');
                    const buttonType = parts.slice(0, 3).join('_');
                    const button = client.buttons?.get(buttonType);

                    if (button) {
                        await button.execute(interaction, client);
                    }
                }
            }
        } catch (globalError) {
            console.error('Eroare critica interactionCreate:', globalError);
        }
    }
};
