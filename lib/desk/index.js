/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var errors = integration.errors;

/**
 * Expose `Desk`
 */

var Desk = module.exports = integration('Desk')
  .retries(2);


/**
 * Initialize.
 *
 * @api private
 */

Desk.prototype.initialize = function(){
  this.siteUrl = 'https://<siteName>.desk.com/api/v2';
};

/**
 * Enabled?
 * 
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Boolean}
 * @api private
 */

Desk.prototype.enabled = function(msg, settings){
  return !! (msg.enabled(this.name) 
    && 'server' == msg.channel());
};


  /**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @api public
 */

Desk.prototype.validate = function (message, settings) {
    return this.ensure(settings.siteName, 'siteName')
    || this.ensure(settings.email, 'email')
    || this.ensure(settings.password, 'password');
};

/**
 * Identifies a user in Desk - checks on external_id and email
 * to prevent duplicates. If the user doesn't exist, create one. 
 * Otherwise, update the existing one. 
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Desk.prototype.identify = function (identify, settings, callback) {
  var url = this.siteUrl.replace(/<siteName>/, settings.siteName);
  var email = identify.email();
  var id = identify.uid(); //falls back to email...
  var self  = this;

  //add some way of checking if id has fallen back to email
  //so that we can skip one of the gets

  this._getUser(url, {external_id : id}, settings, function (err, user) {
    if (err) return callback(err);
    if (!user) {
      self._getUser(url, {email : email}, settings, function (err, user) {
        if (err) return callback(err);
        if (!user) self._createUser(url, identify, settings, callback);
        else self._updateUser(url, user.id, identify, settings, callback);
      })
    }
    else self._updateUser(url, user.id, identify, settings, callback);
  });
};

/**
 * Get a user from the API, searching on external_id and email.
 *
 * @param  {String}   url
 * @param  {Object}   query
 * @param  {Object}   settings
 * @param  {Function} callback (err, user)
 * @api private
 */

Desk.prototype._getUser = function (url, searchParams, settings, callback) {
  return this
    .get(url + '/customers/search')
    .auth(settings.email, settings.password)
    .set('Accept', 'application/json')
    .query(searchParams)
    .end(this.handle(function(err, res){
      if (err) return callback(err);
      if (res.body.total_entries == 0) return callback(err);
      //This feels a bit hacks... not sure how to fix that
      callback(null, res.body._embedded.entries[0]);
    }));
};

/**
 * Updates the user in Desk with the new identify
 *
 * @param  {String}   url
 * @param  {String}   id (Desk's id)
 * @param  {Facade}   identify
 * @param  {Object}   settings
 * @param  {Function} callback  (err, user)
 * @api private
 */

Desk.prototype._updateUser = function (url, id, identify, settings, callback) {
  return this
    .patch(url + '/customers/' + id )
    .auth(settings.email, settings.password)
    .set('Accept', 'application/json')
    .send(formatTraits(identify))
    .end(this.handle(callback));
};

/**
 * Creates a user in Desk
 *
 * @param {String}   url
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Desk.prototype._createUser = function (url, identify, settings, callback) {
  return this
    .post(url + '/customers')
    .auth(settings.email, settings.password)
    .set('Accept', 'application/json')
    .send(formatTraits(identify))
    .end(this.handle(callback));
};

/**
 * Map the Desk traits
 *
 * @param  {Facade.Identify} identify
 * @return {Object}
 * @api private
 */

function formatTraits (identify) {


  var traits = { 
    external_id    : identify.proxy('traits.userId'), 
    avatar         : identify.proxy('traits.avatar'),
    title          : identify.proxy('traits.title'),
    description    : identify.proxy('traits.background'),
    first_name     : identify.firstName(),
    last_name      : identify.lastName(),
    emails         : [{ type : 'other', value : identify.email() }],
    addresses      : [{ type : 'other', value : identify.proxy('traits.address') }],
    phone_numbers  : [{ type : 'other', value : identify.proxy('traits.phone') }],
    emails_update_action        : 'replace',
    addresses_update_action     : 'replace',
    phone_numbers_update_action : 'replace'
  };

  return traits;
};