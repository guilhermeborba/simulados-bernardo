const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const fs = require('node:fs');
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const dependencies = path.join(projectRoot, 'node_modules');
// Share contract sources while keeping React 19/native dependencies owned by mobile/.
config.watchFolders = [path.resolve(projectRoot, '..'), fs.realpathSync(dependencies)];
config.resolver.nodeModulesPaths = [dependencies];
config.resolver.extraNodeModules = {
  react: path.join(dependencies, 'react'),
  'react-native': path.join(dependencies, 'react-native'),
};
module.exports = config;
