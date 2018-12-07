'use strict';

const Group = require('../group');

class FanDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = FanDriver;
