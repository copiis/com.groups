'use strict';

const Group = require('/lib/group');

class CurtainDriver extends Group.Driver {

    onInit( ) {

        this.class = 'curtain';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = CurtainDriver;
