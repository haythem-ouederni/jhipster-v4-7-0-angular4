const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const utils = require('./utils.js');

module.exports = (options) => {
    const DATAS = {
        VERSION: `'${utils.parseVersion()}'`,
        DEBUG_INFO_ENABLED: options.env === 'development',
        WEBPACK_BUNDLE_ANALYZER_ACTIVE: options.webpackBundleAnalyzerActive
    };

    // define the needed plugins
    let plugins = [
        new webpack.DefinePlugin({
            // define the NODE_ENV environment variable
            'process.env': {
                'NODE_ENV': JSON.stringify(options.env)
            }
        }),
        // Put the polyffils within a commun separate file
        new webpack
            .optimize
            .CommonsChunkPlugin({name: 'polyfills', chunks: ['polyfills']}),
        // put all the external modules/librairies used by the "main" entry and its
        // children within a single "vendor" chunk/file 
        new webpack
            .optimize
            .CommonsChunkPlugin({
                name: 'vendor',
                chunks: ['main'],
                minChunks: module => utils.isExternalLib(module)
            }),
        // put all the commun modules between the polyfills and vendor chunks
        // within the polyfills chunk
        new webpack
            .optimize
            .CommonsChunkPlugin({
                name: ['polyfills', 'vendor'].reverse()
            }),
        // extract webpack's boilerplate within a separate chunk
        new webpack
            .optimize
            .CommonsChunkPlugin({name: ['manifest'], minChunks: Infinity}),
        /**
         * See: https://github.com/angular/angular/issues/11580
         */
        new webpack.ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, utils.root('src/main/webapp/app'), {}),
        // copy some files to the output directory target/www
        new CopyWebpackPlugin([
            {
                from: './node_modules/core-js/client/shim.min.js',
                to: 'core-js-shim.min.js'
            }, {
                from: './node_modules/swagger-ui/dist/css',
                to: 'swagger-ui/dist/css'
            }, {
                from: './node_modules/swagger-ui/dist/lib',
                to: 'swagger-ui/dist/lib'
            }, {
                from: './node_modules/swagger-ui/dist/swagger-ui.min.js',
                to: 'swagger-ui/dist/swagger-ui.min.js'
            }, {
                from: './src/main/webapp/swagger-ui/',
                to: 'swagger-ui'
            }, {
                from: './src/main/webapp/favicon.ico',
                to: 'favicon.ico'
            }, {
                from: './src/main/webapp/manifest.webapp',
                to: 'manifest.webapp'
            },
            // { from: './src/main/webapp/sw.js', to: 'sw.js' },
            {
                from: './src/main/webapp/robots.txt',
                to: 'robots.txt'
            }
        ]),
        // define some global variables to be used by the app.
        // you will still need add "imports" for the following modules
        // because typescript doesn't recognize undeclared variables 
        new webpack.ProvidePlugin({$: "jquery", jQuery: "jquery", _: "lodash"}),
        // Merge the internationaliation json files by language => all the english json file
        // within en.json, all the french json files within fr.json, ...
        new MergeJsonWebpackPlugin({
            output: {
                groupBy: [
                    {
                        pattern: "./src/main/webapp/i18n/en/*.json",
                        fileName: "./i18n/en.json"
                    }, {
                        pattern: "./src/main/webapp/i18n/fr/*.json",
                        fileName: "./i18n/fr.json"
                    }
                    // jhipster-needle-i18n-language-webpack - JHipster will add/remove languages in
                    // this array
                ]
            }
        }),
        // Generate the final index.html file that contains the injection
        // of the assets (scripts) within the body tag. The injected assets are ordered
        // based on their depency.
        new HtmlWebpackPlugin({template: './src/main/webapp/index.html', chunksSortMode: 'dependency', inject: 'body'}),
        // used by the rule manipulating the app.constants.ts
        new StringReplacePlugin()
    ];

    // add the Bundle Analyer plugin if needed
    if (DATAS.WEBPACK_BUNDLE_ANALYZER_ACTIVE) {
        plugins.push(new BundleAnalyzerPlugin({analyzerMode: 'static', reportFilename: '../bundle-report.html'}));
    }

    return {
        resolve: {
            // Automatically resolve imports to 'ts' and 'js' files. It allows leaving extension when importing.
            extensions: [
                '.ts', '.js'
            ],
            // Tell the resolver where to look for the modules
            modules: ['node_modules']
        },
        stats: {
            // Limits the displayed bundle information when running webpack : children/sub logs not displayed
            children: false
        },
        module: {
            rules: [
                // inject the jQuery variable to bootstrap's javascript as it depends on it
                {
                    test: /bootstrap\/dist\/js\/umd\//,
                    loader: 'imports-loader?jQuery=jquery'
                }, 
                // Export html files' content as strings except for the index.html file
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                        caseSensitive: true,
                        removeAttributeQuotes: false,
                        minifyJS: false,
                        minifyCSS: false
                    },
                    exclude: ['./src/main/webapp/index.html']
                }, 
                // Copy the files matching the regex in the test (images, fonts,...)
                // into the "content" directory within the destination directory
                // ("target/www"), replace their name with a hash and
                // adapt the code to this modification
                {
                    test: /\.(jpe?g|png|gif|svg|woff2?|ttf|eot)$/i,
                    loaders: ['file-loader?hash=sha512&digest=hex&name=content/[hash].[ext]']
                }, 
                // Copy manifest.webapp into the destination directory ("target/www")
                // and load images refereced in the icons and splash_screen
                // fields within the file
                {
                    test: /manifest.webapp$/,
                    loader: 'file-loader?name=manifest.webapp!web-app-manifest-loader'
                }, 
                // Generate the app.constants.js file based on app.constants.ts file
                // and replace the comments matching the regex with code
                // For example : 
                // /* @toreplace VERSION */
                // becomes
                // VERSION = 1
                {
                    test: /app.constants.ts$/,
                    loader: StringReplacePlugin.replace({
                        replacements: [
                            {
                                pattern: /\/\* @toreplace (\w*?) \*\//ig,
                                replacement: (match, p1, offset, string) => `_${p1} = ${DATAS[p1]};`
                            }
                        ]
                    })
                },
                // inquire the right <base> value depending on the context
                {
                    test: /index.html$/,
                    loader: StringReplacePlugin.replace({
                        replacements: [
                            {
                                pattern: /@base@/g,
                                replacement: (match, p1, offset, string) => {
                                    return DATAS.DEBUG_INFO_ENABLED ? './' : '/jhipster-angular/';
                                }
                            }
                        ]
                    })
                }
            ]
        },
        plugins: plugins
    };
};
