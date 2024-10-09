echo
echo "Options: all | snovakow | resume | sudoku | birthday| bounder"
echo

cd ".."

function_name () {
	local name=$1
	local param=$2
	echo $name
	echo "******"

	cd $name
	npx webpack $param
	cd ".."
	echo
}

for build in "$@"
do
	if [ "$build" = "snovakow" ] ; then function_name "snovakow" ; fi
	if [ "$build" = "all" ] ; then function_name "snovakow" --env=clean ; fi
	if [ "$build" = "all" ] || [ "$build" = "resume" ] ; then function_name "resume" ; fi
	if [ "$build" = "all" ] || [ "$build" = "sudoku" ] ; then function_name "sudoku" ; fi
	if [ "$build" = "all" ] || [ "$build" = "birthday" ] ; then function_name "birthday" ; fi
	if [ "$build" = "all" ] || [ "$build" = "bounder" ] ; then function_name "bounder" ; fi
	shift 1;
done
