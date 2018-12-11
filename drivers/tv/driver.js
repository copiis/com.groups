'use strict';

const Group = require('/lib/group');

class TvDriver extends Group.Driver {

    onInit() {
        this.class = 'tv';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = TvDriver;
