'use strict';

const Group = require('../group');

class GarageDoorDriver extends Group.Driver {

    onInit() {

        this.class = 'garagedoor';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = GarageDoorDriver;
