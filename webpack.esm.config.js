// webpack.esm.config.js
const path = require('path');
const PACKAGE = require('./package.json');
const webpack = require('webpack');

module.exports = {
  entry: {
    'rmp-vast.esm': './src/js/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
    publicPath: '',
    library: {
      type: 'module'
    },
    module: true
  },
  experiments: {
    outputModule: true
  },
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
          /externals/
        ],
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.esm.config.js')
          }
        }
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      RMP_VAST_VERSION: JSON.stringify(PACKAGE.version)
    })
  ]
};
