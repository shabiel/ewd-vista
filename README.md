# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. At the moment, it only works with VistA on GT.M. You must first have EWD 3 installed and configured. [Rob Tweed's website](http://ec2.mgateway.com/ewd/ws/index.html#) is the place to start if you don't yet have EWD 3 installed.

These instruction assume that your EWD 3 root directory is ~/ewd3.

##Installation

````
cd ~/ewd3
npm install ewd-vista
npm install ewd-vista-login
````

Create a web application directory and copy the requisite files from the installed modules.

````
mkdir www/ewd-vista
cp -R node_modules/ewd-vista/www/* www/ewd-vista/
cp -nR node_modules/ewd-vista-login/www/* www/ewd-vista/
````

Since EWD VistA is modular you will need to bundle the client javascript in order to deploy the application. To do so you you need a few more Node.js modules.

````
npm install babelify
npm install -g browserfiy
npm install bootstrap@3
npm install toastr
````

Create your client javascript bundle.

````
browserify -t [ babelify ] www/ewd-vista/assets/javascripts/app.js -o www/ewd-vista/assets/javascripts/bundle.js
````

Restart ewd-xpress.

If you have a default installation of EWD 3, your VistA application should be available at http://[domain or IP]:8080/ewd-vista/index.html

##Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
