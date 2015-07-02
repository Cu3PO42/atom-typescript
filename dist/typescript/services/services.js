/// <reference path="..\compiler\program.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path='breakpoints.ts' />
/// <reference path='outliningElementsCollector.ts' />
/// <reference path='navigateTo.ts' />
/// <reference path='navigationBar.ts' />
/// <reference path='patternMatcher.ts' />
/// <reference path='signatureHelp.ts' />
/// <reference path='utilities.ts' />
/// <reference path='formatting\formatting.ts' />
/// <reference path='formatting\smartIndenter.ts' />
var ts;
(function (ts) {
    /** The version of the language service API */
    ts.servicesVersion = "0.4";
    var ScriptSnapshot;
    (function (ScriptSnapshot) {
        var StringScriptSnapshot = (function () {
            function StringScriptSnapshot(text) {
                this.text = text;
            }
            StringScriptSnapshot.prototype.getText = function (start, end) {
                return this.text.substring(start, end);
            };
            StringScriptSnapshot.prototype.getLength = function () {
                return this.text.length;
            };
            StringScriptSnapshot.prototype.getChangeRange = function (oldSnapshot) {
                // Text-based snapshots do not support incremental parsing. Return undefined
                // to signal that to the caller.
                return undefined;
            };
            return StringScriptSnapshot;
        })();
        function fromString(text) {
            return new StringScriptSnapshot(text);
        }
        ScriptSnapshot.fromString = fromString;
    })(ScriptSnapshot = ts.ScriptSnapshot || (ts.ScriptSnapshot = {}));
    var scanner = ts.createScanner(2 /* Latest */, true);
    var emptyArray = [];
    function createNode(kind, pos, end, flags, parent) {
        var node = new (ts.getNodeConstructor(kind))();
        node.pos = pos;
        node.end = end;
        node.flags = flags;
        node.parent = parent;
        return node;
    }
    var NodeObject = (function () {
        function NodeObject() {
        }
        NodeObject.prototype.getSourceFile = function () {
            return ts.getSourceFileOfNode(this);
        };
        NodeObject.prototype.getStart = function (sourceFile) {
            return ts.getTokenPosOfNode(this, sourceFile);
        };
        NodeObject.prototype.getFullStart = function () {
            return this.pos;
        };
        NodeObject.prototype.getEnd = function () {
            return this.end;
        };
        NodeObject.prototype.getWidth = function (sourceFile) {
            return this.getEnd() - this.getStart(sourceFile);
        };
        NodeObject.prototype.getFullWidth = function () {
            return this.end - this.pos;
        };
        NodeObject.prototype.getLeadingTriviaWidth = function (sourceFile) {
            return this.getStart(sourceFile) - this.pos;
        };
        NodeObject.prototype.getFullText = function (sourceFile) {
            return (sourceFile || this.getSourceFile()).text.substring(this.pos, this.end);
        };
        NodeObject.prototype.getText = function (sourceFile) {
            return (sourceFile || this.getSourceFile()).text.substring(this.getStart(), this.getEnd());
        };
        NodeObject.prototype.addSyntheticNodes = function (nodes, pos, end) {
            scanner.setTextPos(pos);
            while (pos < end) {
                var token = scanner.scan();
                var textPos = scanner.getTextPos();
                nodes.push(createNode(token, pos, textPos, 1024 /* Synthetic */, this));
                pos = textPos;
            }
            return pos;
        };
        NodeObject.prototype.createSyntaxList = function (nodes) {
            var list = createNode(266 /* SyntaxList */, nodes.pos, nodes.end, 1024 /* Synthetic */, this);
            list._children = [];
            var pos = nodes.pos;
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                if (pos < node.pos) {
                    pos = this.addSyntheticNodes(list._children, pos, node.pos);
                }
                list._children.push(node);
                pos = node.end;
            }
            if (pos < nodes.end) {
                this.addSyntheticNodes(list._children, pos, nodes.end);
            }
            return list;
        };
        NodeObject.prototype.createChildren = function (sourceFile) {
            var _this = this;
            var children;
            if (this.kind >= 131 /* FirstNode */) {
                scanner.setText((sourceFile || this.getSourceFile()).text);
                children = [];
                var pos = this.pos;
                var processNode = function (node) {
                    if (pos < node.pos) {
                        pos = _this.addSyntheticNodes(children, pos, node.pos);
                    }
                    children.push(node);
                    pos = node.end;
                };
                var processNodes = function (nodes) {
                    if (pos < nodes.pos) {
                        pos = _this.addSyntheticNodes(children, pos, nodes.pos);
                    }
                    children.push(_this.createSyntaxList(nodes));
                    pos = nodes.end;
                };
                ts.forEachChild(this, processNode, processNodes);
                if (pos < this.end) {
                    this.addSyntheticNodes(children, pos, this.end);
                }
                scanner.setText(undefined);
            }
            this._children = children || emptyArray;
        };
        NodeObject.prototype.getChildCount = function (sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children.length;
        };
        NodeObject.prototype.getChildAt = function (index, sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children[index];
        };
        NodeObject.prototype.getChildren = function (sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children;
        };
        NodeObject.prototype.getFirstToken = function (sourceFile) {
            var children = this.getChildren();
            for (var _i = 0; _i < children.length; _i++) {
                var child = children[_i];
                if (child.kind < 131 /* FirstNode */) {
                    return child;
                }
                return child.getFirstToken(sourceFile);
            }
        };
        NodeObject.prototype.getLastToken = function (sourceFile) {
            var children = this.getChildren(sourceFile);
            for (var i = children.length - 1; i >= 0; i--) {
                var child = children[i];
                if (child.kind < 131 /* FirstNode */) {
                    return child;
                }
                return child.getLastToken(sourceFile);
            }
        };
        return NodeObject;
    })();
    var SymbolObject = (function () {
        function SymbolObject(flags, name) {
            this.flags = flags;
            this.name = name;
        }
        SymbolObject.prototype.getFlags = function () {
            return this.flags;
        };
        SymbolObject.prototype.getName = function () {
            return this.name;
        };
        SymbolObject.prototype.getDeclarations = function () {
            return this.declarations;
        };
        SymbolObject.prototype.getDocumentationComment = function () {
            if (this.documentationComment === undefined) {
                this.documentationComment = getJsDocCommentsFromDeclarations(this.declarations, this.name, !(this.flags & 4 /* Property */));
            }
            return this.documentationComment;
        };
        return SymbolObject;
    })();
    function getJsDocCommentsFromDeclarations(declarations, name, canUseParsedParamTagComments) {
        var documentationComment = [];
        var docComments = getJsDocCommentsSeparatedByNewLines();
        ts.forEach(docComments, function (docComment) {
            if (documentationComment.length) {
                documentationComment.push(ts.lineBreakPart());
            }
            documentationComment.push(docComment);
        });
        return documentationComment;
        function getJsDocCommentsSeparatedByNewLines() {
            var paramTag = "@param";
            var jsDocCommentParts = [];
            ts.forEach(declarations, function (declaration, indexOfDeclaration) {
                // Make sure we are collecting doc comment from declaration once,
                // In case of union property there might be same declaration multiple times 
                // which only varies in type parameter
                // Eg. let a: Array<string> | Array<number>; a.length
                // The property length will have two declarations of property length coming 
                // from Array<T> - Array<string> and Array<number>
                if (ts.indexOf(declarations, declaration) === indexOfDeclaration) {
                    var sourceFileOfDeclaration = ts.getSourceFileOfNode(declaration);
                    // If it is parameter - try and get the jsDoc comment with @param tag from function declaration's jsDoc comments
                    if (canUseParsedParamTagComments && declaration.kind === 134 /* Parameter */) {
                        ts.forEach(getJsDocCommentTextRange(declaration.parent, sourceFileOfDeclaration), function (jsDocCommentTextRange) {
                            var cleanedParamJsDocComment = getCleanedParamJsDocComment(jsDocCommentTextRange.pos, jsDocCommentTextRange.end, sourceFileOfDeclaration);
                            if (cleanedParamJsDocComment) {
                                jsDocCommentParts.push.apply(jsDocCommentParts, cleanedParamJsDocComment);
                            }
                        });
                    }
                    // If this is left side of dotted module declaration, there is no doc comments associated with this node
                    if (declaration.kind === 213 /* ModuleDeclaration */ && declaration.body.kind === 213 /* ModuleDeclaration */) {
                        return;
                    }
                    // If this is dotted module name, get the doc comments from the parent
                    while (declaration.kind === 213 /* ModuleDeclaration */ && declaration.parent.kind === 213 /* ModuleDeclaration */) {
                        declaration = declaration.parent;
                    }
                    // Get the cleaned js doc comment text from the declaration
                    ts.forEach(getJsDocCommentTextRange(declaration.kind === 206 /* VariableDeclaration */ ? declaration.parent.parent : declaration, sourceFileOfDeclaration), function (jsDocCommentTextRange) {
                        var cleanedJsDocComment = getCleanedJsDocComment(jsDocCommentTextRange.pos, jsDocCommentTextRange.end, sourceFileOfDeclaration);
                        if (cleanedJsDocComment) {
                            jsDocCommentParts.push.apply(jsDocCommentParts, cleanedJsDocComment);
                        }
                    });
                }
            });
            return jsDocCommentParts;
            function getJsDocCommentTextRange(node, sourceFile) {
                return ts.map(ts.getJsDocComments(node, sourceFile), function (jsDocComment) {
                    return {
                        pos: jsDocComment.pos + "/*".length,
                        end: jsDocComment.end - "*/".length // Trim off comment end indicator 
                    };
                });
            }
            function consumeWhiteSpacesOnTheLine(pos, end, sourceFile, maxSpacesToRemove) {
                if (maxSpacesToRemove !== undefined) {
                    end = Math.min(end, pos + maxSpacesToRemove);
                }
                for (; pos < end; pos++) {
                    var ch = sourceFile.text.charCodeAt(pos);
                    if (!ts.isWhiteSpace(ch) || ts.isLineBreak(ch)) {
                        // Either found lineBreak or non whiteSpace
                        return pos;
                    }
                }
                return end;
            }
            function consumeLineBreaks(pos, end, sourceFile) {
                while (pos < end && ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                    pos++;
                }
                return pos;
            }
            function isName(pos, end, sourceFile, name) {
                return pos + name.length < end &&
                    sourceFile.text.substr(pos, name.length) === name &&
                    (ts.isWhiteSpace(sourceFile.text.charCodeAt(pos + name.length)) ||
                        ts.isLineBreak(sourceFile.text.charCodeAt(pos + name.length)));
            }
            function isParamTag(pos, end, sourceFile) {
                // If it is @param tag
                return isName(pos, end, sourceFile, paramTag);
            }
            function pushDocCommentLineText(docComments, text, blankLineCount) {
                // Add the empty lines in between texts
                while (blankLineCount--) {
                    docComments.push(ts.textPart(""));
                }
                docComments.push(ts.textPart(text));
            }
            function getCleanedJsDocComment(pos, end, sourceFile) {
                var spacesToRemoveAfterAsterisk;
                var docComments = [];
                var blankLineCount = 0;
                var isInParamTag = false;
                while (pos < end) {
                    var docCommentTextOfLine = "";
                    // First consume leading white space
                    pos = consumeWhiteSpacesOnTheLine(pos, end, sourceFile);
                    // If the comment starts with '*' consume the spaces on this line
                    if (pos < end && sourceFile.text.charCodeAt(pos) === 42 /* asterisk */) {
                        var lineStartPos = pos + 1;
                        pos = consumeWhiteSpacesOnTheLine(pos + 1, end, sourceFile, spacesToRemoveAfterAsterisk);
                        // Set the spaces to remove after asterisk as margin if not already set
                        if (spacesToRemoveAfterAsterisk === undefined && pos < end && !ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                            spacesToRemoveAfterAsterisk = pos - lineStartPos;
                        }
                    }
                    else if (spacesToRemoveAfterAsterisk === undefined) {
                        spacesToRemoveAfterAsterisk = 0;
                    }
                    // Analyse text on this line
                    while (pos < end && !ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                        var ch = sourceFile.text.charAt(pos);
                        if (ch === "@") {
                            // If it is @param tag
                            if (isParamTag(pos, end, sourceFile)) {
                                isInParamTag = true;
                                pos += paramTag.length;
                                continue;
                            }
                            else {
                                isInParamTag = false;
                            }
                        }
                        // Add the ch to doc text if we arent in param tag
                        if (!isInParamTag) {
                            docCommentTextOfLine += ch;
                        }
                        // Scan next character
                        pos++;
                    }
                    // Continue with next line
                    pos = consumeLineBreaks(pos, end, sourceFile);
                    if (docCommentTextOfLine) {
                        pushDocCommentLineText(docComments, docCommentTextOfLine, blankLineCount);
                        blankLineCount = 0;
                    }
                    else if (!isInParamTag && docComments.length) {
                        // This is blank line when there is text already parsed
                        blankLineCount++;
                    }
                }
                return docComments;
            }
            function getCleanedParamJsDocComment(pos, end, sourceFile) {
                var paramHelpStringMargin;
                var paramDocComments = [];
                while (pos < end) {
                    if (isParamTag(pos, end, sourceFile)) {
                        var blankLineCount = 0;
                        var recordedParamTag = false;
                        // Consume leading spaces 
                        pos = consumeWhiteSpaces(pos + paramTag.length);
                        if (pos >= end) {
                            break;
                        }
                        // Ignore type expression
                        if (sourceFile.text.charCodeAt(pos) === 123 /* openBrace */) {
                            pos++;
                            for (var curlies = 1; pos < end; pos++) {
                                var charCode = sourceFile.text.charCodeAt(pos);
                                // { character means we need to find another } to match the found one
                                if (charCode === 123 /* openBrace */) {
                                    curlies++;
                                    continue;
                                }
                                // } char
                                if (charCode === 125 /* closeBrace */) {
                                    curlies--;
                                    if (curlies === 0) {
                                        // We do not have any more } to match the type expression is ignored completely
                                        pos++;
                                        break;
                                    }
                                    else {
                                        // there are more { to be matched with }
                                        continue;
                                    }
                                }
                                // Found start of another tag
                                if (charCode === 64 /* at */) {
                                    break;
                                }
                            }
                            // Consume white spaces
                            pos = consumeWhiteSpaces(pos);
                            if (pos >= end) {
                                break;
                            }
                        }
                        // Parameter name
                        if (isName(pos, end, sourceFile, name)) {
                            // Found the parameter we are looking for consume white spaces
                            pos = consumeWhiteSpaces(pos + name.length);
                            if (pos >= end) {
                                break;
                            }
                            var paramHelpString = "";
                            var firstLineParamHelpStringPos = pos;
                            while (pos < end) {
                                var ch = sourceFile.text.charCodeAt(pos);
                                // at line break, set this comment line text and go to next line 
                                if (ts.isLineBreak(ch)) {
                                    if (paramHelpString) {
                                        pushDocCommentLineText(paramDocComments, paramHelpString, blankLineCount);
                                        paramHelpString = "";
                                        blankLineCount = 0;
                                        recordedParamTag = true;
                                    }
                                    else if (recordedParamTag) {
                                        blankLineCount++;
                                    }
                                    // Get the pos after cleaning start of the line
                                    setPosForParamHelpStringOnNextLine(firstLineParamHelpStringPos);
                                    continue;
                                }
                                // Done scanning param help string - next tag found
                                if (ch === 64 /* at */) {
                                    break;
                                }
                                paramHelpString += sourceFile.text.charAt(pos);
                                // Go to next character
                                pos++;
                            }
                            // If there is param help text, add it top the doc comments
                            if (paramHelpString) {
                                pushDocCommentLineText(paramDocComments, paramHelpString, blankLineCount);
                            }
                            paramHelpStringMargin = undefined;
                        }
                        // If this is the start of another tag, continue with the loop in seach of param tag with symbol name
                        if (sourceFile.text.charCodeAt(pos) === 64 /* at */) {
                            continue;
                        }
                    }
                    // Next character
                    pos++;
                }
                return paramDocComments;
                function consumeWhiteSpaces(pos) {
                    while (pos < end && ts.isWhiteSpace(sourceFile.text.charCodeAt(pos))) {
                        pos++;
                    }
                    return pos;
                }
                function setPosForParamHelpStringOnNextLine(firstLineParamHelpStringPos) {
                    // Get the pos after consuming line breaks
                    pos = consumeLineBreaks(pos, end, sourceFile);
                    if (pos >= end) {
                        return;
                    }
                    if (paramHelpStringMargin === undefined) {
                        paramHelpStringMargin = sourceFile.getLineAndCharacterOfPosition(firstLineParamHelpStringPos).character;
                    }
                    // Now consume white spaces max 
                    var startOfLinePos = pos;
                    pos = consumeWhiteSpacesOnTheLine(pos, end, sourceFile, paramHelpStringMargin);
                    if (pos >= end) {
                        return;
                    }
                    var consumedSpaces = pos - startOfLinePos;
                    if (consumedSpaces < paramHelpStringMargin) {
                        var ch = sourceFile.text.charCodeAt(pos);
                        if (ch === 42 /* asterisk */) {
                            // Consume more spaces after asterisk
                            pos = consumeWhiteSpacesOnTheLine(pos + 1, end, sourceFile, paramHelpStringMargin - consumedSpaces - 1);
                        }
                    }
                }
            }
        }
    }
    var TypeObject = (function () {
        function TypeObject(checker, flags) {
            this.checker = checker;
            this.flags = flags;
        }
        TypeObject.prototype.getFlags = function () {
            return this.flags;
        };
        TypeObject.prototype.getSymbol = function () {
            return this.symbol;
        };
        TypeObject.prototype.getProperties = function () {
            return this.checker.getPropertiesOfType(this);
        };
        TypeObject.prototype.getProperty = function (propertyName) {
            return this.checker.getPropertyOfType(this, propertyName);
        };
        TypeObject.prototype.getApparentProperties = function () {
            return this.checker.getAugmentedPropertiesOfType(this);
        };
        TypeObject.prototype.getCallSignatures = function () {
            return this.checker.getSignaturesOfType(this, 0 /* Call */);
        };
        TypeObject.prototype.getConstructSignatures = function () {
            return this.checker.getSignaturesOfType(this, 1 /* Construct */);
        };
        TypeObject.prototype.getStringIndexType = function () {
            return this.checker.getIndexTypeOfType(this, 0 /* String */);
        };
        TypeObject.prototype.getNumberIndexType = function () {
            return this.checker.getIndexTypeOfType(this, 1 /* Number */);
        };
        return TypeObject;
    })();
    var SignatureObject = (function () {
        function SignatureObject(checker) {
            this.checker = checker;
        }
        SignatureObject.prototype.getDeclaration = function () {
            return this.declaration;
        };
        SignatureObject.prototype.getTypeParameters = function () {
            return this.typeParameters;
        };
        SignatureObject.prototype.getParameters = function () {
            return this.parameters;
        };
        SignatureObject.prototype.getReturnType = function () {
            return this.checker.getReturnTypeOfSignature(this);
        };
        SignatureObject.prototype.getDocumentationComment = function () {
            if (this.documentationComment === undefined) {
                this.documentationComment = this.declaration ? getJsDocCommentsFromDeclarations([this.declaration], 
                /*name*/ undefined, 
                /*canUseParsedParamTagComments*/ false) : [];
            }
            return this.documentationComment;
        };
        return SignatureObject;
    })();
    var SourceFileObject = (function (_super) {
        __extends(SourceFileObject, _super);
        function SourceFileObject() {
            _super.apply(this, arguments);
        }
        SourceFileObject.prototype.update = function (newText, textChangeRange) {
            return ts.updateSourceFile(this, newText, textChangeRange);
        };
        SourceFileObject.prototype.getLineAndCharacterOfPosition = function (position) {
            return ts.getLineAndCharacterOfPosition(this, position);
        };
        SourceFileObject.prototype.getLineStarts = function () {
            return ts.getLineStarts(this);
        };
        SourceFileObject.prototype.getPositionOfLineAndCharacter = function (line, character) {
            return ts.getPositionOfLineAndCharacter(this, line, character);
        };
        SourceFileObject.prototype.getNamedDeclarations = function () {
            if (!this.namedDeclarations) {
                this.namedDeclarations = this.computeNamedDeclarations();
            }
            return this.namedDeclarations;
        };
        SourceFileObject.prototype.computeNamedDeclarations = function () {
            var result = {};
            ts.forEachChild(this, visit);
            return result;
            function addDeclaration(declaration) {
                var name = getDeclarationName(declaration);
                if (name) {
                    var declarations = getDeclarations(name);
                    declarations.push(declaration);
                }
            }
            function getDeclarations(name) {
                return ts.getProperty(result, name) || (result[name] = []);
            }
            function getDeclarationName(declaration) {
                if (declaration.name) {
                    var result_1 = getTextOfIdentifierOrLiteral(declaration.name);
                    if (result_1 !== undefined) {
                        return result_1;
                    }
                    if (declaration.name.kind === 132 /* ComputedPropertyName */) {
                        var expr = declaration.name.expression;
                        if (expr.kind === 161 /* PropertyAccessExpression */) {
                            return expr.name.text;
                        }
                        return getTextOfIdentifierOrLiteral(expr);
                    }
                }
                return undefined;
            }
            function getTextOfIdentifierOrLiteral(node) {
                if (node) {
                    if (node.kind === 66 /* Identifier */ ||
                        node.kind === 8 /* StringLiteral */ ||
                        node.kind === 7 /* NumericLiteral */) {
                        return node.text;
                    }
                }
                return undefined;
            }
            function visit(node) {
                switch (node.kind) {
                    case 208 /* FunctionDeclaration */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                        var functionDeclaration = node;
                        var declarationName = getDeclarationName(functionDeclaration);
                        if (declarationName) {
                            var declarations = getDeclarations(declarationName);
                            var lastDeclaration = ts.lastOrUndefined(declarations);
                            // Check whether this declaration belongs to an "overload group".
                            if (lastDeclaration && functionDeclaration.parent === lastDeclaration.parent && functionDeclaration.symbol === lastDeclaration.symbol) {
                                // Overwrite the last declaration if it was an overload
                                // and this one is an implementation.
                                if (functionDeclaration.body && !lastDeclaration.body) {
                                    declarations[declarations.length - 1] = functionDeclaration;
                                }
                            }
                            else {
                                declarations.push(functionDeclaration);
                            }
                            ts.forEachChild(node, visit);
                        }
                        break;
                    case 209 /* ClassDeclaration */:
                    case 210 /* InterfaceDeclaration */:
                    case 211 /* TypeAliasDeclaration */:
                    case 212 /* EnumDeclaration */:
                    case 213 /* ModuleDeclaration */:
                    case 216 /* ImportEqualsDeclaration */:
                    case 225 /* ExportSpecifier */:
                    case 221 /* ImportSpecifier */:
                    case 216 /* ImportEqualsDeclaration */:
                    case 218 /* ImportClause */:
                    case 219 /* NamespaceImport */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 151 /* TypeLiteral */:
                        addDeclaration(node);
                    // fall through
                    case 140 /* Constructor */:
                    case 188 /* VariableStatement */:
                    case 207 /* VariableDeclarationList */:
                    case 156 /* ObjectBindingPattern */:
                    case 157 /* ArrayBindingPattern */:
                    case 214 /* ModuleBlock */:
                        ts.forEachChild(node, visit);
                        break;
                    case 187 /* Block */:
                        if (ts.isFunctionBlock(node)) {
                            ts.forEachChild(node, visit);
                        }
                        break;
                    case 134 /* Parameter */:
                        // Only consider properties defined as constructor parameters
                        if (!(node.flags & 112 /* AccessibilityModifier */)) {
                            break;
                        }
                    // fall through
                    case 206 /* VariableDeclaration */:
                    case 158 /* BindingElement */:
                        if (ts.isBindingPattern(node.name)) {
                            ts.forEachChild(node.name, visit);
                            break;
                        }
                    case 242 /* EnumMember */:
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                        addDeclaration(node);
                        break;
                    case 223 /* ExportDeclaration */:
                        // Handle named exports case e.g.:
                        //    export {a, b as B} from "mod";
                        if (node.exportClause) {
                            ts.forEach(node.exportClause.elements, visit);
                        }
                        break;
                    case 217 /* ImportDeclaration */:
                        var importClause = node.importClause;
                        if (importClause) {
                            // Handle default import case e.g.:
                            //    import d from "mod";
                            if (importClause.name) {
                                addDeclaration(importClause);
                            }
                            // Handle named bindings in imports e.g.:
                            //    import * as NS from "mod";
                            //    import {a, b as B} from "mod";
                            if (importClause.namedBindings) {
                                if (importClause.namedBindings.kind === 219 /* NamespaceImport */) {
                                    addDeclaration(importClause.namedBindings);
                                }
                                else {
                                    ts.forEach(importClause.namedBindings.elements, visit);
                                }
                            }
                        }
                        break;
                }
            }
        };
        return SourceFileObject;
    })(NodeObject);
    var TextChange = (function () {
        function TextChange() {
        }
        return TextChange;
    })();
    ts.TextChange = TextChange;
    var HighlightSpanKind;
    (function (HighlightSpanKind) {
        HighlightSpanKind.none = "none";
        HighlightSpanKind.definition = "definition";
        HighlightSpanKind.reference = "reference";
        HighlightSpanKind.writtenReference = "writtenReference";
    })(HighlightSpanKind = ts.HighlightSpanKind || (ts.HighlightSpanKind = {}));
    (function (SymbolDisplayPartKind) {
        SymbolDisplayPartKind[SymbolDisplayPartKind["aliasName"] = 0] = "aliasName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["className"] = 1] = "className";
        SymbolDisplayPartKind[SymbolDisplayPartKind["enumName"] = 2] = "enumName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["fieldName"] = 3] = "fieldName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["interfaceName"] = 4] = "interfaceName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["keyword"] = 5] = "keyword";
        SymbolDisplayPartKind[SymbolDisplayPartKind["lineBreak"] = 6] = "lineBreak";
        SymbolDisplayPartKind[SymbolDisplayPartKind["numericLiteral"] = 7] = "numericLiteral";
        SymbolDisplayPartKind[SymbolDisplayPartKind["stringLiteral"] = 8] = "stringLiteral";
        SymbolDisplayPartKind[SymbolDisplayPartKind["localName"] = 9] = "localName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["methodName"] = 10] = "methodName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["moduleName"] = 11] = "moduleName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["operator"] = 12] = "operator";
        SymbolDisplayPartKind[SymbolDisplayPartKind["parameterName"] = 13] = "parameterName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["propertyName"] = 14] = "propertyName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["punctuation"] = 15] = "punctuation";
        SymbolDisplayPartKind[SymbolDisplayPartKind["space"] = 16] = "space";
        SymbolDisplayPartKind[SymbolDisplayPartKind["text"] = 17] = "text";
        SymbolDisplayPartKind[SymbolDisplayPartKind["typeParameterName"] = 18] = "typeParameterName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["enumMemberName"] = 19] = "enumMemberName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["functionName"] = 20] = "functionName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["regularExpressionLiteral"] = 21] = "regularExpressionLiteral";
    })(ts.SymbolDisplayPartKind || (ts.SymbolDisplayPartKind = {}));
    var SymbolDisplayPartKind = ts.SymbolDisplayPartKind;
    (function (TokenClass) {
        TokenClass[TokenClass["Punctuation"] = 0] = "Punctuation";
        TokenClass[TokenClass["Keyword"] = 1] = "Keyword";
        TokenClass[TokenClass["Operator"] = 2] = "Operator";
        TokenClass[TokenClass["Comment"] = 3] = "Comment";
        TokenClass[TokenClass["Whitespace"] = 4] = "Whitespace";
        TokenClass[TokenClass["Identifier"] = 5] = "Identifier";
        TokenClass[TokenClass["NumberLiteral"] = 6] = "NumberLiteral";
        TokenClass[TokenClass["StringLiteral"] = 7] = "StringLiteral";
        TokenClass[TokenClass["RegExpLiteral"] = 8] = "RegExpLiteral";
    })(ts.TokenClass || (ts.TokenClass = {}));
    var TokenClass = ts.TokenClass;
    // TODO: move these to enums
    var ScriptElementKind;
    (function (ScriptElementKind) {
        ScriptElementKind.unknown = "";
        ScriptElementKind.warning = "warning";
        // predefined type (void) or keyword (class)
        ScriptElementKind.keyword = "keyword";
        // top level script node
        ScriptElementKind.scriptElement = "script";
        // module foo {}
        ScriptElementKind.moduleElement = "module";
        // class X {}
        ScriptElementKind.classElement = "class";
        // interface Y {}
        ScriptElementKind.interfaceElement = "interface";
        // type T = ...
        ScriptElementKind.typeElement = "type";
        // enum E
        ScriptElementKind.enumElement = "enum";
        // Inside module and script only
        // let v = ..
        ScriptElementKind.variableElement = "var";
        // Inside function
        ScriptElementKind.localVariableElement = "local var";
        // Inside module and script only
        // function f() { }
        ScriptElementKind.functionElement = "function";
        // Inside function
        ScriptElementKind.localFunctionElement = "local function";
        // class X { [public|private]* foo() {} }
        ScriptElementKind.memberFunctionElement = "method";
        // class X { [public|private]* [get|set] foo:number; }
        ScriptElementKind.memberGetAccessorElement = "getter";
        ScriptElementKind.memberSetAccessorElement = "setter";
        // class X { [public|private]* foo:number; }
        // interface Y { foo:number; }
        ScriptElementKind.memberVariableElement = "property";
        // class X { constructor() { } }
        ScriptElementKind.constructorImplementationElement = "constructor";
        // interface Y { ():number; }
        ScriptElementKind.callSignatureElement = "call";
        // interface Y { []:number; }
        ScriptElementKind.indexSignatureElement = "index";
        // interface Y { new():Y; }
        ScriptElementKind.constructSignatureElement = "construct";
        // function foo(*Y*: string)
        ScriptElementKind.parameterElement = "parameter";
        ScriptElementKind.typeParameterElement = "type parameter";
        ScriptElementKind.primitiveType = "primitive type";
        ScriptElementKind.label = "label";
        ScriptElementKind.alias = "alias";
        ScriptElementKind.constElement = "const";
        ScriptElementKind.letElement = "let";
    })(ScriptElementKind = ts.ScriptElementKind || (ts.ScriptElementKind = {}));
    var ScriptElementKindModifier;
    (function (ScriptElementKindModifier) {
        ScriptElementKindModifier.none = "";
        ScriptElementKindModifier.publicMemberModifier = "public";
        ScriptElementKindModifier.privateMemberModifier = "private";
        ScriptElementKindModifier.protectedMemberModifier = "protected";
        ScriptElementKindModifier.exportedModifier = "export";
        ScriptElementKindModifier.ambientModifier = "declare";
        ScriptElementKindModifier.staticModifier = "static";
    })(ScriptElementKindModifier = ts.ScriptElementKindModifier || (ts.ScriptElementKindModifier = {}));
    var ClassificationTypeNames = (function () {
        function ClassificationTypeNames() {
        }
        ClassificationTypeNames.comment = "comment";
        ClassificationTypeNames.identifier = "identifier";
        ClassificationTypeNames.keyword = "keyword";
        ClassificationTypeNames.numericLiteral = "number";
        ClassificationTypeNames.operator = "operator";
        ClassificationTypeNames.stringLiteral = "string";
        ClassificationTypeNames.whiteSpace = "whitespace";
        ClassificationTypeNames.text = "text";
        ClassificationTypeNames.punctuation = "punctuation";
        ClassificationTypeNames.className = "class name";
        ClassificationTypeNames.enumName = "enum name";
        ClassificationTypeNames.interfaceName = "interface name";
        ClassificationTypeNames.moduleName = "module name";
        ClassificationTypeNames.typeParameterName = "type parameter name";
        ClassificationTypeNames.typeAliasName = "type alias name";
        ClassificationTypeNames.parameterName = "parameter name";
        ClassificationTypeNames.docCommentTagName = "doc comment tag name";
        return ClassificationTypeNames;
    })();
    ts.ClassificationTypeNames = ClassificationTypeNames;
    function displayPartsToString(displayParts) {
        if (displayParts) {
            return ts.map(displayParts, function (displayPart) { return displayPart.text; }).join("");
        }
        return "";
    }
    ts.displayPartsToString = displayPartsToString;
    function isLocalVariableOrFunction(symbol) {
        if (symbol.parent) {
            return false; // This is exported symbol
        }
        return ts.forEach(symbol.declarations, function (declaration) {
            // Function expressions are local
            if (declaration.kind === 168 /* FunctionExpression */) {
                return true;
            }
            if (declaration.kind !== 206 /* VariableDeclaration */ && declaration.kind !== 208 /* FunctionDeclaration */) {
                return false;
            }
            // If the parent is not sourceFile or module block it is local variable
            for (var parent_1 = declaration.parent; !ts.isFunctionBlock(parent_1); parent_1 = parent_1.parent) {
                // Reached source file or module block
                if (parent_1.kind === 243 /* SourceFile */ || parent_1.kind === 214 /* ModuleBlock */) {
                    return false;
                }
            }
            // parent is in function block
            return true;
        });
    }
    function getDefaultCompilerOptions() {
        // Always default to "ScriptTarget.ES5" for the language service
        return {
            target: 1 /* ES5 */,
            module: 0 /* None */,
            jsx: 1 /* Preserve */
        };
    }
    ts.getDefaultCompilerOptions = getDefaultCompilerOptions;
    var OperationCanceledException = (function () {
        function OperationCanceledException() {
        }
        return OperationCanceledException;
    })();
    ts.OperationCanceledException = OperationCanceledException;
    var CancellationTokenObject = (function () {
        function CancellationTokenObject(cancellationToken) {
            this.cancellationToken = cancellationToken;
        }
        CancellationTokenObject.prototype.isCancellationRequested = function () {
            return this.cancellationToken && this.cancellationToken.isCancellationRequested();
        };
        CancellationTokenObject.prototype.throwIfCancellationRequested = function () {
            if (this.isCancellationRequested()) {
                throw new OperationCanceledException();
            }
        };
        CancellationTokenObject.None = new CancellationTokenObject(null);
        return CancellationTokenObject;
    })();
    ts.CancellationTokenObject = CancellationTokenObject;
    // Cache host information about scrip Should be refreshed 
    // at each language service public entry point, since we don't know when 
    // set of scripts handled by the host changes.
    var HostCache = (function () {
        function HostCache(host, getCanonicalFileName) {
            this.host = host;
            // script id => script index
            this.fileNameToEntry = ts.createFileMap(getCanonicalFileName);
            // Initialize the list with the root file names
            var rootFileNames = host.getScriptFileNames();
            for (var _i = 0; _i < rootFileNames.length; _i++) {
                var fileName = rootFileNames[_i];
                this.createEntry(fileName);
            }
            // store the compilation settings
            this._compilationSettings = host.getCompilationSettings() || getDefaultCompilerOptions();
        }
        HostCache.prototype.compilationSettings = function () {
            return this._compilationSettings;
        };
        HostCache.prototype.createEntry = function (fileName) {
            var entry;
            var scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (scriptSnapshot) {
                entry = {
                    hostFileName: fileName,
                    version: this.host.getScriptVersion(fileName),
                    scriptSnapshot: scriptSnapshot
                };
            }
            this.fileNameToEntry.set(fileName, entry);
            return entry;
        };
        HostCache.prototype.getEntry = function (fileName) {
            return this.fileNameToEntry.get(fileName);
        };
        HostCache.prototype.contains = function (fileName) {
            return this.fileNameToEntry.contains(fileName);
        };
        HostCache.prototype.getOrCreateEntry = function (fileName) {
            if (this.contains(fileName)) {
                return this.getEntry(fileName);
            }
            return this.createEntry(fileName);
        };
        HostCache.prototype.getRootFileNames = function () {
            var fileNames = [];
            this.fileNameToEntry.forEachValue(function (value) {
                if (value) {
                    fileNames.push(value.hostFileName);
                }
            });
            return fileNames;
        };
        HostCache.prototype.getVersion = function (fileName) {
            var file = this.getEntry(fileName);
            return file && file.version;
        };
        HostCache.prototype.getScriptSnapshot = function (fileName) {
            var file = this.getEntry(fileName);
            return file && file.scriptSnapshot;
        };
        return HostCache;
    })();
    var SyntaxTreeCache = (function () {
        function SyntaxTreeCache(host) {
            this.host = host;
        }
        SyntaxTreeCache.prototype.getCurrentSourceFile = function (fileName) {
            var scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (!scriptSnapshot) {
                // The host does not know about this file.
                throw new Error("Could not find file: '" + fileName + "'.");
            }
            var version = this.host.getScriptVersion(fileName);
            var sourceFile;
            if (this.currentFileName !== fileName) {
                // This is a new file, just parse it
                sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, 2 /* Latest */, version, true);
            }
            else if (this.currentFileVersion !== version) {
                // This is the same file, just a newer version. Incrementally parse the file.
                var editRange = scriptSnapshot.getChangeRange(this.currentFileScriptSnapshot);
                sourceFile = updateLanguageServiceSourceFile(this.currentSourceFile, scriptSnapshot, version, editRange);
            }
            if (sourceFile) {
                // All done, ensure state is up to date
                this.currentFileVersion = version;
                this.currentFileName = fileName;
                this.currentFileScriptSnapshot = scriptSnapshot;
                this.currentSourceFile = sourceFile;
            }
            return this.currentSourceFile;
        };
        return SyntaxTreeCache;
    })();
    function setSourceFileFields(sourceFile, scriptSnapshot, version) {
        sourceFile.version = version;
        sourceFile.scriptSnapshot = scriptSnapshot;
    }
    /*
     * This function will compile source text from 'input' argument using specified compiler options.
     * If not options are provided - it will use a set of default compiler options.
     * Extra compiler options that will unconditionally be used bu this function are:
     * - isolatedModules = true
     * - allowNonTsExtensions = true
     * - noLib = true
     * - noResolve = true
     */
    function transpile(input, compilerOptions, fileName, diagnostics, moduleName) {
        var options = compilerOptions ? ts.clone(compilerOptions) : getDefaultCompilerOptions();
        options.isolatedModules = true;
        // Filename can be non-ts file.
        options.allowNonTsExtensions = true;
        // We are not returning a sourceFile for lib file when asked by the program, 
        // so pass --noLib to avoid reporting a file not found error.
        options.noLib = true;
        // We are not doing a full typecheck, we are not resolving the whole context,
        // so pass --noResolve to avoid reporting missing file errors.
        options.noResolve = true;
        // Parse
        var inputFileName = fileName || "module.ts";
        var sourceFile = ts.createSourceFile(inputFileName, input, options.target);
        if (moduleName) {
            sourceFile.moduleName = moduleName;
        }
        var newLine = ts.getNewLineCharacter(options);
        // Output
        var outputText;
        // Create a compilerHost object to allow the compiler to read and write files
        var compilerHost = {
            getSourceFile: function (fileName, target) { return fileName === inputFileName ? sourceFile : undefined; },
            writeFile: function (name, text, writeByteOrderMark) {
                ts.Debug.assert(outputText === undefined, "Unexpected multiple outputs for the file: " + name);
                outputText = text;
            },
            getDefaultLibFileName: function () { return "lib.d.ts"; },
            useCaseSensitiveFileNames: function () { return false; },
            getCanonicalFileName: function (fileName) { return fileName; },
            getCurrentDirectory: function () { return ""; },
            getNewLine: function () { return newLine; }
        };
        var program = ts.createProgram([inputFileName], options, compilerHost);
        ts.addRange(diagnostics, program.getSyntacticDiagnostics(sourceFile));
        ts.addRange(diagnostics, program.getOptionsDiagnostics());
        // Emit
        program.emit();
        ts.Debug.assert(outputText !== undefined, "Output generation failed");
        return outputText;
    }
    ts.transpile = transpile;
    function createLanguageServiceSourceFile(fileName, scriptSnapshot, scriptTarget, version, setNodeParents) {
        var text = scriptSnapshot.getText(0, scriptSnapshot.getLength());
        var sourceFile = ts.createSourceFile(fileName, text, scriptTarget, setNodeParents);
        setSourceFileFields(sourceFile, scriptSnapshot, version);
        // after full parsing we can use table with interned strings as name table
        sourceFile.nameTable = sourceFile.identifiers;
        return sourceFile;
    }
    ts.createLanguageServiceSourceFile = createLanguageServiceSourceFile;
    ts.disableIncrementalParsing = false;
    function updateLanguageServiceSourceFile(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks) {
        // If we were given a text change range, and our version or open-ness changed, then 
        // incrementally parse this file.
        if (textChangeRange) {
            if (version !== sourceFile.version) {
                // Once incremental parsing is ready, then just call into this function.
                if (!ts.disableIncrementalParsing) {
                    var newText;
                    // grab the fragment from the beginning of the original text to the beginning of the span
                    var prefix = textChangeRange.span.start !== 0
                        ? sourceFile.text.substr(0, textChangeRange.span.start)
                        : "";
                    // grab the fragment from the end of the span till the end of the original text
                    var suffix = ts.textSpanEnd(textChangeRange.span) !== sourceFile.text.length
                        ? sourceFile.text.substr(ts.textSpanEnd(textChangeRange.span))
                        : "";
                    if (textChangeRange.newLength === 0) {
                        // edit was a deletion - just combine prefix and suffix
                        newText = prefix && suffix ? prefix + suffix : prefix || suffix;
                    }
                    else {
                        // it was actual edit, fetch the fragment of new text that correspond to new span
                        var changedText = scriptSnapshot.getText(textChangeRange.span.start, textChangeRange.span.start + textChangeRange.newLength);
                        // combine prefix, changed text and suffix
                        newText = prefix && suffix
                            ? prefix + changedText + suffix
                            : prefix
                                ? (prefix + changedText)
                                : (changedText + suffix);
                    }
                    var newSourceFile = ts.updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks);
                    setSourceFileFields(newSourceFile, scriptSnapshot, version);
                    // after incremental parsing nameTable might not be up-to-date
                    // drop it so it can be lazily recreated later
                    newSourceFile.nameTable = undefined;
                    return newSourceFile;
                }
            }
        }
        // Otherwise, just create a new source file.
        return createLanguageServiceSourceFile(sourceFile.fileName, scriptSnapshot, sourceFile.languageVersion, version, true);
    }
    ts.updateLanguageServiceSourceFile = updateLanguageServiceSourceFile;
    function createGetCanonicalFileName(useCaseSensitivefileNames) {
        return useCaseSensitivefileNames
            ? (function (fileName) { return fileName; })
            : (function (fileName) { return fileName.toLowerCase(); });
    }
    function createDocumentRegistry(useCaseSensitiveFileNames) {
        // Maps from compiler setting target (ES3, ES5, etc.) to all the cached documents we have
        // for those settings.
        var buckets = {};
        var getCanonicalFileName = createGetCanonicalFileName(!!useCaseSensitiveFileNames);
        function getKeyFromCompilationSettings(settings) {
            return "_" + settings.target; //  + "|" + settings.propagateEnumConstantoString()
        }
        function getBucketForCompilationSettings(settings, createIfMissing) {
            var key = getKeyFromCompilationSettings(settings);
            var bucket = ts.lookUp(buckets, key);
            if (!bucket && createIfMissing) {
                buckets[key] = bucket = ts.createFileMap(getCanonicalFileName);
            }
            return bucket;
        }
        function reportStats() {
            var bucketInfoArray = Object.keys(buckets).filter(function (name) { return name && name.charAt(0) === '_'; }).map(function (name) {
                var entries = ts.lookUp(buckets, name);
                var sourceFiles = [];
                for (var i in entries) {
                    var entry = entries.get(i);
                    sourceFiles.push({
                        name: i,
                        refCount: entry.languageServiceRefCount,
                        references: entry.owners.slice(0)
                    });
                }
                sourceFiles.sort(function (x, y) { return y.refCount - x.refCount; });
                return {
                    bucket: name,
                    sourceFiles: sourceFiles
                };
            });
            return JSON.stringify(bucketInfoArray, null, 2);
        }
        function acquireDocument(fileName, compilationSettings, scriptSnapshot, version) {
            return acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, true);
        }
        function updateDocument(fileName, compilationSettings, scriptSnapshot, version) {
            return acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, false);
        }
        function acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, acquiring) {
            var bucket = getBucketForCompilationSettings(compilationSettings, true);
            var entry = bucket.get(fileName);
            if (!entry) {
                ts.Debug.assert(acquiring, "How could we be trying to update a document that the registry doesn't have?");
                // Have never seen this file with these settings.  Create a new source file for it.
                var sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, compilationSettings.target, version, false);
                entry = {
                    sourceFile: sourceFile,
                    languageServiceRefCount: 0,
                    owners: []
                };
                bucket.set(fileName, entry);
            }
            else {
                // We have an entry for this file.  However, it may be for a different version of 
                // the script snapshot.  If so, update it appropriately.  Otherwise, we can just
                // return it as is.
                if (entry.sourceFile.version !== version) {
                    entry.sourceFile = updateLanguageServiceSourceFile(entry.sourceFile, scriptSnapshot, version, scriptSnapshot.getChangeRange(entry.sourceFile.scriptSnapshot));
                }
            }
            // If we're acquiring, then this is the first time this LS is asking for this document.
            // Increase our ref count so we know there's another LS using the document.  If we're
            // not acquiring, then that means the LS is 'updating' the file instead, and that means
            // it has already acquired the document previously.  As such, we do not need to increase
            // the ref count.
            if (acquiring) {
                entry.languageServiceRefCount++;
            }
            return entry.sourceFile;
        }
        function releaseDocument(fileName, compilationSettings) {
            var bucket = getBucketForCompilationSettings(compilationSettings, false);
            ts.Debug.assert(bucket !== undefined);
            var entry = bucket.get(fileName);
            entry.languageServiceRefCount--;
            ts.Debug.assert(entry.languageServiceRefCount >= 0);
            if (entry.languageServiceRefCount === 0) {
                bucket.remove(fileName);
            }
        }
        return {
            acquireDocument: acquireDocument,
            updateDocument: updateDocument,
            releaseDocument: releaseDocument,
            reportStats: reportStats
        };
    }
    ts.createDocumentRegistry = createDocumentRegistry;
    function preProcessFile(sourceText, readImportFiles) {
        if (readImportFiles === void 0) { readImportFiles = true; }
        var referencedFiles = [];
        var importedFiles = [];
        var isNoDefaultLib = false;
        function processTripleSlashDirectives() {
            var commentRanges = ts.getLeadingCommentRanges(sourceText, 0);
            ts.forEach(commentRanges, function (commentRange) {
                var comment = sourceText.substring(commentRange.pos, commentRange.end);
                var referencePathMatchResult = ts.getFileReferenceFromReferencePath(comment, commentRange);
                if (referencePathMatchResult) {
                    isNoDefaultLib = referencePathMatchResult.isNoDefaultLib;
                    var fileReference = referencePathMatchResult.fileReference;
                    if (fileReference) {
                        referencedFiles.push(fileReference);
                    }
                }
            });
        }
        function recordModuleName() {
            var importPath = scanner.getTokenValue();
            var pos = scanner.getTokenPos();
            importedFiles.push({
                fileName: importPath,
                pos: pos,
                end: pos + importPath.length
            });
        }
        function processImport() {
            scanner.setText(sourceText);
            var token = scanner.scan();
            // Look for:
            //    import "mod";
            //    import d from "mod"
            //    import {a as A } from "mod";
            //    import * as NS  from "mod"
            //    import d, {a, b as B} from "mod"
            //    import i = require("mod");
            //
            //    export * from "mod"
            //    export {a as b} from "mod"
            while (token !== 1 /* EndOfFileToken */) {
                if (token === 86 /* ImportKeyword */) {
                    token = scanner.scan();
                    if (token === 8 /* StringLiteral */) {
                        // import "mod";
                        recordModuleName();
                        continue;
                    }
                    else {
                        if (token === 66 /* Identifier */) {
                            token = scanner.scan();
                            if (token === 129 /* FromKeyword */) {
                                token = scanner.scan();
                                if (token === 8 /* StringLiteral */) {
                                    // import d from "mod";
                                    recordModuleName();
                                    continue;
                                }
                            }
                            else if (token === 54 /* EqualsToken */) {
                                token = scanner.scan();
                                if (token === 123 /* RequireKeyword */) {
                                    token = scanner.scan();
                                    if (token === 16 /* OpenParenToken */) {
                                        token = scanner.scan();
                                        if (token === 8 /* StringLiteral */) {
                                            //  import i = require("mod");
                                            recordModuleName();
                                            continue;
                                        }
                                    }
                                }
                            }
                            else if (token === 23 /* CommaToken */) {
                                // consume comma and keep going
                                token = scanner.scan();
                            }
                            else {
                                // unknown syntax
                                continue;
                            }
                        }
                        if (token === 14 /* OpenBraceToken */) {
                            token = scanner.scan();
                            // consume "{ a as B, c, d as D}" clauses
                            while (token !== 15 /* CloseBraceToken */) {
                                token = scanner.scan();
                            }
                            if (token === 15 /* CloseBraceToken */) {
                                token = scanner.scan();
                                if (token === 129 /* FromKeyword */) {
                                    token = scanner.scan();
                                    if (token === 8 /* StringLiteral */) {
                                        // import {a as A} from "mod";
                                        // import d, {a, b as B} from "mod"
                                        recordModuleName();
                                    }
                                }
                            }
                        }
                        else if (token === 36 /* AsteriskToken */) {
                            token = scanner.scan();
                            if (token === 112 /* AsKeyword */) {
                                token = scanner.scan();
                                if (token === 66 /* Identifier */) {
                                    token = scanner.scan();
                                    if (token === 129 /* FromKeyword */) {
                                        token = scanner.scan();
                                        if (token === 8 /* StringLiteral */) {
                                            // import * as NS from "mod"
                                            // import d, * as NS from "mod"
                                            recordModuleName();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (token === 79 /* ExportKeyword */) {
                    token = scanner.scan();
                    if (token === 14 /* OpenBraceToken */) {
                        token = scanner.scan();
                        // consume "{ a as B, c, d as D}" clauses
                        while (token !== 15 /* CloseBraceToken */) {
                            token = scanner.scan();
                        }
                        if (token === 15 /* CloseBraceToken */) {
                            token = scanner.scan();
                            if (token === 129 /* FromKeyword */) {
                                token = scanner.scan();
                                if (token === 8 /* StringLiteral */) {
                                    // export {a as A} from "mod";
                                    // export {a, b as B} from "mod"
                                    recordModuleName();
                                }
                            }
                        }
                    }
                    else if (token === 36 /* AsteriskToken */) {
                        token = scanner.scan();
                        if (token === 129 /* FromKeyword */) {
                            token = scanner.scan();
                            if (token === 8 /* StringLiteral */) {
                                // export * from "mod"
                                recordModuleName();
                            }
                        }
                    }
                }
                token = scanner.scan();
            }
            scanner.setText(undefined);
        }
        if (readImportFiles) {
            processImport();
        }
        processTripleSlashDirectives();
        return { referencedFiles: referencedFiles, importedFiles: importedFiles, isLibFile: isNoDefaultLib };
    }
    ts.preProcessFile = preProcessFile;
    /// Helpers
    function getTargetLabel(referenceNode, labelName) {
        while (referenceNode) {
            if (referenceNode.kind === 202 /* LabeledStatement */ && referenceNode.label.text === labelName) {
                return referenceNode.label;
            }
            referenceNode = referenceNode.parent;
        }
        return undefined;
    }
    function isJumpStatementTarget(node) {
        return node.kind === 66 /* Identifier */ &&
            (node.parent.kind === 198 /* BreakStatement */ || node.parent.kind === 197 /* ContinueStatement */) &&
            node.parent.label === node;
    }
    function isLabelOfLabeledStatement(node) {
        return node.kind === 66 /* Identifier */ &&
            node.parent.kind === 202 /* LabeledStatement */ &&
            node.parent.label === node;
    }
    /**
     * Whether or not a 'node' is preceded by a label of the given string.
     * Note: 'node' cannot be a SourceFile.
     */
    function isLabeledBy(node, labelName) {
        for (var owner = node.parent; owner.kind === 202 /* LabeledStatement */; owner = owner.parent) {
            if (owner.label.text === labelName) {
                return true;
            }
        }
        return false;
    }
    function isLabelName(node) {
        return isLabelOfLabeledStatement(node) || isJumpStatementTarget(node);
    }
    function isRightSideOfQualifiedName(node) {
        return node.parent.kind === 131 /* QualifiedName */ && node.parent.right === node;
    }
    function isRightSideOfPropertyAccess(node) {
        return node && node.parent && node.parent.kind === 161 /* PropertyAccessExpression */ && node.parent.name === node;
    }
    function isCallExpressionTarget(node) {
        if (isRightSideOfPropertyAccess(node)) {
            node = node.parent;
        }
        return node && node.parent && node.parent.kind === 163 /* CallExpression */ && node.parent.expression === node;
    }
    function isNewExpressionTarget(node) {
        if (isRightSideOfPropertyAccess(node)) {
            node = node.parent;
        }
        return node && node.parent && node.parent.kind === 164 /* NewExpression */ && node.parent.expression === node;
    }
    function isNameOfModuleDeclaration(node) {
        return node.parent.kind === 213 /* ModuleDeclaration */ && node.parent.name === node;
    }
    function isNameOfFunctionDeclaration(node) {
        return node.kind === 66 /* Identifier */ &&
            ts.isFunctionLike(node.parent) && node.parent.name === node;
    }
    /** Returns true if node is a name of an object literal property, e.g. "a" in x = { "a": 1 } */
    function isNameOfPropertyAssignment(node) {
        return (node.kind === 66 /* Identifier */ || node.kind === 8 /* StringLiteral */ || node.kind === 7 /* NumericLiteral */) &&
            (node.parent.kind === 240 /* PropertyAssignment */ || node.parent.kind === 241 /* ShorthandPropertyAssignment */) && node.parent.name === node;
    }
    function isLiteralNameOfPropertyDeclarationOrIndexAccess(node) {
        if (node.kind === 8 /* StringLiteral */ || node.kind === 7 /* NumericLiteral */) {
            switch (node.parent.kind) {
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                case 240 /* PropertyAssignment */:
                case 242 /* EnumMember */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 213 /* ModuleDeclaration */:
                    return node.parent.name === node;
                case 162 /* ElementAccessExpression */:
                    return node.parent.argumentExpression === node;
            }
        }
        return false;
    }
    function isNameOfExternalModuleImportOrDeclaration(node) {
        if (node.kind === 8 /* StringLiteral */) {
            return isNameOfModuleDeclaration(node) ||
                (ts.isExternalModuleImportEqualsDeclaration(node.parent.parent) && ts.getExternalModuleImportEqualsDeclarationExpression(node.parent.parent) === node);
        }
        return false;
    }
    /** Returns true if the position is within a comment */
    function isInsideComment(sourceFile, token, position) {
        // The position has to be: 1. in the leading trivia (before token.getStart()), and 2. within a comment
        return position <= token.getStart(sourceFile) &&
            (isInsideCommentRange(ts.getTrailingCommentRanges(sourceFile.text, token.getFullStart())) ||
                isInsideCommentRange(ts.getLeadingCommentRanges(sourceFile.text, token.getFullStart())));
        function isInsideCommentRange(comments) {
            return ts.forEach(comments, function (comment) {
                // either we are 1. completely inside the comment, or 2. at the end of the comment
                if (comment.pos < position && position < comment.end) {
                    return true;
                }
                else if (position === comment.end) {
                    var text = sourceFile.text;
                    var width = comment.end - comment.pos;
                    // is single line comment or just /*
                    if (width <= 2 || text.charCodeAt(comment.pos + 1) === 47 /* slash */) {
                        return true;
                    }
                    else {
                        // is unterminated multi-line comment
                        return !(text.charCodeAt(comment.end - 1) === 47 /* slash */ &&
                            text.charCodeAt(comment.end - 2) === 42 /* asterisk */);
                    }
                }
                return false;
            });
        }
    }
    // A cache of completion entries for keywords, these do not change between sessions
    var keywordCompletions = [];
    for (var i = 67 /* FirstKeyword */; i <= 130 /* LastKeyword */; i++) {
        keywordCompletions.push({
            name: ts.tokenToString(i),
            kind: ScriptElementKind.keyword,
            kindModifiers: ScriptElementKindModifier.none,
            sortText: "0"
        });
    }
    /* @internal */ function getContainerNode(node) {
        while (true) {
            node = node.parent;
            if (!node) {
                return undefined;
            }
            switch (node.kind) {
                case 243 /* SourceFile */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                case 208 /* FunctionDeclaration */:
                case 168 /* FunctionExpression */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 209 /* ClassDeclaration */:
                case 210 /* InterfaceDeclaration */:
                case 212 /* EnumDeclaration */:
                case 213 /* ModuleDeclaration */:
                    return node;
            }
        }
    }
    ts.getContainerNode = getContainerNode;
    /* @internal */ function getNodeKind(node) {
        switch (node.kind) {
            case 213 /* ModuleDeclaration */: return ScriptElementKind.moduleElement;
            case 209 /* ClassDeclaration */: return ScriptElementKind.classElement;
            case 210 /* InterfaceDeclaration */: return ScriptElementKind.interfaceElement;
            case 211 /* TypeAliasDeclaration */: return ScriptElementKind.typeElement;
            case 212 /* EnumDeclaration */: return ScriptElementKind.enumElement;
            case 206 /* VariableDeclaration */:
                return ts.isConst(node)
                    ? ScriptElementKind.constElement
                    : ts.isLet(node)
                        ? ScriptElementKind.letElement
                        : ScriptElementKind.variableElement;
            case 208 /* FunctionDeclaration */: return ScriptElementKind.functionElement;
            case 141 /* GetAccessor */: return ScriptElementKind.memberGetAccessorElement;
            case 142 /* SetAccessor */: return ScriptElementKind.memberSetAccessorElement;
            case 139 /* MethodDeclaration */:
            case 138 /* MethodSignature */:
                return ScriptElementKind.memberFunctionElement;
            case 137 /* PropertyDeclaration */:
            case 136 /* PropertySignature */:
                return ScriptElementKind.memberVariableElement;
            case 145 /* IndexSignature */: return ScriptElementKind.indexSignatureElement;
            case 144 /* ConstructSignature */: return ScriptElementKind.constructSignatureElement;
            case 143 /* CallSignature */: return ScriptElementKind.callSignatureElement;
            case 140 /* Constructor */: return ScriptElementKind.constructorImplementationElement;
            case 133 /* TypeParameter */: return ScriptElementKind.typeParameterElement;
            case 242 /* EnumMember */: return ScriptElementKind.variableElement;
            case 134 /* Parameter */: return (node.flags & 112 /* AccessibilityModifier */) ? ScriptElementKind.memberVariableElement : ScriptElementKind.parameterElement;
            case 216 /* ImportEqualsDeclaration */:
            case 221 /* ImportSpecifier */:
            case 218 /* ImportClause */:
            case 225 /* ExportSpecifier */:
            case 219 /* NamespaceImport */:
                return ScriptElementKind.alias;
        }
        return ScriptElementKind.unknown;
    }
    ts.getNodeKind = getNodeKind;
    function createLanguageService(host, documentRegistry) {
        if (documentRegistry === void 0) { documentRegistry = createDocumentRegistry(); }
        var syntaxTreeCache = new SyntaxTreeCache(host);
        var ruleProvider;
        var program;
        var lastProjectVersion;
        var useCaseSensitivefileNames = false;
        var cancellationToken = new CancellationTokenObject(host.getCancellationToken && host.getCancellationToken());
        // Check if the localized messages json is set, otherwise query the host for it
        if (!ts.localizedDiagnosticMessages && host.getLocalizedDiagnosticMessages) {
            ts.localizedDiagnosticMessages = host.getLocalizedDiagnosticMessages();
        }
        function log(message) {
            if (host.log) {
                host.log(message);
            }
        }
        var getCanonicalFileName = createGetCanonicalFileName(useCaseSensitivefileNames);
        function getValidSourceFile(fileName) {
            fileName = ts.normalizeSlashes(fileName);
            var sourceFile = program.getSourceFile(getCanonicalFileName(fileName));
            if (!sourceFile) {
                throw new Error("Could not find file: '" + fileName + "'.");
            }
            return sourceFile;
        }
        function getRuleProvider(options) {
            // Ensure rules are initialized and up to date wrt to formatting options
            if (!ruleProvider) {
                ruleProvider = new ts.formatting.RulesProvider();
            }
            ruleProvider.ensureUpToDate(options);
            return ruleProvider;
        }
        function synchronizeHostData() {
            // perform fast check if host supports it
            if (host.getProjectVersion) {
                var hostProjectVersion = host.getProjectVersion();
                if (hostProjectVersion) {
                    if (lastProjectVersion === hostProjectVersion) {
                        return;
                    }
                    lastProjectVersion = hostProjectVersion;
                }
            }
            // Get a fresh cache of the host information
            var hostCache = new HostCache(host, getCanonicalFileName);
            // If the program is already up-to-date, we can reuse it
            if (programUpToDate()) {
                return;
            }
            // IMPORTANT - It is critical from this moment onward that we do not check 
            // cancellation tokens.  We are about to mutate source files from a previous program
            // instance.  If we cancel midway through, we may end up in an inconsistent state where
            // the program points to old source files that have been invalidated because of 
            // incremental parsing.
            var oldSettings = program && program.getCompilerOptions();
            var newSettings = hostCache.compilationSettings();
            var changesInCompilationSettingsAffectSyntax = oldSettings && oldSettings.target !== newSettings.target;
            // Now create a new compiler
            var newProgram = ts.createProgram(hostCache.getRootFileNames(), newSettings, {
                getSourceFile: getOrCreateSourceFile,
                getCancellationToken: function () { return cancellationToken; },
                getCanonicalFileName: getCanonicalFileName,
                useCaseSensitiveFileNames: function () { return useCaseSensitivefileNames; },
                getNewLine: function () { return host.getNewLine ? host.getNewLine() : "\r\n"; },
                getDefaultLibFileName: function (options) { return host.getDefaultLibFileName(options); },
                writeFile: function (fileName, data, writeByteOrderMark) { },
                getCurrentDirectory: function () { return host.getCurrentDirectory(); }
            });
            // Release any files we have acquired in the old program but are 
            // not part of the new program.
            if (program) {
                var oldSourceFiles = program.getSourceFiles();
                for (var _i = 0; _i < oldSourceFiles.length; _i++) {
                    var oldSourceFile = oldSourceFiles[_i];
                    var fileName = oldSourceFile.fileName;
                    if (!newProgram.getSourceFile(fileName) || changesInCompilationSettingsAffectSyntax) {
                        documentRegistry.releaseDocument(fileName, oldSettings);
                    }
                }
            }
            // hostCache is captured in the closure for 'getOrCreateSourceFile' but it should not be used past this point.
            // It needs to be cleared to allow all collected snapshots to be released
            hostCache = undefined;
            program = newProgram;
            // Make sure all the nodes in the program are both bound, and have their parent 
            // pointers set property.
            program.getTypeChecker();
            return;
            function getOrCreateSourceFile(fileName) {
                ts.Debug.assert(hostCache !== undefined);
                // The program is asking for this file, check first if the host can locate it.
                // If the host can not locate the file, then it does not exist. return undefined
                // to the program to allow reporting of errors for missing files.
                var hostFileInformation = hostCache.getOrCreateEntry(fileName);
                if (!hostFileInformation) {
                    return undefined;
                }
                // Check if the language version has changed since we last created a program; if they are the same,
                // it is safe to reuse the souceFiles; if not, then the shape of the AST can change, and the oldSourceFile
                // can not be reused. we have to dump all syntax trees and create new ones.
                if (!changesInCompilationSettingsAffectSyntax) {
                    // Check if the old program had this file already
                    var oldSourceFile = program && program.getSourceFile(fileName);
                    if (oldSourceFile) {
                        // We already had a source file for this file name.  Go to the registry to 
                        // ensure that we get the right up to date version of it.  We need this to
                        // address the following 'race'.  Specifically, say we have the following:
                        //
                        //      LS1
                        //          \
                        //           DocumentRegistry
                        //          /
                        //      LS2
                        //
                        // Each LS has a reference to file 'foo.ts' at version 1.  LS2 then updates
                        // it's version of 'foo.ts' to version 2.  This will cause LS2 and the 
                        // DocumentRegistry to have version 2 of the document.  HOwever, LS1 will 
                        // have version 1.  And *importantly* this source file will be *corrupt*.
                        // The act of creating version 2 of the file irrevocably damages the version
                        // 1 file.
                        //
                        // So, later when we call into LS1, we need to make sure that it doesn't use
                        // it's source file any more, and instead defers to DocumentRegistry to get
                        // either version 1, version 2 (or some other version) depending on what the 
                        // host says should be used.
                        return documentRegistry.updateDocument(fileName, newSettings, hostFileInformation.scriptSnapshot, hostFileInformation.version);
                    }
                }
                // Could not find this file in the old program, create a new SourceFile for it.
                return documentRegistry.acquireDocument(fileName, newSettings, hostFileInformation.scriptSnapshot, hostFileInformation.version);
            }
            function sourceFileUpToDate(sourceFile) {
                return sourceFile && sourceFile.version === hostCache.getVersion(sourceFile.fileName);
            }
            function programUpToDate() {
                // If we haven't create a program yet, then it is not up-to-date
                if (!program) {
                    return false;
                }
                // If number of files in the program do not match, it is not up-to-date
                var rootFileNames = hostCache.getRootFileNames();
                if (program.getSourceFiles().length !== rootFileNames.length) {
                    return false;
                }
                // If any file is not up-to-date, then the whole program is not up-to-date
                for (var _i = 0; _i < rootFileNames.length; _i++) {
                    var fileName = rootFileNames[_i];
                    if (!sourceFileUpToDate(program.getSourceFile(fileName))) {
                        return false;
                    }
                }
                // If the compilation settings do no match, then the program is not up-to-date
                return ts.compareDataObjects(program.getCompilerOptions(), hostCache.compilationSettings());
            }
        }
        function getProgram() {
            synchronizeHostData();
            return program;
        }
        function cleanupSemanticCache() {
            // TODO: Should we jettison the program (or it's type checker) here?
        }
        function dispose() {
            if (program) {
                ts.forEach(program.getSourceFiles(), function (f) {
                    return documentRegistry.releaseDocument(f.fileName, program.getCompilerOptions());
                });
            }
        }
        /// Diagnostics
        function getSyntacticDiagnostics(fileName) {
            synchronizeHostData();
            return program.getSyntacticDiagnostics(getValidSourceFile(fileName));
        }
        /**
         * getSemanticDiagnostiscs return array of Diagnostics. If '-d' is not enabled, only report semantic errors
         * If '-d' enabled, report both semantic and emitter errors
         */
        function getSemanticDiagnostics(fileName) {
            synchronizeHostData();
            var targetSourceFile = getValidSourceFile(fileName);
            // For JavaScript files, we don't want to report the normal typescript semantic errors.
            // Instead, we just report errors for using TypeScript-only constructs from within a 
            // JavaScript file.
            if (ts.isJavaScript(fileName)) {
                return getJavaScriptSemanticDiagnostics(targetSourceFile);
            }
            // Only perform the action per file regardless of '-out' flag as LanguageServiceHost is expected to call this function per file.
            // Therefore only get diagnostics for given file.
            var semanticDiagnostics = program.getSemanticDiagnostics(targetSourceFile);
            if (!program.getCompilerOptions().declaration) {
                return semanticDiagnostics;
            }
            // If '-d' is enabled, check for emitter error. One example of emitter error is export class implements non-export interface
            var declarationDiagnostics = program.getDeclarationDiagnostics(targetSourceFile);
            return ts.concatenate(semanticDiagnostics, declarationDiagnostics);
        }
        function getJavaScriptSemanticDiagnostics(sourceFile) {
            var diagnostics = [];
            walk(sourceFile);
            return diagnostics;
            function walk(node) {
                if (!node) {
                    return false;
                }
                switch (node.kind) {
                    case 216 /* ImportEqualsDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.import_can_only_be_used_in_a_ts_file));
                        return true;
                    case 222 /* ExportAssignment */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.export_can_only_be_used_in_a_ts_file));
                        return true;
                    case 209 /* ClassDeclaration */:
                        var classDeclaration = node;
                        if (checkModifiers(classDeclaration.modifiers) ||
                            checkTypeParameters(classDeclaration.typeParameters)) {
                            return true;
                        }
                        break;
                    case 238 /* HeritageClause */:
                        var heritageClause = node;
                        if (heritageClause.token === 103 /* ImplementsKeyword */) {
                            diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.implements_clauses_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 210 /* InterfaceDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.interface_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 213 /* ModuleDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.module_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 211 /* TypeAliasDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.type_aliases_can_only_be_used_in_a_ts_file));
                        return true;
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 140 /* Constructor */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 168 /* FunctionExpression */:
                    case 208 /* FunctionDeclaration */:
                    case 169 /* ArrowFunction */:
                    case 208 /* FunctionDeclaration */:
                        var functionDeclaration = node;
                        if (checkModifiers(functionDeclaration.modifiers) ||
                            checkTypeParameters(functionDeclaration.typeParameters) ||
                            checkTypeAnnotation(functionDeclaration.type)) {
                            return true;
                        }
                        break;
                    case 188 /* VariableStatement */:
                        var variableStatement = node;
                        if (checkModifiers(variableStatement.modifiers)) {
                            return true;
                        }
                        break;
                    case 206 /* VariableDeclaration */:
                        var variableDeclaration = node;
                        if (checkTypeAnnotation(variableDeclaration.type)) {
                            return true;
                        }
                        break;
                    case 163 /* CallExpression */:
                    case 164 /* NewExpression */:
                        var expression = node;
                        if (expression.typeArguments && expression.typeArguments.length > 0) {
                            var start = expression.typeArguments.pos;
                            diagnostics.push(ts.createFileDiagnostic(sourceFile, start, expression.typeArguments.end - start, ts.Diagnostics.type_arguments_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 134 /* Parameter */:
                        var parameter = node;
                        if (parameter.modifiers) {
                            var start = parameter.modifiers.pos;
                            diagnostics.push(ts.createFileDiagnostic(sourceFile, start, parameter.modifiers.end - start, ts.Diagnostics.parameter_modifiers_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        if (parameter.questionToken) {
                            diagnostics.push(ts.createDiagnosticForNode(parameter.questionToken, ts.Diagnostics._0_can_only_be_used_in_a_ts_file, '?'));
                            return true;
                        }
                        if (parameter.type) {
                            diagnostics.push(ts.createDiagnosticForNode(parameter.type, ts.Diagnostics.types_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 137 /* PropertyDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.property_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 212 /* EnumDeclaration */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.enum_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 166 /* TypeAssertionExpression */:
                        var typeAssertionExpression = node;
                        diagnostics.push(ts.createDiagnosticForNode(typeAssertionExpression.type, ts.Diagnostics.type_assertion_expressions_can_only_be_used_in_a_ts_file));
                        return true;
                    case 135 /* Decorator */:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.decorators_can_only_be_used_in_a_ts_file));
                        return true;
                }
                return ts.forEachChild(node, walk);
            }
            function checkTypeParameters(typeParameters) {
                if (typeParameters) {
                    var start = typeParameters.pos;
                    diagnostics.push(ts.createFileDiagnostic(sourceFile, start, typeParameters.end - start, ts.Diagnostics.type_parameter_declarations_can_only_be_used_in_a_ts_file));
                    return true;
                }
                return false;
            }
            function checkTypeAnnotation(type) {
                if (type) {
                    diagnostics.push(ts.createDiagnosticForNode(type, ts.Diagnostics.types_can_only_be_used_in_a_ts_file));
                    return true;
                }
                return false;
            }
            function checkModifiers(modifiers) {
                if (modifiers) {
                    for (var _i = 0; _i < modifiers.length; _i++) {
                        var modifier = modifiers[_i];
                        switch (modifier.kind) {
                            case 109 /* PublicKeyword */:
                            case 107 /* PrivateKeyword */:
                            case 108 /* ProtectedKeyword */:
                            case 118 /* DeclareKeyword */:
                                diagnostics.push(ts.createDiagnosticForNode(modifier, ts.Diagnostics._0_can_only_be_used_in_a_ts_file, ts.tokenToString(modifier.kind)));
                                return true;
                            // These are all legal modifiers.
                            case 110 /* StaticKeyword */:
                            case 79 /* ExportKeyword */:
                            case 71 /* ConstKeyword */:
                            case 74 /* DefaultKeyword */:
                        }
                    }
                }
                return false;
            }
        }
        function getCompilerOptionsDiagnostics() {
            synchronizeHostData();
            return program.getOptionsDiagnostics().concat(program.getGlobalDiagnostics());
        }
        /// Completion
        function getCompletionEntryDisplayNameForSymbol(symbol, target, performCharacterChecks) {
            var displayName = symbol.getName();
            if (displayName) {
                // If this is the default export, get the name of the declaration if it exists
                if (displayName === "default") {
                    var localSymbol = ts.getLocalSymbolForExportDefault(symbol);
                    if (localSymbol && localSymbol.name) {
                        displayName = symbol.valueDeclaration.localSymbol.name;
                    }
                }
                var firstCharCode = displayName.charCodeAt(0);
                // First check of the displayName is not external module; if it is an external module, it is not valid entry
                if ((symbol.flags & 1536 /* Namespace */) && (firstCharCode === 39 /* singleQuote */ || firstCharCode === 34 /* doubleQuote */)) {
                    // If the symbol is external module, don't show it in the completion list
                    // (i.e declare module "http" { let x; } | // <= request completion here, "http" should not be there)
                    return undefined;
                }
            }
            return getCompletionEntryDisplayName(displayName, target, performCharacterChecks);
        }
        function getCompletionEntryDisplayName(displayName, target, performCharacterChecks) {
            if (!displayName) {
                return undefined;
            }
            var firstCharCode = displayName.charCodeAt(0);
            if (displayName.length >= 2 &&
                firstCharCode === displayName.charCodeAt(displayName.length - 1) &&
                (firstCharCode === 39 /* singleQuote */ || firstCharCode === 34 /* doubleQuote */)) {
                // If the user entered name for the symbol was quoted, removing the quotes is not enough, as the name could be an
                // invalid identifier name. We need to check if whatever was inside the quotes is actually a valid identifier name.
                displayName = displayName.substring(1, displayName.length - 1);
            }
            if (!displayName) {
                return undefined;
            }
            if (performCharacterChecks) {
                if (!ts.isIdentifierStart(displayName.charCodeAt(0), target)) {
                    return undefined;
                }
                for (var i = 1, n = displayName.length; i < n; i++) {
                    if (!ts.isIdentifierPart(displayName.charCodeAt(i), target)) {
                        return undefined;
                    }
                }
            }
            return ts.unescapeIdentifier(displayName);
        }
        function getCompletionData(fileName, position) {
            var typeChecker = program.getTypeChecker();
            var syntacticStart = new Date().getTime();
            var sourceFile = getValidSourceFile(fileName);
            var isJavaScriptFile = ts.isJavaScript(fileName);
            var start = new Date().getTime();
            var currentToken = ts.getTokenAtPosition(sourceFile, position);
            log("getCompletionData: Get current token: " + (new Date().getTime() - start));
            start = new Date().getTime();
            // Completion not allowed inside comments, bail out if this is the case
            var insideComment = isInsideComment(sourceFile, currentToken, position);
            log("getCompletionData: Is inside comment: " + (new Date().getTime() - start));
            if (insideComment) {
                log("Returning an empty list because completion was inside a comment.");
                return undefined;
            }
            start = new Date().getTime();
            var previousToken = ts.findPrecedingToken(position, sourceFile);
            log("getCompletionData: Get previous token 1: " + (new Date().getTime() - start));
            // The decision to provide completion depends on the contextToken, which is determined through the previousToken.
            // Note: 'previousToken' (and thus 'contextToken') can be undefined if we are the beginning of the file
            var contextToken = previousToken;
            // Check if the caret is at the end of an identifier; this is a partial identifier that we want to complete: e.g. a.toS|
            // Skip this partial identifier and adjust the contextToken to the token that precedes it.
            if (contextToken && position <= contextToken.end && ts.isWord(contextToken.kind)) {
                var start_1 = new Date().getTime();
                contextToken = ts.findPrecedingToken(contextToken.getFullStart(), sourceFile);
                log("getCompletionData: Get previous token 2: " + (new Date().getTime() - start_1));
            }
            // Check if this is a valid completion location
            if (contextToken && isCompletionListBlocker(contextToken)) {
                log("Returning an empty list because completion was requested in an invalid position.");
                return undefined;
            }
            var options = program.getCompilerOptions();
            var jsx = options.jsx !== 0 /* None */;
            var target = options.target;
            // Find the node where completion is requested on, in the case of a completion after 
            // a dot, it is the member access expression other wise, it is a request for all 
            // visible symbols in the scope, and the node is the current location.
            var node = currentToken;
            var isRightOfDot = false;
            var isRightOfOpenTag = false;
            var location = ts.getTouchingPropertyName(sourceFile, position);
            if (contextToken) {
                var kind = contextToken.kind;
                if (kind === 20 /* DotToken */ && contextToken.parent.kind === 161 /* PropertyAccessExpression */) {
                    node = contextToken.parent.expression;
                    isRightOfDot = true;
                }
                else if (kind === 20 /* DotToken */ && contextToken.parent.kind === 131 /* QualifiedName */) {
                    node = contextToken.parent.left;
                    isRightOfDot = true;
                }
                else if (kind === 24 /* LessThanToken */ && sourceFile.languageVariant === 1 /* JSX */) {
                    isRightOfOpenTag = true;
                    location = contextToken;
                }
            }
            var semanticStart = new Date().getTime();
            var isMemberCompletion;
            var isNewIdentifierLocation;
            var symbols = [];
            if (isRightOfDot) {
                getTypeScriptMemberSymbols();
            }
            else if (isRightOfOpenTag) {
                var tagSymbols = typeChecker.getJsxIntrinsicTagNames();
                if (tryGetGlobalSymbols()) {
                    symbols = tagSymbols.concat(symbols.filter(function (s) { return !!(s.flags & 107455 /* Value */); }));
                }
                else {
                    symbols = tagSymbols;
                }
                isMemberCompletion = true;
                isNewIdentifierLocation = false;
            }
            else {
                // For JavaScript or TypeScript, if we're not after a dot, then just try to get the
                // global symbols in scope.  These results should be valid for either language as
                // the set of symbols that can be referenced from this location.
                if (!tryGetGlobalSymbols()) {
                    return undefined;
                }
            }
            log("getCompletionData: Semantic work: " + (new Date().getTime() - semanticStart));
            return { symbols: symbols, isMemberCompletion: isMemberCompletion, isNewIdentifierLocation: isNewIdentifierLocation, location: location, isRightOfDot: (isRightOfDot || isRightOfOpenTag) };
            function getTypeScriptMemberSymbols() {
                // Right of dot member completion list
                isMemberCompletion = true;
                isNewIdentifierLocation = false;
                if (node.kind === 66 /* Identifier */ || node.kind === 131 /* QualifiedName */ || node.kind === 161 /* PropertyAccessExpression */) {
                    var symbol = typeChecker.getSymbolAtLocation(node);
                    // This is an alias, follow what it aliases
                    if (symbol && symbol.flags & 8388608 /* Alias */) {
                        symbol = typeChecker.getAliasedSymbol(symbol);
                    }
                    if (symbol && symbol.flags & 1952 /* HasExports */) {
                        // Extract module or enum members
                        var exportedSymbols = typeChecker.getExportsOfModule(symbol);
                        ts.forEach(exportedSymbols, function (symbol) {
                            if (typeChecker.isValidPropertyAccess((node.parent), symbol.name)) {
                                symbols.push(symbol);
                            }
                        });
                    }
                }
                var type = typeChecker.getTypeAtLocation(node);
                addTypeProperties(type);
            }
            function addTypeProperties(type) {
                if (type) {
                    // Filter private properties
                    for (var _i = 0, _a = type.getApparentProperties(); _i < _a.length; _i++) {
                        var symbol = _a[_i];
                        if (typeChecker.isValidPropertyAccess((node.parent), symbol.name)) {
                            symbols.push(symbol);
                        }
                    }
                    if (isJavaScriptFile && type.flags & 16384 /* Union */) {
                        // In javascript files, for union types, we don't just get the members that 
                        // the individual types have in common, we also include all the members that
                        // each individual type has.  This is because we're going to add all identifiers
                        // anyways.  So we might as well elevate the members that were at least part
                        // of the individual types to a higher status since we know what they are.
                        var unionType = type;
                        for (var _b = 0, _c = unionType.types; _b < _c.length; _b++) {
                            var elementType = _c[_b];
                            addTypeProperties(elementType);
                        }
                    }
                }
            }
            function tryGetGlobalSymbols() {
                var objectLikeContainer = tryGetObjectLikeCompletionContainer(contextToken);
                if (objectLikeContainer) {
                    // Object literal expression, look up possible property names from contextual type
                    isMemberCompletion = true;
                    isNewIdentifierLocation = true;
                    var typeForObject;
                    var existingMembers;
                    if (objectLikeContainer.kind === 160 /* ObjectLiteralExpression */) {
                        typeForObject = typeChecker.getContextualType(objectLikeContainer);
                        existingMembers = objectLikeContainer.properties;
                    }
                    else {
                        typeForObject = typeChecker.getTypeAtLocation(objectLikeContainer);
                        existingMembers = objectLikeContainer.elements;
                    }
                    if (!typeForObject) {
                        return false;
                    }
                    var typeMembers = typeChecker.getPropertiesOfType(typeForObject);
                    if (typeMembers && typeMembers.length > 0) {
                        // Add filtered items to the completion list
                        symbols = filterObjectMembersList(typeMembers, existingMembers);
                    }
                    return true;
                }
                else if (ts.getAncestor(contextToken, 218 /* ImportClause */)) {
                    // cursor is in import clause
                    // try to show exported member for imported module
                    isMemberCompletion = true;
                    isNewIdentifierLocation = true;
                    if (showCompletionsInImportsClause(contextToken)) {
                        var importDeclaration = ts.getAncestor(contextToken, 217 /* ImportDeclaration */);
                        ts.Debug.assert(importDeclaration !== undefined);
                        var exports;
                        if (importDeclaration.moduleSpecifier) {
                            var moduleSpecifierSymbol = typeChecker.getSymbolAtLocation(importDeclaration.moduleSpecifier);
                            if (moduleSpecifierSymbol) {
                                exports = typeChecker.getExportsOfModule(moduleSpecifierSymbol);
                            }
                        }
                        //let exports = typeInfoResolver.getExportsOfImportDeclaration(importDeclaration);
                        symbols = exports ? filterModuleExports(exports, importDeclaration) : emptyArray;
                    }
                    return true;
                }
                else if (ts.getAncestor(contextToken, 228 /* JsxElement */) || ts.getAncestor(contextToken, 229 /* JsxSelfClosingElement */)) {
                    // Go up until we hit either the element or expression
                    var jsxNode = contextToken;
                    while (jsxNode) {
                        if (jsxNode.kind === 235 /* JsxExpression */) {
                            // Defer to global completion if we're inside an {expression}
                            break;
                        }
                        else if (jsxNode.kind === 229 /* JsxSelfClosingElement */ || jsxNode.kind === 228 /* JsxElement */) {
                            var attrsType = void 0;
                            if (jsxNode.kind === 229 /* JsxSelfClosingElement */) {
                                // Cursor is inside a JSX self-closing element
                                attrsType = typeChecker.getJsxElementAttributesType(jsxNode);
                            }
                            else {
                                ts.Debug.assert(jsxNode.kind === 228 /* JsxElement */);
                                // Cursor is inside a JSX element
                                attrsType = typeChecker.getJsxElementAttributesType(jsxNode.openingElement);
                            }
                            symbols = typeChecker.getPropertiesOfType(attrsType);
                            isMemberCompletion = true;
                            return true;
                        }
                        jsxNode = jsxNode.parent;
                    }
                }
                // Get all entities in the current scope.
                isMemberCompletion = false;
                isNewIdentifierLocation = isNewIdentifierDefinitionLocation(contextToken);
                if (previousToken !== contextToken) {
                    ts.Debug.assert(!!previousToken, "Expected 'contextToken' to be defined when different from 'previousToken'.");
                }
                // We need to find the node that will give us an appropriate scope to begin
                // aggregating completion candidates. This is achieved in 'getScopeNode'
                // by finding the first node that encompasses a position, accounting for whether a node
                // is "complete" to decide whether a position belongs to the node.
                // 
                // However, at the end of an identifier, we are interested in the scope of the identifier
                // itself, but fall outside of the identifier. For instance:
                // 
                //      xyz => x$
                //
                // the cursor is outside of both the 'x' and the arrow function 'xyz => x',
                // so 'xyz' is not returned in our results.
                //
                // We define 'adjustedPosition' so that we may appropriately account for
                // being at the end of an identifier. The intention is that if requesting completion
                // at the end of an identifier, it should be effectively equivalent to requesting completion
                // anywhere inside/at the beginning of the identifier. So in the previous case, the
                // 'adjustedPosition' will work as if requesting completion in the following:
                //
                //      xyz => $x
                //
                // If previousToken !== contextToken, then
                //   - 'contextToken' was adjusted to the token prior to 'previousToken'
                //      because we were at the end of an identifier.
                //   - 'previousToken' is defined.
                var adjustedPosition = previousToken !== contextToken ?
                    previousToken.getStart() :
                    position;
                var scopeNode = getScopeNode(contextToken, adjustedPosition, sourceFile) || sourceFile;
                /// TODO filter meaning based on the current context
                var symbolMeanings = 793056 /* Type */ | 107455 /* Value */ | 1536 /* Namespace */ | 8388608 /* Alias */;
                symbols = typeChecker.getSymbolsInScope(scopeNode, symbolMeanings);
                return true;
            }
            /**
             * Finds the first node that "embraces" the position, so that one may
             * accurately aggregate locals from the closest containing scope.
             */
            function getScopeNode(initialToken, position, sourceFile) {
                var scope = initialToken;
                while (scope && !ts.positionBelongsToNode(scope, position, sourceFile)) {
                    scope = scope.parent;
                }
                return scope;
            }
            function isCompletionListBlocker(previousToken) {
                var start = new Date().getTime();
                var result = isInStringOrRegularExpressionOrTemplateLiteral(previousToken) ||
                    isIdentifierDefinitionLocation(previousToken) ||
                    isRightOfIllegalDot(previousToken);
                log("getCompletionsAtPosition: isCompletionListBlocker: " + (new Date().getTime() - start));
                return result;
            }
            function showCompletionsInImportsClause(node) {
                if (node) {
                    // import {| 
                    // import {a,|
                    if (node.kind === 14 /* OpenBraceToken */ || node.kind === 23 /* CommaToken */) {
                        return node.parent.kind === 220 /* NamedImports */;
                    }
                }
                return false;
            }
            function isNewIdentifierDefinitionLocation(previousToken) {
                if (previousToken) {
                    var containingNodeKind = previousToken.parent.kind;
                    switch (previousToken.kind) {
                        case 23 /* CommaToken */:
                            return containingNodeKind === 163 /* CallExpression */ // func( a, |
                                || containingNodeKind === 140 /* Constructor */ // constructor( a, |   public, protected, private keywords are allowed here, so show completion
                                || containingNodeKind === 164 /* NewExpression */ // new C(a, |
                                || containingNodeKind === 159 /* ArrayLiteralExpression */ // [a, |
                                || containingNodeKind === 176 /* BinaryExpression */ // let x = (a, |
                                || containingNodeKind === 148 /* FunctionType */; // var x: (s: string, list|
                        case 16 /* OpenParenToken */:
                            return containingNodeKind === 163 /* CallExpression */ // func( |
                                || containingNodeKind === 140 /* Constructor */ // constructor( |
                                || containingNodeKind === 164 /* NewExpression */ // new C(a|
                                || containingNodeKind === 167 /* ParenthesizedExpression */ // let x = (a|
                                || containingNodeKind === 155 /* ParenthesizedType */; // function F(pred: (a| this can become an arrow function, where 'a' is the argument
                        case 18 /* OpenBracketToken */:
                            return containingNodeKind === 159 /* ArrayLiteralExpression */; // [ |
                        case 121 /* ModuleKeyword */: // module |
                        case 122 /* NamespaceKeyword */:
                            return true;
                        case 20 /* DotToken */:
                            return containingNodeKind === 213 /* ModuleDeclaration */; // module A.|
                        case 14 /* OpenBraceToken */:
                            return containingNodeKind === 209 /* ClassDeclaration */; // class A{ |
                        case 54 /* EqualsToken */:
                            return containingNodeKind === 206 /* VariableDeclaration */ // let x = a|
                                || containingNodeKind === 176 /* BinaryExpression */; // x = a|
                        case 11 /* TemplateHead */:
                            return containingNodeKind === 178 /* TemplateExpression */; // `aa ${|
                        case 12 /* TemplateMiddle */:
                            return containingNodeKind === 185 /* TemplateSpan */; // `aa ${10} dd ${|
                        case 109 /* PublicKeyword */:
                        case 107 /* PrivateKeyword */:
                        case 108 /* ProtectedKeyword */:
                            return containingNodeKind === 137 /* PropertyDeclaration */; // class A{ public |
                    }
                    // Previous token may have been a keyword that was converted to an identifier.
                    switch (previousToken.getText()) {
                        case "public":
                        case "protected":
                        case "private":
                            return true;
                    }
                }
                return false;
            }
            function isInStringOrRegularExpressionOrTemplateLiteral(previousToken) {
                if (previousToken.kind === 8 /* StringLiteral */
                    || previousToken.kind === 9 /* RegularExpressionLiteral */
                    || ts.isTemplateLiteralKind(previousToken.kind)) {
                    var start_2 = previousToken.getStart();
                    var end = previousToken.getEnd();
                    // To be "in" one of these literals, the position has to be:
                    //   1. entirely within the token text.
                    //   2. at the end position of an unterminated token.
                    //   3. at the end of a regular expression (due to trailing flags like '/foo/g').
                    if (start_2 < position && position < end) {
                        return true;
                    }
                    if (position === end) {
                        return !!previousToken.isUnterminated ||
                            previousToken.kind === 9 /* RegularExpressionLiteral */;
                    }
                }
                return false;
            }
            /**
             * Returns the immediate owning object literal or binding pattern of a context token,
             * on the condition that one exists and that the context implies completion should be given.
             */
            function tryGetObjectLikeCompletionContainer(contextToken) {
                if (contextToken) {
                    switch (contextToken.kind) {
                        case 14 /* OpenBraceToken */: // let x = { |
                        case 23 /* CommaToken */:
                            var parent_2 = contextToken.parent;
                            if (parent_2 && (parent_2.kind === 160 /* ObjectLiteralExpression */ || parent_2.kind === 156 /* ObjectBindingPattern */)) {
                                return parent_2;
                            }
                            break;
                    }
                }
                return undefined;
            }
            function isFunction(kind) {
                switch (kind) {
                    case 168 /* FunctionExpression */:
                    case 169 /* ArrowFunction */:
                    case 208 /* FunctionDeclaration */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 143 /* CallSignature */:
                    case 144 /* ConstructSignature */:
                    case 145 /* IndexSignature */:
                        return true;
                }
                return false;
            }
            function isIdentifierDefinitionLocation(previousToken) {
                if (previousToken) {
                    var containingNodeKind = previousToken.parent.kind;
                    switch (previousToken.kind) {
                        case 23 /* CommaToken */:
                            return containingNodeKind === 206 /* VariableDeclaration */ ||
                                containingNodeKind === 207 /* VariableDeclarationList */ ||
                                containingNodeKind === 188 /* VariableStatement */ ||
                                containingNodeKind === 212 /* EnumDeclaration */ ||
                                isFunction(containingNodeKind) ||
                                containingNodeKind === 209 /* ClassDeclaration */ ||
                                containingNodeKind === 208 /* FunctionDeclaration */ ||
                                containingNodeKind === 210 /* InterfaceDeclaration */ ||
                                containingNodeKind === 157 /* ArrayBindingPattern */; // var [x, y|
                        case 20 /* DotToken */:
                            return containingNodeKind === 157 /* ArrayBindingPattern */; // var [.|
                        case 52 /* ColonToken */:
                            return containingNodeKind === 158 /* BindingElement */; // var {x :html|
                        case 18 /* OpenBracketToken */:
                            return containingNodeKind === 157 /* ArrayBindingPattern */; // var [x|
                        case 16 /* OpenParenToken */:
                            return containingNodeKind === 239 /* CatchClause */ ||
                                isFunction(containingNodeKind);
                        case 14 /* OpenBraceToken */:
                            return containingNodeKind === 212 /* EnumDeclaration */ ||
                                containingNodeKind === 210 /* InterfaceDeclaration */ ||
                                containingNodeKind === 151 /* TypeLiteral */; // let x : { |
                        case 22 /* SemicolonToken */:
                            return containingNodeKind === 136 /* PropertySignature */ &&
                                previousToken.parent && previousToken.parent.parent &&
                                (previousToken.parent.parent.kind === 210 /* InterfaceDeclaration */ ||
                                    previousToken.parent.parent.kind === 151 /* TypeLiteral */); // let x : { a; |
                        case 24 /* LessThanToken */:
                            return containingNodeKind === 209 /* ClassDeclaration */ ||
                                containingNodeKind === 208 /* FunctionDeclaration */ ||
                                containingNodeKind === 210 /* InterfaceDeclaration */ ||
                                isFunction(containingNodeKind);
                        case 110 /* StaticKeyword */:
                            return containingNodeKind === 137 /* PropertyDeclaration */;
                        case 21 /* DotDotDotToken */:
                            return containingNodeKind === 134 /* Parameter */ ||
                                containingNodeKind === 140 /* Constructor */ ||
                                (previousToken.parent && previousToken.parent.parent &&
                                    previousToken.parent.parent.kind === 157 /* ArrayBindingPattern */); // var [...z|
                        case 109 /* PublicKeyword */:
                        case 107 /* PrivateKeyword */:
                        case 108 /* ProtectedKeyword */:
                            return containingNodeKind === 134 /* Parameter */;
                        case 70 /* ClassKeyword */:
                        case 78 /* EnumKeyword */:
                        case 104 /* InterfaceKeyword */:
                        case 84 /* FunctionKeyword */:
                        case 99 /* VarKeyword */:
                        case 119 /* GetKeyword */:
                        case 125 /* SetKeyword */:
                        case 86 /* ImportKeyword */:
                        case 105 /* LetKeyword */:
                        case 71 /* ConstKeyword */:
                        case 111 /* YieldKeyword */:
                        case 128 /* TypeKeyword */:
                            return true;
                    }
                    // Previous token may have been a keyword that was converted to an identifier.
                    switch (previousToken.getText()) {
                        case "class":
                        case "interface":
                        case "enum":
                        case "function":
                        case "var":
                        case "static":
                        case "let":
                        case "const":
                        case "yield":
                            return true;
                    }
                }
                return false;
            }
            function isRightOfIllegalDot(previousToken) {
                if (previousToken && previousToken.kind === 7 /* NumericLiteral */) {
                    var text = previousToken.getFullText();
                    return text.charAt(text.length - 1) === ".";
                }
                return false;
            }
            function filterModuleExports(exports, importDeclaration) {
                var exisingImports = {};
                if (!importDeclaration.importClause) {
                    return exports;
                }
                if (importDeclaration.importClause.namedBindings &&
                    importDeclaration.importClause.namedBindings.kind === 220 /* NamedImports */) {
                    ts.forEach(importDeclaration.importClause.namedBindings.elements, function (el) {
                        var name = el.propertyName || el.name;
                        exisingImports[name.text] = true;
                    });
                }
                if (ts.isEmpty(exisingImports)) {
                    return exports;
                }
                return ts.filter(exports, function (e) { return !ts.lookUp(exisingImports, e.name); });
            }
            function filterObjectMembersList(contextualMemberSymbols, existingMembers) {
                if (!existingMembers || existingMembers.length === 0) {
                    return contextualMemberSymbols;
                }
                var existingMemberNames = {};
                for (var _i = 0; _i < existingMembers.length; _i++) {
                    var m = existingMembers[_i];
                    // Ignore omitted expressions for missing members
                    if (m.kind !== 240 /* PropertyAssignment */ &&
                        m.kind !== 241 /* ShorthandPropertyAssignment */ &&
                        m.kind !== 158 /* BindingElement */) {
                        continue;
                    }
                    // If this is the current item we are editing right now, do not filter it out
                    if (m.getStart() <= position && position <= m.getEnd()) {
                        continue;
                    }
                    var existingName = void 0;
                    if (m.kind === 158 /* BindingElement */ && m.propertyName) {
                        existingName = m.propertyName.text;
                    }
                    else {
                        // TODO(jfreeman): Account for computed property name
                        // NOTE: if one only performs this step when m.name is an identifier,
                        // things like '__proto__' are not filtered out.
                        existingName = m.name.text;
                    }
                    existingMemberNames[existingName] = true;
                }
                var filteredMembers = [];
                ts.forEach(contextualMemberSymbols, function (s) {
                    if (!existingMemberNames[s.name]) {
                        filteredMembers.push(s);
                    }
                });
                return filteredMembers;
            }
        }
        function getCompletionsAtPosition(fileName, position) {
            synchronizeHostData();
            var completionData = getCompletionData(fileName, position);
            if (!completionData) {
                return undefined;
            }
            var symbols = completionData.symbols, isMemberCompletion = completionData.isMemberCompletion, isNewIdentifierLocation = completionData.isNewIdentifierLocation, location = completionData.location, isRightOfDot = completionData.isRightOfDot;
            var entries;
            if (isRightOfDot && ts.isJavaScript(fileName)) {
                entries = getCompletionEntriesFromSymbols(symbols);
                ts.addRange(entries, getJavaScriptCompletionEntries());
            }
            else {
                if (!symbols || symbols.length === 0) {
                    return undefined;
                }
                entries = getCompletionEntriesFromSymbols(symbols);
            }
            // Add keywords if this is not a member completion list
            if (!isMemberCompletion) {
                ts.addRange(entries, keywordCompletions);
            }
            return { isMemberCompletion: isMemberCompletion, isNewIdentifierLocation: isNewIdentifierLocation, entries: entries };
            function getJavaScriptCompletionEntries() {
                var entries = [];
                var allNames = {};
                var target = program.getCompilerOptions().target;
                for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
                    var sourceFile = _a[_i];
                    var nameTable = getNameTable(sourceFile);
                    for (var name_1 in nameTable) {
                        if (!allNames[name_1]) {
                            allNames[name_1] = name_1;
                            var displayName = getCompletionEntryDisplayName(name_1, target, true);
                            if (displayName) {
                                var entry = {
                                    name: displayName,
                                    kind: ScriptElementKind.warning,
                                    kindModifiers: "",
                                    sortText: "1"
                                };
                                entries.push(entry);
                            }
                        }
                    }
                }
                return entries;
            }
            function createCompletionEntry(symbol, location) {
                // Try to get a valid display name for this symbol, if we could not find one, then ignore it. 
                // We would like to only show things that can be added after a dot, so for instance numeric properties can
                // not be accessed with a dot (a.1 <- invalid)
                var displayName = getCompletionEntryDisplayNameForSymbol(symbol, program.getCompilerOptions().target, true);
                if (!displayName) {
                    return undefined;
                }
                // TODO(drosen): Right now we just permit *all* semantic meanings when calling 
                // 'getSymbolKind' which is permissible given that it is backwards compatible; but 
                // really we should consider passing the meaning for the node so that we don't report
                // that a suggestion for a value is an interface.  We COULD also just do what 
                // 'getSymbolModifiers' does, which is to use the first declaration.
                // Use a 'sortText' of 0' so that all symbol completion entries come before any other
                // entries (like JavaScript identifier entries).
                return {
                    name: displayName,
                    kind: getSymbolKind(symbol, location),
                    kindModifiers: getSymbolModifiers(symbol),
                    sortText: "0"
                };
            }
            function getCompletionEntriesFromSymbols(symbols) {
                var start = new Date().getTime();
                var entries = [];
                if (symbols) {
                    var nameToSymbol = {};
                    for (var _i = 0; _i < symbols.length; _i++) {
                        var symbol = symbols[_i];
                        var entry = createCompletionEntry(symbol, location);
                        if (entry) {
                            var id = ts.escapeIdentifier(entry.name);
                            if (!ts.lookUp(nameToSymbol, id)) {
                                entries.push(entry);
                                nameToSymbol[id] = symbol;
                            }
                        }
                    }
                }
                log("getCompletionsAtPosition: getCompletionEntriesFromSymbols: " + (new Date().getTime() - start));
                return entries;
            }
        }
        function getCompletionEntryDetails(fileName, position, entryName) {
            synchronizeHostData();
            // Compute all the completion symbols again.
            var completionData = getCompletionData(fileName, position);
            if (completionData) {
                var symbols = completionData.symbols, location_1 = completionData.location;
                // Find the symbol with the matching entry name.
                var target = program.getCompilerOptions().target;
                // We don't need to perform character checks here because we're only comparing the 
                // name against 'entryName' (which is known to be good), not building a new 
                // completion entry.
                var symbol = ts.forEach(symbols, function (s) { return getCompletionEntryDisplayNameForSymbol(s, target, false) === entryName ? s : undefined; });
                if (symbol) {
                    var _a = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, getValidSourceFile(fileName), location_1, location_1, 7 /* All */), displayParts = _a.displayParts, documentation = _a.documentation, symbolKind = _a.symbolKind;
                    return {
                        name: entryName,
                        kindModifiers: getSymbolModifiers(symbol),
                        kind: symbolKind,
                        displayParts: displayParts,
                        documentation: documentation
                    };
                }
            }
            // Didn't find a symbol with this name.  See if we can find a keyword instead.
            var keywordCompletion = ts.forEach(keywordCompletions, function (c) { return c.name === entryName; });
            if (keywordCompletion) {
                return {
                    name: entryName,
                    kind: ScriptElementKind.keyword,
                    kindModifiers: ScriptElementKindModifier.none,
                    displayParts: [ts.displayPart(entryName, SymbolDisplayPartKind.keyword)],
                    documentation: undefined
                };
            }
            return undefined;
        }
        // TODO(drosen): use contextual SemanticMeaning.
        function getSymbolKind(symbol, location) {
            var flags = symbol.getFlags();
            if (flags & 32 /* Class */)
                return ScriptElementKind.classElement;
            if (flags & 384 /* Enum */)
                return ScriptElementKind.enumElement;
            if (flags & 524288 /* TypeAlias */)
                return ScriptElementKind.typeElement;
            if (flags & 64 /* Interface */)
                return ScriptElementKind.interfaceElement;
            if (flags & 262144 /* TypeParameter */)
                return ScriptElementKind.typeParameterElement;
            var result = getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, flags, location);
            if (result === ScriptElementKind.unknown) {
                if (flags & 262144 /* TypeParameter */)
                    return ScriptElementKind.typeParameterElement;
                if (flags & 8 /* EnumMember */)
                    return ScriptElementKind.variableElement;
                if (flags & 8388608 /* Alias */)
                    return ScriptElementKind.alias;
                if (flags & 1536 /* Module */)
                    return ScriptElementKind.moduleElement;
            }
            return result;
        }
        function getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, flags, location) {
            var typeChecker = program.getTypeChecker();
            if (typeChecker.isUndefinedSymbol(symbol)) {
                return ScriptElementKind.variableElement;
            }
            if (typeChecker.isArgumentsSymbol(symbol)) {
                return ScriptElementKind.localVariableElement;
            }
            if (flags & 3 /* Variable */) {
                if (ts.isFirstDeclarationOfSymbolParameter(symbol)) {
                    return ScriptElementKind.parameterElement;
                }
                else if (symbol.valueDeclaration && ts.isConst(symbol.valueDeclaration)) {
                    return ScriptElementKind.constElement;
                }
                else if (ts.forEach(symbol.declarations, ts.isLet)) {
                    return ScriptElementKind.letElement;
                }
                return isLocalVariableOrFunction(symbol) ? ScriptElementKind.localVariableElement : ScriptElementKind.variableElement;
            }
            if (flags & 16 /* Function */)
                return isLocalVariableOrFunction(symbol) ? ScriptElementKind.localFunctionElement : ScriptElementKind.functionElement;
            if (flags & 32768 /* GetAccessor */)
                return ScriptElementKind.memberGetAccessorElement;
            if (flags & 65536 /* SetAccessor */)
                return ScriptElementKind.memberSetAccessorElement;
            if (flags & 8192 /* Method */)
                return ScriptElementKind.memberFunctionElement;
            if (flags & 16384 /* Constructor */)
                return ScriptElementKind.constructorImplementationElement;
            if (flags & 4 /* Property */) {
                if (flags & 268435456 /* UnionProperty */) {
                    // If union property is result of union of non method (property/accessors/variables), it is labeled as property
                    var unionPropertyKind = ts.forEach(typeChecker.getRootSymbols(symbol), function (rootSymbol) {
                        var rootSymbolFlags = rootSymbol.getFlags();
                        if (rootSymbolFlags & (98308 /* PropertyOrAccessor */ | 3 /* Variable */)) {
                            return ScriptElementKind.memberVariableElement;
                        }
                        ts.Debug.assert(!!(rootSymbolFlags & 8192 /* Method */));
                    });
                    if (!unionPropertyKind) {
                        // If this was union of all methods, 
                        //make sure it has call signatures before we can label it as method
                        var typeOfUnionProperty = typeChecker.getTypeOfSymbolAtLocation(symbol, location);
                        if (typeOfUnionProperty.getCallSignatures().length) {
                            return ScriptElementKind.memberFunctionElement;
                        }
                        return ScriptElementKind.memberVariableElement;
                    }
                    return unionPropertyKind;
                }
                return ScriptElementKind.memberVariableElement;
            }
            return ScriptElementKind.unknown;
        }
        function getSymbolModifiers(symbol) {
            return symbol && symbol.declarations && symbol.declarations.length > 0
                ? ts.getNodeModifiers(symbol.declarations[0])
                : ScriptElementKindModifier.none;
        }
        // TODO(drosen): Currently completion entry details passes the SemanticMeaning.All instead of using semanticMeaning of location
        function getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, sourceFile, enclosingDeclaration, location, semanticMeaning) {
            if (semanticMeaning === void 0) { semanticMeaning = getMeaningFromLocation(location); }
            var typeChecker = program.getTypeChecker();
            var displayParts = [];
            var documentation;
            var symbolFlags = symbol.flags;
            var symbolKind = getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, symbolFlags, location);
            var hasAddedSymbolInfo;
            var type;
            // Class at constructor site need to be shown as constructor apart from property,method, vars
            if (symbolKind !== ScriptElementKind.unknown || symbolFlags & 32 /* Class */ || symbolFlags & 8388608 /* Alias */) {
                // If it is accessor they are allowed only if location is at name of the accessor
                if (symbolKind === ScriptElementKind.memberGetAccessorElement || symbolKind === ScriptElementKind.memberSetAccessorElement) {
                    symbolKind = ScriptElementKind.memberVariableElement;
                }
                var signature;
                type = typeChecker.getTypeOfSymbolAtLocation(symbol, location);
                if (type) {
                    if (location.parent && location.parent.kind === 161 /* PropertyAccessExpression */) {
                        var right = location.parent.name;
                        // Either the location is on the right of a property access, or on the left and the right is missing
                        if (right === location || (right && right.getFullWidth() === 0)) {
                            location = location.parent;
                        }
                    }
                    // try get the call/construct signature from the type if it matches
                    var callExpression;
                    if (location.kind === 163 /* CallExpression */ || location.kind === 164 /* NewExpression */) {
                        callExpression = location;
                    }
                    else if (isCallExpressionTarget(location) || isNewExpressionTarget(location)) {
                        callExpression = location.parent;
                    }
                    if (callExpression) {
                        var candidateSignatures = [];
                        signature = typeChecker.getResolvedSignature(callExpression, candidateSignatures);
                        if (!signature && candidateSignatures.length) {
                            // Use the first candidate:
                            signature = candidateSignatures[0];
                        }
                        var useConstructSignatures = callExpression.kind === 164 /* NewExpression */ || callExpression.expression.kind === 92 /* SuperKeyword */;
                        var allSignatures = useConstructSignatures ? type.getConstructSignatures() : type.getCallSignatures();
                        if (!ts.contains(allSignatures, signature.target || signature)) {
                            // Get the first signature if there 
                            signature = allSignatures.length ? allSignatures[0] : undefined;
                        }
                        if (signature) {
                            if (useConstructSignatures && (symbolFlags & 32 /* Class */)) {
                                // Constructor
                                symbolKind = ScriptElementKind.constructorImplementationElement;
                                addPrefixForAnyFunctionOrVar(type.symbol, symbolKind);
                            }
                            else if (symbolFlags & 8388608 /* Alias */) {
                                symbolKind = ScriptElementKind.alias;
                                pushTypePart(symbolKind);
                                displayParts.push(ts.spacePart());
                                if (useConstructSignatures) {
                                    displayParts.push(ts.keywordPart(89 /* NewKeyword */));
                                    displayParts.push(ts.spacePart());
                                }
                                addFullSymbolName(symbol);
                            }
                            else {
                                addPrefixForAnyFunctionOrVar(symbol, symbolKind);
                            }
                            switch (symbolKind) {
                                case ScriptElementKind.memberVariableElement:
                                case ScriptElementKind.variableElement:
                                case ScriptElementKind.constElement:
                                case ScriptElementKind.letElement:
                                case ScriptElementKind.parameterElement:
                                case ScriptElementKind.localVariableElement:
                                    // If it is call or construct signature of lambda's write type name
                                    displayParts.push(ts.punctuationPart(52 /* ColonToken */));
                                    displayParts.push(ts.spacePart());
                                    if (useConstructSignatures) {
                                        displayParts.push(ts.keywordPart(89 /* NewKeyword */));
                                        displayParts.push(ts.spacePart());
                                    }
                                    if (!(type.flags & 32768 /* Anonymous */)) {
                                        displayParts.push.apply(displayParts, ts.symbolToDisplayParts(typeChecker, type.symbol, enclosingDeclaration, undefined, 1 /* WriteTypeParametersOrArguments */));
                                    }
                                    addSignatureDisplayParts(signature, allSignatures, 8 /* WriteArrowStyleSignature */);
                                    break;
                                default:
                                    // Just signature
                                    addSignatureDisplayParts(signature, allSignatures);
                            }
                            hasAddedSymbolInfo = true;
                        }
                    }
                    else if ((isNameOfFunctionDeclaration(location) && !(symbol.flags & 98304 /* Accessor */)) ||
                        (location.kind === 117 /* ConstructorKeyword */ && location.parent.kind === 140 /* Constructor */)) {
                        // get the signature from the declaration and write it
                        var functionDeclaration = location.parent;
                        var allSignatures = functionDeclaration.kind === 140 /* Constructor */ ? type.getConstructSignatures() : type.getCallSignatures();
                        if (!typeChecker.isImplementationOfOverload(functionDeclaration)) {
                            signature = typeChecker.getSignatureFromDeclaration(functionDeclaration);
                        }
                        else {
                            signature = allSignatures[0];
                        }
                        if (functionDeclaration.kind === 140 /* Constructor */) {
                            // show (constructor) Type(...) signature
                            symbolKind = ScriptElementKind.constructorImplementationElement;
                            addPrefixForAnyFunctionOrVar(type.symbol, symbolKind);
                        }
                        else {
                            // (function/method) symbol(..signature)
                            addPrefixForAnyFunctionOrVar(functionDeclaration.kind === 143 /* CallSignature */ &&
                                !(type.symbol.flags & 2048 /* TypeLiteral */ || type.symbol.flags & 4096 /* ObjectLiteral */) ? type.symbol : symbol, symbolKind);
                        }
                        addSignatureDisplayParts(signature, allSignatures);
                        hasAddedSymbolInfo = true;
                    }
                }
            }
            if (symbolFlags & 32 /* Class */ && !hasAddedSymbolInfo) {
                displayParts.push(ts.keywordPart(70 /* ClassKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                writeTypeParametersOfSymbol(symbol, sourceFile);
            }
            if ((symbolFlags & 64 /* Interface */) && (semanticMeaning & 2 /* Type */)) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(104 /* InterfaceKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                writeTypeParametersOfSymbol(symbol, sourceFile);
            }
            if (symbolFlags & 524288 /* TypeAlias */) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(128 /* TypeKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                displayParts.push(ts.spacePart());
                displayParts.push(ts.operatorPart(54 /* EqualsToken */));
                displayParts.push(ts.spacePart());
                displayParts.push.apply(displayParts, ts.typeToDisplayParts(typeChecker, typeChecker.getDeclaredTypeOfSymbol(symbol), enclosingDeclaration));
            }
            if (symbolFlags & 384 /* Enum */) {
                addNewLineIfDisplayPartsExist();
                if (ts.forEach(symbol.declarations, ts.isConstEnumDeclaration)) {
                    displayParts.push(ts.keywordPart(71 /* ConstKeyword */));
                    displayParts.push(ts.spacePart());
                }
                displayParts.push(ts.keywordPart(78 /* EnumKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
            }
            if (symbolFlags & 1536 /* Module */) {
                addNewLineIfDisplayPartsExist();
                var declaration = ts.getDeclarationOfKind(symbol, 213 /* ModuleDeclaration */);
                var isNamespace = declaration && declaration.name && declaration.name.kind === 66 /* Identifier */;
                displayParts.push(ts.keywordPart(isNamespace ? 122 /* NamespaceKeyword */ : 121 /* ModuleKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
            }
            if ((symbolFlags & 262144 /* TypeParameter */) && (semanticMeaning & 2 /* Type */)) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.punctuationPart(16 /* OpenParenToken */));
                displayParts.push(ts.textPart("type parameter"));
                displayParts.push(ts.punctuationPart(17 /* CloseParenToken */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                displayParts.push(ts.spacePart());
                displayParts.push(ts.keywordPart(87 /* InKeyword */));
                displayParts.push(ts.spacePart());
                if (symbol.parent) {
                    // Class/Interface type parameter
                    addFullSymbolName(symbol.parent, enclosingDeclaration);
                    writeTypeParametersOfSymbol(symbol.parent, enclosingDeclaration);
                }
                else {
                    // Method/function type parameter
                    var signatureDeclaration = ts.getDeclarationOfKind(symbol, 133 /* TypeParameter */).parent;
                    var signature = typeChecker.getSignatureFromDeclaration(signatureDeclaration);
                    if (signatureDeclaration.kind === 144 /* ConstructSignature */) {
                        displayParts.push(ts.keywordPart(89 /* NewKeyword */));
                        displayParts.push(ts.spacePart());
                    }
                    else if (signatureDeclaration.kind !== 143 /* CallSignature */ && signatureDeclaration.name) {
                        addFullSymbolName(signatureDeclaration.symbol);
                    }
                    displayParts.push.apply(displayParts, ts.signatureToDisplayParts(typeChecker, signature, sourceFile, 32 /* WriteTypeArgumentsOfSignature */));
                }
            }
            if (symbolFlags & 8 /* EnumMember */) {
                addPrefixForAnyFunctionOrVar(symbol, "enum member");
                var declaration = symbol.declarations[0];
                if (declaration.kind === 242 /* EnumMember */) {
                    var constantValue = typeChecker.getConstantValue(declaration);
                    if (constantValue !== undefined) {
                        displayParts.push(ts.spacePart());
                        displayParts.push(ts.operatorPart(54 /* EqualsToken */));
                        displayParts.push(ts.spacePart());
                        displayParts.push(ts.displayPart(constantValue.toString(), SymbolDisplayPartKind.numericLiteral));
                    }
                }
            }
            if (symbolFlags & 8388608 /* Alias */) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(86 /* ImportKeyword */));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                ts.forEach(symbol.declarations, function (declaration) {
                    if (declaration.kind === 216 /* ImportEqualsDeclaration */) {
                        var importEqualsDeclaration = declaration;
                        if (ts.isExternalModuleImportEqualsDeclaration(importEqualsDeclaration)) {
                            displayParts.push(ts.spacePart());
                            displayParts.push(ts.operatorPart(54 /* EqualsToken */));
                            displayParts.push(ts.spacePart());
                            displayParts.push(ts.keywordPart(123 /* RequireKeyword */));
                            displayParts.push(ts.punctuationPart(16 /* OpenParenToken */));
                            displayParts.push(ts.displayPart(ts.getTextOfNode(ts.getExternalModuleImportEqualsDeclarationExpression(importEqualsDeclaration)), SymbolDisplayPartKind.stringLiteral));
                            displayParts.push(ts.punctuationPart(17 /* CloseParenToken */));
                        }
                        else {
                            var internalAliasSymbol = typeChecker.getSymbolAtLocation(importEqualsDeclaration.moduleReference);
                            if (internalAliasSymbol) {
                                displayParts.push(ts.spacePart());
                                displayParts.push(ts.operatorPart(54 /* EqualsToken */));
                                displayParts.push(ts.spacePart());
                                addFullSymbolName(internalAliasSymbol, enclosingDeclaration);
                            }
                        }
                        return true;
                    }
                });
            }
            if (!hasAddedSymbolInfo) {
                if (symbolKind !== ScriptElementKind.unknown) {
                    if (type) {
                        addPrefixForAnyFunctionOrVar(symbol, symbolKind);
                        // For properties, variables and local vars: show the type
                        if (symbolKind === ScriptElementKind.memberVariableElement ||
                            symbolFlags & 3 /* Variable */ ||
                            symbolKind === ScriptElementKind.localVariableElement) {
                            displayParts.push(ts.punctuationPart(52 /* ColonToken */));
                            displayParts.push(ts.spacePart());
                            // If the type is type parameter, format it specially
                            if (type.symbol && type.symbol.flags & 262144 /* TypeParameter */) {
                                var typeParameterParts = ts.mapToDisplayParts(function (writer) {
                                    typeChecker.getSymbolDisplayBuilder().buildTypeParameterDisplay(type, writer, enclosingDeclaration);
                                });
                                displayParts.push.apply(displayParts, typeParameterParts);
                            }
                            else {
                                displayParts.push.apply(displayParts, ts.typeToDisplayParts(typeChecker, type, enclosingDeclaration));
                            }
                        }
                        else if (symbolFlags & 16 /* Function */ ||
                            symbolFlags & 8192 /* Method */ ||
                            symbolFlags & 16384 /* Constructor */ ||
                            symbolFlags & 131072 /* Signature */ ||
                            symbolFlags & 98304 /* Accessor */ ||
                            symbolKind === ScriptElementKind.memberFunctionElement) {
                            var allSignatures = type.getCallSignatures();
                            addSignatureDisplayParts(allSignatures[0], allSignatures);
                        }
                    }
                }
                else {
                    symbolKind = getSymbolKind(symbol, location);
                }
            }
            if (!documentation) {
                documentation = symbol.getDocumentationComment();
            }
            return { displayParts: displayParts, documentation: documentation, symbolKind: symbolKind };
            function addNewLineIfDisplayPartsExist() {
                if (displayParts.length) {
                    displayParts.push(ts.lineBreakPart());
                }
            }
            function addFullSymbolName(symbol, enclosingDeclaration) {
                var fullSymbolDisplayParts = ts.symbolToDisplayParts(typeChecker, symbol, enclosingDeclaration || sourceFile, undefined, 1 /* WriteTypeParametersOrArguments */ | 2 /* UseOnlyExternalAliasing */);
                displayParts.push.apply(displayParts, fullSymbolDisplayParts);
            }
            function addPrefixForAnyFunctionOrVar(symbol, symbolKind) {
                addNewLineIfDisplayPartsExist();
                if (symbolKind) {
                    pushTypePart(symbolKind);
                    displayParts.push(ts.spacePart());
                    addFullSymbolName(symbol);
                }
            }
            function pushTypePart(symbolKind) {
                switch (symbolKind) {
                    case ScriptElementKind.variableElement:
                    case ScriptElementKind.functionElement:
                    case ScriptElementKind.letElement:
                    case ScriptElementKind.constElement:
                    case ScriptElementKind.constructorImplementationElement:
                        displayParts.push(ts.textOrKeywordPart(symbolKind));
                        return;
                    default:
                        displayParts.push(ts.punctuationPart(16 /* OpenParenToken */));
                        displayParts.push(ts.textOrKeywordPart(symbolKind));
                        displayParts.push(ts.punctuationPart(17 /* CloseParenToken */));
                        return;
                }
            }
            function addSignatureDisplayParts(signature, allSignatures, flags) {
                displayParts.push.apply(displayParts, ts.signatureToDisplayParts(typeChecker, signature, enclosingDeclaration, flags | 32 /* WriteTypeArgumentsOfSignature */));
                if (allSignatures.length > 1) {
                    displayParts.push(ts.spacePart());
                    displayParts.push(ts.punctuationPart(16 /* OpenParenToken */));
                    displayParts.push(ts.operatorPart(34 /* PlusToken */));
                    displayParts.push(ts.displayPart((allSignatures.length - 1).toString(), SymbolDisplayPartKind.numericLiteral));
                    displayParts.push(ts.spacePart());
                    displayParts.push(ts.textPart(allSignatures.length === 2 ? "overload" : "overloads"));
                    displayParts.push(ts.punctuationPart(17 /* CloseParenToken */));
                }
                documentation = signature.getDocumentationComment();
            }
            function writeTypeParametersOfSymbol(symbol, enclosingDeclaration) {
                var typeParameterParts = ts.mapToDisplayParts(function (writer) {
                    typeChecker.getSymbolDisplayBuilder().buildTypeParameterDisplayFromSymbol(symbol, writer, enclosingDeclaration);
                });
                displayParts.push.apply(displayParts, typeParameterParts);
            }
        }
        function getQuickInfoAtPosition(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            if (isLabelName(node)) {
                return undefined;
            }
            var typeChecker = program.getTypeChecker();
            var symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                // Try getting just type at this position and show
                switch (node.kind) {
                    case 66 /* Identifier */:
                    case 161 /* PropertyAccessExpression */:
                    case 131 /* QualifiedName */:
                    case 94 /* ThisKeyword */:
                    case 92 /* SuperKeyword */:
                        // For the identifiers/this/super etc get the type at position
                        var type = typeChecker.getTypeAtLocation(node);
                        if (type) {
                            return {
                                kind: ScriptElementKind.unknown,
                                kindModifiers: ScriptElementKindModifier.none,
                                textSpan: ts.createTextSpan(node.getStart(), node.getWidth()),
                                displayParts: ts.typeToDisplayParts(typeChecker, type, getContainerNode(node)),
                                documentation: type.symbol ? type.symbol.getDocumentationComment() : undefined
                            };
                        }
                }
                return undefined;
            }
            var displayPartsDocumentationsAndKind = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, sourceFile, getContainerNode(node), node);
            return {
                kind: displayPartsDocumentationsAndKind.symbolKind,
                kindModifiers: getSymbolModifiers(symbol),
                textSpan: ts.createTextSpan(node.getStart(), node.getWidth()),
                displayParts: displayPartsDocumentationsAndKind.displayParts,
                documentation: displayPartsDocumentationsAndKind.documentation
            };
        }
        function createDefinitionInfo(node, symbolKind, symbolName, containerName) {
            return {
                fileName: node.getSourceFile().fileName,
                textSpan: ts.createTextSpanFromBounds(node.getStart(), node.getEnd()),
                kind: symbolKind,
                name: symbolName,
                containerKind: undefined,
                containerName: containerName
            };
        }
        function getDefinitionFromSymbol(symbol, node) {
            var typeChecker = program.getTypeChecker();
            var result = [];
            var declarations = symbol.getDeclarations();
            var symbolName = typeChecker.symbolToString(symbol); // Do not get scoped name, just the name of the symbol
            var symbolKind = getSymbolKind(symbol, node);
            var containerSymbol = symbol.parent;
            var containerName = containerSymbol ? typeChecker.symbolToString(containerSymbol, node) : "";
            if (!tryAddConstructSignature(symbol, node, symbolKind, symbolName, containerName, result) &&
                !tryAddCallSignature(symbol, node, symbolKind, symbolName, containerName, result)) {
                // Just add all the declarations. 
                ts.forEach(declarations, function (declaration) {
                    result.push(createDefinitionInfo(declaration, symbolKind, symbolName, containerName));
                });
            }
            return result;
            function tryAddConstructSignature(symbol, location, symbolKind, symbolName, containerName, result) {
                // Applicable only if we are in a new expression, or we are on a constructor declaration
                // and in either case the symbol has a construct signature definition, i.e. class
                if (isNewExpressionTarget(location) || location.kind === 117 /* ConstructorKeyword */) {
                    if (symbol.flags & 32 /* Class */) {
                        var classDeclaration = symbol.getDeclarations()[0];
                        ts.Debug.assert(classDeclaration && classDeclaration.kind === 209 /* ClassDeclaration */);
                        return tryAddSignature(classDeclaration.members, true, symbolKind, symbolName, containerName, result);
                    }
                }
                return false;
            }
            function tryAddCallSignature(symbol, location, symbolKind, symbolName, containerName, result) {
                if (isCallExpressionTarget(location) || isNewExpressionTarget(location) || isNameOfFunctionDeclaration(location)) {
                    return tryAddSignature(symbol.declarations, false, symbolKind, symbolName, containerName, result);
                }
                return false;
            }
            function tryAddSignature(signatureDeclarations, selectConstructors, symbolKind, symbolName, containerName, result) {
                var declarations = [];
                var definition;
                ts.forEach(signatureDeclarations, function (d) {
                    if ((selectConstructors && d.kind === 140 /* Constructor */) ||
                        (!selectConstructors && (d.kind === 208 /* FunctionDeclaration */ || d.kind === 139 /* MethodDeclaration */ || d.kind === 138 /* MethodSignature */))) {
                        declarations.push(d);
                        if (d.body)
                            definition = d;
                    }
                });
                if (definition) {
                    result.push(createDefinitionInfo(definition, symbolKind, symbolName, containerName));
                    return true;
                }
                else if (declarations.length) {
                    result.push(createDefinitionInfo(ts.lastOrUndefined(declarations), symbolKind, symbolName, containerName));
                    return true;
                }
                return false;
            }
        }
        /// Goto definition
        function getDefinitionAtPosition(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            // Labels
            if (isJumpStatementTarget(node)) {
                var labelName = node.text;
                var label = getTargetLabel(node.parent, node.text);
                return label ? [createDefinitionInfo(label, ScriptElementKind.label, labelName, undefined)] : undefined;
            }
            /// Triple slash reference comments
            var comment = ts.forEach(sourceFile.referencedFiles, function (r) { return (r.pos <= position && position < r.end) ? r : undefined; });
            if (comment) {
                var referenceFile = ts.tryResolveScriptReference(program, sourceFile, comment);
                if (referenceFile) {
                    return [{
                            fileName: referenceFile.fileName,
                            textSpan: ts.createTextSpanFromBounds(0, 0),
                            kind: ScriptElementKind.scriptElement,
                            name: comment.fileName,
                            containerName: undefined,
                            containerKind: undefined
                        }];
                }
                return undefined;
            }
            var typeChecker = program.getTypeChecker();
            var symbol = typeChecker.getSymbolAtLocation(node);
            // Could not find a symbol e.g. node is string or number keyword,
            // or the symbol was an internal symbol and does not have a declaration e.g. undefined symbol
            if (!symbol) {
                return undefined;
            }
            // If this is an alias, and the request came at the declaration location
            // get the aliased symbol instead. This allows for goto def on an import e.g.
            //   import {A, B} from "mod";
            // to jump to the implementation directly.
            if (symbol.flags & 8388608 /* Alias */) {
                var declaration = symbol.declarations[0];
                if (node.kind === 66 /* Identifier */ && node.parent === declaration) {
                    symbol = typeChecker.getAliasedSymbol(symbol);
                }
            }
            // Because name in short-hand property assignment has two different meanings: property name and property value,
            // using go-to-definition at such position should go to the variable declaration of the property value rather than
            // go to the declaration of the property name (in this case stay at the same position). However, if go-to-definition 
            // is performed at the location of property access, we would like to go to definition of the property in the short-hand
            // assignment. This case and others are handled by the following code.
            if (node.parent.kind === 241 /* ShorthandPropertyAssignment */) {
                var shorthandSymbol = typeChecker.getShorthandAssignmentValueSymbol(symbol.valueDeclaration);
                if (!shorthandSymbol) {
                    return [];
                }
                var shorthandDeclarations = shorthandSymbol.getDeclarations();
                var shorthandSymbolKind = getSymbolKind(shorthandSymbol, node);
                var shorthandSymbolName = typeChecker.symbolToString(shorthandSymbol);
                var shorthandContainerName = typeChecker.symbolToString(symbol.parent, node);
                return ts.map(shorthandDeclarations, function (declaration) { return createDefinitionInfo(declaration, shorthandSymbolKind, shorthandSymbolName, shorthandContainerName); });
            }
            return getDefinitionFromSymbol(symbol, node);
        }
        /// Goto type
        function getTypeDefinitionAtPosition(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            var typeChecker = program.getTypeChecker();
            var symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                return undefined;
            }
            var type = typeChecker.getTypeOfSymbolAtLocation(symbol, node);
            if (!type) {
                return undefined;
            }
            if (type.flags & 16384 /* Union */) {
                var result = [];
                ts.forEach(type.types, function (t) {
                    if (t.symbol) {
                        ts.addRange(result, getDefinitionFromSymbol(t.symbol, node));
                    }
                });
                return result;
            }
            if (!type.symbol) {
                return undefined;
            }
            return getDefinitionFromSymbol(type.symbol, node);
        }
        function getOccurrencesAtPosition(fileName, position) {
            var results = getOccurrencesAtPositionCore(fileName, position);
            if (results) {
                var sourceFile = getCanonicalFileName(ts.normalizeSlashes(fileName));
                // Get occurrences only supports reporting occurrences for the file queried.  So 
                // filter down to that list.
                results = ts.filter(results, function (r) { return getCanonicalFileName(ts.normalizeSlashes(r.fileName)) === sourceFile; });
            }
            return results;
        }
        function getDocumentHighlights(fileName, position, filesToSearch) {
            synchronizeHostData();
            filesToSearch = ts.map(filesToSearch, ts.normalizeSlashes);
            var sourceFilesToSearch = ts.filter(program.getSourceFiles(), function (f) { return ts.contains(filesToSearch, f.fileName); });
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingWord(sourceFile, position);
            if (!node) {
                return undefined;
            }
            return getSemanticDocumentHighlights(node) || getSyntacticDocumentHighlights(node);
            function getHighlightSpanForNode(node) {
                var start = node.getStart();
                var end = node.getEnd();
                return {
                    fileName: sourceFile.fileName,
                    textSpan: ts.createTextSpanFromBounds(start, end),
                    kind: HighlightSpanKind.none
                };
            }
            function getSemanticDocumentHighlights(node) {
                if (node.kind === 66 /* Identifier */ ||
                    node.kind === 94 /* ThisKeyword */ ||
                    node.kind === 92 /* SuperKeyword */ ||
                    isLiteralNameOfPropertyDeclarationOrIndexAccess(node) ||
                    isNameOfExternalModuleImportOrDeclaration(node)) {
                    var referencedSymbols = getReferencedSymbolsForNode(node, sourceFilesToSearch, false, false);
                    return convertReferencedSymbols(referencedSymbols);
                }
                return undefined;
                function convertReferencedSymbols(referencedSymbols) {
                    if (!referencedSymbols) {
                        return undefined;
                    }
                    var fileNameToDocumentHighlights = {};
                    var result = [];
                    for (var _i = 0; _i < referencedSymbols.length; _i++) {
                        var referencedSymbol = referencedSymbols[_i];
                        for (var _a = 0, _b = referencedSymbol.references; _a < _b.length; _a++) {
                            var referenceEntry = _b[_a];
                            var fileName_1 = referenceEntry.fileName;
                            var documentHighlights = ts.getProperty(fileNameToDocumentHighlights, fileName_1);
                            if (!documentHighlights) {
                                documentHighlights = { fileName: fileName_1, highlightSpans: [] };
                                fileNameToDocumentHighlights[fileName_1] = documentHighlights;
                                result.push(documentHighlights);
                            }
                            documentHighlights.highlightSpans.push({
                                textSpan: referenceEntry.textSpan,
                                kind: referenceEntry.isWriteAccess ? HighlightSpanKind.writtenReference : HighlightSpanKind.reference
                            });
                        }
                    }
                    return result;
                }
            }
            function getSyntacticDocumentHighlights(node) {
                var fileName = sourceFile.fileName;
                var highlightSpans = getHighlightSpans(node);
                if (!highlightSpans || highlightSpans.length === 0) {
                    return undefined;
                }
                return [{ fileName: fileName, highlightSpans: highlightSpans }];
                // returns true if 'node' is defined and has a matching 'kind'.
                function hasKind(node, kind) {
                    return node !== undefined && node.kind === kind;
                }
                // Null-propagating 'parent' function.
                function parent(node) {
                    return node && node.parent;
                }
                function getHighlightSpans(node) {
                    if (node) {
                        switch (node.kind) {
                            case 85 /* IfKeyword */:
                            case 77 /* ElseKeyword */:
                                if (hasKind(node.parent, 191 /* IfStatement */)) {
                                    return getIfElseOccurrences(node.parent);
                                }
                                break;
                            case 91 /* ReturnKeyword */:
                                if (hasKind(node.parent, 199 /* ReturnStatement */)) {
                                    return getReturnOccurrences(node.parent);
                                }
                                break;
                            case 95 /* ThrowKeyword */:
                                if (hasKind(node.parent, 203 /* ThrowStatement */)) {
                                    return getThrowOccurrences(node.parent);
                                }
                                break;
                            case 69 /* CatchKeyword */:
                                if (hasKind(parent(parent(node)), 204 /* TryStatement */)) {
                                    return getTryCatchFinallyOccurrences(node.parent.parent);
                                }
                                break;
                            case 97 /* TryKeyword */:
                            case 82 /* FinallyKeyword */:
                                if (hasKind(parent(node), 204 /* TryStatement */)) {
                                    return getTryCatchFinallyOccurrences(node.parent);
                                }
                                break;
                            case 93 /* SwitchKeyword */:
                                if (hasKind(node.parent, 201 /* SwitchStatement */)) {
                                    return getSwitchCaseDefaultOccurrences(node.parent);
                                }
                                break;
                            case 68 /* CaseKeyword */:
                            case 74 /* DefaultKeyword */:
                                if (hasKind(parent(parent(parent(node))), 201 /* SwitchStatement */)) {
                                    return getSwitchCaseDefaultOccurrences(node.parent.parent.parent);
                                }
                                break;
                            case 67 /* BreakKeyword */:
                            case 72 /* ContinueKeyword */:
                                if (hasKind(node.parent, 198 /* BreakStatement */) || hasKind(node.parent, 197 /* ContinueStatement */)) {
                                    return getBreakOrContinueStatementOccurences(node.parent);
                                }
                                break;
                            case 83 /* ForKeyword */:
                                if (hasKind(node.parent, 194 /* ForStatement */) ||
                                    hasKind(node.parent, 195 /* ForInStatement */) ||
                                    hasKind(node.parent, 196 /* ForOfStatement */)) {
                                    return getLoopBreakContinueOccurrences(node.parent);
                                }
                                break;
                            case 101 /* WhileKeyword */:
                            case 76 /* DoKeyword */:
                                if (hasKind(node.parent, 193 /* WhileStatement */) || hasKind(node.parent, 192 /* DoStatement */)) {
                                    return getLoopBreakContinueOccurrences(node.parent);
                                }
                                break;
                            case 117 /* ConstructorKeyword */:
                                if (hasKind(node.parent, 140 /* Constructor */)) {
                                    return getConstructorOccurrences(node.parent);
                                }
                                break;
                            case 119 /* GetKeyword */:
                            case 125 /* SetKeyword */:
                                if (hasKind(node.parent, 141 /* GetAccessor */) || hasKind(node.parent, 142 /* SetAccessor */)) {
                                    return getGetAndSetOccurrences(node.parent);
                                }
                            default:
                                if (ts.isModifier(node.kind) && node.parent &&
                                    (ts.isDeclaration(node.parent) || node.parent.kind === 188 /* VariableStatement */)) {
                                    return getModifierOccurrences(node.kind, node.parent);
                                }
                        }
                    }
                    return undefined;
                }
                /**
                 * Aggregates all throw-statements within this node *without* crossing
                 * into function boundaries and try-blocks with catch-clauses.
                 */
                function aggregateOwnedThrowStatements(node) {
                    var statementAccumulator = [];
                    aggregate(node);
                    return statementAccumulator;
                    function aggregate(node) {
                        if (node.kind === 203 /* ThrowStatement */) {
                            statementAccumulator.push(node);
                        }
                        else if (node.kind === 204 /* TryStatement */) {
                            var tryStatement = node;
                            if (tryStatement.catchClause) {
                                aggregate(tryStatement.catchClause);
                            }
                            else {
                                // Exceptions thrown within a try block lacking a catch clause
                                // are "owned" in the current context.
                                aggregate(tryStatement.tryBlock);
                            }
                            if (tryStatement.finallyBlock) {
                                aggregate(tryStatement.finallyBlock);
                            }
                        }
                        else if (!ts.isFunctionLike(node)) {
                            ts.forEachChild(node, aggregate);
                        }
                    }
                    ;
                }
                /**
                 * For lack of a better name, this function takes a throw statement and returns the
                 * nearest ancestor that is a try-block (whose try statement has a catch clause),
                 * function-block, or source file.
                 */
                function getThrowStatementOwner(throwStatement) {
                    var child = throwStatement;
                    while (child.parent) {
                        var parent_3 = child.parent;
                        if (ts.isFunctionBlock(parent_3) || parent_3.kind === 243 /* SourceFile */) {
                            return parent_3;
                        }
                        // A throw-statement is only owned by a try-statement if the try-statement has
                        // a catch clause, and if the throw-statement occurs within the try block.
                        if (parent_3.kind === 204 /* TryStatement */) {
                            var tryStatement = parent_3;
                            if (tryStatement.tryBlock === child && tryStatement.catchClause) {
                                return child;
                            }
                        }
                        child = parent_3;
                    }
                    return undefined;
                }
                function aggregateAllBreakAndContinueStatements(node) {
                    var statementAccumulator = [];
                    aggregate(node);
                    return statementAccumulator;
                    function aggregate(node) {
                        if (node.kind === 198 /* BreakStatement */ || node.kind === 197 /* ContinueStatement */) {
                            statementAccumulator.push(node);
                        }
                        else if (!ts.isFunctionLike(node)) {
                            ts.forEachChild(node, aggregate);
                        }
                    }
                    ;
                }
                function ownsBreakOrContinueStatement(owner, statement) {
                    var actualOwner = getBreakOrContinueOwner(statement);
                    return actualOwner && actualOwner === owner;
                }
                function getBreakOrContinueOwner(statement) {
                    for (var node_1 = statement.parent; node_1; node_1 = node_1.parent) {
                        switch (node_1.kind) {
                            case 201 /* SwitchStatement */:
                                if (statement.kind === 197 /* ContinueStatement */) {
                                    continue;
                                }
                            // Fall through.
                            case 194 /* ForStatement */:
                            case 195 /* ForInStatement */:
                            case 196 /* ForOfStatement */:
                            case 193 /* WhileStatement */:
                            case 192 /* DoStatement */:
                                if (!statement.label || isLabeledBy(node_1, statement.label.text)) {
                                    return node_1;
                                }
                                break;
                            default:
                                // Don't cross function boundaries.
                                if (ts.isFunctionLike(node_1)) {
                                    return undefined;
                                }
                                break;
                        }
                    }
                    return undefined;
                }
                function getModifierOccurrences(modifier, declaration) {
                    var container = declaration.parent;
                    // Make sure we only highlight the keyword when it makes sense to do so.
                    if (ts.isAccessibilityModifier(modifier)) {
                        if (!(container.kind === 209 /* ClassDeclaration */ ||
                            (declaration.kind === 134 /* Parameter */ && hasKind(container, 140 /* Constructor */)))) {
                            return undefined;
                        }
                    }
                    else if (modifier === 110 /* StaticKeyword */) {
                        if (container.kind !== 209 /* ClassDeclaration */) {
                            return undefined;
                        }
                    }
                    else if (modifier === 79 /* ExportKeyword */ || modifier === 118 /* DeclareKeyword */) {
                        if (!(container.kind === 214 /* ModuleBlock */ || container.kind === 243 /* SourceFile */)) {
                            return undefined;
                        }
                    }
                    else {
                        // unsupported modifier
                        return undefined;
                    }
                    var keywords = [];
                    var modifierFlag = getFlagFromModifier(modifier);
                    var nodes;
                    switch (container.kind) {
                        case 214 /* ModuleBlock */:
                        case 243 /* SourceFile */:
                            nodes = container.statements;
                            break;
                        case 140 /* Constructor */:
                            nodes = container.parameters.concat(container.parent.members);
                            break;
                        case 209 /* ClassDeclaration */:
                            nodes = container.members;
                            // If we're an accessibility modifier, we're in an instance member and should search
                            // the constructor's parameter list for instance members as well.
                            if (modifierFlag & 112 /* AccessibilityModifier */) {
                                var constructor = ts.forEach(container.members, function (member) {
                                    return member.kind === 140 /* Constructor */ && member;
                                });
                                if (constructor) {
                                    nodes = nodes.concat(constructor.parameters);
                                }
                            }
                            break;
                        default:
                            ts.Debug.fail("Invalid container kind.");
                    }
                    ts.forEach(nodes, function (node) {
                        if (node.modifiers && node.flags & modifierFlag) {
                            ts.forEach(node.modifiers, function (child) { return pushKeywordIf(keywords, child, modifier); });
                        }
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                    function getFlagFromModifier(modifier) {
                        switch (modifier) {
                            case 109 /* PublicKeyword */:
                                return 16 /* Public */;
                            case 107 /* PrivateKeyword */:
                                return 32 /* Private */;
                            case 108 /* ProtectedKeyword */:
                                return 64 /* Protected */;
                            case 110 /* StaticKeyword */:
                                return 128 /* Static */;
                            case 79 /* ExportKeyword */:
                                return 1 /* Export */;
                            case 118 /* DeclareKeyword */:
                                return 2 /* Ambient */;
                            default:
                                ts.Debug.fail();
                        }
                    }
                }
                function pushKeywordIf(keywordList, token) {
                    var expected = [];
                    for (var _i = 2; _i < arguments.length; _i++) {
                        expected[_i - 2] = arguments[_i];
                    }
                    if (token && ts.contains(expected, token.kind)) {
                        keywordList.push(token);
                        return true;
                    }
                    return false;
                }
                function getGetAndSetOccurrences(accessorDeclaration) {
                    var keywords = [];
                    tryPushAccessorKeyword(accessorDeclaration.symbol, 141 /* GetAccessor */);
                    tryPushAccessorKeyword(accessorDeclaration.symbol, 142 /* SetAccessor */);
                    return ts.map(keywords, getHighlightSpanForNode);
                    function tryPushAccessorKeyword(accessorSymbol, accessorKind) {
                        var accessor = ts.getDeclarationOfKind(accessorSymbol, accessorKind);
                        if (accessor) {
                            ts.forEach(accessor.getChildren(), function (child) { return pushKeywordIf(keywords, child, 119 /* GetKeyword */, 125 /* SetKeyword */); });
                        }
                    }
                }
                function getConstructorOccurrences(constructorDeclaration) {
                    var declarations = constructorDeclaration.symbol.getDeclarations();
                    var keywords = [];
                    ts.forEach(declarations, function (declaration) {
                        ts.forEach(declaration.getChildren(), function (token) {
                            return pushKeywordIf(keywords, token, 117 /* ConstructorKeyword */);
                        });
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getLoopBreakContinueOccurrences(loopNode) {
                    var keywords = [];
                    if (pushKeywordIf(keywords, loopNode.getFirstToken(), 83 /* ForKeyword */, 101 /* WhileKeyword */, 76 /* DoKeyword */)) {
                        // If we succeeded and got a do-while loop, then start looking for a 'while' keyword.
                        if (loopNode.kind === 192 /* DoStatement */) {
                            var loopTokens = loopNode.getChildren();
                            for (var i = loopTokens.length - 1; i >= 0; i--) {
                                if (pushKeywordIf(keywords, loopTokens[i], 101 /* WhileKeyword */)) {
                                    break;
                                }
                            }
                        }
                    }
                    var breaksAndContinues = aggregateAllBreakAndContinueStatements(loopNode.statement);
                    ts.forEach(breaksAndContinues, function (statement) {
                        if (ownsBreakOrContinueStatement(loopNode, statement)) {
                            pushKeywordIf(keywords, statement.getFirstToken(), 67 /* BreakKeyword */, 72 /* ContinueKeyword */);
                        }
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getBreakOrContinueStatementOccurences(breakOrContinueStatement) {
                    var owner = getBreakOrContinueOwner(breakOrContinueStatement);
                    if (owner) {
                        switch (owner.kind) {
                            case 194 /* ForStatement */:
                            case 195 /* ForInStatement */:
                            case 196 /* ForOfStatement */:
                            case 192 /* DoStatement */:
                            case 193 /* WhileStatement */:
                                return getLoopBreakContinueOccurrences(owner);
                            case 201 /* SwitchStatement */:
                                return getSwitchCaseDefaultOccurrences(owner);
                        }
                    }
                    return undefined;
                }
                function getSwitchCaseDefaultOccurrences(switchStatement) {
                    var keywords = [];
                    pushKeywordIf(keywords, switchStatement.getFirstToken(), 93 /* SwitchKeyword */);
                    // Go through each clause in the switch statement, collecting the 'case'/'default' keywords.
                    ts.forEach(switchStatement.caseBlock.clauses, function (clause) {
                        pushKeywordIf(keywords, clause.getFirstToken(), 68 /* CaseKeyword */, 74 /* DefaultKeyword */);
                        var breaksAndContinues = aggregateAllBreakAndContinueStatements(clause);
                        ts.forEach(breaksAndContinues, function (statement) {
                            if (ownsBreakOrContinueStatement(switchStatement, statement)) {
                                pushKeywordIf(keywords, statement.getFirstToken(), 67 /* BreakKeyword */);
                            }
                        });
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getTryCatchFinallyOccurrences(tryStatement) {
                    var keywords = [];
                    pushKeywordIf(keywords, tryStatement.getFirstToken(), 97 /* TryKeyword */);
                    if (tryStatement.catchClause) {
                        pushKeywordIf(keywords, tryStatement.catchClause.getFirstToken(), 69 /* CatchKeyword */);
                    }
                    if (tryStatement.finallyBlock) {
                        var finallyKeyword = ts.findChildOfKind(tryStatement, 82 /* FinallyKeyword */, sourceFile);
                        pushKeywordIf(keywords, finallyKeyword, 82 /* FinallyKeyword */);
                    }
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getThrowOccurrences(throwStatement) {
                    var owner = getThrowStatementOwner(throwStatement);
                    if (!owner) {
                        return undefined;
                    }
                    var keywords = [];
                    ts.forEach(aggregateOwnedThrowStatements(owner), function (throwStatement) {
                        pushKeywordIf(keywords, throwStatement.getFirstToken(), 95 /* ThrowKeyword */);
                    });
                    // If the "owner" is a function, then we equate 'return' and 'throw' statements in their
                    // ability to "jump out" of the function, and include occurrences for both.
                    if (ts.isFunctionBlock(owner)) {
                        ts.forEachReturnStatement(owner, function (returnStatement) {
                            pushKeywordIf(keywords, returnStatement.getFirstToken(), 91 /* ReturnKeyword */);
                        });
                    }
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getReturnOccurrences(returnStatement) {
                    var func = ts.getContainingFunction(returnStatement);
                    // If we didn't find a containing function with a block body, bail out.
                    if (!(func && hasKind(func.body, 187 /* Block */))) {
                        return undefined;
                    }
                    var keywords = [];
                    ts.forEachReturnStatement(func.body, function (returnStatement) {
                        pushKeywordIf(keywords, returnStatement.getFirstToken(), 91 /* ReturnKeyword */);
                    });
                    // Include 'throw' statements that do not occur within a try block.
                    ts.forEach(aggregateOwnedThrowStatements(func.body), function (throwStatement) {
                        pushKeywordIf(keywords, throwStatement.getFirstToken(), 95 /* ThrowKeyword */);
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getIfElseOccurrences(ifStatement) {
                    var keywords = [];
                    // Traverse upwards through all parent if-statements linked by their else-branches.
                    while (hasKind(ifStatement.parent, 191 /* IfStatement */) && ifStatement.parent.elseStatement === ifStatement) {
                        ifStatement = ifStatement.parent;
                    }
                    // Now traverse back down through the else branches, aggregating if/else keywords of if-statements.
                    while (ifStatement) {
                        var children = ifStatement.getChildren();
                        pushKeywordIf(keywords, children[0], 85 /* IfKeyword */);
                        // Generally the 'else' keyword is second-to-last, so we traverse backwards.
                        for (var i = children.length - 1; i >= 0; i--) {
                            if (pushKeywordIf(keywords, children[i], 77 /* ElseKeyword */)) {
                                break;
                            }
                        }
                        if (!hasKind(ifStatement.elseStatement, 191 /* IfStatement */)) {
                            break;
                        }
                        ifStatement = ifStatement.elseStatement;
                    }
                    var result = [];
                    // We'd like to highlight else/ifs together if they are only separated by whitespace
                    // (i.e. the keywords are separated by no comments, no newlines).
                    for (var i = 0; i < keywords.length; i++) {
                        if (keywords[i].kind === 77 /* ElseKeyword */ && i < keywords.length - 1) {
                            var elseKeyword = keywords[i];
                            var ifKeyword = keywords[i + 1]; // this *should* always be an 'if' keyword.
                            var shouldCombindElseAndIf = true;
                            // Avoid recalculating getStart() by iterating backwards.
                            for (var j = ifKeyword.getStart() - 1; j >= elseKeyword.end; j--) {
                                if (!ts.isWhiteSpace(sourceFile.text.charCodeAt(j))) {
                                    shouldCombindElseAndIf = false;
                                    break;
                                }
                            }
                            if (shouldCombindElseAndIf) {
                                result.push({
                                    fileName: fileName,
                                    textSpan: ts.createTextSpanFromBounds(elseKeyword.getStart(), ifKeyword.end),
                                    kind: HighlightSpanKind.reference
                                });
                                i++; // skip the next keyword
                                continue;
                            }
                        }
                        // Ordinary case: just highlight the keyword.
                        result.push(getHighlightSpanForNode(keywords[i]));
                    }
                    return result;
                }
            }
        }
        /// References and Occurrences
        function getOccurrencesAtPositionCore(fileName, position) {
            synchronizeHostData();
            return convertDocumentHighlights(getDocumentHighlights(fileName, position, [fileName]));
            function convertDocumentHighlights(documentHighlights) {
                if (!documentHighlights) {
                    return undefined;
                }
                var result = [];
                for (var _i = 0; _i < documentHighlights.length; _i++) {
                    var entry = documentHighlights[_i];
                    for (var _a = 0, _b = entry.highlightSpans; _a < _b.length; _a++) {
                        var highlightSpan = _b[_a];
                        result.push({
                            fileName: entry.fileName,
                            textSpan: highlightSpan.textSpan,
                            isWriteAccess: highlightSpan.kind === HighlightSpanKind.writtenReference
                        });
                    }
                }
                return result;
            }
        }
        function convertReferences(referenceSymbols) {
            if (!referenceSymbols) {
                return undefined;
            }
            var referenceEntries = [];
            for (var _i = 0; _i < referenceSymbols.length; _i++) {
                var referenceSymbol = referenceSymbols[_i];
                ts.addRange(referenceEntries, referenceSymbol.references);
            }
            return referenceEntries;
        }
        function findRenameLocations(fileName, position, findInStrings, findInComments) {
            var referencedSymbols = findReferencedSymbols(fileName, position, findInStrings, findInComments);
            return convertReferences(referencedSymbols);
        }
        function getReferencesAtPosition(fileName, position) {
            var referencedSymbols = findReferencedSymbols(fileName, position, false, false);
            return convertReferences(referencedSymbols);
        }
        function findReferences(fileName, position) {
            var referencedSymbols = findReferencedSymbols(fileName, position, false, false);
            // Only include referenced symbols that have a valid definition.
            return ts.filter(referencedSymbols, function (rs) { return !!rs.definition; });
        }
        function findReferencedSymbols(fileName, position, findInStrings, findInComments) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            if (node.kind !== 66 /* Identifier */ &&
                // TODO (drosen): This should be enabled in a later release - currently breaks rename.
                //node.kind !== SyntaxKind.ThisKeyword &&
                //node.kind !== SyntaxKind.SuperKeyword &&
                !isLiteralNameOfPropertyDeclarationOrIndexAccess(node) &&
                !isNameOfExternalModuleImportOrDeclaration(node)) {
                return undefined;
            }
            ts.Debug.assert(node.kind === 66 /* Identifier */ || node.kind === 7 /* NumericLiteral */ || node.kind === 8 /* StringLiteral */);
            return getReferencedSymbolsForNode(node, program.getSourceFiles(), findInStrings, findInComments);
        }
        function getReferencedSymbolsForNode(node, sourceFiles, findInStrings, findInComments) {
            var typeChecker = program.getTypeChecker();
            // Labels
            if (isLabelName(node)) {
                if (isJumpStatementTarget(node)) {
                    var labelDefinition = getTargetLabel(node.parent, node.text);
                    // if we have a label definition, look within its statement for references, if not, then
                    // the label is undefined and we have no results..
                    return labelDefinition ? getLabelReferencesInNode(labelDefinition.parent, labelDefinition) : undefined;
                }
                else {
                    // it is a label definition and not a target, search within the parent labeledStatement
                    return getLabelReferencesInNode(node.parent, node);
                }
            }
            if (node.kind === 94 /* ThisKeyword */) {
                return getReferencesForThisKeyword(node, sourceFiles);
            }
            if (node.kind === 92 /* SuperKeyword */) {
                return getReferencesForSuperKeyword(node);
            }
            var symbol = typeChecker.getSymbolAtLocation(node);
            // Could not find a symbol e.g. unknown identifier
            if (!symbol) {
                // Can't have references to something that we have no symbol for.
                return undefined;
            }
            var declarations = symbol.declarations;
            // The symbol was an internal symbol and does not have a declaration e.g. undefined symbol
            if (!declarations || !declarations.length) {
                return undefined;
            }
            var result;
            // Compute the meaning from the location and the symbol it references
            var searchMeaning = getIntersectingMeaningFromDeclarations(getMeaningFromLocation(node), declarations);
            // Get the text to search for.
            // Note: if this is an external module symbol, the name doesn't include quotes.
            var declaredName = ts.getDeclaredName(typeChecker, symbol, node);
            // Try to get the smallest valid scope that we can limit our search to;
            // otherwise we'll need to search globally (i.e. include each file).
            var scope = getSymbolScope(symbol);
            // Maps from a symbol ID to the ReferencedSymbol entry in 'result'.
            var symbolToIndex = [];
            if (scope) {
                result = [];
                getReferencesInNode(scope, symbol, declaredName, node, searchMeaning, findInStrings, findInComments, result, symbolToIndex);
            }
            else {
                var internedName = getInternedName(symbol, node, declarations);
                for (var _i = 0; _i < sourceFiles.length; _i++) {
                    var sourceFile = sourceFiles[_i];
                    cancellationToken.throwIfCancellationRequested();
                    var nameTable = getNameTable(sourceFile);
                    if (ts.lookUp(nameTable, internedName)) {
                        result = result || [];
                        getReferencesInNode(sourceFile, symbol, declaredName, node, searchMeaning, findInStrings, findInComments, result, symbolToIndex);
                    }
                }
            }
            return result;
            function getDefinition(symbol) {
                var info = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, node.getSourceFile(), getContainerNode(node), node);
                var name = ts.map(info.displayParts, function (p) { return p.text; }).join("");
                var declarations = symbol.declarations;
                if (!declarations || declarations.length === 0) {
                    return undefined;
                }
                return {
                    containerKind: "",
                    containerName: "",
                    name: name,
                    kind: info.symbolKind,
                    fileName: declarations[0].getSourceFile().fileName,
                    textSpan: ts.createTextSpan(declarations[0].getStart(), 0)
                };
            }
            function isImportOrExportSpecifierImportSymbol(symbol) {
                return (symbol.flags & 8388608 /* Alias */) && ts.forEach(symbol.declarations, function (declaration) {
                    return declaration.kind === 221 /* ImportSpecifier */ || declaration.kind === 225 /* ExportSpecifier */;
                });
            }
            function getInternedName(symbol, location, declarations) {
                // If this is an export or import specifier it could have been renamed using the 'as' syntax.
                // If so we want to search for whatever under the cursor.
                if (ts.isImportOrExportSpecifierName(location)) {
                    return location.getText();
                }
                // Try to get the local symbol if we're dealing with an 'export default'
                // since that symbol has the "true" name.
                var localExportDefaultSymbol = ts.getLocalSymbolForExportDefault(symbol);
                symbol = localExportDefaultSymbol || symbol;
                return ts.stripQuotes(symbol.name);
            }
            /**
             * Determines the smallest scope in which a symbol may have named references.
             * Note that not every construct has been accounted for. This function can
             * probably be improved.
             *
             * @returns undefined if the scope cannot be determined, implying that
             * a reference to a symbol can occur anywhere.
             */
            function getSymbolScope(symbol) {
                // If this is the symbol of a function expression, then named references
                // are limited to its own scope.
                var valueDeclaration = symbol.valueDeclaration;
                if (valueDeclaration && valueDeclaration.kind === 168 /* FunctionExpression */) {
                    return valueDeclaration;
                }
                // If this is private property or method, the scope is the containing class
                if (symbol.flags & (4 /* Property */ | 8192 /* Method */)) {
                    var privateDeclaration = ts.forEach(symbol.getDeclarations(), function (d) { return (d.flags & 32 /* Private */) ? d : undefined; });
                    if (privateDeclaration) {
                        return ts.getAncestor(privateDeclaration, 209 /* ClassDeclaration */);
                    }
                }
                // If the symbol is an import we would like to find it if we are looking for what it imports.
                // So consider it visibile outside its declaration scope.
                if (symbol.flags & 8388608 /* Alias */) {
                    return undefined;
                }
                // if this symbol is visible from its parent container, e.g. exported, then bail out
                // if symbol correspond to the union property - bail out
                if (symbol.parent || (symbol.flags & 268435456 /* UnionProperty */)) {
                    return undefined;
                }
                var scope = undefined;
                var declarations = symbol.getDeclarations();
                if (declarations) {
                    for (var _i = 0; _i < declarations.length; _i++) {
                        var declaration = declarations[_i];
                        var container = getContainerNode(declaration);
                        if (!container) {
                            return undefined;
                        }
                        if (scope && scope !== container) {
                            // Different declarations have different containers, bail out
                            return undefined;
                        }
                        if (container.kind === 243 /* SourceFile */ && !ts.isExternalModule(container)) {
                            // This is a global variable and not an external module, any declaration defined
                            // within this scope is visible outside the file
                            return undefined;
                        }
                        // The search scope is the container node
                        scope = container;
                    }
                }
                return scope;
            }
            function getPossibleSymbolReferencePositions(sourceFile, symbolName, start, end) {
                var positions = [];
                /// TODO: Cache symbol existence for files to save text search
                // Also, need to make this work for unicode escapes.
                // Be resilient in the face of a symbol with no name or zero length name
                if (!symbolName || !symbolName.length) {
                    return positions;
                }
                var text = sourceFile.text;
                var sourceLength = text.length;
                var symbolNameLength = symbolName.length;
                var position = text.indexOf(symbolName, start);
                while (position >= 0) {
                    cancellationToken.throwIfCancellationRequested();
                    // If we are past the end, stop looking
                    if (position > end)
                        break;
                    // We found a match.  Make sure it's not part of a larger word (i.e. the char 
                    // before and after it have to be a non-identifier char).
                    var endPosition = position + symbolNameLength;
                    if ((position === 0 || !ts.isIdentifierPart(text.charCodeAt(position - 1), 2 /* Latest */)) &&
                        (endPosition === sourceLength || !ts.isIdentifierPart(text.charCodeAt(endPosition), 2 /* Latest */))) {
                        // Found a real match.  Keep searching.  
                        positions.push(position);
                    }
                    position = text.indexOf(symbolName, position + symbolNameLength + 1);
                }
                return positions;
            }
            function getLabelReferencesInNode(container, targetLabel) {
                var references = [];
                var sourceFile = container.getSourceFile();
                var labelName = targetLabel.text;
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, labelName, container.getStart(), container.getEnd());
                ts.forEach(possiblePositions, function (position) {
                    cancellationToken.throwIfCancellationRequested();
                    var node = ts.getTouchingWord(sourceFile, position);
                    if (!node || node.getWidth() !== labelName.length) {
                        return;
                    }
                    // Only pick labels that are either the target label, or have a target that is the target label
                    if (node === targetLabel ||
                        (isJumpStatementTarget(node) && getTargetLabel(node, labelName) === targetLabel)) {
                        references.push(getReferenceEntryFromNode(node));
                    }
                });
                var definition = {
                    containerKind: "",
                    containerName: "",
                    fileName: targetLabel.getSourceFile().fileName,
                    kind: ScriptElementKind.label,
                    name: labelName,
                    textSpan: ts.createTextSpanFromBounds(targetLabel.getStart(), targetLabel.getEnd())
                };
                return [{ definition: definition, references: references }];
            }
            function isValidReferencePosition(node, searchSymbolName) {
                if (node) {
                    // Compare the length so we filter out strict superstrings of the symbol we are looking for
                    switch (node.kind) {
                        case 66 /* Identifier */:
                            return node.getWidth() === searchSymbolName.length;
                        case 8 /* StringLiteral */:
                            if (isLiteralNameOfPropertyDeclarationOrIndexAccess(node) ||
                                isNameOfExternalModuleImportOrDeclaration(node)) {
                                // For string literals we have two additional chars for the quotes
                                return node.getWidth() === searchSymbolName.length + 2;
                            }
                            break;
                        case 7 /* NumericLiteral */:
                            if (isLiteralNameOfPropertyDeclarationOrIndexAccess(node)) {
                                return node.getWidth() === searchSymbolName.length;
                            }
                            break;
                    }
                }
                return false;
            }
            /** Search within node "container" for references for a search value, where the search value is defined as a
              * tuple of(searchSymbol, searchText, searchLocation, and searchMeaning).
              * searchLocation: a node where the search value
              */
            function getReferencesInNode(container, searchSymbol, searchText, searchLocation, searchMeaning, findInStrings, findInComments, result, symbolToIndex) {
                var sourceFile = container.getSourceFile();
                var tripleSlashDirectivePrefixRegex = /^\/\/\/\s*</;
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, searchText, container.getStart(), container.getEnd());
                if (possiblePositions.length) {
                    // Build the set of symbols to search for, initially it has only the current symbol
                    var searchSymbols = populateSearchSymbolSet(searchSymbol, searchLocation);
                    ts.forEach(possiblePositions, function (position) {
                        cancellationToken.throwIfCancellationRequested();
                        var referenceLocation = ts.getTouchingPropertyName(sourceFile, position);
                        if (!isValidReferencePosition(referenceLocation, searchText)) {
                            // This wasn't the start of a token.  Check to see if it might be a 
                            // match in a comment or string if that's what the caller is asking
                            // for.
                            if ((findInStrings && isInString(position)) ||
                                (findInComments && isInComment(position))) {
                                // In the case where we're looking inside comments/strings, we don't have
                                // an actual definition.  So just use 'undefined' here.  Features like
                                // 'Rename' won't care (as they ignore the definitions), and features like
                                // 'FindReferences' will just filter out these results.
                                result.push({
                                    definition: undefined,
                                    references: [{
                                            fileName: sourceFile.fileName,
                                            textSpan: ts.createTextSpan(position, searchText.length),
                                            isWriteAccess: false
                                        }]
                                });
                            }
                            return;
                        }
                        if (!(getMeaningFromLocation(referenceLocation) & searchMeaning)) {
                            return;
                        }
                        var referenceSymbol = typeChecker.getSymbolAtLocation(referenceLocation);
                        if (referenceSymbol) {
                            var referenceSymbolDeclaration = referenceSymbol.valueDeclaration;
                            var shorthandValueSymbol = typeChecker.getShorthandAssignmentValueSymbol(referenceSymbolDeclaration);
                            var relatedSymbol = getRelatedSymbol(searchSymbols, referenceSymbol, referenceLocation);
                            if (relatedSymbol) {
                                var referencedSymbol = getReferencedSymbol(relatedSymbol);
                                referencedSymbol.references.push(getReferenceEntryFromNode(referenceLocation));
                            }
                            else if (!(referenceSymbol.flags & 67108864 /* Transient */) && searchSymbols.indexOf(shorthandValueSymbol) >= 0) {
                                var referencedSymbol = getReferencedSymbol(shorthandValueSymbol);
                                referencedSymbol.references.push(getReferenceEntryFromNode(referenceSymbolDeclaration.name));
                            }
                        }
                    });
                }
                return;
                function getReferencedSymbol(symbol) {
                    var symbolId = ts.getSymbolId(symbol);
                    var index = symbolToIndex[symbolId];
                    if (index === undefined) {
                        index = result.length;
                        symbolToIndex[symbolId] = index;
                        result.push({
                            definition: getDefinition(symbol),
                            references: []
                        });
                    }
                    return result[index];
                }
                function isInString(position) {
                    var token = ts.getTokenAtPosition(sourceFile, position);
                    return token && token.kind === 8 /* StringLiteral */ && position > token.getStart();
                }
                function isInComment(position) {
                    var token = ts.getTokenAtPosition(sourceFile, position);
                    if (token && position < token.getStart()) {
                        // First, we have to see if this position actually landed in a comment.
                        var commentRanges = ts.getLeadingCommentRanges(sourceFile.text, token.pos);
                        // Then we want to make sure that it wasn't in a "///<" directive comment
                        // We don't want to unintentionally update a file name.
                        return ts.forEach(commentRanges, function (c) {
                            if (c.pos < position && position < c.end) {
                                var commentText = sourceFile.text.substring(c.pos, c.end);
                                if (!tripleSlashDirectivePrefixRegex.test(commentText)) {
                                    return true;
                                }
                            }
                        });
                    }
                    return false;
                }
            }
            function getReferencesForSuperKeyword(superKeyword) {
                var searchSpaceNode = ts.getSuperContainer(superKeyword, false);
                if (!searchSpaceNode) {
                    return undefined;
                }
                // Whether 'super' occurs in a static context within a class.
                var staticFlag = 128 /* Static */;
                switch (searchSpaceNode.kind) {
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 140 /* Constructor */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                        staticFlag &= searchSpaceNode.flags;
                        searchSpaceNode = searchSpaceNode.parent; // re-assign to be the owning class
                        break;
                    default:
                        return undefined;
                }
                var references = [];
                var sourceFile = searchSpaceNode.getSourceFile();
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "super", searchSpaceNode.getStart(), searchSpaceNode.getEnd());
                ts.forEach(possiblePositions, function (position) {
                    cancellationToken.throwIfCancellationRequested();
                    var node = ts.getTouchingWord(sourceFile, position);
                    if (!node || node.kind !== 92 /* SuperKeyword */) {
                        return;
                    }
                    var container = ts.getSuperContainer(node, false);
                    // If we have a 'super' container, we must have an enclosing class.
                    // Now make sure the owning class is the same as the search-space
                    // and has the same static qualifier as the original 'super's owner.
                    if (container && (128 /* Static */ & container.flags) === staticFlag && container.parent.symbol === searchSpaceNode.symbol) {
                        references.push(getReferenceEntryFromNode(node));
                    }
                });
                var definition = getDefinition(searchSpaceNode.symbol);
                return [{ definition: definition, references: references }];
            }
            function getReferencesForThisKeyword(thisOrSuperKeyword, sourceFiles) {
                var searchSpaceNode = ts.getThisContainer(thisOrSuperKeyword, false);
                // Whether 'this' occurs in a static context within a class.
                var staticFlag = 128 /* Static */;
                switch (searchSpaceNode.kind) {
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                        if (ts.isObjectLiteralMethod(searchSpaceNode)) {
                            break;
                        }
                    // fall through
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                    case 140 /* Constructor */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                        staticFlag &= searchSpaceNode.flags;
                        searchSpaceNode = searchSpaceNode.parent; // re-assign to be the owning class
                        break;
                    case 243 /* SourceFile */:
                        if (ts.isExternalModule(searchSpaceNode)) {
                            return undefined;
                        }
                    // Fall through
                    case 208 /* FunctionDeclaration */:
                    case 168 /* FunctionExpression */:
                        break;
                    // Computed properties in classes are not handled here because references to this are illegal,
                    // so there is no point finding references to them.
                    default:
                        return undefined;
                }
                var references = [];
                var possiblePositions;
                if (searchSpaceNode.kind === 243 /* SourceFile */) {
                    ts.forEach(sourceFiles, function (sourceFile) {
                        possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "this", sourceFile.getStart(), sourceFile.getEnd());
                        getThisReferencesInFile(sourceFile, sourceFile, possiblePositions, references);
                    });
                }
                else {
                    var sourceFile = searchSpaceNode.getSourceFile();
                    possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "this", searchSpaceNode.getStart(), searchSpaceNode.getEnd());
                    getThisReferencesInFile(sourceFile, searchSpaceNode, possiblePositions, references);
                }
                return [{
                        definition: {
                            containerKind: "",
                            containerName: "",
                            fileName: node.getSourceFile().fileName,
                            kind: ScriptElementKind.variableElement,
                            name: "this",
                            textSpan: ts.createTextSpanFromBounds(node.getStart(), node.getEnd())
                        },
                        references: references
                    }];
                function getThisReferencesInFile(sourceFile, searchSpaceNode, possiblePositions, result) {
                    ts.forEach(possiblePositions, function (position) {
                        cancellationToken.throwIfCancellationRequested();
                        var node = ts.getTouchingWord(sourceFile, position);
                        if (!node || node.kind !== 94 /* ThisKeyword */) {
                            return;
                        }
                        var container = ts.getThisContainer(node, false);
                        switch (searchSpaceNode.kind) {
                            case 168 /* FunctionExpression */:
                            case 208 /* FunctionDeclaration */:
                                if (searchSpaceNode.symbol === container.symbol) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 139 /* MethodDeclaration */:
                            case 138 /* MethodSignature */:
                                if (ts.isObjectLiteralMethod(searchSpaceNode) && searchSpaceNode.symbol === container.symbol) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 209 /* ClassDeclaration */:
                                // Make sure the container belongs to the same class
                                // and has the appropriate static modifier from the original container.
                                if (container.parent && searchSpaceNode.symbol === container.parent.symbol && (container.flags & 128 /* Static */) === staticFlag) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 243 /* SourceFile */:
                                if (container.kind === 243 /* SourceFile */ && !ts.isExternalModule(container)) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                        }
                    });
                }
            }
            function populateSearchSymbolSet(symbol, location) {
                // The search set contains at least the current symbol
                var result = [symbol];
                // If the symbol is an alias, add what it alaises to the list
                if (isImportOrExportSpecifierImportSymbol(symbol)) {
                    result.push(typeChecker.getAliasedSymbol(symbol));
                }
                // If the location is in a context sensitive location (i.e. in an object literal) try
                // to get a contextual type for it, and add the property symbol from the contextual
                // type to the search set
                if (isNameOfPropertyAssignment(location)) {
                    ts.forEach(getPropertySymbolsFromContextualType(location), function (contextualSymbol) {
                        result.push.apply(result, typeChecker.getRootSymbols(contextualSymbol));
                    });
                    /* Because in short-hand property assignment, location has two meaning : property name and as value of the property
                     * When we do findAllReference at the position of the short-hand property assignment, we would want to have references to position of
                     * property name and variable declaration of the identifier.
                     * Like in below example, when querying for all references for an identifier 'name', of the property assignment, the language service
                     * should show both 'name' in 'obj' and 'name' in variable declaration
                     *      let name = "Foo";
                     *      let obj = { name };
                     * In order to do that, we will populate the search set with the value symbol of the identifier as a value of the property assignment
                     * so that when matching with potential reference symbol, both symbols from property declaration and variable declaration
                     * will be included correctly.
                     */
                    var shorthandValueSymbol = typeChecker.getShorthandAssignmentValueSymbol(location.parent);
                    if (shorthandValueSymbol) {
                        result.push(shorthandValueSymbol);
                    }
                }
                // If this is a union property, add all the symbols from all its source symbols in all unioned types.
                // If the symbol is an instantiation from a another symbol (e.g. widened symbol) , add the root the list
                ts.forEach(typeChecker.getRootSymbols(symbol), function (rootSymbol) {
                    if (rootSymbol !== symbol) {
                        result.push(rootSymbol);
                    }
                    // Add symbol of properties/methods of the same name in base classes and implemented interfaces definitions
                    if (rootSymbol.parent && rootSymbol.parent.flags & (32 /* Class */ | 64 /* Interface */)) {
                        getPropertySymbolsFromBaseTypes(rootSymbol.parent, rootSymbol.getName(), result);
                    }
                });
                return result;
            }
            function getPropertySymbolsFromBaseTypes(symbol, propertyName, result) {
                if (symbol && symbol.flags & (32 /* Class */ | 64 /* Interface */)) {
                    ts.forEach(symbol.getDeclarations(), function (declaration) {
                        if (declaration.kind === 209 /* ClassDeclaration */) {
                            getPropertySymbolFromTypeReference(ts.getClassExtendsHeritageClauseElement(declaration));
                            ts.forEach(ts.getClassImplementsHeritageClauseElements(declaration), getPropertySymbolFromTypeReference);
                        }
                        else if (declaration.kind === 210 /* InterfaceDeclaration */) {
                            ts.forEach(ts.getInterfaceBaseTypeNodes(declaration), getPropertySymbolFromTypeReference);
                        }
                    });
                }
                return;
                function getPropertySymbolFromTypeReference(typeReference) {
                    if (typeReference) {
                        var type = typeChecker.getTypeAtLocation(typeReference);
                        if (type) {
                            var propertySymbol = typeChecker.getPropertyOfType(type, propertyName);
                            if (propertySymbol) {
                                result.push(propertySymbol);
                            }
                            // Visit the typeReference as well to see if it directly or indirectly use that property
                            getPropertySymbolsFromBaseTypes(type.symbol, propertyName, result);
                        }
                    }
                }
            }
            function getRelatedSymbol(searchSymbols, referenceSymbol, referenceLocation) {
                if (searchSymbols.indexOf(referenceSymbol) >= 0) {
                    return referenceSymbol;
                }
                // If the reference symbol is an alias, check if what it is aliasing is one of the search
                // symbols.
                if (isImportOrExportSpecifierImportSymbol(referenceSymbol)) {
                    var aliasedSymbol = typeChecker.getAliasedSymbol(referenceSymbol);
                    if (searchSymbols.indexOf(aliasedSymbol) >= 0) {
                        return aliasedSymbol;
                    }
                }
                // If the reference location is in an object literal, try to get the contextual type for the 
                // object literal, lookup the property symbol in the contextual type, and use this symbol to
                // compare to our searchSymbol
                if (isNameOfPropertyAssignment(referenceLocation)) {
                    return ts.forEach(getPropertySymbolsFromContextualType(referenceLocation), function (contextualSymbol) {
                        return ts.forEach(typeChecker.getRootSymbols(contextualSymbol), function (s) { return searchSymbols.indexOf(s) >= 0 ? s : undefined; });
                    });
                }
                // Unwrap symbols to get to the root (e.g. transient symbols as a result of widening)
                // Or a union property, use its underlying unioned symbols
                return ts.forEach(typeChecker.getRootSymbols(referenceSymbol), function (rootSymbol) {
                    // if it is in the list, then we are done
                    if (searchSymbols.indexOf(rootSymbol) >= 0) {
                        return rootSymbol;
                    }
                    // Finally, try all properties with the same name in any type the containing type extended or implemented, and 
                    // see if any is in the list
                    if (rootSymbol.parent && rootSymbol.parent.flags & (32 /* Class */ | 64 /* Interface */)) {
                        var result_2 = [];
                        getPropertySymbolsFromBaseTypes(rootSymbol.parent, rootSymbol.getName(), result_2);
                        return ts.forEach(result_2, function (s) { return searchSymbols.indexOf(s) >= 0 ? s : undefined; });
                    }
                    return undefined;
                });
            }
            function getPropertySymbolsFromContextualType(node) {
                if (isNameOfPropertyAssignment(node)) {
                    var objectLiteral = node.parent.parent;
                    var contextualType = typeChecker.getContextualType(objectLiteral);
                    var name_2 = node.text;
                    if (contextualType) {
                        if (contextualType.flags & 16384 /* Union */) {
                            // This is a union type, first see if the property we are looking for is a union property (i.e. exists in all types)
                            // if not, search the constituent types for the property
                            var unionProperty = contextualType.getProperty(name_2);
                            if (unionProperty) {
                                return [unionProperty];
                            }
                            else {
                                var result_3 = [];
                                ts.forEach(contextualType.types, function (t) {
                                    var symbol = t.getProperty(name_2);
                                    if (symbol) {
                                        result_3.push(symbol);
                                    }
                                });
                                return result_3;
                            }
                        }
                        else {
                            var symbol_1 = contextualType.getProperty(name_2);
                            if (symbol_1) {
                                return [symbol_1];
                            }
                        }
                    }
                }
                return undefined;
            }
            /** Given an initial searchMeaning, extracted from a location, widen the search scope based on the declarations
              * of the corresponding symbol. e.g. if we are searching for "Foo" in value position, but "Foo" references a class
              * then we need to widen the search to include type positions as well.
              * On the contrary, if we are searching for "Bar" in type position and we trace bar to an interface, and an uninstantiated
              * module, we want to keep the search limited to only types, as the two declarations (interface and uninstantiated module)
              * do not intersect in any of the three spaces.
              */
            function getIntersectingMeaningFromDeclarations(meaning, declarations) {
                if (declarations) {
                    var lastIterationMeaning;
                    do {
                        // The result is order-sensitive, for instance if initialMeaning === Namespace, and declarations = [class, instantiated module]
                        // we need to consider both as they initialMeaning intersects with the module in the namespace space, and the module
                        // intersects with the class in the value space.
                        // To achieve that we will keep iterating until the result stabilizes.
                        // Remember the last meaning
                        lastIterationMeaning = meaning;
                        for (var _i = 0; _i < declarations.length; _i++) {
                            var declaration = declarations[_i];
                            var declarationMeaning = getMeaningFromDeclaration(declaration);
                            if (declarationMeaning & meaning) {
                                meaning |= declarationMeaning;
                            }
                        }
                    } while (meaning !== lastIterationMeaning);
                }
                return meaning;
            }
        }
        function getReferenceEntryFromNode(node) {
            var start = node.getStart();
            var end = node.getEnd();
            if (node.kind === 8 /* StringLiteral */) {
                start += 1;
                end -= 1;
            }
            return {
                fileName: node.getSourceFile().fileName,
                textSpan: ts.createTextSpanFromBounds(start, end),
                isWriteAccess: isWriteAccess(node)
            };
        }
        /** A node is considered a writeAccess iff it is a name of a declaration or a target of an assignment */
        function isWriteAccess(node) {
            if (node.kind === 66 /* Identifier */ && ts.isDeclarationName(node)) {
                return true;
            }
            var parent = node.parent;
            if (parent) {
                if (parent.kind === 175 /* PostfixUnaryExpression */ || parent.kind === 174 /* PrefixUnaryExpression */) {
                    return true;
                }
                else if (parent.kind === 176 /* BinaryExpression */ && parent.left === node) {
                    var operator = parent.operatorToken.kind;
                    return 54 /* FirstAssignment */ <= operator && operator <= 65 /* LastAssignment */;
                }
            }
            return false;
        }
        /// NavigateTo
        function getNavigateToItems(searchValue, maxResultCount) {
            synchronizeHostData();
            return ts.NavigateTo.getNavigateToItems(program, cancellationToken, searchValue, maxResultCount);
        }
        function containErrors(diagnostics) {
            return ts.forEach(diagnostics, function (diagnostic) { return diagnostic.category === ts.DiagnosticCategory.Error; });
        }
        function getEmitOutput(fileName) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var outputFiles = [];
            function writeFile(fileName, data, writeByteOrderMark) {
                outputFiles.push({
                    name: fileName,
                    writeByteOrderMark: writeByteOrderMark,
                    text: data
                });
            }
            var emitOutput = program.emit(sourceFile, writeFile);
            return {
                outputFiles: outputFiles,
                emitSkipped: emitOutput.emitSkipped
            };
        }
        function getMeaningFromDeclaration(node) {
            switch (node.kind) {
                case 134 /* Parameter */:
                case 206 /* VariableDeclaration */:
                case 158 /* BindingElement */:
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                case 240 /* PropertyAssignment */:
                case 241 /* ShorthandPropertyAssignment */:
                case 242 /* EnumMember */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                case 140 /* Constructor */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 208 /* FunctionDeclaration */:
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                case 239 /* CatchClause */:
                    return 1 /* Value */;
                case 133 /* TypeParameter */:
                case 210 /* InterfaceDeclaration */:
                case 211 /* TypeAliasDeclaration */:
                case 151 /* TypeLiteral */:
                    return 2 /* Type */;
                case 209 /* ClassDeclaration */:
                case 212 /* EnumDeclaration */:
                    return 1 /* Value */ | 2 /* Type */;
                case 213 /* ModuleDeclaration */:
                    if (node.name.kind === 8 /* StringLiteral */) {
                        return 4 /* Namespace */ | 1 /* Value */;
                    }
                    else if (ts.getModuleInstanceState(node) === 1 /* Instantiated */) {
                        return 4 /* Namespace */ | 1 /* Value */;
                    }
                    else {
                        return 4 /* Namespace */;
                    }
                case 220 /* NamedImports */:
                case 221 /* ImportSpecifier */:
                case 216 /* ImportEqualsDeclaration */:
                case 217 /* ImportDeclaration */:
                case 222 /* ExportAssignment */:
                case 223 /* ExportDeclaration */:
                    return 1 /* Value */ | 2 /* Type */ | 4 /* Namespace */;
                // An external module can be a Value
                case 243 /* SourceFile */:
                    return 4 /* Namespace */ | 1 /* Value */;
            }
            return 1 /* Value */ | 2 /* Type */ | 4 /* Namespace */;
            ts.Debug.fail("Unknown declaration type");
        }
        function isTypeReference(node) {
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(node)) {
                node = node.parent;
            }
            return node.parent.kind === 147 /* TypeReference */ ||
                (node.parent.kind === 183 /* ExpressionWithTypeArguments */ && !ts.isExpressionWithTypeArgumentsInClassExtendsClause(node.parent));
        }
        function isNamespaceReference(node) {
            return isQualifiedNameNamespaceReference(node) || isPropertyAccessNamespaceReference(node);
        }
        function isPropertyAccessNamespaceReference(node) {
            var root = node;
            var isLastClause = true;
            if (root.parent.kind === 161 /* PropertyAccessExpression */) {
                while (root.parent && root.parent.kind === 161 /* PropertyAccessExpression */) {
                    root = root.parent;
                }
                isLastClause = root.name === node;
            }
            if (!isLastClause && root.parent.kind === 183 /* ExpressionWithTypeArguments */ && root.parent.parent.kind === 238 /* HeritageClause */) {
                var decl = root.parent.parent.parent;
                return (decl.kind === 209 /* ClassDeclaration */ && root.parent.parent.token === 103 /* ImplementsKeyword */) ||
                    (decl.kind === 210 /* InterfaceDeclaration */ && root.parent.parent.token === 80 /* ExtendsKeyword */);
            }
            return false;
        }
        function isQualifiedNameNamespaceReference(node) {
            var root = node;
            var isLastClause = true;
            if (root.parent.kind === 131 /* QualifiedName */) {
                while (root.parent && root.parent.kind === 131 /* QualifiedName */) {
                    root = root.parent;
                }
                isLastClause = root.right === node;
            }
            return root.parent.kind === 147 /* TypeReference */ && !isLastClause;
        }
        function isInRightSideOfImport(node) {
            while (node.parent.kind === 131 /* QualifiedName */) {
                node = node.parent;
            }
            return ts.isInternalModuleImportEqualsDeclaration(node.parent) && node.parent.moduleReference === node;
        }
        function getMeaningFromRightHandSideOfImportEquals(node) {
            ts.Debug.assert(node.kind === 66 /* Identifier */);
            //     import a = |b|; // Namespace
            //     import a = |b.c|; // Value, type, namespace
            //     import a = |b.c|.d; // Namespace
            if (node.parent.kind === 131 /* QualifiedName */ &&
                node.parent.right === node &&
                node.parent.parent.kind === 216 /* ImportEqualsDeclaration */) {
                return 1 /* Value */ | 2 /* Type */ | 4 /* Namespace */;
            }
            return 4 /* Namespace */;
        }
        function getMeaningFromLocation(node) {
            if (node.parent.kind === 222 /* ExportAssignment */) {
                return 1 /* Value */ | 2 /* Type */ | 4 /* Namespace */;
            }
            else if (isInRightSideOfImport(node)) {
                return getMeaningFromRightHandSideOfImportEquals(node);
            }
            else if (ts.isDeclarationName(node)) {
                return getMeaningFromDeclaration(node.parent);
            }
            else if (isTypeReference(node)) {
                return 2 /* Type */;
            }
            else if (isNamespaceReference(node)) {
                return 4 /* Namespace */;
            }
            else {
                return 1 /* Value */;
            }
        }
        // Signature help
        /**
         * This is a semantic operation.
         */
        function getSignatureHelpItems(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            return ts.SignatureHelp.getSignatureHelpItems(program, sourceFile, position, cancellationToken);
        }
        /// Syntactic features
        function getSourceFile(fileName) {
            return syntaxTreeCache.getCurrentSourceFile(fileName);
        }
        function getNameOrDottedNameSpan(fileName, startPos, endPos) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            // Get node at the location
            var node = ts.getTouchingPropertyName(sourceFile, startPos);
            if (!node) {
                return;
            }
            switch (node.kind) {
                case 161 /* PropertyAccessExpression */:
                case 131 /* QualifiedName */:
                case 8 /* StringLiteral */:
                case 81 /* FalseKeyword */:
                case 96 /* TrueKeyword */:
                case 90 /* NullKeyword */:
                case 92 /* SuperKeyword */:
                case 94 /* ThisKeyword */:
                case 66 /* Identifier */:
                    break;
                // Cant create the text span
                default:
                    return;
            }
            var nodeForStartPos = node;
            while (true) {
                if (isRightSideOfPropertyAccess(nodeForStartPos) || isRightSideOfQualifiedName(nodeForStartPos)) {
                    // If on the span is in right side of the the property or qualified name, return the span from the qualified name pos to end of this node
                    nodeForStartPos = nodeForStartPos.parent;
                }
                else if (isNameOfModuleDeclaration(nodeForStartPos)) {
                    // If this is name of a module declarations, check if this is right side of dotted module name
                    // If parent of the module declaration which is parent of this node is module declaration and its body is the module declaration that this node is name of 
                    // Then this name is name from dotted module
                    if (nodeForStartPos.parent.parent.kind === 213 /* ModuleDeclaration */ &&
                        nodeForStartPos.parent.parent.body === nodeForStartPos.parent) {
                        // Use parent module declarations name for start pos
                        nodeForStartPos = nodeForStartPos.parent.parent.name;
                    }
                    else {
                        // We have to use this name for start pos
                        break;
                    }
                }
                else {
                    // Is not a member expression so we have found the node for start pos
                    break;
                }
            }
            return ts.createTextSpanFromBounds(nodeForStartPos.getStart(), node.getEnd());
        }
        function getBreakpointStatementAtPosition(fileName, position) {
            // doesn't use compiler - no need to synchronize with host
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.BreakpointResolver.spanInSourceFileAtLocation(sourceFile, position);
        }
        function getNavigationBarItems(fileName) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.NavigationBar.getNavigationBarItems(sourceFile);
        }
        function getSemanticClassifications(fileName, span) {
            return convertClassifications(getEncodedSemanticClassifications(fileName, span));
        }
        function getEncodedSemanticClassifications(fileName, span) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var typeChecker = program.getTypeChecker();
            var result = [];
            var classifiableNames = program.getClassifiableNames();
            processNode(sourceFile);
            return { spans: result, endOfLineState: 0 /* None */ };
            function pushClassification(start, length, type) {
                result.push(start);
                result.push(length);
                result.push(type);
            }
            function classifySymbol(symbol, meaningAtPosition) {
                var flags = symbol.getFlags();
                if ((flags & 788448 /* Classifiable */) === 0 /* None */) {
                    return;
                }
                if (flags & 32 /* Class */) {
                    return 11 /* className */;
                }
                else if (flags & 384 /* Enum */) {
                    return 12 /* enumName */;
                }
                else if (flags & 524288 /* TypeAlias */) {
                    return 16 /* typeAliasName */;
                }
                else if (meaningAtPosition & 2 /* Type */) {
                    if (flags & 64 /* Interface */) {
                        return 13 /* interfaceName */;
                    }
                    else if (flags & 262144 /* TypeParameter */) {
                        return 15 /* typeParameterName */;
                    }
                }
                else if (flags & 1536 /* Module */) {
                    // Only classify a module as such if
                    //  - It appears in a namespace context.
                    //  - There exists a module declaration which actually impacts the value side.
                    if (meaningAtPosition & 4 /* Namespace */ ||
                        (meaningAtPosition & 1 /* Value */ && hasValueSideModule(symbol))) {
                        return 14 /* moduleName */;
                    }
                }
                return undefined;
                /**
                 * Returns true if there exists a module that introduces entities on the value side.
                 */
                function hasValueSideModule(symbol) {
                    return ts.forEach(symbol.declarations, function (declaration) {
                        return declaration.kind === 213 /* ModuleDeclaration */ &&
                            ts.getModuleInstanceState(declaration) === 1 /* Instantiated */;
                    });
                }
            }
            function processNode(node) {
                // Only walk into nodes that intersect the requested span.
                if (node && ts.textSpanIntersectsWith(span, node.getFullStart(), node.getFullWidth())) {
                    if (node.kind === 66 /* Identifier */ && !ts.nodeIsMissing(node)) {
                        var identifier = node;
                        // Only bother calling into the typechecker if this is an identifier that
                        // could possibly resolve to a type name.  This makes classification run
                        // in a third of the time it would normally take.
                        if (classifiableNames[identifier.text]) {
                            var symbol = typeChecker.getSymbolAtLocation(node);
                            if (symbol) {
                                var type = classifySymbol(symbol, getMeaningFromLocation(node));
                                if (type) {
                                    pushClassification(node.getStart(), node.getWidth(), type);
                                }
                            }
                        }
                    }
                    ts.forEachChild(node, processNode);
                }
            }
        }
        function getClassificationTypeName(type) {
            switch (type) {
                case 1 /* comment */: return ClassificationTypeNames.comment;
                case 2 /* identifier */: return ClassificationTypeNames.identifier;
                case 3 /* keyword */: return ClassificationTypeNames.keyword;
                case 4 /* numericLiteral */: return ClassificationTypeNames.numericLiteral;
                case 5 /* operator */: return ClassificationTypeNames.operator;
                case 6 /* stringLiteral */: return ClassificationTypeNames.stringLiteral;
                case 8 /* whiteSpace */: return ClassificationTypeNames.whiteSpace;
                case 9 /* text */: return ClassificationTypeNames.text;
                case 10 /* punctuation */: return ClassificationTypeNames.punctuation;
                case 11 /* className */: return ClassificationTypeNames.className;
                case 12 /* enumName */: return ClassificationTypeNames.enumName;
                case 13 /* interfaceName */: return ClassificationTypeNames.interfaceName;
                case 14 /* moduleName */: return ClassificationTypeNames.moduleName;
                case 15 /* typeParameterName */: return ClassificationTypeNames.typeParameterName;
                case 16 /* typeAliasName */: return ClassificationTypeNames.typeAliasName;
                case 17 /* parameterName */: return ClassificationTypeNames.parameterName;
                case 18 /* docCommentTagName */: return ClassificationTypeNames.docCommentTagName;
            }
        }
        function convertClassifications(classifications) {
            ts.Debug.assert(classifications.spans.length % 3 === 0);
            var dense = classifications.spans;
            var result = [];
            for (var i = 0, n = dense.length; i < n; i += 3) {
                result.push({
                    textSpan: ts.createTextSpan(dense[i], dense[i + 1]),
                    classificationType: getClassificationTypeName(dense[i + 2])
                });
            }
            return result;
        }
        function getSyntacticClassifications(fileName, span) {
            return convertClassifications(getEncodedSyntacticClassifications(fileName, span));
        }
        function getEncodedSyntacticClassifications(fileName, span) {
            // doesn't use compiler - no need to synchronize with host
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            var spanStart = span.start;
            var spanLength = span.length;
            // Make a scanner we can get trivia from.
            var triviaScanner = ts.createScanner(2 /* Latest */, false, sourceFile.languageVariant, sourceFile.text);
            var mergeConflictScanner = ts.createScanner(2 /* Latest */, false, sourceFile.languageVariant, sourceFile.text);
            var result = [];
            processElement(sourceFile);
            return { spans: result, endOfLineState: 0 /* None */ };
            function pushClassification(start, length, type) {
                result.push(start);
                result.push(length);
                result.push(type);
            }
            function classifyLeadingTriviaAndGetTokenStart(token) {
                triviaScanner.setTextPos(token.pos);
                while (true) {
                    var start = triviaScanner.getTextPos();
                    // only bother scanning if we have something that could be trivia.
                    if (!ts.couldStartTrivia(sourceFile.text, start)) {
                        return start;
                    }
                    var kind = triviaScanner.scan();
                    var end = triviaScanner.getTextPos();
                    var width = end - start;
                    // The moment we get something that isn't trivia, then stop processing.
                    if (!ts.isTrivia(kind)) {
                        return start;
                    }
                    // Don't bother with newlines/whitespace.
                    if (kind === 4 /* NewLineTrivia */ || kind === 5 /* WhitespaceTrivia */) {
                        continue;
                    }
                    // Only bother with the trivia if it at least intersects the span of interest.
                    if (ts.isComment(kind)) {
                        classifyComment(token, kind, start, width);
                        // Classifying a comment might cause us to reuse the trivia scanner 
                        // (because of jsdoc comments).  So after we classify the comment make
                        // sure we set the scanner position back to where it needs to be.
                        triviaScanner.setTextPos(end);
                        continue;
                    }
                    if (kind === 6 /* ConflictMarkerTrivia */) {
                        var text = sourceFile.text;
                        var ch = text.charCodeAt(start);
                        // for the <<<<<<< and >>>>>>> markers, we just add them in as comments
                        // in the classification stream.
                        if (ch === 60 /* lessThan */ || ch === 62 /* greaterThan */) {
                            pushClassification(start, width, 1 /* comment */);
                            continue;
                        }
                        // for the ======== add a comment for the first line, and then lex all
                        // subsequent lines up until the end of the conflict marker.
                        ts.Debug.assert(ch === 61 /* equals */);
                        classifyDisabledMergeCode(text, start, end);
                    }
                }
            }
            function classifyComment(token, kind, start, width) {
                if (kind === 3 /* MultiLineCommentTrivia */) {
                    // See if this is a doc comment.  If so, we'll classify certain portions of it
                    // specially.
                    var docCommentAndDiagnostics = ts.parseIsolatedJSDocComment(sourceFile.text, start, width);
                    if (docCommentAndDiagnostics && docCommentAndDiagnostics.jsDocComment) {
                        docCommentAndDiagnostics.jsDocComment.parent = token;
                        classifyJSDocComment(docCommentAndDiagnostics.jsDocComment);
                        return;
                    }
                }
                // Simple comment.  Just add as is.
                pushCommentRange(start, width);
            }
            function pushCommentRange(start, width) {
                pushClassification(start, width, 1 /* comment */);
            }
            function classifyJSDocComment(docComment) {
                var pos = docComment.pos;
                for (var _i = 0, _a = docComment.tags; _i < _a.length; _i++) {
                    var tag = _a[_i];
                    // As we walk through each tag, classify the portion of text from the end of
                    // the last tag (or the start of the entire doc comment) as 'comment'.  
                    if (tag.pos !== pos) {
                        pushCommentRange(pos, tag.pos - pos);
                    }
                    pushClassification(tag.atToken.pos, tag.atToken.end - tag.atToken.pos, 10 /* punctuation */);
                    pushClassification(tag.tagName.pos, tag.tagName.end - tag.tagName.pos, 18 /* docCommentTagName */);
                    pos = tag.tagName.end;
                    switch (tag.kind) {
                        case 262 /* JSDocParameterTag */:
                            processJSDocParameterTag(tag);
                            break;
                        case 265 /* JSDocTemplateTag */:
                            processJSDocTemplateTag(tag);
                            break;
                        case 264 /* JSDocTypeTag */:
                            processElement(tag.typeExpression);
                            break;
                        case 263 /* JSDocReturnTag */:
                            processElement(tag.typeExpression);
                            break;
                    }
                    pos = tag.end;
                }
                if (pos !== docComment.end) {
                    pushCommentRange(pos, docComment.end - pos);
                }
                return;
                function processJSDocParameterTag(tag) {
                    if (tag.preParameterName) {
                        pushCommentRange(pos, tag.preParameterName.pos - pos);
                        pushClassification(tag.preParameterName.pos, tag.preParameterName.end - tag.preParameterName.pos, 17 /* parameterName */);
                        pos = tag.preParameterName.end;
                    }
                    if (tag.typeExpression) {
                        pushCommentRange(pos, tag.typeExpression.pos - pos);
                        processElement(tag.typeExpression);
                        pos = tag.typeExpression.end;
                    }
                    if (tag.postParameterName) {
                        pushCommentRange(pos, tag.postParameterName.pos - pos);
                        pushClassification(tag.postParameterName.pos, tag.postParameterName.end - tag.postParameterName.pos, 17 /* parameterName */);
                        pos = tag.postParameterName.end;
                    }
                }
            }
            function processJSDocTemplateTag(tag) {
                for (var _i = 0, _a = tag.getChildren(); _i < _a.length; _i++) {
                    var child = _a[_i];
                    processElement(child);
                }
            }
            function classifyDisabledMergeCode(text, start, end) {
                // Classify the line that the ======= marker is on as a comment.  Then just lex 
                // all further tokens and add them to the result.
                for (var i = start; i < end; i++) {
                    if (ts.isLineBreak(text.charCodeAt(i))) {
                        break;
                    }
                }
                pushClassification(start, i - start, 1 /* comment */);
                mergeConflictScanner.setTextPos(i);
                while (mergeConflictScanner.getTextPos() < end) {
                    classifyDisabledCodeToken();
                }
            }
            function classifyDisabledCodeToken() {
                var start = mergeConflictScanner.getTextPos();
                var tokenKind = mergeConflictScanner.scan();
                var end = mergeConflictScanner.getTextPos();
                var type = classifyTokenType(tokenKind);
                if (type) {
                    pushClassification(start, end - start, type);
                }
            }
            function classifyToken(token) {
                if (ts.nodeIsMissing(token)) {
                    return;
                }
                var tokenStart = classifyLeadingTriviaAndGetTokenStart(token);
                var tokenWidth = token.end - tokenStart;
                ts.Debug.assert(tokenWidth >= 0);
                if (tokenWidth > 0) {
                    var type = classifyTokenType(token.kind, token);
                    if (type) {
                        pushClassification(tokenStart, tokenWidth, type);
                    }
                }
            }
            // for accurate classification, the actual token should be passed in.  however, for 
            // cases like 'disabled merge code' classification, we just get the token kind and
            // classify based on that instead.
            function classifyTokenType(tokenKind, token) {
                if (ts.isKeyword(tokenKind)) {
                    return 3 /* keyword */;
                }
                // Special case < and >  If they appear in a generic context they are punctuation,
                // not operators.
                if (tokenKind === 24 /* LessThanToken */ || tokenKind === 26 /* GreaterThanToken */) {
                    // If the node owning the token has a type argument list or type parameter list, then
                    // we can effectively assume that a '<' and '>' belong to those lists.
                    if (token && ts.getTypeArgumentOrTypeParameterList(token.parent)) {
                        return 10 /* punctuation */;
                    }
                }
                if (ts.isPunctuation(tokenKind)) {
                    if (token) {
                        if (tokenKind === 54 /* EqualsToken */) {
                            // the '=' in a variable declaration is special cased here.
                            if (token.parent.kind === 206 /* VariableDeclaration */ ||
                                token.parent.kind === 137 /* PropertyDeclaration */ ||
                                token.parent.kind === 134 /* Parameter */) {
                                return 5 /* operator */;
                            }
                        }
                        if (token.parent.kind === 176 /* BinaryExpression */ ||
                            token.parent.kind === 174 /* PrefixUnaryExpression */ ||
                            token.parent.kind === 175 /* PostfixUnaryExpression */ ||
                            token.parent.kind === 177 /* ConditionalExpression */) {
                            return 5 /* operator */;
                        }
                    }
                    return 10 /* punctuation */;
                }
                else if (tokenKind === 7 /* NumericLiteral */) {
                    return 4 /* numericLiteral */;
                }
                else if (tokenKind === 8 /* StringLiteral */) {
                    return 6 /* stringLiteral */;
                }
                else if (tokenKind === 9 /* RegularExpressionLiteral */) {
                    // TODO: we should get another classification type for these literals.
                    return 6 /* stringLiteral */;
                }
                else if (ts.isTemplateLiteralKind(tokenKind)) {
                    // TODO (drosen): we should *also* get another classification type for these literals.
                    return 6 /* stringLiteral */;
                }
                else if (tokenKind === 66 /* Identifier */) {
                    if (token) {
                        switch (token.parent.kind) {
                            case 209 /* ClassDeclaration */:
                                if (token.parent.name === token) {
                                    return 11 /* className */;
                                }
                                return;
                            case 133 /* TypeParameter */:
                                if (token.parent.name === token) {
                                    return 15 /* typeParameterName */;
                                }
                                return;
                            case 210 /* InterfaceDeclaration */:
                                if (token.parent.name === token) {
                                    return 13 /* interfaceName */;
                                }
                                return;
                            case 212 /* EnumDeclaration */:
                                if (token.parent.name === token) {
                                    return 12 /* enumName */;
                                }
                                return;
                            case 213 /* ModuleDeclaration */:
                                if (token.parent.name === token) {
                                    return 14 /* moduleName */;
                                }
                                return;
                            case 134 /* Parameter */:
                                if (token.parent.name === token) {
                                    return 17 /* parameterName */;
                                }
                                return;
                        }
                    }
                    return 9 /* text */;
                }
            }
            function processElement(element) {
                if (!element) {
                    return;
                }
                // Ignore nodes that don't intersect the original span to classify.
                if (ts.decodedTextSpanIntersectsWith(spanStart, spanLength, element.pos, element.getFullWidth())) {
                    var children = element.getChildren(sourceFile);
                    for (var i = 0, n = children.length; i < n; i++) {
                        var child = children[i];
                        if (ts.isToken(child)) {
                            classifyToken(child);
                        }
                        else {
                            // Recurse into our child nodes.
                            processElement(child);
                        }
                    }
                }
            }
        }
        function getOutliningSpans(fileName) {
            // doesn't use compiler - no need to synchronize with host
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.OutliningElementsCollector.collectElements(sourceFile);
        }
        function getBraceMatchingAtPosition(fileName, position) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            var result = [];
            var token = ts.getTouchingToken(sourceFile, position);
            if (token.getStart(sourceFile) === position) {
                var matchKind = getMatchingTokenKind(token);
                // Ensure that there is a corresponding token to match ours.
                if (matchKind) {
                    var parentElement = token.parent;
                    var childNodes = parentElement.getChildren(sourceFile);
                    for (var _i = 0; _i < childNodes.length; _i++) {
                        var current = childNodes[_i];
                        if (current.kind === matchKind) {
                            var range1 = ts.createTextSpan(token.getStart(sourceFile), token.getWidth(sourceFile));
                            var range2 = ts.createTextSpan(current.getStart(sourceFile), current.getWidth(sourceFile));
                            // We want to order the braces when we return the result.
                            if (range1.start < range2.start) {
                                result.push(range1, range2);
                            }
                            else {
                                result.push(range2, range1);
                            }
                            break;
                        }
                    }
                }
            }
            return result;
            function getMatchingTokenKind(token) {
                switch (token.kind) {
                    case 14 /* OpenBraceToken */: return 15 /* CloseBraceToken */;
                    case 16 /* OpenParenToken */: return 17 /* CloseParenToken */;
                    case 18 /* OpenBracketToken */: return 19 /* CloseBracketToken */;
                    case 24 /* LessThanToken */: return 26 /* GreaterThanToken */;
                    case 15 /* CloseBraceToken */: return 14 /* OpenBraceToken */;
                    case 17 /* CloseParenToken */: return 16 /* OpenParenToken */;
                    case 19 /* CloseBracketToken */: return 18 /* OpenBracketToken */;
                    case 26 /* GreaterThanToken */: return 24 /* LessThanToken */;
                }
                return undefined;
            }
        }
        function getIndentationAtPosition(fileName, position, editorOptions) {
            var start = new Date().getTime();
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            log("getIndentationAtPosition: getCurrentSourceFile: " + (new Date().getTime() - start));
            start = new Date().getTime();
            var result = ts.formatting.SmartIndenter.getIndentation(position, sourceFile, editorOptions);
            log("getIndentationAtPosition: computeIndentation  : " + (new Date().getTime() - start));
            return result;
        }
        function getFormattingEditsForRange(fileName, start, end, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.formatting.formatSelection(start, end, sourceFile, getRuleProvider(options), options);
        }
        function getFormattingEditsForDocument(fileName, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.formatting.formatDocument(sourceFile, getRuleProvider(options), options);
        }
        function getFormattingEditsAfterKeystroke(fileName, position, key, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            if (key === "}") {
                return ts.formatting.formatOnClosingCurly(position, sourceFile, getRuleProvider(options), options);
            }
            else if (key === ";") {
                return ts.formatting.formatOnSemicolon(position, sourceFile, getRuleProvider(options), options);
            }
            else if (key === "\n") {
                return ts.formatting.formatOnEnter(position, sourceFile, getRuleProvider(options), options);
            }
            return [];
        }
        function getTodoComments(fileName, descriptors) {
            // Note: while getting todo comments seems like a syntactic operation, we actually 
            // treat it as a semantic operation here.  This is because we expect our host to call
            // this on every single file.  If we treat this syntactically, then that will cause
            // us to populate and throw away the tree in our syntax tree cache for each file.  By
            // treating this as a semantic operation, we can access any tree without throwing 
            // anything away.
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            cancellationToken.throwIfCancellationRequested();
            var fileContents = sourceFile.text;
            var result = [];
            if (descriptors.length > 0) {
                var regExp = getTodoCommentsRegExp();
                var matchArray;
                while (matchArray = regExp.exec(fileContents)) {
                    cancellationToken.throwIfCancellationRequested();
                    // If we got a match, here is what the match array will look like.  Say the source text is:
                    //
                    //      "    // hack   1"
                    //
                    // The result array with the regexp:    will be:
                    //
                    //      ["// hack   1", "// ", "hack   1", undefined, "hack"]
                    //
                    // Here are the relevant capture groups:
                    //  0) The full match for the entire regexp.
                    //  1) The preamble to the message portion.
                    //  2) The message portion.
                    //  3...N) The descriptor that was matched - by index.  'undefined' for each 
                    //         descriptor that didn't match.  an actual value if it did match.
                    //
                    //  i.e. 'undefined' in position 3 above means TODO(jason) didn't match.
                    //       "hack"      in position 4 means HACK did match.
                    var firstDescriptorCaptureIndex = 3;
                    ts.Debug.assert(matchArray.length === descriptors.length + firstDescriptorCaptureIndex);
                    var preamble = matchArray[1];
                    var matchPosition = matchArray.index + preamble.length;
                    // OK, we have found a match in the file.  This is only an acceptable match if
                    // it is contained within a comment.
                    var token = ts.getTokenAtPosition(sourceFile, matchPosition);
                    if (!isInsideComment(sourceFile, token, matchPosition)) {
                        continue;
                    }
                    var descriptor = undefined;
                    for (var i = 0, n = descriptors.length; i < n; i++) {
                        if (matchArray[i + firstDescriptorCaptureIndex]) {
                            descriptor = descriptors[i];
                        }
                    }
                    ts.Debug.assert(descriptor !== undefined);
                    // We don't want to match something like 'TODOBY', so we make sure a non 
                    // letter/digit follows the match.
                    if (isLetterOrDigit(fileContents.charCodeAt(matchPosition + descriptor.text.length))) {
                        continue;
                    }
                    var message = matchArray[2];
                    result.push({
                        descriptor: descriptor,
                        message: message,
                        position: matchPosition
                    });
                }
            }
            return result;
            function escapeRegExp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
            function getTodoCommentsRegExp() {
                // NOTE: ?:  means 'non-capture group'.  It allows us to have groups without having to
                // filter them out later in the final result array.
                // TODO comments can appear in one of the following forms:
                //
                //  1)      // TODO     or  /////////// TODO
                //
                //  2)      /* TODO     or  /********** TODO
                //
                //  3)      /*
                //           *   TODO
                //           */
                //
                // The following three regexps are used to match the start of the text up to the TODO
                // comment portion.
                var singleLineCommentStart = /(?:\/\/+\s*)/.source;
                var multiLineCommentStart = /(?:\/\*+\s*)/.source;
                var anyNumberOfSpacesAndAsterixesAtStartOfLine = /(?:^(?:\s|\*)*)/.source;
                // Match any of the above three TODO comment start regexps.
                // Note that the outermost group *is* a capture group.  We want to capture the preamble
                // so that we can determine the starting position of the TODO comment match.
                var preamble = "(" + anyNumberOfSpacesAndAsterixesAtStartOfLine + "|" + singleLineCommentStart + "|" + multiLineCommentStart + ")";
                // Takes the descriptors and forms a regexp that matches them as if they were literals.
                // For example, if the descriptors are "TODO(jason)" and "HACK", then this will be:
                //
                //      (?:(TODO\(jason\))|(HACK))
                //
                // Note that the outermost group is *not* a capture group, but the innermost groups
                // *are* capture groups.  By capturing the inner literals we can determine after 
                // matching which descriptor we are dealing with.
                var literals = "(?:" + ts.map(descriptors, function (d) { return "(" + escapeRegExp(d.text) + ")"; }).join("|") + ")";
                // After matching a descriptor literal, the following regexp matches the rest of the 
                // text up to the end of the line (or */).
                var endOfLineOrEndOfComment = /(?:$|\*\/)/.source;
                var messageRemainder = /(?:.*?)/.source;
                // This is the portion of the match we'll return as part of the TODO comment result. We
                // match the literal portion up to the end of the line or end of comment.
                var messagePortion = "(" + literals + messageRemainder + ")";
                var regExpString = preamble + messagePortion + endOfLineOrEndOfComment;
                // The final regexp will look like this:
                // /((?:\/\/+\s*)|(?:\/\*+\s*)|(?:^(?:\s|\*)*))((?:(TODO\(jason\))|(HACK))(?:.*?))(?:$|\*\/)/gim
                // The flags of the regexp are important here.
                //  'g' is so that we are doing a global search and can find matches several times
                //  in the input.
                //
                //  'i' is for case insensitivity (We do this to match C# TODO comment code).
                //
                //  'm' is so we can find matches in a multi-line input.
                return new RegExp(regExpString, "gim");
            }
            function isLetterOrDigit(char) {
                return (char >= 97 /* a */ && char <= 122 /* z */) ||
                    (char >= 65 /* A */ && char <= 90 /* Z */) ||
                    (char >= 48 /* _0 */ && char <= 57 /* _9 */);
            }
        }
        function getRenameInfo(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var typeChecker = program.getTypeChecker();
            var node = ts.getTouchingWord(sourceFile, position);
            // Can only rename an identifier.
            if (node && node.kind === 66 /* Identifier */) {
                var symbol = typeChecker.getSymbolAtLocation(node);
                // Only allow a symbol to be renamed if it actually has at least one declaration.
                if (symbol) {
                    var declarations = symbol.getDeclarations();
                    if (declarations && declarations.length > 0) {
                        // Disallow rename for elements that are defined in the standard TypeScript library.
                        var defaultLibFileName = host.getDefaultLibFileName(host.getCompilationSettings());
                        if (defaultLibFileName) {
                            for (var _i = 0; _i < declarations.length; _i++) {
                                var current = declarations[_i];
                                var sourceFile_1 = current.getSourceFile();
                                var canonicalName = getCanonicalFileName(ts.normalizePath(sourceFile_1.fileName));
                                if (sourceFile_1 && getCanonicalFileName(ts.normalizePath(sourceFile_1.fileName)) === getCanonicalFileName(ts.normalizePath(defaultLibFileName))) {
                                    return getRenameInfoError(ts.getLocaleSpecificMessage(ts.Diagnostics.You_cannot_rename_elements_that_are_defined_in_the_standard_TypeScript_library.key));
                                }
                            }
                        }
                        var displayName = ts.getDeclaredName(typeChecker, symbol, node);
                        var kind = getSymbolKind(symbol, node);
                        if (kind) {
                            return {
                                canRename: true,
                                localizedErrorMessage: undefined,
                                displayName: displayName,
                                fullDisplayName: typeChecker.getFullyQualifiedName(symbol),
                                kind: kind,
                                kindModifiers: getSymbolModifiers(symbol),
                                triggerSpan: ts.createTextSpan(node.getStart(), node.getWidth())
                            };
                        }
                    }
                }
            }
            return getRenameInfoError(ts.getLocaleSpecificMessage(ts.Diagnostics.You_cannot_rename_this_element.key));
            function getRenameInfoError(localizedErrorMessage) {
                return {
                    canRename: false,
                    localizedErrorMessage: localizedErrorMessage,
                    displayName: undefined,
                    fullDisplayName: undefined,
                    kind: undefined,
                    kindModifiers: undefined,
                    triggerSpan: undefined
                };
            }
        }
        return {
            dispose: dispose,
            cleanupSemanticCache: cleanupSemanticCache,
            getSyntacticDiagnostics: getSyntacticDiagnostics,
            getSemanticDiagnostics: getSemanticDiagnostics,
            getCompilerOptionsDiagnostics: getCompilerOptionsDiagnostics,
            getSyntacticClassifications: getSyntacticClassifications,
            getSemanticClassifications: getSemanticClassifications,
            getEncodedSyntacticClassifications: getEncodedSyntacticClassifications,
            getEncodedSemanticClassifications: getEncodedSemanticClassifications,
            getCompletionsAtPosition: getCompletionsAtPosition,
            getCompletionEntryDetails: getCompletionEntryDetails,
            getSignatureHelpItems: getSignatureHelpItems,
            getQuickInfoAtPosition: getQuickInfoAtPosition,
            getDefinitionAtPosition: getDefinitionAtPosition,
            getTypeDefinitionAtPosition: getTypeDefinitionAtPosition,
            getReferencesAtPosition: getReferencesAtPosition,
            findReferences: findReferences,
            getOccurrencesAtPosition: getOccurrencesAtPosition,
            getDocumentHighlights: getDocumentHighlights,
            getNameOrDottedNameSpan: getNameOrDottedNameSpan,
            getBreakpointStatementAtPosition: getBreakpointStatementAtPosition,
            getNavigateToItems: getNavigateToItems,
            getRenameInfo: getRenameInfo,
            findRenameLocations: findRenameLocations,
            getNavigationBarItems: getNavigationBarItems,
            getOutliningSpans: getOutliningSpans,
            getTodoComments: getTodoComments,
            getBraceMatchingAtPosition: getBraceMatchingAtPosition,
            getIndentationAtPosition: getIndentationAtPosition,
            getFormattingEditsForRange: getFormattingEditsForRange,
            getFormattingEditsForDocument: getFormattingEditsForDocument,
            getFormattingEditsAfterKeystroke: getFormattingEditsAfterKeystroke,
            getEmitOutput: getEmitOutput,
            getSourceFile: getSourceFile,
            getProgram: getProgram
        };
    }
    ts.createLanguageService = createLanguageService;
    /* @internal */
    function getNameTable(sourceFile) {
        if (!sourceFile.nameTable) {
            initializeNameTable(sourceFile);
        }
        return sourceFile.nameTable;
    }
    ts.getNameTable = getNameTable;
    function initializeNameTable(sourceFile) {
        var nameTable = {};
        walk(sourceFile);
        sourceFile.nameTable = nameTable;
        function walk(node) {
            switch (node.kind) {
                case 66 /* Identifier */:
                    nameTable[node.text] = node.text;
                    break;
                case 8 /* StringLiteral */:
                case 7 /* NumericLiteral */:
                    // We want to store any numbers/strings if they were a name that could be
                    // related to a declaration.  So, if we have 'import x = require("something")'
                    // then we want 'something' to be in the name table.  Similarly, if we have
                    // "a['propname']" then we want to store "propname" in the name table.
                    if (ts.isDeclarationName(node) ||
                        node.parent.kind === 227 /* ExternalModuleReference */ ||
                        isArgumentOfElementAccessExpression(node)) {
                        nameTable[node.text] = node.text;
                    }
                    break;
                default:
                    ts.forEachChild(node, walk);
            }
        }
    }
    function isArgumentOfElementAccessExpression(node) {
        return node &&
            node.parent &&
            node.parent.kind === 162 /* ElementAccessExpression */ &&
            node.parent.argumentExpression === node;
    }
    /// Classifier
    function createClassifier() {
        var scanner = ts.createScanner(2 /* Latest */, false);
        /// We do not have a full parser support to know when we should parse a regex or not
        /// If we consider every slash token to be a regex, we could be missing cases like "1/2/3", where
        /// we have a series of divide operator. this list allows us to be more accurate by ruling out 
        /// locations where a regexp cannot exist.
        var noRegexTable = [];
        noRegexTable[66 /* Identifier */] = true;
        noRegexTable[8 /* StringLiteral */] = true;
        noRegexTable[7 /* NumericLiteral */] = true;
        noRegexTable[9 /* RegularExpressionLiteral */] = true;
        noRegexTable[94 /* ThisKeyword */] = true;
        noRegexTable[39 /* PlusPlusToken */] = true;
        noRegexTable[40 /* MinusMinusToken */] = true;
        noRegexTable[17 /* CloseParenToken */] = true;
        noRegexTable[19 /* CloseBracketToken */] = true;
        noRegexTable[15 /* CloseBraceToken */] = true;
        noRegexTable[96 /* TrueKeyword */] = true;
        noRegexTable[81 /* FalseKeyword */] = true;
        // Just a stack of TemplateHeads and OpenCurlyBraces, used to perform rudimentary (inexact)
        // classification on template strings. Because of the context free nature of templates,
        // the only precise way to classify a template portion would be by propagating the stack across
        // lines, just as we do with the end-of-line state. However, this is a burden for implementers,
        // and the behavior is entirely subsumed by the syntactic classifier anyway, so we instead
        // flatten any nesting when the template stack is non-empty and encode it in the end-of-line state.
        // Situations in which this fails are
        //  1) When template strings are nested across different lines:
        //          `hello ${ `world
        //          ` }`
        //
        //     Where on the second line, you will get the closing of a template,
        //     a closing curly, and a new template.
        //
        //  2) When substitution expressions have curly braces and the curly brace falls on the next line:
        //          `hello ${ () => {
        //          return "world" } } `
        //
        //     Where on the second line, you will get the 'return' keyword,
        //     a string literal, and a template end consisting of '} } `'.
        var templateStack = [];
        /** Returns true if 'keyword2' can legally follow 'keyword1' in any language construct. */
        function canFollow(keyword1, keyword2) {
            if (ts.isAccessibilityModifier(keyword1)) {
                if (keyword2 === 119 /* GetKeyword */ ||
                    keyword2 === 125 /* SetKeyword */ ||
                    keyword2 === 117 /* ConstructorKeyword */ ||
                    keyword2 === 110 /* StaticKeyword */) {
                    // Allow things like "public get", "public constructor" and "public static".  
                    // These are all legal.
                    return true;
                }
                // Any other keyword following "public" is actually an identifier an not a real
                // keyword.
                return false;
            }
            // Assume any other keyword combination is legal.  This can be refined in the future
            // if there are more cases we want the classifier to be better at.
            return true;
        }
        function convertClassifications(classifications, text) {
            var entries = [];
            var dense = classifications.spans;
            var lastEnd = 0;
            for (var i = 0, n = dense.length; i < n; i += 3) {
                var start = dense[i];
                var length_1 = dense[i + 1];
                var type = dense[i + 2];
                // Make a whitespace entry between the last item and this one.
                if (lastEnd >= 0) {
                    var whitespaceLength_1 = start - lastEnd;
                    if (whitespaceLength_1 > 0) {
                        entries.push({ length: whitespaceLength_1, classification: TokenClass.Whitespace });
                    }
                }
                entries.push({ length: length_1, classification: convertClassification(type) });
                lastEnd = start + length_1;
            }
            var whitespaceLength = text.length - lastEnd;
            if (whitespaceLength > 0) {
                entries.push({ length: whitespaceLength, classification: TokenClass.Whitespace });
            }
            return { entries: entries, finalLexState: classifications.endOfLineState };
        }
        function convertClassification(type) {
            switch (type) {
                case 1 /* comment */: return TokenClass.Comment;
                case 3 /* keyword */: return TokenClass.Keyword;
                case 4 /* numericLiteral */: return TokenClass.NumberLiteral;
                case 5 /* operator */: return TokenClass.Operator;
                case 6 /* stringLiteral */: return TokenClass.StringLiteral;
                case 8 /* whiteSpace */: return TokenClass.Whitespace;
                case 10 /* punctuation */: return TokenClass.Punctuation;
                case 2 /* identifier */:
                case 11 /* className */:
                case 12 /* enumName */:
                case 13 /* interfaceName */:
                case 14 /* moduleName */:
                case 15 /* typeParameterName */:
                case 16 /* typeAliasName */:
                case 9 /* text */:
                case 17 /* parameterName */:
                default:
                    return TokenClass.Identifier;
            }
        }
        function getClassificationsForLine(text, lexState, syntacticClassifierAbsent) {
            return convertClassifications(getEncodedLexicalClassifications(text, lexState, syntacticClassifierAbsent), text);
        }
        // If there is a syntactic classifier ('syntacticClassifierAbsent' is false),
        // we will be more conservative in order to avoid conflicting with the syntactic classifier.
        function getEncodedLexicalClassifications(text, lexState, syntacticClassifierAbsent) {
            var offset = 0;
            var token = 0 /* Unknown */;
            var lastNonTriviaToken = 0 /* Unknown */;
            // Empty out the template stack for reuse.
            while (templateStack.length > 0) {
                templateStack.pop();
            }
            // If we're in a string literal, then prepend: "\
            // (and a newline).  That way when we lex we'll think we're still in a string literal.
            //
            // If we're in a multiline comment, then prepend: /*
            // (and a newline).  That way when we lex we'll think we're still in a multiline comment.
            switch (lexState) {
                case 3 /* InDoubleQuoteStringLiteral */:
                    text = '"\\\n' + text;
                    offset = 3;
                    break;
                case 2 /* InSingleQuoteStringLiteral */:
                    text = "'\\\n" + text;
                    offset = 3;
                    break;
                case 1 /* InMultiLineCommentTrivia */:
                    text = "/*\n" + text;
                    offset = 3;
                    break;
                case 4 /* InTemplateHeadOrNoSubstitutionTemplate */:
                    text = "`\n" + text;
                    offset = 2;
                    break;
                case 5 /* InTemplateMiddleOrTail */:
                    text = "}\n" + text;
                    offset = 2;
                // fallthrough
                case 6 /* InTemplateSubstitutionPosition */:
                    templateStack.push(11 /* TemplateHead */);
                    break;
            }
            scanner.setText(text);
            var result = {
                endOfLineState: 0 /* None */,
                spans: []
            };
            // We can run into an unfortunate interaction between the lexical and syntactic classifier
            // when the user is typing something generic.  Consider the case where the user types:
            //
            //      Foo<number
            //
            // From the lexical classifier's perspective, 'number' is a keyword, and so the word will
            // be classified as such.  However, from the syntactic classifier's tree-based perspective
            // this is simply an expression with the identifier 'number' on the RHS of the less than
            // token.  So the classification will go back to being an identifier.  The moment the user
            // types again, number will become a keyword, then an identifier, etc. etc.
            //
            // To try to avoid this problem, we avoid classifying contextual keywords as keywords 
            // when the user is potentially typing something generic.  We just can't do a good enough
            // job at the lexical level, and so well leave it up to the syntactic classifier to make
            // the determination.
            //
            // In order to determine if the user is potentially typing something generic, we use a 
            // weak heuristic where we track < and > tokens.  It's a weak heuristic, but should
            // work well enough in practice.
            var angleBracketStack = 0;
            do {
                token = scanner.scan();
                if (!ts.isTrivia(token)) {
                    if ((token === 37 /* SlashToken */ || token === 58 /* SlashEqualsToken */) && !noRegexTable[lastNonTriviaToken]) {
                        if (scanner.reScanSlashToken() === 9 /* RegularExpressionLiteral */) {
                            token = 9 /* RegularExpressionLiteral */;
                        }
                    }
                    else if (lastNonTriviaToken === 20 /* DotToken */ && isKeyword(token)) {
                        token = 66 /* Identifier */;
                    }
                    else if (isKeyword(lastNonTriviaToken) && isKeyword(token) && !canFollow(lastNonTriviaToken, token)) {
                        // We have two keywords in a row.  Only treat the second as a keyword if 
                        // it's a sequence that could legally occur in the language.  Otherwise
                        // treat it as an identifier.  This way, if someone writes "private var"
                        // we recognize that 'var' is actually an identifier here.
                        token = 66 /* Identifier */;
                    }
                    else if (lastNonTriviaToken === 66 /* Identifier */ &&
                        token === 24 /* LessThanToken */) {
                        // Could be the start of something generic.  Keep track of that by bumping 
                        // up the current count of generic contexts we may be in.
                        angleBracketStack++;
                    }
                    else if (token === 26 /* GreaterThanToken */ && angleBracketStack > 0) {
                        // If we think we're currently in something generic, then mark that that
                        // generic entity is complete.
                        angleBracketStack--;
                    }
                    else if (token === 113 /* AnyKeyword */ ||
                        token === 126 /* StringKeyword */ ||
                        token === 124 /* NumberKeyword */ ||
                        token === 116 /* BooleanKeyword */ ||
                        token === 127 /* SymbolKeyword */) {
                        if (angleBracketStack > 0 && !syntacticClassifierAbsent) {
                            // If it looks like we're could be in something generic, don't classify this 
                            // as a keyword.  We may just get overwritten by the syntactic classifier,
                            // causing a noisy experience for the user.
                            token = 66 /* Identifier */;
                        }
                    }
                    else if (token === 11 /* TemplateHead */) {
                        templateStack.push(token);
                    }
                    else if (token === 14 /* OpenBraceToken */) {
                        // If we don't have anything on the template stack,
                        // then we aren't trying to keep track of a previously scanned template head.
                        if (templateStack.length > 0) {
                            templateStack.push(token);
                        }
                    }
                    else if (token === 15 /* CloseBraceToken */) {
                        // If we don't have anything on the template stack,
                        // then we aren't trying to keep track of a previously scanned template head.
                        if (templateStack.length > 0) {
                            var lastTemplateStackToken = ts.lastOrUndefined(templateStack);
                            if (lastTemplateStackToken === 11 /* TemplateHead */) {
                                token = scanner.reScanTemplateToken();
                                // Only pop on a TemplateTail; a TemplateMiddle indicates there is more for us.
                                if (token === 13 /* TemplateTail */) {
                                    templateStack.pop();
                                }
                                else {
                                    ts.Debug.assert(token === 12 /* TemplateMiddle */, "Should have been a template middle. Was " + token);
                                }
                            }
                            else {
                                ts.Debug.assert(lastTemplateStackToken === 14 /* OpenBraceToken */, "Should have been an open brace. Was: " + token);
                                templateStack.pop();
                            }
                        }
                    }
                    lastNonTriviaToken = token;
                }
                processToken();
            } while (token !== 1 /* EndOfFileToken */);
            return result;
            function processToken() {
                var start = scanner.getTokenPos();
                var end = scanner.getTextPos();
                addResult(start, end, classFromKind(token));
                if (end >= text.length) {
                    if (token === 8 /* StringLiteral */) {
                        // Check to see if we finished up on a multiline string literal.
                        var tokenText = scanner.getTokenText();
                        if (scanner.isUnterminated()) {
                            var lastCharIndex = tokenText.length - 1;
                            var numBackslashes = 0;
                            while (tokenText.charCodeAt(lastCharIndex - numBackslashes) === 92 /* backslash */) {
                                numBackslashes++;
                            }
                            // If we have an odd number of backslashes, then the multiline string is unclosed
                            if (numBackslashes & 1) {
                                var quoteChar = tokenText.charCodeAt(0);
                                result.endOfLineState = quoteChar === 34 /* doubleQuote */
                                    ? 3 /* InDoubleQuoteStringLiteral */
                                    : 2 /* InSingleQuoteStringLiteral */;
                            }
                        }
                    }
                    else if (token === 3 /* MultiLineCommentTrivia */) {
                        // Check to see if the multiline comment was unclosed.
                        if (scanner.isUnterminated()) {
                            result.endOfLineState = 1 /* InMultiLineCommentTrivia */;
                        }
                    }
                    else if (ts.isTemplateLiteralKind(token)) {
                        if (scanner.isUnterminated()) {
                            if (token === 13 /* TemplateTail */) {
                                result.endOfLineState = 5 /* InTemplateMiddleOrTail */;
                            }
                            else if (token === 10 /* NoSubstitutionTemplateLiteral */) {
                                result.endOfLineState = 4 /* InTemplateHeadOrNoSubstitutionTemplate */;
                            }
                            else {
                                ts.Debug.fail("Only 'NoSubstitutionTemplateLiteral's and 'TemplateTail's can be unterminated; got SyntaxKind #" + token);
                            }
                        }
                    }
                    else if (templateStack.length > 0 && ts.lastOrUndefined(templateStack) === 11 /* TemplateHead */) {
                        result.endOfLineState = 6 /* InTemplateSubstitutionPosition */;
                    }
                }
            }
            function addResult(start, end, classification) {
                if (classification === 8 /* whiteSpace */) {
                    // Don't bother with whitespace classifications.  They're not needed.
                    return;
                }
                if (start === 0 && offset > 0) {
                    // We're classifying the first token, and this was a case where we prepended 
                    // text.  We should consider the start of this token to be at the start of 
                    // the original text.
                    start += offset;
                }
                // All our tokens are in relation to the augmented text.  Move them back to be
                // relative to the original text.
                start -= offset;
                end -= offset;
                var length = end - start;
                if (length > 0) {
                    result.spans.push(start);
                    result.spans.push(length);
                    result.spans.push(classification);
                }
            }
        }
        function isBinaryExpressionOperatorToken(token) {
            switch (token) {
                case 36 /* AsteriskToken */:
                case 37 /* SlashToken */:
                case 38 /* PercentToken */:
                case 34 /* PlusToken */:
                case 35 /* MinusToken */:
                case 41 /* LessThanLessThanToken */:
                case 42 /* GreaterThanGreaterThanToken */:
                case 43 /* GreaterThanGreaterThanGreaterThanToken */:
                case 24 /* LessThanToken */:
                case 26 /* GreaterThanToken */:
                case 27 /* LessThanEqualsToken */:
                case 28 /* GreaterThanEqualsToken */:
                case 88 /* InstanceOfKeyword */:
                case 87 /* InKeyword */:
                case 29 /* EqualsEqualsToken */:
                case 30 /* ExclamationEqualsToken */:
                case 31 /* EqualsEqualsEqualsToken */:
                case 32 /* ExclamationEqualsEqualsToken */:
                case 44 /* AmpersandToken */:
                case 46 /* CaretToken */:
                case 45 /* BarToken */:
                case 49 /* AmpersandAmpersandToken */:
                case 50 /* BarBarToken */:
                case 64 /* BarEqualsToken */:
                case 63 /* AmpersandEqualsToken */:
                case 65 /* CaretEqualsToken */:
                case 60 /* LessThanLessThanEqualsToken */:
                case 61 /* GreaterThanGreaterThanEqualsToken */:
                case 62 /* GreaterThanGreaterThanGreaterThanEqualsToken */:
                case 55 /* PlusEqualsToken */:
                case 56 /* MinusEqualsToken */:
                case 57 /* AsteriskEqualsToken */:
                case 58 /* SlashEqualsToken */:
                case 59 /* PercentEqualsToken */:
                case 54 /* EqualsToken */:
                case 23 /* CommaToken */:
                    return true;
                default:
                    return false;
            }
        }
        function isPrefixUnaryExpressionOperatorToken(token) {
            switch (token) {
                case 34 /* PlusToken */:
                case 35 /* MinusToken */:
                case 48 /* TildeToken */:
                case 47 /* ExclamationToken */:
                case 39 /* PlusPlusToken */:
                case 40 /* MinusMinusToken */:
                    return true;
                default:
                    return false;
            }
        }
        function isKeyword(token) {
            return token >= 67 /* FirstKeyword */ && token <= 130 /* LastKeyword */;
        }
        function classFromKind(token) {
            if (isKeyword(token)) {
                return 3 /* keyword */;
            }
            else if (isBinaryExpressionOperatorToken(token) || isPrefixUnaryExpressionOperatorToken(token)) {
                return 5 /* operator */;
            }
            else if (token >= 14 /* FirstPunctuation */ && token <= 65 /* LastPunctuation */) {
                return 10 /* punctuation */;
            }
            switch (token) {
                case 7 /* NumericLiteral */:
                    return 4 /* numericLiteral */;
                case 8 /* StringLiteral */:
                    return 6 /* stringLiteral */;
                case 9 /* RegularExpressionLiteral */:
                    return 7 /* regularExpressionLiteral */;
                case 6 /* ConflictMarkerTrivia */:
                case 3 /* MultiLineCommentTrivia */:
                case 2 /* SingleLineCommentTrivia */:
                    return 1 /* comment */;
                case 5 /* WhitespaceTrivia */:
                case 4 /* NewLineTrivia */:
                    return 8 /* whiteSpace */;
                case 66 /* Identifier */:
                default:
                    if (ts.isTemplateLiteralKind(token)) {
                        return 6 /* stringLiteral */;
                    }
                    return 2 /* identifier */;
            }
        }
        return {
            getClassificationsForLine: getClassificationsForLine,
            getEncodedLexicalClassifications: getEncodedLexicalClassifications
        };
    }
    ts.createClassifier = createClassifier;
    /**
      * Get the path of the default library files (lib.d.ts) as distributed with the typescript
      * node package.
      * The functionality is not supported if the ts module is consumed outside of a node module.
      */
    function getDefaultLibFilePath(options) {
        // Check __dirname is defined and that we are on a node.js system.
        if (typeof __dirname !== "undefined") {
            return __dirname + ts.directorySeparator + ts.getDefaultLibFileName(options);
        }
        throw new Error("getDefaultLibFilePath is only supported when consumed as a node module. ");
    }
    ts.getDefaultLibFilePath = getDefaultLibFilePath;
    function initializeServices() {
        ts.objectAllocator = {
            getNodeConstructor: function (kind) {
                function Node() {
                }
                var proto = kind === 243 /* SourceFile */ ? new SourceFileObject() : new NodeObject();
                proto.kind = kind;
                proto.pos = 0;
                proto.end = 0;
                proto.flags = 0;
                proto.parent = undefined;
                Node.prototype = proto;
                return Node;
            },
            getSymbolConstructor: function () { return SymbolObject; },
            getTypeConstructor: function () { return TypeObject; },
            getSignatureConstructor: function () { return SignatureObject; }
        };
    }
    initializeServices();
})(ts || (ts = {}));
