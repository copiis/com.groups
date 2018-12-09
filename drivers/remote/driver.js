'use strict';

const Group = require('../group');

class RemoteDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'remote';
        super.onPair(socket);
    }

}

module.exports = RemoteDriver;
