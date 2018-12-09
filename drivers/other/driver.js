'use strict';

const Group = require('../group');

class OtherDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'other';
        super.onPair(socket);
    }

}

module.exports = OtherDriver;
