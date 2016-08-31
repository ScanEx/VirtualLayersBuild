/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1)
	__webpack_require__(2)


/***/ },
/* 1 */
/***/ function(module, exports) {

	;(function() {
	"use strict";

	// https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.RotatedMarker.js

	const RotatedMarker = L.Marker.extend({
	    options: {
	        angle: 0
	    },

	    statics: {
	        TRANSFORM_ORIGIN: L.DomUtil.testProp(
	            ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin'])
	    },

	    _initIcon: function() {
	        L.Marker.prototype._initIcon.call(this);

	        this._icon.style[L.RotatedMarker.TRANSFORM_ORIGIN] = this._getTransformOrigin();
	    },

	    _getTransformOrigin: function() {
	        var iconAnchor = this.options.icon.options.iconAnchor;

	        if (!iconAnchor) {
	            return '50% 50%';
	        }

	        return iconAnchor[0] + 'px ' + iconAnchor[1] + 'px';
	    },

	    _setPos: function(pos) {
	        L.Marker.prototype._setPos.call(this, pos);

	        if (L.DomUtil.TRANSFORM) {
	            // use the CSS transform rule if available
	            this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
	        } else if (L.Browser.ie) {
	            // fallback for IE6, IE7, IE8
	            var rad = this.options.angle * (Math.PI / 180),
	                costheta = Math.cos(rad),
	                sintheta = Math.sin(rad);
	            this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
	                costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
	        }
	    },

	    setAngle: function(ang) {
	        this.options.angle = ang;
	    }
	});

	const rotatedMarker = function(pos, options) {
	    return new L.RotatedMarker(pos, options);
	};

	function pick(obj, keys) {
	    return Object.keys(obj).filter(function(k) {
	        return !!(keys.indexOf(k) + 1)
	    }).reduce(function(prev, curr) {
	        var o = {}
	        o[curr] = obj[curr]
	        return L.extend(prev, o)
	    }, {})
	}

	function bool(v) {
	    if (v === 'false') {
	        return false
	    }
	    return !!v
	}

	const ClusterLayer = L.Class.extend({
	    includes: [L.Mixin.Events],

	    options: {
	        dataLayer: null,
	        dataLayerId: '',
	        openPopupOnClick: true,
	        openPopupOnHover: undefined
	    },

	    // options.minZoom
	    // options.maxZoom
	    // options.dataLayer
	    // options.dataLayerId
	    // options.openPopupOnClick
	    // options.openPopupOnHover
	    // + MarkerClusterGroup options
	    initialize: function(options) {
	        L.setOptions(this, options)
	        this.options.openPopupOnClick = bool(this.options.openPopupOnClick)
	        this.options.openPopupOnHover = bool(this.options.openPopupOnHover)
	        this._markerClusterGroup = L.markerClusterGroup(pick(this.options, [
	            'showCoverageOnHover',
	            'zoomToBoundsOnClick',
	            'spiderfyOnMaxZoom',
	            'removeOutsideVisibleBounds',
	            'animate',
	            'animateAddingMarkers',
	            'disableClusteringAtZoom',
	            'maxClusterRadius',
	            'polygonOptions',
	            'singleMarkerMode',
	            'spiderLegPolylineOptions',
	            'spiderfyDistanceMultiplier',
	            'iconCreateFunction',
	            'minZoom',
	            'maxZoom'
	        ]))
	    },

	    _updateBbox: function() {
	        this._styleManager.gmx.currentZoom = this._map.getZoom()
	        var screenBounds = this._map.getBounds(),
	            p1 = screenBounds.getNorthWest(),
	            p2 = screenBounds.getSouthEast(),
	            bbox = L.gmxUtil.bounds([
	                [p1.lng, p1.lat],
	                [p2.lng, p2.lat]
	            ])
	        this._observer && this._observer.setBounds(bbox)
	    },

	    onAdd: function(map) {
	        this._map = map

	        this._getDataLayer().then((dataLayer) => {
	            this._dataLayer = dataLayer
	            this._styleManager = this._dataLayer._gmx.styleManager
	            return this._styleManager.initStyles()
	        }).then(() => {
	            map.on('moveend', this._updateBbox, this)
	            this._updateBbox()
	            this._bindDataProvider()
	        }).catch((err) => {
	            console.error(err)
	        })

	        map.addLayer(this._markerClusterGroup)
	        map.on('zoomend', this._onMapZoomend, this)
	        this._onMapZoomend()
	        this._bindPopupEvents()
	    },

	    onRemove: function(map) {
	        this._getDataLayer().then((dl) => {
	            this._unbindDataProvider()
	            map.removeLayer(this._markerClusterGroup)
	            map.off('moveend', this._updateBbox, this)
	        })
	        map.off('zoomend', this._onMapZoomend, this)
	    },

	    setDateInterval: function(dateBegin, dateEnd) {
	        this._dateInterval = [dateBegin, dateEnd]
	        this._observer && this._observer.setDateInterval.apply(this._observer, this._dateInterval)
	    },

	    openPopup: function(itemId, originalEvent = null) {
	        const layer = this._dataLayer
	        const item = this._dataLayer._gmx.dataManager.getItem(itemId)

	        if (!item) { return }

	        const itemGeo = item.properties[item.properties.length - 1]
	        const latlng = L.Projection.Mercator.unproject({
	            x: itemGeo.coordinates[0],
	            y: itemGeo.coordinates[1]
	        })
	        const parsedProperties = layer.getItemProperties(item.properties)

	        const popup = this.createPopup({ parsedProperties, item, layer, originalEvent })

	        if (!popup) { return }

	        this._popup = popup

	        popup.once('close', () => {
	            this._popupMode = ''
	            this._popup = null
	        })

	        this._popup
	            .setLatLng(latlng)
	            .openOn(this._map)
	    },

	    createPopup: function ({ parsedProperties: propertiesHash, item: { id, properties: propertiesArr }, layer: dataLayer }) {
	        const balloonData = dataLayer._gmx.styleManager.getItemBalloon(id)

	        if (balloonData && !balloonData.DisableBalloonOnClick) {
	            var style = dataLayer.getItemStyle(id)
	            if (style && style.iconAnchor) {
	                var protoOffset = L.Popup.prototype.options.offset
	                this._popup.options.offset = [-protoOffset[0] - style.iconAnchor[0] + style.sx / 2,
	                    protoOffset[1] - style.iconAnchor[1] + style.sy / 2
	                ]
	            }

	            return L.popup()
	                .setContent(L.gmxUtil.parseBalloonTemplate(balloonData.templateBalloon, {
	                    properties: propertiesHash,
	                    tileAttributeTypes: dataLayer._gmx.tileAttributeTypes,
	                    unitOptions: this._map.options || {},
	                    geometries: [propertiesArr[propertiesArr.length - 1]]
	                }))
	        }
	    },

	    _onMapZoomend: function (le) {
	        const { _map, _markerClusterGroup, options } = this
	        const hl = _map.hasLayer(_markerClusterGroup)
	        if (typeof options.minZoom === 'string' && _map.getZoom() < options.minZoom / 1) {
	            hl && _map.removeLayer(_markerClusterGroup)
	        } else if (typeof options.maxZoom === 'string' && _map.getZoom() > options.maxZoom / 1) {
	            hl && _map.removeLayer(_markerClusterGroup)
	        } else {
	            !hl && _map.addLayer(_markerClusterGroup)
	        }
	    },

	    _getDataLayer: function () {
	        if (!this._pGetDataLayer) {
	            this._pGetDataLayer = new Promise((resolve, reject) => {
	                if (this.options.dataLayer) {
	                    return resolve(this.options.dataLayer)
	                } else if (this.options.dataLayerRef) {
	                    const arRes = this.options.dataLayerRef.split(':')
	                    if (arRes.length !== 2) {
	                        return reject('invalid dataLayerRef')
	                    }
	                    return L.gmx.loadLayer(arRes[0], arRes[1]).then(resolve, reject)
	                }
	                return reject('dataLayer is not specified')
	            })
	        }

	        return this._pGetDataLayer
	    },

	    _bindDataProvider: function() {
	        this._observer = this._dataLayer.addObserver({
	            type: 'resend',
	            filters: ['styleFilter'],
	            dateInterval: this._dateInterval,
	            callback: this._onObserverData.bind(this)
	        })
	    },

	    _unbindDataProvider: function() {
	        this._dataLayer.removeObserver(this._observer)
	        this._observer = null
	    },

	    _onObserverData: function(data) {
	        const { dataLayer } = this.options

	        // this._vectorTileItemsProperties = {}
	        const markers = data.added.map(({ id, properties, item: { parsedStyleKeys } }) => {
	            // this._vectorTileItemsProperties[id] = dataLayer.getItemProperties(properties)
	            const itemGeoJson = properties[properties.length - 1]
	            if (itemGeoJson.type !== 'POINT') {
	                return
	            }

	            const itemStyle = parsedStyleKeys || dataLayer.getItemStyle(id)

	            const latlng = L.Projection.Mercator.unproject({
	                x: itemGeoJson.coordinates[0],
	                y: itemGeoJson.coordinates[1]
	            })

	            if (itemStyle.iconUrl) {
	                return createIconMarker(latlng, itemStyle, { id })
	            } else {
	                return L.marker(latlng, { id })
	            }
	        }).filter(item => !!item)

	        this._markerClusterGroup.clearLayers()
	        this._markerClusterGroup.addLayers(markers)

	        this.fire('update')

	        function createIconMarker(latlng, itemStyle, options) {
	            if (itemStyle.rotate) {
	                return rotatedMarker(latlng, L.extend({}, {
	                    icon: createIconMarkerIcon(itemStyle),
	                    angle: itemStyle.rotate
	                }, options))
	            } else {
	                return L.marker(latlng, L.extend({}, {
	                    icon: createIconMarkerIcon(itemStyle)
	                }, options))
	            }
	        }

	        function createIconMarkerIcon(itemStyle) {
	            if (itemStyle && itemStyle.iconUrl) {
	                var iconAnchor = itemStyle.image ? [itemStyle.sx / 2, itemStyle.sy / 2] : [8, 10]
	                return L.icon({
	                    iconAnchor: iconAnchor,
	                    iconUrl: itemStyle.iconUrl
	                })
	            } else {
	                return L.gmxUtil.getSVGIcon(itemStyle)
	            }
	        }

	    },

	    _closePopup: function() {
	        if (!this._popup) {
	            return
	        }

	        this._map.removeLayer(this._popup)
	        this._popup = null
	    },

	    _popupOnClustersMarkerMouseover: function ({ layer: marker, latlng, originalEvent }) {
	        if (!this.options.openPopupOnHover) {
	            return
	        }

	        if (!this._popupMode) {
	            this._popupMode = 'hover'
	            this.openPopup(marker.options.id, originalEvent)
	        }
	    },

	    _popupOnClustersMarkerMouseout: function (le) {
	        if (this._popupMode === 'hover') {
	            this._closePopup()
	            this._popupMode = ''
	        }
	    },

	    _popupOnClustersAnimationEnd: function (ev) {
	        // const map = this._popup && this._popup._map
	        // map && map.removeLayer(this._popup)
	    },

	    _popupOnClustersMarkerClick: function ({ layer: marker, latlng, originalEvent }) {
	        if (!this.options.openPopupOnClick) {
	            return
	        }

	        this._popupMode = 'click'
	        this.openPopup(marker.options.id, originalEvent)
	    },

	    _bindPopupEvents: function () {
	        const mcg = this._markerClusterGroup
	        mcg.on('animationend', this._popupOnClustersAnimationEnd, this)
	        mcg.on('mouseover', this._popupOnClustersMarkerMouseover, this)
	        mcg.on('mouseout', this._popupOnClustersMarkerMouseout, this)
	        mcg.on('click', this._popupOnClustersMarkerClick, this)
	    }
	})

	const nsGmx = window.nsGmx || {}

	if (typeof module !== 'undefined' && module.exports) {
	    module.exports = ClusterLayer
	} else {
	    nsGmx.ClusterLayer = ClusterLayer
	}
	}());


/***/ },
/* 2 */
/***/ function(module, exports) {

	(function() {
	(function(){

	/*
	 Spatial Query - a JQuery like Javascript library for handling spatial maths
	 Copyright (c) 2009 Chris Zelenak
	 Spatial Query is freely distributable under the MIT X11 License - see LICENSE file.

	 Chris Z
	 For work at www.indy.com
	 Talked about at www.yeti-factory.org

	*/
	var _polygon = function(o) {
	  return new _polygon.prototype.assert(o);
	}
	var _vector = function(o) {
	  return new _vector.prototype.assert(o);
	}
	var _EF = function(o) {
	  return new _EF.prototype.assert(o);
	}

	var $p = _polygon;
	var $v = _vector;

	window.SpatialQuery = {
	    $p: $p, 
	    $v: $v
	}


	// Lookup tables for boolean operations (intersection, union, difference)
	var polygonsorientation = Array();
	var fragmenttype = Array();
	var boundaryfragment = Array();
	var resultsorientation = Array();



	_EF.prototype = {
	  assert : function() {
	    this.edge_list = [];
		return this;
	  },
	  insertE : function(fragment, reg) {
	    // Check if the edge is already in the list
		for(var i = 0;i < this.edge_list.length;i++) {
		  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
		    // If the edge is already in the list, we are done.
			return;
		  
		  }
		  
		  if(this.edge_list[i][0][0] == fragment[1][0] && this.edge_list[i][0][1] == fragment[1][1] && this.edge_list[i][1][0] == fragment[0][0] && this.edge_list[i][1][1] == fragment[0][1]) {
			// If the edge is found in the list, but reversed, remove it from the list and we are done.
			this.edge_list.splice(i,1);
			return;		 
		  }
	    }
	    this.edge_list.push(fragment);
	  },
	  deleteE : function(fragment) {
	    // Check if the edge is already in the list
		for(var i = 0;i < this.edge_list.length;i++) {
		  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
		    // If the edge is already in the list, delete it
			this.edge_list.splice(i,1);
			return;
		  }
	    }
		// Otherwise there is nothing to remove.
		//console.log("deleteE: no edge to delete.");
		return;
	  },
	  popnextE : function(point) {
		// Check if the edge is already in the list
		for(var i = 0;i < this.edge_list.length;i++) {
			if(this.edge_list[i][0][0] == point[0] && this.edge_list[i][0][1] == point[1]){
				var result =  this.edge_list[i];
				this.edge_list.splice(i,1);			
				return result;		  
			}
		}
		return null;
	  },
	  searchE : function(fragment) {
	    // Check if the edge is already in the list
		for(var i = 0;i < this.edge_list.length;i++) {
		  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
		    // If the edge in the list, return it's index.
			return i;
		  }
	    }
		
		//console.log("searchE: no edge found.");
		return -1;
	  },
	  organizeE : function() {
	    return;
	  }
	}

	_vector.prototype = {
	  assert: function(obj,attribs) {
	    this.data = [0, 0, 0];
		if(obj == undefined || obj == null){
		  this.dims = 0;
		  this.data = [];
		}else if(obj.vector && typeof(obj.vector) == "function") {
		  var v = obj.vector();
		  this.data = v.data;
		  this.dims = v.dims;
		}else if(obj.x || obj.y || obj.z){
		  this.data[0] = obj.x || 0.0;
		  this.data[1] = obj.y || 0.0;
		  this.data[2] = obj.z || 0.0;
		} else if(obj.length) {
		  this.data = obj;
		  this.dims = obj.length;
		}
		
		if(attribs != null && attribs != undefined){
		  for(var k in attribs) {
		    this[k] = attribs[k];
		  }
		}
		return this;	
	  },
	  
	  x : function(){
	    return this.data[0];
	  },
	  y : function(){
	    return this.data[1];
	  },
	  z : function(){
	    return this.data[2];
	  },
	  vector : function() {
	    return this;
	  }
	}

	function init_union_tables() 
	{
		if(polygonsorientation.length > 0){
			return;
		}
		polygonsorientation = [[[ORIENTATION_SAME,ORIENTATION_SAME,ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE],
								[ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE,ORIENTATION_SAME,ORIENTATION_SAME]],
							   [[ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE,ORIENTATION_SAME,ORIENTATION_SAME],
							    [ORIENTATION_SAME,ORIENTATION_SAME,ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE]]
							  ];

		fragmenttype = [
						[
						 [[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE]],
						 [[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE]]
						],
						[
						 [[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE]],
						 [[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE]]
						]
						];
		
		boundaryfragment = [
		                    [
							  [[[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE]],
							  [[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE]],
							  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_BOTH,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]]],
							
							 [[[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_NONE]],
							  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_BOTH]]]
							],
							[
							 [[[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_BOTH]],
							  [[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_BOTH]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH]],
							  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_BOTH]]],
							
							 [[[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_FORWARD]],
							  [[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_NONE]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]],
							  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
							  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_BOTH,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]]]
							]
						  ];
		
		resultsorientation = [[[1,1,1,-1],
		                       [1,-1,1,1]],
							  [[-1,1,1,1],
							   [1,1,-1,1]]
							 ];
	}

	_polygon.prototype = {  
	  assert: function(obj,type) {
	    init_union_tables();
		this.bound_minX = Number.MAX_VALUE;
		this.bound_maxX = -Number.MAX_VALUE;
		this.bound_minY = Number.MAX_VALUE;
		this.bound_maxY = -Number.MAX_VALUE;
		
	    if(obj == undefined || obj == null){
		   this.head = null;
		   this.tail = null;
		   this.direciton = null;
		   this.holes = [];
		   if(type == null || type == undefined) {
			this.type = _polygon.TYPE_ISLAND;
		   }else{
		    this.type = type;
		   }
		   this.count = 0;
		} else if (obj.polygon && typeof(obj.polygon) == "function") {
		  var p = obj.polygon();
		  this.head = p.head;
		  this.tail = p.tail;
		  this.direction = p.direction;
		  this.count = p.count;
		  this.type = p.type;
		  this.holes = p.holes;
		} else if(obj.length) {
		  this.count = 0;
		  this.holes = [];
		  for(var i = 0;i < obj.length; i++) {
		    this.add_point(obj[i],{type: T_VERTEX_BOUNDARY});
		  }
		  this.direction = this.compute_direction();
		  if(type == null || type == undefined) {
			this.type = _polygon.TYPE_ISLAND;
		   }else{
		    this.type = type;
		   }
		}
		return this;
	  },
	  compute_direction : function(){
	    if(this.count < 3) {
		  return _polygon.DIRECTION_INVALID;
		}
		var minXNode = this.head;
		this.foreach(function(node) {
		  if ( node.x < minXNode.x) {
		    minXNode = node;
		  }
		});
		if (minXNode.next.y > minXNode.prev.y) {
		  return _polygon.DIRECTION_CLOCKWISE;
		} else {
		  return _polygon.DIRECTION_COUNTERCLOCKWISE;
		}
	  },
	  reverse_direction : function(){
	    var start = this.head;
		var current = this.head;
		var tmp = null;
		
		do{
			tmp = current.next;
			current.next = current.prev;
			current.prev = tmp;
			// 
			current = current.prev; 
		}while(current != start);
		
		this.direction = this.compute_direction();
	  },
	  union: function(otherPoly) {  
		try{
			return _polygon.prototype.boolean_operation(this, otherPoly, OPERATION_UNION,0);
		}catch(e){
			console.log(e);
		}
	  },
	  boolean_operation: function(A,B,Oper,Reg) {
		var orientationA = A.direction;
		var orientationB = B.direction;
		
		// If the operation is union, and bounding boxes dont overlap return right away.
		if(A.bound_maxX < B.bound_minX || A.bound_minX > B.bound_maxX || 
		   A.bound_maxY < B.bound_minY || A.bound_minY > B.bound_maxY) {
			return null;
		}
		
		// Initialize Edge fragment structure.
		
		edgeFragments = _EF();
		//(function(){
		// Change polygon orientation according to operation table.
		if(polygonsorientation[A.type][B.type][Oper] == ORIENTATION_SAME && orientationA != orientationB){
			if(orientationA != orientationB){
				B.reverse_direction();
			}
		}else if(polygonsorientation[A.type][B.type][Oper] == ORIENTATION_OPPOSITE && orientationA == orientationB){
			B.reverse_direction();
		}
		
		var nInside = 0;
		
		// Classify which vertices are inside the other polygon.
		var node = A.head;
		do { 
			node.type = B.point_inside_2d(node);
			if(node.type != T_VERTEX_OUTSIDE) {
				nInside++;
			}
			node = node.next;
		} while(node != A.head);

		var node = B.head;
		do {
			node.type = A.point_inside_2d(node);
			if(node.type != T_VERTEX_OUTSIDE) {
				nInside++;
			}
			node = node.next;
		} while(node != B.head);
		
		// If there are no inside or boundary nodes, there is nothing to do, two polygons dont overlap.
		if(nInside == 0 && Oper == OPERATION_UNION) {
			return null;
		}
		
		// Find intersections
		var noIntersections = 1;
		var node = A.head;
		do {
			var a_start = node;
			var a_end = node.next;		
			
			var node2 = B.head;
			do {
				var b_start = node2;
				var b_end = node2.next;
				
				var seg1 = [[a_start.x,a_start.y],[a_end.x,a_end.y]];
				var seg2 = [[b_start.x,b_start.y],[b_end.x,b_end.y]];
				var intersection = pointOfIntersectionForLineSegments(seg1,seg2);
				
				if(intersection != null) {
				  // Only insert intersection if its not already a vertex.
				  // Otherwise just change the vertex type.
				  if(intersection[2] == 0){
					a_start.type = T_VERTEX_BOUNDARY;
				  }else if(intersection[2] == 1){
					a_end.type = T_VERTEX_BOUNDARY;
				  }else{
					var Point = new _polygon.prototype.vtx(intersection,{type: T_VERTEX_BOUNDARY});
					A.insert_vertex_after(Point,a_start);
					a_end = node.next;				
				  }
				  
				  if(intersection[3] == 0){
					b_start.type = T_VERTEX_BOUNDARY;
				  }else if(intersection[3] == 1){
					b_end.type = T_VERTEX_BOUNDARY;
				  }else{
					var Point = new _polygon.prototype.vtx(intersection,{type: T_VERTEX_BOUNDARY});
					B.insert_vertex_after(Point,b_start);
					b_end = node2.next;
				  }
				}
				node2 = node2.next;
			} while(node2 != B.head)
			
			node = node.next;
		} while(node != A.head);
		//})();
		
		//(function(){
		// Classify, select and organize edge fragments
		var Type = fragmenttype[A.type][B.type][Oper][0];	
		
		var node = A.head;
		do { 
			var start = node;
			var end = node.next;		
			var seg = [[start.x,start.y],[end.x,end.y]];
			
			if(start.type == Type || end.type == Type) {			
				edgeFragments.insertE(seg);
			} else if (start.type == T_VERTEX_BOUNDARY && end.type == T_VERTEX_BOUNDARY) {
				var m = [ (end.x + start.x)/2, (end.y + start.y)/2 ];
				var res = B.point_inside_2d(m);
				
				if(res == Type || res == T_VERTEX_BOUNDARY){
					edgeFragments.insertE(seg);
				}
			}
			node = node.next;
		} while(node != A.head);
		
		var Type2 = fragmenttype[A.type][B.type][Oper][1];
		
		var node = B.head;
		do { 
			var start = node;
			var end = node.next;		
			var seg = [[start.x,start.y],[end.x,end.y]];
			
			if(start.type == Type2 || end.type == Type2) {			
				edgeFragments.insertE(seg);
			} else if (start.type == T_VERTEX_BOUNDARY && end.type == T_VERTEX_BOUNDARY) {
				var m = [ (end.x + start.x)/2, (end.y + start.y)/2 ];
				var res = A.point_inside_2d(m);
				
				if(res == Type2 || res == T_VERTEX_BOUNDARY){
					edgeFragments.insertE(seg);
				}
			}
			node = node.next;
		} while(node != B.head);
		
		/*
		for(iEdge = 0;iEdge < edgeFragments.edge_list.length;iEdge++) {
			seg = edgeFragments.edge_list[iEdge];
			revEdge = [seg[1],seg[0]];
			var iRevEdge = edgeFragments.searchE(revEdge);
			
			// TODO: Compute situation code
			var sit = 0;
			
			d = boundaryfragment[A.type][B.type][sit][Reg][Oper];
			
			if(d == DIRECTION_NONE) {
				edgeFragments.deleteE(seg);
				if(iRevEdge >= 0) {
					edgeFragments.deleteE(revEdge);
				}
				// TODO Verify this code is correct
			} else if(d == DIRECTION_BOTH){
				edgeFragments.delteE(seg);	
				// TOdo investigate what to do here exactly, not quiet clear
			}
		}
		*/
		
		edgeFragments.organizeE();
		//})();
		var Out = null;
		var outHoles = [];
		var outPolygons = [];
		
		
		//(function constructResultPolygons(){
		// Construct the result polygons and find their types.
		while(edgeFragments.edge_list.length > 0) {
			var fNext = edgeFragments.popnextE(edgeFragments.edge_list[0][0]);
			
			var edgeLoop = [];
			
			do {
				edgeLoop.push(fNext);
				fNext = edgeFragments.popnextE(fNext[1]);
			}while(fNext != null);
						
			var cEdge = edgeLoop[0];		
			
			var resultPolygon = $p();
			var startPoint = cEdge[0];
			
			for(var iLoopEdge = 1;iLoopEdge <= edgeLoop.length;iLoopEdge++) {
				var seg1 = cEdge;
				
				if(iLoopEdge == edgeLoop.length) {			
					// Add the first point of the edge loop into the result polygon.
					seg2 = [startPoint,[resultPolygon.head.x,resultPolygon.head.y]];
				} else {
					seg2 = edgeLoop[iLoopEdge];
				}
				
				var dy1 = (seg1[1][1] - seg1[0][1]);
				var dy2 = (seg2[1][1] - seg2[0][1]);
				
				var slope1 = Number.MAX_VALUE; // Default to Number.MAX_VALUE, when dividing by 0	
				var slope2 = Number.MAX_VALUE;
				
				if(dy1 != 0){
					slope1 = (seg1[1][0] - seg1[0][0]) / dy1;
				}
				if(dy2 != 0){
					slope2 = (seg2[1][0] - seg2[0][0]) / dy2;
				}
				
				// Check if the two edges are colinear, if they are join them
				if(slope1 == slope2){
					cEdge = [seg1[0],seg2[1]];
				}else{
					// Otherwise record the edge in to the output structure
					resultPolygon.add_point(cEdge[1]);
					cEdge = seg2;
				}
			}
			
			// Figure out the orientation of the current result polygon
			resultPolygon.direction = resultPolygon.compute_direction();
			if(resultPolygon.direction == orientationA) {
				if(resultsorientation [A.type][B.type][Oper] == ORIENTATION_SAME){
					resultPolygon.type = (Number)(A.type);
				} else {
					resultPolygon.type = (Number)(!A.type);
				}
			} else if(resultsorientation [A.type][B.type][Oper] == ORIENTATION_SAME) {
				resultPolygon.type = (Number)(!A.type);
			} else {
				resultPolygon.type = (Number)(A.type);
			}
			
			if(resultPolygon.type == _polygon.TYPE_ISLAND) {
				outPolygons.push(resultPolygon);
			} else {
				outHoles.push(resultPolygon);
			}
		}
		//})();
		
		if(outPolygons.length == 1){
			Out = outPolygons[0];
			Out.holes = outHoles;
		}else{
			console.log('Output polygons invalid. Length = '+outPolygons.length);
		}
		
		return Out;	
	  },
	  vtx : function(pt, attribs) {
	    this.x = (pt[0]) || 0.0;
		this.y = (pt[1]) || 0.0;
		this.next = null;
		this.prev = null;
		
		if(attribs != null && attribs != undefined){
		  for(var k in attribs) {
		    this[k] = attribs[k];
		  }
		}
		return this;  
	  },
	  add_point : function(point, attribs) {
	    var v = new _polygon.prototype.vtx(point, attribs);
		this.add_vtx(v);
		return this;
	  },
	  foreach : function(fn){
	    var node = this.head;
		do { 
		  fn.apply(this, [node]);
		  node = node.next;
		} while(node != this.head);
	  },
	  add_vtx : function(vtx) {
		// Update polygon bounding box.
		if(vtx.x < this.bound_minX){
			this.bound_minX = vtx.x;
		}
		if(vtx.x > this.bound_maxX){
			this.bound_maxX = vtx.x;
		}
		if(vtx.y < this.bound_minY){
			this.bound_minY = vtx.y;
		}
		if(vtx.y > this.bound_maxY){
			this.bound_maxY = vtx.y;
		}
		
	    if(this.head == null) {
		  this.head = vtx;
		  this.tail = vtx;
		  this.head.prev = this.head;
		  this.head.next = this.head;
		  this.count++;
		} else {
		  this.insert_vertex_after(vtx, this.tail);
		}
		return this;  
	  },
	  insert_vertex_after : function(vtx, after) {
	    var nxt = after.next;
		after.next = vtx;
		nxt.prev = vtx;
		vtx.prev = after;
		vtx.next = nxt;
		if(this.tail == after) {
		  this.tail = vtx;
		}
		this.count++;
		return this;
	  }, 
	   to_wkt : function(){
		
	    var a = [];
	    this.foreach(function(node){
	                   a.push([node.x, node.y]);
	                 });
					 
		var str = "POLYGON(";
		
		str += "(";
		for(var i = 0; i < a.length;i++) {
			str += a[i][0] + " " + a[i][1] + ",";
		}
		str += a[0][0] + " " + a[0][1];
		str += ")";
		
		for(var iHole = 0;iHole < this.holes.length;iHole++) {
			var b = [];
			this.holes[iHole].foreach(function(node){
				   b.push([node.x, node.y]);
				 });
			str += ",(";
			for(var i = 0; i < b.length;i++) {
				str += b[i][0] + " " + b[i][1] + ",";
			}
			str += b[0][0] + " " + b[0][1];
			str += ")";	
		}
		
		str +=")";
		
	    return str;
	  },
	  to_point_array_2d : function(){
	    var a = [];
	    this.foreach(function(node){
	                   a.push([node.x, node.y]);
	                 });
	    return a;
	  }, 
	  point_inside_2d : function(vtx) {
	    var wn = 0;    // the winding number counter
		
		var isBoundary = 0;
		
		var v_x = 0;
		var v_y = 0;
		
		if(vtx.x){
		  v_x = vtx.x;
		  v_y = vtx.y;
		} else{
		  v_x = vtx[0];
		  v_y = vtx[1];
		}
		
		var seg = [[v_x, v_y],[10000000,v_y]];
		
	    // loop through all edges of the polygon
		var node = this.head;
		do {
		    var nxt = node.next;
			var seg2 = [[node.x,node.y],[nxt.x,nxt.y]];
			
			var intersection = pointOfIntersectionForLineSegments(seg,seg2);
			
			if(intersection != null) {
				if(intersection[2] == 0) {
				isBoundary = 1;
			  }
				// E[i] crosses upward ala Rule #1
				if(seg2[0][1] < seg2[1][1]) {
				  // For upwards edge ignore ending point
				  if(intersection[3] != 1){
					wn++;			  
				  }
				}else if(seg2[0][1] > seg2[1][1]) {
					// For downward edge ignore starting point
					if(intersection[3] != 0){
					wn--;
				}
			  }
			}else if(seg2[0][1] == v_y && seg2[0][1] == seg2[1][1] && (seg2[0][0] <= v_x || seg2[1][0] <= v_x)){
				// Check if the point is on the boundary (between two x coordinates of the edge segment)
				if( (v_x >= seg2[0][0] && v_x <= seg2[1][0]) || (v_x >= seg2[1][0] && v_x <= seg2[0][0])){
					isBoundary = 1;
				}
			}
			
			node = nxt;
		} while(node != this.head);
		
		// Handle case if the point is on the boundary of the polygon
		if(isBoundary) { 
			return T_VERTEX_BOUNDARY;
		}else{
			// Flip output for "hole" polygons.
			if((wn == 0 && this.type == 0) || (wn != 0 && this.type == 1)) {
				return T_VERTEX_OUTSIDE;
			}else{
				return T_VERTEX_INSIDE;
			}
		}
	  }
	}

	_vector.numberInRange = function(n, min, max){
	  return (n >= min && n <= max);
	};
	/*
	_vector.pointAndTypeOfIntersectionForLineSegments = function{
		var intersection = pointOfIntersectionForLineSegments(seg_a, seg_b);
		
		if(intersection == null){
			return T_VERTEX_OUTSIDE;
		} else {
			var point = [intersection[0],intersection[1]];
			
			if(intersection[3] == 0 || intersection[3] == 1 || intersection[3] == 0 || intersection[3] == 1) {
				return T_VERTEX_INSIDE;
			} else {
				return T_VERTEX_BOUNDARY;
			}
		}
	}
	*/
	// segment: [ [x,y], [x2, y2] ]
	// algo and original code from:
	// http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
	function pointOfIntersectionForLineSegments(seg_a, seg_b)
	{	  
	  // Assume lines are horizontal or vertical;
	  
	  // If segment a is vertical
	  if(seg_a[0][0] == seg_a[1][0]) {
	  
		// If both vertical, return null
		if(seg_b[0][0] == seg_b[1][0]) {
			return null;
		} else {
			// Make sure the segments intersect.
			if((seg_b[0][1] > seg_a[0][1] && seg_b[0][1] > seg_a[1][1]) || (seg_b[0][1] < seg_a[0][1] && seg_b[0][1] < seg_a[1][1]) ||
			   (seg_a[0][0] > seg_b[0][0] && seg_a[0][0] > seg_b[1][0]) || (seg_a[0][0] < seg_b[0][0] && seg_a[0][0] < seg_b[1][0])){	
				return null;
			}else{			
				// Ua should be 0 if first point is on the line, 1 if last point is on the line, and 0.5 otherwise
				ua = (seg_a[0][1] == seg_b[0][1])? 0 : ((seg_a[1][1] == seg_b[0][1])? 1 : 0.5);
				ub = (seg_b[0][0] == seg_a[0][0])? 0 : ((seg_b[1][0] == seg_a[0][0])? 1 : 0.5);
				
				return [
				  seg_a[0][0],
				  seg_b[0][1],
				  ua,
				  ub
				];
			}
		}
	  } else {
		// If both horizontal, return null
		if(seg_b[0][1] == seg_b[1][1]) {
			return null;
		} else {
			// Make sure the segments intersect.
			if((seg_b[0][0] > seg_a[0][0] && seg_b[0][0] > seg_a[1][0]) || (seg_b[0][0] < seg_a[0][0] && seg_b[0][0] < seg_a[1][0]) ||
			   (seg_a[0][1] > seg_b[0][1] && seg_a[0][1] > seg_b[1][1]) || (seg_a[0][1] < seg_b[0][1] && seg_a[0][1] < seg_b[1][1])){
				return null;
			} else {		
				// Ua should be 0 if first point is on the line, 1 if last point is on the line, and 0.5 otherwise
				ua = (seg_a[0][0] == seg_b[0][0])? 0 : ((seg_a[1][0] == seg_b[0][0])? 1 : 0.5);
				ub = (seg_b[0][1] == seg_a[0][1])? 0 : ((seg_b[1][1] == seg_a[0][1])? 1 : 0.5);
				
				return [
				  seg_b[0][0],
				  seg_a[0][1],
				  ua,
				  ub
				];
			}
		}
	  }
	  return result;
	};
	_vector.pointOfIntersectionForLineSegmentsDiag = function(seg_a, seg_b){
	  var start_a = seg_a[0],  // v1
	      end_a = seg_a[1],  // v2
	      start_b = seg_b[0], // v3
	      end_b = seg_b[1]; // v4
		  
	  var denom = (end_b[1] - start_b[1]) * (end_a[0] - start_a[0]) - (end_b[0] - start_b[0]) * (end_a[1] - start_a[1]);
	  if(denom == 0) return null; // parallel
	  var numer_a = (end_b[0] - start_b[0]) * (start_a[1] - start_b[1]) - (end_b[1] - start_b[1]) * (start_a[0] - start_b[0]);
	  var numer_b = (end_a[0] - start_a[0]) * (start_a[1] - start_b[1]) - (end_a[1] - start_a[1]) * (start_a[0] - start_b[0]);
	  if(numer_a == 0 && denom == 0 && numer_a == numer_b) return null; // coincident
	  var ua = numer_a / denom,
	      ub = numer_b / denom;
	  if(_vector.numberInRange(ua, 0.0, 1.0) && _vector.numberInRange(ub, 0.0, 1.0)){
	    return [
	      start_a[0] + ua * (end_a[0] - start_a[0]),
	      start_a[1] + ua * (end_a[1] - start_a[1]),
	      ua,
	      ub
	    ]; // return barycenric coordinates for alpha values in greiner-hormann
	  }
	  return null; // does not intersect

	};

	_polygon.TYPE_ISLAND = 0;
	_polygon.TYPE_HOLE = 1;

	_polygon.DIRECTION_INVALID = 0;
	_polygon.DIRECTION_CLOCKWISE = 1;
	_polygon.DIRECTION_COUNTERCLOCKWISE = -1;

	_polygon.prototype.assert.prototype = _polygon.prototype;
	_vector.prototype.assert.prototype = _vector.prototype;
	_EF.prototype.assert.prototype = _EF.prototype;

	var DIRECTION_NONE = 0,DIRECTION_FORWARD = 1,DIRECTION_OPPOSITE = 2, DIRECTION_BOTH = 3;
	var OPERATION_INTERSECTION = 0,OPERATION_UNION = 1,OPERATION_DIFFERENCE = 2,OPERATION_REV_DIFFERENCE = 3;
	var ORIENTATION_SAME = 1,ORIENTATION_OPPOSITE = -1;

	var T_VERTEX_OUTSIDE = 0,T_VERTEX_INSIDE = 1,T_VERTEX_BOUNDARY = 2;

	})();
	nsGmx.Translations.addText("rus", {
	    FireVirtualLayer: {
	        "LayerClusterBalloon": "<div style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></div>" +
	            "<b>Кол-во термоточек:</b> [count]<br/>" +
	            "<b>Время наблюдения:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "LayerClusterBalloonIndustrial": "<span style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></span> (вероятный техногенный источник <a target='blank' href='http://fires.kosmosnimki.ru/help.html#techno'>?</a>) <br/>" +
	            "<b>Кол-во термоточек:</b> [count]<br/>" +
	            "<b>Время наблюдения:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "LayerGeometryBalloon": "<div style='margin-bottom: 5px;'><b style='color: red;'>Контур пожара</b></div>" +
	            "<b>Кол-во термоточек:</b> [count]<br/>" +
	            "<b>Время наблюдения:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "zoomInMessage": "Приблизьте карту, чтобы увидеть контур"
	    }
	});

	nsGmx.Translations.addText("eng", {
	    FireVirtualLayer: {
	        "LayerClusterBalloon": "<div style='margin-bottom: 5px;'><b style='color: red;'>Fire</b></div>" +
	            "<b>Number of hotspots:</b> [count]<br/>" +
	            "<b>Observation period:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "LayerClusterBalloonIndustrial": "<span style='margin-bottom: 5px;'><b style='color: red;'>Fire</b></span> (probable industrial hotspot <a target='_blank' href='http://fires.kosmosnimki.ru/help.html#techno'>?</a>)<br/>" +
	            "<b>Number of hotspots:</b> [count]<br/>" +
	            "<b>Observation period:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "LayerGeometryBalloon": "<div style='margin-bottom: 5px;'><b style='color: red;'>Fire outline</b></div>" +
	            "<b>Number of hotspots:</b> [count]<br/>" +
	            "<b>Observation period:</b> [dateRange]<br/>" +
	            "<div>[SUMMARY]</div>",
	        "zoomInMessage": "Zoom-in to see the outline"
	    }
	});

	// для объединения квадратиков
	// Lookup table for pixel dimensions based on scan index of the pixel
	var ModisPixelDimensions = [];

	function buildModisPixelDimensionsTable() {
	    // Don't rebuild the table if it was already built
	    if (ModisPixelDimensions.length > 0) {
	        return;
	    }

	    var h = 705.0; // Terra/Aqua orbit altitude [km]
	    var p = 1.0; // nadir pixel resolution [km]
	    var EARTH_RADIUS = 6371.0;
	    var SAMPLES = 1354;

	    var r = EARTH_RADIUS + h; /* [km] */
	    var s = p / h; /* [rad] */

	    for (var sample = 0; sample < 1354; sample++) {
	        var theta = sample * s + 0.5 * s - (0.5 * SAMPLES) * s;
	        var cos_theta = Math.cos(theta);

	        var temp = Math.pow((EARTH_RADIUS / r), 2.0) - Math.pow(Math.sin(theta), 2.0);
	        var sqrt_temp = Math.sqrt(temp);

	        var DS = EARTH_RADIUS * s * (cos_theta / sqrt_temp - 1.0) * 1000;
	        var DT = r * s * (cos_theta - sqrt_temp) * 1000;
	        ModisPixelDimensions[sample] = [DS, DT];
	    }
	}

	// тоже для квадратиков
	var _hq = {
	    getDistant: function(cpt, bl) {
	        var Vy = bl[1][0] - bl[0][0];
	        var Vx = bl[0][1] - bl[1][1];
	        return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] - bl[0][1]))
	    },
	    findMostDistantPointFromBaseLine: function(baseLine, points) {
	        var maxD = 0;
	        var maxPt = new Array();
	        var newPoints = new Array();
	        for (var idx in points) {
	            var pt = points[idx];
	            var d = this.getDistant(pt, baseLine);

	            if (d > 0) {
	                newPoints.push(pt);
	            } else {
	                continue;
	            }

	            if (d > maxD) {
	                maxD = d;
	                maxPt = pt;
	            }

	        }
	        return {
	            'maxPoint': maxPt,
	            'newPoints': newPoints
	        }
	    },

	    buildConvexHull: function(baseLine, points) {

	        var convexHullBaseLines = new Array();
	        var t = this.findMostDistantPointFromBaseLine(baseLine, points);
	        if (t.maxPoint.length) {
	            convexHullBaseLines = convexHullBaseLines.concat(this.buildConvexHull([baseLine[0], t.maxPoint], t.newPoints));
	            convexHullBaseLines = convexHullBaseLines.concat(this.buildConvexHull([t.maxPoint, baseLine[1]], t.newPoints));
	            return convexHullBaseLines;
	        } else {
	            return [baseLine];
	        }
	    },
	    getConvexHull: function(points) {

	        if (points.length == 1)
	            return [
	                [points[0], points[0]]
	            ];

	        //find first baseline
	        var maxX, minX;
	        var maxPt, minPt;
	        for (var idx in points) {
	            var pt = points[idx];
	            if (pt[0] > maxX || !maxX) {
	                maxPt = pt;
	                maxX = pt[0];
	            }
	            if (pt[0] < minX || !minX) {
	                minPt = pt;
	                minX = pt[0];
	            }
	        }
	        var ch = [].concat(this.buildConvexHull([minPt, maxPt], points),
	            this.buildConvexHull([maxPt, minPt], points))
	        return ch;
	    },
	    MultiPolygonUnion: function(multiPolygon) {
	        var matrixMultiPolygon = [],
	            unitedMultiPolygon = [],
	            nStartPolygons = 0,
	            currentPolygon;

	        do {
	            nStartPolygons = multiPolygon.length;
	            unitedMultiPolygon = [];

	            while (multiPolygon.length > 0) {
	                currentPolygon = multiPolygon.pop();
	                var iOther = 0;

	                // Check if it overlaps with any remaining polygons
	                while (iOther < multiPolygon.length) {

	                    var unionResults = currentPolygon.union(multiPolygon[iOther]);

	                    if (unionResults != null) {
	                        currentPolygon = unionResults;
	                        multiPolygon.splice(iOther, 1);
	                    } else {
	                        iOther++;
	                    }
	                }
	                unitedMultiPolygon.push(currentPolygon)
	            }
	            multiPolygon = unitedMultiPolygon;
	        } while (multiPolygon.length < nStartPolygons);

	        for (var i = 0; i < unitedMultiPolygon.length; i++) {
	            var poly = unitedMultiPolygon[i].to_point_array_2d();
	            poly.push(poly[0]);

	            matrixMultiPolygon.push([poly]);
	        }

	        return matrixMultiPolygon;
	    },
	    getPixelMultiPolygon: function(points) {
	        var results = [];

	        for (var i = 0; i < points.length; i++) {
	            var pt = points[i];
	            var dims = ModisPixelDimensions[pt[2]];

	            var merc = L.Projection.Mercator.project({
	                lat: pt[1],
	                lng: pt[0]
	            });
	            var X1 = merc.x;
	            var Y1 = merc.y;

	            var X2 = X1 + 1000;
	            var Y2 = Y1;

	            var newLatLng = L.Projection.Mercator.unproject({
	                x: X2,
	                y: Y2
	            });
	            var newLat = pt[1];
	            var newLon = newLatLng.lng;

	            var mdelta = L.gmxUtil.distVincenty(pt[0], pt[1], newLon, newLat);

	            var h_scale = dims[0] / mdelta;
	            var v_scale = dims[1] / mdelta;


	            var h_dx = 0.5 * (X2 - X1) * h_scale;
	            var h_dy = 0.5 * (Y2 - Y1) * h_scale;

	            var v_dx = 0.5 * (Y2 - Y1) * v_scale;
	            var v_dy = 0.5 * (X2 - X1) * v_scale;

	            var frontX = X1 + h_dx;
	            var frontY = Y1 + h_dy;

	            var backX = X1 - h_dx;
	            var backY = Y1 - h_dy;

	            var corner1x = frontX + v_dx;
	            var corner1y = frontY + v_dy;

	            var corner2x = frontX - v_dx;
	            var corner2y = frontY - v_dy;

	            var corner3x = backX - v_dx;
	            var corner3y = backY - v_dy;

	            var corner4x = backX + v_dx;
	            var corner4y = backY + v_dy;

	            results.push(SpatialQuery.$p([
	                [corner1x, corner1y],
	                [corner2x, corner2y],
	                [corner3x, corner3y],
	                [corner4x, corner4y]
	            ]));
	        }

	        return results;
	    }
	}



	// для вычисления расширенного ббокса
	var mercBbox = function(latlngBbox) {
	    var mercMin = L.Projection.Mercator.project({
	        lat: latlngBbox.min.y,
	        lng: latlngBbox.min.x
	    });
	    var mercMax = L.Projection.Mercator.project({
	        lat: latlngBbox.max.y,
	        lng: latlngBbox.max.x
	    });
	    return L.gmxUtil.bounds([
	        [mercMin.x, mercMin.y],
	        [mercMax.x, mercMax.y]
	    ]);
	}

	var fromMercBbox = function(bbox) {
	    var min = L.Projection.Mercator.unproject(bbox.min);
	    var max = L.Projection.Mercator.unproject(bbox.max);
	    return L.gmxUtil.bounds([
	        [min.lng, min.lat],
	        [max.lng, max.lat]
	    ]);
	}

	var getExtendedBbox = function(mercOld, newBbox) {
	    var extendBbox = function(bbox) {
	        var sx = (bbox.max.x - bbox.min.x) * 0.15,
	            sy = (bbox.max.y - bbox.min.y) * 0.15;

	        return L.gmxUtil.bounds([
	            [bbox.min.x - sx, bbox.min.y - sy],
	            [bbox.max.x + sx, bbox.max.y + sy]
	        ]);
	    }

	    var mercNew = mercBbox(newBbox);

	    if (!mercOld) {
	        return fromMercBbox(extendBbox(mercNew));
	    }

	    var oldSquare = (mercOld.max.x - mercOld.min.x) * (mercOld.max.y - mercOld.min.y),
	        newSquare = (mercNew.max.x - mercNew.min.x) * (mercNew.max.y - mercNew.min.y);

	    if (!mercOld.contains([mercNew.min.x, mercNew.min.y]) || !mercOld.contains([mercNew.max.x, mercNew.max.y]) || 2 * newSquare <
	        oldSquare) {
	        return fromMercBbox(extendBbox(mercNew));
	    } else {
	        return null;
	    }
	}

	/*
	 (c) 2014, Vladimir Agafonkin
	 simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas
	 https://github.com/mourner/simpleheat
	*/

	function simpleheat(canvas) {
	    // jshint newcap: false, validthis: true
	    if (!(this instanceof simpleheat)) { return new simpleheat(canvas); }

	    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

	    this._ctx = canvas.getContext('2d');
	    this._width = canvas.width;
	    this._height = canvas.height;

	    this._max = 1;
	    this._data = [];
	}

	simpleheat.prototype = {

	    defaultRadius: 25,

	    defaultGradient: {
	        0.4: 'blue',
	        0.6: 'cyan',
	        0.7: 'lime',
	        0.8: 'yellow',
	        1.0: 'red'
	    },

	    data: function (data) {
	        this._data = data;
	        return this;
	    },

	    max: function (max) {
	        this._max = max;
	        return this;
	    },

	    add: function (point) {
	        this._data.push(point);
	        return this;
	    },

	    clear: function () {
	        this._data = [];
	        return this;
	    },

	    radius: function(r, blur) {
	        this._radius = r;
	        this._blur = blur || 15;
	        this._r = r + this._blur;
	        return this;
	    },

	    minRadius: function(r) {
	        this._minRadius = r;
	        return this;
	    },

	    _circle: function (r, blur) {
	        // create a grayscale blurred circle image that we'll use for drawing points
	        var circle = document.createElement('canvas'),
	            ctx = circle.getContext('2d'),
	            r2 = r + blur;

	        circle.width = circle.height = r2 * 2;

	        ctx.shadowOffsetX = ctx.shadowOffsetY = 200;
	        ctx.shadowBlur = blur;
	        ctx.shadowColor = 'black';

	        ctx.beginPath();
	        ctx.arc(r2 - 200, r2 - 200, r, 0, Math.PI * 2, true);
	        ctx.closePath();
	        ctx.fill();

	        return circle;
	    },

	    gradient: function (grad) {
	        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
	        var canvas = document.createElement('canvas'),
	            ctx = canvas.getContext('2d'),
	            gradient = ctx.createLinearGradient(0, 0, 0, 256);

	        canvas.width = 1;
	        canvas.height = 256;

	        for (var i in grad) {
	            gradient.addColorStop(i, grad[i]);
	        }

	        ctx.fillStyle = gradient;
	        ctx.fillRect(0, 0, 1, 256);

	        this._grad = ctx.getImageData(0, 0, 1, 256).data;

	        return this;
	    },

	    draw: function (minOpacity) {
	        if (!this._circle) {
	            this.radius(this.defaultRadius);
	        }
	        if (!this._grad) {
	            this.gradient(this.defaultGradient);
	        }

	        var ctx = this._ctx;

	        ctx.clearRect(0, 0, this._width, this._height);

	        // draw a grayscale heatmap by putting a blurred circle at each data point
	        for (var i = 0, len = this._data.length, p; i < len; i++) {
	            p = this._data[i];

	            ctx.globalAlpha = Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity);
	            var rr, bl;
	            if (this._minRadius) {
	                rr = Math.max(this._radius * (p[2] / this._max), this._minRadius);
	                bl = rr/this._radius * this._blur;
	            } else {
	                rr = this._radius;
	                bl = this._blur;
	            }
	            ctx.drawImage(this._circle(rr, bl), p[0] - (rr + bl), p[1] - (rr + bl));
	        }

	        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
	        var colored = ctx.getImageData(0, 0, this._width, this._height);
	        this._colorize(colored.data, this._grad);
	        ctx.putImageData(colored, 0, 0);

	        return this;
	    },

	    _colorize: function (pixels, gradient) {
	        for (var i = 3, len = pixels.length, j; i < len; i += 4) {
	            j = pixels[i] * 4; // get gradient color from opacity value

	            if (j) {
	                pixels[i - 3] = gradient[j];
	                pixels[i - 2] = gradient[j + 1];
	                pixels[i - 1] = gradient[j + 2];
	            }
	        }
	    }
	};

	/*
	 (c) 2014, Vladimir Agafonkin
	 Leaflet.heat, a tiny and fast heatmap plugin for Leaflet.
	 https://github.com/Leaflet/Leaflet.heat
	*/

	// в виртуальном слое пожаров используется изменённая версия HeatLayer
	// по-этому добавляем этот модуль в сборку

	var HeatLayer = (L.Layer ? L.Layer : L.Class).extend({

	    // options: {
	    //     minOpacity: 0.05,
	    //     maxZoom: 18,
	    //     radius: 25,
	    //     blur: 15,
	    //     max: 1.0
	    // },

	    initialize: function(latlngs, options) {
	        this._latlngs = latlngs;
	        L.setOptions(this, options);
	    },

	    setLatLngs: function(latlngs) {
	        this._latlngs = latlngs;
	        return this.redraw();
	    },

	    addLatLng: function(latlng) {
	        this._latlngs.push(latlng);
	        return this.redraw();
	    },

	    setOptions: function(options) {
	        L.setOptions(this, options);
	        if (this._heat) {
	            this._updateOptions();
	        }
	        return this.redraw();
	    },

	    redraw: function() {
	        if (this._heat && !this._frame && !this._map._animating) {
	            this._frame = L.Util.requestAnimFrame(this._redraw, this);
	        }
	        return this;
	    },

	    onAdd: function(map) {
	        this._map = map;

	        if (!this._canvas) {
	            this._initCanvas();
	        }

	        map._panes.overlayPane.appendChild(this._canvas);

	        map.on('moveend', this._reset, this);

	        if (map.options.zoomAnimation && L.Browser.any3d) {
	            map.on('zoomanim', this._animateZoom, this);
	        }

	        this._reset();
	    },

	    onRemove: function(map) {
	        map.getPanes().overlayPane.removeChild(this._canvas);

	        map.off('moveend', this._reset, this);

	        if (map.options.zoomAnimation) {
	            map.off('zoomanim', this._animateZoom, this);
	        }
	    },

	    addTo: function(map) {
	        map.addLayer(this);
	        return this;
	    },

	    _initCanvas: function() {
	        var canvas = this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer leaflet-layer');

	        var size = this._map.getSize();
	        canvas.width = size.x;
	        canvas.height = size.y;

	        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
	        L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

	        this._heat = simpleheat(canvas);
	        this._updateOptions();
	    },

	    _updateOptions: function() {
	        this._heat.radius(this.options.radius || this._heat.defaultRadius, this.options.blur);

	        if (this.options.gradient) {
	            this._heat.gradient(this.options.gradient);
	        }
	        if (this.options.max) {
	            this._heat.max(this.options.max);
	        }
	        if (this.options.minRadius) {
	            this._heat.minRadius(this.options.minRadius);
	        }
	    },

	    _reset: function() {
	        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
	        L.DomUtil.setPosition(this._canvas, topLeft);

	        var size = this._map.getSize();

	        if (this._heat._width !== size.x) {
	            this._canvas.width = this._heat._width = size.x;
	        }
	        if (this._heat._height !== size.y) {
	            this._canvas.height = this._heat._height = size.y;
	        }

	        this._redraw();
	    },

	    _redraw: function() {
	        var data = [],
	            r = this._heat._r,
	            size = this._map.getSize(),
	            bounds = new L.LatLngBounds(
	                this._map.containerPointToLatLng(L.point([-r, -r])),
	                this._map.containerPointToLatLng(size.add([r, r]))),

	            maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom,
	            v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12))),
	            cellSize = r / 2,
	            grid = [],
	            panePos = this._map._getMapPanePos(),
	            offsetX = panePos.x % cellSize,
	            offsetY = panePos.y % cellSize,
	            i, len, p, cell, x, y, j, len2, k;

	        // console.time('process');
	        for (i = 0, len = this._latlngs.length; i < len; i++) {
	            if (bounds.contains(this._latlngs[i])) {
	                p = this._map.latLngToContainerPoint(this._latlngs[i]);
	                x = Math.floor((p.x - offsetX) / cellSize) + 2;
	                y = Math.floor((p.y - offsetY) / cellSize) + 2;

	                var alt =
	                    this._latlngs[i].alt !== undefined ? this._latlngs[i].alt :
	                    this._latlngs[i][2] !== undefined ? +this._latlngs[i][2] : 1;
	                k = alt * v;

	                grid[y] = grid[y] || [];
	                cell = grid[y][x];

	                if (!cell) {
	                    grid[y][x] = [p.x, p.y, k];

	                } else {
	                    cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k); // x
	                    cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k); // y
	                    cell[2] += k; // cumulated intensity value
	                }
	            }
	        }

	        for (i = 0, len = grid.length; i < len; i++) {
	            if (grid[i]) {
	                for (j = 0, len2 = grid[i].length; j < len2; j++) {
	                    cell = grid[i][j];
	                    if (cell) {
	                        data.push([
	                            Math.round(cell[0]),
	                            Math.round(cell[1]),
	                            Math.min(cell[2], 1)
	                        ]);
	                    }
	                }
	            }
	        }
	        // console.timeEnd('process');

	        // console.time('draw ' + data.length);
	        this._heat.data(data).draw(this.options.minOpacity);
	        // console.timeEnd('draw ' + data.length);

	        this._frame = null;
	    },

	    _animateZoom: function(e) {
	        var scale = this._map.getZoomScale(e.zoom),
	            offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

	        if (L.DomUtil.setTransform) {
	            L.DomUtil.setTransform(this._canvas, offset, scale);

	        } else {
	            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
	        }
	    }
	});

	var FireVirtualLayer = L.Class.extend({
	    options: {
	        minClustersZoom: 4,
	        minGeomZoom: 8,
	        minHotspotZoom: 11,
	        hostName: 'maps.kosmosnimki.ru'
	            // mapID
	            // hotspotLayerID
	            // dailyLayerID
	            // z_index
	    },

	    initialize: function(options) {
	        L.setOptions(this, options);

	        this._clustersLayer = L.gmx.createLayer({
	            properties: {
	                title: 'FireClusters',
	                attributes: ['scale', 'count', 'label', 'startDate', 'endDate', 'dateRange', 'isIndustrial'],
	                styles: [{
	                    Filter: '"isIndustrial"=0',
	                    Balloon: nsGmx.Translations.getText('FireVirtualLayer.LayerClusterBalloon'),
	                    MinZoom: this.options.minClustersZoom,
	                    MaxZoom: this.options.minGeomZoom - 1,
	                    RenderStyle: {
	                        fill: {
	                            radialGradient: {
	                                r1: 0,
	                                r2: '[scale]*20',
	                                addColorStop: [
	                                    [0, 0xffff00, 50],
	                                    [1, 0xff0000, 50]
	                                ]
	                            }
	                        },
	                        label: {
	                            size: 12,
	                            color: 0xffffff,
	                            field: 'label',
	                            align: 'center'
	                        }
	                    }
	                }, {
	                    Filter: '"isIndustrial"=1',
	                    Balloon: nsGmx.Translations.getText('FireVirtualLayer.LayerClusterBalloonIndustrial'),
	                    MinZoom: this.options.minClustersZoom,
	                    MaxZoom: this.options.minGeomZoom - 1,
	                    RenderStyle: {
	                        fill: {
	                            radialGradient: {
	                                r1: 0,
	                                r2: '[scale]*20',
	                                addColorStop: [
	                                    [0, 0xffffff, 80],
	                                    [1, 0xffaa00, 80]
	                                ]
	                            }
	                        }
	                    }
	                }]
	            }
	        });

	        this._clustersGeomLayer = L.gmx.createLayer({
	            properties: {
	                type: 'Vector',
	                title: 'FirePolygons',
	                attributes: ['scale', 'count', 'label', 'startDate', 'endDate', 'dateRange', 'isIndustrial'],
	                styles: [{
	                    Balloon: nsGmx.Translations.getText('FireVirtualLayer.LayerGeometryBalloon'),
	                    MinZoom: this.options.minGeomZoom,
	                    MaxZoom: 21,
	                    RenderStyle: {
	                        outline: {
	                            color: 0xff0000,
	                            thickness: 2
	                        },
	                        fill: {
	                            color: 0xff0000,
	                            opacity: 15
	                        }
	                    },
	                    HoverStyle: {
	                        outline: {
	                            color: 0xff0000,
	                            thickness: 3
	                        },
	                        fill: {
	                            color: 0xff0000,
	                            opacity: 45
	                        }
	                    }
	                }]
	            }
	        });

	        this._heatmapLayer = new HeatLayer([], {
	            "gradient": {
	                "1.00": "#FFFFFF",
	                "0.90": "#FFAA00",
	                "0.85": "#FF8800",
	                "0.75": "#E65C00",
	                "0.55": "#DB1D00"
	            },
	            "blur": 30,
	            "radius": 17,
	            "minRadius": 7,
	            "minOpacity": 0.65
	        });

	        if (this.options['z_index']) {
	            this._clustersLayer.setZIndex(this.options['z_index']);
	            this._clustersGeomLayer.setZIndex(this.options['z_index']);
	        }

	        var _this = this;
	        this._clustersLayer.on('popupopen', function(event) {
	            var popup = event.popup,
	                html = popup.getContent(),
	                zoomLink = $('<div style="margin-top: 5px;"><a href="javascript:void(0)"><i>' + nsGmx.Translations.getText(
	                    'FireVirtualLayer.zoomInMessage') + '</i></a></div>').click(function() {
	                    _this._map.closePopup(event.popup);
	                    _this._map.setView(event.gmx.latlng, _this.options.minGeomZoom + 3);
	                });

	            var div = $('<div/>').html(html).append(zoomLink);
	            event.popup.setContent(div[0]);
	        })
	    },

	    onAdd: function(map) {
	        buildModisPixelDimensionsTable();
	        this._map = map;
	        this._layerIsVisible = true;
	        this._lazyLoadDataLayers().then(function() {
	            if (!this._map || !this._layerIsVisible) {
	                return;
	            }

	            map.on('zoomend', this._updateLayersVisibility, this);
	            map.on('moveend', this._updateBbox, this);

	            this._updateLayersVisibility();
	            this._updateBbox();

	            map.addLayer(this._clustersLayer);
	            map.addLayer(this._clustersGeomLayer);
	            map.addLayer(this._hotspotLayer);
	        }.bind(this));
	    },

	    onRemove: function(map) {
	        delete this._map;
	        this._layerIsVisible = false;
	        map.off('moveend', this._updateBbox, this);
	        map.off('zoomend', this._updateLayersVisibility, this);
	        this._updateLayersVisibility();
	        this._lazyLoadDataLayers().then(function() {
	            if (this._layerIsVisible) {
	                return;
	            }

	            map.removeLayer(this._clustersGeomLayer);
	            map.removeLayer(this._clustersLayer);
	            map.removeLayer(this._hotspotLayer);
	            map.removeLayer(this._heatmapLayer);
	        }.bind(this))
	    },

	    setDateInterval: function(dateBegin, dateEnd) {
	        this._dateBegin = dateBegin;
	        this._dateEnd = dateEnd;
	        this._rawClusterLayer && this._rawClusterLayer.setDateInterval(dateBegin, dateEnd);
	        this._hotspotLayer && this._hotspotLayer.setDateInterval(dateBegin, dateEnd);

	        this._observerClusters && this._observerClusters.setDateInterval(dateBegin, dateEnd);
	        this._observerHotspots && this._observerHotspots.setDateInterval(dateBegin, dateEnd);
	        this._observerHeatmap && this._observerHeatmap.setDateInterval(dateBegin, dateEnd);
	    },

	    _updateBbox: function() {
	        var observersBbox = this._observerHotspots.bbox,
	            screenBounds = this._map.getBounds(),
	            p1 = screenBounds.getNorthWest(),
	            p2 = screenBounds.getSouthEast(),
	            newBbox = L.gmxUtil.bounds([
	                [p1.lng, p1.lat],
	                [p2.lng, p2.lat]
	            ]),
	            extendedBbox = getExtendedBbox(observersBbox, newBbox);

	        if (extendedBbox) {
	            this._observerHotspots.setBounds(extendedBbox);
	            this._observerClusters.setBounds(extendedBbox);
	            this._observerHeatmap.setBounds(extendedBbox);
	        }
	    },

	    //load layers add add observers
	    _lazyLoadDataLayers: function() {
	        if (this._loadLayersPromise) {
	            return this._loadLayersPromise;
	        }

	        var heatmapLayerID = this.options.heatmapLayerID || this.options.hotspotLayerID;

	        this._loadLayersPromise = L.gmx.loadLayers([{
	            mapID: this.options.mapID,
	            layerID: this.options.hotspotLayerID
	        }, {
	            mapID: this.options.mapID,
	            layerID: this.options.dailyLayerID
	        }], {
	            hostName: this.options.hostName
	        }).then(function(rawHotspotLayer, rawClustersLayer) {

	            if (this.options.minHotspotZoom) {
	                var minZoom = this.options.minHotspotZoom;
	                rawHotspotLayer.setStyles(rawHotspotLayer.getStyles().map(function(style) {
	                    style.MinZoom = minZoom;
	                    return style;
	                }));
	            }

	            var rawHeatmapLayer;
	            if (heatmapLayerID === rawHotspotLayer.options.layerID) {
	                rawHeatmapLayer = rawHotspotLayer;
	            }
	            if (heatmapLayerID === rawClustersLayer.options.layerID) {
	                rawHeatmapLayer = rawClustersLayer;
	            }

	            this._hotspotLayer = rawHotspotLayer;

	            if (this._dateBegin && this._dateEnd) {
	                this._hotspotLayer.setDateInterval(this._dateBegin, this._dateEnd);
	            }

	            this._rawClusterLayer = rawClustersLayer;

	            if (this.options['z_index']) {
	                this._hotspotLayer.setZIndex(this.options['z_index']);
	            }

	            this._observerHeatmap = rawHeatmapLayer.addObserver({
	                type: 'update',
	                callback: this._createHeatmapObserverCallback(rawHeatmapLayer, this._heatmapLayer),
	                active: !!this._map,
	                dateInterval: [this._dateBegin, this._dateEnd]
	            });

	            this._observerClusters = rawClustersLayer.addObserver({
	                type: 'update',
	                callback: this._updateClustersByObject(this._clustersLayer, false, 'ParentClusterId',
	                    'HotSpotCount', rawClustersLayer),
	                active: !!this._map,
	                dateInterval: [this._dateBegin, this._dateEnd]
	            });

	            this._observerHotspots = rawHotspotLayer.addObserver({
	                type: 'update',
	                callback: this._updateClustersByObject(this._clustersGeomLayer, true, 'ClusterID', null,
	                    rawHotspotLayer),
	                active: !!this._map,
	                dateInterval: [this._dateBegin, this._dateEnd]
	            });
	        }.bind(this));

	        return this._loadLayersPromise;
	    },

	    _createHeatmapObserverCallback: function(srcLayer, heatLayer) {
	        var pointsBuffer = [];

	        var weightFieldsHash = {
	            'F2840D287CD943C4B1122882C5B92565': 4,
	            'C13B4D9706F7491EBC6DC70DFFA988C0': 4,
	            'E58063D97D534BB4BBDFF07FE5CB17F2': 1,
	            '3E88643A8AC94AFAB4FD44941220B1CE': 1
	        }

	        function addData(data) {
	            pointsBuffer = pointsBuffer.concat(data);
	            return pointsBuffer;
	        }

	        function removeData(data) {
	            pointsBuffer = pointsBuffer.filter(function(it) {
	                return !data.find(function (d) {
	                    return d.id === it.id
	                })
	            })
	            return pointsBuffer
	        }

	        function parser(data) {
	            return data.map(function(d) {
	                var props = d.properties;

	                var latlng = L.Projection.Mercator.unproject({
	                    y: props[props.length - 1].coordinates[1],
	                    x: props[props.length - 1].coordinates[0]
	                })

	                var r = [latlng.lat, latlng.lng];
	                var fi = weightFieldsHash[srcLayer.options.layerID];
	                fi && props[fi] && r.push(factor(props[fi]));

	                return r;
	            })
	        }

	        function factor(w) {
	            return 3800 * (Math.pow(Math.log(w + 1), 1.3) / 3.5);
	        }

	        return function(data) {
	            data.added && addData(data.added);
	            data.removed && removeData(data.removed);
	            heatLayer.setLatLngs(parser(pointsBuffer));
	        }
	    },

	    _updateClustersByObject: function(layer, estimeteGeometry, clusterAttr, countAttr, fromLayer) {
	        var indexes = fromLayer._gmx.tileAttributeIndexes,
	            dateAttr = fromLayer.getGmxProperties().TemporalColumnName,
	            idAttr = fromLayer.getGmxProperties().identityField;

	        var parseItem = function(item) {
	            var props = item.properties;
	            return {
	                properties: L.gmxUtil.getPropertiesHash(props, indexes),
	                geometry: props[props.length - 1]
	            };
	        };

	        var clusters = {};

	        return function(data) {
	            var objects = [];
	            var clustersToRepaint = {};

	            (data.removed || []).map(function(it) {
	                objects.push({
	                    onExtent: false,
	                    item: parseItem(it)
	                });
	            });
	            (data.added || []).map(function(it) {
	                objects.push({
	                    onExtent: true,
	                    item: parseItem(it)
	                });
	            });

	            for (var k = 0; k < objects.length; k++) {
	                var props = objects[k].item.properties;
	                var mult = objects[k].onExtent ? 1 : -1;
	                var count = (countAttr ? props[countAttr] : 1) * mult;

	                if (!props[clusterAttr])
	                    continue;

	                var clusterId = '_' + props[clusterAttr];
	                var hotspotId = '_' + props[idAttr];

	                if (!clusters[clusterId]) {
	                    clusters[clusterId] = {
	                        spots: {},
	                        lat: 0,
	                        lng: 0,
	                        count: 0,
	                        startDate: Number.POSITIVE_INFINITY,
	                        endDate: Number.NEGATIVE_INFINITY,
	                        isIndustrial: false
	                    };
	                }
	                var cluster = clusters[clusterId];

	                //два раза одну и ту же точку не добавляем
	                if (hotspotId in cluster.spots && objects[k].onExtent)
	                    continue;

	                var coords = objects[k].item.geometry.coordinates,
	                    latlng = L.Projection.Mercator.unproject({
	                        y: coords[1],
	                        x: coords[0]
	                    });

	                if (objects[k].onExtent)
	                    cluster.spots[hotspotId] = [latlng.lng, latlng.lat, 250]; //TODO: выбрать правильный номер sample
	                else
	                    delete cluster.spots[hotspotId];

	                var hotspotDate = props[dateAttr];

	                cluster.lat += count * coords[1];
	                cluster.lng += count * coords[0];
	                cluster.count += count;
	                cluster.startDate = Math.min(cluster.startDate, hotspotDate);
	                cluster.endDate = Math.max(cluster.endDate, hotspotDate);
	                cluster.isIndustrial = cluster.isIndustrial || (Number(props.FireType) & 1);

	                clustersToRepaint[clusterId] = true;
	            }

	            var clustersToAdd = [],
	                itemIDsToRemove = [];

	            for (var k in clustersToRepaint) {
	                var cluster = clusters[k],
	                    count = cluster.count;
	                if (count) {
	                    var strStartDate = dateToString(cluster.startDate);
	                    var strEndDate = dateToString(cluster.endDate);

	                    var newItem = [
	                        k,
	                        String(Math.pow(Math.log(count + 1), 1.3) / 3.5),
	                        count,
	                        count >= 10 ? count : null,
	                        cluster.startDate,
	                        cluster.endDate,
	                        cluster.startDate === cluster.endDate ? strEndDate : strStartDate + '-' + strEndDate,
	                        Number(cluster.isIndustrial)
	                    ];

	                    if (estimeteGeometry) {
	                        var points = [];
	                        for (var p in clusters[k].spots)
	                            points.push(clusters[k].spots[p]);

	                        var multiPolygon = _hq.getPixelMultiPolygon(points);
	                        var tmpPolygon = _hq.MultiPolygonUnion(multiPolygon);

	                        newItem.push({
	                            type: 'MULTIPOLYGON',
	                            coordinates: tmpPolygon
	                        });
	                    } else {
	                        newItem.push({
	                            type: 'POINT',
	                            coordinates: [clusters[k].lng / count, clusters[k].lat / count]
	                        });
	                    }

	                    clustersToAdd.push(newItem);
	                } else {
	                    itemIDsToRemove.push(k);
	                    delete clusters[k];

	                }
	            }

	            layer.addData(clustersToAdd);
	            layer.removeData(itemIDsToRemove);
	        }

	        // для балунов
	        function dateToString(timestamp) {
	            var date = new Date(timestamp * 1000);

	            var lz = function(n) {
	                return n > 9 ? n : '0' + n;
	            };

	            return lz(date.getUTCDate()) + '.' + lz(date.getUTCMonth() + 1) + '.' + date.getUTCFullYear();
	        }

	    },

	    _updateLayersVisibility: function() {
	        var map = this._map;
	        var isVisible = !!map,
	            zoom = this._map && this._map.getZoom();

	        this._observerHotspots && this._observerHotspots.toggleActive(isVisible && zoom >= this.options.minGeomZoom);
	        this._observerClusters && this._observerClusters.toggleActive(isVisible && (zoom >= this.options.minClustersZoom && zoom < this.options
	            .minGeomZoom));
	        this._observerHeatmap && this._observerHeatmap.toggleActive(isVisible && zoom < this.options.minClustersZoom);

	        // this._heatmapLayer && this._heatmapLayer.setVisibility(isVisible && zoom < this.options.minClustersZoom);
	        map && ((isVisible && zoom < this.options.minClustersZoom) ? map.addLayer(this._heatmapLayer) : map.removeLayer(this._heatmapLayer));
	    }
	});

	var FireVirtualFactory = function() {};
	FireVirtualFactory.prototype.initFromDescription = function(layerDescription) {
	    var props = layerDescription.properties,
	        meta = props.MetaProperties;

	    var options = {
	        mapID: meta.mapID.Value,
	        hotspotLayerID: meta.hotspotLayerID.Value,
	        dailyLayerID: meta.dailyLayerID.Value,
	        heatmapLayerID: meta.heatmapLayerID &&  meta.heatmapLayerID.Value,
	        z_index: meta.z_index && meta.z_index.Value
	    }

	    if ('minGeomZoom' in meta) {
	        options.minGeomZoom = Number(meta.minGeomZoom.Value);
	    }

	    if ('minHotspotZoom' in meta) {
	        options.minHotspotZoom = Number(meta.minHotspotZoom.Value);
	    }

	    if ('minClustersZoom' in meta) {
	        options.minClustersZoom = Number(meta.minClustersZoom.Value);
	    }

	    var layer = new FireVirtualLayer(options);

	    layer.getGmxProperties = function() {
	        return props;
	    }

	    return layer;
	}

	L.gmx.addLayerClass('Fire', FireVirtualFactory);
	}());


/***/ }
/******/ ]);