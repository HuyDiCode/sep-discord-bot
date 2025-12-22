const { SlashCommandBuilder } = require('discord.js');
const { removeRepo } = require('../../utils/repoManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removerepo')
		.setDescription('Stop watching a GitHub repository')
		.addStringOption(option =>
			option.setName('owner')
				.setDescription('The owner of the repository')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the repository')
				.setRequired(true)),
	async execute(interaction) {
		const owner = interaction.options.getString('owner');
		const name = interaction.options.getString('name');

        const success = removeRepo(owner, name);

        if (success) {
            await interaction.reply({ 
                content: `🗑️ Successfully removed **${owner}/${name}** from watch list.`, 
            });
        } else {
            await interaction.reply({ 
                content: `⚠️ Repository **${owner}/${name}** was not found in the watch list.`, 
                ephemeral: true 
            });
        }
	},
};
