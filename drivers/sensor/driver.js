'use strict';

const Group = require('../group');

class SensorDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SensorDriver;
