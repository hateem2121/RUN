const { getStorage } = require('./server/lib/storage-singleton.js');

async function test() {
  try {
    const storage = getStorage();
    console.log('Testing getProductBySlug...');
    
    const result = await storage.getProductBySlug('relaxed-fit-performance-t-shirt');
    console.log('Result type:', typeof result);
    console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500));
    
    if (result && typeof result === 'object' && 'ok' in result) {
      console.log('Result has "ok" property:', result.ok);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
