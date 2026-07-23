import { AuditLogEvent } from 'discord.js';

const userActions = new Map();

export default {
    name: 'channelDelete',
    async execute(channel) {
        const guild = channel.guild;
        if (!guild) return;

        // Căutăm în Audit Log cine a șters canalul
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete,
        }).catch(() => null);

        if (!fetchedLogs) return;
        const deletionLog = fetchedLogs.entries.first();
        if (!deletionLog) return;

        const { executor } = deletionLog;
        if (executor.bot) return; // Ignorăm acțiunile altor boți

        const now = Date.now();
        const userData = userActions.get(executor.id) || { count: 0, time: now };

        // Dacă au trecut mai mult de 10 secunde, resetează contorul
        if (now - userData.time > 10000) {
            userData.count = 1;
            userData.time = now;
        } else {
            userData.count++;
        }

        userActions.set(executor.id, userData);

        // Dacă cineva șterge mai mult de 2 canale în 10 secunde -> BAN instant
        if (userData.count >= 2) {
            try {
                const member = await guild.members.fetch(executor.id);
                if (member && member.bannable) {
                    await member.ban({ reason: 'CBOT Anti-Nuke: Ștergere masivă de canale detectată.' });
                    console.log(`[ANTI-NUKE] ${executor.tag} a primit ban automat.`);
                }
            } catch (err) {
                console.error('Eroare Anti-Nuke:', err);
            }
        }
    }
};
