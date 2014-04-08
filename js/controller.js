( function ( angular ) {
	angular.module("initialSolution.controller", ["initialSolution"])
		.controller( "parameterConfigCtrl", function( $scope, Parameter, ParameterInterface ) {
			angular.extend( $scope, {
				data : Parameter,
				add : function () {
					ParameterInterface.addClient(0,0,0,0,0);
				},
				delete : function ( index ) { 
					ParameterInterface.deleteClient( index ); 
				}
			} );
		} )
		.controller( "importFileCtrl", function( $scope, ParameterInterface, $rootScope ) {
			var paserData = function ( result ) {
				var dataAry = result.trim().split(/\n/)
					.map( function (rec) { return rec.replace(/\s/g,''); } );
				if ( !/^\d+\,\d+$/.test( dataAry[0] ) )
					throw 'first line error :'+dataAry[0];
				else {
					var tmp = dataAry[0].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setSite( tmp[0], tmp[1] );
				}
				if ( !/^\d+\,\d+\,\d+\,\d+\,\d+$/.test( dataAry[1] ) )
					throw 'second line error :'+dataAry[1];
				else {
					var tmp = dataAry[1].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setCar( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4] );
				}
				if ( !/^\d+\,\d+$/.test( dataAry[2] ) )
					throw 'third line error :'+dataAry[2];
				else {
					var tmp = dataAry[2].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setClient( tmp[0], tmp[1] );
				}

				ParameterInterface.deleteAllClient();
				dataAry.splice(3).forEach( function ( rec, index ) {
					if ( !/^\d+(\,\d+){4}$/.test( rec ) )
						throw (index+4)+' line error :'+rec;
					else {
						var tmp = rec.split(",").map( function ( rec ) { return Number(rec); } );
						ParameterInterface.addClient( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4] );
					}
				} );

				$scope.ifwCollapsed = true;
			};

			window.readFile = function() {
			    file = arguments[0].files[0];
			    var fReader = new FileReader();           
			    fReader.onload = function (event) {
			        paserData ( event.target.result );
			        $rootScope.$digest();
			    };

			    fReader.readAsText(file);
			};

			$scope.ifwCollapsed = true;
		} )
		.controller( "executeCtrl", function( $scope, Parameter ) {
			var getLength = function ( point1, point2 ) {
				return Math.pow(
					Math.pow( Math.abs( point1.x-point2.x ), 2 )+
					Math.pow( Math.abs( point1.y-point2.y ), 2 ),
					0.5 );
			};
			var getJourneyTime = function ( point1, point2, Speed ) {
				return getLength( point1, point2 ) / Speed;
			};
			var createCarList = function( site, k ) {
				var list = [];
				for ( var i = 0 ; i < k ; list[i++] = { 
					CarID : i, 
					PathLog : [ createPointLog( [], [], [], site, 0, 0 ) ] 
				} );
				return list;
			};
			var createPointLog = function ( pList, uList, dList, point, at, dt ) {
				return {
					PList : pList,
					Ulist : uList,
					DList : dList,
					Point : point,
					AT : at,
					DT : dt
				};
			};
			var checkRequest = function ( point, client, wt, speed, r ) {
				var o = getJourneyTime( point, client.o, speed );
				var d = getJourneyTime( client.o, client.d, speed );
				var b = getJourneyTime( client.d, point, speed );
				return ( (o+d+b) > wt || d > r );
				// 去服務會不會超過駕駛時間限制||客戶要求的距離會不會超過乘客乘車限制
			};
			var getFreeCar = function ( carList, client, site, speed, ws ) {
				var ot = getJourneyTime( site, client.o, speed );
				return carList.filter( function ( rec ) {
					if ( rec.path.length == 0 ) // 未發過車
						return true;
					else if ( rec.path[rec.path.length-1].AT < client.Time ) // 回站的車，可否在時限內載到客人
						return rec.path[rec.path.length-1].AT+ot <= client.Time+ws;
					else // 不在站內
						return false; 
				} );
			};
			var insertFirstClient = function ( pathLog, first, site, s, speed, ws ) {
				var jt = getJourneyTime( site, client.o, speed );
				var offset = first.Time-ws-jt;
				var dt = (offset > 0 ? offset : 0);
				var pointLog = pathLog[pathLog.length-1];
				pointLog.DT = pointLog.AT+dt;
				pathLog.push( createPointLog( [first], [first], [], first.o, pointLog.DT, pointLog.DT+s  ) ); 
			};
			var getCarPool = function ( clientList, pointLog, s, speed, ws ) {
				return clientList
				.filter( function ( rec ) { // 過濾出可共乘者，能準時接到
					return (pointLog.DT)+getJourneyTime( pointLog.Point, rec.o, speed ) < rec.Time+ws;
					// 於上一個需求點發車時間+到這個客戶的旅程時間 是否可以即時接到客戶
				} ).sort( function ( a, b ) {
					var aT = (a.Time-ws)-(pointLog.dt+getJourneyTime( pointLog.Point, a.o, speed ));
					var bT = (b.Time-ws)-(pointLog.dt+getJourneyTime( pointLog.Point, b.o, speed ));
					if ( aT >= 0 && bT >= 0 )
						return 0;
					if ( aT >= 0 && bT < 0 )
						return -1;
					if ( bT >= 0 && aT < 0 )
						return 1;
					else
						return b-a;
				} );
			};
			var checkCarPool = function ( path, pointLog, startTime, client, site, c, s, wt, speed, ws, r ) {
				if ( pointLog.length+1 > c )
					return false;
				//車容量限制檢查
				var pList = pointLog.PList.concat( client );
				var jt = getJourneyTime( pointLog.Point, client.o, speed );
				var spendTime, point;
				spendTime = s+(( pointLog.DT+jt <= client.Time )?client.Time:(pointLog.DT+jt));
				point = client.o;
				pList.forEach( function ( rec ) {
					spendTime += getJourneyTime( point, rec.d, speed );
					point = rec.d;
				} );
				spendTime = spendTime+getJourneyTime( point, site, speed )-startTime;
				if ( spendTime > wt )
					return false;
				// 駕駛工作時間限制檢查
				var subPath = path.slice( path.indexOf(pointLog) );
				var dt = s+(( pointLog.DT+jt <= client.Time )?client.Time:(pointLog.DT+jt));
				point = client.o;
				pList.every( function ( rec, idx ) {
					var result = ( (dt+=getJourneyTime( point, rec.d, speed ))-subPath[idx].dt ) <= r;
					point = rec.d;
					return result;
				} );
				// 乘客乘車時間限制檢查
			}
			var insertClient = function( path, client, clientList, s, speed ) {
				var pl = path[path.length-1];
				var uList = [client];
				var dList = pl.PList.filter( function(rec) { 
					return rec.d.x == client.o.x && rec.d.y == client.o.y; 
				} );
				var plist = pl.PList.concat( uList ).filter( function ( rec ) {
					return dList.indexOf( rec ) == -1;
				} );
				var jt = getJourneyTime( pl.Point, client.o, speed );
				path.push( createPointLog(
					plist,
					uList,
					dList,
					client.o,
					pl.DT+jt,
					pl.DT+jt+s
				) );
				clientList.splice( clientList.indexOf( client ), 1 ); 
			};
			var digestPassenger = function ( path, speed ) {
				var time = pd.DT;
				var pl = path[path.length-1];
				var point = pl.Point;
				pl.PList.forEach( function ( rec, idx, ary ) {
					path.push( createPointLog(
						ary.slice( idx+1 );
						[],
						[rec],
						rec.d,
						time+=getJourneyTime( point, rec.d, speed ),
						time+=s
					) );
					point = rec.d;
				} );
			};
			var goHome = function ( path, site, speed ) {
				var pl = path[path.length-1];
				path.push( createPointLog(
					[],
					[],
					[],
					site,
					getJourneyTime( pl.Point, site, speed ),
					getJourneyTime( pl.Point, site, speed )
				) );
			};
			$scope.execute = function () {
				// console.log(Parameter.valid);
				Parameter.lock = true;
				var errorCase = [];
				// 奧客名單，無法處理的客戶名單
				var clientList = Parameter.Client.List.concat()
					.sort( function ( a, b ) { return a.time-b.time; } );
				// 客戶名單，依照需求時間排序，方便後續作業
				var carList = createCarList( Parameter.Car.K );
				// 車輛名單，將車輛數資訊擴增成各個車輛的行駛紀錄
				do {
					try {
						var fc = clientList.splice(0,1);
						if ( !checkRequest( 
							Parameter.Site, 
							fc, 
							Parameter.Car.WT, 
							Parameter.Car.Speed, 
							Parameter.Client.R ) 
						) throw fc;
						// 確認需求合理
						var car = getFreeCar( 
							carList, 
							fc, 
							Parameter.Site, 
							Parameter.Car.Speed, 
							Parameter.Client.WS 
						)[0];
						if ( car == undefined ) // 無法發車，車輛無空閒或來不及
							throw fc;
						// 2.指派新車
						insertFirstClient( 
							car.PathLog, 
							fc, 
							Parameter.Site, 
							Parameter.Car.S, 
							Parameter.Car.Speed, 
							Parameter.Client.WS 
						);
						// 3.尋找時窗開啟最早之需求點(車輛K第一個子路徑)
						while ( car.PathLog.Plist.length == 0 ) {
							var carpool = getCarPool( 
								clientList, 
								car.PathLog[car.PathLog.length-1], 
								Parameter.Car.S, 
								Parameter.Car.Speed, 
								Parameter.Client.WS 
							)[0];
							// 4 尋找符合共乘、時窗限制、等待時間最少之需求點 ( 找出能接到的 )
							if ( carpool != undefined ) { // 4.1是否有符合條件者，是
								if ( checkCarPool(
									car.PathLog, 
									car.PathLog[car.PathLog.length-1], 
									car.PathLog[0].dt,
									carpool, 
									Parameter.Site, 
									Parameter.Car.C, 
									Parameter.Car.S, 
									Parameter.Car.WT, 
									Parameter.Car.Speed, 
									Parameter.Client.WS,
									Parameter.Client.R
								) ) { // 4.2 是否違法車容量、駕駛工作時間、乘客成坐時間限制
									insertClient( 
										car.PathLog, 
										carpool, 
										clientList, 
										Parameter.Car.S, 
										Parameter.Car.Speed
									);
									// 6.完成共乘媒合
								} else 
									break;
									//7.完成車輛k排程
							} else { // 5.嘗試將為服務需求點插入路徑
								// 先送走一人
								//---------------------問題
							}
						}
						digestPassenger( 
							car.PathLog, 
							Parameter.Car.Speed 
						);
						goHome( 
							car.PathLog, 
							Parameter.Site,
							Parameter.Car.Speed 
						);
						//送完剩餘的乘客，並回家
						// 7 完成車輛K排程
					} catch ( client ) {
						errorCase.push( client );
					}
				} while ( clientList.length != 0 );
			};
		} )
} ) ( angular );

var carLog = [];
				
				carLog