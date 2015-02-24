/*
 * Automatically update HTML5 Manifests and minified source
 */
require.paths.unshift( __dirname + '/../../extern/mustache/lib');

exports.check = check;
exports.initialize = initialize;
exports.forceUpdateAll = forceUpdateAll;
exports.forceUpdate = forceUpdate;

var fs = require('fs');
var manifestConfig = require('magicManifestsConfig.js').magicManifestsConfig;
var mustache = require('mustache.js');
var _ = require('underscore');

function incrementManifestVersion(cfg)
{
    var readStr;
    var version;
    var versionStr;

    // Read version file
    try {
       readStr = fs.readFileSync(cfg.targetDir + '/' + cfg.versionFile, 'utf8');
    } catch (readException) {
        console.log("incrementManifestVersion: Could not read manifest version fiile. " + readException.message);
        return null;
    }

    // Split by dot
    version = readStr.split('.');

    // bump build version
    version[3] = parseInt(version[3]) + 1;
    versionStr = version.join('.');

    // write version file
    try {
        fs.writeFileSync(cfg.targetDir + '/' + cfg.versionFile, versionStr, 'utf8');
    } catch (writeException) {
        console.log('incrementManifest: writing ' + cfg.targetDir + '/' + cfg.versionFile + ' returned ' +
            writeException.message);
        return null;
    }
    return versionStr;
}

function findFiles(cfg, dir, dirFileList)
{
   var fileStat;
   var fileList;
   var thisDir = cfg.targetDir + '/' + dir;

    try {
       fileList = fs.readdirSync(thisDir);
       for(var iFile = 0; iFile < fileList.length; iFile++)
       {
           try
           {
               fileStat = fs.statSync(thisDir + '/' + fileList[iFile]);
               if(fileStat.isFile() && fileList[iFile].indexOf('.') != 0)
               {
                  dirFileList[dirFileList.length] = dir + '/' + fileList[iFile];
               }
           } catch (statException) {
               console.log('findFiles: stat of ' + thisDir + ' returned ' + JSON.stringify(statException));
           }
       }
   } catch (readDirException) {
        console.log('findFiles: readDir of ' + thisDir + ' returned ' + readDirException.message);
    }
}

function findFilesInDirs(cfg, dirList, fileList)
{
    for(var iDir = 0; iDir<dirList.length; iDir++)
    {
       findFiles(cfg, dirList[iDir], fileList);
    }
    return fileList;
}

function decorateFiles(fileList, template, indent)
{
   var decorated = "";
   if(!indent) indent = '';

   for(var iFile = 0; iFile<fileList.length; iFile++)
   {
      // indent is here because mustache removes leading and trailing whitespace
      decorated = decorated + indent + mustache.expand(template, { FILE: fileList[iFile] } ) + '\n';
   }
   return(decorated);
}

function writeToFile(targetDir, content, file)
{
    try {
        var fileName = targetDir + '/' + file;
        ensureFolderPath(fileName);
        var fd = fs.openSync(fileName, 'w');
        fs.writeSync(fd, content, 0, 'utf8');
        fs.closeSync(fd);
    } catch(writeException)
    {
        console.log('writeToFile: write file ' + targetDir + '/' + file + ' failed with ' + writeException);
    }
}

function readInFile(file)
{
    try {
        return fs.readFileSync(file, 'utf8');
    } catch(readException) {
        console.log('readInFile: file ' + file + ' stat returned ' + readException.message);
        return null;
    }
}

function generateManifest(cfg)
{
    var manifestStr;
    var manifestHash = {};
    var manifestVer;

    manifestVer = incrementManifestVersion(cfg);
    if(!manifestVer) {
        console.log('generateManifest: Could not find the version file, ' + cfg.targetDir + '/' + cfg.versionFile + ', for manifest, ' + cfg.manifest);
        return;
    }
    manifestHash['VERSION'] = manifestVer;

    // add page key
    manifestHash['PAGE'] = mustache.expand(cfg.manifestLineDecorateTemplate, {FILE : cfg.page});

    // add styles key
    manifestHash['STYLES'] = decorateFiles(cfg.tempStyleFiles, cfg.manifestLineDecorateTemplate);

    // add sources key
    if(cfg.minify == 'none')
    {
       manifestHash['SOURCES'] = decorateFiles(cfg.tempSourceFiles, cfg.manifestLineDecorateTemplate);
    } else {
       manifestHash['SOURCES'] = decorateFiles([ cfg.minifyTarget ], cfg.manifestLineDecorateTemplate);
    }

    // add creatives key
    manifestHash['CREATIVES'] = decorateFiles(cfg.tempCreativeFiles, cfg.manifestLineDecorateTemplate);

    manifestHash['TEMPLATE'] = cfg.manifestTemplate;
    manifestHash['WARNING'] = mustache.expand(' !WARNING!  This is a generated file, change {{{TEMPLATE}}} instead!', manifestHash);

    // read the template into a string
    var templateStr = readInFile(cfg.targetDir + '/' + cfg.manifestTemplate);

    // Expand the keys with their values
    manifestStr = mustache.expand(templateStr, manifestHash);

    // Write the manifestStr to the target manifest
    writeToFile(cfg.targetDir, manifestStr, cfg.manifest);
}

function copyFiles(sourceDir, targetDir, files) {
   for(var i = 0; i < files.length; i++) {
      copyFile(sourceDir + '/' + files[i], targetDir + '/' + files[i]);
   }
}

function ensureFolderPath(fileName) {
   if(!fileName) return;
   
   var lastSlash = fileName.lastIndexOf('/');
   var folderName = fileName.slice(0,lastSlash);
   try {
      var stat = fs.statSync(folderName);
   } catch(noFileErr) {
      ensureFolderPath(folderName);
      fs.mkdirSync(folderName, '755');
   }
}

function copyFile(sourcePath, targetPath, callback) {
   ensureFolderPath(targetPath);
   
   var read = fs.createReadStream(sourcePath);
   var write = fs.createWriteStream(targetPath);
   
   write.on('error', function(e) {
      console.log('error copying to ' + targetPath + ': ' + JSON.stringify(e));
   });
   
   read.pipe(write, callback);
}

var exec = require('child_process').exec;

function rmDirRecursive(path, callback) {
   var child = exec('rm -rf ' + path, function(error, stdout, stderr) {
      callback(error);
   });
}

function addSymLinks(targetFolder, linkObj) {
   for(var linkName in linkObj) {
      var totalLinkPath = targetFolder + '/' + linkName;
      ensureFolderPath(totalLinkPath);
      fs.symlinkSync(linkObj[linkName], totalLinkPath);
   }
}

function minifySources(cfg, iMinifyDir, forPhone, callback)
{
   if(iMinifyDir < cfg.sourceDirs.length) {
      var child;
      try {
           console.log('minifySources: ' + cfg.sourceDirs[iMinifyDir]);
           var minify = forPhone ? 'full' : cfg.minify;
           child = exec(__dirname + '/find_and_min.sh ' + cfg.targetDir + '/' + cfg.sourceDirs[iMinifyDir] + ' ' + minify,
             function(error, stdout, stderr)
             {
                 if(!error) {
                     iMinifyDir++;
                     minifySources(cfg, iMinifyDir, forPhone, callback);
                 } else {
                     callback(error);
                 }
             }
           );
      }
      catch (unknownException) { callback(unknownException) }
   } else {
      if(iMinifyDir > 0) {
         var destDir = forPhone ? cfg.phoneDir : cfg.targetDir;
         try {
            var destFile = destDir + '/' + cfg.minifyTarget;
            ensureFolderPath(destFile);
            fs.renameSync(__dirname + '/min.tmp', destFile);
            callback(null);
         }
         catch (renameException) {
            callback(renameException);
         }
      } else {
         callback(null);
      }
   }
}

function generateContents(cfg, forPhone, callback)
{
   var pageStr = "";
   var pageHash = {};
   var indent = '    ';
   var destinationDir;

   try {
       if(forPhone) {
          pageHash['MANIFEST'] = '';
          destinationDir = cfg.phoneDir;
       } else {
          pageHash['MANIFEST'] = ' manifest="' + cfg.manifest + '"';
          destinationDir = cfg.targetDir;
       }

       pageHash['STYLES'] = decorateFiles(cfg.tempStyleFiles, cfg.htmlStyleLinkDecorateTemplate, indent);

       if(cfg.minify != 'none' || forPhone)
       {
          pageHash['SOURCES'] = decorateFiles( [ cfg.minifyTarget ], cfg.htmlScriptDecorateTemplate, indent);
       } else {
          pageHash['SOURCES'] = decorateFiles(cfg.tempSourceFiles, cfg.htmlScriptDecorateTemplate, indent);
       }

       pageHash['TEMPLATE'] = cfg.pageTemplate;
       pageHash['WARNING'] = mustache.expand(' !WARNING!  This is a generated file, change {{{TEMPLATE}}} instead!', pageHash);

       var pageTemplateStr = readInFile(cfg.targetDir + '/' + cfg.pageTemplate);

       if(!pageTemplateStr) {
          var readErr = 'Could not read page template file';
          callback(readErr);
       }

       // Expand the template page
       pageStr = mustache.expand(pageTemplateStr, pageHash);
       
       function callbackSuccess() {
          writeToFile(destinationDir, pageStr, cfg.page);
          
          if(forPhone) {
              try {
                 addSymLinks(cfg.phoneDir, cfg.phoneSymLinks);
              } catch (linkError) {
                 //callback(linkError);
                 //return;
              }
              
              //copy additional files to the client
              copyFiles(cfg.targetDir, cfg.phoneDir, cfg.tempStyleFiles);
              copyFiles(cfg.targetDir, cfg.phoneDir, cfg.sourceFiles);
              copyFiles(cfg.targetDir, cfg.phoneDir, cfg.styleFiles);
              copyFiles(cfg.targetDir, cfg.phoneDir, cfg.phoneFiles);
          }
          
          callback(null);
       }

       if((cfg.minify != 'none'  || forPhone) && cfg.sourceDirs.length > 0) {
           minifySources( cfg, 0, forPhone, function(err) {
               if(!err) {
                  callbackSuccess();
               } else {
                  callback(err);
               }
           } );
       } else {
          callbackSuccess();
       }
   } catch (unknownException) { callback(unknownException); }
}

function findFilesInDirsForCfg(cfg) {
   findFilesInDirs(cfg, cfg.sourceDirs, cfg.tempSourceFiles);
   findFilesInDirs(cfg, cfg.creativeDirs, cfg.tempCreativeFiles);
   findFilesInDirs(cfg, cfg.styleDirs, cfg.tempStyleFiles);
}

function generateManifestAndContents(cfg, callback)
{
   try {
      // Find all the files we need to work with
      findFilesInDirsForCfg(cfg);
      
      function copyToPhone() {
         rmDirRecursive(cfg.phoneDir, function(err) {
            var manLength = manifestConfig.length;
            var manCreated = 0;
            var firstErr;
            
            //for(var iConfig = 0; iConfig < manifestConfig.length; iConfig++) {
            function createManifest(iConfig) {
               if(iConfig >= manLength) return;
               
               var phoneCfg = _.clone(manifestConfig[iConfig]);
               prepareConfig(phoneCfg);
               findFilesInDirsForCfg(phoneCfg);
               generateContents(phoneCfg, true, function(err){
                  if(err) {
                     console.log(err);
                     if(callback) callback(err);
                     return;
                  }
                  
                  iConfig++;
                  //if(++manCreated == manLength) {
                  if(iConfig == manLength) {
                  
                    var generateWebPackage = function(){                   
                        var mc = require('magicManifestsConfig.js').webPackage;
                        
                        var cmd = '/usr/node/bin/node ' + mc.pkgGenScript + 
                                   ' --pkgSource ' + mc.assets + ' --zipFolder ' +
                                   mc.webPackageName + ' --pkgTarget ' + mc.targetDir;
                        
                        if(cfg.userType) {
                           cmd += ' --versionTag ' + cfg.userType;
                        }
                        
                         exec(cmd, function(error, stdout, stderr) {
                            if((error != null)  || stderr ){
                               console.log('Error generating zip package ' + argv.pkgTarget);
                               if (error != null) console.log(error.stack);
                               if (stderr) console.log(stderr);
                            }          
                         }); 
                     }
             
                     generateWebPackage();
                  
                     // add exec here that calls the zip script
                     if(callback) callback();
                  } else {
                     createManifest(iConfig)
                  }
               });
            }
            
            createManifest(0);
         });
      }
      
      generateContents(cfg, false, function (err) { 
         if(!err) {
            generateManifest(cfg); //ensure that manifest is generated last (for the stat check)
            if(cfg.manifest == 'ib.manifest') copyToPhone();
         } else {
             callback(err);
         }
      });
   } catch (unknownException) { callback(unknownException); }
}

/* Compare a file or directory against a modification time */
function isItemNewer(versusModTime, item, recreateable)
{
    try
    {
        if(fs.statSync(item).mtime > versusModTime)
        {
            return(1);
        }
    } catch (statException) {
        console.log('isItemNewer: stat ' + item + ' ' + statException.message);
        // File/Dir does not exist.  In the case of the manifest file or page we need to recreate it, so return 1
        // In other cases this is some kind of unrecoverable error (a directory you specified does not exist,
        // or the version file was deleted
        if(recreateable) {
           return(1);
        } else {
           return(0);
        }
    }

    return(0);
}

/* Compare the modification time of each file/dir in the list with versusModTime */
function isListNewer(versusModTime, list, targetDir)
{
    for (var iItem=0; iItem < list.length; iItem++)
    {
        if(isItemNewer(versusModTime, targetDir + '/' + list[iItem], false))
        {
            return(1);
        }
    }
    return 0;
}

function arrayCopy(sourceArray)
{
   var targetArray = [];
   for(var iArray = 0; iArray < sourceArray.length; iArray++) {
       targetArray.push(sourceArray[iArray]);
   }
   return targetArray;
}

function prepareConfig(cfg) {
   cfg.tempSourceFiles = arrayCopy(cfg.sourceFiles);
   cfg.tempCreativeFiles = arrayCopy(cfg.creativeFiles);
   cfg.tempStyleFiles = arrayCopy(cfg.styleFiles);
   
   if(cfg.targetDir.indexOf(__dirname) == -1) {
      cfg.targetDir = __dirname + '/' + cfg.targetDir;
   }
   
   if(cfg.phoneDir.indexOf(__dirname) == -1) {
      cfg.phoneDir = __dirname + '/' + cfg.phoneDir;
   }
}

function check(testManifest, callback, userType)
{
   var manifestStat;
   var cfg;
   var createTimeOffset = 100;
   var cfgToCompile = [];

   for (var iConfig=0; iConfig < manifestConfig.length; iConfig++)
   {
      cfg = _.clone(manifestConfig[iConfig]);

      if(cfg.magic == 'enabled' && cfg.manifest == testManifest)
      {
         try
         {
            
            prepareConfig(cfg);

            try {
               manifestStat = fs.statSync(cfg.targetDir + '/' + testManifest);
            } catch (manifestStatExc) {
               console.log('manifest not found ' + manifestStatExc.message);
               manifestStat = null;
            }

            // Do all tests
            if(!manifestStat ||
               isListNewer(manifestStat.mtime, cfg.sourceDirs, cfg.targetDir) ||
               isListNewer(manifestStat.mtime, cfg.creativeDirs, cfg.targetDir) ||
               isListNewer(manifestStat.mtime, cfg.styleDirs, cfg.targetDir) ||
               isItemNewer(manifestStat.mtime, cfg.targetDir + '/' + cfg.page, true) ||
               isItemNewer(manifestStat.mtime, cfg.targetDir + '/' + cfg.pageTemplate, false) ||
               isItemNewer(manifestStat.mtime, cfg.targetDir + '/' + cfg.manifestTemplate, false) ||
               isItemNewer(manifestStat.mtime, cfg.targetDir + '/' + cfg.versionFile, false) ||
               isListNewer(manifestStat.mtime, cfg.sourceFiles, cfg.targetDir) ||
               isListNewer(manifestStat.mtime, cfg.styleFiles, cfg.targetDir) ||
               isListNewer(manifestStat.mtime, cfg.creativeFiles, cfg.targetDir))
            {
               console.log('Automatically updating manifest ' + cfg.targetDir + '/' + testManifest);
               
               cfg.userType = userType ? userType : 'prod';
               cfgToCompile.push(cfg);
               
            } else {
               console.log(testManifest + ' is up to date');
            }
         } catch (exManifestCheck) {
            // move along to the next one
            console.log('manifest.check(): failed for ' + cfg.targetDir + '/' + testManifest + ' with ' +
                JSON.stringify(exManifestCheck));
         }
      }
   }
   
   function createManifest() {
      var cfg = cfgToCompile.shift();
      
      if(!cfg) {
         callback();
         return;
      }
      
      generateManifestAndContents(cfg, function (err) {
          if(err) {
              console.log('manifest generation failed: ' + JSON.stringify(err));
              callback(err);
              return;
          }
          
          createManifest();
      });
   }
   
   createManifest();
}

// Check them all at startup
function initialize()
{
   for(var iConfig = 0; iConfig < manifestConfig.length; iConfig++)
   {
      check(manifestConfig[iConfig].manifest, function(err) {});
   }
}

function forceUpdateAll(callback) {
   var manLength = manifestConfig.length;
   var manCreated = 0;
   if(manLength > 0) {
      
      function createEverything(cfg, callback) {
         prepareConfig(cfg);
         findFilesInDirsForCfg(cfg);
         generateContents(cfg, false, function (err) { 
            if(err) {
               callback(err);
            } else {
               generateManifest(cfg); //ensure that manifest is generated last (for the stat check)
               generateContents(cfg, true, function(err){
                  callback(err);
               });
            }
         });
      }
      
      prepareConfig(manifestConfig[0]);
      rmDirRecursive(manifestConfig[0].phoneDir, function(err) {
         //for(var iConfig = 0; iConfig < manLength; iConfig++) {
         function createManifest(iConfig) {
            if(iConfig >= manLength) {
               if(callback) callback();
               return;
            }
            
            var cfg = manifestConfig[iConfig];
            createEverything(cfg, function(err) {
               if(err) {
                  console.log('manifest generation failed: ' + JSON.stringify(err, null, 3));
               }
               
               /*
               if(++manCreated == manLength) {
                  if(callback) callback();
               }
               */
               
               iConfig++;
               createManifest(iConfig);
            });
         }
         
         createManifest(0);
      });
   } else {
      callback();
   }
}

function forceUpdate(manifestName) {
   for(var iConfig = 0; iConfig < manifestConfig.length; iConfig++) {
      var cfg = manifestConfig[iConfig];
      if(manifestName == cfg.manifest) {
      
         prepareConfig(cfg);
         
         generateManifestAndContents(cfg, function (err) {
             if(err) {
                 console.log('manifest generation failed: ' + JSON.stringify(err, null, 3));
             }
         });
         return;
      }
   }
   
   console.log('No magic manifest config for manifest ' + manifestName);
}
