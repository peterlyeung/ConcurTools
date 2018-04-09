'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const https = require('https') // needed for Vault over SSL
const request = require('request')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const querystring = require('querystring');	// added to help with query string construction. need to define in package.json.
const concur = require('concur-platform');

app.use(compression())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(awsServerlessExpressMiddleware.eventContext())

//--------------------------------------------------------------------------------------------------------------------------------
// ROUTES
//--------------------------------------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.sendfile('views/index.html');
})


app.get('*/ListItemExport.html' , function(req,res) {
   res.sendfile('views/ListItemExport.html');
})

app.post('*/genauthtoken' , function(req,res) {

    console.log('In /genauthtoken.....')
    console.log('username: ' + req.body.username);
    console.log('password: ' + req.body.password);
    console.log('consumerkey: ' + req.body.consumerkey);
    // remap request to options
    var options = {
        username:req.body.username,
        password:req.body.password,
        consumerKey:req.body.consumerkey
    }

    // Concur OAuth
    concur.oauth.native(options)
    .then(function(token) {
        // token will contain the value, instanceUrl, refreshToken, and expiration details
        console.log(JSON.stringify(token));
        //storageService.set('oauthtoken',token.value);
        res.write(JSON.stringify({
         "oauthtoken": token.value,
        }));
        res.status(200);
        res.end();
    })
    .fail(function(error) {
      // error will contain the error message returned
      console.log(error);
    });
});



//--------------------------------------------------------------------------------------------------------------------------------
// Retrieve ListsItems
//--------------------------------------------------------------------------------------------------------------------------------
app.post('*/listitems', function(req, res) {

  //console.log('request body session id:' + JSON.stringify(req));
  ///console.log('headers: ' + JSON.stringify(req.headers));
  console.log('listID: ' + req.body.ListID);
  console.log('Authorization OAuth: ' + req.body.oauthtoken);
  var options = {
    oauthToken:req.body.oauthtoken,
    limit:100,
    // Concur's SDK document is incorrect. After tracing through this, you have to put listId into queryParameters
    queryParameters:{
       listId:req.body.ListID//'gWtc4Kq4UUkH7kGsuJ$pPnlrZPUk1yLzuj0A' //
    }
  };
  console.log('queryParameters: ' +JSON.stringify(options.queryParameters));

  concur.listItems.get(options)
  .then(function(data) {

     res.write(JSON.stringify({
      "data": data
     }));
     res.status(200);
     res.end();

  })
  .fail(function(error) {
    // Error will contain the error returned.
    console.log(JSON.stringify(error,null,4));
  });

});

//--------------------------------------------------------------------------------------------------------------------------------
// Retrieve Lists
//--------------------------------------------------------------------------------------------------------------------------------
app.post('*/lists', function(req, res) {

  //console.log('request body session id:' + JSON.stringify(req));
  console.log('headers: ' + JSON.stringify(req.headers));
  console.log('parameters: ' + JSON.stringify(req.param));
  console.log('Authorization OAuth: ' + req.body.oauthtoken);
  var options = {
    oauthToken:req.body.oauthtoken,
    limit:100,
    // Concur's SDK document is incorrect. After tracing through this, you have to put listId into queryParameters
    // queryParameters:{
    //   listId:this.listId
    // }
  };

  // The below doesn't work.  Seems to only return the same airline list no matter which list id is passed.
  // will try direct HTTP call instead
  concur.lists.get(options)
  .then(function(data) {

     res.write(JSON.stringify({
      "data": data
     }));
     res.status(200);
     res.end();

  })
  .fail(function(error) {
    // Error will contain the error returned.
    console.log(JSON.stringify(error,null,4));
  });

});


// The aws-serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)

// Export your express server so you can import it in the lambda function.
module.exports = app
