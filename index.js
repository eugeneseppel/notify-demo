var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var env = require('./config.js');
var twilio = require('twilio');
var FB = require('fb');
var path    = require("path");

// Create Express Webapp
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Basic health check - check environment variables have been configured
// correctly
app.get('/config', function(request, response) {

  response.render('index.jade',{
    TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
    TWILIO_NOTIFICATION_SERVICE_SID: env.TWILIO_NOTIFICATION_SERVICE_SID,
    FACEBOOK_PAGE_ACCESS_TOKEN: env.FACEBOOK_PAGE_ACCESS_TOKEN
  });

});

function createBinding(opts){
  // Authenticate with Twilio
  var client = new twilio(env.TWILIO_ACCOUNT_SID,  env.TWILIO_AUTH_TOKEN);

  // Get a reference to the user notification service instance
  var service = client.notify.v1.services(env.TWILIO_NOTIFICATION_SERVICE_SID);

    service.bindings.create(opts).then(function(binding) {
      var message = 'Binding created!';
      console.log(message + " " + binding.bindingType);

    }).catch(function(error) {
      var message = 'Failed to create binding: ' + error;
      console.log(message);
    });
}

//Create a binding using device properties
app.post('/register', function(request, response) {
  createBinding({
    identity: request.body.identity,
    endpoint: request.body.endpoint,
    bindingType: request.body.BindingType,
    address: request.body.Address
  });
  response.send({
    message:"Binding created!"
  });
});

//Create a facebook-messenger binding based on the authentication webhook from Facebook
app.post('/messenger_auth', function(request, response) {
  //Extract the request received from Facebook
  var message = request.body.entry[0].messaging[0];

  console.log(message);

  var identity = message.optin.ref;
  var endpoint = 'FBM@' + message.recipient.id + identity;

  //Let's create a new facebook-messenger Binding for our user
  createBinding({
    identity: identity,
    endpoint: endpoint,
    bindingType: 'facebook-messenger',
    address: message.sender.id
  });
  response.send({
    message:"Binding created!"
  });
});

//Verification endpoint for Facebook needed to register a webhook.
app.get('/messenger_auth', function(request, response) {
  console.log(request.query["hub.challenge"]);
  response.send(request.query["hub.challenge"]);
});

function addTag(binding, tag){
  var index = binding.tags.indexOf(tag);
  if (index > -1){
    //Do nothing all is well
  }
  else {
    binding.tags.push(tag);
    console.log("Added tag: " + binding.tags);
  }
};

function removeTag(binding, tag) {
  var index = binding.tags.indexOf(tag);
  if (index > -1){
    binding.tags.splice(index, 1);
    console.log("Removed tag: " + binding.tags);
  } else {
    //Do nothing
  }
}

app.post('/subscribe', function(request,response){
  console.log(request.body);
  var preferred = request.body.preferred;
  var identity = request.body.identity;
  var marketingEnabled = request.body.marketingEnabled;
  var number = request.body.number;

  // Get a reference to the user notification service instance
  var service = new twilio(env.TWILIO_ACCOUNT_SID,  env.TWILIO_AUTH_TOKEN).notify.v1.services(env.TWILIO_NOTIFICATION_SERVICE_SID);
  service.bindings.each({
    identity:identity,
    done:function(){
      console.log("Done");
      response.send({
        message:"Ok"
      });
    }
  }, function(binding, onComplete){
      console.log("Processing binding: " + binding.endpoint);
      console.log("Starting tags: " + binding.tags);

      if (marketingEnabled === "true"){
        addTag(binding, "marketingEnabled");
      } else {
        removeTag(binding, "marketingEnabled");
      }

      if (binding.bindingType === preferred){
        addTag(binding, "preferred");
      } else {
        removeTag(binding, "preferred");
      }
      console.log("Ending tags: " + binding.tags);
      createBinding({
        identity: binding.identity,
        endpoint: binding.endpoint,
        bindingType: binding.bindingType,
        address: binding.address,
        tag: binding.tags
      });
    });
    if (number) {
      console.log("Registering new SMS binding");
      var tags =[];
      if (marketingEnabled === "true"){
        tags.push("marketingEnabled");
      }
      if (preferred === "sms"){
        tags.push("preferred");
      }
      createBinding({
        identity: identity,
        endpoint: "SMS@" + number + identity,
        bindingType: 'sms',
        address: number,
        tag: tags
      });
    }

});

app.get('/bindings', function(request, response) {
  var identity = request.query["Identity"];
  var service = new twilio(env.TWILIO_ACCOUNT_SID,  env.TWILIO_AUTH_TOKEN).notify.v1.services(env.TWILIO_NOTIFICATION_SERVICE_SID);
  service.bindings.list({
    identity:identity
  }).then(function(bindings){
    var result = [];
    bindings.forEach(function(binding){
      result.push({
        endpoint: binding.endpoint,
        bindingType:binding.bindingType,
        address:binding.address,
        tags:binding.tags
      });
    });
    console.log(result);
    response.send(result);
  }).catch(function(error){
    console.log(error);
    response.status(500).send({
      message:"Could not list bindings: " + error
    });
  });
});

// Start HTTP server
var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
