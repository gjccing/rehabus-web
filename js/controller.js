( function ( angular ) {
	angular.module("initialSolution.controller", ["initialSolution"])
		.controller( "parameterConfigCtrl", function( $scope, Parameter, ParameterInterface ) {
			angular.extend( $scope, {
				data : Parameter,
				add : function () {
					ParameterInterface.addClient(0,0,0,0,0,0);
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
					if ( !/^\d+(\,\d+){5}$/.test( rec ) )
						throw (index+4)+' line error :'+rec;
					else {
						var tmp = rec.split(",").map( function ( rec ) { return Number(rec); } );
						ParameterInterface.addClient( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4], tmp[5] );
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
			var getJT = function ( p1, p2, speed ) {
				return Math.pow(
						Math.pow( Math.abs( p1.x-p2.x ), 2 )+
						Math.pow( Math.abs( p1.y-p2.y ), 2 ), 
						0.5 ) /speed;
			};
			var getJTAry = function ( path, speed ) {
				var tl = [];
				for ( var p = 0, c = 1 ; c < path.length ; p = c, c++ )
					tl.push( getJT( path[p], path[c], speed ) );
				
				return tl;
			};

			var insertPoint = function ( path, pp ) {
				for ( var i = 0 ; i < path.length ;  i++ ) {
					if ( pp.rp.t < path[i].rp.t ) {
						path.splice( i, 0, pp );
						return path
					}
				}

				path.push( pp );
				return path;
			}

			var getPossiblePath = function( oPath, param ) {
				// 合理編排路徑
				var pathList = param.Client.List.map( function ( rec ) {
					var tmp = oPath.slice( 1,oPath.length-1 ); // 排除場站點
					insertPoint( tmp, {rp:rec.o} );
					insertPoint( tmp, {rp:rec.d} );
					return tmp;
				} );
				// 前後插入場站
				pathList.forEach( function ( rec ) {
					rec.splice( 0, 0, { rp: angular.copy( param.Site ) } );
					rec.push( { rp: angular.copy( param.Site ) } );
				} );
				// 計算各點抵達即離開時間
				// 限制式篩選
				return[];
			};

			$scope.execute = function () {
				var param = angular.copy( Parameter );
				// 設定參數
				param.Client.List
					.sort( function ( a, b ) { return a.o.t-b.o.t; } )
					.forEach( function ( rec, idx ) { 
						rec.o.name='c'+idx+'+';
						rec.d.name='c'+idx+'-';
					} );
				// 依照開始時間窗先後順序對客戶名單進行排序
				// 標記客戶需求點
				console.log( param.Client.List );
				var CarPathLog = [];
				for ( var k = 1 ; k <= param.Car.K ; k++ ) {
					CarPathLog[k] = [ { rp : angular.copy( param.Site ) } ];
					/* { at lt rp } */
					var pathList = undefined ; 
					while ( ( pl = getPossiblePath( CarPathLog[k].path, param ) ).length != 0 ) { // 找出可行路徑
						// 決定路徑
						// 改變路徑
					}
				}
				console.log( CarPathLog );
			}
		} )
} ) ( angular );

/*

			var getPossiblePoint = function ( pathLog, param ) {
				var now = pathLog[pathLog.length-1];
				now.pcl = param.Client.List.map( function ( rec ) {
					var res = {};
					res.jt = getJT(now.point, rec.o, param.Car.Speed);
					res.at = now.lt+res.jt;
					res.lt = param.Car.S+( ( res.at < rec.Time-param.Client.WS )? rec.Time-param.Client.WS : res.at );
					res.wt = res.lt-now.lt;
					var backJT = getJTAry( 
							[ rec.o ]
								.concat( now.pl.map( function ( rec ) { return rec.d; } ) )
								.concat( rec.d, param.Site ),
							param.Car.Speed );
					var temp = 0;
					res.backJTS = backJT.map( function ( rec ) {  
						var res = rec+temp;
						temp = res+param.Car.S;
						return res;
					} );
					res.client = rec;

					if ( pathLog.length == 1 && res.jt < ( rec.Time-param.Client.WS ) ) {
						res.at = rec.Time-param.Client.WS;
						res.lt = param.Car.S+res.at;
						res.slt = res.at-res.jt;
					} // 站場出發時間調整
					return res;
				} ).filter( function ( prec ) {
					return ( // 車容量限制
							( now.pl.length+1 ) <= param.Car.C 
						) && ( // 時間窗限制
							prec.at < ( prec.client.Time+param.Client.WS )
						) && ( // 乘客搭乘時間限制
							now.pl.every( function ( rec, idx ) {
								return rec.jt+prec.wt+prec.jt+prec.backJTS[idx] < param.Client.R;
							} )
						) && ( // 接乘客戶搭乘時間限制
							prec.backJTS[prec.backJTS.length-2] < param.Client.R
						) && ( // 駕駛時間限制
							prec.lt-(prec.slt!=undefined?prec.slt:pathLog[0].lt)+prec.backJTS[prec.backJTS.length-1] 
								< param.Car.WT
						);
				} );
				// 取出可服務且未服務客戶名單
				var possiblePoint = now.pcl.map( function ( rec ) { 
						return rec.client.o; 
					} ).concat( now.pl.map( function ( rec ) { 
						return rec.d; 
					} ) );
				// 可服務且未服務客戶+乘客需求點；
				// 處理程序自然的造成先考慮未服務的需求點在考慮返程
				if ( pathLog.length > 1 && now.point != param.Site )
					possiblePoint.push( param.Site );
				// 出站後增加回站的選項
				return possiblePoint;
			};

			var toPoint = function ( pathLog, point, param ) {
				var nowp = pathLog[pathLog.length-1];
				var njt = getJT( nowp.point, point, param.Car.Speed );
				var newp = {
					at : nowp.lt+njt,
					lt : nowp.lt+njt+param.Car.S,
					pl : nowp.pl.filter( function ( rec ) {
						rec.jt += njt;
						if ( point != rec.d ) {
							rec.jt += param.Car.S;
							return true; 
						} else 
							return false; 
					} ), // 乘車時間累加&剃除下車乘客(多人)
					point : point
				};
				var prediction = nowp.pcl.find( function ( rec ) { 
					return rec.client.o == point; 
				} ); // 找出上車客人(1人)
				if ( prediction ) {
					param.Client.List.splice( param.Client.List.indexOf(prediction.client), 1 );
					// 從未服務名單去除
					newp.lt = prediction.lt; 
					// 得出最後發車時間
					prediction.client.jt = 0;
					newp.pl.push( prediction.client );
					// 搭車

					if ( pathLog.length == 1 && njt < ( prediction.client.Time-param.Client.WS ) ) {
						newp.at = prediction.client.Time-param.Client.WS;
						newp.lt = param.Car.S+newp.at;
						pathLog[0].lt = newp.at-njt;
					}
					// 站場出發時間調整

					// now.pl.forEach( function ( rec ) { rec.jt = rec.jt+newp.lt-nowp.lt; } );
					// // 乘客乘車時間累加
				} // 上車程序
				pathLog.push( newp );
			};

			$scope.execute = function () {
				var param = angular.copy( Parameter );
				// 設定參數
				param.Client.List.sort( function ( a, b ) {
					return a.Time-b.Time;
				} ).forEach( function (rec) {
					rec.jt = 0;
				} );
				// 依照時間窗先後順序對客戶名單進行排序
				var CarLog = [];
				for ( var k = 1 ; k <= param.Car.K ; k++ ) {
					CarLog[k] = pathLog = [ {
						at : 0,
						lt : 0,
						pl : [],
						point : param.Site
					} ];
					for ( var pl = undefined ; 
							( pl = getPossiblePoint( pathLog, param ) ).length != 0 ; 
							toPoint( pathLog, pl[0], param) 
					);
				}
				console.log( CarLog );
			};
*/