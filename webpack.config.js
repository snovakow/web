const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: '[chunkhash].js',
		path: path.resolve(__dirname, './build'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: "snovakow"
		})
	],
};
