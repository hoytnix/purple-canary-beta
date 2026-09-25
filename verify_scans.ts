
import { getScanRecords } from './services/scanService';
import { getOrCreateIdentity } from './services/identity';

async function verify() {
  const { publicKey } = await getOrCreateIdentity();
  console.log('Verifying scans for:', publicKey);
  const records = await getScanRecords(publicKey);
  console.log('Records found:', records.length);
  if (records.length > 0) {
    console.log('First record:', records[0]);
  }
}

verify().catch(console.error);
