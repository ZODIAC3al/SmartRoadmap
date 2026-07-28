const path = require('path');
const fs = require('fs');

console.log("Current working dir:", process.cwd());
const distPath = path.resolve(__dirname, '../apps/api/dist');
console.log("Dist path:", distPath);

try {
  console.log("Files in dist:", fs.readdirSync(distPath));
} catch (e) {
  console.error("Error reading dist:", e);
}

try {
  console.log("Requiring app.service...");
  const service = require('../apps/api/dist/app.service');
  console.log("Success app.service:", service);
} catch (e) {
  console.error("Error requiring app.service:", e);
}

try {
  console.log("Requiring app.controller...");
  const controller = require('../apps/api/dist/app.controller');
  console.log("Success app.controller:", controller);
} catch (e) {
  console.error("Error requiring app.controller:", e);
}
