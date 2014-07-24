var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var desk = new integrations['Desk']()
  , settings  = auth['Desk'];


describe('Desk', function () {

    beforeEach(function() {
      desk = new integrations['Desk']();
      settings = auth['Desk'];
    })

  describe('.validate()', function () {

    it('should require an email', function () {
      var identify = helpers.identify();
      desk.validate(identify, { password : 'xxx', siteName : 'us1' }).should.be.an.instanceOf(Error);
      desk.validate(identify, { email : '', password : 'xxx', siteName : 'us1' }).should.be.an.instanceOf(Error);
    });

    it('should require an password', function () {
      var identify = helpers.identify();
      desk.validate(identify, { email : 'xxx', siteName : 'us1' }).should.be.an.instanceOf(Error);
      desk.validate(identify, { email : 'xxx', password : '', siteName : 'us1' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteName', function () {
      var identify = helpers.identify();
      desk.validate(identify, { email : 'xxx', password : 'xxx' }).should.be.an.instanceOf(Error);
      desk.validate(identify, { email : 'xxx', password : 'xxx', siteName : '' }).should.be.an.instanceOf(Error);
    });

    it('should validate with an email, password, and sitename', function () {
      should.not.exist(desk.validate({}, { email : 'xxx', password : 'xxx', siteName : 'us1' }));
    });
  });

  describe('.identify()', function () {
    
    this.timeout(10000);
    
    var identify = helpers.identify()
      , query   = { email : identify.email()};

    it('should be able to identify a new user', function (done) {
      desk.identify(identify, settings, function(err, res){
        if (err) return done(err);
        res.body.emails[0].value.should.eql(identify.email());
        done();
      });
    });

    it('should be able to identify an existing Segment and Desk user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io', userId : '2i4jtg1' });
      desk.identify(identify, settings, done);
    });

    it('should be able to identify an existing Desk user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io', userId : '' });
      desk.identify(identify, settings, done);
    });
  });

  describe('._getUser()', function () {
    
    this.timeout(10000);
    
    var identify = helpers.identify();

    it('should error on invalid auth details', function (done) {
      var email    = 'calvin@segment.io';
      var settings = { email : email, password : 'xxx', siteName : 'blah' };
      desk._getUser({ email : email }, settings, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      desk._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      var email = 'calvin@segment.io';
      desk._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.first_name.should.eql(identify.firstName());
        user.last_name.should.eql(identify.lastName());
        done();
      });
    });
  });

  describe('._createUser()', function() {
    
    this.timeout(10000);
    
    var identify = helpers.identify();

    it('should create a new user', function (done) {
      desk._createUser(identify, settings, done);
      desk._getUser({ email : identify.email() }, settings, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.first_name.should.eql(identify.firstName());
        user.last_name.should.eql(identify.lastName());
        done();
      });
    });
  });

  describe('._updateUser()', function() {
    
    this.timeout(10000);
    
    var identify = helpers.identify();
    var id = identify.uid();

    it('should update an existing user', function (done) {
      var identify = helpers.identify();
      desk._updateUser(237469071, identify, settings, done);
      desk._getUser({external_id : id}, settings, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.first_name.should.eql(identify.firstName());
        user.last_name.should.eql(identify.lastName());
        done();
      });
    });
  });

  describe('.track()', function () {
    it('should do nothing on track', function (done) {
      desk.track(helpers.track(), settings, done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing on alias', function (done) {
      desk.alias(helpers.alias(), settings, done);
    });
  });
});