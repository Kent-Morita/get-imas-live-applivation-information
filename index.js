const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const lineBot = require('./routes/lineBot');

app.set('port', (process.env.PORT || 8000));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({
    verify(req, res, buf) {
        req.rawBody = buf
    }
}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/',lineBot);

app.listen(app.get('port'), function() {
    console.log('Node app is running');
});