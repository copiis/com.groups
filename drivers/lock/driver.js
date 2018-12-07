'use strict';

const Group = require('../group');

class LockDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = LockDriver;
