echo
echo "Options: all | snovakow | resume | sudoku | birthday| bounder"
echo

base () {
	local name=$1
	local param=$2
	echo $name
	echo "******"

	npx webpack $param
	echo
}

webpack () {
	local name=$1
	echo $name
	echo "******"

	cd $name
	npx webpack
	cd ".."
	echo
}

for build in "$@"
do
	if [ "$build" = "snovakow" ] ; then base "snovakow" ; fi
	if [ "$build" = "all" ] ; then base "snovakow" --env=clean ; fi
	if [ "$build" = "all" ] || [ "$build" = "resume" ] ; then webpack "resume" ; fi
	if [ "$build" = "all" ] || [ "$build" = "sudoku" ] ; then webpack "sudoku" ; fi
	if [ "$build" = "all" ] || [ "$build" = "birthday" ] ; then webpack "birthday" ; fi
	if [ "$build" = "all" ] || [ "$build" = "bounder" ] ; then webpack "bounder" ; fi
	shift 1;
done
