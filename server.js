var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var jwt    = require('jsonwebtoken');
var config = require('./config');

var port = process.env.PORT || 8080;
var accountsModel   = require('./app/models/accounts.js');
var apiRoutes = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('superSecret', config.secret);
app.use(morgan('dev'));

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  // find the user
  accountsModel.findOne({
    name: req.query.name
  },
    function(err, user) {
      if (err) throw err;
      if (!user) {
        res.json({ success: false, message: 'Authentication failed. User not found.' });
      } else if (user) {
      // check if password matches
      if (user.password != req.query.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 60 // expires in 1min
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }

  });
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});

// basic route
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Hello world!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  accountsModel.find({}, function(err, users) {
    res.json(users);
  });
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// start the server
app.listen(port);
console.log('Server runnint at http://localhost:' + port);


//connect to mongo
function connectToMongo(callback) {
  mongoose.connect('mongodb://user:pass@ds015720.mlab.com:15720' +'/'+ 'dv2', {}, function (err) {
    if (err)
      console.log('Error connecting to mongo demoshipdbatabase: ', err);
    else {
      console.log('Successfully connected to mongo');
    }
    return callback(err);
  });
}

function main() {
  console.log('Starting cron');
    connectToMongo(
      function (err) {
        if (err)
          console.log('Fatal Error in connecting to mongo. Shutting Down');
        else {
          console.log('Connected');
        }
      }
    );
}

main();