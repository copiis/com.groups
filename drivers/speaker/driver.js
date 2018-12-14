'use strict';

const Group = require('/lib/group');

class SpeakerDriver extends Group.Driver {

    onInit() {
        this.class = 'speaker';
        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }


}

module.exports = SpeakerDriver;
