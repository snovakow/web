const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = env => {
	return {
		mode: "production",
		entry: './snovakow/main.js',
		output: {
			filename: './snovakow/main.js',
			path: path.resolve(__dirname, '../live_offline'),
			chunkFilename: './snovakow/[chunkhash].js',
			// clean: env.clean ? true : false,
			clean: true,
			publicPath: ''
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{ from: 'snovakow/sudoku.html', to: 'snovakow/sudoku.html' },
					{ from: 'favicon.ico', to: 'favicon.ico' },
					{ from: 'index.html', to: 'index.html' }
				]
			})
		]
	}
};