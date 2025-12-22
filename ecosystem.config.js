module.exports = {
  apps: [
    {
      name: "sep-discord-bot",
      script: "src/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
