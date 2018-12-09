'use strict';

const Group = require('../group');

class LockDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'lock';
        super.onPair(socket);
    }

}

module.exports = LockDriver;
