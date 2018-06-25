/*
* key = view
* value = object where :
*   key = role id
*   value = view to be redirected to
* default : view to be redirected to if there is no role
*/
var editPageByPageAndRoles = {
  'application': {
    1: 'application_edit',
    default: 'application2'
  }
};