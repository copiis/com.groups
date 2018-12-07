'use strict';

const Group = require('../group');

class HomeEnergyMonitorDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HomeEnergyMonitorDriver;
