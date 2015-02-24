#!/bin/bash -x

# $1 parameter: web package name (optional)  if not specified builds for prod

WEB_PACKAGE_NAME="ib";
BUILD_ROOT="/usr/ib/webview/build"
TARGET_DIR="/usr/ib/webview/src/client"
TOOLS_DIR="/usr/ib/webview/tools"

#if [ "$1" = "" ]
#then
#    echo "Please enter in a package name. Usage: ./compilePackageToProd.sh {package_name}";
#    exit 1;
#fi

#generates manifests and copies files to "/usr/ib/webview/build"
sudo /usr/node/bin/node /usr/ib/edge/makeManifests.js

#generates a zipped web assets file ib.zip and places it in /usr/ib/webview/src/client
sudo /usr/node/bin/node ${TOOLS_DIR}/genWebPackage.js --pkgSource ${BUILD_ROOT}/assets --zipFolder ${WEB_PACKAGE_NAME} --pkgTarget ${TARGET_DIR} --versionTag $1

