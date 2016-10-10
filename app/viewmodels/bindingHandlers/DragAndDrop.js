define(['knockout'], function (ko) {

    return {
        install: install
    };


    function install() {

        ko.bindingHandlers.draggableTextContainer = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var allBindings = allBindingsAccessor();
                var scope = ko.unwrap(allBindings.scope) || 'question';


                $(element).parent()
                    .on('dragstart', '.drag-and-drop-text-draggable', function () {
                        $(element).addClass('active');
                    })
                    .on('dragstop', '.drag-and-drop-text-draggable', function () {
                        $(element).removeClass('active');
                        if ($(element).children('.drag-and-drop-text-draggable').length) {
                            $(element).children('.drag-and-drop-text-draggable-container-message').hide();
                        } else {
                            $(element).children('.drag-and-drop-text-draggable-container-message').show();
                        }
                    });

                $(element).droppable({
                    accept: '.drag-and-drop-text-draggable',
                    scope: scope,
                    drop: function (e, ui) {
                        ui.draggable.css('left', '').css('top', '').appendTo(this);
                        var text = ko.dataFor(ui.draggable.get(0));
                        if (text.dropSpot) {
                            text.dropSpot.text(undefined);
                        }
                    }
                });
            }
        };

        ko.bindingHandlers.draggableText = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var allBindings = allBindingsAccessor();
                var scope = ko.unwrap(allBindings.scope) || 'question';
                var $element = $(element);

				$element.css('touch-action','none');
                $element.draggable({
                    scope: scope,
                    revert: 'invalid',
                    appendTo: 'body',
                    helper: 'clone',
                    scroll: false,
                    start: function () {
                        $element.css({ visibility: 'hidden' });
                    },
                    stop: function () {
                        $element.css({ visibility: 'visible' });
                    }
                });
            }
        };


        ko.bindingHandlers.dropspot = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var value = valueAccessor();
                var allBindings = allBindingsAccessor();

                var left = ko.unwrap(value.x);
                var top = ko.unwrap(value.y);
                var scope = ko.unwrap(allBindings.scope) || 'question';

                $('.ui-draggable')
                    .on('dragstart', function (event, ui) {

                        $(element).addClass('active');

                        if ($(element).children('.drag-and-drop-text-draggable').length) {
                            return;
                        }

                        $(element).width(ui.helper.outerWidth());
                        $(element).height(ui.helper.outerHeight());

                    })
                    .on('dragstop', function (event, ui) {
                        $(element).removeClass('active');
                        $(element).css('width', '');
                        $(element).css('height', '');
                    });

                $(element).droppable({
                    accept: function (arg) {
                        if ($(element).find(arg).length) {
                            return true;
                        }

                        return $(element).find('.drag-and-drop-text-draggable').length == 0;
                    },
                    tolerance: 'intersect',
                    scope: scope,
                    drop: function (e, ui) {
                        var text = ko.dataFor(ui.draggable.get(0));

                        ui.draggable.css('left', '').css('top', '').appendTo(this);

                        if (ko.isWriteableObservable(value.text)) {
                            value.text(text);
                            text.dropSpot = value;
                        }
                    }
                });

                $(element).css('left', left + 'px').css('top', top + 'px');
            },
            update: function (element, valueAccessor) {
                var value = valueAccessor();
                var text = ko.unwrap(value.text);

                if (text) {
                    var textHolder = _.find($('.drag-and-drop-text-draggable'), function (element) {
                       return $(element).children().text() == text;
                    });
                    $(textHolder)
                        .addClass('cloned')
                        .clone()
                        .appendTo($(element));
                    // used to load user progress in DnD question type
                } else {
                    if ($(element).children('.cloned').length) {
                        $(element).children('.cloned').remove();
                    }
                    $.each($('.drag-and-drop-text-draggable-container').children(), function () {
                        $(this).removeClass('cloned');
                    })
                    $(element).children('.drag-and-drop-text-draggable').css('left', '').css('top', '')
                        .appendTo($('.drag-and-drop-text-draggable-container'));
                    $(element).children('.drag-and-drop-text-draggable-container-message').hide();
                }
            }
        };




    }

})