#!/bin/bash

cd "$(dirname "$0")"

sources=$(cat sources)
outputdir=../build/
outputdebug=$outputdir"med3d.debug.js"
outputmin=$outputdir"med3d.min.js"


echo '' > $outputdebug
echo '' > $outputmin
for f in $sources; do
	cat ../$f >> $outputdebug
done
java -jar compiler/compiler.jar --language_in ECMASCRIPT6_STRICT --js $outputdebug --language_out ES5_STRICT --js_output_file $outputmin
