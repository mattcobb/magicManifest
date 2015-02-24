require.paths.unshift( __dirname + '/../../common');

var uuid = require('node-uuid');

var webPackageId = uuid();
var platConf = require("ib_platform_conf.js").config;
var cloudAddress = require('cloudAddress.js');


var fs = require("fs");
var cp = require('child_process');

var argv = require('optimist').argv; 
   
if(!argv.pkgSource || !argv.pkgTarget || !argv.zipFolder  ){
   throw new Error('Missing arg: --pkgSource [path of source dir e.g.: /usr/ib/client/assets] ' + 
                   '--pkgTarget [path of target zip file, e.g: /usr/ib/webview/src/client]  --zipFoler [target folder e.g., ib]');
   process.exit(1);
}

var versionTag = (argv.versionTag && typeof argv.versionTag === 'string') ? (argv.versionTag) : 'prod';
var packageName = argv.zipFolder + '_' + webPackageId + '.zip';
var out = {"buildId": webPackageId};

var cleanUp = function(){
   cp.exec(('cd ' + argv.pkgTarget + '; rm ' + argv.zipFolder + '.json ; rm ' + argv.zipFolder + '.zip'), function(error, stdout, stderr) {
            if((error != null)  || stderr ){
               console.log('Error cleaning up ' + argv.pkgTarget);
               if (error != null) console.log(error.stack);
               if (stderr) console.log(stderr);
            }          
          }); 
}


var executeZip = function(){
   fs.writeFile((argv.pkgSource  + '/' + argv.zipFolder  + '/' + platConf.webPackageVersionFile), webPackageId, function(err) {
       if(err) {
           var strErr = "error when writing " + platConf.webPackageVersionFile + "  " + err;
            cleanUp();
            throw new Error(strErr);
            process.exit(1);
       }else{
          
          cp.exec('cd ' + argv.pkgSource  +   '; zip -r ' + packageName + ' ' + argv.zipFolder + 
                  '; mv ' + packageName + ' ' + argv.pkgTarget,  function(error, stdout, stderr) {
            if((error != null)  || stderr ){
               console.log('Error zipping file ' + argv.pkgTarget);
               if (error != null) console.log(error.stack);
               if (stderr) console.log(stderr);
               cleanUp();
            } else {
               if(versionTag == 'prod') {
                  createLinksForOldSetup(argv.zipFolder);
                  
                  for (var i=0; i < cloudAddress.ibCloudConfiguration.supportedApps.length; i++){         
                     createLinksForOldSetup(cloudAddress.ibCloudConfiguration.supportedApps[i]);       
                  }
                  
               }else{
                  createLinksForOldSetup(versionTag);
               }
            }
          });
       }
   });
}
/*
  e.g., defaultPackageZipPath == /usr/ib/webview/src/client/ib.zip
*/

var createLinksForOldSetup = function(zipFolder) {
   var defaultPackageZipPath = argv.pkgTarget + '/' + zipFolder + '.zip';
   //var defaultPackageJSONPath = argv.pkgTarget + '/' + zipFolder + '.json';
   
   fs.unlink(defaultPackageZipPath, function(zipDelErr) {
      if(zipDelErr && zipDelErr.code != 'ENOENT') {
         console.log('There was a delete error: ' + zipDelErr.message);
         process.exit(1);
      }
      
      fs.symlink(argv.pkgTarget + '/' + packageName, defaultPackageZipPath, function(zipSymErr) {
         if(zipSymErr) {
            console.log('There was a delete error: ' + zipSymErr.message);
            process.exit(1);
         }
         
         // not needed -Ari
         /*
         
         fs.unlink(defaultPackageJSONPath, function(jsonDelErr) {
            if(jsonDelErr && jsonDelErr.code != 'ENOENT') {
               console.log('There was a delete error: ' + jsonDelErr.message);
               process.exit(1);
            }
            
            fs.symlink(argv.pkgTarget + '/' + versionTag + zipFolder + '.json', defaultPackageJSONPath, function(jsonSymErr) {
               if(jsonSymErr) {
                  console.log('There was a delete error: ' + jsonSymErr.message);
                  process.exit(1);
               }
            });
         });
         
         */
         
      });
   });
}

fs.writeFileSync( argv.pkgTarget + '/' + versionTag  + '.' + argv.zipFolder + '.json', JSON.stringify(out), 'utf8' );

if(versionTag == 'prod') {
   for (var i=0; i < cloudAddress.ibCloudConfiguration.supportedApps.length; i++){    
      fs.writeFileSync( argv.pkgTarget + '/' + cloudAddress.ibCloudConfiguration.supportedApps[i] + '.' + argv.zipFolder + '.json', JSON.stringify(out), 'utf8' );
   }
}

executeZip();


