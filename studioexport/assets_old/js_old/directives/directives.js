(function(){
    var app = angular.module('ac30WebApp');
    app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            console.log(attrs);
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
    }]);
})();

(function(){
    var app = angular.module('ac30WebApp');
    app.directive('tab', function() {
      return {
        restrict: 'E',
        transclude: true,
        template: '<div role="tabpanel" ng-show="active" ng-transclude></div>',
        require: '^tabset',
        scope: {
            heading: '@',
            ipaddress: '@'
        },
        link: function(scope, elem, attr, tabsetCtrl) {
            scope.active = false;
            tabsetCtrl.addTab(scope);
        }
    }});
})();

(function(){
    var app = angular.module('ac30WebApp');
    app.directive('tabset', function() {
      return {
        restrict: 'E',
        transclude: true,
        scope: { },
        templateUrl: '/assets/templates/tabset.html',
        bindToController: true,
        controllerAs: 'tabset',
        controller: function() {
            var self = this
            self.tabs = []
            self.addTab = function addTab(tab) {
            self.tabs.push(tab)
            if(self.tabs.length === 1) {
                tab.active = true
                }
            }
            self.select = function(selectedTab) {
                angular.forEach(self.tabs, function(tab) {
                if(tab.active && tab !== selectedTab) {
                    tab.active = false;
                }
                })
                selectedTab.active = true;
            }
        }
      }
    });
})();
