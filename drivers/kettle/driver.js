'use strict';

const Group = require('../group');

class KettleDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = KettleDriver;
