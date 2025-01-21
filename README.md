The web player will run directly off the source, but is designed to run through the webpack system for a live release.

Running webpack:

[Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

To see if you already have Node.js and npm installed and check the installed version, run the following commands:

node -v
npm -v

https://nodejs.org/en/download/

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Download and install Node.js:
nvm install 22
# Verify the Node.js version:
node -v # Should print "v22.13.0".
nvm current # Should print "v22.13.0".
# Verify npm version:
npm -v # Should print "10.9.2".

Repo:
```
parent/web/
```

three.js dependency:
parent/three.js/

npm on the parent of the ropository root:
npm init -y
npm install webpack webpack-cli --save-dev
