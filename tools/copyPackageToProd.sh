#!/bin/bash -x

cd ../src/client;
if [ ! -f "${1}.ib.json" ];
then
    echo "File ${1}.ib.json not found!";
    exit 1;
fi

BUILD_NUM=`cat "${1}.ib.json" | sed 's/.*\"buildId\":\"\([^\"]*\)\".*/\1/'`;

scp "ib_${BUILD_NUM}.zip" 192.168.3.20:/usr/ib/webview/src/client
scp "${1}.ib.json" 192.168.3.20:/usr/ib/webview/src/client

