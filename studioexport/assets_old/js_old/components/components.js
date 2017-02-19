(function(){
    var app = angular.module('ac30WebApp');
    app.component('parameterEditable', {
            // isolated scope binding
            bindings: {
                tag: '<',
                editedValue: '@',
                showunits: '<',
                config: '@'
            },
            // Inline template which is binded to message variable
            // in the component controller
            //templateUrl: '/js/components/parameterEnum.html',
            template:`
<span class="fake-input showHandCursor" ng-click="$ctrl.begingEdit()" style="display:inline-block;width:100%" data-toggle="modal" data-target="#modal-tag{{$ctrl.tag}}" title="{{$ctrl.ParameterDictionary[$ctrl.tag].Tooltip}}">
    {{$ctrl.ParameterDictionary[$ctrl.tag].ValueAndUnits}}
</span> 

<div id="modal-tag{{$ctrl.tag}}" class="modal parameter-edit-modal-sm" style="font-size:1.2em" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">Edit Parameter Value</h4>
        </div>
        <div class="modal-body">
            <span style="font-size:14px">{{$ctrl.ParameterDictionary[$ctrl.tag].Tooltip}}</span>
            <input id="myInput" class="form-control" type="text" style="font-size:16px;width:100% " ng-model="$ctrl.editedValue" ng-keyup="$event.keyCode == 13 || $event.keyCode == 27 ? $ctrl.update($event.keyCode) : null" onfocus="this.select()"> 
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
            controller: function(parameterSvc, $rootScope) {
                this.ParameterDictionary = parameterSvc.ParameterDictionary;
                this.editing = false;

                this.begingEdit = function(){
                    this.editing = true;
                    this.editedValue = this.ParameterDictionary[this.tag].Value;
                }

                this.update = function(keyCode)
                {
                    this.editing = false;
                    if(keyCode == 13)
                    {       
                        parameterSvc.setParameterValue("192.168.41.22", this.tag, this.editedValue);
                    }
                };

                this.$doCheck = function () {
                    if(this.config == 'True')
                    {
                        this.IsDisabled = this.ParameterDictionary[989].Value == 'OPERATIONAL';
                    }
                };
            }
        });
})();
