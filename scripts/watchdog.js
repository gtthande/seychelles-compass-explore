#!/usr/bin/env node

const { exec } = require("child_process");

function runDevServer() {
  console.log("🚀 Starting Vite dev server...");

  const server = exec("npm run vite", { shell: true });

  server.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  server.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  server.on("close", (code) => {
    console.log(`⚠️ Dev server exited with code ${code}. Restarting in 3s...`);
    setTimeout(runDevServer, 3000);
  });
}

// Kill any existing process on port 5173
exec("for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /PID %a /F", 
  () => {
    runDevServer();
  }
);
