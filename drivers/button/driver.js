'use strict';

const Group = require('../group');

class ButtonDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = ButtonDriver;
