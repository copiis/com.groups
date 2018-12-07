'use strict';

const Group = require('../group');

class HeaterDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HeaterDriver;
