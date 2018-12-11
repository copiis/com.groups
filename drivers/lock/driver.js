'use strict';

const Group = require('../group');

class LockDriver extends Group.Driver {

    onInit() {

        this.class = 'lock';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = LockDriver;
