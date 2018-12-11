'use strict';

const Group = require('../group');

class SensorDriver extends Group.Driver {

    onInit() {
        this.class = 'sensor';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SensorDriver;
