'use strict';

const Group = require('/lib/group');

class DoolbellDriver extends Group.Driver {

    onInit( ) {

        this.class = 'doorbell';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = DoolbellDriver;
