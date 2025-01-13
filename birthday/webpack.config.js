const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, '../../live/rayapapaya'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'main.css', to: 'main.css' },
				{ from: 'index.html', to: 'index.html' }
			]
		})
	]
};
