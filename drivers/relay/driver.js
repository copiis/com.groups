'use strict';

const Group = require('../group');

class RelayDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'relay';
        super.onPair(socket);
    }

}

module.exports = RelayDriver;
