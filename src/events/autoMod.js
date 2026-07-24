import { Events, PermissionFlagsBits } from 'discord.js';

// Lista de domenii permise (whitelist de link-uri)
const ALLOWED_DOMAINS = ['tenor.com', 'giphy.com', 'youtube.com', 'youtu.be'];

export default {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorăm botii și mesajele din DM
        if (!message.guild || message.author.bot) return;

        // Membrii cu permisiune de Moderare sau Administrator scapă de verificări
        if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        const content = message.content;

        // --------------------------------------------------
        // A. ANTI-LINK & ANTI-INVITE
        // --------------------------------------------------
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        const containsLink = linkRegex.test(content);

        if (containsLink) {
            const isAllowed = ALLOWED_DOMAINS.some(domain => content.includes(domain));
            
            // Daca contine o invitatie de Discord sau un link nepermis
            if (content.includes('discord.gg/') || content.includes('discord.com/invite') || !isAllowed) {
                try {
                    await message.delete();
                    const warnMsg = await message.channel.send(`⚠️ ${message.author}, link-urile nu sunt permise aici!`);
                    setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                    return;
                } catch (err) {
                    console.error('Eroare la stergerea link-ului:', err);
                }
            }
        }

        // --------------------------------------------------
        // B. ANTI-CAPS (Daca peste 70% din mesaj e cu MAJUSCULE)
        // --------------------------------------------------
        if (content.length > 10) {
            const uppercaseChars = content.replace(/[^A-Z]/g, '').length;
            const capsPercentage = (uppercaseChars / content.length) * 100;

            if (capsPercentage > 70) {
                try {
                    await message.delete();
                    const warnMsg = await message.channel.send(`⚠️ ${message.author}, nu mai scrie doar cu majuscule!`);
                    setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                } catch (err) {
                    console.error('Eroare la stergerea mesajului cu CAPS:', err);
                }
            }
        }
    },
};
