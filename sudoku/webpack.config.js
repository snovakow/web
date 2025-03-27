const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "production",
	entry: './main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, '../../live_offline/sudoku'),
		chunkFilename: '[chunkhash].js',
		clean: true,
		publicPath: ''
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'icons', to: 'icons' },
				{ from: '../sudokulib/generate.html', to: '../sudokulib/generate.html' },
				{ from: '../sudokulib/update.html', to: '../sudokulib/update.html' },
				{ from: '../sudokulib/generate.php', to: '../sudokulib/generate.php' },
				{ from: '../sudokulib/update.php', to: '../sudokulib/update.php' },
				{ from: '../sudokulib/updateFeed.php', to: '../sudokulib/updateFeed.php' },
				{ from: '../sudokulib/sudoku.php', to: '../sudokulib/sudoku.php' },
				{ from: '../sudokulib/stats.html', to: '../sudokulib/stats.html' },
				{ from: '../sudokulib/statsFeed.php', to: '../sudokulib/statsFeed.php' },
				{ from: '../sudokulib/tables.php', to: '../sudokulib/tables.php' },
				{ from: '../sudokulib/Grid.js', to: '../sudokulib/Grid.js' },
				{ from: '../sudokulib/generator.js', to: '../sudokulib/generator.js' },
				{ from: '../sudokulib/solver.js', to: '../sudokulib/solver.js' },
				{ from: '../sudokulib/process.js', to: '../sudokulib/process.js' },
				{ from: '../sudokulib/worker_generator.js', to: '../sudokulib/worker_generator.js' },

				{ from: 'info.html', to: 'info.html' },
				{ from: 'about.html', to: 'about.html' },
				{ from: 'index.html', to: 'index.html' }
			]
		})
	]
};
