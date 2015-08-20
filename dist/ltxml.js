(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("linq"));
	else if(typeof define === 'function' && define.amd)
		define(["linq"], factory);
	else if(typeof exports === 'object')
		exports["Ltxml"] = factory(require("linq"));
	else
		root["Ltxml"] = factory(root["Enumerable"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {"use strict";
	
	var Enumerable = __webpack_require__(1);
	
	var parseXml, Functions, Ltxml, addContentThatCanContainEntities,
	    serializeAttributeContent, annotateRootForNamespaces,
	    prefixCounter, entityCodePoints, entities;
	
	/********************** utility **********************/
	
	// if using JQuery
	// Enumerable = $.Enumerable;
	
	if (!Array.isArray) {
	    Array.isArray = function (arg) {
	        return Object.prototype.toString.call(arg) == '[object Array]'; //ignore jslint
	    };
	}
	
	Functions = {
	    Identity: function (x) { return x; },
	    True: function () { return true; },
	    Blank: function () { }
	};
	
	if (!Array.prototype.indexOf) {
	    Array.prototype.indexOf = function (item) {
	        var i;
	
	        for (i = 0; i < this.length; i += 1) {
	            if (this[i] === item) {
	                return i;
	            }
	        }
	        return -1;
	    };
	}
	
	/*ignore jslint start*/
	parseXml = function (xmlStr) {
	    var domParser;
	
	    if (typeof Ltxml.DOMParser !== "undefined") {
	        domParser = (new Ltxml.DOMParser()).parseFromString(xmlStr, "application/xml");
	        return domParser;
	    }
	    else if (typeof global.DOMParser !== "undefined") {
	        //domParser = (new global.DOMParser()).parseFromString(xmlStr, "text/xml");
	        domParser = (new global.DOMParser()).parseFromString(xmlStr, "application/xml");
	        return domParser;
	    } else if (typeof global.ActiveXObject !== "undefined" &&
			        new global.ActiveXObject("Microsoft.XMLDOM")) {
	        var xmlDoc = new global.ActiveXObject("Microsoft.XMLDOM");
	        xmlDoc.async = "false";
	        xmlDoc.loadXML(xmlStr);
	        return xmlDoc;
	    } else {
	        var xmldom = __webpack_require__(2);
	        var xmlDoc = (new xmldom.DOMParser().parseFromString(xmlStr, "application/xml"));
	        return xmlDoc;
	    }
	};
	/*ignore jslint end*/
	
	/********************** global **********************/
	
	Ltxml = {};  // container(namespace)
	
	Ltxml.namespaceCache = {};
	Ltxml.nameCache = {};
	Ltxml.spaces = '                                             ' +
	    '                                             ';
	function getStringBuilder() {
	    var data, counter;
	
	    data = [];
	    counter = 0;
	    return {
	        a: function (s) { data[counter += 1] = s; return this; },  //ignore jslint
	        toString: function (s) { return data.join(s || ""); }
	    };
	}
	
	Ltxml.clearCache = function () {
	    this.namespaceCache = {};
	    this.nameCache = {};
	};
	
	Ltxml.cast = function (elementOrAttribute) {
	    if (!elementOrAttribute) {
	        return null;
	    }
	    return elementOrAttribute.value;
	};
	
	Ltxml.castInt = function (elementOrAttribute) {
	    if (!elementOrAttribute) {
	        return null;
	    }
	    return parseInt(elementOrAttribute.value, 10);
	};
	
	function addContent(xobj, putContentFunc, putAttributeFunc) {
	    var t, ta, newEl, newTx, newCo, newCd, newAt, newPi, i, j, k;
	
	    for (i = 3; i < arguments.length; i += 1) {
	        t = arguments[i];
	        if (t !== null && t !== undefined) {
	            if (Array.isArray(t)) {
	                for (j = 0; j < t.length; j += 1) {
	                    addContent(xobj, putContentFunc, putAttributeFunc, t[j]);
	                }
	            } else if (t.select) {
	                ta = t.toArray();
	                for (k = 0; k < ta.length; k += 1) {
	                    addContent(xobj, putContentFunc, putAttributeFunc, ta[k]);
	                }
	            } else if (t.isXEnumerable) {
	                ta = t.asEnumerable().toArray();
	                for (k = 0; k < ta.length; k += 1) {
	                    addContent(xobj, putContentFunc, putAttributeFunc, ta[k]);
	                }
	            } else if (typeof t === 'object' && t.nodeType) {
	                if (t.nodeType === 'Element' ||
	                        t.nodeType === 'Text' ||
	                        t.nodeType === 'Comment' ||
	                        t.nodeType === 'CDATA' ||
	                        t.nodeType === 'ProcessingInstruction' ||
	                        t.nodeType === 'Entity') {
	                    if (t.parent && t.parent !== null) {
	                        // then need to clone
	                        if (t.nodeType === 'Element') {
	                            newEl = new Ltxml.XElement(t);
	                            newEl.parent = xobj;
	                            putContentFunc(newEl);
	                            return;
	                        }
	                        if (t.nodeType === 'Entity') {
	                            newTx = new Ltxml.XEntity(t);
	                            newTx.parent = xobj;
	                            putContentFunc(newTx);
	                            return;
	                        }
	                        if (t.nodeType === 'Text') {
	                            newTx = new Ltxml.XText(t);
	                            newTx.parent = xobj;
	                            putContentFunc(newTx);
	                            return;
	                        }
	                        if (t.nodeType === 'Comment') {
	                            newCo = new Ltxml.XComment(t);
	                            newCo.parent = xobj;
	                            putContentFunc(newCo);
	                            return;
	                        }
	                        if (t.nodeType === 'CDATA') {
	                            newCd = new Ltxml.XCData(t);
	                            newCd.parent = xobj;
	                            putContentFunc(newCd);
	                            return;
	                        }
	                        if (t.nodeType === 'ProcessingInstruction') {
	                            newPi = new Ltxml.XProcessingInstruction(t);
	                            newPi.parent = xobj;
	                            putContentFunc(newPi);
	                            return;
	                        }
	                    }
	                    t.parent = xobj;
	                    putContentFunc(t);
	                    return;
	                }
	                if (t.nodeType === 'Attribute') {
	                    if (t.parent && t.parent !== null) {
	                        // then need to clone
	                        newAt = new Ltxml.XAttribute(t);
	                        newAt.parent = xobj;
	                        putAttributeFunc(newAt);
	                        return;
	                    }
	                    t.parent = xobj;
	                    putAttributeFunc(t);
	                    return;
	                }
	            } else {
	                if (typeof t === 'string' && t === '') {
	                    newTx = new Ltxml.XText('');
	                    newTx.parent = xobj;
	                    putContentFunc(newTx);
	                    return;
	                }
	                addContentThatCanContainEntities(t.toString(), xobj, true, putContentFunc);
	            }
	        }
	    }
	}
	
	entityCodePoints = [
	    60,
	    62,
	    39,
	    34,
	    38
	/*,
	160,
	161,
	162,
	163,
	164,
	165,
	166,
	167,
	168,
	169,
	170,
	171,
	172,
	173,
	174,
	175,
	176,
	177,
	178,
	179,
	180,
	181,
	182,
	183,
	184,
	185,
	186,
	187,
	188,
	189,
	190,
	191,
	192,
	193,
	194,
	195,
	196,
	197,
	198,
	199,
	200,
	201,
	202,
	203,
	204,
	205,
	206,
	207,
	208,
	209,
	210,
	211,
	212,
	213,
	214,
	215,
	216,
	217,
	218,
	219,
	220,
	221,
	222,
	223,
	224,
	225,
	226,
	227,
	228,
	229,
	230,
	231,
	232,
	233,
	234,
	235,
	236,
	237,
	238,
	239,
	240,
	241,
	242,
	243,
	244,
	245,
	246,
	247,
	248,
	249,
	250,
	251,
	252,
	253,
	254,
	255,
	338,
	339,
	352,
	353,
	376,
	402,
	710,
	732,
	913,
	914,
	915,
	916,
	917,
	918,
	919,
	920,
	921,
	922,
	923,
	924,
	925,
	926,
	927,
	928,
	929,
	931,
	932,
	933,
	934,
	935,
	936,
	937,
	945,
	946,
	947,
	948,
	949,
	950,
	951,
	952,
	953,
	954,
	955,
	956,
	957,
	958,
	959,
	960,
	961,
	962,
	963,
	964,
	965,
	966,
	967,
	968,
	969,
	977,
	978,
	982,
	8194,
	8195,
	8201,
	8204,
	8205,
	8206,
	8207,
	8211,
	8212,
	8216,
	8217,
	8218,
	8220,
	8221,
	8222,
	8224,
	8225,
	8226,
	8230,
	8240,
	8242,
	8243,
	8249,
	8250,
	8254,
	8260,
	8364,
	8465,
	8472,
	8476,
	8482,
	8501,
	8592,
	8593,
	8594,
	8595,
	8596,
	8629,
	8656,
	8657,
	8658,
	8659,
	8660,
	8704,
	8706,
	8707,
	8709,
	8711,
	8712,
	8713,
	8715,
	8719,
	8721,
	8722,
	8727,
	8730,
	8733,
	8734,
	8736,
	8743,
	8744,
	8745,
	8746,
	8747,
	8756,
	8764,
	8773,
	8776,
	8800,
	8801,
	8804,
	8805,
	8834,
	8835,
	8836,
	8838,
	8839,
	8853,
	8855,
	8869,
	8901,
	8968,
	8969,
	8970,
	8971,
	9001,
	9002,
	9674,
	9824,
	9827,
	9829,
	9830 */
	];
	
	entities = [
	    "lt",
	    "gt",
	    "apos",
	    "quot",
	    "amp"
	/*,
	"nbsp",
	"iexcl",
	"cent",
	"pound",
	"curren",
	"yen",
	"brvbar",
	"sect",
	"uml",
	"copy",
	"ordf",
	"laquo",
	"not",
	"shy",
	"reg",
	"macr",
	"deg",
	"plusmn",
	"sup2",
	"sup3",
	"acute",
	"micro",
	"para",
	"middot",
	"cedil",
	"sup1",
	"ordm",
	"raquo",
	"frac14",
	"frac12",
	"frac34",
	"iquest",
	"Agrave",
	"Aacute",
	"Acirc",
	"Atilde",
	"Auml",
	"Aring",
	"AElig",
	"Ccedil",
	"Egrave",
	"Eacute",
	"Ecirc",
	"Euml",
	"Igrave",
	"Iacute",
	"Icirc",
	"Iuml",
	"ETH",
	"Ntilde",
	"Ograve",
	"Oacute",
	"Ocirc",
	"Otilde",
	"Ouml",
	"times",
	"Oslash",
	"Ugrave",
	"Uacute",
	"Ucirc",
	"Uuml",
	"Yacute",
	"THORN",
	"szlig",
	"agrave",
	"aacute",
	"acirc",
	"atilde",
	"auml",
	"aring",
	"aelig",
	"ccedil",
	"egrave",
	"eacute",
	"ecirc",
	"euml",
	"igrave",
	"iacute",
	"icirc",
	"iuml",
	"eth",
	"ntilde",
	"ograve",
	"oacute",
	"ocirc",
	"otilde",
	"ouml",
	"divide",
	"oslash",
	"ugrave",
	"uacute",
	"ucirc",
	"uuml",
	"yacute",
	"thorn",
	"yuml",
	"OElig",
	"oelig",
	"Scaron",
	"scaron",
	"Yuml",
	"fnof",
	"circ",
	"tilde",
	"Alpha",
	"Beta",
	"Gamma",
	"Delta",
	"Epsilon",
	"Zeta",
	"Eta",
	"Theta",
	"Iota",
	"Kappa",
	"Lambda",
	"Mu",
	"Nu",
	"Xi",
	"Omicron",
	"Pi",
	"Rho",
	"Sigma",
	"Tau",
	"Upsilon",
	"Phi",
	"Chi",
	"Psi",
	"Omega",
	"alpha",
	"beta",
	"gamma",
	"delta",
	"epsilon",
	"zeta",
	"eta",
	"theta",
	"iota",
	"kappa",
	"lambda",
	"mu",
	"nu",
	"xi",
	"omicron",
	"pi",
	"rho",
	"sigmaf",
	"sigma",
	"tau",
	"upsilon",
	"phi",
	"chi",
	"psi",
	"omega",
	"thetasym",
	"upsih",
	"piv",
	"ensp",
	"emsp",
	"thinsp",
	"zwnj",
	"zwj",
	"lrm",
	"rlm",
	"ndash",
	"mdash",
	"lsquo",
	"rsquo",
	"sbquo",
	"ldquo",
	"rdquo",
	"bdquo",
	"dagger",
	"Dagger",
	"bull",
	"hellip",
	"permil",
	"prime",
	"Prime",
	"lsaquo",
	"rsaquo",
	"oline",
	"frasl",
	"euro",
	"image",
	"weierp",
	"real",
	"trade",
	"alefsym",
	"larr",
	"uarr",
	"rarr",
	"darr",
	"harr",
	"crarr",
	"lArr",
	"uArr",
	"rArr",
	"dArr",
	"hArr",
	"forall",
	"part",
	"exist",
	"empty",
	"nabla",
	"isin",
	"notin",
	"ni",
	"prod",
	"sum",
	"minus",
	"lowast",
	"radic",
	"prop",
	"infin",
	"ang",
	"and",
	"or",
	"cap",
	"cup",
	"int",
	"there4",
	"sim",
	"cong",
	"asymp",
	"ne",
	"equiv",
	"le",
	"ge",
	"sub",
	"sup",
	"nsub",
	"sube",
	"supe",
	"oplus",
	"otimes",
	"perp",
	"sdot",
	"lceil",
	"rceil",
	"lfloor",
	"rfloor",
	"lang",
	"rang",
	"loz",
	"spades",
	"clubs",
	"hearts",
	"diams"
	*/
	];
	
	addContentThatCanContainEntities = function (textToAdd, xobj, isElement, putContentFunc) {
	    var xt, xe, ts, tc, length, char, ind;
	
	    if (typeof textToAdd === 'string') {
	        ts = 0;
	        tc = 0;
	        length = textToAdd.length;
	        while (true) {
	            if (tc === length) {
	                break;
	            }
	            char = textToAdd.charCodeAt(tc);
	            if ((char >= 40 && char <= 59) ||
	                (char >= 63 && char <= 126)) {
	                tc++;
	                continue;
	            }
	            if (char >= 32 && char <= 126 &&
	                char !== 34 && char !== 38 && char !== 39 && char !== 60 && char !== 62) {
	                tc++;
	                continue;
	            }
	            if (char === 9 || char === 10 || char === 13) {
	                if (isElement) {
	                    tc++;
	                    continue;
	                }
	            }
	            if (char === 9 && !isElement) {
	                tc++;
	                continue;
	            }
	            if (char < 32) {
	                if (ts !== tc) {
	                    if (isElement) {
	                        xt = new Ltxml.XText(textToAdd.substring(ts, tc));
	                        xt.parent = xobj;
	                    }
	                    else {
	                        xt = textToAdd.substring(ts, tc);
	                    }
	                    putContentFunc(xt);
	                }
	                xe = new Ltxml.XEntity("#x" + char.toString(16));
	                xe.parent = xobj;
	                putContentFunc(xe);
	                tc++;
	                ts = tc;
	                continue;
	            }
	            ind = entityCodePoints.indexOf(char);
	            if (ind === -1) {
	                tc++;
	                continue;
	            }
	            if (ts !== tc) {
	                if (isElement) {
	                    xt = new Ltxml.XText(textToAdd.substring(ts, tc));
	                    xt.parent = xobj;
	                }
	                else {
	                    xt = textToAdd.substring(ts, tc);
	                }
	                putContentFunc(xt);
	            }
	            xe = new Ltxml.XEntity(entities[ind]);
	            xe.parent = xobj;
	            putContentFunc(xe);
	            tc++;
	            ts = tc;
	        }
	        if (ts !== tc) {
	            if (isElement) {
	                xt = new Ltxml.XText(textToAdd.substring(ts, tc));
	                xt.parent = xobj;
	            }
	            else {
	                xt = textToAdd.substring(ts, tc);
	            }
	            putContentFunc(xt);
	        }
	        return;
	    }
	    if (isElement) {
	        xt = new Ltxml.XText(textToAdd);
	        xt.parent = xobj;
	        putContentFunc(xt);
	    }
	    else {
	        putContentFunc(textToAdd);
	    }
	    return;
	};
	
	/********************** XNamespace **********************/
	
	// takes a string, returns an atomized object
	Ltxml.XNamespace = function (namespace, prefix) {
	    var namespaceCache, nso, ns;
	
	    namespaceCache = Ltxml.namespaceCache;
	
	    if (prefix === null) {
	        prefix = undefined;
	    }
	    if (namespaceCache[namespace] === undefined) {
	        nso = {
	            namespaceName: namespace,
	            preferredPrefix: prefix,
	            getName: Ltxml.XNamespace.getName,
	            toString: Ltxml.XNamespace.toString
	        };
	        namespaceCache[namespace] = nso;
	        return nso;
	    }
	    ns = namespaceCache[namespace];
	    if (!ns.preferredPrefix && prefix !== null) {
	        ns.preferredPrefix = prefix;
	    }
	    return ns;
	};
	
	Ltxml.XNamespace.getName = function (name) {
	    return new Ltxml.XName(this.namespaceName, name);
	};
	
	Ltxml.XNamespace.toString = function () {
	    if (this === Ltxml.XNamespace.getNone()) {
	        return "";
	    }
	    return "{" + this.namespaceName + "}";
	};
	
	Ltxml.XNamespace.getNone = function () {
	    var namespaceCache, namespace, nso;
	
	    namespaceCache = Ltxml.namespaceCache;
	    namespace = '__none';
	    if (namespaceCache[namespace] === undefined) {
	        nso = {
	            namespaceName: namespace,
	            preferredPrefix: '',
	            getName: Ltxml.XNamespace.getName,
	            toString: Ltxml.XNamespace.toString
	        };
	        namespaceCache[namespace] = nso;
	        return nso;
	    }
	    return namespaceCache[namespace];
	};
	
	Ltxml.XNamespace.get = function (uri) {
	    return new Ltxml.XNamespace(uri);
	};
	
	Ltxml.XNamespace.getXml = function () {
	    return new Ltxml.XNamespace("http://www.w3.org/XML/1998/namespace", "xml");
	};
	
	Ltxml.XNamespace.getXmlns = function () {
	    return new Ltxml.XNamespace("http://www.w3.org/2000/xmlns/", "xmlns");
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XNamespace, "none", {
	        get: function () {
	            return Ltxml.XNamespace.getNone();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XNamespace, "xml", {
	        get: function () {
	            return Ltxml.XNamespace.getXml();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XNamespace, "xmlns", {
	        get: function () {
	            return Ltxml.XNamespace.getXmlns();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/********************** XName **********************/
	
	// for namespace, takes either a string or an atomized XNamespace object.
	// for name, takes a string
	Ltxml.XName = function (arg1, arg2) {
	    var nameCache, expandedNamespaceObject, expandedNamespaceQName,
	        namespaceOfExpandedName, noNamespaceObject, noNamespaceQName,
	        noNamespaceNameObject, namespaceObject, namespaceQName,
	        namespaceNameObject, indexOfClosingBrace;
	
	    nameCache = Ltxml.nameCache;
	
	    if (typeof arg1 === 'string' && arg2 === undefined && arg1.charAt(0) === '{') {
	        indexOfClosingBrace = arg1.indexOf('}');
	        namespaceOfExpandedName = arg1.substring(1, indexOfClosingBrace);
	        expandedNamespaceObject = new Ltxml.XNamespace(namespaceOfExpandedName);
	        arg2 = arg1.substring(indexOfClosingBrace + 1);
	        expandedNamespaceQName = "{" + namespaceOfExpandedName + "}" + arg2;
	        if (nameCache[expandedNamespaceQName] === undefined) {
	            nameCache[expandedNamespaceQName] = {
	                namespace: expandedNamespaceObject,
	                namespaceName: namespaceOfExpandedName,
	                localName: arg2,
	                toString: Ltxml.XName.toString
	            };
	            return nameCache[expandedNamespaceQName];
	        }
	        return nameCache[expandedNamespaceQName];
	    }
	
	    if (typeof arg1 === 'string' && arg2 === undefined) {
	        noNamespaceObject = Ltxml.XNamespace.getNone();
	        noNamespaceQName = "{" + noNamespaceObject.namespaceName + "}" + arg1;
	        if (nameCache[noNamespaceQName] === undefined) {
	            noNamespaceNameObject = {
	                namespace: noNamespaceObject,
	                namespaceName: '',
	                localName: arg1,
	                toString: Ltxml.XName.toString
	            };
	            nameCache[noNamespaceQName] = noNamespaceNameObject;
	            return noNamespaceNameObject;
	        }
	        return nameCache[noNamespaceQName];
	    }
	
	    namespaceObject = arg1;
	    if (typeof arg1 !== 'object') {
	        namespaceObject = Ltxml.XNamespace(arg1);
	    }
	    namespaceQName = "{" + namespaceObject.namespaceName + "}" + arg2;
	    if (nameCache[namespaceQName] === undefined) {
	        namespaceNameObject = {
	            namespace: namespaceObject,
	            namespaceName: namespaceObject.namespaceName,
	            localName: arg2,
	            toString: Ltxml.XName.toString
	        };
	        nameCache[namespaceQName] = namespaceNameObject;
	        return namespaceNameObject;
	    }
	    return nameCache[namespaceQName];
	};
	
	Ltxml.XName.toString = function () {
	    return this.namespace + this.localName;
	};
	
	Ltxml.XName.qualify = function (xname, element, isAttribute) {
	    if (xname.namespace === Ltxml.XNamespace.getNone()) {
	        return xname.localName;
	    }
	    var prefix = element.getPrefixOfNamespace(xname.namespace, isAttribute);
	    if (prefix === '') {
	        return xname.localName;
	    }
	    return prefix + ":" + xname.localName;
	};
	
	Ltxml.XName.get = function (arg1, arg2) {
	    var xn;
	
	    if (typeof arg1 === 'string' && arg2 === undefined) {
	        xn = new Ltxml.XName(arg1);
	        return xn;
	    }
	    if ((typeof arg1 === 'string' || arg1.namespaceName) &&
	            typeof arg2 === 'string') {
	        xn = new Ltxml.XName(arg1, arg2);
	        return xn;
	    }
	    throw 'XName.get: invalid arguments';
	};
	
	/********************** XObject **********************/
	
	Ltxml.XObject = function () { };
	
	Ltxml.XObject.prototype.addAnnotation = function (type, object) {
	    if (!object) {
	        object = {};
	    }
	    this.annotationsArray.push({
	        Type: type,
	        Object: object
	    });
	};
	
	Ltxml.XObject.prototype.annotation = function (type) {
	    var i;
	
	    for (i = 0; i < this.annotationsArray.length; i += 1) {
	        if (this.annotationsArray[i].Type === type) {
	            return this.annotationsArray[i].Object;
	        }
	    }
	    return null;
	};
	
	Ltxml.XObject.prototype.annotations = function (type) {
	    var retVal, i;
	
	    retVal = [];
	    for (i = 0; i < this.annotationsArray.length; i += 1) {
	        if (type === undefined || this.annotationsArray[i].Type === type) {
	            retVal.push(this.annotationsArray[i].Object);
	        }
	    }
	    return Enumerable.from(retVal);
	};
	
	Ltxml.XObject.prototype.removeAnnotations = function (type) {
	    var j;
	
	    if (type === undefined) {
	        this.annotationsArray = [];
	    } else {
	        while (true) {
	            for (j = 0; j < this.annotationsArray.length; j += 1) {
	                if (this.annotationsArray[j].Type === type) {
	                    break;
	                }
	            }
	            if (j === this.annotationsArray.length) {
	                break;
	            }
	            this.annotationsArray.splice(j, 1);
	        }
	    }
	};
	
	Ltxml.XObject.prototype.getDocument = function () {
	    var current = this;
	
	    while (true) {
	        if (current.nodeType === 'Document') {
	            return current;
	        }
	        current = current.parent;
	        if (current === null) {
	            return null;
	        }
	    }
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XObject.prototype, "document", {
	        get: function () {
	            return this.getDocument();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/********************** XNode: XObject **********************/
	
	Ltxml.XNode = function () { };
	
	Ltxml.XNode.prototype = new Ltxml.XObject();
	
	Ltxml.XNode.prototype.addAfterSelf = function () {
	    var indexOfSelf, args, contentToInsert, newContent, i, z;
	
	    args = [];
	    newContent = [];
	
	    if (this.parent === null) {
	        throw "addAfterSelf: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    contentToInsert = [];
	    addContent(this,
	        function (c) { contentToInsert.push(c); },
	        function () { throw "addAfterSelf: invalid content"; },
	        args);
	    newContent = this.parent.nodesArray.slice(0, indexOfSelf + 1)
	        .concat(contentToInsert)
	        .concat(this.parent.nodesArray.slice(indexOfSelf + 1));
	    for (z = 0; z < newContent.length; z += 1) {
	        newContent[z].parent = this.parent;
	    }
	    this.parent.nodesArray = newContent;
	};
	
	Ltxml.XNode.prototype.addBeforeSelf = function () {
	    var indexOfSelf, args, contentToInsert, newContent, i, z;
	
	    args = [];
	    contentToInsert = [];
	    newContent = [];
	
	    if (this.parent === null) {
	        throw "addBeforeSelf: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    contentToInsert = [];
	    addContent(this,
	        function (c) { contentToInsert.push(c); },
	        function () { throw "addBeforeSelf: invalid content"; },
	        args);
	    newContent = this.parent.nodesArray.slice(0, indexOfSelf)
	        .concat(contentToInsert)
	        .concat(this.parent.nodesArray.slice(indexOfSelf));
	    for (z = 0; z < newContent.length; z += 1) {
	        newContent[z].parent = this.parent;
	    }
	    this.parent.nodesArray = newContent;
	};
	
	Ltxml.XNode.prototype.CompareDocumentOrder = function () {
	    throw "Not implemented";
	};
	
	Ltxml.XNode.prototype.deepEquals = function (other) {
	    var atts1, atts2, nodes1, nodes2;
	
	    if (this.nodeType !== other.nodeType) {
	        return false;
	    }
	    if (this.nodeType === 'Element' && this.name !== other.name) {
	        return false;
	    }
	    if (this.nodeType === 'Comment' ||
	            this.nodeType === 'Text' ||
	            this.nodeType === 'CData' ||
	            this.nodeType === 'ProcessingInstruction' ||
	            this.nodeType === 'Entity') {
	        return this.value === other.value;
	    }
	    if (this.attributesArray.length !== other.attributesArray.length) {
	        return false;
	    }
	
	    if (this.attributesArray.length !== 0) {
	        atts1 = Enumerable
	            .from(this.attributesArray)
	            .where(function (a) {
	                return !a.isNamespaceDeclaration;
	            })
	            .orderBy("k=>k.name");
	        atts2 = Enumerable
	            .from(other.attributesArray)
	            .where(function (a) {
	                return !a.isNamespaceDeclaration;
	            })
	            .orderBy("k=>k.name");
	        // in following lambda, return true if any do NOT match
	        if (atts1.zip(atts2, function (a, b) {
	            return {
	                att1: a,
	                att2: b
	            };
	        })
	            .any(function (p) {
	                if (p.att1.name !== p.att2.name) {
	                    return true;
	                }
	                if (p.att1.value !== p.att2.value) {
	                    return true;
	                }
	                return false;
	            })) {
	            return false;
	        }
	    }
	    if (this.nodesArray.length !== other.nodesArray.length) {
	        return false;
	    }
	    if (this.nodesArray.length === 0 && other.nodesArray.length === 0) {
	        return true;
	    }
	    nodes1 = Enumerable.from(this.nodesArray);
	    nodes2 = Enumerable.from(other.nodesArray);
	    if (nodes1
	        .zip(nodes2, function (a, b) {
	            return {
	                node1: a,
	                node2: b
	            };
	        })
	        .any(function (z) { return !z.node1.deepEquals(z.node2); })) {
	        return false;
	    }
	    return true;
	};
	
	Ltxml.XNode.prototype.isAfter = function () {
	    throw "Not implemented";
	};
	
	Ltxml.XNode.prototype.isBefore = function () {
	    throw "Not implemented";
	};
	
	Ltxml.XNode.prototype.getNextNode = function () {
	    var indexOfSelf;
	
	    if (this.parent === null) {
	        throw "getNextNode: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    if (indexOfSelf < this.parent.nodesArray.length - 2) {
	        return this.parent.nodesArray[indexOfSelf + 1];
	    }
	    return null;
	};
	
	Ltxml.XNode.prototype.remove = function () {
	    var indexOfSelf, newContent;
	
	    if (this.parent === null) {
	        throw "remove: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    newContent = this.parent
	        .nodesArray
	        .slice(0, indexOfSelf)
	        .concat(this.parent.nodesArray.slice(indexOfSelf + 1));
	    this.parent.nodesArray = newContent;
	};
	
	Ltxml.XNode.prototype.replaceWith = function () {
	    var indexOfSelf, newContent, args, contentToInsert, i, z;
	
	    args = [];
	    contentToInsert = [];
	    if (this.parent === null) {
	        throw "replaceWith: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    contentToInsert = [];
	    addContent(this,
	        function (c) { contentToInsert.push(c); },
	        function () { throw "replaceWith: invalid content"; },
	        args);
	    newContent = this.parent
	        .nodesArray
	        .slice(0, indexOfSelf)
	        .concat(contentToInsert)
	        .concat(this.parent.nodesArray.slice(indexOfSelf + 1));
	    for (z = 0; z < newContent.length; z += 1) {
	        newContent[z].parent = this.parent;
	    }
	    this.parent.nodesArray = newContent;
	};
	
	Ltxml.XNode.prototype.getPreviousNode = function () {
	    var indexOfSelf;
	
	    if (this.parent === null) {
	        throw "previousNode: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    if (indexOfSelf > 0) {
	        return this.parent.nodesArray[indexOfSelf - 1];
	    }
	    return null;
	};
	
	// xname optional
	Ltxml.XNode.prototype.ancestors = function (xname) {
	    var self, result, current;
	
	    self = this;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var current;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    current = self.parent;
	                },  // initialize
	                function () { // tryGetNext
	                    while (current !== null) {
	                        if (xname && current.name !== xname) {
	                            current = current.parent;
	                        } else {
	                            var thisOne = current;
	                            current = current.parent;
	                            return this.yieldReturn(thisOne);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    result = [];
	    current = this.parent;
	    if (xname === undefined) {
	        while (current !== null) {
	            result.push(current);
	            current = current.parent;
	        }
	        return Enumerable.from(result);
	    }
	    while (current !== null) {
	        if (current.name === xname) {
	            result.push(current);
	        }
	        current = current.parent;
	    }
	    return Enumerable.from(result);
	};
	
	Ltxml.XNode.prototype.nodesAfterSelf = function () {
	    var indexOfSelf, returnValue, self;
	
	    self = this;
	    if (this.parent === null) {
	        throw "nodesAfterSelf: no parent element";
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var i, length, parent;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    parent = self.parent;
	                    i = parent.nodesArray.indexOf(self) + 1;
	                    length = parent.nodesArray.length;
	                },  // initialize
	                function () { // tryGetNext
	                    var n;
	
	                    while (i < length) {
	                        n = parent.nodesArray[i];
	                        i += 1;
	                        return this.yieldReturn(n);  //ignore jslint
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    returnValue = Enumerable
	        .from(this.parent.nodesArray.slice(indexOfSelf + 1));
	    return returnValue;
	};
	
	Ltxml.XNode.prototype.nodesBeforeSelf = function () {
	    var indexOfSelf, returnValue, self;
	
	    self = this;
	    if (this.parent === null) {
	        throw "nodesBeforeSelf: no parent element";
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var parent, i, selfIndex;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    parent = self.parent;
	                    i = 0;
	                    selfIndex = parent.nodesArray.indexOf(self);
	                },  // initialize
	                function () { // tryGetNext
	                    var n;
	
	                    while (i < selfIndex) {
	                        n = parent.nodesArray[i];
	                        i += 1;
	                        return this.yieldReturn(n);  //ignore jslint
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    if (this.parent === null) {
	        throw "nodesBeforeSelf: no parent element";
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    returnValue = Enumerable
	        .from(this.parent.nodesArray.slice(0, indexOfSelf));
	    return returnValue;
	};
	
	// xname optional
	Ltxml.XNode.prototype.elementsAfterSelf = function (xname) {
	    var indexOfSelf, returnValue, self;
	
	    self = this;
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    if (this.parent === null) {
	        throw "elementsAfterSelf: no parent element";
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var i, length, parent;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    parent = self.parent;
	                    i = parent.nodesArray.indexOf(self) + 1;
	                    length = parent.nodesArray.length;
	                },  // initialize
	                function () { // tryGetNext
	                    while (i < length) {
	                        var n = parent.nodesArray[i];
	                        if (n.nodeType !== 'Element' || (xname && n.name !== xname)) {
	                            i += 1;
	                        }
	                        else {
	                            i += 1;
	                            return this.yieldReturn(n);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    returnValue = Enumerable
	        .from(this.parent.nodesArray.slice(indexOfSelf + 1))
	        .where(function (e) { return e.nodeType === 'Element'; });
	    if (xname) {
	        returnValue = returnValue.where(function (e) { return e.name === xname; });
	    }
	    return returnValue;
	};
	
	// xname is optional
	Ltxml.XNode.prototype.elementsBeforeSelf = function (xname) {
	    var indexOfSelf, returnValue, self;
	
	    self = this;
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    if (this.parent === null) {
	        throw "elementsBeforeSelf: no parent element";
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var parent, i, selfIndex;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    parent = self.parent;
	                    i = 0;
	                    selfIndex = parent.nodesArray.indexOf(self);
	                },  // initialize
	                function () { // tryGetNext
	                    var n;
	
	                    while (i < selfIndex) {
	                        n = parent.nodesArray[i];
	                        if (n.nodeType !== 'Element' || (xname && n.name !== xname)) {
	                            i += 1;
	                        }
	                        else {
	                            i += 1;
	                            return this.yieldReturn(n);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    returnValue = Enumerable
	        .from(this.parent.nodesArray.slice(0, indexOfSelf))
	        .where(function (e) { return e.nodeType === 'Element'; });
	    if (xname) {
	        returnValue = returnValue.where(function (e) { return e.name === xname; });
	    }
	    return returnValue;
	};
	
	// xname is optional
	Ltxml.XNode.prototype.elementsBeforeSelfReverseDocumentOrder = function (xname) {
	    var indexOfSelf, returnValue, self;
	
	    self = this;
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    if (this.parent === null) {
	        throw "elementsBeforeSelfReverseDocumentOrder: no parent element";
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var parent, i;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    parent = self.parent;
	                    i = parent.nodesArray.indexOf(self) - 1;
	                },  // initialize
	                function () { // tryGetNext
	                    while (i >= 0) {
	                        var n = parent.nodesArray[i];
	                        if (n.nodeType !== 'Element' || (xname && n.name !== xname)) {
	                            i -= 1;
	                        }
	                        else {
	                            i -= 1;
	                            return this.yieldReturn(n);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    indexOfSelf = this.parent.nodesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    returnValue = Enumerable
	        .from(this.parent.nodesArray.slice(0, indexOfSelf))
	        .where(function (e) { return e.nodeType === 'Element'; })
	        .reverse();
	    if (xname) {
	        returnValue = returnValue.where(function (e) { return e.name === xname; });
	    }
	    return returnValue;
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XNode.prototype, "previousNode", {
	        get: function () {
	            return this.getPreviousNode();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XNode.prototype, "nextNode", {
	        get: function () {
	            return this.getNextNode();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/********************** XAttribute: XObject **********************/
	
	Ltxml.XAttribute = function (arg1, arg2) {
	    var xnameObj, attContent, i, xmlns;
	
	    this.nodeType = 'Attribute';
	    this.simpleValue = null;
	    this.attributeNodesArray = null;
	    this.isNamespaceDeclaration = false;
	    this.name = null;
	
	    if (Object.defineProperties) {
	
	        Object.defineProperty(this, "value", {
	            get: Ltxml.XAttribute.prototype.getValue,
	            set: Ltxml.XAttribute.prototype.setValue,
	            enumerable: true,
	            configurable: true
	        });
	
	    }
	
	    if (arg1.nodeType && arg1.nodeType === 'Attribute') {
	        if (arg2 !== undefined) {
	            throw "XAttribute constructor: invalid arguments";
	        }
	        this.isNamespaceDeclaration = arg1.isNamespaceDeclaration;
	        if (arg1.simpleValue !== null && arg1.simpleValue !== undefined) {
	            this.simpleValue = arg1.simpleValue;
	        }
	        else {
	            attContent = [];
	            for (i = 0; i < arg1.attributeNodesArray.length; i += 1) {
	                attContent.push(arg1.attributeNodesArray[i]);
	            }
	            this.attributeNodesArray = attContent;
	        }
	        this.name = arg1.name;
	        return;
	    }
	
	    if (arg2 === undefined) {
	        throw "XAttribute constructor: invalid arguments";
	    }
	
	    // external properties
	    if (arg2.namespaceName) {
	        this.attributeNodesArray = [arg2.namespaceName];
	    }
	    else {
	        attContent = [];
	        addContentThatCanContainEntities(arg2.toString(), this, false, function (c) {
	            attContent.push(c);
	        });
	        if (attContent.length === 1) {
	            this.simpleValue = attContent[0];
	        }
	        else {
	            this.attributeNodesArray = attContent;
	        }
	    }
	
	    // constructor
	    xnameObj = arg1;
	    xmlns = Ltxml.XNamespace.getXmlns();
	    if (typeof arg1 === 'string') {
	        if (arg1 === "xmlns") {
	            xnameObj = new Ltxml.XName(xmlns + "xmlns");
	        }
	        else {
	            xnameObj = new Ltxml.XName(arg1);
	        }
	    }
	    this.isNamespaceDeclaration = xnameObj.namespace === xmlns;
	    this.name = xnameObj;
	};
	
	Ltxml.XAttribute.prototype = new Ltxml.XObject();
	
	serializeAttributeContent = function (a, o) {
	    var na, i;
	
	    if (a.simpleValue !== null && a.simpleValue !== undefined) {
	        o.a(a.simpleValue);
	    }
	    else {
	        na = a.attributeNodesArray;
	        for (i = 0; i < na.length; i += 1) {
	            if (na[i].nodeType) {
	                na[i].serialize(o);
	            }
	            else {
	                o.a(na[i]);
	            }
	        }
	    }
	};
	
	Ltxml.XAttribute.prototype.serialize = function (o) {
	    if (this.name.namespace === Ltxml.XNamespace.getXmlns()) {
	        if (this.name.localName === 'xmlns') {
	            o.a("xmlns='");
	            serializeAttributeContent(this, o);
	            o.a("'");
	            return;
	        }
	        o.a("xmlns:").a(this.name.localName).a("='");
	        serializeAttributeContent(this, o);
	        o.a("'");
	        return;
	    }
	    if (this.name.namespace === Ltxml.XNamespace.getNone()) {
	        o.a(this.name.localName).a("='");
	        serializeAttributeContent(this, o);
	        o.a("'");
	        return;
	    }
	    if (this.name.namespace === Ltxml.XNamespace.getXml()) {
	        if (typeof this.value === "string") {
	            o.a("xml:")
	                .a(this.name.localName)
	                .a("='");
	            serializeAttributeContent(this, o);
	            o.a("'");
	        }
	        else {
	            o.a("xml:")
	                .a(this.name.localName)
	                .a("='");
	            serializeAttributeContent(this, o);
	            o.a("'");
	        }
	        return;
	    }
	    o.a(Ltxml.XName.qualify(this.name, this.parent, true)).a("='");
	    serializeAttributeContent(this, o);
	    o.a("'");
	    return;
	};
	
	Ltxml.XAttribute.prototype.toString = function () {
	    var o = getStringBuilder();
	    this.serialize(o);
	    return o.toString();
	};
	
	Ltxml.XAttribute.prototype.remove = function () {
	    var indexOfSelf, newAtts;
	
	    newAtts = [];
	    if (this.parent === null) {
	        throw "XAttribute.remove: no parent element";
	    }
	    indexOfSelf = this.parent.attributesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    newAtts = this.parent
	        .attributesArray
	        .slice(0, indexOfSelf)
	        .concat(this.parent.attributesArray.slice(indexOfSelf + 1));
	    this.parent.attributesArray = newAtts;
	};
	
	Ltxml.XAttribute.prototype.setValue = function (value) {
	    var newContent = [];
	    addContentThatCanContainEntities(value.toString(), this, false, function (a) {
	        newContent.push(a);
	    });
	    if (newContent.length === 1) {
	        this.simpleValue = newContent[0];
	    }
	    else {
	        this.attributeNodesArray = newContent;
	    }
	};
	
	Ltxml.XAttribute.prototype.getValue = function () {
	    var o, s;
	
	    o = getStringBuilder();
	    serializeAttributeContent(this, o);
	    s = o.toString();
	    return s;
	};
	
	Ltxml.XAttribute.prototype.getNextAttribute = function () {
	    var indexOfSelf;
	
	    if (this.parent === null) {
	        throw "getNextAttribute: no parent element";
	    }
	    indexOfSelf = this.parent.attributesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    if (indexOfSelf < this.parent.attributesArray.length - 2) {
	        return this.parent.attributesArray[indexOfSelf + 1];
	    }
	    return null;
	};
	
	Ltxml.XAttribute.prototype.getPreviousAttribute = function () {
	    var indexOfSelf;
	
	    if (!this.parent) {
	        throw "getPreviousAttribute: no parent element";
	    }
	    indexOfSelf = this.parent.attributesArray.indexOf(this);
	    if (indexOfSelf === -1) {
	        throw "Internal Error";
	    }
	    if (indexOfSelf > 0) {
	        return this.parent.attributesArray[indexOfSelf - 1];
	    }
	    return null;
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XAttribute.prototype, "previousAttribute", {
	        get: function () {
	            return this.getPreviousAttribute();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XAttribute.prototype, "nextAttribute", {
	        get: function () {
	            return this.getNextAttribute();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/********************** XComment: XNode **********************/
	
	Ltxml.XComment = function (arg1) {
	    this.nodeType = 'Comment';
	    this.parent = null;
	
	    if (arg1.nodeType && arg1.nodeType === 'Comment') {
	        // copy constructor
	        this.value = arg1.value.toString();
	    }
	    else {
	        this.value = arg1.toString();
	    }
	};
	
	Ltxml.XComment.prototype = new Ltxml.XNode();
	
	Ltxml.XComment.prototype.serialize = function (o, indent, depth) {
	    var indent_spaces;
	
	    if (!depth) {
	        depth = 0;
	    }
	    if (indent) {
	        indent_spaces = Ltxml.spaces.substring(0, depth);
	        o.a(indent_spaces).a("<!--").a(this.value).a("-->\n");
	        return;
	    }
	    o.a('<!--').a(this.value).a('-->');
	    return;
	};
	
	Ltxml.XComment.prototype.toString = function (indent) {
	    var o = getStringBuilder();
	    this.serialize(o, indent);
	    return o.toString();
	};
	
	/********************** XContainer: XNode **********************/
	
	Ltxml.XContainer = function () { };
	
	Ltxml.XContainer.prototype = new Ltxml.XNode();
	
	Ltxml.XContainer.prototype.add = function () {
	    var nodesToInsert, attributesToInsert, args, i, newNodes, newAttributes;
	
	    nodesToInsert = [];
	    attributesToInsert = [];
	    args = [];
	
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    nodesToInsert = [];
	    addContent(this,
	        function (c) { nodesToInsert.push(c); },
	        function (a) { attributesToInsert.push(a); },
	        args);
	    newNodes = this.nodesArray.concat(nodesToInsert);
	    newAttributes = this.attributesArray.concat(attributesToInsert);
	    this.nodesArray = newNodes;
	    this.attributesArray = newAttributes;
	};
	
	Ltxml.XContainer.prototype.addFirst = function () {
	    var nodesToInsert, attributesToInsert, args, i, newNodes, newAttributes;
	
	    nodesToInsert = [];
	    attributesToInsert = [];
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    nodesToInsert = [];
	    addContent(this,
	        function (c) { nodesToInsert.push(c); },
	        function (a) { attributesToInsert.push(a); },
	        args);
	    newNodes = nodesToInsert.concat(this.nodesArray);
	    newAttributes = this.attributesArray.concat(attributesToInsert);
	    this.nodesArray = newNodes;
	    this.attributesArray = newAttributes;
	};
	
	Ltxml.XContainer.prototype.element = function (name) {
	    var i, length;
	
	    if (typeof name === 'string') {
	        name = new Ltxml.XName(name);
	    }
	    length = this.nodesArray.length;
	    for (i = 0; i < length; i += 1) {
	        if (this.nodesArray[i].name === name) {
	            return this.nodesArray[i];
	        }
	    }
	    return null;
	};
	
	Ltxml.XContainer.prototype.nodes = function () {
	    return Enumerable.from(this.nodesArray);
	};
	
	Ltxml.XContainer.prototype.removeNodes = function () {
	    this.nodesArray = [];
	};
	
	Ltxml.XContainer.prototype.replaceNodes = function () {
	    var nodesToInsert, attributesToInsert, args, i, newAttributes;
	
	    nodesToInsert = [];
	    attributesToInsert = [];
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    addContent(this,
	        function (c) { nodesToInsert.push(c); },
	        function (a) { attributesToInsert.push(a); },
	        args);
	    newAttributes = this.attributesArray.concat(attributesToInsert);
	    this.nodesArray = nodesToInsert;
	    this.attributesArray = newAttributes;
	};
	
	Ltxml.XContainer.prototype.getFirstNode = function () {
	    if (this.nodesArray.length >= 1) {
	        return this.nodesArray[0];
	    }
	    return null;
	};
	
	Ltxml.XContainer.prototype.getLastNode = function () {
	    if (this.nodesArray.length >= 1) {
	        return this.nodesArray[this.nodesArray.length - 1];
	    }
	    return null;
	};
	
	function descendantNodesHelper(element, pushFunc) {
	    var i;
	
	    for (i = 0; i < element.nodesArray.length; i += 1) {
	        pushFunc(element.nodesArray[i]);
	        if (element.nodesArray[i].nodeType === 'Element') {
	            descendantNodesHelper(element.nodesArray[i], pushFunc);
	        }
	    }
	}
	
	Ltxml.XContainer.prototype.descendantNodes = function () {
	    var result, returnValue;
	
	    if (this.lazy) {
	        returnValue = Enumerable
	            .from(this.nodesArray)
	            .traverseDepthFirst(function (node) {
	                return Enumerable.from(node.nodesArray);
	            });
	        return returnValue;
	    }
	    result = [];
	    descendantNodesHelper(this, function (e) { result.push(e); });
	    return Enumerable.from(result);
	};
	
	function lazyDescendantHelper(container, xname) {
	    var returnValue = Enumerable
	        .from(container.nodesArray)
	        .traverseDepthFirst(function (node) {
	            return Enumerable.from(node.nodesArray).where(function (node) {
	                return node.nodeType === 'Element';
	            });
	        })
	        .where(function (node) { return node.nodeType === 'Element'; });
	    if (xname) {
	        returnValue = returnValue.where(function (e) { return e.name === xname; });
	    }
	    return returnValue;
	}
	
	function eagarDescendantHelper(container, xname, pushFunc) {
	    var i;
	
	    for (i = 0; i < container.nodesArray.length; i += 1) {
	        if (container.nodesArray[i].nodeType === 'Element') {
	            if (xname === undefined) {
	                pushFunc(container.nodesArray[i]);
	                eagarDescendantHelper(container.nodesArray[i], xname, pushFunc);
	            }
	            else {
	                if (container.nodesArray[i].name === xname) {
	                    pushFunc(container.nodesArray[i]);
	                }
	                eagarDescendantHelper(container.nodesArray[i], xname, pushFunc);
	            }
	        }
	    }
	}
	
	// xname optional
	Ltxml.XContainer.prototype.descendants = function (xname) {
	    var result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    if (this.lazy) {
	        return lazyDescendantHelper(this, xname);
	    }
	    result = [];
	    eagarDescendantHelper(this, xname, function (e) { result.push(e); });
	    return Enumerable.from(result);
	};
	
	// xname optional
	Ltxml.XContainer.prototype.elements = function (xname) {
	    var returnValue, self;
	
	    self = this;
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var i, length;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    i = 0;
	                    length = self.nodesArray.length;
	                },  // initialize
	                function () { // tryGetNext
	                    while (i < length) {
	                        var n = self.nodesArray[i];
	                        if (n.nodeType !== 'Element' || (xname && n.name !== xname)) {
	                            i += 1;
	                        }
	                        else {
	                            i += 1;
	                            return this.yieldReturn(n);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    returnValue = Enumerable
	        .from(this.nodesArray)
	        .where(function (e) { return e.nodeType === 'Element'; });
	    if (xname) {
	        returnValue = returnValue.where(function (e) {
	            return e.name === xname;
	        });
	    }
	    return returnValue;
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XContainer.prototype, "firstNode", {
	        get: function () {
	            return this.getFirstNode();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XContainer.prototype, "lastNode", {
	        get: function () {
	            return this.getLastNode();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/*********************** XDeclaration ***********************/
	
	//new XDeclaration(version, encoding, standalone)
	//new XDeclaration(xdeclaration)
	Ltxml.XDeclaration = function (arg1, arg2, arg3) {
	    if (arg1 && typeof arg1 === 'object' && arguments.length === 1) {
	        this.type = 'XDeclaration';
	        this.encoding = arg1.encoding ? arg1.encoding : ''; //ignore jslint
	        this.standalone = arg1.standalone ? arg1.standalone : ''; //ignore jslint
	        this.version = arg1.version ? arg1.version : ''; //ignore jslint
	        return;
	    }
	    if (arguments.length === 3) {
	        this.type = 'XDeclaration';
	        this.version = arg1;
	        this.encoding = arg2;
	        this.standalone = arg3;
	        return;
	    }
	    this.type = 'XDeclaration';
	    this.version = '';
	    this.encoding = '';
	    this.standalone = '';
	};
	
	Ltxml.XDeclaration.prototype.serialize = function (o, indent) {
	    if (this.version || this.encoding || this.standalone) {
	        if (indent) {
	            o.a("<?xml");
	            if (this.version) {
	                o.a(" version=\"").a(this.version).a("\"");
	            }
	            if (this.encoding) {
	                o.a(" encoding=\"").a(this.encoding).a("\"");
	            }
	            if (this.standalone) {
	                o.a(" standalone=\"").a(this.standalone).a("\"");
	            }
	            o.a("?>\n");
	            return;
	        }
	        o.a("<?xml");
	        if (this.version) {
	            o.a(" version=\"").a(this.version).a("\"");
	        }
	        if (this.encoding) {
	            o.a(" encoding=\"").a(this.encoding).a("\"");
	        }
	        if (this.standalone) {
	            o.a(" standalone=\"").a(this.standalone).a("\"");
	        }
	        o.a("?>");
	        return;
	    }
	    return;
	};
	
	Ltxml.XDeclaration.prototype.toString = function (indent) {
	    var o = getStringBuilder();
	    this.serialize(o, indent);
	    return o.toString();
	};
	
	/********************** XDocument: XContainer **********************/
	
	//new XDocument()
	//new XDocument(content)
	//new XDocument(xdocument)
	//new XDocument(xdeclaration, content)
	Ltxml.XDocument = function (arg1) {
	    var tempNodes, tempNodes2, start, args, i;
	
	    this.annotationsArray = [];
	    this.parent = null;
	    this.nodeType = 'Document';
	    this.nodesArray = [];
	    this.declaration = new Ltxml.XDeclaration();
	
	    if (typeof arg1 === 'object' && arg1.nodeType && arg1.nodeType === 'Document') {
	        if (arguments.length > 1) {
	            throw "XDocument constructor: invalid arguments";
	        }
	        tempNodes = [];
	        if (arg1.declaration !== null) {
	            this.declaration = new Ltxml.XDeclaration(arg1.declaration);
	        }
	        addContent(this,
	                    function (z) { tempNodes.push(z); },
	                    function () { throw "Internal Error"; },
	                    arg1.nodesArray);
	        this.nodesArray = tempNodes;
	        return;
	    }
	
	    if (arguments.length > 0) {
	        if (typeof arg1 === 'object' && arg1.type && arg1.type === 'XDeclaration') {
	            start = 1;
	            this.declaration = arg1;
	        }
	        else {
	            start = 0;
	        }
	        args = [];
	        for (i = start; i < arguments.length; i += 1) {
	            args.push(arguments[i]);
	        }
	        tempNodes2 = [];
	        addContent(this,
	                        function (z) { tempNodes2.push(z); },
	                        function () { throw "Internal Error"; },
	                        args);
	        this.nodesArray = tempNodes2;
	    }
	};
	
	Ltxml.XDocument.prototype = new Ltxml.XContainer();
	
	Ltxml.XDocument.prototype.serialize = function (o, indent) {
	    var i;
	
	    if (indent) {
	        this.declaration.serialize(o, true);
	        for (i = 0; i < this.nodesArray.length; i += 1) {
	            this.nodesArray[i].serialize(o, true);
	        }
	        return;
	    }
	    this.declaration.serialize(o, false);
	    for (i = 0; i < this.nodesArray.length; i += 1) {
	        this.nodesArray[i].serialize(o, false);
	    }
	    return;
	};
	
	Ltxml.XDocument.prototype.toString = function (indent) {
	    var clone, o, newRoot;
	
	    o = getStringBuilder();
	    clone = new Ltxml.XDocument(this.declaration,
	        this.nodes().select(function (n) {
	            if (n.nodeType === 'Element') {
	                newRoot = new Ltxml.XElement(n);
	                annotateRootForNamespaces(newRoot);
	                return newRoot;
	            }
	            return n;
	        }));
	
	    clone.serialize(o, indent);
	    return o.toString();
	};
	
	Ltxml.XDocument.parse = function (xml) {
	    var xmlDoc, e;
	
	    xmlDoc = parseXml(xml);
	    e = Ltxml.XDocument.load(xmlDoc);
	    return e;
	};
	
	Ltxml.XDocument.prototype.DocumentType = function () {
	    throw "Not implemented";
	};
	
	function xmlNodeLoad(node, depth) {
	    var ns, xn, aa, aa2, cn, cn2, el, at, doc,
	        xcd, xcm, pi, xdec, cnt1, cnt2, cnt3, tn, newAtt,
	        cn_doc, cnt4, nc, version, encoding, standalone;
	
	    if (node.nodeType) {
	        if (node.nodeType === 1) {
	            if (node.namespaceURI === null ||
	                node.namespaceURI === undefined ||
	                (node.namespaceURI === "" && node.nodeName !== "xmlns")) {
	                ns = Ltxml.XNamespace.getNone();
	            }
	            else {
	                ns = new Ltxml.XNamespace(
	                    node.namespaceURI,
	                    node.prefix && node.prefix !== "" ?
	                        node.prefix.toString() :
	                        null);
	            }
	            if (node.localName) {
	                xn = new Ltxml.XName(ns, node.localName);
	            }
	            else {
	                xn = new Ltxml.XName(ns, node.baseName);
	            }
	
	            aa = node.attributes;
	            cn = node.childNodes;
	
	            if (aa !== null && aa !== undefined && aa.length > 0) {
	                cn2 = [];
	                for (cnt1 = 0; cnt1 < cn.length; cnt1 += 1) {
	                    tn = xmlNodeLoad(cn[cnt1], depth + 1);
	                    cn2.push(tn);
	                }
	                aa2 = [];
	                for (cnt2 = 0; cnt2 < aa.length; cnt2 += 1) {
	                    newAtt = xmlNodeLoad(aa[cnt2], depth + 1);
	                    aa2.push(newAtt);
	                }
	                el = new Ltxml.XElement(xn, aa2, cn2);
	            }
	            else {
	                cn2 = [];
	                for (cnt3 = 0; cnt3 < cn.length; cnt3 += 1) {
	                    cn2.push(xmlNodeLoad(cn[cnt3], depth + 1));
	                }
	                el = new Ltxml.XElement(xn, cn2);
	            }
	            return el;
	        }
	
	        if (node.nodeType === 2) {
	            if (node.namespaceURI === null || node.namespaceURI === undefined ||
	                    (node.namespaceURI === "" && node.prefix !== "xmlns")) {
	                if (node.prefix === "xml") {
	                    ns = Ltxml.XNamespace.getXml();
	                }
	                else {
	                    ns = Ltxml.XNamespace.getNone();
	                }
	            }
	            else {
	                if (node.namespaceURI === "http://www.w3.org/2000/xmlns/" ||
	                        node.prefix === "xmlns") {
	                    ns = Ltxml.XNamespace.getXmlns();
	                }
	                else if (node.namespaceURI ===
	                        "http://www.w3.org/XML/1998/namespace") {
	                    ns = Ltxml.XNamespace.getXml();
	                }
	                else {
	                    ns = new Ltxml.XNamespace(
	                        node.namespaceURI,
	                            node.prefix ?
	                            node.prefix.toString() :
	                            null);
	                }
	            }
	            if (node.localName) {
	                xn = new Ltxml.XName(ns, node.localName);
	            }
	            else {
	                if (node.nodeName === "xmlns") {
	                    xn = new Ltxml.XName(ns, "xmlns");
	                }
	                else {
	                    xn = new Ltxml.XName(ns, node.baseName);
	                }
	            }
	            at = new Ltxml.XAttribute(xn, node.nodeValue);
	            return at;
	        }
	
	        if (node.nodeType === 3) {
	            nc = [];
	            addContentThatCanContainEntities(node.nodeValue, null, true, function (c) {
	                nc.push(c);
	            });
	            return nc;
	        }
	
	        if (node.nodeType === 4) {
	            xcd = new Ltxml.XCData(node.nodeValue);
	            return xcd;
	        }
	
	        if (node.nodeType === 7) {
	            if (node.target === 'xml') {
	                return null;
	            }
	            pi = new Ltxml.XProcessingInstruction(node.target, node.data);
	            return pi;
	        }
	
	        if (node.nodeType === 8) {
	            xcm = new Ltxml.XComment(node.nodeValue);
	            return xcm;
	        }
	
	        if (node.nodeType === 9) {
	            version = node.xmlVersion;
	            encoding = node.xmlEncoding;
	            standalone = node.xmlStandalone;
	            if (!version) { version = "1.0"; }
	            if (!encoding) { encoding = "UTF-8"; }
	            if (!standalone) { standalone = "yes"; }
	            xdec = new Ltxml.XDeclaration(
	                version,
	                encoding,
	                standalone ? "yes" : "no");
	            cn = node.childNodes;
	            cn_doc = [];
	            for (cnt4 = 0; cnt4 < cn.length; cnt4 += 1) {
	                cn_doc.push(xmlNodeLoad(cn[cnt4], depth + 1));
	            }
	            doc = new Ltxml.XDocument(xdec, cn_doc);
	            return doc;
	        }
	    }
	
	    throw ("Internal Error");
	}
	
	Ltxml.XDocument.load = function (document) {
	    var d = xmlNodeLoad(document);
	    return d;
	};
	
	Ltxml.XDocument.prototype.getRoot = function () {
	    return Enumerable
	        .from(this.nodesArray)
	        .firstOrDefault(function (f) {
	            return f.nodeType === 'Element';
	        });
	};
	
	// xname is optional
	Ltxml.XDocument.prototype.descendants = function (xname) {
	    var result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (this.lazy) {
	        return lazyDescendantHelper(this, xname);
	    }
	    // not lazy
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    result = [];
	    eagarDescendantHelper(this, xname, function (e) { result.push(e); });
	    return Enumerable.from(result);
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XDocument.prototype, "root", {
	        get: function () {
	            return this.getRoot();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	}
	
	/********************** XElement: XContainer **********************/
	
	// new XElement(xelement)         // copy constructor
	// new XElement(xname)
	// new XElement(xname, content)
	Ltxml.XElement = function (arg1) {
	    var tempNodes, tempAtts, tempNodes2, tempAtts2, xnameObj, args, i;
	
	    this.annotationsArray = [];
	    this.parent = null;
	    this.nodeType = 'Element';
	    this.nodesArray = null;
	    this.attributesArray = null;
	    this.name = null;
	    this.nsCache = null;
	
	    if (Object.defineProperties) {
	
	        Object.defineProperty(this, "value", {
	            get: Ltxml.XElement.prototype.getValue,
	            set: Ltxml.XElement.prototype.setValue,
	            enumerable: true,
	            configurable: true
	        });
	
	    }
	
	    if (typeof arg1 === 'object' && arg1.nodeType && arg1.nodeType === 'Element') {
	        if (arguments.length > 1) {
	            throw "XElement constructor: invalid arguments";
	        }
	        this.name = arg1.name;
	        tempNodes = [];
	        tempAtts = [];
	        addContent(this,
	                    function (z) { tempNodes.push(z); },
	                    function (z) { tempAtts.push(z); },
	                    arg1.attributesArray,
	                    arg1.nodesArray);
	        this.attributesArray = tempAtts;
	        this.nodesArray = tempNodes;
	        return;
	    }
	
	    xnameObj = arg1;
	    if (typeof arg1 === 'string') {
	        xnameObj = new Ltxml.XName(arg1);
	    }
	    this.name = xnameObj;
	    if (arguments.length > 1) {
	        args = [];
	        for (i = 1; i < arguments.length; i += 1) {
	            args.push(arguments[i]);
	        }
	        tempNodes2 = [];
	        tempAtts2 = [];
	        addContent(this,
	                    function (z) { tempNodes2.push(z); },
	                    function (z) { tempAtts2.push(z); },
	                    args);
	        this.attributesArray = tempAtts2;
	        this.nodesArray = tempNodes2;
	    }
	    if (this.nodesArray === null) {
	        this.nodesArray = [];
	    }
	    if (this.attributesArray === null) {
	        this.attributesArray = [];
	    }
	};
	
	Ltxml.XElement.prototype = new Ltxml.XContainer();
	
	Ltxml.XElement.prototype.attribute = function (xname) {
	    var i;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    for (i = 0; i < this.attributesArray.length; i += 1) {
	        if (this.attributesArray[i].name === xname) {
	            return this.attributesArray[i];
	        }
	    }
	    return null;
	};
	
	Ltxml.XElement.prototype.attributes = function (xname) {
	    var atts;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (xname === undefined) {
	        atts = Enumerable.from(this.attributesArray);
	        return atts;
	    }
	    // have XName
	    atts = Enumerable.from(this.attributesArray)
	        .where(function (a) { return a.name === xname; });
	    return atts;
	};
	
	Ltxml.XElement.prototype.serialize = function (o, indent, depth) {
	    var attributesToUse, indent_spaces, middle_take, mixed_content,
	        attribute_indent_spaces, qn, as, bs, i, n;
	
	    if (!depth) {
	        depth = 0;
	    }
	    qn = Ltxml.XName.qualify(this.name, this, false);
	    attributesToUse = [].concat(this.attributesArray);
	    attributesToUse.sort(function (a, b) {
	        as = a.name.toString();
	        bs = b.name.toString();
	        if (as < bs) {
	            return -1;
	        }
	        if (as > bs) {
	            return 1;
	        }
	        return 0;
	    });
	    if (this.nodesArray.length === 0) {
	        // ================================ content:no
	        if (indent) {
	            // ================================ content:no indent:yes
	            indent_spaces = Ltxml.spaces.substring(0, depth);
	            if (attributesToUse.length === 0) {
	                // ============ content:no indent:yes attributes:no
	                o.a(indent_spaces).a("<").a(qn).a("/>\n");
	                return;
	            }
	            if (attributesToUse.length === 1) {
	                // ================================ content:no indent:yes attributes:1
	                o.a(indent_spaces).a("<").a(qn).a(" ")
	                    .a(attributesToUse[0]).a("/>\n");
	                return;
	            }
	            // ================================ content:no indent:yes attributes:*
	            attribute_indent_spaces = indent_spaces +
	                Ltxml.spaces.substring(0, 2 + qn.length);
	            middle_take = attributesToUse.length - 2;
	            o.a(indent_spaces).a("<").a(qn).a(" ");
	            attributesToUse[0].serialize(o);
	            o.a("\n");
	            Enumerable.from(attributesToUse)
	                .skip(1)
	                .take(middle_take)
	                .forEach(function (a) {
	                    o.a(attribute_indent_spaces);
	                    a.serialize(o);
	                    o.a("\n");
	                });
	            o.a(attribute_indent_spaces);
	            attributesToUse[attributesToUse.length - 1].serialize(o);
	            o.a("/>\n");
	            return;
	        }
	        // ================================ content:no indent:no
	        o.a("<").a(qn).a(attributesToUse.length === 0 ? "" : " ");
	        for (i = 0; i < attributesToUse.length; i += 1) {
	            attributesToUse[i].serialize(o);
	            if (i < attributesToUse.length - 1) {
	                o.a(' ');
	            }
	        }
	        o.a("/>");
	        return;
	    }
	    // ================================ content:yes
	    if (indent) {
	        // ================================ content:yes indent:yes
	        indent_spaces = Ltxml.spaces.substring(0, depth);
	        mixed_content = false;
	        for (i = 0; i < this.nodesArray.length; ++i) {
	            n = this.nodesArray[i];
	            if (n.nodeType === 'Text' ||
	                n.nodeType === 'Entity') {
	                mixed_content = true;
	                break;
	            }
	        }
	        //mixed_content = (this.nodesArray[0].nodeType === 'Text' ||
	        //    this.nodesArray[0].nodeType === 'CDATA' ||
	        //    this.nodesArray[0].nodeType === 'Entity');
	        if (mixed_content) {
	            // =============== content:yes indent:yes first_child_text:yes
	            if (attributesToUse.length === 0) {
	                // ========== content:yes indent:yes first_child_text:yes attributes:0
	                o.a(indent_spaces).a("<").a(qn).a(">");
	                for (i = 0; i < this.nodesArray.length; i += 1) {
	                    this.nodesArray[i].serialize(o);
	                }
	                o.a("</").a(qn).a(">\n");
	                return;
	            }
	            if (attributesToUse.length === 1) {
	                // ========= content:yes indent:yes first_child_text:yes attributes:1
	                o.a(indent_spaces).a("<").a(qn).a(" ");
	                attributesToUse[0].serialize(o);
	                o.a(">");
	                for (i = 0; i < this.nodesArray.length; i += 1) {
	                    this.nodesArray[i].serialize(o, false);
	                }
	                o.a("</").a(qn).a(">\n");
	                return;
	            }
	            // ============ content:yes indent:yes first_child_text:yes attributes:*
	            attribute_indent_spaces = indent_spaces +
	                Ltxml.spaces.substring(0, 2 + qn.length);
	            middle_take = attributesToUse.length - 2;
	            o.a(indent_spaces).a("<").a(qn).a(" ");
	            attributesToUse[0].serialize(o);
	            o.a("\n");
	            Enumerable.from(attributesToUse)
	                .skip(1)
	                .take(middle_take)
	                .forEach(function (a) { o.a(attribute_indent_spaces).a(a).a("\n"); });
	            o.a(attribute_indent_spaces);
	            attributesToUse[attributesToUse.length - 1].serialize(o);
	            o.a(">");
	            Enumerable.from(this.nodesArray)
	                        .forEach(function (c) { c.serialize(o, false); });
	            o.a("</").a(qn).a(">\n");
	            // following is implementation that does not use LINQ
	            // var first = indent_spaces + "<" + qn + " " + attributesToUse[0] + "\n";
	            // var atum = [];
	            // for (var i = 1; i < attributesToUse.length - 1; i += 1) {
	            //     atum.push(attributesToUse[i]);
	            // }
	            // var z9 = '';
	            // for (var j = 0; j < atum.length; j += 1) {
	            //     z9 += attribute_indent_spaces + atum[j].toString() + "\n";
	            // }
	            // var second = z9;
	
	            // var third = attribute_indent_spaces +
	            //     attributesToUse[attributesToUse.length - 1] + ">" +
	            //             Enumerable.from(this.nodesArray)
	            //                 .select(function (c) { return c.serialize(false) })
	            //        .aggregate('', function (a, b) { return a + b; }) +
	            //                   "</" + qn + ">\n";
	            // var es = first + second + third;
	            return;
	        }
	        // ================================ content:yes indent:yes first_child_text:no
	        if (attributesToUse.length === 0) {
	            // =============== content:yes indent:yes first_child_text:no attributes:0
	            o.a(indent_spaces).a("<").a(qn).a(">\n");
	            Enumerable.from(this.nodesArray)
	                .forEach(function (c) { c.serialize(o, true, depth + 2); });
	            o.a(indent_spaces).a("</").a(qn).a(">\n");
	            return;
	        }
	        if (attributesToUse.length === 1) {
	            // ============== content:yes indent:yes first_child_text:no attributes:1
	            o.a(indent_spaces).a("<").a(qn).a(" ");
	            attributesToUse[0].serialize(o);
	            o.a(">\n");
	            Enumerable.from(this.nodesArray)
	                .forEach(function (c) { c.serialize(o, true, depth + 2); });
	            o.a(indent_spaces).a("</").a(qn).a(">\n");
	            return;
	        }
	        // ================ content:yes indent:yes first_child_text:no attributes:*
	        attribute_indent_spaces = indent_spaces +
	            Ltxml.spaces.substring(0, 2 + qn.length);
	        middle_take = attributesToUse.length - 2;
	        o.a(indent_spaces).a("<").a(qn).a(" ");
	        attributesToUse[0].serialize(o);
	        o.a("\n");
	        Enumerable.from(attributesToUse)
	                    .skip(1)
	                    .take(middle_take)
	                    .forEach(function (a) {
	                        o.a(attribute_indent_spaces); a.serialize(o); o.a("\n");
	                    });
	        o.a(attribute_indent_spaces);
	        attributesToUse[attributesToUse.length - 1].serialize(o);
	        o.a(">\n");
	        Enumerable.from(this.nodesArray)
	            .forEach(function (c) { c.serialize(o, true, depth + 2); });
	        o.a(indent_spaces).a("</").a(qn).a(">\n");
	        return;
	    }
	    // ================================ content:yes indent:no
	    o.a("<").a(qn);
	    Enumerable.from(attributesToUse)
	        .forEach(function (a) { o.a(" "); a.serialize(o); });
	    o.a(">");
	    Enumerable.from(this.nodesArray)
	        .forEach(function (n) { n.serialize(o); });
	    o.a("</").a(qn).a(">");
	    return;
	};
	
	function annotateElementForNamespaces(element, nsCache, xmlns, xml, none) {
	    var needToProcess, aa, na, ns, len, i, j, nd, newNsCache, el, prefix, nn,
	        newPrefix, newAtt;
	
	    needToProcess = false;
	    aa = element.attributesArray;
	    len = aa.length;
	    for (i = 0; i < len; i += 1) {
	        nd = aa[i];
	        if (!nd.isNamespaceDeclaration) {
	            continue; //ignore jslint
	        }
	        ns = new Ltxml.XNamespace(nd.value);
	        prefix = nd.name.localName;
	        if (ns.preferredPrefix === null) {
	            ns.preferredPrefix = prefix;
	        }
	        if (nsCache.namespaceArray.indexOf(ns) === -1 || prefix !== ns.preferredPrefix) {
	            needToProcess = true;
	            break;
	        }
	    }
	    for (i = 0; i < len; i += 1) {
	        nd = aa[i];
	        if (!nd.isNamespaceDeclaration &&
	            nd.name.namespace !== none &&
	            nd.name.namespace !== xml) {
	            if (nsCache.namespaceArray.indexOf(nd.name.namespace) === -1) {
	                while (true) {
	                    newPrefix = "p" + prefixCounter;
	                    if (nsCache.prefixArray.indexOf(newPrefix) === -1) {
	                        break;
	                    }
	                    prefixCounter += 1;
	                }
	                newAtt = new Ltxml.XAttribute(Ltxml.XNamespace.getXmlns() + newPrefix,
	                    nd.name.namespace.namespaceName);
	                element.add(newAtt);
	                nsCache.namespaceArray.push(nd.name.namespace);
	                nsCache.prefixArray.push(newPrefix);
	                if (nsCache.prefixesFromNamespaceObjects) {
	                    nd.name.namespace.preferredPrefix = newPrefix;
	                }
	                needToProcess = true;
	            }
	        }
	    }
	    if (element.name.namespace === none &&
	        (nsCache.defaultNamespace !== null &&
	            nsCache.defaultNamespace !== none)) {
	        if (!Enumerable.from(element.attributesArray).any(function (a) {
	            return a.name.namespace === xmlns && a.name.localName === "xmlns";
	        })) {
	            nn = new Ltxml.XAttribute("xmlns", "");
	            element.add(nn);
	            needToProcess = true;
	        }
	    }
	    if (needToProcess) {
	        newNsCache = {
	            prefixesFromNamespaceObjects: false,
	            defaultNamespace: nsCache.defaultNamespace,
	            namespaceArray: [],
	            prefixArray: []
	        };
	
	        aa = element.attributesArray;
	        len = aa.length;
	        for (i = 0; i < len; i += 1) {
	            nd = aa[i];
	            if (nd.isNamespaceDeclaration) {
	                if (nd.name.namespace === xmlns && nd.name.localName === "xmlns") {
	                    if (nd.value === '') {
	                        newNsCache.defaultNamespace = Ltxml.XNamespace.getNone();
	                    }
	                    else {
	                        newNsCache.defaultNamespace = new Ltxml.XNamespace(nd.value);
	                    }
	                }
	                else {
	                    ns = new Ltxml.XNamespace(nd.value);
	                    prefix = nd.name.localName;
	                    newNsCache.namespaceArray.push(ns);
	                    newNsCache.prefixArray.push(prefix);
	                }
	            }
	        }
	        for (i = 0; i < nsCache.namespaceArray.length; i += 1) {
	            if (newNsCache.namespaceArray.indexOf(nsCache.namespaceArray[i]) === -1) {
	                newNsCache.namespaceArray.push(nsCache.namespaceArray[i]);
	                newNsCache.prefixArray.push(nsCache.prefixArray[i]);
	            }
	        }
	        element.nsCache = newNsCache;
	        na = element.nodesArray;
	        len = na.length;
	        for (j = 0; j < len; j += 1) {
	            el = na[j];
	            if (el.nodeType === 'Element') {
	                annotateElementForNamespaces(el, newNsCache, xmlns, xml, none);
	            }
	        }
	        return;
	    }
	    element.nsCache = nsCache;
	    na = element.nodesArray;
	    len = na.length;
	    for (j = 0; j < len; j += 1) {
	        el = na[j];
	        if (el.nodeType === 'Element') {
	            annotateElementForNamespaces(el, nsCache, xmlns, xml, none);
	        }
	    }
	}
	
	annotateRootForNamespaces = function (rootElement) {
	    var aa, na, len, i, j, nd, newPrefix, newAtt,
	        nsCache, ns, prefix, el, xmlns, none, xml;
	
	    xmlns = Ltxml.XNamespace.getXmlns();
	    none = Ltxml.XNamespace.getNone();
	    xml = Ltxml.XNamespace.getXml();
	    for (ns in Ltxml.namespaceCache) {
	        if (Ltxml.namespaceCache.hasOwnProperty(ns)) {
	            if (Ltxml.namespaceCache[ns].namespaceName) {
	                ns.preferredPrefix = null;
	            }
	        }
	    }
	    prefixCounter = 0;
	    nsCache = {
	        prefixesFromNamespaceObjects: true,
	        defaultNamespace: null,
	        namespaceArray: [],
	        prefixArray: []
	    };
	    aa = rootElement.attributesArray;
	    len = aa.length;
	    for (i = 0; i < len; i += 1) {
	        nd = aa[i];
	        if (nd.isNamespaceDeclaration) {
	            if (nd.name.namespace === xmlns && nd.name.localName === "xmlns") {
	                ns = new Ltxml.XNamespace(nd.value);
	                nsCache.defaultNamespace = ns;
	                ns.preferredPrefix = '';
	            }
	            else {
	                ns = new Ltxml.XNamespace(nd.value);
	                prefix = nd.name.localName;
	                ns.preferredPrefix = prefix;
	                nsCache.namespaceArray.push(ns);
	                nsCache.prefixArray.push(prefix);
	            }
	        }
	    }
	    for (i = 0; i < len; i += 1) {
	        nd = aa[i];
	        if (!nd.isNamespaceDeclaration &&
	            nd.name.namespace !== none &&
	            nd.name.namespace !== xml) {
	            if (nsCache.namespaceArray.indexOf(nd.name.namespace) === -1) {
	                while (true) {
	                    newPrefix = "p" + prefixCounter;
	                    if (nsCache.prefixArray.indexOf(newPrefix) === -1) {
	                        break;
	                    }
	                    prefixCounter += 1;
	                }
	                newAtt = new Ltxml.XAttribute(Ltxml.XNamespace.getXmlns() + newPrefix,
	                    nd.name.namespace.namespaceName);
	                rootElement.add(newAtt);
	                nsCache.namespaceArray.push(nd.name.namespace);
	                nsCache.prefixArray.push(newPrefix);
	                if (nsCache.prefixesFromNamespaceObjects) {
	                    nd.name.namespace.preferredPrefix = newPrefix;
	                }
	            }
	        }
	    }
	    rootElement.nsCache = nsCache;
	    na = rootElement.nodesArray;
	    len = na.length;
	    for (j = 0; j < len; j += 1) {
	        el = na[j];
	        if (el.nodeType === 'Element') {
	            annotateElementForNamespaces(el, nsCache, xmlns, xml, none);
	        }
	    }
	};
	
	Ltxml.XElement.prototype.toString = function (indent) {
	    var clone, o;
	
	    o = getStringBuilder();
	    clone = new Ltxml.XElement(this);
	    annotateRootForNamespaces(clone);
	    clone.serialize(o, indent, 0);
	    return o.toString();
	};
	
	
	Ltxml.XElement.load = function (element) {
	    var el = xmlNodeLoad(element);
	    return el;
	};
	
	Ltxml.XElement.prototype.getFirstAttribute = function () {
	    if (this.attributesArray.length > 0) {
	        return this.attributesArray[0];
	    }
	    return null;
	};
	
	Ltxml.XElement.prototype.getDefaultNamespaceHelper = function () {
	    var attributesToUse, defNamespaceAtt;
	
	    attributesToUse = [].concat(this.attributesArray);
	    defNamespaceAtt = Enumerable
	        .from(attributesToUse)
	        .where(function (a) { return a.isNamespaceDeclaration; })
	        .firstOrDefault(function (a) {
	            return a.name.namespace === Ltxml.XNamespace.getXmlns() &&
	            a.name.localName === "xmlns";
	        });
	    return defNamespaceAtt;
	};
	
	Ltxml.XElement.prototype.getDefaultNamespace = function (namespace) {
	    var current, dna;
	
	    current = this;
	    while (true) {
	        dna = current.getDefaultNamespaceHelper(namespace);
	        if (dna !== null) {
	            return new Ltxml.XNamespace(dna.value);
	        }
	        current = current.parent;
	        if (current === null || current.nodeType === 'Document') {
	            return Ltxml.XNamespace.getNone();
	        }
	    }
	};
	
	Ltxml.XElement.prototype.getNamespaceOfPrefixForThisElement = function (prefix) {
	    var a = Enumerable.from(this.attributesArray)
	        .firstOrDefault(function (a) {
	            return a.isNamespaceDeclaration &&
	                a.name.namespace === Ltxml.XNamespace.getXmlns() &&
	                a.name.localName === prefix;
	        });
	    return a;
	};
	
	Ltxml.XElement.prototype.getNamespaceOfPrefix = function (prefix) {
	    var current, ns;
	
	    current = this;
	    while (true) {
	        ns = current.getNamespaceOfPrefixForThisElement(prefix);
	        if (ns !== null) {
	            return ns;
	        }
	        current = current.parent;
	        if (current === null || current.nodeType === 'Document') {
	            return null;
	        }
	    }
	};
	
	prefixCounter = 0;
	
	Ltxml.XElement.prototype.getPrefixOfNamespace = function (namespace, isAttribute) {
	    var current, prefix, defaultNamespace, nsCache, getPrefixesFromNamespace, index,
	        newPrefix, newAtt;
	
	    current = this;
	    nsCache = this.nsCache;
	    getPrefixesFromNamespace = nsCache.getPrefixesFromNamespace;
	    if (getPrefixesFromNamespace && namespace.preferredPrefix !== undefined) {
	        return namespace.preferredPrefix;
	    }
	    if (isAttribute === undefined) {
	        isAttribute = false;
	    }
	    if (!isAttribute) {
	        defaultNamespace = nsCache.defaultNamespace;
	        if (namespace === defaultNamespace) {
	            namespace.preferredPrefix = '';
	            return '';
	        }
	    }
	    index = nsCache.namespaceArray.indexOf(namespace);
	    if (index === -1) {
	        while (true) {
	            newPrefix = "p" + prefixCounter;
	            if (nsCache.prefixArray.indexOf(newPrefix) === -1) {
	                break;
	            }
	            prefixCounter += 1;
	        }
	        newAtt = new Ltxml.XAttribute(Ltxml.XNamespace.getXmlns() + newPrefix,
	            namespace.namespaceName);
	        this.add(newAtt);
	        nsCache.namespaceArray.push(namespace);
	        nsCache.prefixArray.push(newPrefix);
	        if (nsCache.prefixesFromNamespaceObjects) {
	            namespace.preferredPrefix = newPrefix;
	        }
	        return newPrefix;
	    }
	    prefix = nsCache.prefixArray[index];
	    return prefix;  //ignore jslint
	};
	
	Ltxml.XElement.prototype.getHasAttributes = function () {
	    return this.attributesArray && this.attributesArray.length > 0;
	};
	
	Ltxml.XElement.prototype.getHasElements = function () {
	    return Enumerable.from(this.nodesArray).any(function (n) {
	        return n.nodeType === 'Element';
	    });
	};
	
	Ltxml.XElement.prototype.getIsEmpty = function () {
	    return this.nodesArray.length === 0;
	};
	
	Ltxml.XElement.prototype.getLastAttribute = function () {
	    if (this.attributesArray.length > 0) {
	        return this.attributesArray[this.attributesArray.length - 1];
	    }
	    return null;
	};
	
	Ltxml.XElement.parse = function (xml) {
	    var xmlDoc, el;
	
	    xmlDoc = parseXml(xml);
	    el = Ltxml.XElement.load(xmlDoc.documentElement);
	    return el;
	};
	
	Ltxml.XElement.prototype.removeAll = function () {
	    this.nodesArray = [];
	    this.attributesArray = [];
	};
	
	Ltxml.XElement.prototype.removeAttributes = function () {
	    this.attributesArray = [];
	};
	
	Ltxml.XElement.prototype.replaceAll = function () {
	    var args, contentToInsert, i;
	
	    args = [];
	    contentToInsert = [];
	
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    contentToInsert = [];
	    addContent(this,
	        function (c) { contentToInsert.push(c); },
	        function () { throw "replaceAll: invalid content"; },
	        args);
	    this.nodesArray = contentToInsert;
	};
	
	Ltxml.XElement.prototype.replaceAttributes = function () {
	    var args, contentToInsert, i;
	
	    args = [];
	    contentToInsert = [];
	
	    args = [];
	    for (i = 0; i < arguments.length; i += 1) {
	        args.push(arguments[i]);
	    }
	    contentToInsert = [];
	    addContent(this,
	        function () { throw "replaceAttributes: invalid content"; },
	        function (a) { contentToInsert.push(a); },
	        args);
	    this.attributesArray = contentToInsert;
	};
	
	Ltxml.XElement.prototype.setAttributeValue = function (xname, value) {
	    var xa;
	
	    if (typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    xa = this.attribute(xname);
	    if (xa !== null) {
	        if (value === null) {
	            if (xa.parent !== null) {
	                xa.remove();
	            }
	            return;
	        }
	        xa.setValue(value);
	        return;
	    }
	    xa = new Ltxml.XAttribute(xname, value);
	    xa.parent = this;
	    this.attributesArray.push(xa);
	};
	
	Ltxml.XElement.prototype.setElementValue = function (xname, value) {
	    var xe, nc;
	
	    if (typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    xe = this.element(xname);
	    if (xe !== null) {
	        if (value === null) {
	            if (xe.parent !== null) {
	                xe.remove();
	            }
	            return;
	        }
	        nc = [];
	        addContentThatCanContainEntities(value, xe, true, function (v) {
	            nc.push(v);
	        });
	        xe.nodesArray = nc;
	        return;
	    }
	    xe = new Ltxml.XElement(xname, value);
	    xe.parent = this;
	    this.nodesArray.push(xe);
	};
	
	Ltxml.XElement.prototype.setValue = function (value) {
	    var nc = [];
	    addContentThatCanContainEntities(value.toString(), this, true, function (c) {
	        nc.push(c);
	    });
	    this.nodesArray = nc;
	};
	
	Ltxml.XElement.prototype.getValue = function () {
	    var returnValue = this
	        .descendantNodes()
	        .where(function (n) {
	            return n.nodeType === 'Text' ||
	            n.nodeType === 'CDATA' ||
	            n.nodeType === 'Entity';
	        })
	        .select(function (n) { return n.value; })
	        .toArray()
	        .join('');
	    return returnValue;
	};
	
	Ltxml.XElement.prototype.ancestorsAndSelf = function (xname) {
	    var result, current, self;
	
	    self = this;
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (this.lazy) {
	        return Enumerable.Utils.createEnumerable(function () {
	            var current;
	
	            return Enumerable.Utils.createEnumerator(
	                function () {
	                    current = self;
	                },  // initialize
	                function () { // tryGetNext
	                    while (current !== null) {
	                        if (xname && current.name !== xname) {
	                            current = current.parent;
	                        }
	                        else {
	                            var thisOne = current;
	                            current = current.parent;
	                            return this.yieldReturn(thisOne);
	                        }
	                    }
	                    return this.yieldBreak();
	                },
	                Functions.Blank
	            );
	        });
	    }
	    result = [];
	    current = this.parent;
	    if (xname === undefined) {
	        result.push(this);
	        while (current !== null) {
	            result.push(current);
	            current = current.parent;
	        }
	        return Enumerable.from(result);
	    }
	    if (this.name === xname) {
	        result.push(this);
	    }
	    while (current !== null) {
	        if (current.name === xname) {
	            result.push(current);
	        }
	        current = current.parent;
	    }
	    return Enumerable.from(result);
	};
	
	function descendantNodesAndSelfHelper(element, pushFunc) {
	    var i;
	
	    for (i = 0; i < element.nodesArray.length; i += 1) {
	        pushFunc(element.nodesArray[i]);
	        if (element.nodesArray[i].nodeType === 'Element' ||
	                element.nodesArray[i].nodeType === 'Document') {
	            descendantNodesAndSelfHelper(element.nodesArray[i], pushFunc);
	        }
	    }
	}
	
	Ltxml.XElement.prototype.descendantNodesAndSelf = function () {
	    var result, returnValue;
	
	    if (this.lazy) {
	        returnValue = Enumerable
	            .from(this.nodesArray)
	            .traverseDepthFirst(function (node) {
	                return Enumerable.from(node.nodesArray);
	            });
	        return Enumerable.from([this]).concat(returnValue);
	    }
	
	    result = [];
	    result.push(this);
	    descendantNodesAndSelfHelper(this, function (e) { result.push(e); });
	    return Enumerable.from(result);
	};
	
	// xname is optional
	Ltxml.XElement.prototype.descendantsAndSelf = function (xname) {
	    var result, self;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    if (this.lazy) {
	        if (!xname) {
	            self = Enumerable.from([this]);
	        }
	        else {
	            if (xname === this.name) {
	                self = Enumerable.from([this]);
	            }
	            else {
	                self = Enumerable.from([]);
	            }
	        }
	        return self.concat(lazyDescendantHelper(this, xname));
	    }
	    result = [];
	    if (!xname) {
	        result.push(this);
	    }
	    else {
	        if (xname === this.name) {
	            result.push(this);
	        }
	    }
	    eagarDescendantHelper(this, xname, function (e) { result.push(e); });
	    return Enumerable.from(result);
	};
	
	if (Object.defineProperties) {
	
	    Object.defineProperty(Ltxml.XElement.prototype, "firstAttribute", {
	        get: function () {
	            return this.getFirstAttribute();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XElement.prototype, "hasAttributes", {
	        get: function () {
	            return this.getHasAttributes();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XElement.prototype, "hasElements", {
	        get: function () {
	            return this.getHasElements();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XElement.prototype, "isEmpty", {
	        get: function () {
	            return this.getIsEmpty();
	        },
	        enumerable: true,
	        configurable: true
	    });
	
	    Object.defineProperty(Ltxml.XElement.prototype, "lastAttribute", {
	        get: function () {
	            return this.getLastAttribute();
	        },
	        enumerable: true,
	        configurable: true
	    });
	}
	
	/********************* XProcessingInstruction: XNode *********************/
	
	//new XProcessingInstruction(xprocessingInstruction)
	//new XProcessingInstruction(target, data)
	Ltxml.XProcessingInstruction = function (arg1, arg2) {
	    this.nodeType = 'ProcessingInstruction';
	    this.parent = null;
	    this.target = null;
	    this.data = null;
	
	    if (arg1 && arg1.nodeType && arg1.nodeType === 'ProcessingInstruction') {
	        if (arg1.target) {
	            this.target = arg1.target;
	        }
	        if (arg1.data) {
	            this.data = arg1.data;
	        }
	    }
	    else {
	        this.target = arg1;
	        this.data = arg2;
	    }
	};
	
	Ltxml.XProcessingInstruction.prototype = new Ltxml.XNode();
	
	Ltxml.XProcessingInstruction.prototype.serialize = function (o, indent, depth) {
	    var indent_spaces;
	
	    if (!depth) {
	        depth = 0;
	    }
	    if (indent) {
	        indent_spaces = Ltxml.spaces.substring(0, depth);
	        o.a(indent_spaces).a("<?").a(this.target).a(" ").a(this.data).a("?>\n");
	        return;
	    }
	    o.a("<?").a(this.target).a(" ").a(this.data).a("?>");
	    return;
	};
	
	Ltxml.XProcessingInstruction.prototype.toString = function (indent) {
	    var o = getStringBuilder();
	    this.serialize(o, indent);
	    return o.toString();
	};
	
	/********************** XText: XNode **********************/
	
	Ltxml.XText = function (arg1) {
	    this.nodeType = 'Text';
	    this.parent = null;
	
	    if (arg1 && arg1.nodeType && arg1.nodeType === 'Text') {
	        // copy constructor
	        this.value = arg1.value.toString();
	    }
	    else {
	        this.value = arg1;
	    }
	
	    // methods
	    this.serialize = function (o) {
	        o.a(this.value);
	    };
	
	    this.toString = function () {
	        return this.value;
	    };
	};
	
	Ltxml.XText.prototype = new Ltxml.XNode();
	
	/********************** XEntity: XNode **********************/
	
	Ltxml.XEntity = function (arg1) {
	    this.nodeType = 'Entity';
	    this.parent = null;
	
	    if (arg1 && arg1.nodeType && arg1.nodeType === 'Entity') {
	        // copy constructor
	        this.value = arg1.value;
	    }
	    else {
	        if (typeof arg1 === 'string') {
	            this.value = arg1;
	        }
	        else {
	            this.value = arg1.toString();
	        }
	    }
	
	    // methods
	    this.serialize = function (o) {
	        var s = "&" + this.value + ";";
	        o.a(s);
	    };
	
	    this.toString = function () {
	        return "&" + this.value + ";";
	    };
	};
	
	Ltxml.XEntity.prototype = new Ltxml.XNode();
	
	/******************* XCData: XText *******************/
	
	Ltxml.XCData = function (arg1) {
	    this.nodeType = 'CDATA';
	    this.parent = null;
	
	    if (arg1 && arg1.nodeType && arg1.nodeType === 'CDATA') {
	        // copy constructor
	        this.value = arg1.value.toString();
	    }
	    else {
	        this.value = arg1.toString();
	    }
	};
	
	Ltxml.XCData.prototype = new Ltxml.XText();
	
	Ltxml.XCData.prototype.serialize = function (o, indent, depth) {
	    var indent_spaces;
	
	    if (!depth) {
	        depth = 0;
	    }
	    if (indent) {
	        indent_spaces = Ltxml.spaces.substring(0, depth);
	        o.a(indent_spaces).a('<![CDATA[').a(this.value).a(']]>\n');
	        return;
	    }
	    o.a('<![CDATA[').a(this.value).a(']]>');
	    return;
	};
	
	Ltxml.XCData.prototype.toString = function (indent) {
	    var o = getStringBuilder();
	    this.serialize(o, indent);
	    return o.toString();
	};
	
	/********************** Extension methods (XEnumerable) **********************/
	
	Ltxml.XEnumerable = function (source) {
	    this.source = source;
	    this.isXEnumerable = true;
	};
	
	Ltxml.XEnumerable.prototype = new Enumerable();
	
	Ltxml.XEnumerable.prototype.getEnumerator = function () {
	    return this.source.getEnumerator();
	};
	
	Ltxml.XEnumerable.prototype.asEnumerable = function () {
	    return this.source;
	};
	
	Enumerable.prototype.asXEnumerable = function () {
	    return new Ltxml.XEnumerable(this);
	};
	
	Ltxml.XEnumerable.prototype.ancestors = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType &&
	                    (e.nodeType === 'Element' ||
	                        e.nodeType === 'Comment' ||
	                        e.nodeType === 'ProcessingInstruction' ||
	                        e.nodeType === 'Text' ||
	                        e.nodeType === 'CDATA' ||
	                        e.nodeType === 'Entity')) {
	                    return e.ancestors(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.ancestorsAndSelf = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType && e.nodeType === 'Element') {
	                    return e.ancestorsAndSelf(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.attributes = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType && e.nodeType === 'Element') {
	                    return e.attributes(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.descendantNodes = function () {
	    var source, result;
	
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType &&
	                    (e.nodeType === 'Element' ||
	                        e.nodeType === 'Comment' ||
	                        e.nodeType === 'ProcessingInstruction' ||
	                        e.nodeType === 'Text' ||
	                        e.nodeType === 'CDATA' ||
	                        e.nodeType === 'Entity')) {
	                    return e.descendantNodes();
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.descendantNodesAndSelf = function () {
	    var source, result;
	
	    source = this.source ? this.source : this; //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType &&
	                    (e.nodeType === 'Element' ||
	                        e.nodeType === 'Comment' ||
	                        e.nodeType === 'ProcessingInstruction' ||
	                        e.nodeType === 'Text' ||
	                        e.nodeType === 'CDATA' ||
	                        e.nodeType === 'Entity')) {
	                    return e.descendantNodesAndSelf();
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.descendants = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType && e.nodeType === 'Element') {
	                    return e.descendants(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.descendantsAndSelf = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType && e.nodeType === 'Element') {
	                    return e.descendantsAndSelf(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.elements = function (xname) {
	    var source, result;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType &&
	                    (e.nodeType === 'Element' || e.nodeType === 'Document')) {
	                    return e.elements(xname);
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.InDocumentOrder = function () {
	    throw "Not implemented";
	};
	
	Ltxml.XEnumerable.prototype.nodes = function () {
	    var source, result;
	
	    source = this.source ? this.source : this;  //ignore jslint
	    result = source
	        .selectMany(
	            function (e) {
	                if (e.nodeType &&
	                    (e.nodeType === 'Element' ||
	                        e.nodeType === 'Document')) {
	                    return e.nodes();
	                }
	                return Enumerable.empty();
	            })
	        .asXEnumerable();
	    return result;
	};
	
	Ltxml.XEnumerable.prototype.remove = function (xname) {
	    var source, toRemove, i;
	
	    if (xname && typeof xname === 'string') {
	        xname = new Ltxml.XName(xname);
	    }
	    source = this.source ? this.source : this;  //ignore jslint
	    toRemove = source.toArray();
	    for (i = 0; i < toRemove.length; i += 1) {
	        if (xname === undefined) {
	            toRemove[i].remove();
	        }
	        else {
	            if (toRemove[i].name && toRemove[i].name === xname) {
	                toRemove[i].remove();
	            }
	        }
	    }
	};
	
	module.exports = Ltxml;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	function DOMParser(options){
		this.options = options ||{locator:{}};
		
	}
	DOMParser.prototype.parseFromString = function(source,mimeType){	
		var options = this.options;
		var sax =  new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns||{};
		var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
		if(locator){
			domBuilder.setDocumentLocator(locator)
		}
		
		sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if(/\/x?html?$/.test(mimeType)){
			entityMap.nbsp = '\xa0';
			entityMap.copy = '\xa9';
			defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
		}
		if(source){
			sax.parse(source,defaultNSMap,entityMap);
		}else{
			sax.errorHandler.error("invalid document source");
		}
		return domBuilder.document;
	}
	function buildErrorHandler(errorImpl,domBuilder,locator){
		if(!errorImpl){
			if(domBuilder instanceof DOMHandler){
				return domBuilder;
			}
			errorImpl = domBuilder ;
		}
		var errorHandler = {}
		var isCallback = errorImpl instanceof Function;
		locator = locator||{}
		function build(key){
			var fn = errorImpl[key];
			if(!fn){
				if(isCallback){
					fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
				}else{
					var i=arguments.length;
					while(--i){
						if(fn = errorImpl[arguments[i]]){
							break;
						}
					}
				}
			}
			errorHandler[key] = fn && function(msg){
				fn(msg+_locator(locator));
			}||function(){};
		}
		build('warning','warn');
		build('error','warn','warning');
		build('fatalError','warn','warning','error');
		return errorHandler;
	}
	/**
	 * +ContentHandler+ErrorHandler
	 * +LexicalHandler+EntityResolver2
	 * -DeclHandler-DTDHandler 
	 * 
	 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	 */
	function DOMHandler() {
	    this.cdata = false;
	}
	function position(locator,node){
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	 * @see org.xml.sax.ContentHandler#startDocument
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	 */ 
	DOMHandler.prototype = {
		startDocument : function() {
	    	this.document = new DOMImplementation().createDocument(null, null, null);
	    	if (this.locator) {
	        	this.document.documentURI = this.locator.systemId;
	    	}
		},
		startElement:function(namespaceURI, localName, qName, attrs) {
			var doc = this.document;
		    var el = doc.createElementNS(namespaceURI, qName||localName);
		    var len = attrs.length;
		    appendElement(this, el);
		    this.currentElement = el;
		    
			this.locator && position(this.locator,el)
		    for (var i = 0 ; i < len; i++) {
		        var namespaceURI = attrs.getURI(i);
		        var value = attrs.getValue(i);
		        var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				if( attr.getOffset){
					position(attr.getOffset(1),attr)
				}
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr)
		    }
		},
		endElement:function(namespaceURI, localName, qName) {
			var current = this.currentElement
		    var tagName = current.tagName;
		    this.currentElement = current.parentNode;
		},
		startPrefixMapping:function(prefix, uri) {
		},
		endPrefixMapping:function(prefix) {
		},
		processingInstruction:function(target, data) {
		    var ins = this.document.createProcessingInstruction(target, data);
		    this.locator && position(this.locator,ins)
		    appendElement(this, ins);
		},
		ignorableWhitespace:function(ch, start, length) {
		},
		characters:function(chars, start, length) {
			chars = _toString.apply(this,arguments)
			//console.log(chars)
			if(this.currentElement && chars){
				if (this.cdata) {
					var charNode = this.document.createCDATASection(chars);
					this.currentElement.appendChild(charNode);
				} else {
					var charNode = this.document.createTextNode(chars);
					this.currentElement.appendChild(charNode);
				}
				this.locator && position(this.locator,charNode)
			}
		},
		skippedEntity:function(name) {
		},
		endDocument:function() {
			this.document.normalize();
		},
		setDocumentLocator:function (locator) {
		    if(this.locator = locator){// && !('lineNumber' in locator)){
		    	locator.lineNumber = 0;
		    }
		},
		//LexicalHandler
		comment:function(chars, start, length) {
			chars = _toString.apply(this,arguments)
		    var comm = this.document.createComment(chars);
		    this.locator && position(this.locator,comm)
		    appendElement(this, comm);
		},
		
		startCDATA:function() {
		    //used in characters() methods
		    this.cdata = true;
		},
		endCDATA:function() {
		    this.cdata = false;
		},
		
		startDTD:function(name, publicId, systemId) {
			var impl = this.document.implementation;
		    if (impl && impl.createDocumentType) {
		        var dt = impl.createDocumentType(name, publicId, systemId);
		        this.locator && position(this.locator,dt)
		        appendElement(this, dt);
		    }
		},
		/**
		 * @see org.xml.sax.ErrorHandler
		 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		 */
		warning:function(error) {
			console.warn(error,_locator(this.locator));
		},
		error:function(error) {
			console.error(error,_locator(this.locator));
		},
		fatalError:function(error) {
			console.error(error,_locator(this.locator));
		    throw error;
		}
	}
	function _locator(l){
		if(l){
			return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
		}
	}
	function _toString(chars,start,length){
		if(typeof chars == 'string'){
			return chars.substr(start,length)
		}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
			if(chars.length >= start+length || start){
				return new java.lang.String(chars,start,length)+'';
			}
			return chars;
		}
	}
	
	/*
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
	 * used method of org.xml.sax.ext.LexicalHandler:
	 *  #comment(chars, start, length)
	 *  #startCDATA()
	 *  #endCDATA()
	 *  #startDTD(name, publicId, systemId)
	 *
	 *
	 * IGNORED method of org.xml.sax.ext.LexicalHandler:
	 *  #endDTD()
	 *  #startEntity(name)
	 *  #endEntity(name)
	 *
	 *
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
	 * IGNORED method of org.xml.sax.ext.DeclHandler
	 * 	#attributeDecl(eName, aName, type, mode, value)
	 *  #elementDecl(name, model)
	 *  #externalEntityDecl(name, publicId, systemId)
	 *  #internalEntityDecl(name, value)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
	 * IGNORED method of org.xml.sax.EntityResolver2
	 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
	 *  #resolveEntity(publicId, systemId)
	 *  #getExternalSubset(name, baseURI)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
	 * IGNORED method of org.xml.sax.DTDHandler
	 *  #notationDecl(name, publicId, systemId) {};
	 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
	 */
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
		DOMHandler.prototype[key] = function(){return null}
	})
	
	/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
	function appendElement (hander,node) {
	    if (!hander.currentElement) {
	        hander.document.appendChild(node);
	    } else {
	        hander.currentElement.appendChild(node);
	    }
	}//appendChild and setAttributeNS are preformance key
	
	if(true){
		var XMLReader = __webpack_require__(3).XMLReader;
		var DOMImplementation = exports.DOMImplementation = __webpack_require__(4).DOMImplementation;
		exports.XMLSerializer = __webpack_require__(4).XMLSerializer ;
		exports.DOMParser = DOMParser;
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
	//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
	//[5]   	Name	   ::=   	NameStartChar (NameChar)*
	var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
	var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\u00B7\u0300-\u036F\\ux203F-\u2040]");
	var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
	//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
	//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')
	
	//S_TAG,	S_ATTR,	S_EQ,	S_V
	//S_ATTR_S,	S_E,	S_S,	S_C
	var S_TAG = 0;//tag name offerring
	var S_ATTR = 1;//attr name offerring 
	var S_ATTR_S=2;//attr name end and space offer
	var S_EQ = 3;//=space?
	var S_V = 4;//attr value(no quot value only)
	var S_E = 5;//attr value end and no space(quot end)
	var S_S = 6;//(attr value end || tag end ) && (space offer)
	var S_C = 7;//closed el<el />
	
	function XMLReader(){
		
	}
	
	XMLReader.prototype = {
		parse:function(source,defaultNSMap,entityMap){
			var domBuilder = this.domBuilder;
			domBuilder.startDocument();
			_copy(defaultNSMap ,defaultNSMap = {})
			parse(source,defaultNSMap,entityMap,
					domBuilder,this.errorHandler);
			domBuilder.endDocument();
		}
	}
	function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
	  function fixedFromCharCode(code) {
			// String.prototype.fromCharCode does not supports
			// > 2 bytes unicode chars directly
			if (code > 0xffff) {
				code -= 0x10000;
				var surrogate1 = 0xd800 + (code >> 10)
					, surrogate2 = 0xdc00 + (code & 0x3ff);
	
				return String.fromCharCode(surrogate1, surrogate2);
			} else {
				return String.fromCharCode(code);
			}
		}
		function entityReplacer(a){
			var k = a.slice(1,-1);
			if(k in entityMap){
				return entityMap[k]; 
			}else if(k.charAt(0) === '#'){
				return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
			}else{
				errorHandler.error('entity not found:'+a);
				return a;
			}
		}
		function appendText(end){//has some bugs
			var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
			locator&&position(start);
			domBuilder.characters(xt,0,end-start);
			start = end
		}
		function position(start,m){
			while(start>=endPos && (m = linePattern.exec(source))){
				startPos = m.index;
				endPos = startPos + m[0].length;
				locator.lineNumber++;
				//console.log('line++:',locator,startPos,endPos)
			}
			locator.columnNumber = start-startPos+1;
		}
		var startPos = 0;
		var endPos = 0;
		var linePattern = /.+(?:\r\n?|\n)|.*$/g
		var locator = domBuilder.locator;
		
		var parseStack = [{currentNSMap:defaultNSMapCopy}]
		var closeMap = {};
		var start = 0;
		while(true){
			var i = source.indexOf('<',start);
			if(i<0){
				if(!source.substr(start).match(/^\s*$/)){
					var doc = domBuilder.document;
	    			var text = doc.createTextNode(source.substr(start));
	    			doc.appendChild(text);
	    			domBuilder.currentElement = text;
				}
				return;
			}
			if(i>start){
				appendText(i);
			}
			switch(source.charAt(i+1)){
			case '/':
				var end = source.indexOf('>',i+3);
				var tagName = source.substring(i+2,end);
				var config = parseStack.pop();
				var localNSMap = config.localNSMap;
				
		        if(config.tagName != tagName){
		            errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
		        }
				domBuilder.endElement(config.uri,config.localName,tagName);
				if(localNSMap){
					for(var prefix in localNSMap){
						domBuilder.endPrefixMapping(prefix) ;
					}
				}
				end++;
				break;
				// end elment
			case '?':// <?...?>
				locator&&position(i);
				end = parseInstruction(source,i,domBuilder);
				break;
			case '!':// <!doctype,<![CDATA,<!--
				locator&&position(i);
				end = parseDCC(source,i,domBuilder,errorHandler);
				break;
			default:
				try{
					locator&&position(i);
					
					var el = new ElementAttributes();
					
					//elStartEnd
					var end = parseElementStartPart(source,i,el,entityReplacer,errorHandler);
					var len = el.length;
					//position fixed
					if(len && locator){
						var backup = copyLocator(locator,{});
						for(var i = 0;i<len;i++){
							var a = el[i];
							position(a.offset);
							a.offset = copyLocator(locator,{});
						}
						copyLocator(backup,locator);
					}
					if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
						el.closed = true;
						if(!entityMap.nbsp){
							errorHandler.warning('unclosed xml attribute');
						}
					}
					appendElement(el,domBuilder,parseStack);
					
					
					if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
						end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
					}else{
						end++;
					}
				}catch(e){
					errorHandler.error('element parse error: '+e);
					end = -1;
				}
	
			}
			if(end<0){
				//TODO: 这里有可能sax回退，有位置错误风险
				appendText(i+1);
			}else{
				start = end;
			}
		}
	}
	function copyLocator(f,t){
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
		
	}
	
	/**
	 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function parseElementStartPart(source,start,el,entityReplacer,errorHandler){
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;//status
		while(true){
			var c = source.charAt(p);
			switch(c){
			case '=':
				if(s === S_ATTR){//attrName
					attrName = source.slice(start,p);
					s = S_EQ;
				}else if(s === S_ATTR_S){
					s = S_EQ;
				}else{
					//fatalError: equal must after attrName or space after attrName
					throw new Error('attribute equal must after attrName');
				}
				break;
			case '\'':
			case '"':
				if(s === S_EQ){//equal
					start = p+1;
					p = source.indexOf(c,start)
					if(p>0){
						value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						el.add(attrName,value,start-1);
						s = S_E;
					}else{
						//fatalError: no end quot match
						throw new Error('attribute value no end \''+c+'\' match');
					}
				}else if(s == S_V){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					//console.log(attrName,value,start,p)
					el.add(attrName,value,start);
					//console.dir(el)
					errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
					start = p+1;
					s = S_E
				}else{
					//fatalError: no equal before
					throw new Error('attribute value must after "="');
				}
				break;
			case '/':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_E:
				case S_S:
				case S_C:
					s = S_C;
					el.closed = true;
				case S_V:
				case S_ATTR:
				case S_ATTR_S:
					break;
				//case S_EQ:
				default:
					throw new Error("attribute invalid close char('/')")
				}
				break;
			case ''://end document
				//throw new Error('unexpected end of input')
				errorHandler.error('unexpected end of input');
			case '>':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_E:
				case S_S:
				case S_C:
					break;//normal
				case S_V://Compatible state
				case S_ATTR:
					value = source.slice(start,p);
					if(value.slice(-1) === '/'){
						el.closed  = true;
						value = value.slice(0,-1)
					}
				case S_ATTR_S:
					if(s === S_ATTR_S){
						value = attrName;
					}
					if(s == S_V){
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
					}else{
						errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
						el.add(value,value,start)
					}
					break;
				case S_EQ:
					throw new Error('attribute value missed!!');
				}
	//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
				return p;
			/*xml space '\x20' | #x9 | #xD | #xA; */
			case '\u0080':
				c = ' ';
			default:
				if(c<= ' '){//space
					switch(s){
					case S_TAG:
						el.setTagName(source.slice(start,p));//tagName
						s = S_S;
						break;
					case S_ATTR:
						attrName = source.slice(start,p)
						s = S_ATTR_S;
						break;
					case S_V:
						var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value,start)
					case S_E:
						s = S_S;
						break;
					//case S_S:
					//case S_EQ:
					//case S_ATTR_S:
					//	void();break;
					//case S_C:
						//ignore warning
					}
				}else{//not space
	//S_TAG,	S_ATTR,	S_EQ,	S_V
	//S_ATTR_S,	S_E,	S_S,	S_C
					switch(s){
					//case S_TAG:void();break;
					//case S_ATTR:void();break;
					//case S_V:void();break;
					case S_ATTR_S:
						errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead!!')
						el.add(attrName,attrName,start);
						start = p;
						s = S_ATTR;
						break;
					case S_E:
						errorHandler.warning('attribute space is required"'+attrName+'"!!')
					case S_S:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_V;
						start = p;
						break;
					case S_C:
						throw new Error("elements closed character '/' and '>' must be connected to");
					}
				}
			}
			p++;
		}
	}
	/**
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function appendElement(el,domBuilder,parseStack){
		var tagName = el.tagName;
		var localNSMap = null;
		var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
		var i = el.length;
		while(i--){
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(':');
			if(nsp>0){
				var prefix = a.prefix = qName.slice(0,nsp);
				var localName = qName.slice(nsp+1);
				var nsPrefix = prefix === 'xmlns' && localName
			}else{
				localName = qName;
				prefix = null
				nsPrefix = qName === 'xmlns' && ''
			}
			//can not set prefix,because prefix !== ''
			a.localName = localName ;
			//prefix == null for no ns prefix attribute 
			if(nsPrefix !== false){//hack!!
				if(localNSMap == null){
					localNSMap = {}
					//console.log(currentNSMap,0)
					_copy(currentNSMap,currentNSMap={})
					//console.log(currentNSMap,1)
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = 'http://www.w3.org/2000/xmlns/'
				domBuilder.startPrefixMapping(nsPrefix, value) 
			}
		}
		var i = el.length;
		while(i--){
			a = el[i];
			var prefix = a.prefix;
			if(prefix){//no prefix attribute has no namespace
				if(prefix === 'xml'){
					a.uri = 'http://www.w3.org/XML/1998/namespace';
				}if(prefix !== 'xmlns'){
					a.uri = currentNSMap[prefix]
					
					//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
				}
			}
		}
		var nsp = tagName.indexOf(':');
		if(nsp>0){
			prefix = el.prefix = tagName.slice(0,nsp);
			localName = el.localName = tagName.slice(nsp+1);
		}else{
			prefix = null;//important!!
			localName = el.localName = tagName;
		}
		//no prefix element has default namespace
		var ns = el.uri = currentNSMap[prefix || ''];
		domBuilder.startElement(ns,localName,tagName,el);
		//endPrefixMapping and startPrefixMapping have not any help for dom builder
		//localNSMap = null
		if(el.closed){
			domBuilder.endElement(ns,localName,tagName);
			if(localNSMap){
				for(prefix in localNSMap){
					domBuilder.endPrefixMapping(prefix) 
				}
			}
		}else{
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			parseStack.push(el);
		}
	}
	function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
		if(/^(?:script|textarea)$/i.test(tagName)){
			var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
			var text = source.substring(elStartEnd+1,elEndStart);
			if(/[&<]/.test(text)){
				if(/^script$/i.test(tagName)){
					//if(!/\]\]>/.test(text)){
						//lexHandler.startCDATA();
						domBuilder.characters(text,0,text.length);
						//lexHandler.endCDATA();
						return elEndStart;
					//}
				}//}else{//text area
					text = text.replace(/&#?\w+;/g,entityReplacer);
					domBuilder.characters(text,0,text.length);
					return elEndStart;
				//}
				
			}
		}
		return elStartEnd+1;
	}
	function fixSelfClosed(source,elStartEnd,tagName,closeMap){
		//if(tagName in closeMap){
		var pos = closeMap[tagName];
		if(pos == null){
			//console.log(tagName)
			pos = closeMap[tagName] = source.lastIndexOf('</'+tagName+'>')
		}
		return pos<elStartEnd;
		//} 
	}
	function _copy(source,target){
		for(var n in source){target[n] = source[n]}
	}
	function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
		var next= source.charAt(start+2)
		switch(next){
		case '-':
			if(source.charAt(start + 3) === '-'){
				var end = source.indexOf('-->',start+4);
				//append comment source.substring(4,end)//<!--
				if(end>start){
					domBuilder.comment(source,start+4,end-start-4);
					return end+3;
				}else{
					errorHandler.error("Unclosed comment");
					return -1;
				}
			}else{
				//error
				return -1;
			}
		default:
			if(source.substr(start+3,6) == 'CDATA['){
				var end = source.indexOf(']]>',start+9);
				domBuilder.startCDATA();
				domBuilder.characters(source,start+9,end-start-9);
				domBuilder.endCDATA() 
				return end+3;
			}
			//<!DOCTYPE
			//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
			var matchs = split(source,start);
			var len = matchs.length;
			if(len>1 && /!doctype/i.test(matchs[0][0])){
				var name = matchs[1][0];
				var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
				var sysid = len>4 && matchs[4][0];
				var lastMatch = matchs[len-1]
				domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
						sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
				domBuilder.endDTD();
				
				return lastMatch.index+lastMatch[0].length
			}
		}
		return -1;
	}
	
	
	
	function parseInstruction(source,start,domBuilder){
		var end = source.indexOf('?>',start);
		if(end){
			var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
			if(match){
				var len = match[0].length;
				domBuilder.processingInstruction(match[1], match[2]) ;
				return end+2;
			}else{//error
				return -1;
			}
		}
		return -1;
	}
	
	/**
	 * @param source
	 */
	function ElementAttributes(source){
		
	}
	ElementAttributes.prototype = {
		setTagName:function(tagName){
			if(!tagNamePattern.test(tagName)){
				throw new Error('invalid tagName:'+tagName)
			}
			this.tagName = tagName
		},
		add:function(qName,value,offset){
			if(!tagNamePattern.test(qName)){
				throw new Error('invalid attribute:'+qName)
			}
			this[this.length++] = {qName:qName,value:value,offset:offset}
		},
		length:0,
		getLocalName:function(i){return this[i].localName},
		getOffset:function(i){return this[i].offset},
		getQName:function(i){return this[i].qName},
		getURI:function(i){return this[i].uri},
		getValue:function(i){return this[i].value}
	//	,getIndex:function(uri, localName)){
	//		if(localName){
	//			
	//		}else{
	//			var qName = uri
	//		}
	//	},
	//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
	//	getType:function(uri,localName){}
	//	getType:function(i){},
	}
	
	
	
	
	function _set_proto_(thiz,parent){
		thiz.__proto__ = parent;
		return thiz;
	}
	if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
		_set_proto_ = function(thiz,parent){
			function p(){};
			p.prototype = parent;
			p = new p();
			for(parent in thiz){
				p[parent] = thiz[parent];
			}
			return p;
		}
	}
	
	function split(source,start){
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);//skip <
		while(match = reg.exec(source)){
			buf.push(match);
			if(match[1])return buf;
		}
	}
	
	if(true){
		exports.XMLReader = XMLReader;
	}
	


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * DOM Level 2
	 * Object DOMException
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	 */
	
	function copy(src,dest){
		for(var p in src){
			dest[p] = src[p];
		}
	}
	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	 */
	function _extends(Class,Super){
		var pt = Class.prototype;
		if(Object.create){
			var ppt = Object.create(Super.prototype)
			pt.__proto__ = ppt;
		}
		if(!(pt instanceof Super)){
			function t(){};
			t.prototype = Super.prototype;
			t = new t();
			copy(pt,t);
			Class.prototype = pt = t;
		}
		if(pt.constructor != Class){
			if(typeof Class != 'function'){
				console.error("unknow Class:"+Class)
			}
			pt.constructor = Class
		}
	}
	var htmlns = 'http://www.w3.org/1999/xhtml' ;
	// Node Types
	var NodeType = {}
	var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
	var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
	var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
	var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
	var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
	var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
	var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
	var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
	var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
	var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;
	
	// ExceptionCode
	var ExceptionCode = {}
	var ExceptionMessage = {};
	var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
	var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
	var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
	var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
	var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
	var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
	var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
	var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
	var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
	var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
	//level2
	var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
	var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
	var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
	var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
	var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);
	
	
	function DOMException(code, message) {
		if(message instanceof Error){
			var error = message;
		}else{
			error = this;
			Error.call(this, ExceptionMessage[code]);
			this.message = ExceptionMessage[code];
			if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
		}
		error.code = code;
		if(message) this.message = this.message + ": " + message;
		return error;
	};
	DOMException.prototype = Error.prototype;
	copy(ExceptionCode,DOMException)
	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	 * The items in the NodeList are accessible via an integral index, starting from 0.
	 */
	function NodeList() {
	};
	NodeList.prototype = {
		/**
		 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		 * @standard level1
		 */
		length:0, 
		/**
		 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		 * @standard level1
		 * @param index  unsigned long 
		 *   Index into the collection.
		 * @return Node
		 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
		 */
		item: function(index) {
			return this[index] || null;
		}
	};
	function LiveNodeList(node,refresh){
		this._node = node;
		this._refresh = refresh
		_updateLiveList(this);
	}
	function _updateLiveList(list){
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if(list._inc != inc){
			var ls = list._refresh(list._node);
			//console.log(ls.length)
			__set__(list,'length',ls.length);
			copy(ls,list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i){
		_updateLiveList(this);
		return this[i];
	}
	
	_extends(LiveNodeList,NodeList);
	/**
	 * 
	 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
	 * NamedNodeMap objects in the DOM are live.
	 * used for attributes or DocumentType entities 
	 */
	function NamedNodeMap() {
	};
	
	function _findNodeIndex(list,node){
		var i = list.length;
		while(i--){
			if(list[i] === node){return i}
		}
	}
	
	function _addNamedNode(el,list,newAttr,oldAttr){
		if(oldAttr){
			list[_findNodeIndex(list,oldAttr)] = newAttr;
		}else{
			list[list.length++] = newAttr;
		}
		if(el){
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if(doc){
				oldAttr && _onRemoveAttribute(doc,el,oldAttr);
				_onAddAttribute(doc,el,newAttr);
			}
		}
	}
	function _removeNamedNode(el,list,attr){
		var i = _findNodeIndex(list,attr);
		if(i>=0){
			var lastIndex = list.length-1
			while(i<lastIndex){
				list[i] = list[++i]
			}
			list.length = lastIndex;
			if(el){
				var doc = el.ownerDocument;
				if(doc){
					_onRemoveAttribute(doc,el,attr);
					attr.ownerElement = null;
				}
			}
		}else{
			throw DOMException(NOT_FOUND_ERR,new Error())
		}
	}
	NamedNodeMap.prototype = {
		length:0,
		item:NodeList.prototype.item,
		getNamedItem: function(key) {
	//		if(key.indexOf(':')>0 || key == 'xmlns'){
	//			return null;
	//		}
			var i = this.length;
			while(i--){
				var attr = this[i];
				if(attr.nodeName == key){
					return attr;
				}
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			var oldAttr = this.getNamedItem(attr.nodeName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},
		/* returns Node */
		setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
			var el = attr.ownerElement, oldAttr;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},
	
		/* returns Node */
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;
			
			
		},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
		
		//for level2
		removeNamedItemNS:function(namespaceURI,localName){
			var attr = this.getNamedItemNS(namespaceURI,localName);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while(i--){
				var node = this[i];
				if(node.localName == localName && node.namespaceURI == namespaceURI){
					return node;
				}
			}
			return null;
		}
	};
	/**
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
	 */
	function DOMImplementation(/* Object */ features) {
		this._features = {};
		if (features) {
			for (var feature in features) {
				 this._features = features[feature];
			}
		}
	};
	
	DOMImplementation.prototype = {
		hasFeature: function(/* string */ feature, /* string */ version) {
			var versions = this._features[feature.toLowerCase()];
			if (versions && (!version || version in versions)) {
				return true;
			} else {
				return false;
			}
		},
		// Introduced in DOM Level 2:
		createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
			var doc = new Document();
			doc.doctype = doctype;
			if(doctype){
				doc.appendChild(doctype);
			}
			doc.implementation = this;
			doc.childNodes = new NodeList();
			if(qualifiedName){
				var root = doc.createElementNS(namespaceURI,qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		// Introduced in DOM Level 2:
		createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
			var node = new DocumentType();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId;
			node.systemId = systemId;
			// Introduced in DOM Level 2:
			//readonly attribute DOMString        internalSubset;
			
			//TODO:..
			//  readonly attribute NamedNodeMap     entities;
			//  readonly attribute NamedNodeMap     notations;
			return node;
		}
	};
	
	
	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	 */
	
	function Node() {
	};
	
	Node.prototype = {
		firstChild : null,
		lastChild : null,
		previousSibling : null,
		nextSibling : null,
		attributes : null,
		parentNode : null,
		childNodes : null,
		ownerDocument : null,
		nodeValue : null,
		namespaceURI : null,
		prefix : null,
		localName : null,
		// Modified in DOM Level 2:
		insertBefore:function(newChild, refChild){//raises 
			return _insertBefore(this,newChild,refChild);
		},
		replaceChild:function(newChild, oldChild){//raises 
			this.insertBefore(newChild,oldChild);
			if(oldChild){
				this.removeChild(oldChild);
			}
		},
		removeChild:function(oldChild){
			return _removeChild(this,oldChild);
		},
		appendChild:function(newChild){
			return this.insertBefore(newChild,null);
		},
		hasChildNodes:function(){
			return this.firstChild != null;
		},
		cloneNode:function(deep){
			return cloneNode(this.ownerDocument||this,this,deep);
		},
		// Modified in DOM Level 2:
		normalize:function(){
			var child = this.firstChild;
			while(child){
				var next = child.nextSibling;
				if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
					this.removeChild(next);
					child.appendData(next.data);
				}else{
					child.normalize();
					child = next;
				}
			}
		},
	  	// Introduced in DOM Level 2:
		isSupported:function(feature, version){
			return this.ownerDocument.implementation.hasFeature(feature,version);
		},
	    // Introduced in DOM Level 2:
	    hasAttributes:function(){
	    	return this.attributes.length>0;
	    },
	    lookupPrefix:function(namespaceURI){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			for(var n in map){
	    				if(map[n] == namespaceURI){
	    					return n;
	    				}
	    			}
	    		}
	    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    lookupNamespaceURI:function(prefix){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			if(prefix in map){
	    				return map[prefix] ;
	    			}
	    		}
	    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    isDefaultNamespace:function(namespaceURI){
	    	var prefix = this.lookupPrefix(namespaceURI);
	    	return prefix == null;
	    }
	};
	
	
	function _xmlEncoder(c){
		return c == '<' && '&lt;' ||
	         c == '>' && '&gt;' ||
	         c == '&' && '&amp;' ||
	         c == '"' && '&quot;' ||
	         '&#'+c.charCodeAt()+';'
	}
	
	
	copy(NodeType,Node);
	copy(NodeType,Node.prototype);
	
	/**
	 * @param callback return true for continue,false for break
	 * @return boolean true: break visit;
	 */
	function _visitNode(node,callback){
		if(callback(node)){
			return true;
		}
		if(node = node.firstChild){
			do{
				if(_visitNode(node,callback)){return true}
	        }while(node=node.nextSibling)
	    }
	}
	
	
	
	function Document(){
	}
	function _onAddAttribute(doc,el,newAttr){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
		}
	}
	function _onRemoveAttribute(doc,el,newAttr,remove){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			delete el._nsMap[newAttr.prefix?newAttr.localName:'']
		}
	}
	function _onUpdateChild(doc,el,newChild){
		if(doc && doc._inc){
			doc._inc++;
			//update childNodes
			var cs = el.childNodes;
			if(newChild){
				cs[cs.length++] = newChild;
			}else{
				//console.log(1)
				var child = el.firstChild;
				var i = 0;
				while(child){
					cs[i++] = child;
					child =child.nextSibling;
				}
				cs.length = i;
			}
		}
	}
	
	/**
	 * attributes;
	 * children;
	 * 
	 * writeable properties:
	 * nodeValue,Attr:value,CharacterData:data
	 * prefix
	 */
	function _removeChild(parentNode,child){
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if(previous){
			previous.nextSibling = next;
		}else{
			parentNode.firstChild = next
		}
		if(next){
			next.previousSibling = previous;
		}else{
			parentNode.lastChild = previous;
		}
		_onUpdateChild(parentNode.ownerDocument,parentNode);
		return child;
	}
	/**
	 * preformance key(refChild == null)
	 */
	function _insertBefore(parentNode,newChild,nextChild){
		var cp = newChild.parentNode;
		if(cp){
			cp.removeChild(newChild);//remove and update
		}
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			var newFirst = newChild.firstChild;
			if (newFirst == null) {
				return newChild;
			}
			var newLast = newChild.lastChild;
		}else{
			newFirst = newLast = newChild;
		}
		var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;
	
		newFirst.previousSibling = pre;
		newLast.nextSibling = nextChild;
		
		
		if(pre){
			pre.nextSibling = newFirst;
		}else{
			parentNode.firstChild = newFirst;
		}
		if(nextChild == null){
			parentNode.lastChild = newLast;
		}else{
			nextChild.previousSibling = newLast;
		}
		do{
			newFirst.parentNode = parentNode;
		}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
		_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
		//console.log(parentNode.lastChild.nextSibling == null)
		if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
			newChild.firstChild = newChild.lastChild = null;
		}
		return newChild;
	}
	function _appendSingleChild(parentNode,newChild){
		var cp = newChild.parentNode;
		if(cp){
			var pre = parentNode.lastChild;
			cp.removeChild(newChild);//remove and update
			var pre = parentNode.lastChild;
		}
		var pre = parentNode.lastChild;
		newChild.parentNode = parentNode;
		newChild.previousSibling = pre;
		newChild.nextSibling = null;
		if(pre){
			pre.nextSibling = newChild;
		}else{
			parentNode.firstChild = newChild;
		}
		parentNode.lastChild = newChild;
		_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
		return newChild;
		//console.log("__aa",parentNode.lastChild.nextSibling == null)
	}
	Document.prototype = {
		//implementation : null,
		nodeName :  '#document',
		nodeType :  DOCUMENT_NODE,
		doctype :  null,
		documentElement :  null,
		_inc : 1,
		
		insertBefore :  function(newChild, refChild){//raises 
			if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
				var child = newChild.firstChild;
				while(child){
					var next = child.nextSibling;
					this.insertBefore(child,refChild);
					child = next;
				}
				return newChild;
			}
			if(this.documentElement == null && newChild.nodeType == 1){
				this.documentElement = newChild;
			}
			
			return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
		},
		removeChild :  function(oldChild){
			if(this.documentElement == oldChild){
				this.documentElement = null;
			}
			return _removeChild(this,oldChild);
		},
		// Introduced in DOM Level 2:
		importNode : function(importedNode,deep){
			return importNode(this,importedNode,deep);
		},
		// Introduced in DOM Level 2:
		getElementById :	function(id){
			var rtv = null;
			_visitNode(this.documentElement,function(node){
				if(node.nodeType == 1){
					if(node.getAttribute('id') == id){
						rtv = node;
						return true;
					}
				}
			})
			return rtv;
		},
		
		//document factory method:
		createElement :	function(tagName){
			var node = new Element();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.childNodes = new NodeList();
			var attrs	= node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment :	function(){
			var node = new DocumentFragment();
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		createTextNode :	function(data){
			var node = new Text();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createComment :	function(data){
			var node = new Comment();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createCDATASection :	function(data){
			var node = new CDATASection();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createProcessingInstruction :	function(target,data){
			var node = new ProcessingInstruction();
			node.ownerDocument = this;
			node.tagName = node.target = target;
			node.nodeValue= node.data = data;
			return node;
		},
		createAttribute :	function(name){
			var node = new Attr();
			node.ownerDocument	= this;
			node.name = name;
			node.nodeName	= name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		createEntityReference :	function(name){
			var node = new EntityReference();
			node.ownerDocument	= this;
			node.nodeName	= name;
			return node;
		},
		// Introduced in DOM Level 2:
		createElementNS :	function(namespaceURI,qualifiedName){
			var node = new Element();
			var pl = qualifiedName.split(':');
			var attrs	= node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else{
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			attrs._ownerElement = node;
			return node;
		},
		// Introduced in DOM Level 2:
		createAttributeNS :	function(namespaceURI,qualifiedName){
			var node = new Attr();
			var pl = qualifiedName.split(':');
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else{
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			return node;
		}
	};
	_extends(Document,Node);
	
	
	function Element() {
		this._nsMap = {};
	};
	Element.prototype = {
		nodeType : ELEMENT_NODE,
		hasAttribute : function(name){
			return this.getAttributeNode(name)!=null;
		},
		getAttribute : function(name){
			var attr = this.getAttributeNode(name);
			return attr && attr.value || '';
		},
		getAttributeNode : function(name){
			return this.attributes.getNamedItem(name);
		},
		setAttribute : function(name, value){
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr)
		},
		removeAttribute : function(name){
			var attr = this.getAttributeNode(name)
			attr && this.removeAttributeNode(attr);
		},
		
		//four real opeartion method
		appendChild:function(newChild){
			if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
				return this.insertBefore(newChild,null);
			}else{
				return _appendSingleChild(this,newChild);
			}
		},
		setAttributeNode : function(newAttr){
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS : function(newAttr){
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode : function(oldAttr){
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		//get real attribute name,and remove it by removeAttributeNode
		removeAttributeNS : function(namespaceURI, localName){
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		
		hasAttributeNS : function(namespaceURI, localName){
			return this.getAttributeNodeNS(namespaceURI, localName)!=null;
		},
		getAttributeNS : function(namespaceURI, localName){
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || '';
		},
		setAttributeNS : function(namespaceURI, qualifiedName, value){
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = value;
			this.setAttributeNode(attr)
		},
		getAttributeNodeNS : function(namespaceURI, localName){
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		
		getElementsByTagName : function(tagName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
						ls.push(node);
					}
				});
				return ls;
			});
		},
		getElementsByTagNameNS : function(namespaceURI, localName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType === ELEMENT_NODE && node.namespaceURI === namespaceURI && (localName === '*' || node.localName == localName)){
						ls.push(node);
					}
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
	
	
	_extends(Element,Node);
	function Attr() {
	};
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr,Node);
	
	
	function CharacterData() {
	};
	CharacterData.prototype = {
		data : '',
		substringData : function(offset, count) {
			return this.data.substring(offset, offset+count);
		},
		appendData: function(text) {
			text = this.data+text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset,text) {
			this.replaceData(offset,0,text);
		
		},
		appendChild:function(newChild){
			//if(!(newChild instanceof CharacterData)){
				throw new Error(ExceptionMessage[3])
			//}
			return Node.prototype.appendChild.apply(this,arguments)
		},
		deleteData: function(offset, count) {
			this.replaceData(offset,count,"");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0,offset);
			var end = this.data.substring(offset+count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	}
	_extends(CharacterData,Node);
	function Text() {
	};
	Text.prototype = {
		nodeName : "#text",
		nodeType : TEXT_NODE,
		splitText : function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if(this.parentNode){
				this.parentNode.insertBefore(newNode, this.nextSibling);
			}
			return newNode;
		}
	}
	_extends(Text,CharacterData);
	function Comment() {
	};
	Comment.prototype = {
		nodeName : "#comment",
		nodeType : COMMENT_NODE
	}
	_extends(Comment,CharacterData);
	
	function CDATASection() {
	};
	CDATASection.prototype = {
		nodeName : "#cdata-section",
		nodeType : CDATA_SECTION_NODE
	}
	_extends(CDATASection,CharacterData);
	
	
	function DocumentType() {
	};
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType,Node);
	
	function Notation() {
	};
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation,Node);
	
	function Entity() {
	};
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity,Node);
	
	function EntityReference() {
	};
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference,Node);
	
	function DocumentFragment() {
	};
	DocumentFragment.prototype.nodeName =	"#document-fragment";
	DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment,Node);
	
	
	function ProcessingInstruction() {
	}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction,Node);
	function XMLSerializer(){}
	XMLSerializer.prototype.serializeToString = function(node){
		var buf = [];
		serializeToString(node,buf);
		return buf.join('');
	}
	Node.prototype.toString =function(){
		return XMLSerializer.prototype.serializeToString(this);
	}
	function serializeToString(node,buf){
		switch(node.nodeType){
		case ELEMENT_NODE:
			var attrs = node.attributes;
			var len = attrs.length;
			var child = node.firstChild;
			var nodeName = node.tagName;
			var isHTML = htmlns === node.namespaceURI
			buf.push('<',nodeName);
			for(var i=0;i<len;i++){
				serializeToString(attrs.item(i),buf,isHTML);
			}
			if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
				buf.push('>');
				//if is cdata child node
				if(isHTML && /^script$/i.test(nodeName)){
					if(child){
						buf.push(child.data);
					}
				}else{
					while(child){
						serializeToString(child,buf);
						child = child.nextSibling;
					}
				}
				buf.push('</',nodeName,'>');
			}else{
				buf.push('/>');
			}
			return;
		case DOCUMENT_NODE:
		case DOCUMENT_FRAGMENT_NODE:
			var child = node.firstChild;
			while(child){
				serializeToString(child,buf);
				child = child.nextSibling;
			}
			return;
		case ATTRIBUTE_NODE:
			return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
		case TEXT_NODE:
			return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
		case CDATA_SECTION_NODE:
			return buf.push( '<![CDATA[',node.data,']]>');
		case COMMENT_NODE:
			return buf.push( "<!--",node.data,"-->");
		case DOCUMENT_TYPE_NODE:
			var pubid = node.publicId;
			var sysid = node.systemId;
			buf.push('<!DOCTYPE ',node.name);
			if(pubid){
				buf.push(' PUBLIC "',pubid);
				if (sysid && sysid!='.') {
					buf.push( '" "',sysid);
				}
				buf.push('">');
			}else if(sysid && sysid!='.'){
				buf.push(' SYSTEM "',sysid,'">');
			}else{
				var sub = node.internalSubset;
				if(sub){
					buf.push(" [",sub,"]");
				}
				buf.push(">");
			}
			return;
		case PROCESSING_INSTRUCTION_NODE:
			return buf.push( "<?",node.target," ",node.data,"?>");
		case ENTITY_REFERENCE_NODE:
			return buf.push( '&',node.nodeName,';');
		//case ENTITY_NODE:
		//case NOTATION_NODE:
		default:
			buf.push('??',node.nodeName);
		}
	}
	function importNode(doc,node,deep){
		var node2;
		switch (node.nodeType) {
		case ELEMENT_NODE:
			node2 = node.cloneNode(false);
			node2.ownerDocument = doc;
			//var attrs = node2.attributes;
			//var len = attrs.length;
			//for(var i=0;i<len;i++){
				//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
			//}
		case DOCUMENT_FRAGMENT_NODE:
			break;
		case ATTRIBUTE_NODE:
			deep = true;
			break;
		//case ENTITY_REFERENCE_NODE:
		//case PROCESSING_INSTRUCTION_NODE:
		////case TEXT_NODE:
		//case CDATA_SECTION_NODE:
		//case COMMENT_NODE:
		//	deep = false;
		//	break;
		//case DOCUMENT_NODE:
		//case DOCUMENT_TYPE_NODE:
		//cannot be imported.
		//case ENTITY_NODE:
		//case NOTATION_NODE：
		//can not hit in level3
		//default:throw e;
		}
		if(!node2){
			node2 = node.cloneNode(false);//false
		}
		node2.ownerDocument = doc;
		node2.parentNode = null;
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(importNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}
	//
	//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
	//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
	function cloneNode(doc,node,deep){
		var node2 = new node.constructor();
		for(var n in node){
			var v = node[n];
			if(typeof v != 'object' ){
				if(v != node2[n]){
					node2[n] = v;
				}
			}
		}
		if(node.childNodes){
			node2.childNodes = new NodeList();
		}
		node2.ownerDocument = doc;
		switch (node2.nodeType) {
		case ELEMENT_NODE:
			var attrs	= node.attributes;
			var attrs2	= node2.attributes = new NamedNodeMap();
			var len = attrs.length
			attrs2._ownerElement = node2;
			for(var i=0;i<len;i++){
				node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
			}
			break;;
		case ATTRIBUTE_NODE:
			deep = true;
		}
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(cloneNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}
	
	function __set__(object,key,value){
		object[key] = value
	}
	//do dynamic
	try{
		if(Object.defineProperty){
			Object.defineProperty(LiveNodeList.prototype,'length',{
				get:function(){
					_updateLiveList(this);
					return this.$$length;
				}
			});
			Object.defineProperty(Node.prototype,'textContent',{
				get:function(){
					return getTextContent(this);
				},
				set:function(data){
					switch(this.nodeType){
					case 1:
					case 11:
						while(this.firstChild){
							this.removeChild(this.firstChild);
						}
						if(data || String(data)){
							this.appendChild(this.ownerDocument.createTextNode(data));
						}
						break;
					default:
						//TODO:
						this.data = data;
						this.value = value;
						this.nodeValue = data;
					}
				}
			})
			
			function getTextContent(node){
				switch(node.nodeType){
				case 1:
				case 11:
					var buf = [];
					node = node.firstChild;
					while(node){
						if(node.nodeType!==7 && node.nodeType !==8){
							buf.push(getTextContent(node));
						}
						node = node.nextSibling;
					}
					return buf.join('');
				default:
					return node.nodeValue;
				}
			}
			__set__ = function(object,key,value){
				//console.log(value)
				object['$$'+key] = value
			}
		}
	}catch(e){//ie8
	}
	
	if(true){
		exports.DOMImplementation = DOMImplementation;
		exports.XMLSerializer = XMLSerializer;
	}


/***/ }
/******/ ])
});
;
//# sourceMappingURL=ltxml.js.map