import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { getGuildConfig } from '../services/config/guildConfig.js';

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
            
            // --- 2. GESTIONARE BUTOANE (Captcha) ---
            else if (interaction.isButton()) {

                // Apăsare pe butonul principal "VERIFICA-TE"
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
                        flags: 64
                    });

                    const collector = response.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 30000
                    });

                    collector.on('collect', async i => {
                        // Răspundem instant pentru a evita timeout-ul Discord
                        try {
                            await i.deferUpdate();
                        } catch (e) {}

                        const selectedId = i.customId.replace('captcha_', '');

                        if (selectedId === correctTarget.id) {
                            try {
                                // Căutăm rolul de verificare
                                let roleId = null;
                                try {
                                    const guildConfig = await getGuildConfig(client, interaction.guild.id);
                                    roleId = guildConfig?.verification?.roleId;
                                } catch (cfgErr) {
                                    console.error('Eroare citire guildConfig:', cfgErr);
                                }

                                const member = await interaction.guild.members.fetch(interaction.user.id);

                                if (roleId) {
                                    await member.roles.add(roleId);
                                    await i.editReply({
                                        content: '🎉 **Verificare reușită!** Ai primit acces pe server.',
                                        embeds: [],
                                        components: []
                                    });
                                } else {
                                    await i.editReply({
                                        content: '⚠️ Captcha corect, dar nu am găsit rolul configurat! Rulează din nou comanda `/verification setup`.',
                                        embeds: [],
                                        components: []
                                    });
                                }
                            } catch (roleError) {
                                console.error('Eroare la adăugare rol:', roleError);
                                await i.editReply({
                                    content: '❌ **Eroare permisiuni:** Mută rolul Botului mai SUS decât rolul de membru în Server Settings -> Roles!',
                                    embeds: [],
                                    components: []
                                });
                            }
                        } else {
                            await i.editReply({
                                content: '❌ **Captcha greșit!** Apasă din nou pe butonul de verificare.',
                                embeds: [],
                                components: []
                            });
                        }
                        collector.stop();
                    });

                    return;
                }

                // Alte butoane (ex: shared_todo)
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
