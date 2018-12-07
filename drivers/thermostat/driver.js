'use strict';

const Group = require('../group');

class ThermostatDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = ButtonDriver;
