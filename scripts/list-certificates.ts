import { db } from '../server/db.js';
import { certificates } from '../shared/schema.js';

async function listCertificates() {
  try {
    const allCerts = await db.select().from(certificates);
    console.log('📜 Available Certificates:\n');
    allCerts.forEach(cert => {
      console.log(`[${cert.id}] ${cert.name} (${cert.issuingBody})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listCertificates();
