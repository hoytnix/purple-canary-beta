
import { getScanRecords } from './services/firestoreService';
import { getOrCreateIdentity } from './services/identity';

async function verify() {
  const email = getOrCreateIdentity();
  console.log('Verifying scans for:', email);
  const records = await getScanRecords(email);
  console.log('Records found:', records.length);
  if (records.length > 0) {
    console.log('First record:', records[0]);
  }
}

verify().catch(console.error);
