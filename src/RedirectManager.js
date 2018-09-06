/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI, jQuery*/
(function (cwApi, $) {
  "use strict";


  function isUserAssociated(associationsList) {
    for (var i = 0; i < associationsList.length; i++) {
        if(associationsList[i].object_id === cwApi.currentUser.ID) return true;
    }
    return false;
  }


  function getViewNameForEdit(view,item){
    var currentUser = cwApi.currentUser, r, targetView = '', associations;
    if (!cwApi.isUndefined(editPageByPageAndRoles)){
      if (editPageByPageAndRoles.hasOwnProperty(view)){
        if(editPageByPageAndRoles[view].association) { // association
          associations = editPageByPageAndRoles[view].association;
          for (let [nodeID, targetView] of Object.entries(associations)) {
              if(item && item.associations.hasOwnProperty(nodeID) && isUserAssociated(item.associations[nodeID])) {
                return targetView;
              }
          } 

          // role
        } else if (currentUser.RolesId.length === 1 && editPageByPageAndRoles[view].hasOwnProperty(currentUser.RolesId[0])){
          return editPageByPageAndRoles[view][currentUser.RolesId[0]];
        } else if (currentUser.RolesId.length > 1){
          for(r in editPageByPageAndRoles[view]){
            // get first target in list
            if (editPageByPageAndRoles[view].hasOwnProperty(r)){
              return editPageByPageAndRoles[view][r];
            }
          }
        }
        if (editPageByPageAndRoles[view].hasOwnProperty('default')) {
          return editPageByPageAndRoles[view].default;
        }
      }
    }
    return view;
  };

  cwApi.cwEditProperties.cwEditPropertyManagerDOM.prototype.setEditModeButtonsActions = function () {
    var that = this, showComments = false, paddingTop = $('.page-content').css('padding-top');

    cwApi.CwEditCancel.registerActions(this.editPropertyManager);
    cwApi.CwEditDelete.registerActions(this.editPropertyManager.item);
    cwApi.CwEditSave.registerActionsForSinglePage(this.editPropertyManager);
    if (cwApi.queryObject.isDiagramDraftView()) {
      if (cwApi.isDiagramEditorEnable()) {
        cwApi.CwEdit.registerEditButtonClick(this.draftEditAction, false);
      } else {
        $('.cw-edit-buttons').remove();
      }
    } else {
      cwApi.CwEdit.registerEditButtonClick(function () {
        
        var qs = cwApi.getQueryStringObject(), url,targetView;
        targetView = getViewNameForEdit(qs.cwview,that.editPropertyManager.item)

        if(targetView === cwApi.getCurrentView().cwView) {
          var o = [];
          cwApi.disableLoadPage = true;
          cwApi.cwEditProperties.setEditMode();
          cwApi.cwPageManager.updateQueryString();
          if (cwApi.cwEditProperties.isTinymce(that.editPropertyManager) === true) {
              cwApi.cwTinymceManager.loadTinymce(function () {
                  that.editPropertyManager.goToEditMode();
              });
          } else {
              that.editPropertyManager.goToEditMode();
          }
          that.outputSaveAndCancelButton(o);
          $('div.cw-edit-buttons').html(o.join(''));
          that.setEditModeButtonsActions();
        } else if(cwApi.cwUser.canAccessView(cwApi.currentUser, cwApi.getView(targetView))) {
          cwApi.CwPendingEventsManager.setEvent("SetEditMode");
          url = 'cwtype=' + qs.cwtype + '&cwview=' + targetView + '&lang=' + qs.lang + '&cwid=' + qs.cwid + '&cwmode=' + cwApi.CwMode.Edit;
          var o = [];
          that.outputSaveAndCancelButton(o);
          $('div.cw-edit-buttons').html(o.join(''));
          that.setEditModeButtonsActions();
          sessionStorage.setItem("lastUrl", cwApi.getURLHash().replace('#', ''));
          cwApi.updateURLHash(url);
        } else {
          cwApi.cwNotificationManager.addError($.i18n.prop('error_NotHaveTheRightsToSeeThisPage'));
          $('#top-actions').removeClass('edit-mode');

        }

        cwApi.CwPendingEventsManager.deleteEvent("SetEditMode");
      });
    }


   
  };


  function getRedirectPage(parentId, parentObjectTypeId) {
      if (!cwApi.isUndefined(parentId) && !cwApi.isUndefined(parentObjectTypeId)) {
          var parentObjectTypeScriptName = cwApi.mm.getObjectTypeById(parentObjectTypeId).scriptName.toLowerCase();
          if (cwApi.cwConfigs.SingleViewsByObjecttype.hasOwnProperty(parentObjectTypeScriptName)) {
              return cwApi.getSingleViewHash(parentObjectTypeScriptName, parentId);
          } else {
              return '#';
          }
      } else {
          return '#';
      }
  }

  cwApi.cwEditProperties.unsetEditMode = function () {
    cwApi.CwPendingEventsManager.setEvent("UnsetEditMode");
    var regex, hash;
    if (cwApi.queryObject.isEditMode()){
      hash = sessionStorage.getItem('lastUrl');
    }
    else {
      regex = new RegExp('&cwmode=' + cwApi.CwMode.Edit, 'g');
      hash = cwApi.getURLHash().replace(regex, '').replace('#', '');
      hash = hash.replace(/\&cwisnew=true/g, '').replace('#', '');
    }
    cwApi.updateURLHash(hash);
    cwApi.CwShare.appendButton(null, false);
    cwApi.CwPrintManager.appendPrintButton(cwApi.CwSinglePageActions.getLeftButtonsAnchor());
    cwApi.CwPendingEventsManager.deleteEvent("UnsetEditMode");
  };


  // ajouter la redirection lorsqu'on submit les modifications




}(cwAPI, jQuery));



