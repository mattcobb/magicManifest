#!/bin/bash
find -L "$1" -maxdepth 1 -name "*.js" -exec $(dirname $0)/ibjsmin.sh {} $(dirname $0)/min.tmp "$2" \;
