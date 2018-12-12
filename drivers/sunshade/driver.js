'use strict';

const Group = require('/lib/group');

class SunshadeDriver extends Group.Driver {

    onInit() {
        this.class = 'sunshade';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SunshadeDriver;
