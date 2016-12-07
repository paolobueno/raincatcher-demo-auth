const _ = require('lodash');
var users = require('./data.json');
const shortid = require('shortid');
const hash = require('./hash');
const ATTEMPT_DELAY_MS = 500;
const verifyErrMessage = 'User not found with supplied credentials';

function findById(id) {
  return _.find(users, {id: id});
}
function findByUsername(username) {
  return _.find(users, {username: username});
}

function cloneAndCleanup(user) {
  const cloned = _.clone(user);
  delete cloned.password;
  return cloned;
}

function setUserPassword(user, pwd, cb) {
  hash.saltAndHash(pwd, function(err, hashed) {
    if (err) {
      return cb(err);
    }
    user.password = hashed;
    user.passwordAttempts = 0;
    cb(null, user);
  });
}

/**
 * Helper function to reset underlying collection for testing
 */
exports.setAll = function(arr) {
  users = arr;
};

exports.all = function(cb) {
  return cb(null, _.map(users, cloneAndCleanup));
};

exports.read = function(id, cb) {
  const user = findById(id);
  if (!user) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(user));
};

exports.byUsername = function(username, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(user));
};


exports.create = function(user, cb) {
  user = _.clone(user);
  user.id = shortid.generate();
  setUserPassword(user, user.password, function(err, user) {
    if (err) {
      return cb(err);
    }
    users.push(user);
    cb(null, cloneAndCleanup(user));
  });
};

exports.update = function(id, user, cb) {
  const originalUser = findById(id);
  // avoid updating the password and id on this method
  delete user.id;
  delete user.password;
  _.assign(originalUser, user);
  if (!originalUser) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(originalUser));
};

exports.updatePassword = function(username, oldPwd, newPwd, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error(verifyErrMessage));
  }
  hash.verify(oldPwd, user.password, function(err, match) {
    if (err || !match) {
      return cb(new Error(verifyErrMessage));
    }
    setUserPassword(user, newPwd, function(err, user) {
      if (err) {
        return cb(new Error(verifyErrMessage));
      }
      cb(null, cloneAndCleanup(user));
    });
  });
};

exports.resetPassword = function(username, newPwd, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error(verifyErrMessage));
  }
  setUserPassword(user, newPwd, function(err, user) {
    if (err) {
      return cb(new Error(verifyErrMessage));
    }
    cb(null, cloneAndCleanup(user));
  });
};

function calculateDelay(attempts) {
  return (Math.pow(2, attempts) - 1) * ATTEMPT_DELAY_MS;
}

function doVerify(password, user, cb) {
  // user.password here should be the stored hash
  hash.verify(password, user.password, function(err, match) {
    if (err) {
      return cb(err);
    }
    if (!match) {
      user.passwordAttempts = user.passwordAttempts || 0;
      user.passwordAttempts++;
      cb(new Error(verifyErrMessage), false);
    } else {
      user.passwordAttempts = 0;
      cb(null, true);
    }
  });
}

exports.verifyPassword = function(username, password, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error(verifyErrMessage));
  }
  const delay = calculateDelay(user.passwordAttempts);
  if (delay > 0) {
    setTimeout(doVerify.bind(null, password, user, cb), delay);
  } else {
    doVerify(password, user, cb);
  }
};

exports.delete = function(id, cb) {
  const removed = _.remove(users, {id: id});
  if (!removed.length) {
    return cb(new Error('User not found'));
  }
  cb(null, removed[0]);
};