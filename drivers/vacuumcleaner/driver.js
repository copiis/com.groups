'use strict';

const Group = require('/lib/group');

class VacuumCleanerDriver extends Group.Driver {

    onInit() {
        this.class = 'vacuumcleaner';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = VacuumCleanerDriver;
