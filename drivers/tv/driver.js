'use strict';

const Group = require('../group');

class TvDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'tv';
        super.onPair(socket);
    }

}

module.exports = TvDriver;
