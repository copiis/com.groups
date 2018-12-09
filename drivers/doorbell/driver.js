'use strict';

const Group = require('../group');

class DoolbellDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'doorbell';
        super.onPair(socket);
    }

}

module.exports = DoolbellDriver;
