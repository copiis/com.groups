'use strict';

const Group = require('/lib/group');

class OtherDriver extends Group.Driver {

    onInit() {
        this.class = 'other';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = OtherDriver;
