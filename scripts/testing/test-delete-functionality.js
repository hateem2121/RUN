// Test script to verify delete functionality

async function testDeleteFunctionality() {
	try {
		const productsResponse = await fetch(
			"http://localhost:5000/api/admin/products/initial-data",
		);
		const data = await productsResponse.json();
		const products = data.products?.data || [];
		products.forEach((p, i) => {});

		if (products.length === 0) {
			return;
		}

		// 2. Test the DELETE endpoint (without actually deleting)
		const testProductId = products[0].id;

		// Make a HEAD request to check if the endpoint exists
		const deleteCheckResponse = await fetch(
			`http://localhost:5000/api/products/${testProductId}`,
			{
				method: "HEAD",
			},
		);

		if (deleteCheckResponse.ok || deleteCheckResponse.status === 405) {
		} else {
		}
	} catch (error) {}
}

// Run the test
testDeleteFunctionality();
