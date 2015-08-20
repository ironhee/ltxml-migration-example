var webpackUMDExternal = require('webpack-umd-external');


module.exports = {
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.js']
  },
  entry: {
    'ltxml': './lib/ltxml.js'
  },
  output: {
    path: './dist/',
    filename: 'ltxml.js',
    library: 'Ltxml',
    libraryTarget: 'umd'
  },
  externals: webpackUMDExternal({
    'linq': 'Enumerable'
  })
};
