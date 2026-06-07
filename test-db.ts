// test-db.js

require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DIRECT_URL,
});

async function main() {
    await client.connect();

    const result = await client.query("SELECT NOW();");

    console.log(result.rows);

    await client.end();
}

main();