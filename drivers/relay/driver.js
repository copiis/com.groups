'use strict';

const Group = require('../group');

class RelayDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = RelayDriver;
