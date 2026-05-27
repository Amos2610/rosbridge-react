import os from "node:os";
import { spawn } from "node:child_process";

const mode = process.argv[2] === "preview" ? "preview" : "dev";
const portArg = mode === "preview" ? ["--port", "4173"] : [];
const args = [mode, "--host", ...portArg];

const child = spawn("npx", ["vite", ...args], {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let qrPrinted = false;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

async function printQrIfReady(text) {
  if (qrPrinted) return;
  if (!text.includes("Local:") && !text.includes("Network:")) return;

  const ip = getLocalIp();
  const port = mode === "preview" ? "4173" : "5173";
  const url = `http://${ip}:${port}/`;

  console.log(`\n[LAN URL] ${url}`);

  try {
    const qrcode = await import("qrcode-terminal");
    qrcode.default.generate(url, { small: true });
    qrPrinted = true;
  } catch {
    console.log("[QR] qrcode-terminal が未インストールのためURLのみ表示します");
    console.log("      npm i -D qrcode-terminal");
    qrPrinted = true;
  }
}

function handleChunk(chunk, stream) {
  const text = chunk.toString();
  stream.write(text);
  void printQrIfReady(text);
}

child.stdout.on("data", (chunk) => handleChunk(chunk, process.stdout));
child.stderr.on("data", (chunk) => handleChunk(chunk, process.stderr));

child.on("close", (code) => {
  process.exit(code ?? 0);
});
