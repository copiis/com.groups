'use strict';

const Group = require('../group');

class SensorDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'sensor';
        super.onPair(socket);
    }

}

module.exports = SensorDriver;
