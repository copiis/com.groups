'use strict';

const Group = require('../group');

class HeaterDriver extends Group.Driver {


    onInit( ) {

        super.onInit();

        this.icons = {
            '/app/com.groups/assets/icons/heater/oil.svg' : this.appRoot + 'icons/oil.svg'
        };

        this.class = 'heater';



    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HeaterDriver;
