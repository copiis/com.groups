'use strict';

const Group = require('../group');

class GarageDoorDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'garagedoor';
        super.onPair(socket);
    }

}

module.exports = GarageDoorDriver;
