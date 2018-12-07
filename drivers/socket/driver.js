'use strict';

const Group = require('../group');

class SocketDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SocketDriver;
