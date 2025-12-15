import { db } from "../server/db.js";
import { users } from "../shared/schema.js";

async function checkUsers() {
    const allUsers = await db
        .select({
            id: users.id,
            email: users.email,
            isAdmin: users.isAdmin,
            createdAt: users.createdAt
        })
        .from(users)
        .orderBy(users.createdAt);

    console.log('Users in database:');
    allUsers.forEach(u => console.log(`  ${u.email} - Admin: ${u.isAdmin} - Created: ${u.createdAt?.toISOString()}`));

    if (allUsers.length === 0) {
        console.log('\n❌ No users found in database. You need to log in first via Google OAuth.');
    } else {
        const adminUsers = allUsers.filter(u => u.isAdmin);
        if (adminUsers.length === 0) {
            console.log('\n⚠️ No admin users found. You need to promote a user to admin.');
            console.log('\nTo promote a user, update the email in scripts/promote-admin.ts and run:');
            console.log('  npx tsx scripts/promote-admin.ts');
        } else {
            console.log('\n✅ Admin users:', adminUsers.map(u => u.email).join(', '));
        }
    }
}

checkUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
