/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI,$,document */

(function (cwApi) {
    "use strict";

    /**
     * Handles the save functionality.
     */
    cwApi.CwEditSave = (function () {
        var editSource,
            outputButton, registerSaveButtonClick, registerActions, registerActionsForSinglePage, setPopoutContentForObjectPage, setPopoutContentForGrid, processChangesAndDisplay, submitBtnClick,
            buildPopoutOutput, outputChanges, processChanges, displayChanges, handleSaveError, handleGridSave;

        /**
         * Enum for edit source values.
         * @readonly
         * @enum {Number}
         */
        editSource = {
            Grid: 0,
            ObjectPage: 1
        };

        /**
         * Outputs a generic error to the popout.
         */
        function outputGenericError() {
            var o = [];
            cwApi.CwPendingChangesUi.outputError(o, $.i18n.prop('editmode_thereWasAnIssueWhichMeansTheChangesWereNotSavedPleaseContactYourAdministrator'), false);
            outputChanges(o.join(''));
        }

        /**
         * Checks if the change is for the current users' profile picture and forces to get the latest picture if so.
         */
        function checkIfUpdateIsUserPictureForCurrentUser() {
            var changeset = cwApi.pendingChanges.getFirstChangeset();
            if ((changeset.objectTypeScriptName === 'CW_USER' || changeset.objectTypeScriptName === 'USER') && cwApi.currentUser.ID === parseInt(changeset.objectId, 10)) {
                // this code try to make sure the image is regenerated and the cache reset, when the user updates his profile/picture
                var url = cwApi.cwUser.getUserPicturePathByUserName(cwApi.currentUser.Name) + '?' + Math.random();
                $('#nav-container .user .avatar img').attr('src', url);
            }
        }


        /**
         * Adds the save button HTML to the given output.
         * @param {Array} o The output.
         */
        outputButton = function (o) {
            o.push('<a id="cw-edit-mode-button-save" class="btn btn-edit-save page-action edit no-text" title="', $.i18n.prop('editmode_save'), '"><span class="btn-text"></span><i class="fa fa-save"></i></a>');
        };

        /**
         * Registers a custom action for the save button click event.
         * @param {Function} callback The custom method.
         */
        registerSaveButtonClick = function (callback) {
            $(document).off('click', '#cw-edit-mode-button-save').on('click', '#cw-edit-mode-button-save', function (e) {
                e.preventDefault();
                if (cwApi.isFunction(callback)) {
                    return callback();
                }
            });
        };

        /**
         * Registers the default action for the save button click event.
         * @param {cwEditPropertyManager} editPropertyManager The edit property manager.
         */
        registerActionsForSinglePage = function (editPropertyManager) {
            cwApi.CwPopout.registerElementForShow('#cw-edit-mode-button-save', $.i18n.prop('editmode_changes'), function () {
                setPopoutContentForObjectPage(editPropertyManager);
            });
        };

        /**
         * Registers the default actions for the save popout elements.
         * @param {cwEditPropertyManager} editPropertyManager The edit property manager.
         */
        registerActions = function () {
            var textareaSelector;

            textareaSelector = '.textarea-grow textarea';
            $(document).off('focus', textareaSelector).on('focus', textareaSelector, function () {
                $(this).parent().addClass('focus');
            });
        };

        /**
         * Sets the content of the popout for an object page change.
         * @param {cwEditPropertyManager} editPropertyManager The edit property manager.
         */
        setPopoutContentForObjectPage = function (editPropertyManager) {
            cwApi.CwPendingEventsManager.setEvent("SetPopoutContentForObjectPage");
            var object, objectName, newValues, action, objectId, objectTypeScriptName;

            object = editPropertyManager.item;
            objectName = '';
            objectId = undefined;
            objectTypeScriptName = undefined;
            newValues = editPropertyManager.getValues();

            // Are the changes for an existing object, if so, get the name from the item
            if (!cwApi.isNull(object)) {
                objectId = object.object_id;
                objectTypeScriptName = object.objectTypeScriptName;
                if (!cwApi.isUndefined(object.IName)) {
                    objectName = object.IName;
                } else if (!cwApi.isUndefined(object.name)) {
                    objectName = object.name;
                }
            } else if (!cwApi.isUndefined(newValues.properties.name)) {
                objectName = newValues.properties.name;
            }

            buildPopoutOutput();

            if (cwApi.queryObject.isCreatePage()) {
                action = cwApi.CwPendingChangeset.ActionType.Create;
                cwApi.CwPopout.setTitle($.i18n.prop('editmode_createSummary'));
            } else {
                cwApi.CwPopout.setTitle($.i18n.prop('editmode_updateSummary'));
                action = cwApi.CwPendingChangeset.ActionType.Update;
            }

            processChangesAndDisplay(editSource.ObjectPage, action, editPropertyManager.initialValues, newValues, objectName, objectId, objectTypeScriptName, function (dueDate, submitCtrlCallback) {
                submitBtnClick(editSource.ObjectPage, null, dueDate, submitCtrlCallback);
            });

            cwApi.CwPendingEventsManager.deleteEvent("SetPopoutContentForObjectPage");
        };

        /**
         * Sets the content of the popout for a grid change.
         * @param {Object} sourceItem The original item.
         * @param {Object} targetItem The item containing changes.
         * @param {String} objectName The object name.
         * @param {Number} id The object Id.
         * @param {String} objectTypeScriptName The object type scriptname of the object.
         * @param {Function} submitCallback The callback method.
         */
        setPopoutContentForGrid = function (action, sourceItem, targetItem, id, objectTypeScriptName, gridCallback) {
            cwApi.CwPendingEventsManager.setEvent("SetPopoutContentForGrid");
            var objectName;

            objectName = "";

            if (action === cwApi.CwPendingChangeset.ActionType.Create) {
                cwApi.CwPopout.show($.i18n.prop('editmode_createSummary'));
            } else {
                cwApi.CwPopout.show($.i18n.prop('editmode_updateSummary'));
            }

            if (cwApi.isNull(sourceItem)) {
                if (!cwApi.isUndefined(targetItem.properties.name) && !cwApi.isUndefined(targetItem.properties.name)) {
                    objectName = targetItem.properties.name;
                }
            } else if (!cwApi.isUndefined(sourceItem.properties.name)) {
                objectName = sourceItem.properties.name;
            }

            buildPopoutOutput();
            objectName = cwApi.cwSearchEngine.removeSearchEngineZone(objectName);
            processChangesAndDisplay(editSource.Grid, action, sourceItem, targetItem, objectName, id, objectTypeScriptName, function (dueDate, submitCtrlCallback) {
                submitBtnClick(editSource.Grid, gridCallback, dueDate, submitCtrlCallback);
            });

            cwApi.CwPendingEventsManager.deleteEvent("SetPopoutContentForGrid");
        };

        /**
         * Sets the base content for the save popout.
         */
        buildPopoutOutput = function () {
            var output = [];
            output.push('<form action="#" class="form-edit">');
            output.push('<div class="saveChanges">');
            output.push('</div>');
            output.push('<fieldset class="submit">');
            output.push('</fieldset>');
            output.push('</form>');
            cwApi.CwPopout.setContent(output.join(''));
        };

        /**
         * Outputs the changes in the save popout.
         * @param {Array} html The changes converted to html.
         */
        outputChanges = function (html) {
            $('div.saveChanges').html(html);
        };

        /**
         * Processes the changes and displays them.
         * @param {Object} sourceItem The original item.
         * @param {Object} targetItem The item containing changes.
         * @param {String} objectName The object name.
         * @param {Number} sourceItemId The object Id.
         * @param {String} sourceObjectTypeScriptName The object type scriptname of the object.
         */
        processChangesAndDisplay = function (source, action, sourceItem, targetItem, objectName, sourceItemId, sourceObjectTypeScriptName, submitMethod) {
            processChanges(action, sourceItem, targetItem, objectName, sourceItemId, sourceObjectTypeScriptName);
            displayChanges(source, submitMethod);
        };

        /**
         * Processes the changes.
         * @param {Object} sourceItem The original item.
         * @param {Object} targetItem The item containing changes.
         * @param {String} objectName The object name.
         * @param {Number} sourceItemId The object Id.
         * @param {String} sourceObjectTypeScriptName The object type scriptname of the object.
         */
        processChanges = function (action, sourceItem, targetItem, objectName, sourceItemId, sourceObjectTypeScriptName) {
            var queryObject, changeset, validateWithWorkflow;
            queryObject = cwApi.getQueryStringObject();

            if (cwApi.isUndefined(sourceItemId)) {
                if (!cwApi.queryObject.isCreatePage()) {
                    sourceItemId = queryObject.cwid;
                } else {
                    sourceItemId = 0;
                }
            }

            if (cwApi.isUndefined(sourceObjectTypeScriptName)) {
                sourceObjectTypeScriptName = cwApi.getView(queryObject.cwview).rootObjectType;
            }

            //** GC (7-11-14) Clear existing changesets as we don't support multiple changesets yet.
            cwApi.pendingChanges.clear();
            //**

            // Bug 53009: If the change if for the user object do not validate with workflow
            validateWithWorkflow = sourceObjectTypeScriptName.toLowerCase() === 'user' ? false : true;

            changeset = new cwApi.CwPendingChangeset(sourceObjectTypeScriptName, sourceItemId, objectName, validateWithWorkflow, action);
            changeset.checkMandatoryValues(sourceItem, targetItem);
            changeset.compareAndAddChanges(sourceItem, targetItem);
            cwApi.pendingChanges.addChangeset(changeset);
        };

        /**
         * Displays the changes.
         */
        displayChanges = function (source, submitMethod) {
            var output, changeset, viewName, isCreate, createSourceView, createSourceObjectId;
            output = [];
            changeset = cwApi.pendingChanges.getFirstChangeset();
            if (!changeset.mandatoryValueChange.areAllMandatoryValuesSet()) {
                cwApi.CwPopout.setTitle($.i18n.prop('editmode_warning'));
                isCreate = changeset.action === cwApi.CwPendingChangeset.ActionType.Create;
                changeset.mandatoryValueChange.buildUnsetMandatoryValuesMessage(output, isCreate, changeset.associationChanges.length);
                outputChanges(output.join(''));

            } else if (changeset.hasChanges()) {

                viewName = cwApi.getQueryStringObject().cwview;
                createSourceView = cwApi.getQueryStringObject().cwcreatesourceview;
                createSourceObjectId = cwApi.getQueryStringObject().cwcreatesourceviewid;

                if (!cwApi.isUndefined(createSourceView)) {

                    viewName = createSourceView;

                }

                changeset.fetchAndUpdateWithApprovers(viewName, createSourceObjectId, function () {

                    output.push(changeset.toChangeSummaryHtml());
                    outputChanges(output.join(''));
                    cwApi.CwEditSubmit.outputSubmit(source, submitMethod);

                    if (changeset.hasApprovers()) {

                        registerActions();

                    }

                });
            } else {
                cwApi.CwPendingChangesUi.outputInfoMessage(output, $.i18n.prop('diffManager_thereAreCurrentlyNoChangesToSave'));
                outputChanges(output.join(''));
            }
        };

        handleGridSave = function () {
            var output = [];
            cwApi.CwPopout.show($.i18n.prop('editmode_updateSummary'));
            buildPopoutOutput();
            cwApi.CwPendingChangesUi.outputError(output, $.i18n.prop('diffManager_youMustSubmitAllOtherChangesBeforeDoingAnyOperationsInGrid'));
            outputChanges(output.join(''));

            cwApi.CwPopout.registerElementForHide('.popout-top .btn-close-panel', function () {
                cwBehaviours.CwKendoGridUpdateDom.enableGridForUpdate();
            });
        };

        /**
         * Event handler for the submit button click.
         * @param {Object} e The default event object.
         * @param {editSource} source The source of the edit.
         * @param {Function} callback The callback method.
         */
        submitBtnClick = function (source, callback, dueDate, submitCtrlCallback) {
            var changeset, $this, id, changeType, changeIndex, comment, objectTypeDisplayName;

            cwApi.CwPendingEventsManager.setEvent("PopoutSaveSubmitBtnClick");

            changeset = cwApi.pendingChanges.getFirstChangeset();

            $('.form-edit textarea').each(function () {
                $this = $(this);
                id = $this.attr('id');
                comment = $this.val();

                if (id === "createObject") {
                    changeset.updateCommentForCreate(comment);
                } else {
                    changeIndex = $this.data('cw-index');
                    changeType = $this.data('cw-changetype');
                    changeset.updateCommentForChange(changeIndex, changeType, comment);
                }
            });

            cwApi.pendingChanges.sendAsChangeRequest(dueDate, function (response, loginLoaded) {
                var cwcreatesourceview;
                if (cwApi.statusIsKo(response)) {
                    if (!loginLoaded) {
                        var unsetEditMode = (source === editSource.ObjectPage && changeset.action !== cwApi.CwPendingChangeset.ActionType.Create);
                        handleSaveError(response, unsetEditMode, false);

                        if (changeset.action === cwApi.CwPendingChangeset.ActionType.Update) {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_someOfTheChangesWereNotUpdated'), 'error');
                        } else if (changeset.action === cwApi.CwPendingChangeset.ActionType.Create) {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_thereWasAnIssueWhichMeansTheObjectWasNotCreated'), 'error');
                        }
                    }
                } else {
                    checkIfUpdateIsUserPictureForCurrentUser(response, cwApi.pendingChanges.getFirstChangeset());
                    if (changeset.action === cwApi.CwPendingChangeset.ActionType.Update) {
                        cwApi.cwEditProperties.unsetEditMode();
                        if (response.changesInReview) {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_yourChangesHaveBeenSentForReview'));
                        } else {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_yourChangeHaveBeenSaved'));
                        }
                    } else if (changeset.action === cwApi.CwPendingChangeset.ActionType.Create) {
                        objectTypeDisplayName = changeset.getObjectTypeDisplayName();

                        if (response.changesInReview) {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_yourRequestToCreateXHasBeenSentForReview', objectTypeDisplayName));
                        } else {
                            cwApi.notificationManager.addNotification($.i18n.prop('editmode_yourNewXHasBeenCreated', objectTypeDisplayName));
                        }

                        if (source === editSource.ObjectPage) {
                            var stayOnPage, objectTypeScriptName, objectPageHash;
                            stayOnPage = $('#cw-edit-stay-on-page input').prop('checked');
                            cwcreatesourceview = cwApi.getQueryStringObject().cwcreatesourceview;
                            if (stayOnPage === undefined && cwApi.isUndefined(cwcreatesourceview)) {
                                // if not any checkbox is found stay on the same page
                                stayOnPage = true;
                            }
                            if (stayOnPage === true) {
                                cwApi.cwPageManager.refreshPage();
                            } else {
                                objectTypeScriptName = cwApi.ViewSchemaManager.getFirstRootNodeSchemaForCurrentView().ObjectTypeScriptName;
                                objectPageHash = cwApi.getSingleViewHash(objectTypeScriptName, response.id);

                                if (!cwApi.isUndefined(cwcreatesourceview)) {
                                    objectPageHash = cwApi.getHashWithCreateSource(cwcreatesourceview);
                                    if (!cwApi.isUndefined(cwApi.getQueryStringObject().cwcreatesourceviewid)) {
                                        cwApi.CwLocalStorage.removeAssociationInformationForCreate();
                                    }
                                }
                                cwApi.updateURLHash(objectPageHash);
                            }
                        }
                    }
                    submitCtrlCallback(true);
                    cwApi.CwPopout.hide();
                    if (cwApi.queryObject.isEditMode()) {
                        var hash = sessionStorage.getItem('lastUrl');
                        cwApi.updateURLHash(hash);
                    }
                    cwApi.CwPendingEventsManager.deleteEvent("PopoutSaveSubmitBtnClick");
                }
                if (!cwApi.isUndefinedOrNull(callback) && cwApi.isFunction(callback)) {
                    return callback(response);
                }
            }, function (object) {
                cwApi.CwPopout.setTitle($.i18n.prop('editmode_errorSummary'));
                cwApi.CwPopout.setContent(buildPopoutOutput());

                if (changeset.action === cwApi.CwPendingChangeset.ActionType.Update) {
                    cwApi.notificationManager.addNotification($.i18n.prop('editmode_someOfTheChangesWereNotUpdated'), 'error');
                } else if (changeset.action === cwApi.CwPendingChangeset.ActionType.Create) {
                    cwApi.notificationManager.addNotification($.i18n.prop('editmode_thereWasAnIssueWhichMeansTheObjectWasNotCreated'), 'error');
                }

                // Image is too large
                if (object.status === 500 && object.responseText.indexOf("Maximum request length exceeded") > -1) {
                    var $newImage, o;

                    o = [];
                    outputChanges(changeset.toErrorSummaryHtml(false));
                    $newImage = $('.saveChanges p:not(.oldImage) img');
                    $newImage.addClass('error');
                    cwApi.CwPendingChangesUi.outputError(o, $.i18n.prop("editmode_theImageIsTooLargeToBeProcessedPleaseTryASmallerImage"));
                    $newImage.parent().after(o.join(''));
                } else {
                    outputGenericError();
                }
            });
        };

        /**
         * Handles the response when the server returns a save error.
         */
        handleSaveError = function (response, unsetEditMode, isApprovalMode) {
            var changesetWithErrors, pendingChangesWithErrors, isPendingChangesError;

            isPendingChangesError = !(cwApi.isUndefined(response.pendingChanges) || cwApi.isNull(response.pendingChanges));
            cwApi.CwPopout.setTitle($.i18n.prop('editmode_errorSummary'));

            if (isPendingChangesError) {
                pendingChangesWithErrors = new cwApi.CwPendingChanges();
                pendingChangesWithErrors.parseJson(response.pendingChanges);
                changesetWithErrors = pendingChangesWithErrors.getFirstChangeset();
            }

            if (unsetEditMode) {
                cwApi.cwEditProperties.unsetEditMode();
                $(document).on('pageLoaded', function () {
                    cwApi.CwPopout.showPopout($.i18n.prop('editmode_errorSummary'), function () {
                        cwApi.CwPopout.setContent(buildPopoutOutput());
                        if (isPendingChangesError) {
                            outputChanges(changesetWithErrors.toErrorSummaryHtml(isApprovalMode));
                        } else {
                            outputGenericError();
                        }
                        $(document).off('pageLoaded');
                    });
                });
            } else {
                cwApi.CwPopout.setContent(buildPopoutOutput());
                if (isPendingChangesError) {
                    outputChanges(changesetWithErrors.toErrorSummaryHtml(isApprovalMode));
                } else {
                    outputGenericError();
                }
            }
        };

        return {
            editSource: editSource,
            outputButton: outputButton,
            registerSaveButtonClick: registerSaveButtonClick,
            registerActions: registerActions,
            registerActionsForSinglePage: registerActionsForSinglePage,
            buildPopoutOutput: buildPopoutOutput,
            setPopoutContentForGrid: setPopoutContentForGrid,
            processChanges: processChanges,
            handleSaveError: handleSaveError,
            handleGridSave: handleGridSave
        };

    })();

}(cwAPI));