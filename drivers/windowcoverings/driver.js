'use strict';

const Group = require('../group');

class WindowCoveringsDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'windowcoverings';
        super.onPair(socket);
    }

}

module.exports = WindowCoveringsDriver;
