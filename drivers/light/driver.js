'use strict';

const Group = require('/lib/group');

class LightDriver extends Group.Driver {

    onInit() {

        this.class = 'light';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = LightDriver;
