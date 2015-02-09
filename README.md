## cirql-ionic
> Mobile App for your cirql heating control and room climate information system.

Built with:
- [Angular.js] (https://angularjs.org/)
- [cordova] (http://cordova.apache.org/)
- [Ionic] (http://ionicframework.com/)
- [Firebase] (https://www.firebase.com/docs/)

## Install, Build and Run
First make sure [node.js] (http://nodejs.org/) is installed.

    $ node -v

We use [Bower] (http://bower.io/) (Package Manager) and [Grunt] (http://gruntjs.com/) (Build System) that are part of [Yeoman] (http://yeoman.io/).
To install Yeoman (and with it Bower and Grunt) run

    $ npm install -g yo

Clone this repository, then install the required packages with

    $ git clone https://github.com/domwoe/cirql-ionic.git
    $ cd cirql-ionic
    $ npm install
    $ bower install

You can now run the app in a browser with

    $ grunt serve

## Workflow Commands

### `grunt serve[:compress]`

Run a local development server with built in filesystem watching support integrated with LiveReload so you can develop your Ionic app in a browser. Since this command uses the `ionic-cli` under the hood, you can specify any command line flags / options shown [here](https://github.com/driftyco/ionic-cli#testing-in-a-browser).

    $ grunt serve --consolelogs
    $ grunt serve:compress

### `grunt platform:add:<platform>`

Add a supported Cordova platform as a build target for this project.

    $ grunt platform:add:ios
    $ grunt platform:add:android

### `grunt plugin:add:<plugin>`

Install a native Cordova plugin either by [registry name](http://plugins.cordova.io/) or repository URL.

    $ grunt plugin:add:https://github.com/driftyco/ionic-plugins-keyboard.git
    $ grunt plugin:add:org.apache.cordova.device
    $ grunt plugin:add:org.apache.cordova.network-information

### `grunt [emulate|run]:<target>`

Either `emulate` your Ionic app inside a simulator or `run` it on a connected device, optionally enabling LiveReload support to supercharge your development speed and enhance productivity. __Note:__ Any changes to native plugins will still require a full rebuild. This command also uses the `ionic-cli` under the hood, so these [additional flags](https://github.com/driftyco/ionic-cli/blob/master/README.md#live-reload-app-during-development-beta) can be specified.

    $ grunt emulate:ios --livereload
    $ grunt emulate:ios --lc
    $ grunt emulate:ios --target=iPad -lc
    $ grunt emulate:android --consolelogs

    $ grunt run:ios
    $ grunt run:android

### `grunt compress`

Run your Ionic application files located in `app/` through the concatenation, obfuscation, and minification pipelines and write the optimized assets to the `www/` directory, which allows them to be consumed by either the `cordova` or `ionic` command line tools for packaging.

### `grunt serve:compress`

This runs `grunt compress` to optimize your Ionic app assets and then immediately launches a local development server so that you can preview the compressed application in a browser.

### `grunt build:<platform>`

Build your Ionic application for the targeted platform.

    $ grunt build:ios --device --release
    $ grunt build:android --debug

To build separate apk files for x86 and ARM on android (results in smaller package size) use following command:

    BUILD_MULTIPLE_APKS=true grunt build:android

### `grunt jshint`

While running `grunt serve` or `grunt emulate`, the build system will be watching your filesystem for changes and linting your JavaScript files on the fly. However, you can invoke JSHint manually by using this command to spot check your Ionic app for linting errors.

### `grunt karma`

Launches the configured `karma` test running framework using PhantomJS.

### `grunt coverage`

Generates a static site containing code coverage reports for your unit tests using [Istanbul](http://gotwarlost.github.io/istanbul/).

### `grunt ripple`

Launch the bundled [Ripple](http://ripple.incubator.apache.org/) emulator by first adding a platform via `grunt platform:add:<platform>` and then running this command.
