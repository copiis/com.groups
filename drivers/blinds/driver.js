'use strict';

const Group = require('/lib/group');

class BlindsDriver extends Group.Driver {

    onInit( ) {

        this.class = 'blinds';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = BlindsDriver;
