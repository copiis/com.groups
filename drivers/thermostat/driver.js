'use strict';

const Group = require('../group');

class ThermostatDriver extends Group.Driver {

    onInit() {
        this.class = 'thermostat';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = ThermostatDriver;
