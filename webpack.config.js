const path = require('path')
module.exports = {
    mode: 'development',
    entry:'./public/script/terminal.class.js',
    output:{
        filename:'bundle.js',
        path:path.join(__dirname,'public')
    }
}