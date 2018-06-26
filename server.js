const express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
const app = express();


app.get('/', (req, res) => {
    res.sendfile(path.join(__dirname, ''));
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.json({limit:'50mb'})); 
app.use(bodyParser.urlencoded({extended:false, limit:'50mb'}));


app.use(express.static(path.join(__dirname, '')));


app.listen(3000, () => console.log('Dig n Pick Admin Portal System Listening on port 3000!'));