import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { createEmbed, successEmbed } from '../../utils/embeds.js';
import { logEvent } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { getColor } from '../../config/bot.js';

import { InteractionHelper } from '../../utils/interactionHelper.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Delete a specific amount of messages")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Number of messages (1-100)")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        
    category: "moderation",
    abuseProtection: { maxAttempts: 5, windowMs: 60_000 },

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction, {
            flags: MessageFlags.Ephemeral,
        });

        if (!deferSuccess) {
            logger.warn('Purge interaction defer failed', {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                commandName: 'purge'
            });
            return;
        }

        const amount = interaction.options.getInteger("amount");
        const channel = interaction.channel;

        if (amount < 1 || amount > 100) {
            return await replyUserError(interaction, { 
                type: ErrorTypes.VALIDATION, 
                message: 'Please specify a number between 1 and 100.' 
            });
        }

        try {
            const fetched = await channel.messages.fetch({ limit: amount });
            const deleted = await channel.bulkDelete(fetched, true);
            const deletedCount = deleted.size;

            await logEvent({
                client,
                guild: interaction.guild,
                event: 'MESSAGES_PURGED',
                executor: interaction.user,
                targetChannel: channel,
                details: `Deleted ${deletedCount} messages.`
            });

            await interaction.editReply({
                embeds: [successEmbed(`Successfully deleted **${deletedCount}** messages.`, getColor('success'))]
            });

        } catch (error) {
            logger.error('Purge command failed', { error, guildId: interaction.guildId });
            await replyUserError(interaction, {
                type: ErrorTypes.INTERNAL,
                message: 'Failed to delete messages. Note: Messages older than 14 days cannot be bulk deleted.'
            });
        }
    }
};
