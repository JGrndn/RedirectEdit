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
    associationNodeID : {
      cw_user_20196_274399564: {
	view: 'pia_evaluateur',/*name of the view to be redirected if the cwUser in inside the associationNode and if the 
                                 deny filter is not verified*/
	message: "Cet objet est en cours de validation ou d'initialisation",
	denyPropertyFilter: {
	  property: "status",
	  operator: "=",
	  value: ["Validé","A valider","Initialisé"]
	}
    }, 
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


## Other Exemple 

```
	'pia': {
		association: {
			cw_user_20196_274399564: {
				view: 'pia_evaluateur',
				message: "Cet objet est en cours de validation ou d'initialisation",
				denyPropertyFilter: {
					property: "status",
					operator: "=",
					value: ["Validé","A valider","Initialisé"]
				}
			},
			cw_user_20195_1319762562: {
				view: 'pia_validation',
				message: "Cet objet est en cours d'évaluation",
				denyPropertyFilter: {
					property: "status",
					operator: "=",
					value: ["A réviser","A évaluer"]
				}
			},
		},
		default: 'pia_modification'
	}


```

If this exemple, if the cw_user is the evaluator of the pia and the pia is not in ["Validé","A valider","Initialisé"], he will go to pia_evaluateur
if the cw_user is the validator of the pia and the pia is not in ["A réviser","A évaluer"], he will go to pia_validation
If the cw_user is neither and has the right to access pia_modification, he will go to  pia_modification
If neither, he will stay on the page with an error message telling him he cannot modify the page