const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { addRepo } = require('../../utils/repoManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addrepo')
		.setDescription('Add a GitHub repository to watch')
		.addStringOption(option =>
			option.setName('owner')
				.setDescription('The owner of the repository (user or org)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the repository')
				.setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send notifications to (default: current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)),
	async execute(interaction) {
		const owner = interaction.options.getString('owner');
		const name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const success = addRepo(owner, name, channel.id);

        if (success) {
            await interaction.reply({ 
                content: `✅ Successfully added **${owner}/${name}** to watch list. Notifications will be sent to ${channel}.`, 
            });
        } else {
            await interaction.reply({ 
                content: `⚠️ Repository **${owner}/${name}** is already being watched.`, 
                ephemeral: true 
            });
        }
	},
};
