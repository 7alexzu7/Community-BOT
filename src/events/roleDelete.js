import { AuditLogEvent } from 'discord.js';

const userRoleActions = new Map();

export default {
    name: 'roleDelete',
    async execute(role) {
        const guild = role.guild;
        if (!guild) return;

        // Căutăm în Audit Log cine a șters rolul
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleDelete,
        }).catch(() => null);

        if (!fetchedLogs) return;
        const deletionLog = fetchedLogs.entries.first();
        if (!deletionLog) return;

        const { executor } = deletionLog;
        if (executor.bot) return; // Ignorăm alți boți oficiali

        const now = Date.now();
        const userData = userRoleActions.get(executor.id) || { count: 0, time: now };

        // Resetăm contorul dacă au trecut mai mult de 10 secunde
        if (now - userData.time > 10000) {
            userData.count = 1;
            userData.time = now;
        } else {
            userData.count++;
        }

        userRoleActions.set(executor.id, userData);

        // Dacă șterge mai mult de 2 roluri în 10 secunde -> BAN instant
        if (userData.count >= 2) {
            try {
                const member = await guild.members.fetch(executor.id);
                if (member && member.bannable) {
                    await member.ban({ reason: 'CBOT Anti-Nuke: Ștergere masivă de roluri detectată.' });
                    console.log(`[ANTI-NUKE ROLES] ${executor.tag} a primit ban automat pentru mass-role delete.`);
                }
            } catch (err) {
                console.error('Eroare Anti-Nuke Role:', err);
            }
        }
    }
};
