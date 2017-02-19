(function(){
    var app = angular.module('ac30WebApp');
    app.component('paramEditChkbox', {
            // isolated scope binding
            bindings: {
                tag: '<',
                editedValue: '@',
                hidename:'<', 
                confirmchange: '<',
                alignment: '@',
                hostname:'@'
            },
            template:`
                <div ng-hide="$ctrl.hidename" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">{{$ctrl.tag}} {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Name}}</div>
                <input style="align:left" class="form-control showHandCursor" readonly="readonly" type="checkbox" ng-true-value="'1'" ng-false-value="'0'" ng-model="$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Value" ng-click="$ctrl.update()"/>
            `,
            // angular
            controller: function(parameterSvc, $rootScope, $element) {
                this.ParameterDictionary = parameterSvc.ParameterDictionary;

                this.update = function()
                {
                    if(this.confirmchange)
                    {
                        if (!confirm("Are you sure you want to make this change?")) {
                            this.ParameterDictionary[this.hostname][this.tag].Value = !this.ParameterDictionary[this.hostname][this.tag].Value;
                            return;
                        }
                    }
                    this.editedValue = this.ParameterDictionary[this.hostname][this.tag].Value;
                    parameterSvc.SetParameterValue(this.hostname, this.tag, this.editedValue);
                };
                
                this.$onInit = function() {
                    if(this.confirmchange == undefined)
                    {
                        this.confirmchange = true;
                    }
                    if(this.hostname == undefined)
                    {
                        this.hostname = "localhost";
                    }
                    parameterSvc.AddLiveParameters(this.hostname, this.tag.toString());
                }
                
                this.$doCheck = function () {
                    if(this.ParameterDictionary[this.hostname] != undefined && this.ParameterDictionary[this.hostname][this.tag] != undefined && this.ParameterDictionary[this.hostname][989] != undefined)
                    {
                        if(this.ParameterDictionary[this.hostname][this.tag].WriteQualifier != 0)
                        {
                            this.IsDisabled = this.ParameterDictionary[this.hostname][989].Value == 'OPERATIONAL';
                        }
                    }
                };
            }
        });
})();
