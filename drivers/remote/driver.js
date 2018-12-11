'use strict';

const Group = require('/lib/group');

class RemoteDriver extends Group.Driver {

    onInit() {
        this.class = 'remote';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = RemoteDriver;
