/// <reference path='services.ts' />
/* @internal */
var ts;
(function (ts) {
    var NavigationBar;
    (function (NavigationBar) {
        function getNavigationBarItems(sourceFile) {
            // If the source file has any child items, then it included in the tree
            // and takes lexical ownership of all other top-level items.
            var hasGlobalNode = false;
            return getItemsWorker(getTopLevelNodes(sourceFile), createTopLevelItem);
            function getIndent(node) {
                // If we have a global node in the tree,
                // then it adds an extra layer of depth to all subnodes.
                var indent = hasGlobalNode ? 1 : 0;
                var current = node.parent;
                while (current) {
                    switch (current.kind) {
                        case 213 /* ModuleDeclaration */:
                            // If we have a module declared as A.B.C, it is more "intuitive"
                            // to say it only has a single layer of depth
                            do {
                                current = current.parent;
                            } while (current.kind === 213 /* ModuleDeclaration */);
                        // fall through
                        case 209 /* ClassDeclaration */:
                        case 212 /* EnumDeclaration */:
                        case 210 /* InterfaceDeclaration */:
                        case 208 /* FunctionDeclaration */:
                            indent++;
                    }
                    current = current.parent;
                }
                return indent;
            }
            function getChildNodes(nodes) {
                var childNodes = [];
                function visit(node) {
                    switch (node.kind) {
                        case 188 /* VariableStatement */:
                            ts.forEach(node.declarationList.declarations, visit);
                            break;
                        case 156 /* ObjectBindingPattern */:
                        case 157 /* ArrayBindingPattern */:
                            ts.forEach(node.elements, visit);
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
                                    childNodes.push(importClause);
                                }
                                // Handle named bindings in imports e.g.:
                                //    import * as NS from "mod";
                                //    import {a, b as B} from "mod";
                                if (importClause.namedBindings) {
                                    if (importClause.namedBindings.kind === 219 /* NamespaceImport */) {
                                        childNodes.push(importClause.namedBindings);
                                    }
                                    else {
                                        ts.forEach(importClause.namedBindings.elements, visit);
                                    }
                                }
                            }
                            break;
                        case 158 /* BindingElement */:
                        case 206 /* VariableDeclaration */:
                            if (ts.isBindingPattern(node.name)) {
                                visit(node.name);
                                break;
                            }
                        // Fall through
                        case 209 /* ClassDeclaration */:
                        case 212 /* EnumDeclaration */:
                        case 210 /* InterfaceDeclaration */:
                        case 213 /* ModuleDeclaration */:
                        case 208 /* FunctionDeclaration */:
                        case 216 /* ImportEqualsDeclaration */:
                        case 221 /* ImportSpecifier */:
                        case 225 /* ExportSpecifier */:
                            childNodes.push(node);
                            break;
                    }
                }
                //for (let i = 0, n = nodes.length; i < n; i++) {
                //    let node = nodes[i];
                //    if (node.kind === SyntaxKind.ClassDeclaration ||
                //        node.kind === SyntaxKind.EnumDeclaration ||
                //        node.kind === SyntaxKind.InterfaceDeclaration ||
                //        node.kind === SyntaxKind.ModuleDeclaration ||
                //        node.kind === SyntaxKind.FunctionDeclaration) {
                //        childNodes.push(node);
                //    }
                //    else if (node.kind === SyntaxKind.VariableStatement) {
                //        childNodes.push.apply(childNodes, (<VariableStatement>node).declarations);
                //    }
                //}
                ts.forEach(nodes, visit);
                return sortNodes(childNodes);
            }
            function getTopLevelNodes(node) {
                var topLevelNodes = [];
                topLevelNodes.push(node);
                addTopLevelNodes(node.statements, topLevelNodes);
                return topLevelNodes;
            }
            function sortNodes(nodes) {
                return nodes.slice(0).sort(function (n1, n2) {
                    if (n1.name && n2.name) {
                        return ts.getPropertyNameForPropertyNameNode(n1.name).localeCompare(ts.getPropertyNameForPropertyNameNode(n2.name));
                    }
                    else if (n1.name) {
                        return 1;
                    }
                    else if (n2.name) {
                        return -1;
                    }
                    else {
                        return n1.kind - n2.kind;
                    }
                });
            }
            function addTopLevelNodes(nodes, topLevelNodes) {
                nodes = sortNodes(nodes);
                for (var _i = 0; _i < nodes.length; _i++) {
                    var node = nodes[_i];
                    switch (node.kind) {
                        case 209 /* ClassDeclaration */:
                        case 212 /* EnumDeclaration */:
                        case 210 /* InterfaceDeclaration */:
                            topLevelNodes.push(node);
                            break;
                        case 213 /* ModuleDeclaration */:
                            var moduleDeclaration = node;
                            topLevelNodes.push(node);
                            addTopLevelNodes(getInnermostModule(moduleDeclaration).body.statements, topLevelNodes);
                            break;
                        case 208 /* FunctionDeclaration */:
                            var functionDeclaration = node;
                            if (isTopLevelFunctionDeclaration(functionDeclaration)) {
                                topLevelNodes.push(node);
                                addTopLevelNodes(functionDeclaration.body.statements, topLevelNodes);
                            }
                            break;
                    }
                }
            }
            function isTopLevelFunctionDeclaration(functionDeclaration) {
                if (functionDeclaration.kind === 208 /* FunctionDeclaration */) {
                    // A function declaration is 'top level' if it contains any function declarations 
                    // within it. 
                    if (functionDeclaration.body && functionDeclaration.body.kind === 187 /* Block */) {
                        // Proper function declarations can only have identifier names
                        if (ts.forEach(functionDeclaration.body.statements, function (s) { return s.kind === 208 /* FunctionDeclaration */ && !isEmpty(s.name.text); })) {
                            return true;
                        }
                        // Or if it is not parented by another function.  i.e all functions
                        // at module scope are 'top level'.
                        if (!ts.isFunctionBlock(functionDeclaration.parent)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            function getItemsWorker(nodes, createItem) {
                var items = [];
                var keyToItem = {};
                for (var _i = 0; _i < nodes.length; _i++) {
                    var child = nodes[_i];
                    var item = createItem(child);
                    if (item !== undefined) {
                        if (item.text.length > 0) {
                            var key = item.text + "-" + item.kind + "-" + item.indent;
                            var itemWithSameName = keyToItem[key];
                            if (itemWithSameName) {
                                // We had an item with the same name.  Merge these items together.
                                merge(itemWithSameName, item);
                            }
                            else {
                                keyToItem[key] = item;
                                items.push(item);
                            }
                        }
                    }
                }
                return items;
            }
            function merge(target, source) {
                // First, add any spans in the source to the target.
                target.spans.push.apply(target.spans, source.spans);
                if (source.childItems) {
                    if (!target.childItems) {
                        target.childItems = [];
                    }
                    // Next, recursively merge or add any children in the source as appropriate.
                    outer: for (var _i = 0, _a = source.childItems; _i < _a.length; _i++) {
                        var sourceChild = _a[_i];
                        for (var _b = 0, _c = target.childItems; _b < _c.length; _b++) {
                            var targetChild = _c[_b];
                            if (targetChild.text === sourceChild.text && targetChild.kind === sourceChild.kind) {
                                // Found a match.  merge them.
                                merge(targetChild, sourceChild);
                                continue outer;
                            }
                        }
                        // Didn't find a match, just add this child to the list.
                        target.childItems.push(sourceChild);
                    }
                }
            }
            function createChildItem(node) {
                switch (node.kind) {
                    case 134 /* Parameter */:
                        if (ts.isBindingPattern(node.name)) {
                            break;
                        }
                        if ((node.flags & 131571 /* Modifier */) === 0) {
                            return undefined;
                        }
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberFunctionElement);
                    case 141 /* GetAccessor */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberGetAccessorElement);
                    case 142 /* SetAccessor */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberSetAccessorElement);
                    case 145 /* IndexSignature */:
                        return createItem(node, "[]", ts.ScriptElementKind.indexSignatureElement);
                    case 242 /* EnumMember */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 143 /* CallSignature */:
                        return createItem(node, "()", ts.ScriptElementKind.callSignatureElement);
                    case 144 /* ConstructSignature */:
                        return createItem(node, "new()", ts.ScriptElementKind.constructSignatureElement);
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 208 /* FunctionDeclaration */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.functionElement);
                    case 206 /* VariableDeclaration */:
                    case 158 /* BindingElement */:
                        var variableDeclarationNode;
                        var name_1;
                        if (node.kind === 158 /* BindingElement */) {
                            name_1 = node.name;
                            variableDeclarationNode = node;
                            // binding elements are added only for variable declarations
                            // bubble up to the containing variable declaration
                            while (variableDeclarationNode && variableDeclarationNode.kind !== 206 /* VariableDeclaration */) {
                                variableDeclarationNode = variableDeclarationNode.parent;
                            }
                            ts.Debug.assert(variableDeclarationNode !== undefined);
                        }
                        else {
                            ts.Debug.assert(!ts.isBindingPattern(node.name));
                            variableDeclarationNode = node;
                            name_1 = node.name;
                        }
                        if (ts.isConst(variableDeclarationNode)) {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.constElement);
                        }
                        else if (ts.isLet(variableDeclarationNode)) {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.letElement);
                        }
                        else {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.variableElement);
                        }
                    case 140 /* Constructor */:
                        return createItem(node, "constructor", ts.ScriptElementKind.constructorImplementationElement);
                    case 225 /* ExportSpecifier */:
                    case 221 /* ImportSpecifier */:
                    case 216 /* ImportEqualsDeclaration */:
                    case 218 /* ImportClause */:
                    case 219 /* NamespaceImport */:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.alias);
                }
                return undefined;
                function createItem(node, name, scriptElementKind) {
                    return getNavigationBarItem(name, scriptElementKind, ts.getNodeModifiers(node), [getNodeSpan(node)]);
                }
            }
            function isEmpty(text) {
                return !text || text.trim() === "";
            }
            function getNavigationBarItem(text, kind, kindModifiers, spans, childItems, indent) {
                if (childItems === void 0) { childItems = []; }
                if (indent === void 0) { indent = 0; }
                if (isEmpty(text)) {
                    return undefined;
                }
                return {
                    text: text,
                    kind: kind,
                    kindModifiers: kindModifiers,
                    spans: spans,
                    childItems: childItems,
                    indent: indent,
                    bolded: false,
                    grayed: false
                };
            }
            function createTopLevelItem(node) {
                switch (node.kind) {
                    case 243 /* SourceFile */:
                        return createSourceFileItem(node);
                    case 209 /* ClassDeclaration */:
                        return createClassItem(node);
                    case 212 /* EnumDeclaration */:
                        return createEnumItem(node);
                    case 210 /* InterfaceDeclaration */:
                        return createIterfaceItem(node);
                    case 213 /* ModuleDeclaration */:
                        return createModuleItem(node);
                    case 208 /* FunctionDeclaration */:
                        return createFunctionItem(node);
                }
                return undefined;
                function getModuleName(moduleDeclaration) {
                    // We want to maintain quotation marks.
                    if (moduleDeclaration.name.kind === 8 /* StringLiteral */) {
                        return getTextOfNode(moduleDeclaration.name);
                    }
                    // Otherwise, we need to aggregate each identifier to build up the qualified name.
                    var result = [];
                    result.push(moduleDeclaration.name.text);
                    while (moduleDeclaration.body && moduleDeclaration.body.kind === 213 /* ModuleDeclaration */) {
                        moduleDeclaration = moduleDeclaration.body;
                        result.push(moduleDeclaration.name.text);
                    }
                    return result.join(".");
                }
                function createModuleItem(node) {
                    var moduleName = getModuleName(node);
                    var childItems = getItemsWorker(getChildNodes(getInnermostModule(node).body.statements), createChildItem);
                    return getNavigationBarItem(moduleName, ts.ScriptElementKind.moduleElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createFunctionItem(node) {
                    if (node.body && node.body.kind === 187 /* Block */) {
                        var childItems = getItemsWorker(sortNodes(node.body.statements), createChildItem);
                        return getNavigationBarItem(!node.name ? "default" : node.name.text, ts.ScriptElementKind.functionElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                    }
                    return undefined;
                }
                function createSourceFileItem(node) {
                    var childItems = getItemsWorker(getChildNodes(node.statements), createChildItem);
                    if (childItems === undefined || childItems.length === 0) {
                        return undefined;
                    }
                    hasGlobalNode = true;
                    var rootName = ts.isExternalModule(node)
                        ? "\"" + ts.escapeString(ts.getBaseFileName(ts.removeFileExtension(ts.normalizePath(node.fileName)))) + "\""
                        : "<global>";
                    return getNavigationBarItem(rootName, ts.ScriptElementKind.moduleElement, ts.ScriptElementKindModifier.none, [getNodeSpan(node)], childItems);
                }
                function createClassItem(node) {
                    var childItems;
                    if (node.members) {
                        var constructor = ts.forEach(node.members, function (member) {
                            return member.kind === 140 /* Constructor */ && member;
                        });
                        // Add the constructor parameters in as children of the class (for property parameters).
                        // Note that *all non-binding pattern named* parameters will be added to the nodes array, but parameters that
                        // are not properties will be filtered out later by createChildItem.
                        var nodes = removeDynamicallyNamedProperties(node);
                        if (constructor) {
                            nodes.push.apply(nodes, ts.filter(constructor.parameters, function (p) { return !ts.isBindingPattern(p.name); }));
                        }
                        childItems = getItemsWorker(sortNodes(nodes), createChildItem);
                    }
                    var nodeName = !node.name ? "default" : node.name.text;
                    return getNavigationBarItem(nodeName, ts.ScriptElementKind.classElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createEnumItem(node) {
                    var childItems = getItemsWorker(sortNodes(removeComputedProperties(node)), createChildItem);
                    return getNavigationBarItem(node.name.text, ts.ScriptElementKind.enumElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createIterfaceItem(node) {
                    var childItems = getItemsWorker(sortNodes(removeDynamicallyNamedProperties(node)), createChildItem);
                    return getNavigationBarItem(node.name.text, ts.ScriptElementKind.interfaceElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
            }
            function removeComputedProperties(node) {
                return ts.filter(node.members, function (member) { return member.name === undefined || member.name.kind !== 132 /* ComputedPropertyName */; });
            }
            /**
             * Like removeComputedProperties, but retains the properties with well known symbol names
             */
            function removeDynamicallyNamedProperties(node) {
                return ts.filter(node.members, function (member) { return !ts.hasDynamicName(member); });
            }
            function getInnermostModule(node) {
                while (node.body.kind === 213 /* ModuleDeclaration */) {
                    node = node.body;
                }
                return node;
            }
            function getNodeSpan(node) {
                return node.kind === 243 /* SourceFile */
                    ? ts.createTextSpanFromBounds(node.getFullStart(), node.getEnd())
                    : ts.createTextSpanFromBounds(node.getStart(), node.getEnd());
            }
            function getTextOfNode(node) {
                return ts.getTextOfNodeFromSourceText(sourceFile.text, node);
            }
        }
        NavigationBar.getNavigationBarItems = getNavigationBarItems;
    })(NavigationBar = ts.NavigationBar || (ts.NavigationBar = {}));
})(ts || (ts = {}));
