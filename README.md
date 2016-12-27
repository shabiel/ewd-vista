# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. At the moment, it only works with VistA on GT.M. You must first have EWD 3 installed and configured. [Rob Tweed's website](http://ec2.mgateway.com/ewd/ws/index.html#) is the place to start if you don't yet have EWD 3 installed.

The organization of this module and these instructions are derived from examples provided by [Rob Tweed](https://github.com/robtweed).

These instruction assume that your EWD 3 root directory is ~/ewd3.

##Installation

The following modules are peer dependencies of EWD VistA.

* ewd-qoper8-vistarpc2
* ewd-xpress
* ewd-vista-login
* nodem

Make sure you have them all.

````
cd ~/ewd3
npm list --depth=0
````

For any that are missing, do the following:

````
npm install [module name]
````

Next install EWD VistA.

````
npm install ewd-vista
npm install ewd-vista-login
````

Create a web application directory and symbolic links (TODO).

````
mkdir www/ewd-vista
cp -R node_modules/ewd-vista/www/* www/ewd-vista/
cp -nR node_modules/ewd-vista-login/www/* www/ewd-vista/
````

Since EWD VistA is modular you will need to bundle the client javascript in order to deploy the application. Doing so requires the development dependencies and that you install Browserify.

````
npm install -g browserify
````

Create your client javascript bundle.

````
cd node_modules/ewd-vista
browserify -t [ babelify ] www/assets/javascripts/app.js -o www/assets/javascripts/bundle.js
cd ../..
````

Restart ewd-xpress.

If you have a default installation of EWD 3, your VistA application should be available at http://[domain or IP]:8080/ewd-vista/index.html

##Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
