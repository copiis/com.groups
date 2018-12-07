'use strict';

const Group = require('../group');

class DoolbellDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = DoolbellDriver;
