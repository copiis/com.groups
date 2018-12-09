'use strict';

const Group = require('../group');

class ThermostatDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'thermostat';
        super.onPair(socket);
    }

}

module.exports = ThermostatDriver;
