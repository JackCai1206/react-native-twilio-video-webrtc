const path = require('path');

const reactPath = path.resolve(__dirname + '/../Spacebar/apps/client/node_modules/react');

module.exports = {
    resolver: {
        extraNodeModules: {
            'react': reactPath
        }
    },
    watchFolders: [reactPath]
}
