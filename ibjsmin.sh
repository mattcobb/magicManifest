#!/bin/bash
echo pwd
echo >> "$2"
echo "/*" Include: "$1" "*/" >> "$2"

if [ "$3" = "concat" ]; then
   cat "$1" >> "$2"
else 
   $(dirname $0)/jsmindir/jsmin < "$1" >> "$2"
fi
