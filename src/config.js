/*
 * key = view
 * value = object where :
 *   key = role id
 *   value = view to be redirected to
 * default : view to be redirected to if there is no role
 */
var editPageByPageAndRoles = {
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
};