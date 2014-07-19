var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var desk = new integrations['Desk']()
  , settings  = auth['Desk'];


describe('Desk', function () {

  describe('.enabled()', function () {
    it('should only be enabled for all messages', function () {
      desk.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      desk.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      desk.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    beforeEach(function() {
      desk = new integrations['Desk']();
      settings = auth['Desk'];
    })

    it('should require an apiKey', function () {
      var identify = helpers.identify();
      desk.validate(identify, { siteName : 'us1' }).should.be.an.instanceOf(Error);
      desk.validate(identify, { apiKey : '', siteName : 'us1' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteName', function () {
      var identify = helpers.identify();
      desk.validate(identify, { apiKey : 'xxx' }).should.be.an.instanceOf(Error);
      desk.validate(identify, { apiKey : 'xxx', siteName : '' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings and email address', function () {
      should.not.exist(desk.validate({}, { apiKey : 'xxx', siteName : 'us1' }));
    });
  });

  describe('.track()', function () {
    it('should do nothing on track', function (done) {
      desk.track(helpers.track(), settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify()
      , query   = { email : identify.email()};

    it('should be able to identify a new user', function (done) {
      desk.identify(identify, settings, function(err, res){
        if (err) return done(err);
        res.body.item.emails[0].value.should.eql(identify.email());
        done();
      });
    });

    it('should be able to identify an existing Segment and Desk user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io', userId : 'mkw4jfn' });
      desk.identify(identify, settings, done);
    });

    it('should be able to identify an existing Desk user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io', userId : '' });
      desk.identify(identify, settings, done);
    });
  });

  describe('._getUser()', function () {

    it('should error on an invalid key', function (done) {
      var apiKey = { api_key : 'segment' }
        , email    = 'calvin@segment.io';
      desk._getUser({ email : email }, apiKey, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      var apiKey = {"api_key" : settings.apiKey};
      desk._getUser({ email : email }, apiKey, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io' })
      var email = identify.email();
      var apiKey = {"api_key" : settings.apiKey};
      desk._getUser({ email : email }, apiKey, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.firstName.should.eql(identify.firstName());
        user.lastName.should.eql(identify.lastName());
        done();
      });
    });
  });


  describe('.alias()', function () {
    it('should do nothing on alias', function (done) {
      desk.alias(helpers.alias(), settings, done);
    });
  });
});