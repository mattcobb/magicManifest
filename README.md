Automatically creating an HTML5 Manifest

Set manifestTemplate to template manifest file
Set pageTemplate to the template html page that references the manifest

Templates use 

targetDir is location where your manifest and the web page using your manifest will be served to end users.
The targetDir is specified relative to this directory

Modify the magicManifestsConfig.js to fit you

exports.magicManifestsConfig =
[
    { // your.manifest of your_page.html
        magic : 'enabled',  // enabled | disabled
        targetDir : '../public',
        phoneDir : '../../webview/build/assets',
        manifest : 'your.manifest',
        manifestTemplate : 'your.manifest.template',
        page : 'your_page.html',
        pageTemplate : 'your_page.html.template',
        minify : 'full', // full | concat | none
        minifyTarget : 'yours.min.js',
        sourceDirs :
        [
            'schema',
            'data',
            'common',
            'templates',
            'controllers',
            'models',
            'debug',
            'views'
        ],
        sourceFiles : [],
        creativeDirs :
        [
            'img'
        ],
        creativeFiles : [],
        styleDirs :
        [
            'sencha/css',
            'css'
        ],
        styleFiles : [],
        phoneSymLinks: {
            'img': '/usr/src/yours/webview/src/img'
        },
        phoneFiles: [
            'extern/jquery.min.js',
            'extern/jquery.easing.1.3.js',
            'sencha/sencha-touch.js'
        ],
        versionFile : 'version', // name of the file to grab the latest version from, bump it, and save
        manifestLineDecorateTemplate : "{{FILE}}",  // defines what a line in the manifest will look like
        htmlStyleLinkDecorateTemplate : '<link href="{{{FILE}}}" rel="stylesheet" type="text/css"/>', // css link format
        htmlScriptDecorateTemplate : '<script src="{{{FILE}}}" type="text/javascript"></script>'      // script like format
    },
    // Multiple manifests can be specified in a single config
    { // login.manifest of login.html
        magic : 'enabled',  // enabled | disabled
        targetDir : '../anonymous',  //
        phoneDir : '../../webview/build/assets',
        manifest : 'login.manifest',
        manifestTemplate : 'login.manifest.template',
        page : 'login.html',
        pageTemplate : 'login.html.template',
        minify : 'none', // full | concat | none
        minifyTarget : 'login.min.js',
        sourceDirs : ['login'],
        sourceFiles : [],
        creativeDirs : [],
        creativeFiles :
           [
               'img/friends.png',
               'img/settings.png',
               'img/Facebook_login.png',
               'img/activate.png',
               'img/email.png',
               'img/notify.png'
           ],
        styleDirs :
            [],
        styleFiles : ['login.css', 'app_eula.css'],
        phoneSymLinks: {
            'img': '/usr/src/yours/webview/img'
        },
        phoneFiles: [],
        versionFile : 'version', // name of the file to grab the version from, bump it and save
        manifestLineDecorateTemplate : "{{FILE}}",
        htmlStyleLinkDecorateTemplate : '<link href="{{{FILE}}}" rel="stylesheet" type="text/css"/>',
        htmlScriptDecorateTemplate : '<script src="{{{FILE}}}" type="text/javascript"></script>'
    }
];
