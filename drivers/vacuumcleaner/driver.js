'use strict';

const Group = require('../group');

class VacuumCleanerDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'vacuumcleaner';
        super.onPair(socket);
    }

}

module.exports = VacuumCleanerDriver;
