#!/bin/bash -x

TOOLS_DIR="/usr/ib/webview/tools"

${TOOLS_DIR}/compilePackage.sh $1
${TOOLS_DIR}/copyPackageToProd.sh $1
