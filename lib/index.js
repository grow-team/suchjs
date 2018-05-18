var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Utils;
(function (Utils) {
    Utils.typeOf = function (target) {
        return Object.prototype.toString.call(target).slice(8, -1);
    };
    Utils.map = function (target, fn) {
        if (Array.isArray(target)) {
            return target.map(fn);
        }
        else if (Utils.typeOf(target) === 'Object') {
            var ret = {};
            target = target;
            for (var key in target) {
                ret[key] = fn(target[key], key);
            }
            return ret;
        }
        else if (Utils.typeOf(target) === 'String') {
            target = target;
            for (var i = 0, j = target.length; i < j; i++) {
                var code = target.charCodeAt(i);
                if (code >= 0xD800 && code <= 0xDBFF) {
                    var nextCode = target.charCodeAt(i + 1);
                    if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
                        fn(target.substr(i, 2), i);
                        i++;
                    }
                    else {
                        throw new Error('错误的字符编码');
                    }
                }
                else {
                    fn(target.charAt(i), i);
                }
            }
        }
    };
})(Utils || (Utils = {}));
var Mockit;
(function (Mockit) {
    var Mocker = (function () {
        function Mocker(meta) {
            this.isExp = false;
            this.meta = meta;
            if (typeof meta === 'string' && /^:([A-z]\w*).*$/.test(meta)) {
                this.isExp = true;
                this.type = RegExp.$1;
                this.options = this.parseOptions(meta);
            }
            else {
                this.options = this.getOptions(meta);
            }
        }
        Mocker.prototype.parseOptions = function (meta) {
            var exp = meta.substr(this.type.length);
            var isInParsing = false;
            var isParamBegin = true;
            var skipIndex = -Infinity;
            var showError = function (errmsg, index, char) {
                throw new Error(errmsg + "\uFF0C\u4F4D\u7F6E" + index + "<\u5B57\u7B26\uFF1A" + char + ">");
            };
            Utils.map(exp, function (char, index) {
                if (index === 0 && char === ':')
                    return;
                if (index <= skipIndex)
                    return;
                if (isParamBegin) {
                    if (!isInParsing) {
                        if (char === '' || char === '\t') {
                            return;
                        }
                        else {
                            isInParsing = true;
                            switch (char) {
                                case '{':
                                    break;
                                case '[':
                                case '(':
                                    break;
                                case '<':
                                    break;
                                case '#':
                                    var nextChar = exp.charAt(index + 1);
                                    if (nextChar === '[') {
                                        skipIndex = index + 1;
                                    }
                                    else {
                                        showError('无法解析的参数开始符，此处可能是"["', index + 1, nextChar);
                                    }
                                    break;
                                default:
                                    return showError('不能识别的参数开始符', index, char);
                            }
                        }
                    }
                    else {
                    }
                }
                else {
                    if (char === '' || char === '\t') {
                        return;
                    }
                    else {
                        if (char === ':') {
                            isParamBegin = true;
                        }
                        else {
                            return showError('缺少正确的参数分隔符', index, char);
                        }
                    }
                }
            });
            return;
        };
        Mocker.prototype.halt = function () {
        };
        return Mocker;
    }());
    Mockit.Mocker = Mocker;
})(Mockit || (Mockit = {}));
var Mockit;
(function (Mockit) {
    var ToNumber = (function (_super) {
        __extends(ToNumber, _super);
        function ToNumber(meta) {
            return _super.call(this, meta) || this;
        }
        ToNumber.prototype.parseOptions = function (meta) {
            return {
                format: '',
                min: 6,
                max: 9,
                containsMin: true,
                containsMax: true
            };
        };
        return ToNumber;
    }(Mockit.Mocker));
    Mockit.ToNumber = ToNumber;
})(Mockit || (Mockit = {}));
System.register("parser/count", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("default", {
                config: {
                    startTag: ['(', '['],
                    endTag: [')', ']']
                },
                parse: function () {
                }
            });
        }
    };
});
System.register("parser/length", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            exports_2("default", {
                config: {
                    startTag: ['{'],
                    endTag: ['}']
                },
                parse: function () {
                }
            });
        }
    };
});
System.register("parser/index", ["parser/count", "parser/length"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (count_1_1) {
                exports_3({
                    "Count": count_1_1["default"]
                });
            },
            function (length_1_1) {
                exports_3({
                    "Length": length_1_1["default"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("parser", ["parser/index"], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var Parsers, ParserInterface, Distributor, parser;
    return {
        setters: [
            function (Parsers_1) {
                Parsers = Parsers_1;
            }
        ],
        execute: function () {
            ParserInterface = (function () {
                function ParserInterface() {
                    this.init();
                }
                ParserInterface.prototype.init = function () {
                    this.params = [];
                    this.tags = {
                        start: '',
                        end: ''
                    };
                    this.isInTrans = false;
                    this.transIndexs = [];
                    this.isParseEnded = false;
                    this.codeIndex = 0;
                    this.startTagMatchedSeg = '';
                    this.startTagBegin = false;
                    this.startTagOk = false;
                    this.startTagLastIndex = 0;
                    this.matchedStartTagList = [];
                    var endTag = this.constructor.endTag;
                    this.hasEndTag = endTag.length === 0;
                    this.endTagOk = false;
                    this.matchedEndTagList = [];
                    this.endTagMatchedSeg = '';
                    this.paramIndex = 0;
                };
                ParserInterface.prototype.getTags = function () {
                    return this.tags;
                };
                ParserInterface.prototype.getParams = function () {
                    return this.params;
                };
                ParserInterface.prototype.showError = function (err) {
                    throw new Error(err);
                };
                ParserInterface.prototype.addCode = function (code) {
                    var _this = this;
                    if (this.isParseEnded) {
                        this.showError('标签已解析完成，不能添加新的解析字符');
                    }
                    if (typeof code === 'undefined') {
                        if (this.startTagOk && this.params.length && (this.hasEndTag ? this.endTagOk : true)) {
                            this.endTagOk = true;
                            this.isParseEnded = true;
                        }
                        else {
                            this.showError(!this.startTagOk ? '开始标签解析有误' : (this.params.length === 0 ? '没有找到对应的参数' : '结束标签解析有误'));
                        }
                    }
                    else {
                        var constr = this.constructor;
                        var startTag = constr.startTag, endTag = constr.endTag;
                        var cur_1 = code.trim();
                        this.parsedCode += code;
                        this.codeIndex += code.length;
                        if (!this.startTagOk) {
                            if (!this.startTagBegin) {
                                if (cur_1 === '') {
                                }
                                else {
                                    this.startTagBegin = true;
                                }
                            }
                            if (this.startTagBegin) {
                                var maybeTags = this.startTagMatchedSeg === '' ? startTag : this.matchedStartTagList;
                                var matched = maybeTags.filter(function (tag) {
                                    return tag.charAt(_this.startTagMatchedSeg.length) === cur_1;
                                });
                                if (matched.length) {
                                    if (matched.length === 1) {
                                        this.tags.start = matched[0];
                                        this.startTagOk = true;
                                    }
                                    else {
                                        this.matchedStartTagList = matched;
                                        this.startTagMatchedSeg += cur_1;
                                    }
                                }
                                else {
                                    this.showError('解析有误，开始标签不匹配');
                                }
                            }
                        }
                        if (this.startTagOk) {
                            if (!this.endTagOk) {
                                var needAddToParam = true;
                                if (!this.isInTrans) {
                                    if (cur_1 === ',') {
                                        needAddToParam = false;
                                        this.paramIndex++;
                                    }
                                    else if (cur_1 === ':') {
                                        needAddToParam = false;
                                        if (this.hasEndTag) {
                                            this.showError('结束标签不正确');
                                        }
                                        else {
                                            this.endTagOk = true;
                                            this.isParseEnded = true;
                                        }
                                    }
                                    else if (cur_1 === '\\') {
                                        this.isInTrans = true;
                                    }
                                    else {
                                        if (this.hasEndTag) {
                                            var hasMatchedSeg = this.endTagMatchedSeg !== '';
                                            var maybeTags = hasMatchedSeg ? this.matchedEndTagList : endTag;
                                            var nextCode_1 = this.endTagMatchedSeg + code;
                                            var matched = maybeTags.filter(function (tag) {
                                                return tag.indexOf(nextCode_1) === 0;
                                            });
                                            var totalMatched = matched.length;
                                            if (totalMatched) {
                                                if (totalMatched === 1) {
                                                    this.endTagOk = true;
                                                    this.tags.end = matched[0];
                                                }
                                                else {
                                                    this.matchedEndTagList = matched;
                                                    this.endTagMatchedSeg = nextCode_1;
                                                }
                                            }
                                            else {
                                                if (hasMatchedSeg) {
                                                    var findIndex = maybeTags.indexOf(this.endTagMatchedSeg);
                                                    if (findIndex > -1) {
                                                        if (cur_1 === '') {
                                                            this.endTagOk = true;
                                                            this.tags.end = maybeTags[findIndex];
                                                        }
                                                        else {
                                                            this.showError('错误的结束标签');
                                                        }
                                                    }
                                                    else {
                                                        this.matchedEndTagList = [];
                                                        this.endTagMatchedSeg = '';
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    this.isInTrans = false;
                                }
                                if (needAddToParam) {
                                    this.params[this.paramIndex] += code;
                                }
                            }
                            else {
                                if (cur_1 === '') {
                                }
                                else if (cur_1 === ':') {
                                    this.isParseEnded = true;
                                }
                                else {
                                    this.showError('解析有误，无法识别的结束标签');
                                }
                            }
                        }
                    }
                };
                ParserInterface.prototype.getParsedCode = function () {
                    return this.parsedCode;
                };
                return ParserInterface;
            }());
            Distributor = (function () {
                function Distributor() {
                }
                Distributor.prototype.addParser = function (name, config, parse) {
                    var startTag = config.startTag, endTag = config.endTag;
                    this.parsers[name] = (_a = (function (_super) {
                            __extends(class_1, _super);
                            function class_1() {
                                return _super !== null && _super.apply(this, arguments) || this;
                            }
                            class_1.prototype.parse = function () {
                                return parse.call(this);
                            };
                            return class_1;
                        }(ParserInterface)),
                        _a.startTag = startTag,
                        _a.endTag = endTag,
                        _a);
                    var _a;
                };
                return Distributor;
            }());
            parser = new Distributor;
            Utils.map(Parsers, function (item, key) {
                parser.addParser(key, item.config, item.parse);
            });
            exports_4("default", parser);
        }
    };
});
System.register("such", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var Such;
    return {
        setters: [],
        execute: function () {
            Such = (function () {
                function Such() {
                }
                Such.as = function (target, options) {
                    var type = Object.prototype.toString.call(target).slice(8, -1);
                };
                return Such;
            }());
            exports_5("default", Such);
        }
    };
});
//# sourceMappingURL=index.js.map