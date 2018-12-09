'use strict';

const Group = require('../group');

class SunshadeDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'sunshade';
        super.onPair(socket);
    }

}

module.exports = SunshadeDriver;
