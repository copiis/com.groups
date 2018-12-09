'use strict';

const Group = require('../group');

class HomeEnergyMonitorDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'homeenergymonitor';
        super.onPair(socket);
    }

}

module.exports = HomeEnergyMonitorDriver;
