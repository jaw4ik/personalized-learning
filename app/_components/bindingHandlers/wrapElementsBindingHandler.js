define(['knockout'], function (ko) {

    return {
        install: install
    };
    function install() {
        ko.bindingHandlers.wrapElements = {
            init: function (element) {
                
                $("table", element).each(function () {
                    var $self = $(this);
                    $self.wrap('<div class="table-wrapper">');
                    var $wrapper = $self.parent('');
                    var align = $self.attr('align');
                    $wrapper.css('float', align);
                });
                
                $("img", element).each(function () {
                    var $self = $(this),
                        $wrapper = $('<div class="image-wrapper">').css('float', $self.css('float'));

                    if ($self.closest('.cropped-image').length > 0) {
                        return;
                    }

                    $self.wrap($wrapper);
                    $self.height('auto');
                });

            }
        }
    }
})