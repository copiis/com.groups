'use strict';

const Group = require('../group');

class LightDriver extends Group.Driver {

    onInit( ) {

        this.icons = {
            '/app/com.groups/assets/icons/light/a2.svg' : 'icons/a2.svg',
            '/app/com.groups/assets/icons/light/b.svg' : 'icons/b.svg',
            '/app/com.groups/assets/icons/light/e.svg' : 'icons/e.svg',
            '/app/com.groups/assets/icons/light/led.svg' : 'icons/led.svg',
            '/app/com.groups/assets/icons/light/par.svg' : 'icons/par.svg',
            '/app/com.groups/assets/icons/light/gu.svg' : 'icons/gu.svg'
        };

        this.class = 'light';

        super.onInit();

    }

    onPair( socket ) {

        super.onPair(socket);

    }
}

module.exports = LightDriver;
