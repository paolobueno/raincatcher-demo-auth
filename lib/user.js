'use strict';

const memoryStore = require('./userMemoryStore');

/**
 * Mediator listener for the user module, manipulates 'wfm:user:*' mediator topics
 * @param  {Mediator} mediator a mediator instance to publish/subscribe to
 * @param  {Store} store    Compatible store implemetation, defaults to {@link ./userMemoryStore}
 */
module.exports = function(mediator, store) {
  store = store || memoryStore;
  var topicList = 'wfm:user:list';
  console.log('Subscribing to mediator topic:', topicList);
  mediator.subscribe(topicList, function() {
    store.all(function(err, users) {
      if (err) {
        return mediator.publish('error:' + topicList, users);
      }
      mediator.publish('done:' + topicList, users);
    });
  });

  var topicLoad = 'wfm:user:read';
  console.log('Subscribing to mediator topic:', topicLoad);
  mediator.subscribe(topicLoad, function(id) {
    store.find(id, function(err, user) {
      if (err) {
        return mediator.publish('error:' + topicLoad + ':' + id, 'No such user');
      }
      mediator.publish('done:' + topicLoad + ':' + id, user);
    });
  });

  var topicUsernameLoad = 'wfm:user:username:read';
  console.log('Subscribing to mediator topic:', topicUsernameLoad);
  mediator.subscribe(topicUsernameLoad, function(username) {
    store.byUsername(username, function(err, user) {
      if (err) {
        return mediator.publish('error:' + topicUsernameLoad + ':' + username, 'No such user');
      }
      mediator.publish('done:' + topicUsernameLoad + ':' + username, user);
    });
  });

  var topicSave = 'wfm:user:update';
  console.log('Subscribing to mediator topic:', topicSave);
  mediator.subscribe(topicSave, function(user) {
    const id = user.id;
    store.update(user.id, user, function(err, user) {
      if (err) {
        return mediator.publish('error:' + topicSave + ':' + id, 'No such user');
      }
      mediator.publish('done:' + topicSave + ':' + id, user);
    });
  });

  var topicCreate = 'wfm:user:create';
  console.log('Subscribing to mediator topic:', topicCreate);
  mediator.subscribe(topicCreate, function(user) {
    store.create(user, function(err, user) {
      const id = user.id;
      if (err) {
        return mediator.publish('error:' + topicCreate + ':' + id, 'No such user');
      }
      mediator.publish('done:' + topicCreate + ':' + id, user);
    });
  });

  var topicAuth = 'wfm:user:auth';
  console.log('Subscribing to mediator topic:', topicAuth);
  mediator.subscribe(topicAuth, function(data) {
    store.verifyPassword(data.username, data.password, function(err, passwordCorrect) {
      if (err) {
        return mediator.publish('error:' + topicAuth + ':' + data.username, 'User not found');
      }
      mediator.publish('done:' + topicAuth + ':' + data.username, passwordCorrect);
    });
  });

  var topicPasswordEdit = 'wfm:user:password';
  console.log('Subscribing to mediator topic:', topicPasswordEdit);
  mediator.subscribe(topicPasswordEdit, function(data) {
    store.updatePassword(data.username, data.oldPwd, data.newPwd, function(err, user) {
      if (err) {
        return mediator.publish('error:' + topicPasswordEdit + ':' + data.username, 'User not found');
      }
      mediator.publish('done:' + topicPasswordEdit + ':' + data.username, user);
    });
  });

  var topicDelete = 'wfm:user:delete';
  console.log('Subscribing to mediator topic:', topicSave);
  mediator.subscribe(topicDelete, function(user) {
    const id = user.id;
    store.delete(user, function(err, removed) {
      if (err) {
        return mediator.publish('error:' + topicDelete + ':' + id, 'No such user');
      }
      mediator.publish('done:' + topicDelete + ':' + id, removed);
    });
  });

};
