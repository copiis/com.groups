'use strict';

const Group = require('../group');

class CurtainDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'curtain';
        super.onPair(socket);
    }

}

module.exports = CurtainDriver;
