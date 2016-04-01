#!/bin/bash

find ../lib ../src -name '*.js' | xargs java -jar compiler/compiler.jar --language_in ECMASCRIPT5_STRICT --js_output_file ../build/med3d.min.js