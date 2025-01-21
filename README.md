The web player will run directly off the source, but is designed to run through the webpack system for a live release.

Running webpack: [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

Repo:
```
parent/web/
```

webpack configs build to:
```
parent/live/
```

three.js dependency:
```
parent/three.js/
```

run npm on the parent:
npm init -y
npm install webpack webpack-cli --save-dev
