
import { db } from '../server/db.js';
import { products, categories, navigationItems } from '../shared/schema.js';

async function checkData() {
    try {
        const productsCount = await db.select().from(products);
        const categoriesCount = await db.select().from(categories);
        const navItemsCount = await db.select().from(navigationItems);

        console.log('Products count:', productsCount.length);
        console.log('Categories count:', categoriesCount.length);
        console.log('Navigation Items count:', navItemsCount.length);

        if (productsCount.length > 0) {
            console.log('Sample Product:', JSON.stringify(productsCount[0], null, 2));
        }
        if (navItemsCount.length > 0) {
            console.log('Sample Nav Item:', JSON.stringify(navItemsCount[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkData();
