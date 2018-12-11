'use strict';

const Group = require('../group');

class FanDriver extends Group.Driver {

    onInit() {

        this.class = 'fan';

        super.onInit();
    }
    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = FanDriver;
