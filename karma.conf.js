// Karma configuration
// Generated on Sat Nov 16 2013 20:51:19 GMT+0300 (IDT)

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',
    // frameworks to use
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular-resource.min.js',
        'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
        'tests/angular-mocks.js',
        'public/javascripts/rss.js',
        'public/javascripts/controllers.js',
        'public/javascripts/directives.js',
        'public/javascripts/services.js',
        'tests/controllersSpec.js'
    ],


    // list of files to exclude
    exclude: [

    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-phantomjs-launcher'
            ],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
