const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const Visualizer = require('webpack-visualizer-plugin');
const ngcWebpack = require('ngc-webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'production';

// we display the modules analyzer for production
const WEBPACK_BUNDLE_ANALYZER_ACTIVE = true;

// It moves all the required *.css modules, resulting 
// from the sass files, in entry chunks 
// into a separate CSS file. So your styles 
// are no longer inlined into the JS bundle,
// but in a separate CSS file
const extractSASS = new ExtractTextPlugin(`[name]-sass.[hash].css`);

// It moves all the required *.css modules in entry chunks 
// into a separate CSS file. So your styles 
// are no longer inlined into the JS bundle,
// but in a separate CSS file
const extractCSS = new ExtractTextPlugin(`[name].[hash].css`);

module.exports = webpackMerge(commonConfig({ env: ENV, webpackBundleAnalyzerActive: WEBPACK_BUNDLE_ANALYZER_ACTIVE }), {
    // Enable source maps. Please note that this will slow down the build.
    // You have to enable it in UglifyJSPlugin config below and in tsconfig-aot.json as well
    // devtool: 'source-map',
    // define the entry files used to bootstrap the process
    entry: {
        polyfills: './src/main/webapp/app/polyfills',
        global: './src/main/webapp/content/scss/global.scss',
        main: './src/main/webapp/app/app.main-aot'
    },
    // define the output directory and how to name files
    output: {
        path: utils.root('target/www'),
        filename: 'app/[name].[hash].bundle.js',
        chunkFilename: 'app/[id].[hash].chunk.js',
        publicPath: '/static/'
    },
    module: {
        rules: [
            //  compile typescript and inline all html and style's in angular components (using "require")
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: 'tsconfig-aot.json'
                        },
                    },
                    { loader: 'angular2-template-loader' }
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
            // extract the css code generated from vendor and global 
            // bundles into a separate file (the bundles buing built
            // from scss files)
            {
                test: /(vendor\.scss|global\.scss)/,
                use: extractSASS.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'postcss-loader', 'sass-loader']
                })
            },
            // inject css code as a string within javascript bundles
            {
                test: /\.css$/,
                loaders: ['to-string-loader', 'css-loader', 'postcss-loader'],
                exclude: /(vendor\.css|global\.css)/
            },
            // extract the css code generated from vendor and global 
            // bundles into a separate file (the bundles buing built
            // from css files)
            {
                test: /(vendor\.css|global\.css)/,
                use: extractCSS.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'postcss-loader']
                })
            }]
    },
    plugins: [
        extractSASS,
        extractCSS,
        // generate statistics about the generated outputs
        new Visualizer({
            // Webpack statistics in target folder
            filename: '../stats.html'
        }),
        // uglify/minify the javascript code
        new UglifyJSPlugin({
            parallel: true,
            uglifyOptions: {
                ie8: false,
                // sourceMap: true, // Enable source maps. Please note that this will slow down the build
                compress: {
                    dead_code: true,
                    warnings: false,
                    properties: true,
                    drop_debugger: true,
                    conditionals: true,
                    booleans: true,
                    loops: true,
                    unused: true,
                    toplevel: true,
                    if_return: true,
                    inline: true,
                    join_vars: true
                },
                output: {
                    comments: false,
                    beautify: false,
                    indent_level: 2
                }
            }
        }),
        // handle the "ahead of time" compilation
        new ngcWebpack.NgcWebpackPlugin({
            disabled: false,
            tsConfig: utils.root('tsconfig-aot.json'),
            resourceOverride: ''
        }),
        // ensure that some options are shared globally by different
        // loaders
        new webpack.LoaderOptionsPlugin({
            // minize code : forces the differents loader to
            // switch to the minimized mode
            minimize: true,
            // production mode
            debug: false
        })
    ]
});
