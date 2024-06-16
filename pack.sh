player="echo '\n***\npack player\n***\n';npx webpack"
presenter="echo '\n***\npack presenter\n***\n';npx webpack --config webpack.config.presenter.js"

cd ".."

echo
echo "resume"
echo "******"
echo

cd "resume"
npx webpack
cd ".."

echo
echo "sudoku"
echo "******"
echo

cd "sudoku"
npx webpack
cd ".."

echo
echo "three"
echo "*****"
echo

cd "three"
npx webpack
cd ".."

echo
echo "copy index.html favicon.ico"
echo "****"
echo

cp "./snovakow/index.html" "../live/index.html"
cp "./snovakow/favicon.ico" "../live/favicon.ico"

# 	rm -rf "./dist"
# 	mkdir "dist"
# 	cp -r "../../../repo/jkxr-cms-api-v5/public/player" "./dist/player"
# 	cp "./index.html" "./dist/index.html"
