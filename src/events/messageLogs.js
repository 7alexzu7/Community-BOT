import { Events, EmbedBuilder } from 'discord.js';

// Pune ID-ul canalului unde sa trimita log-urile!
const LOG_CHANNEL_ID = '1449491142742904980'; 

export default [
    // 1. LOG PENTRU MESAJE ȘTERSE
    {
        name: Events.MessageDelete,
        async execute(message) {
            if (!message.guild || message.author?.bot) return;

            const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Mesaj Șters')
                .setColor('#ED4245') // Roșu
                .addFields(
                    { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Canal', value: `${message.channel}`, inline: true },
                    { name: 'Conținut', value: message.content || '*Fără text (ex: doar imagine)*' }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    },

    // 2. LOG PENTRU MESAJE EDITATE
    {
        name: Events.MessageUpdate,
        async execute(oldMessage, newMessage) {
            if (!oldMessage.guild || oldMessage.author?.bot) return;
            if (oldMessage.content === newMessage.content) return; // Daca s-a schimbat doar un embed/link

            const logChannel = oldMessage.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('✏️ Mesaj Editat')
                .setColor('#FEE75C') // Galben
                .addFields(
                    { name: 'Autor', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
                    { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
                    { name: 'Înainte', value: oldMessage.content || '*Gol*' },
                    { name: 'După', value: newMessage.content || '*Gol*' }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
];
