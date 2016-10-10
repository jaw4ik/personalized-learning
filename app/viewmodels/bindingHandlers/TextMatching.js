define(['knockout'], function (ko) {

    return {
        install: install
    }

    function install() {

        ko.bindingHandlers.draggable = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var
                    allBindings = allBindingsAccessor()
                ;
				
				$(element).css('touch-action','none');
                $(element).draggable({
                    appendTo: '.application',
                    containment: 'body',
                    helper: function () {
                        return $(element)
                            .clone()
                            .addClass('handle')
                            .css({
                                width: $(this).outerWidth(),
                                height: $(this).outerHeight()
                            });
                    },
                    scope: ko.unwrap(allBindings.scope) || 'default',
                    tolerance: 'pointer',
                    revert: true,
                    revertDuration: 0,
                    start: function () {
                        $(element).hide();
                    },
                    stop: function () {
                        $(element).show();
                    }
                });
            }
        }


        ko.bindingHandlers.droppable = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var
                    value = valueAccessor(),
                    allBindings = allBindingsAccessor()
                ;

                $(element).droppable({
                    accept: function (arg) {
                        if ($(element).find(arg).length) {
                            return true;
                        }

                        if (allBindings.accept) {
                            return allBindings.accept > $(element).find('.ui-draggable').length;
                        }

                        return $(arg).hasClass('ui-draggable');
                    },
                    activeClass: 'active',
                    hoverClass: 'hover',
                    scope: ko.unwrap(allBindings.scope) || 'default',
                    tolerance: 'pointer',
                    drop: function (event, ui) {

                        ui.draggable.trigger('dragstop');

                        var draggable = ko.dataFor(ui.draggable.get(0));
                        var droppable = ko.dataFor(ui.draggable.closest('.ui-droppable').get(0));

                        if (droppable != value) {
                            if (_.isFunction(value.acceptValue)) {
                                value.acceptValue(draggable);
                            }

                            if (_.isFunction(droppable.rejectValue)) {
                                droppable.rejectValue(draggable);
                            }
                        }
                    }
                });

            }
        }
    }

})