/*
 * Configuration for automatically creating an HTML5 Manifest
 *
 * targetDir is location where your manifest and the web page using your manifest will be served to end users.
 * The targetDir is specified relative to the src/ib/edge/manifests, e.g. for webview/src (symlinked as edge/public):
 * targetDir is ../public
 */

// used for generating ib.zip
exports.webPackage = {
   webPackageName: "ib",
   assets: "/usr/ib/webview/build/assets",
   targetDir: "/usr/ib/webview/src/client",
   pkgGenScript: "/usr/ib/webview/tools/genWebPackage.js"
}

exports.magicManifestsConfig =
[
    { // ib.manifest of ib2.html
        magic : 'enabled',  // enabled | disabled
        targetDir : '../public',
        phoneDir : '../../webview/build/assets/ib',
        manifest : 'ib.manifest',
        manifestTemplate : 'ib.manifest.template',
        page : 'ib2.html',
        pageTemplate : 'ib2.html.template',
        minify : 'full', // full | concat | none
        minifyTarget : 'xwish.min.js',
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
            'img': '/usr/ib/webview/src/img'
        },
        phoneFiles: [
            'extern/jquery.min.js',
            'extern/jquery.easing.1.3.js',
            'sencha/sencha-touch.js'
        ],
        versionFile : 'version',
        manifestLineDecorateTemplate : "{{FILE}}",
        htmlStyleLinkDecorateTemplate : '<link href="{{{FILE}}}" rel="stylesheet" type="text/css"/>',
        htmlScriptDecorateTemplate : '<script src="{{{FILE}}}" type="text/javascript"></script>'
    },
    { // login.manifest of login.html
        magic : 'enabled',  // enabled | disabled
        targetDir : '../anonymous',  //
        phoneDir : '../../webview/build/assets/ib',
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
               'img/genie_dark_3d.png',
               'img/Facebook_login.png',
               'img/green_background_light.png',
               'img/places.png',
               'img/wishes.png',
               'img/activate.png',
               'img/email.png',
               'img/notify.png'
           ],
        styleDirs :
            [],
        styleFiles : ['login.css', 'app_eula.css'],
        phoneSymLinks: {
            'img': '/usr/ib/webview/src/img'
        },
        phoneFiles: [],
        versionFile : 'version',
        manifestLineDecorateTemplate : "{{FILE}}",
        htmlStyleLinkDecorateTemplate : '<link href="{{{FILE}}}" rel="stylesheet" type="text/css"/>',
        htmlScriptDecorateTemplate : '<script src="{{{FILE}}}" type="text/javascript"></script>'
    }
];
