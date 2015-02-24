#!/bin/bash

# $1 parameter: web package name (optional)  $2 parameter: ant test vs. realease (optional)
COMMON_KEYSTORE_DIR="/usr/ib/webview/tools/keystore"
APP_NAME="XWish"
TOOLS_DIR="/usr/ib/webview/tools"
CLIENT_ROOT="/usr/ib/client"
TARGET_DIR="/usr/ib/webview/src/client"
ANT_CMD="release"
BUILD_ID="update-buildid"

${TOOLS_DIR}/compilePackage.sh $1

# NOTE: the first param was already reserved for package prefix so commenting out 
# the ant overide directive below
#if [ -n "$1" ] 
#then
#ANT_CMD=$1
#fi

#command built the build.xml file for ant
#-t is target id, run "/usr/android/tools/android list targets" for targets
#/usr/android/tools/android update project -t 7 -p "/usr/ib/client" -n "${APP_NAME}"

# copy the debug keystore so when Eclipse builds in debug,
# all devs are using the same debug key.  Building in release
# mode does not use this key, it uses the key specified in ant.properties  
sudo cp ${COMMON_KEYSTORE_DIR}/debug.keystore ~/.android/.

TMP=$PWD
cd $CLIENT_ROOT
# generate a unique build id that gets incorporated in strings.xml and persisted in local file
ant $BUILD_ID
ant increase-version -Dstage=$ANT_CMD
ant clean
ant $ANT_CMD
if [ "$ANT_CMD" = "release" ]
then
ant save-obfuscation-map
fi

cd $TMP

cp ${CLIENT_ROOT}/bin/${APP_NAME}-${ANT_CMD}.apk ${TARGET_DIR}/${APP_NAME}.apk
mv ${CLIENT_ROOT}/${APP_NAME}.json ${TARGET_DIR}/${APP_NAME}.json
