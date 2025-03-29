Web root and parent repo for various personal projects implemented as submodules

Submodule Creation command line:
git submodule add https://username@github.com/username/reponame.git localpath

They will run directly off the source, but are designed to run through the webpack system for a live release.

External repo [three.js](https://github.com/mrdoob/three.js) dependency:
> /three.js

Running webpack: [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

webpack configs build to:
> /live_offline

run npm:
```
npm init -y
```
```
npm install webpack webpack-cli --save-dev
```

Required webpack module:
[copy-webpack-plugin](https://webpack.js.org/plugins/copy-webpack-plugin/)

pack.sh shell script will run the webpack config files. 
It needs to be executed from the same directory because it uses relative paths. 
It additionally removes 
> /live

then moves
> /live_offline

to
> /live
