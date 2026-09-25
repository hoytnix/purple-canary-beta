import 'dotenv/config';
import { dbService } from '../services/dbService';
import { db } from '../services/turso';
import { users } from '../services/schema';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  await dbService.init();

  if (command === 'list') {
    const all = await dbService.getAllUsers();
    console.log(`\n=== REGISTERED TURSO DB USERS (${all.length}) ===`);
    all.forEach((u, i) => {
      console.log(`[${i + 1}] PubKey: ${u.publicKey.substring(0, 32)}...`);
      console.log(`    Username: ${u.username} | Tier: [${u.tier}] | Access: ${u.access}`);
      console.log(`    Created: ${u.createdAt} | LastLogin: ${u.lastLogin}`);
    });
    console.log('================================================\n');
    return;
  }

  if (command === 'set') {
    const pubKey = args[1];
    const newTier = args[2] || 'admin';

    if (!pubKey) {
      console.error('Usage: npx tsx scripts/setAdminTier.ts set <publicKey> [tier]');
      process.exit(1);
    }

    const existing = await dbService.getUser(pubKey);
    if (!existing) {
      console.error(`User with public key ${pubKey.substring(0, 32)}... not found.`);
      process.exit(1);
    }

    await dbService.updateUserTier(pubKey, newTier);
    console.log(`Successfully updated user ${pubKey.substring(0, 32)}... to tier [${newTier}]`);
    return;
  }

  if (command === 'promote-first') {
    const all = await dbService.getAllUsers();
    if (all.length === 0) {
      console.log('No users found in TursoDB to promote.');
      return;
    }
    const target = all[0];
    await dbService.updateUserTier(target.publicKey, 'admin');
    console.log(`Promoted first user (${target.username} / ${target.publicKey.substring(0, 24)}...) to tier [admin]!`);
    return;
  }

  console.log(`
Usage:
  npx tsx scripts/setAdminTier.ts list
  npx tsx scripts/setAdminTier.ts set <publicKey> <tier>
  npx tsx scripts/setAdminTier.ts promote-first
  `);
}

main().catch(console.error);
