(function(){
    var app = angular.module('ac30WebApp');
    app.component('paramEditCombobox', {
            // isolated scope binding
            bindings: {
                tag: '<',
                hidename:'<', 
                SelectedItem: '@',
                hostname:'@'
            },
            // Inline template which is binded to message variable
            // in the component controller
            //templateUrl: '/js/components/parameterEnum.html',
            template:`
            <div ng-hide="$ctrl.hidename" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">{{$ctrl.tag}} {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Name}}</div>
            <span ng-hide="$ctrl.IsDisabled" class="fake-input showHandCursor" ng-click="$ctrl.begingEdit()" style="display:inline-block;width:100%" data-toggle="modal" data-target="#modal-combobox-tag{{$ctrl.hostname}}{{$ctrl.tag}}" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">
                {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Value}}
            </span>
            <span ng-show="$ctrl.IsDisabled" class="fake-input" style="display:inline-block;width:100%" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">
                {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Value}} <span class="showHandCursor" title="Drive must be in Config mode to change this parameter">*</span>
            </span>  
            <div id="modal-combobox-tag{{$ctrl.hostname}}{{$ctrl.tag}}" class="modal parameter-edit-modal-sm" style="font-size:1.2em" tabindex="-1" role="dialog">
              <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                      <h4 class="modal-title">Edit Parameter Value</h4>
                    </div>
                    <div class="modal-header">
                        <span style="font-size:14px">{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}</span>
                        <div>
                            <select class="form-control" ng-model="$ctrl.SelectedItem" style="font-size:16px;width:100%" 
                                ng-options="item as item.enum for item in $ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Enums"/>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" ng-click="$ctrl.update(13)" data-dismiss="modal">OK</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
              </div>
            </div>

            `,
            // angular
            controller: function(parameterSvc, $rootScope, $element) {
                this.ParameterDictionary = parameterSvc.ParameterDictionary;
                //this.hostname = "localhost";
                
                this.update = function(keyCode)
                {
                    if(keyCode == 13)
                    { 
                        parameterSvc.SetParameterValue(this.hostname, this.tag, this.SelectedItem.index);
                    }
                    $element.find('#modal-combobox-tag' + this.hostname + this.tag).modal('hide');
                };
                
                this.begingEdit = function(){
                    this.setSelectedItem();
                };
                
                this.setSelectedItem = function()
                {
                    if(this.ParameterDictionary != undefined && this.ParameterDictionary[this.hostname] != undefined && this.ParameterDictionary[this.hostname][this.tag] != undefined)
                    {
                        var obj = this.ParameterDictionary[this.hostname][this.tag].Enums;
                        for (var key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                var enumItem = obj[key];
                                if(this.ParameterDictionary[this.hostname][this.tag].Value != "undefined")
                                {
                                    if(enumItem.enum == this.ParameterDictionary[this.hostname][this.tag].Value)
                                    {
                                        this.SelectedItem = enumItem;
                                    }
                                }
                            }
                        }
                    }                                      
                };
                
                this.$onInit = function() {
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