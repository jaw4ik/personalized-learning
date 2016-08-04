define(['durandal/composition','knockout'], function (composition, ko) {
    'use strict';
    
    return {
        install: install
    };
    
    function install(){
        ko.bindingHandlers.learningContent = {
            init: function (element, valueAccessor) {
                var $element = $(element),
                    html = valueAccessor();

                var dataType = getLearningContentType(html);

                switch(dataType){
                    case 'hotspot': 
                        var hotspotOnImage = HotspotStorage.create($(html)[0]);
                        
						$element.html(hotspotOnImage.element);
                        $element.addClass('hotspot-container');

						ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
							HotspotStorage.remove(hotspotOnImage);
						});
                        break;
                    default:
                        $element.html(html);
                        return ko.bindingHandlers.wrapElements.init(element, valueAccessor);
                }
            }
        };

        composition.addBindingHandler('learningContent');

        function getLearningContentType(data){
            var $output = $('<output>').html(data),
                dataType = $('[data-type]', $output).attr('data-type');

            return dataType;
        }
    }
});