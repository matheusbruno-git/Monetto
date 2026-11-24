const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const container = process.env.CONTAINER || "Monetto-MySQL";
const database = process.env.DB_NAME || "monetto";
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "mlsolutions";
const projectRoot = path.resolve(__dirname, "..");

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  console.error("ERROR: DB_NAME contains unsupported characters.");
  process.exit(1);
}

function docker(args, options = {}) {
  const result = spawnSync("docker", args, {
    cwd: projectRoot,
    encoding: options.input ? undefined : "utf8",
    input: options.input,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const message = String(result.stderr || result.stdout || "").trim();
    throw new Error(message || `docker exited with code ${result.status}`);
  }
  return result.stdout ? String(result.stdout).trim() : "";
}

function mysql(args, options) {
  return docker([
    "exec",
    ...(options?.input ? ["-i"] : []),
    container,
    "mysql",
    `-u${user}`,
    `-p${password}`,
    ...args,
  ], options);
}

try {
  mysql(["-N", "-s", "-e", "SELECT 1;"]);
  const found = mysql([
    "-N",
    "-s",
    "-e",
    `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='${database}';`,
  ]);

  if (found.split(/\r?\n/).includes(database)) {
    console.log("Database already exists; keeping its data unchanged.");
    process.exit(0);
  }

  console.log(`Database ${database} does not exist. Creating it...`);
  mysql(["-e", `CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`]);

  for (const filename of ["database.sql", "test_inserts.sql"]) {
    const filepath = path.join(projectRoot, filename);
    if (!fs.existsSync(filepath)) throw new Error(`${filename} not found in the project root.`);
    console.log(`Importing ${filename}...`);
    mysql([database], { input: fs.readFileSync(filepath) });
  }

  console.log("Database initialized successfully.");
} catch (error) {
  console.error("ERROR: Database initialization failed:");
  console.error(error.message || error);
  process.exit(1);
}
