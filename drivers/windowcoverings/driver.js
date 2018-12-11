'use strict';

const Group = require('../group');

class WindowCoveringsDriver extends Group.Driver {

    onInit() {
        this.class = 'windowcoverings';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = WindowCoveringsDriver;
