'use strict';

const Group = require('../group');

class LightDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = LightDriver;
