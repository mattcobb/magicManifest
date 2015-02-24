#!/bin/bash -x

cd ../src/client;
if [ ! -f "${1}.ib.json" ];
then
    echo "File ${1}.ib.json not found!";
    exit 1;
fi

HOST="192.168.5.20";
BUILD_NUM=`cat "${1}.ib.json" | sed 's/.*\"buildId\":\"\([^\"]*\)\".*/\1/'`;
CLIENT_PATH=/usr/ib/webview/src/client;
BUILD_PKG_NAME=ib_${BUILD_NUM}.zip;

scp "${BUILD_PKG_NAME}" ${HOST}:${CLIENT_PATH}
scp "${1}.ib.json" ${HOST}:${CLIENT_PATH}

if [ $1 = "prod" ];
then
    ssh ${HOST} "rm ${CLIENT_PATH}/ib.zip; ln -s ${CLIENT_PATH}/${BUILD_PKG_NAME} ${CLIENT_PATH}/ib.zip"
fi

