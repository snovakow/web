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
	# if [ "$build" = "all" ] ; then base "snovakow" --env=clean ; fi
	if [ "$build" = "all" ] || [ "$build" = "snovakow" ] ; then base "snovakow" ; fi
	if [ "$build" = "all" ] || [ "$build" = "resume" ] ; then webpack "resume" ; fi
	if [ "$build" = "all" ] || [ "$build" = "sudoku" ] ; then webpack "sudoku" ; fi
	if [ "$build" = "all" ] || [ "$build" = "birthday" ] ; then webpack "birthday" ; fi
	if [ "$build" = "all" ] || [ "$build" = "bounder" ] ; then webpack "bounder" ; fi
	if [ "$build" = "all" ] ; then
		echo "Replace live with live_offline"
		echo "******"
		echo "rm -rf ../live"
		rm -rf ../live
		echo "mv ../live_offline ../live"
		mv ../live_offline ../live

		echo
	fi
	shift 1;
done
