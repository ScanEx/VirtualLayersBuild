const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')

const extractCSS = new ExtractTextPlugin('virtual-layers.css')

module.exports = {
    entry: './entry.js',

    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'virtual-layers.js'
    },

    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel', query: { presets: ['es2015'] } },
            { test: /\.css$/, loader: extractCSS.extract(['css']) },
            { test: /\.(png|svg|jpg|ttf|eot|woff|woff2)$/, loader: 'file' }
        ]
    },

    plugins: [
        extractCSS
    ],

    devtool: 'source-map'
}
