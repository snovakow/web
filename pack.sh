player="echo '\n***\npack player\n***\n';npx webpack"
presenter="echo '\n***\npack presenter\n***\n';npx webpack --config webpack.config.presenter.js"

echo
echo "Options: all | resume | sudoku | sudokudev | birthday| bounder | home | lib"
echo

cd ".."

for build in "$@"
do
	if [ "$build" = "all" ] || [ "$build" = "resume" ] ; then
		echo "resume"
		echo "******"

		cd "resume"
		npx webpack
		cd ".."
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "sudoku" ] ; then
		echo "sudoku"
		echo "******"

		cd "sudoku"
		npx webpack
		cd ".."
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "sudokudev" ] ; then
		echo "sudokudev"
		echo "******"

		cd "sudokudev"
		npx webpack
		cd ".."
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "birthday" ] ; then
		echo "birthday"
		echo "******"

		cd "birthday"
		npx webpack
		cd ".."
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "bounder" ] ; then
		echo "bounder"
		echo "*******"

		cd "bounder"
		npx webpack
		cd ".."
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "home" ] ; then
		echo "home: copy index.html favicon.ico"
		echo "****"

		cp "./snovakow/index.html" "../live/index.html"
		cp "./snovakow/favicon.ico" "../live/favicon.ico"
		echo
	fi
	if [ "$build" = "all" ] || [ "$build" = "lib" ] ; then
		echo "lib: replace sudokulib/sudoku.php"
		echo "****"

		rm -r "../live/sudokulib/"
		mkdir "../live/sudokulib/"
		cp "./sudokulib/sudoku.php" "../live/sudokulib/sudoku.php"
		echo
	fi
	shift 1;
done
