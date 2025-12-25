import fetch from "node-fetch";

async function checkApi() {
  try {
    const response = await fetch("http://localhost:5001/api/accessories");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    data.forEach((acc: any, index: number) => {});
  } catch (error) {}
}

await checkApi();
