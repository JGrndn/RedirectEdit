/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI, jQuery*/
(function (cwApi, $) {
  "use strict";

  function getViewNameForEdit(view){
    var currentUser = cwApi.currentUser, r, targetView = '';
    if (!cwApi.isUndefined(editPageByPageAndRoles)){
      if (editPageByPageAndRoles.hasOwnProperty(view)){
        if (currentUser.RolesId.length === 1 && editPageByPageAndRoles[view].hasOwnProperty(currentUser.RolesId[0])){
          return editPageByPageAndRoles[view][currentUser.RolesId[0]];
        } else if (currentUser.RolesId.length > 1){
          for(r in editPageByPageAndRoles[view]){
            // get first target in list
            if (editPageByPageAndRoles[view].hasOwnProperty(r)){
              return editPageByPageAndRoles[view][r];
            }
          }
        }
      }
    }
    if (editPageByPageAndRoles[view].hasOwnProperty('default')) {
      return editPageByPageAndRoles[view].default;
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
        cwApi.CwPendingEventsManager.setEvent("SetEditMode");
        var qs = cwApi.getQueryStringObject(), url;
        url = 'cwtype=' + qs.cwtype + '&cwview=' + getViewNameForEdit(qs.cwview) + '&lang=' + qs.lang + '&cwid=' + qs.cwid + '&cwmode=' + cwApi.CwMode.Edit;
        var o = [];
        that.outputSaveAndCancelButton(o);
        $('div.cw-edit-buttons').html(o.join(''));
        that.setEditModeButtonsActions();
        sessionStorage.setItem("lastUrl", cwApi.getURLHash().replace('#', ''));
        cwApi.updateURLHash(url);
        cwApi.CwPendingEventsManager.deleteEvent("SetEditMode");
      });
    }
  };

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
    cwApi.CwPendingEventsManager.deleteEvent("UnsetEditMode");
  };

  // ajouter la redirection lorsqu'on submit les modifications

}(cwAPI, jQuery));