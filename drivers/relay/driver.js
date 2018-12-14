'use strict';

const Group = require('/lib/group');

class RelayDriver extends Group.Driver {

    onInit() {
        this.class = 'relay';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = RelayDriver;
