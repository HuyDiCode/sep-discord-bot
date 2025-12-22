const { SlashCommandBuilder } = require('discord.js');
const { setGithubUsername } = require('../../utils/userMapping');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('linkgithub')
		.setDescription('Link your Discord account to your GitHub username')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('Your GitHub username')
				.setRequired(true)),
	async execute(interaction) {
		const username = interaction.options.getString('username');
		const discordId = interaction.user.id;

		setGithubUsername(discordId, username);

		await interaction.reply({ 
			content: `✅ Successfully linked your Discord account to GitHub user: **${username}**`, 
			ephemeral: true 
		});
	},
};
