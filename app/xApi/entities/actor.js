define(['../guard', './object'], function (guard, ObjectEntity) {
    "use strict";

    function Actor(spec) {

        spec.objectType = 'Agent';

        ObjectEntity.call(this, spec);

        if(spec.account) {
            guard.throwIfNotString(spec.account.homePage, 'You should provide homePage for Actor account');
            guard.throwIfNotString(spec.account.name, 'You should provide name for Actor account');
            this.account = {
                homePage: spec.account.homePage,
                name: spec.account.name
            };
        } else {
            guard.throwIfNotMbox(spec.mbox, 'You should provide mbox identity for Actor');
            this.mbox = spec.mbox;
        }
        this.name = spec.name;
    }

    return Actor;
});