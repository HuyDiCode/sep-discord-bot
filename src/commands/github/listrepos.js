const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRepos } = require('../../utils/repoManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('listrepos')
		.setDescription('List all watched GitHub repositories'),
	async execute(interaction) {
        const repos = getRepos();

        if (repos.length === 0) {
            return interaction.reply('📭 No repositories are currently being watched.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x24292f)
            .setTitle('Watched GitHub Repositories')
            .setDescription(repos.map(r => `• **${r.owner}/${r.name}** → <#${r.channelId}>`).join('\n'))
            .setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
