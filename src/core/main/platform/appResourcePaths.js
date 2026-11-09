const nodePath = require('node:path')

const resolveBundledResourceDirectory = (resourceName, { isPackaged, appRootDirectory, resourcesPath, pathModule = nodePath }) => (
  isPackaged && resourcesPath
    ? pathModule.join(resourcesPath, resourceName)
    : pathModule.join(appRootDirectory, resourceName)
)

module.exports = { resolveBundledResourceDirectory }
