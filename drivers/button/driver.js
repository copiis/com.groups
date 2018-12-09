'use strict';

const Group = require('../group');

class ButtonDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'button';
        super.onPair(socket);
    }

}

module.exports = ButtonDriver;
