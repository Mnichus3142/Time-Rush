/** @type {import('./$types').PageServerLoad} */
import { cookies } from "@sveltejs/kit";
import pkg from "pg";
const { Client } = pkg;
import { redirect } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";

export async function load({ cookies }) {
  // Get cookie value
  const cookie_value = cookies.get("sessionId");

  // Get connection params
  const filePath = path.resolve("src/connectionParameters.json");
  const fileContent = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(fileContent);

  // Create client
  const client = new Client({
    user: data.user,
    host: data.host,
    database: data.database,
    password: data.password,
    port: data.port,
    ssl:
      data.ssl && data.ssl.ca
        ? {
            ca: data.ssl.ca,
          }
        : false,
  });

  try {
    if (cookie_value === undefined) {
      throw redirect(302, "/");
    }

    await client.connect();
    const result = await client.query(
      "SELECT * FROM cookies WHERE cookie_value = $1",
      [cookie_value],
    );

    if (result.rowCount === 0) {
      throw redirect(302, "/");
    }
  } finally {
    await client.end();
  }
}