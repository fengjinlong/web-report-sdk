'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

;(function () {

    var config = {
        // 上报地址
        domain: 'http://localhost:8080/',
        //资源列表 
        resourceList: [],
        // 页面性能列表
        performance: {},
        // 错误列表
        errorList: [],
        // 延迟请求resourceTime资源时间
        outtime: 500,
        // ajax onreadystatechange数量
        readyNum: 0,
        // 页面fetch数量
        fetchNum: 0,
        // ajax onload数量
        loadNum: 0,
        // 页面ajax数量
        ajaxLength: 0,
        // 页面fetch总数量
        totalFetlength: 0,
        // fetch请求信息
        fetchMsg: [],
        // 页面ajax信息
        ajaxMsg: [],
        // 是否有ajax
        haveAjax: false,
        // 是否有fetch
        haveFetch: false,
        // 需要过滤的url信息
        filterUrl: ['http://localhost:35729/livereload.js?snipver=1'],
        // 来自域名
        preUrl: document.referrer && document.referrer !== location.href ? document.referrer : '',
        // 浏览器信息
        appVersion: navigator.appVersion,
        // 当前页面
        page: location.href

        // error default
    };var errordefo = {
        t: '', //发送数据时的时间戳
        n: 'js', //模块名,
        msg: '', //错误的具体信息,
        data: {}
    };

    var beginTime = new Date().getTime();
    var loadTime = 0;
    var ajaxTime = 0;
    var fetchTime = 0;

    //--------------------------------上报数据------------------------------------

    // error上报
    _error();

    // 绑定onload事件
    addEventListener("load", function () {
        loadTime = new Date().getTime() - beginTime;
        getLargeTime();
        // setTimeout(()=>{
        // 	console.log(config.errorList)

        //        console.log(`loadTime:${loadTime},ajaxTime:${ajaxTime},`)

        // },config.outtime)
    }, false);

    // 执行fetch重写
    _fetch();

    //  拦截ajax
    _Ajax({
        onreadystatechange: function onreadystatechange(xhr) {
            if (xhr.readyState === 4) {
                config.readyNum += 1;
                if (config.readyNum === config.ajaxLength) {
                    console.log('走了AJAX onreadystatechange 方法');
                    config.ajaxLength = config.readyNum = 0;
                    ajaxTime = new Date().getTime() - beginTime;
                    getLargeTime();
                }

                if (xhr.status >= 200 && xhr.status < 300) {} else {
                    xhr.method = xhr.args && xhr.args.length ? xhr.args[0] : 'GET';
                    ajaxResponse(xhr);
                }
            }
        },
        onerror: function onerror(xhr) {
            if (xhr.args && xhr.args.length) {
                xhr.method = xhr.args[0];
                xhr.responseURL = xhr.args[1];
                xhr.statusText = 'ajax请求路径有误';
            }
            ajaxResponse(xhr);
        },
        onload: function onload(xhr) {
            if (xhr.readyState === 4) {
                config.loadNum += 1;
                if (config.loadNum === config.ajaxLength) {
                    console.log('走了AJAX onload 方法');
                    config.ajaxLength = config.loadNum = 0;
                    ajaxTime = new Date().getTime() - beginTime;
                    getLargeTime();
                }
                if (xhr.status >= 200 && xhr.status < 300) {} else {
                    xhr.method = xhr.args && xhr.args.length ? xhr.args[0] : 'GET';
                    ajaxResponse(xhr);
                }
            }
        },
        open: function open(arg, xhr) {
            if (arg[1].indexOf('http://localhost:8000/sockjs-node/info') != -1) return;
            this.args = arg;

            config.ajaxMsg.push(arg);
            config.ajaxLength = config.ajaxLength + 1;
            config.haveAjax = true;
        }
    });

    // 获得上报数据
    function getRepotData() {}

    //--------------------------------工具函数------------------------------------

    //比较onload与ajax时间长度
    function getLargeTime() {
        if (config.haveAjax && config.haveFetch && loadTime && ajaxTime && fetchTime) {
            console.log('loadTime:' + loadTime + ',ajaxTime:' + ajaxTime + ',fetchTime:' + fetchTime);
        } else if (config.haveAjax && !config.haveFetch && loadTime && ajaxTime) {
            console.log('loadTime:' + loadTime + ',ajaxTime:' + ajaxTime);
        } else if (!config.haveAjax && config.haveFetch && loadTime && fetchTime) {
            console.log('loadTime:' + loadTime + ',fetchTime:' + fetchTime);
        } else if (!config.haveAjax && !config.haveFetch && loadTime) {
            console.log('loadTime:' + loadTime);
        }
    }

    // 统计页面性能
    function perforPage() {
        if (!window.performance) return;
        var timing = performance.timing;
        config.performance = {
            // DNS解析时间
            dnst: timing.domainLookupEnd - timing.domainLookupStart || 0,
            //TCP建立时间
            tcpt: timing.connectEnd - timing.connectStart || 0,
            // 白屏时间  
            wit: timing.responseStart - timing.navigationStart || 0,
            //dom渲染完成时间
            domt: timing.domContentLoadedEventEnd - timing.navigationStart || 0,
            //页面onload时间
            lodt: timing.loadEventEnd - timing.navigationStart || 0,
            // 页面准备时间 
            radt: timing.fetchStart - timing.navigationStart || 0,
            // 页面重定向时间
            rdit: timing.redirectEnd - timing.redirectStart || 0,
            // unload时间
            uodt: timing.unloadEventEnd - timing.unloadEventStart || 0,
            //request请求耗时
            reqt: timing.responseEnd - timing.requestStart || 0,
            //页面解析dom耗时
            andt: timing.domComplete - timing.domInteractive || 0,
            // 上一页面
            pre: preUrl
        };
    }

    // 统计页面资源性能
    function perforResource() {
        if (!window.performance && !window.performance.getEntries) return false;
        var resource = performance.getEntriesByType('resource');

        var resourceList = [];
        if (!resource && !resource.length) return resourceList;

        resource.forEach(function (item) {
            var json = {
                name: item.name,
                method: 'GET',
                type: item.initiatorType,
                duration: item.duration.toFixed(2) || 0,
                decodedBodySize: item.decodedBodySize || 0,
                nextHopProtocol: item.nextHopProtocol
            };
            if (config.ajaxMsg && config.ajaxMsg.length) {
                for (var i = 0, len = config.ajaxMsg.length; i < len; i++) {
                    if (config.ajaxMsg[i][1] === item.name) {
                        json.method = config.ajaxMsg[i][0] || 'GET';
                    }
                }
            }
            resourceList.push(json);
        });
        config.resourceList = resourceList;
    }

    // ajax重写
    function _Ajax(funs) {
        window._ahrealxhr = window._ahrealxhr || XMLHttpRequest;
        XMLHttpRequest = function XMLHttpRequest() {
            this.xhr = new window._ahrealxhr();
            for (var attr in this.xhr) {
                var type = "";
                try {
                    type = _typeof(this.xhr[attr]);
                } catch (e) {}
                if (type === "function") {
                    this[attr] = hookfun(attr);
                } else {
                    Object.defineProperty(this, attr, {
                        get: getFactory(attr),
                        set: setFactory(attr)
                    });
                }
            }
        };
        function getFactory(attr) {
            return function () {
                return this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
            };
        }
        function setFactory(attr) {
            return function (f) {
                var xhr = this.xhr;
                var that = this;
                if (attr.indexOf("on") != 0) {
                    this[attr + "_"] = f;
                    return;
                }
                if (funs[attr]) {
                    xhr[attr] = function () {
                        funs[attr](that) || f.apply(xhr, arguments);
                    };
                } else {
                    xhr[attr] = f;
                }
            };
        }
        function hookfun(fun) {
            return function () {
                var args = [].slice.call(arguments);
                if (funs[fun] && funs[fun].call(this, args, this.xhr)) {
                    return;
                }
                return this.xhr[fun].apply(this.xhr, args);
            };
        }
        return window._ahrealxhr;
    }

    // 拦截fetch请求
    function _fetch() {
        if (!window.fetch) return;
        var _fetch = fetch;
        window.fetch = function () {
            var _arg = arguments;

            config.fetchMsg.push(_arg);
            config.totalFetlength = config.totalFetlength + 1;
            config.haveFetch = true;

            _fetch.apply(this, arguments).then(function (res) {
                res.text().then(function (res) {
                    config.fetchNum += 1;
                    if (config.totalFetlength === config.fetchNum) {
                        console.log('走了 fetch 方法');
                        config.fetchNum = config.totalFetlength = 0;
                        fetchTime = new Date().getTime() - beginTime;
                        getLargeTime();
                    }

                    console.log(res.length);
                });
            }).catch(function (err) {
                config.fetchNum += 1;
                if (config.totalFetlength === config.fetchNum) {
                    console.log('走了 fetch error 方法');
                    config.fetchNum = config.totalFetlength = 0;
                    fetchTime = new Date().getTime() - beginTime;
                    getLargeTime();
                }

                //error
                var defaults = Object.assign({}, errordefo);
                defaults.t = new Date().getTime();
                defaults.n = 'fetch';
                defaults.msg = 'fetch请求错误';
                defaults.method = 'GET';
                if (_arg && _arg.length > 1) {
                    defaults.method = _arg[1].method;
                }
                defaults.data = {
                    resourceUrl: _arg[0],
                    text: err.stack || err,
                    status: 0
                };
                config.errorList.push(defaults);
            });
            return _fetch.apply(this, arguments);
        };
    }

    // 拦截js error信息
    function _error() {
        // img,script,css,jsonp
        window.addEventListener('error', function (e) {
            var defaults = Object.assign({}, errordefo);
            defaults.n = 'resource';
            defaults.t = new Date().getTime();
            defaults.msg = e.target.localName + ' is load error';
            defaults.method = 'GET';
            defaults.data = {
                target: e.target.localName,
                type: e.type,
                resourceUrl: e.target.currentSrc
            };
            if (e.target != window) config.errorList.push(defaults);
        }, true);
        // js
        window.onerror = function (msg, _url, line, col, error) {
            var defaults = Object.assign({}, errordefo);
            setTimeout(function () {
                col = col || window.event && window.event.errorCharacter || 0;
                defaults.msg = error && error.stack ? error.stack.toString() : msg;
                defaults.method = 'GET';
                defaults.data = {
                    resourceUrl: _url,
                    line: line,
                    col: col
                };
                defaults.t = new Date().getTime();
                config.errorList.push(defaults);
            }, 0);
        };
    }

    // ajax统一上报入口
    function ajaxResponse(xhr, type) {
        var defaults = Object.assign({}, errordefo);
        defaults.t = new Date().getTime();
        defaults.n = 'ajax';
        defaults.msg = xhr.statusText || 'ajax请求错误';
        defaults.method = xhr.method;
        defaults.data = {
            resourceUrl: xhr.responseURL,
            text: xhr.statusText,
            status: xhr.status
        };
        config.errorList.push(defaults);
    }
})();