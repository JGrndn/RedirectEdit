/*
* key = view
* value = object where :
*   key = role id
*   value = view to be redirected to
* default : view to be redirected to if there is no role
*/
var editPageByPageAndRoles = {
  'pia': {
    1: 'application_edit',
    association : {
    	cw_user_20196_274399564 : 'pia_evaluateur',
    	cw_user_20195_1319762562 : 'pia_validation',
    	    	
    },
    default: 'pia_modification'
  }
};