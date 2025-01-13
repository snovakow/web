const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, '../../live/resume'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'coverletter.html', to: 'coverletter.html' },
				{ from: 'main.css', to: 'main.css' },
				{ from: 'index.html', to: 'index.html' }
			]
		})
	]
};
