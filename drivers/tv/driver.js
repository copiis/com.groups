'use strict';

const Group = require('../group');

class TvDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = TvDriver;
