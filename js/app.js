( function ( angular ) {
	angular.module("initialSolution", ["initialSolution.controller","ui.bootstrap"])
		// .value( 'Util',
		// 	getLength : function ( point1, point2 ) {
		// 		return Math.pow(
		// 			Math.pow( Math.abs( point1.x-point2.x ), 2 )+
		// 			Math.pow( Math.abs( point1.y-point2.y ), 2 ),
		// 			0.5 );
		// 	},
		// 	getJourneyTime : function ( point1, point2, Speed ) {
		// 		return getLength( point1, point2 ) / Speed;
		// 	}
		// 	// ,
		// 	// hasAbilityService : function (dataObj, point, client) {
		// 	// 	var toClientTime = getJourneyTime( point, client.StartPoint, CarSpeed );
		// 	// 	var toDestinationTime = getJourneyTime( client.StartPoint, client.EndPoint, CarSpeed );
		// 	// 	return (client.time+dataObj.MistakeScope) >= toClientTime &&
		// 	// 		// 檢查是否可以即時接到客戶
		// 	// 		dataObj.TravelTimeLimit >= toDestinationTime
		// 	// 		// 檢查旅程是否超過乘客乘車時間限制
		// 	// }
		// } )
		.value('Parameter', {
			'Site' : {
				'x': undefined, 
				'y': undefined
			},
			'Car' : {
				'K' : undefined,
				'C' : undefined,
				'S' : undefined,
				'WT' : undefined,
				'Speed' : undefined
			},
			'Client' : {
				'WS' : undefined,
				'R' : undefined,
				'List' : []
			}
		} )
		.factory( 'ParameterInterface', function ( Parameter ) {
			var toPoint = function( x, y ) { 
				return { x:x, y:y }; 
			};
			return {
				setSite : function( x, y ) {
					Parameter.Site.x = x;
					Parameter.Site.y = y;
				},
				setCar : function ( k, c, s, wt, speed ) {
					Parameter.Car.K = k;
					Parameter.Car.C = c;
					Parameter.Car.S = s;
					Parameter.Car.WT = wt;
					Parameter.Car.Speed = speed;
				},
				setClient : function ( ws, r) {
					Parameter.Client.WS = ws;
					Parameter.Client.R = r;
				},
				addClient : function( start_x, start_y, end_x, end_y, time  ) {
					Parameter.Client.List.push( {
						o: toPoint( start_x, start_y ),
						d: toPoint( end_x, end_y ),
						Time : time
					} );
				},
				deleteClient : function( index ) {
					Parameter.Client.List.splice( index, 1 );
				},
				deleteAllClient : function() {
					Parameter.Client.List.splice( 0 );
				}
			}
		} );

} ) ( angular );