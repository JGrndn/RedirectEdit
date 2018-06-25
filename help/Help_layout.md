## Description
This plugin will allow you to redirect the Evolve users to different views when they enter the edit mode. Users can also be redirected to different views depending on their roles.

## Installation  
[https://github.com/casewise/cpm/wiki](https://github.com/casewise/cpm/wiki)  

## How to set up
First you need to create a single page for the object you want to preview in Evolve. Then, create another page where the users will be redirected to :  
<img src="https://github.com/JGrndn/RedirectEdit/blob/master/screen/1.JPG" style="width:95%" />  
You can create as many edit pages as you want, provided the fact their name all end with `_edit`  

Once this is done, edit the **config.js** file to configure the routing. The structure of the variable should be :  
```
var editPageByPageAndRoles = {
  'initial_viewname': {
    roleId: 'viewname_edit', /*name of the view to be redirected to*/
    default: 'viewname_edit' /*name of the view to be redirected to by default*/
  }
};
```  
Example :  
```
var editPageByPageAndRoles = {
  'application': {
    1: 'application_edit',
    default: 'application'
  }
};
```

## Result  
When a user navigate to the application page, he will see :  
<img src="https://github.com/JGrndn/RedirectEdit/blob/master/screen/2.JPG" style="width:95%" />  
When clicking on the Edit button, he will automatically be redirected to :  
<img src="https://github.com/JGrndn/RedirectEdit/blob/master/screen/3.JPG" style="width:95%" />  