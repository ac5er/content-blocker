import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import IgnoreEmitPlugin from 'ignore-emit-webpack-plugin';

const ROOT_PATH = path.resolve(__dirname);
const SRC_PATH = path.resolve(ROOT_PATH, 'src');
const DIST_PATH = path.resolve(ROOT_PATH, 'dist');

const env = process.env.NODE_ENV;

module.exports = {
  entry: {
    common: ['assets.js', 'blockManager.js', 'helpers.js'].map(
      x => SRC_PATH + '/scripts/' + x
    ),
    background: SRC_PATH + '/scripts/background.js',
    content: SRC_PATH + '/scripts/content.js',
    options: SRC_PATH + '/scripts/options.js',
    popup: SRC_PATH + '/scripts/popup.js'
  },
  output: {
    path: DIST_PATH,
    filename: 'scripts/[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(sass|scss)$/,
        exclude: /styles\/content\.(sass|scss)$/,
        loaders: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              data: '@import "variables";',
              includePaths: [path.resolve(SRC_PATH, './styles')]
            }
          }
        ]
      },
      {
        test: /styles\/content\.(sass|scss)$/,
        loaders: [
          'to-string-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              data: '@import "variables";',
              includePaths: [path.resolve(SRC_PATH, './styles')]
            }
          }
        ]
      },
      {
        test: /\.(ttf|eot|svg|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\/icons\/(.*)\.png$/i,
        loader: 'file-loader?name=/icons/[name].[ext]'
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      chunks: ['background', 'options', 'popup'],
      minChunks: 2
    }),

    new IgnoreEmitPlugin(/\.(ttf|eot|svg|woff)(\?.*)?$/),
    new CopyWebpackPlugin([
      {
        from: 'LICENSE'
      },
      {
        from: 'manifest.json'
      },
      {
        from: SRC_PATH + '/icons',
        to: 'icons'
      },
      {
        context: SRC_PATH,
        from: SRC_PATH + '/*.html'
      }
    ])
  ],
  watch: 'development' === env ? true : false
};

if ('production' === env) {
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true
      },
      comments: false,
      beautify: false,
      sourceMap: false
    })
  ]);
}
