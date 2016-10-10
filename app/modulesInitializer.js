define(['loader', 'eventManager', 'Q', '_', 'progressContext', 'userContext'],
    function (loader, eventManager, Q, _, progressContext, userContext) {

        "use strict";

        var modulesConfigs = [],
            modulesManager = {
                register: register,
                init: init
            };

        return modulesManager;

        function register(config) {
            if (_.isNull(config) || _.isUndefined(config)) {
                return;
            }

            if (!_.isObject(config)) {
                throw "Configuration parameter should be an object.";
            }

            modulesConfigs = config;
        }

        function init() {
            var moduleIds = _.keys(modulesConfigs);
            var modulesCount = moduleIds.length;
            var moduleId;
            var promises = [];

            
            for (var i = 0; i < modulesCount; i++) {
                moduleId = moduleIds[i];
                
                if (_moduleHasToBeLoaded(moduleId, modulesConfigs[moduleId])) {
                    promises.push(loader.loadModule(moduleId).then(onModuleLoaded).fail(onModuleLoadingFailed));
                }
            }

            return Q.allSettled(promises);
        }

        function onModuleLoaded(module) {
            return Q.fcall(function () {
                if (_.isFunction(module.initialize)) {
                    module.initialize(modulesConfigs[module.__moduleId__]);
                }
                if (_.isFunction(module.courseFinished)) {
                    eventManager.subscribeForEvent(eventManager.events.courseFinished).then(module.courseFinished);
                }
                if (_.isObject(module.userInfoProvider)) {
                    userContext.use(module.userInfoProvider);
                }
                if (_.isObject(module.progressProvider)) {
                    progressContext.use(module.progressProvider);
                }
                
            });
        }

        function onModuleLoadingFailed(error) {
            console.error('Cannot load module"' + error.modulePath + '". because of next error "' + error.message + '".');
        }

        function _moduleHasToBeLoaded(moduleId, moduleConfig) {
            // if config is not defined, module will be skiped
            if (_.isNull(moduleConfig) || _.isUndefined(moduleConfig)) {
                return false;
            }

            if (_.isBoolean(moduleConfig)) {
                return moduleConfig;
            }

            if (!_.isObject(moduleConfig)) {
                throw 'Configuration parameter for module  ' + moduleId + ' has to be an object or boolean.';
            }

            if (_.isBoolean(moduleConfig['enabled'])) {
                return moduleConfig['enabled'];
            }

            return true;
        }
    }
);