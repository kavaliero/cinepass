#!/usr/bin/env node
const port = process.env.CINEPASS_PORT ?? '8080';
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const cyan = (s) => (useColor ? `\x1b[36m${s}\x1b[0m` : s);
console.log(`\n  Web : ${cyan(`http://localhost:${port}`)}`);
console.log(`  API : ${cyan(`http://localhost:${port}/api/health`)}\n`);
