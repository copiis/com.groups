'use strict';

const Group = require('../group');

class KettleDriver extends Group.Driver {

    onPair( socket ) {

        this.icons = {};
        this.class = 'kettle';
        super.onPair(socket);
    }

}

module.exports = KettleDriver;
