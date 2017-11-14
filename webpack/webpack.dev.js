const webpack = require('webpack');
const writeFilePlugin = require('write-file-webpack-plugin');
const webpackMerge = require('webpack-merge');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const path = require('path');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';
// we hide the modules analyzer for dev
const WEBPACK_BUNDLE_ANALYZER_ACTIVE = false;

module.exports = webpackMerge(commonConfig({env: ENV, webpackBundleAnalyzerActive: WEBPACK_BUNDLE_ANALYZER_ACTIVE}), {
    // use the original sources for debugging
    devtool: 'eval-source-map',
    // define parameters for the development server
    devServer: {
        // where the static files are
        contentBase: './target/www',
        // proxy the server side of the application : the one running the api
        proxy: [
            {
                context: [
                    /* jhipster-needle-add-entity-to-webpack - JHipster will add entity api paths here */
                    '/api',
                    '/management',
                    '/swagger-resources',
                    '/v2/api-docs',
                    '/h2-console'
                ],
                target: 'http://127.0.0.1:8080',
                secure: false
            }, {
                context: ['/websocket'],
                target: 'ws://127.0.0.1:8080',
                ws: true
            }
        ]
    },
    // define the entry files used to bootstrap the process
    entry: {
        polyfills: './src/main/webapp/app/polyfills',
        global: './src/main/webapp/content/scss/global.scss',
        main: './src/main/webapp/app/app.main'
    },
    // define the output directory and how to name files
    output: {
        path: utils.root('target/www'),
        filename: 'app/[name].bundle.js',
        chunkFilename: 'app/[id].chunk.js'
    },
    module: {
        rules: [
            // lint the ts files    
            {
                test: /\.ts$/,
                enforce: 'pre',
                loaders: 'tslint-loader',
                exclude: [
                    'node_modules',
                    new RegExp('reflect-metadata\\' + path.sep + 'Reflect\\.ts')
                ]
            }, 
            //  compile typescript and inline all html and style's in angular components (using "require")
            {
                test: /\.ts$/,
                loaders: [
                    'angular2-template-loader', 'awesome-typescript-loader'
                ],
                exclude: ['node_modules/generator-jhipster']
            }, 
            // compile scss into css and inject it as a string 
            // within javascript bundles
            {
                test: /\.scss$/,
                loaders: ['to-string-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
                exclude: /(vendor\.scss|global\.scss)/
            },
            // inject the css code got from vendor and global 
            // scss files (after compiling scss into css)
            // within the output code. Thanks to style-loader <styles> tag
            // will be added to the index.html file during compilation (when
            // code is running on the browser).
            {
                test: /(vendor\.scss|global\.scss)/,
                loaders: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
            },
            // actually only sass is used so the following rules related
            // to css files are just in case, in the future, some css files would
            // be used which is not recommanded.
            // inject css code as a string within the components
            // and other javascript file
            {
                test: /\.css$/,
                loaders: ['to-string-loader', 'css-loader', 'postcss-loader'],
                exclude: /(vendor\.css|global\.css)/
            },
            // inject the css code got from vendor and global css files
            // within the output code. Thanks to style-loader <styles> tag
            // will be added to the index.html file during compilation (when
            // code is running on the browser).
            {
                test: /(vendor\.css|global\.css)/,
                loaders: ['style-loader', 'css-loader', 'postcss-loader']
            }
        ]
    },
    plugins: [
        // set the dev server configuration
        new BrowserSyncPlugin({
            host: 'localhost',
            port: 9000,
            proxy: {
                target: 'http://localhost:9060',
                ws: true
            }
        }, {reload: false}),
        // Ensure that no assets are emitted that include errors
        new webpack.NoEmitOnErrorsPlugin(),
        // useful for the hot reload
        new webpack.NamedModulesPlugin(),
        // Forces webpack-dev-server program to write output files to the file system
        new writeFilePlugin(),
        // ignore the specified files while performing the hot reload
        new webpack.WatchIgnorePlugin([utils.root('src/test')]),
        // display notification about the build
        new WebpackNotifierPlugin({
            title: 'JHipster',
            contentImage: path.join(__dirname, 'logo-jhipster.png')
        })
    ]
});
