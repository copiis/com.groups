'use strict';

const Group = require('../group');

class VacuumCleanerDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = ButtonDriver;
