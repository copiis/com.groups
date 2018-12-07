'use strict';

const Group = require('../group');

class BlindsDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = BlindsDriver;
