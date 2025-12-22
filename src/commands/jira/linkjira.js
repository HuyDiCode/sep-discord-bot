const { SlashCommandBuilder } = require('discord.js');
const { setJiraEmail } = require('../../utils/userMapping');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('linkjira')
		.setDescription('Link your Discord account to your Jira email')
		.addStringOption(option =>
			option.setName('email')
				.setDescription('Your Jira account email')
				.setRequired(true)),
	async execute(interaction) {
		const email = interaction.options.getString('email');
		const discordId = interaction.user.id;

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return interaction.reply({ content: '❌ Invalid email format.', ephemeral: true });
		}

		setJiraEmail(discordId, email);

		await interaction.reply({ 
			content: `✅ Successfully linked your Discord account to Jira email: **${email}**`, 
			ephemeral: true 
		});
	},
};
