'use strict';

const Group = require('../group');

class GarageDoorDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = GarageDoorDriver;
