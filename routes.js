const bcrypt = require('bcrypt');
const passport = require('passport');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

module.exports = function (app, myDataBase) {

    app.route('/').get((req, res) => {
        // Change the response to render the Pug template
        res.render('pug', {
          title: 'Connected to Database',
          message: 'Please login',
          showLogin: true,
          showRegistration: true,
          showSocialAuth: true
        });
      });
    
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.render('/profile');
    });
    
    app.route('/auth/github').get(passport.authenticate('github'), (req, res) => {
        res.render('/profile');
    });
    
    app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
        req.session.user_id = req.user.id;
        res.render('/chat');
    });

    app.route('/chat').get(ensureAuthenticated, (req, res) => {
        res.render('/chat.pug', {
            user: req.user
        })
    });

    app.route('/register')
        .post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
        console.log('CAN NOT FIND USER');
        next(err);
        } else if (user) {
        res.redirect('/');
        } else {
        myDataBase.insertOne({
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 12),
        },
            (err, doc) => {
            if (err) {
                res.redirect('/');
            } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
            }
            }
        )
        }
    })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
        res.redirect('/profile');
    }
    );

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        console.log
        res.render('profile', {
            username: req.user.username,
        });
    });

    app.route('/logout').get((req, res) => {
        req.logout(); res.redirect('/');
    });

    app.use((req, res, next) => {
      res.status(404).type('text').send('Not Found');
    });
}
