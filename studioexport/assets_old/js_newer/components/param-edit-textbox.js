(function(){
    var app = angular.module('ac30WebApp');
    app.component('paramEditTextbox', {
            // isolated scope binding
            bindings: {
                tag: '<',
                editedValue: '@',
                hidename:'<', 
                hideunits: '<',
                hostname:'@',
                stepsize: '@'
            },
            // Inline template which is binded to message variable
            // in the component controller
            //templateUrl: '/js/components/parameterEnum.html',
            template:`
            <div ng-hide="$ctrl.hidename" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">{{$ctrl.tag}} {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Name}}</div>
            <span ng-hide="$ctrl.hideunits" class="fake-input showHandCursor" ng-click="$ctrl.begingEdit()" style="display:inline-block;width:100%" data-toggle="modal" data-target="#modal-textbox-tag{{$ctrl.hostname}}{{$ctrl.tag}}" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">
                {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].ValueAndUnits}}
            </span> 
            <span ng-show="$ctrl.hideunits" class="fake-input showHandCursor" ng-click="$ctrl.begingEdit()" style="display:inline-block;width:100%" data-toggle="modal" data-target="#modal-textbox-tag{{$ctrl.hostname}}{{$ctrl.tag}}" title="{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}">
                {{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Value}}
            </span> 

            <div id="modal-textbox-tag{{$ctrl.hostname}}{{$ctrl.tag}}" class="modal parameter-edit-modal-sm" style="font-size:1.2em" tabindex="-1" role="dialog">
              <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                      <h4 class="modal-title">Edit Parameter Value</h4>
                    </div>
                    <div class="modal-body">
                        <span style="font-size:14px">{{$ctrl.ParameterDictionary[$ctrl.hostname][$ctrl.tag].Tooltip}}</span>
                        <input id="modal-input-tag" type="number" step="{{$ctrl.stepsize}}" class="form-control" style="font-size:16px;width:100%" ng-model="$ctrl.editedValue"
                            ng-keyup="$event.keyCode == 13 || $event.keyCode == 27 ? $ctrl.update($event.keyCode) : null" onfocus="this.select()"> 
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
                this.stepsize = 1;
                
                this.begingEdit = function(){
                    this.editedValue = Number(this.ParameterDictionary[this.hostname][this.tag].Value);
                }

                this.update = function(keyCode)
                {
                    if(keyCode == 13)
                    { 
                        parameterSvc.SetParameterValue(this.hostname, this.tag, this.editedValue);
                    }
                    $element.find('#modal-textbox-tag' + this.hostname + this.tag).modal('hide');
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
                
                $('.modal').on('shown.bs.modal', function () {
                    $(this).find('#modal-input-tag').focus();
                });
            }
        });
})();
