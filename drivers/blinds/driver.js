'use strict';

const Group = require('../group');

class BlindsDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'blinds';
        super.onPair(socket);
    }

}

module.exports = BlindsDriver;
