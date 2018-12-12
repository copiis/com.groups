'use strict';

const Group = require('/lib/group');

class HomeEnergyMonitorDriver extends Group.Driver {

    onInit() {

        this.class = 'homeenergymonitor';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HomeEnergyMonitorDriver;
