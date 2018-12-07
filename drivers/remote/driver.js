'use strict';

const Group = require('../group');

class RemoteDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = RemoteDriver;
