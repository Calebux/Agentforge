// pm2 ecosystem file — used by scripts/start.js and for manual pm2 management
// OpenClaw gateway args: "gateway" is the subcommand that starts the HTTP gateway.
// Adjust if the correct subcommand differs on your install.
module.exports = {
  apps: [
    {
      name: 'openclaw-gateway',
      // If OPENCLAW_BIN is "node /path/to/index.js", strip "node " and set interpreter
      script: (process.env.OPENCLAW_BIN ?? 'openclaw').startsWith('node ')
        ? (process.env.OPENCLAW_BIN ?? '').slice(5).trim()
        : (process.env.OPENCLAW_BIN ?? 'openclaw'),
      interpreter: (process.env.OPENCLAW_BIN ?? '').startsWith('node ') ? 'node' : undefined,
      args: 'gateway',
      cwd: (process.env.OPENCLAW_STATE_DIR ?? (process.env.HOME + '/.clawdbot')).replace(
        '~',
        process.env.HOME ?? ''
      ),
      autorestart: true,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
