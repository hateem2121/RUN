import fetch from 'node-fetch';

async function checkApi() {
  try {
    console.log('🔍 Fetching from http://localhost:5001/api/accessories...\n');
    
    const response = await fetch('http://localhost:5001/api/accessories');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ API returned ${data.length} accessories:\n`);
    
    data.forEach((acc: any, index: number) => {
      console.log(`${index + 1}. ID: ${acc.id}`);
      console.log(`   Name: ${acc.name}`);
      console.log(`   Category: ${acc.category}`);
      console.log(`   Active: ${acc.isActive}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error fetching API:', error);
  }
}

await checkApi();
