const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const globule = require('globule');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const targetTypes = { ejs: 'html', js: 'js', ts: 'js', css: 'scss' };

const getEntriesList = (targetTypes) => {
  const entriesList = {};
  for (const [srcType, targetType] of Object.entries(targetTypes)) {
    const filesMatched = globule.find([`**/**/*.${srcType}`, `!**/**/_*.${srcType}`], { cwd: `${__dirname}/ejs` });

    for (const srcName of filesMatched) {
      const targetName = srcName.replace(new RegExp(`.${srcType}$`, 'i'), `.${targetType}`);
      entriesList[targetName] = `${__dirname}/ejs/${srcName}`;
    }
  }
  return entriesList;
}

const app = {
  mode: 'production',
  entry: './assets/entrypoint.js',
  output: {
    filename: './assets/js/common.js',
    path: path.resolve(__dirname, '../dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
              ],
            },
          },
        ],
      },
      {
        test: /\.(sass|css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer', { grid: true }],
                ],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
            },
          },
        ]
      },
      {
        test: /\.(png|svg|jpe?g|gif|mp4|webp|otf|ico)$/,
        type: "asset/resource",  // 画像をリソースとして扱い、適切にパスを出力
        generator: {
          filename: "assets/img/[name][ext][query]"  // 出力先パスを指定
        }
      },
      {
        test: /\.ejs$/,
        use: [
          'html-loader',
          'ejs-html-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.vert', '.frag'],
  },
  target: ["web", "es5"],
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: './assets/css/common.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './assets/js/glsl/main.vert', to: 'main.vert' },
        { from: './assets/js/glsl/main.frag', to: 'main.frag' },
        { from: './assets/img', to: 'assets/img' }  // 画像をビルドディレクトリにコピー
      ],
    }),
  ],
	devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: { drop_console: true },
        },
      }),
      new CssMinimizerPlugin({})
    ],
  },
};

// EJSのエントリーポイントを取得してHtmlWebpackPluginを設定
for (const [targetName, srcName] of Object.entries(getEntriesList({ ejs: 'html', ts: 'html' }))) {
  app.plugins.push(new HtmlWebpackPlugin({
    filename: targetName,
    template: srcName
  }));
}

module.exports = app;
