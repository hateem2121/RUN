import { db } from "../server/db.js";
import { users } from "../shared/schema.js";

async function checkUsers() {
	const allUsers = await db
		.select({
			id: users.id,
			email: users.email,
			isAdmin: users.isAdmin,
			createdAt: users.createdAt,
		})
		.from(users)
		.orderBy(users.createdAt);
	allUsers.forEach((u) => {});

	if (allUsers.length === 0) {
	} else {
		const adminUsers = allUsers.filter((u) => u.isAdmin);
		if (adminUsers.length === 0) {
		} else {
		}
	}
}

checkUsers()
	.then(() => process.exit(0))
	.catch((error) => {
		process.exit(1);
	});
