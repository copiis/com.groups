'use strict';

const Group = require('../group');

class FanDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'fan';
        super.onPair(socket);
    }

}

module.exports = FanDriver;
