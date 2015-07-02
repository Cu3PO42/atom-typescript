/// <reference path="binder.ts"/>
/* @internal */
var ts;
(function (ts) {
    var nextSymbolId = 1;
    var nextNodeId = 1;
    var nextMergeId = 1;
    function getNodeId(node) {
        if (!node.id)
            node.id = nextNodeId++;
        return node.id;
    }
    ts.getNodeId = getNodeId;
    ts.checkTime = 0;
    function getSymbolId(symbol) {
        if (!symbol.id) {
            symbol.id = nextSymbolId++;
        }
        return symbol.id;
    }
    ts.getSymbolId = getSymbolId;
    function createTypeChecker(host, produceDiagnostics) {
        var Symbol = ts.objectAllocator.getSymbolConstructor();
        var Type = ts.objectAllocator.getTypeConstructor();
        var Signature = ts.objectAllocator.getSignatureConstructor();
        var typeCount = 0;
        var emptyArray = [];
        var emptySymbols = {};
        var compilerOptions = host.getCompilerOptions();
        var languageVersion = compilerOptions.target || 0 /* ES3 */;
        var emitResolver = createResolver();
        var undefinedSymbol = createSymbol(4 /* Property */ | 67108864 /* Transient */, "undefined");
        var argumentsSymbol = createSymbol(4 /* Property */ | 67108864 /* Transient */, "arguments");
        var checker = {
            getNodeCount: function () { return ts.sum(host.getSourceFiles(), "nodeCount"); },
            getIdentifierCount: function () { return ts.sum(host.getSourceFiles(), "identifierCount"); },
            getSymbolCount: function () { return ts.sum(host.getSourceFiles(), "symbolCount"); },
            getTypeCount: function () { return typeCount; },
            isUndefinedSymbol: function (symbol) { return symbol === undefinedSymbol; },
            isArgumentsSymbol: function (symbol) { return symbol === argumentsSymbol; },
            getDiagnostics: getDiagnostics,
            getGlobalDiagnostics: getGlobalDiagnostics,
            getTypeOfSymbolAtLocation: getTypeOfSymbolAtLocation,
            getDeclaredTypeOfSymbol: getDeclaredTypeOfSymbol,
            getPropertiesOfType: getPropertiesOfType,
            getPropertyOfType: getPropertyOfType,
            getSignaturesOfType: getSignaturesOfType,
            getIndexTypeOfType: getIndexTypeOfType,
            getReturnTypeOfSignature: getReturnTypeOfSignature,
            getSymbolsInScope: getSymbolsInScope,
            getSymbolAtLocation: getSymbolAtLocation,
            getShorthandAssignmentValueSymbol: getShorthandAssignmentValueSymbol,
            getTypeAtLocation: getTypeAtLocation,
            typeToString: typeToString,
            getSymbolDisplayBuilder: getSymbolDisplayBuilder,
            symbolToString: symbolToString,
            getAugmentedPropertiesOfType: getAugmentedPropertiesOfType,
            getRootSymbols: getRootSymbols,
            getContextualType: getContextualType,
            getFullyQualifiedName: getFullyQualifiedName,
            getResolvedSignature: getResolvedSignature,
            getConstantValue: getConstantValue,
            isValidPropertyAccess: isValidPropertyAccess,
            getSignatureFromDeclaration: getSignatureFromDeclaration,
            isImplementationOfOverload: isImplementationOfOverload,
            getAliasedSymbol: resolveAlias,
            getEmitResolver: getEmitResolver,
            getExportsOfModule: getExportsOfModuleAsArray,
            getJsxElementAttributesType: getJsxElementAttributesType,
            getJsxIntrinsicTagNames: getJsxIntrinsicTagNames
        };
        var unknownSymbol = createSymbol(4 /* Property */ | 67108864 /* Transient */, "unknown");
        var resolvingSymbol = createSymbol(67108864 /* Transient */, "__resolving__");
        var anyType = createIntrinsicType(1 /* Any */, "any");
        var stringType = createIntrinsicType(2 /* String */, "string");
        var numberType = createIntrinsicType(4 /* Number */, "number");
        var booleanType = createIntrinsicType(8 /* Boolean */, "boolean");
        var esSymbolType = createIntrinsicType(2097152 /* ESSymbol */, "symbol");
        var voidType = createIntrinsicType(16 /* Void */, "void");
        var undefinedType = createIntrinsicType(32 /* Undefined */ | 524288 /* ContainsUndefinedOrNull */, "undefined");
        var nullType = createIntrinsicType(64 /* Null */ | 524288 /* ContainsUndefinedOrNull */, "null");
        var unknownType = createIntrinsicType(1 /* Any */, "unknown");
        var circularType = createIntrinsicType(1 /* Any */, "__circular__");
        var emptyObjectType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var emptyGenericType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        emptyGenericType.instantiations = {};
        var anyFunctionType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var noConstraintType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var anySignature = createSignature(undefined, undefined, emptyArray, anyType, undefined, 0, false, false);
        var unknownSignature = createSignature(undefined, undefined, emptyArray, unknownType, undefined, 0, false, false);
        var globals = {};
        var globalESSymbolConstructorSymbol;
        var getGlobalPromiseConstructorSymbol;
        var globalObjectType;
        var globalFunctionType;
        var globalArrayType;
        var globalStringType;
        var globalNumberType;
        var globalBooleanType;
        var globalRegExpType;
        var globalTemplateStringsArrayType;
        var globalESSymbolType;
        var jsxElementType;
        /** Lazily loaded, use getJsxIntrinsicElementType() */
        var jsxIntrinsicElementsType;
        var globalIterableType;
        var globalIteratorType;
        var globalIterableIteratorType;
        var anyArrayType;
        var getGlobalClassDecoratorType;
        var getGlobalParameterDecoratorType;
        var getGlobalPropertyDecoratorType;
        var getGlobalMethodDecoratorType;
        var getGlobalTypedPropertyDescriptorType;
        var getGlobalPromiseType;
        var tryGetGlobalPromiseType;
        var getGlobalPromiseLikeType;
        var getInstantiatedGlobalPromiseLikeType;
        var getGlobalPromiseConstructorLikeType;
        var getGlobalThenableType;
        var tupleTypes = {};
        var unionTypes = {};
        var stringLiteralTypes = {};
        var emitExtends = false;
        var emitDecorate = false;
        var emitParam = false;
        var emitAwaiter = false;
        var emitGenerator = false;
        var resolutionTargets = [];
        var resolutionResults = [];
        var mergedSymbols = [];
        var symbolLinks = [];
        var nodeLinks = [];
        var potentialThisCollisions = [];
        var awaitedTypeStack = [];
        var diagnostics = ts.createDiagnosticCollection();
        var primitiveTypeInfo = {
            "string": {
                type: stringType,
                flags: 258 /* StringLike */
            },
            "number": {
                type: numberType,
                flags: 132 /* NumberLike */
            },
            "boolean": {
                type: booleanType,
                flags: 8 /* Boolean */
            },
            "symbol": {
                type: esSymbolType,
                flags: 2097152 /* ESSymbol */
            }
        };
        var JsxNames = {
            JSX: "JSX",
            IntrinsicElements: "IntrinsicElements",
            ElementClass: "ElementClass",
            ElementAttributesPropertyNameContainer: "ElementAttributesProperty",
            Element: "Element"
        };
        var subtypeRelation = {};
        var assignableRelation = {};
        var identityRelation = {};
        initializeTypeChecker();
        return checker;
        function getEmitResolver(sourceFile) {
            // Ensure we have all the type information in place for this file so that all the
            // emitter questions of this resolver will return the right information.
            getDiagnostics(sourceFile);
            return emitResolver;
        }
        function error(location, message, arg0, arg1, arg2) {
            var diagnostic = location
                ? ts.createDiagnosticForNode(location, message, arg0, arg1, arg2)
                : ts.createCompilerDiagnostic(message, arg0, arg1, arg2);
            diagnostics.add(diagnostic);
        }
        function createSymbol(flags, name) {
            return new Symbol(flags, name);
        }
        function getExcludedSymbolFlags(flags) {
            var result = 0;
            if (flags & 2 /* BlockScopedVariable */)
                result |= 107455 /* BlockScopedVariableExcludes */;
            if (flags & 1 /* FunctionScopedVariable */)
                result |= 107454 /* FunctionScopedVariableExcludes */;
            if (flags & 4 /* Property */)
                result |= 107455 /* PropertyExcludes */;
            if (flags & 8 /* EnumMember */)
                result |= 107455 /* EnumMemberExcludes */;
            if (flags & 16 /* Function */)
                result |= 106927 /* FunctionExcludes */;
            if (flags & 32 /* Class */)
                result |= 899583 /* ClassExcludes */;
            if (flags & 64 /* Interface */)
                result |= 792992 /* InterfaceExcludes */;
            if (flags & 256 /* RegularEnum */)
                result |= 899327 /* RegularEnumExcludes */;
            if (flags & 128 /* ConstEnum */)
                result |= 899967 /* ConstEnumExcludes */;
            if (flags & 512 /* ValueModule */)
                result |= 106639 /* ValueModuleExcludes */;
            if (flags & 8192 /* Method */)
                result |= 99263 /* MethodExcludes */;
            if (flags & 32768 /* GetAccessor */)
                result |= 41919 /* GetAccessorExcludes */;
            if (flags & 65536 /* SetAccessor */)
                result |= 74687 /* SetAccessorExcludes */;
            if (flags & 262144 /* TypeParameter */)
                result |= 530912 /* TypeParameterExcludes */;
            if (flags & 524288 /* TypeAlias */)
                result |= 793056 /* TypeAliasExcludes */;
            if (flags & 8388608 /* Alias */)
                result |= 8388608 /* AliasExcludes */;
            return result;
        }
        function recordMergedSymbol(target, source) {
            if (!source.mergeId)
                source.mergeId = nextMergeId++;
            mergedSymbols[source.mergeId] = target;
        }
        function cloneSymbol(symbol) {
            var result = createSymbol(symbol.flags | 33554432 /* Merged */, symbol.name);
            result.declarations = symbol.declarations.slice(0);
            result.parent = symbol.parent;
            if (symbol.valueDeclaration)
                result.valueDeclaration = symbol.valueDeclaration;
            if (symbol.constEnumOnlyModule)
                result.constEnumOnlyModule = true;
            if (symbol.members)
                result.members = cloneSymbolTable(symbol.members);
            if (symbol.exports)
                result.exports = cloneSymbolTable(symbol.exports);
            recordMergedSymbol(result, symbol);
            return result;
        }
        function mergeSymbol(target, source) {
            if (!(target.flags & getExcludedSymbolFlags(source.flags))) {
                if (source.flags & 512 /* ValueModule */ && target.flags & 512 /* ValueModule */ && target.constEnumOnlyModule && !source.constEnumOnlyModule) {
                    // reset flag when merging instantiated module into value module that has only const enums
                    target.constEnumOnlyModule = false;
                }
                target.flags |= source.flags;
                if (!target.valueDeclaration && source.valueDeclaration)
                    target.valueDeclaration = source.valueDeclaration;
                ts.forEach(source.declarations, function (node) {
                    target.declarations.push(node);
                });
                if (source.members) {
                    if (!target.members)
                        target.members = {};
                    mergeSymbolTable(target.members, source.members);
                }
                if (source.exports) {
                    if (!target.exports)
                        target.exports = {};
                    mergeSymbolTable(target.exports, source.exports);
                }
                recordMergedSymbol(target, source);
            }
            else {
                var message = target.flags & 2 /* BlockScopedVariable */ || source.flags & 2 /* BlockScopedVariable */
                    ? ts.Diagnostics.Cannot_redeclare_block_scoped_variable_0 : ts.Diagnostics.Duplicate_identifier_0;
                ts.forEach(source.declarations, function (node) {
                    error(node.name ? node.name : node, message, symbolToString(source));
                });
                ts.forEach(target.declarations, function (node) {
                    error(node.name ? node.name : node, message, symbolToString(source));
                });
            }
        }
        function cloneSymbolTable(symbolTable) {
            var result = {};
            for (var id in symbolTable) {
                if (ts.hasProperty(symbolTable, id)) {
                    result[id] = symbolTable[id];
                }
            }
            return result;
        }
        function mergeSymbolTable(target, source) {
            for (var id in source) {
                if (ts.hasProperty(source, id)) {
                    if (!ts.hasProperty(target, id)) {
                        target[id] = source[id];
                    }
                    else {
                        var symbol = target[id];
                        if (!(symbol.flags & 33554432 /* Merged */)) {
                            target[id] = symbol = cloneSymbol(symbol);
                        }
                        mergeSymbol(symbol, source[id]);
                    }
                }
            }
        }
        function getSymbolLinks(symbol) {
            if (symbol.flags & 67108864 /* Transient */)
                return symbol;
            var id = getSymbolId(symbol);
            return symbolLinks[id] || (symbolLinks[id] = {});
        }
        function getNodeLinks(node) {
            var nodeId = getNodeId(node);
            return nodeLinks[nodeId] || (nodeLinks[nodeId] = {});
        }
        function getSourceFile(node) {
            return ts.getAncestor(node, 243 /* SourceFile */);
        }
        function isGlobalSourceFile(node) {
            return node.kind === 243 /* SourceFile */ && !ts.isExternalModule(node);
        }
        function getSymbol(symbols, name, meaning) {
            if (meaning && ts.hasProperty(symbols, name)) {
                var symbol = symbols[name];
                ts.Debug.assert((symbol.flags & 16777216 /* Instantiated */) === 0, "Should never get an instantiated symbol here.");
                if (symbol.flags & meaning) {
                    return symbol;
                }
                if (symbol.flags & 8388608 /* Alias */) {
                    var target = resolveAlias(symbol);
                    // Unknown symbol means an error occurred in alias resolution, treat it as positive answer to avoid cascading errors
                    if (target === unknownSymbol || target.flags & meaning) {
                        return symbol;
                    }
                }
            }
            // return undefined if we can't find a symbol.
        }
        /** Returns true if node1 is defined before node 2**/
        function isDefinedBefore(node1, node2) {
            var file1 = ts.getSourceFileOfNode(node1);
            var file2 = ts.getSourceFileOfNode(node2);
            if (file1 === file2) {
                return node1.pos <= node2.pos;
            }
            if (!compilerOptions.out) {
                return true;
            }
            var sourceFiles = host.getSourceFiles();
            return sourceFiles.indexOf(file1) <= sourceFiles.indexOf(file2);
        }
        // Resolve a given name for a given meaning at a given location. An error is reported if the name was not found and
        // the nameNotFoundMessage argument is not undefined. Returns the resolved symbol, or undefined if no symbol with
        // the given name can be found.
        function resolveName(location, name, meaning, nameNotFoundMessage, nameArg) {
            var result;
            var lastLocation;
            var propertyWithInvalidInitializer;
            var errorLocation = location;
            var grandparent;
            loop: while (location) {
                // Locals of a source file are not in scope (because they get merged into the global symbol table)
                if (location.locals && !isGlobalSourceFile(location)) {
                    if (result = getSymbol(location.locals, name, meaning)) {
                        // Type parameters of a function are in scope in the entire function declaration, including the parameter
                        // list and return type. However, local types are only in scope in the function body.
                        if (!(meaning & 793056 /* Type */) ||
                            !(result.flags & (793056 /* Type */ & ~262144 /* TypeParameter */)) ||
                            !ts.isFunctionLike(location) ||
                            lastLocation === location.body) {
                            break loop;
                        }
                        result = undefined;
                    }
                }
                switch (location.kind) {
                    case 243 /* SourceFile */:
                        if (!ts.isExternalModule(location))
                            break;
                    case 213 /* ModuleDeclaration */:
                        var moduleExports = getSymbolOfNode(location).exports;
                        if (location.kind === 243 /* SourceFile */ ||
                            (location.kind === 213 /* ModuleDeclaration */ && location.name.kind === 8 /* StringLiteral */)) {
                            // It's an external module. Because of module/namespace merging, a module's exports are in scope,
                            // yet we never want to treat an export specifier as putting a member in scope. Therefore,
                            // if the name we find is purely an export specifier, it is not actually considered in scope.
                            // Two things to note about this:
                            //     1. We have to check this without calling getSymbol. The problem with calling getSymbol
                            //        on an export specifier is that it might find the export specifier itself, and try to
                            //        resolve it as an alias. This will cause the checker to consider the export specifier
                            //        a circular alias reference when it might not be.
                            //     2. We check === SymbolFlags.Alias in order to check that the symbol is *purely*
                            //        an alias. If we used &, we'd be throwing out symbols that have non alias aspects,
                            //        which is not the desired behavior.
                            if (ts.hasProperty(moduleExports, name) &&
                                moduleExports[name].flags === 8388608 /* Alias */ &&
                                ts.getDeclarationOfKind(moduleExports[name], 225 /* ExportSpecifier */)) {
                                break;
                            }
                            result = moduleExports["default"];
                            var localSymbol = ts.getLocalSymbolForExportDefault(result);
                            if (result && localSymbol && (result.flags & meaning) && localSymbol.name === name) {
                                break loop;
                            }
                            result = undefined;
                        }
                        if (result = getSymbol(moduleExports, name, meaning & 8914931 /* ModuleMember */)) {
                            break loop;
                        }
                        break;
                    case 212 /* EnumDeclaration */:
                        if (result = getSymbol(getSymbolOfNode(location).exports, name, meaning & 8 /* EnumMember */)) {
                            break loop;
                        }
                        break;
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                        // TypeScript 1.0 spec (April 2014): 8.4.1
                        // Initializer expressions for instance member variables are evaluated in the scope
                        // of the class constructor body but are not permitted to reference parameters or
                        // local variables of the constructor. This effectively means that entities from outer scopes
                        // by the same name as a constructor parameter or local variable are inaccessible
                        // in initializer expressions for instance member variables.
                        if (ts.isClassLike(location.parent) && !(location.flags & 128 /* Static */)) {
                            var ctor = findConstructorDeclaration(location.parent);
                            if (ctor && ctor.locals) {
                                if (getSymbol(ctor.locals, name, meaning & 107455 /* Value */)) {
                                    // Remember the property node, it will be used later to report appropriate error
                                    propertyWithInvalidInitializer = location;
                                }
                            }
                        }
                        break;
                    case 209 /* ClassDeclaration */:
                    case 181 /* ClassExpression */:
                    case 210 /* InterfaceDeclaration */:
                        if (result = getSymbol(getSymbolOfNode(location).members, name, meaning & 793056 /* Type */)) {
                            if (lastLocation && lastLocation.flags & 128 /* Static */) {
                                // TypeScript 1.0 spec (April 2014): 3.4.1
                                // The scope of a type parameter extends over the entire declaration with which the type
                                // parameter list is associated, with the exception of static member declarations in classes.
                                error(errorLocation, ts.Diagnostics.Static_members_cannot_reference_class_type_parameters);
                                return undefined;
                            }
                            break loop;
                        }
                        if (location.kind === 181 /* ClassExpression */ && meaning & 32 /* Class */) {
                            var className = location.name;
                            if (className && name === className.text) {
                                result = location.symbol;
                                break loop;
                            }
                        }
                        break;
                    // It is not legal to reference a class's own type parameters from a computed property name that
                    // belongs to the class. For example:
                    //
                    //   function foo<T>() { return '' }
                    //   class C<T> { // <-- Class's own type parameter T
                    //       [foo<T>()]() { } // <-- Reference to T from class's own computed property
                    //   }
                    //
                    case 132 /* ComputedPropertyName */:
                        grandparent = location.parent.parent;
                        if (ts.isClassLike(grandparent) || grandparent.kind === 210 /* InterfaceDeclaration */) {
                            // A reference to this grandparent's type parameters would be an error
                            if (result = getSymbol(getSymbolOfNode(grandparent).members, name, meaning & 793056 /* Type */)) {
                                error(errorLocation, ts.Diagnostics.A_computed_property_name_cannot_reference_a_type_parameter_from_its_containing_type);
                                return undefined;
                            }
                        }
                        break;
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 140 /* Constructor */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 208 /* FunctionDeclaration */:
                    case 169 /* ArrowFunction */:
                        if (meaning & 3 /* Variable */ && name === "arguments") {
                            result = argumentsSymbol;
                            break loop;
                        }
                        break;
                    case 168 /* FunctionExpression */:
                        if (meaning & 3 /* Variable */ && name === "arguments") {
                            result = argumentsSymbol;
                            break loop;
                        }
                        if (meaning & 16 /* Function */) {
                            var functionName = location.name;
                            if (functionName && name === functionName.text) {
                                result = location.symbol;
                                break loop;
                            }
                        }
                        break;
                    case 135 /* Decorator */:
                        // Decorators are resolved at the class declaration. Resolving at the parameter 
                        // or member would result in looking up locals in the method.
                        //
                        //   function y() {}
                        //   class C {
                        //       method(@y x, y) {} // <-- decorator y should be resolved at the class declaration, not the parameter.
                        //   }
                        //
                        if (location.parent && location.parent.kind === 134 /* Parameter */) {
                            location = location.parent;
                        }
                        //
                        //   function y() {}
                        //   class C {
                        //       @y method(x, y) {} // <-- decorator y should be resolved at the class declaration, not the method.
                        //   }
                        //
                        if (location.parent && ts.isClassElement(location.parent)) {
                            location = location.parent;
                        }
                        break;
                }
                lastLocation = location;
                location = location.parent;
            }
            if (!result) {
                result = getSymbol(globals, name, meaning);
            }
            if (!result) {
                if (nameNotFoundMessage) {
                    error(errorLocation, nameNotFoundMessage, typeof nameArg === "string" ? nameArg : ts.declarationNameToString(nameArg));
                }
                return undefined;
            }
            // Perform extra checks only if error reporting was requested
            if (nameNotFoundMessage) {
                if (propertyWithInvalidInitializer) {
                    // We have a match, but the reference occurred within a property initializer and the identifier also binds
                    // to a local variable in the constructor where the code will be emitted.
                    var propertyName = propertyWithInvalidInitializer.name;
                    error(errorLocation, ts.Diagnostics.Initializer_of_instance_member_variable_0_cannot_reference_identifier_1_declared_in_the_constructor, ts.declarationNameToString(propertyName), typeof nameArg === "string" ? nameArg : ts.declarationNameToString(nameArg));
                    return undefined;
                }
                if (result.flags & 2 /* BlockScopedVariable */) {
                    checkResolvedBlockScopedVariable(result, errorLocation);
                }
            }
            return result;
        }
        function checkResolvedBlockScopedVariable(result, errorLocation) {
            ts.Debug.assert((result.flags & 2 /* BlockScopedVariable */) !== 0);
            // Block-scoped variables cannot be used before their definition
            var declaration = ts.forEach(result.declarations, function (d) { return ts.isBlockOrCatchScoped(d) ? d : undefined; });
            ts.Debug.assert(declaration !== undefined, "Block-scoped variable declaration is undefined");
            // first check if usage is lexically located after the declaration
            var isUsedBeforeDeclaration = !isDefinedBefore(declaration, errorLocation);
            if (!isUsedBeforeDeclaration) {
                // lexical check succeeded however code still can be illegal.
                // - block scoped variables cannot be used in its initializers
                //   let x = x; // illegal but usage is lexically after definition
                // - in ForIn/ForOf statements variable cannot be contained in expression part
                //   for (let x in x)
                //   for (let x of x)
                // climb up to the variable declaration skipping binding patterns
                var variableDeclaration = ts.getAncestor(declaration, 206 /* VariableDeclaration */);
                var container = ts.getEnclosingBlockScopeContainer(variableDeclaration);
                if (variableDeclaration.parent.parent.kind === 188 /* VariableStatement */ ||
                    variableDeclaration.parent.parent.kind === 194 /* ForStatement */) {
                    // variable statement/for statement case,
                    // use site should not be inside variable declaration (initializer of declaration or binding element)
                    isUsedBeforeDeclaration = isSameScopeDescendentOf(errorLocation, variableDeclaration, container);
                }
                else if (variableDeclaration.parent.parent.kind === 196 /* ForOfStatement */ ||
                    variableDeclaration.parent.parent.kind === 195 /* ForInStatement */) {
                    // ForIn/ForOf case - use site should not be used in expression part
                    var expression = variableDeclaration.parent.parent.expression;
                    isUsedBeforeDeclaration = isSameScopeDescendentOf(errorLocation, expression, container);
                }
            }
            if (isUsedBeforeDeclaration) {
                error(errorLocation, ts.Diagnostics.Block_scoped_variable_0_used_before_its_declaration, ts.declarationNameToString(declaration.name));
            }
        }
        /* Starting from 'initial' node walk up the parent chain until 'stopAt' node is reached.
         * If at any point current node is equal to 'parent' node - return true.
         * Return false if 'stopAt' node is reached or isFunctionLike(current) === true.
         */
        function isSameScopeDescendentOf(initial, parent, stopAt) {
            if (!parent) {
                return false;
            }
            for (var current = initial; current && current !== stopAt && !ts.isFunctionLike(current); current = current.parent) {
                if (current === parent) {
                    return true;
                }
            }
            return false;
        }
        function getAnyImportSyntax(node) {
            if (ts.isAliasSymbolDeclaration(node)) {
                if (node.kind === 216 /* ImportEqualsDeclaration */) {
                    return node;
                }
                while (node && node.kind !== 217 /* ImportDeclaration */) {
                    node = node.parent;
                }
                return node;
            }
        }
        function getDeclarationOfAliasSymbol(symbol) {
            return ts.forEach(symbol.declarations, function (d) { return ts.isAliasSymbolDeclaration(d) ? d : undefined; });
        }
        function getTargetOfImportEqualsDeclaration(node) {
            if (node.moduleReference.kind === 227 /* ExternalModuleReference */) {
                return resolveExternalModuleSymbol(resolveExternalModuleName(node, ts.getExternalModuleImportEqualsDeclarationExpression(node)));
            }
            return getSymbolOfPartOfRightHandSideOfImportEquals(node.moduleReference, node);
        }
        function getTargetOfImportClause(node) {
            var moduleSymbol = resolveExternalModuleName(node, node.parent.moduleSpecifier);
            if (moduleSymbol) {
                var exportDefaultSymbol = resolveSymbol(moduleSymbol.exports["default"]);
                if (!exportDefaultSymbol) {
                    error(node.name, ts.Diagnostics.Module_0_has_no_default_export, symbolToString(moduleSymbol));
                }
                return exportDefaultSymbol;
            }
        }
        function getTargetOfNamespaceImport(node) {
            var moduleSpecifier = node.parent.parent.moduleSpecifier;
            return resolveESModuleSymbol(resolveExternalModuleName(node, moduleSpecifier), moduleSpecifier);
        }
        function getMemberOfModuleVariable(moduleSymbol, name) {
            if (moduleSymbol.flags & 3 /* Variable */) {
                var typeAnnotation = moduleSymbol.valueDeclaration.type;
                if (typeAnnotation) {
                    return getPropertyOfType(getTypeFromTypeNode(typeAnnotation), name);
                }
            }
        }
        // This function creates a synthetic symbol that combines the value side of one symbol with the
        // type/namespace side of another symbol. Consider this example:
        //
        //   declare module graphics {
        //       interface Point {
        //           x: number;
        //           y: number;
        //       }
        //   }
        //   declare var graphics: {
        //       Point: new (x: number, y: number) => graphics.Point;
        //   }
        //   declare module "graphics" {
        //       export = graphics;
        //   }
        //
        // An 'import { Point } from "graphics"' needs to create a symbol that combines the value side 'Point'
        // property with the type/namespace side interface 'Point'.
        function combineValueAndTypeSymbols(valueSymbol, typeSymbol) {
            if (valueSymbol.flags & (793056 /* Type */ | 1536 /* Namespace */)) {
                return valueSymbol;
            }
            var result = createSymbol(valueSymbol.flags | typeSymbol.flags, valueSymbol.name);
            result.declarations = ts.concatenate(valueSymbol.declarations, typeSymbol.declarations);
            result.parent = valueSymbol.parent || typeSymbol.parent;
            if (valueSymbol.valueDeclaration)
                result.valueDeclaration = valueSymbol.valueDeclaration;
            if (typeSymbol.members)
                result.members = typeSymbol.members;
            if (valueSymbol.exports)
                result.exports = valueSymbol.exports;
            return result;
        }
        function getExportOfModule(symbol, name) {
            if (symbol.flags & 1536 /* Module */) {
                var exports = getExportsOfSymbol(symbol);
                if (ts.hasProperty(exports, name)) {
                    return resolveSymbol(exports[name]);
                }
            }
        }
        function getPropertyOfVariable(symbol, name) {
            if (symbol.flags & 3 /* Variable */) {
                var typeAnnotation = symbol.valueDeclaration.type;
                if (typeAnnotation) {
                    return resolveSymbol(getPropertyOfType(getTypeFromTypeNode(typeAnnotation), name));
                }
            }
        }
        function getExternalModuleMember(node, specifier) {
            var moduleSymbol = resolveExternalModuleName(node, node.moduleSpecifier);
            var targetSymbol = resolveESModuleSymbol(moduleSymbol, node.moduleSpecifier);
            if (targetSymbol) {
                var name_1 = specifier.propertyName || specifier.name;
                if (name_1.text) {
                    var symbolFromModule = getExportOfModule(targetSymbol, name_1.text);
                    var symbolFromVariable = getPropertyOfVariable(targetSymbol, name_1.text);
                    var symbol = symbolFromModule && symbolFromVariable ?
                        combineValueAndTypeSymbols(symbolFromVariable, symbolFromModule) :
                        symbolFromModule || symbolFromVariable;
                    if (!symbol) {
                        error(name_1, ts.Diagnostics.Module_0_has_no_exported_member_1, getFullyQualifiedName(moduleSymbol), ts.declarationNameToString(name_1));
                    }
                    return symbol;
                }
            }
        }
        function getTargetOfImportSpecifier(node) {
            return getExternalModuleMember(node.parent.parent.parent, node);
        }
        function getTargetOfExportSpecifier(node) {
            return node.parent.parent.moduleSpecifier ?
                getExternalModuleMember(node.parent.parent, node) :
                resolveEntityName(node.propertyName || node.name, 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */);
        }
        function getTargetOfExportAssignment(node) {
            return resolveEntityName(node.expression, 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */);
        }
        function getTargetOfAliasDeclaration(node) {
            switch (node.kind) {
                case 216 /* ImportEqualsDeclaration */:
                    return getTargetOfImportEqualsDeclaration(node);
                case 218 /* ImportClause */:
                    return getTargetOfImportClause(node);
                case 219 /* NamespaceImport */:
                    return getTargetOfNamespaceImport(node);
                case 221 /* ImportSpecifier */:
                    return getTargetOfImportSpecifier(node);
                case 225 /* ExportSpecifier */:
                    return getTargetOfExportSpecifier(node);
                case 222 /* ExportAssignment */:
                    return getTargetOfExportAssignment(node);
            }
        }
        function resolveSymbol(symbol) {
            return symbol && symbol.flags & 8388608 /* Alias */ && !(symbol.flags & (107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */)) ? resolveAlias(symbol) : symbol;
        }
        function resolveAlias(symbol) {
            ts.Debug.assert((symbol.flags & 8388608 /* Alias */) !== 0, "Should only get Alias here.");
            var links = getSymbolLinks(symbol);
            if (!links.target) {
                links.target = resolvingSymbol;
                var node = getDeclarationOfAliasSymbol(symbol);
                var target = getTargetOfAliasDeclaration(node);
                if (links.target === resolvingSymbol) {
                    links.target = target || unknownSymbol;
                }
                else {
                    error(node, ts.Diagnostics.Circular_definition_of_import_alias_0, symbolToString(symbol));
                }
            }
            else if (links.target === resolvingSymbol) {
                links.target = unknownSymbol;
            }
            return links.target;
        }
        function markExportAsReferenced(node) {
            var symbol = getSymbolOfNode(node);
            var target = resolveAlias(symbol);
            if (target) {
                var markAlias = (target === unknownSymbol && compilerOptions.isolatedModules) ||
                    (target !== unknownSymbol && (target.flags & 107455 /* Value */) && !isConstEnumOrConstEnumOnlyModule(target));
                if (markAlias) {
                    markAliasSymbolAsReferenced(symbol);
                }
            }
        }
        // When an alias symbol is referenced, we need to mark the entity it references as referenced and in turn repeat that until
        // we reach a non-alias or an exported entity (which is always considered referenced). We do this by checking the target of
        // the alias as an expression (which recursively takes us back here if the target references another alias).
        function markAliasSymbolAsReferenced(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.referenced) {
                links.referenced = true;
                var node = getDeclarationOfAliasSymbol(symbol);
                if (node.kind === 222 /* ExportAssignment */) {
                    // export default <symbol>
                    checkExpressionCached(node.expression);
                }
                else if (node.kind === 225 /* ExportSpecifier */) {
                    // export { <symbol> } or export { <symbol> as foo }
                    checkExpressionCached(node.propertyName || node.name);
                }
                else if (ts.isInternalModuleImportEqualsDeclaration(node)) {
                    // import foo = <symbol>
                    checkExpressionCached(node.moduleReference);
                }
            }
        }
        // This function is only for imports with entity names
        function getSymbolOfPartOfRightHandSideOfImportEquals(entityName, importDeclaration) {
            if (!importDeclaration) {
                importDeclaration = ts.getAncestor(entityName, 216 /* ImportEqualsDeclaration */);
                ts.Debug.assert(importDeclaration !== undefined);
            }
            // There are three things we might try to look for. In the following examples,
            // the search term is enclosed in |...|:
            //
            //     import a = |b|; // Namespace
            //     import a = |b.c|; // Value, type, namespace
            //     import a = |b.c|.d; // Namespace
            if (entityName.kind === 66 /* Identifier */ && ts.isRightSideOfQualifiedNameOrPropertyAccess(entityName)) {
                entityName = entityName.parent;
            }
            // Check for case 1 and 3 in the above example
            if (entityName.kind === 66 /* Identifier */ || entityName.parent.kind === 131 /* QualifiedName */) {
                return resolveEntityName(entityName, 1536 /* Namespace */);
            }
            else {
                // Case 2 in above example
                // entityName.kind could be a QualifiedName or a Missing identifier
                ts.Debug.assert(entityName.parent.kind === 216 /* ImportEqualsDeclaration */);
                return resolveEntityName(entityName, 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */);
            }
        }
        function getFullyQualifiedName(symbol) {
            return symbol.parent ? getFullyQualifiedName(symbol.parent) + "." + symbolToString(symbol) : symbolToString(symbol);
        }
        // Resolves a qualified name and any involved aliases
        function resolveEntityName(name, meaning) {
            if (ts.nodeIsMissing(name)) {
                return undefined;
            }
            var symbol;
            if (name.kind === 66 /* Identifier */) {
                var message = meaning === 1536 /* Namespace */ ? ts.Diagnostics.Cannot_find_namespace_0 : ts.Diagnostics.Cannot_find_name_0;
                symbol = resolveName(name, name.text, meaning, message, name);
                if (!symbol) {
                    return undefined;
                }
            }
            else if (name.kind === 131 /* QualifiedName */ || name.kind === 161 /* PropertyAccessExpression */) {
                var left = name.kind === 131 /* QualifiedName */ ? name.left : name.expression;
                var right = name.kind === 131 /* QualifiedName */ ? name.right : name.name;
                var namespace = resolveEntityName(left, 1536 /* Namespace */);
                if (!namespace || namespace === unknownSymbol || ts.nodeIsMissing(right)) {
                    return undefined;
                }
                symbol = getSymbol(getExportsOfSymbol(namespace), right.text, meaning);
                if (!symbol) {
                    error(right, ts.Diagnostics.Module_0_has_no_exported_member_1, getFullyQualifiedName(namespace), ts.declarationNameToString(right));
                    return undefined;
                }
            }
            else {
                ts.Debug.fail("Unknown entity name kind.");
            }
            ts.Debug.assert((symbol.flags & 16777216 /* Instantiated */) === 0, "Should never get an instantiated symbol here.");
            return symbol.flags & meaning ? symbol : resolveAlias(symbol);
        }
        function isExternalModuleNameRelative(moduleName) {
            // TypeScript 1.0 spec (April 2014): 11.2.1
            // An external module name is "relative" if the first term is "." or "..".
            return moduleName.substr(0, 2) === "./" || moduleName.substr(0, 3) === "../" || moduleName.substr(0, 2) === ".\\" || moduleName.substr(0, 3) === "..\\";
        }
        function resolveExternalModuleName(location, moduleReferenceExpression) {
            if (moduleReferenceExpression.kind !== 8 /* StringLiteral */) {
                return;
            }
            var moduleReferenceLiteral = moduleReferenceExpression;
            var searchPath = ts.getDirectoryPath(getSourceFile(location).fileName);
            // Module names are escaped in our symbol table.  However, string literal values aren't.
            // Escape the name in the "require(...)" clause to ensure we find the right symbol.
            var moduleName = ts.escapeIdentifier(moduleReferenceLiteral.text);
            if (!moduleName)
                return;
            var isRelative = isExternalModuleNameRelative(moduleName);
            if (!isRelative) {
                var symbol = getSymbol(globals, '"' + moduleName + '"', 512 /* ValueModule */);
                if (symbol) {
                    return symbol;
                }
            }
            var fileName;
            var sourceFile;
            while (true) {
                fileName = ts.normalizePath(ts.combinePaths(searchPath, moduleName));
                sourceFile = ts.forEach(ts.supportedExtensions, function (extension) { return host.getSourceFile(fileName + extension); });
                if (sourceFile || isRelative) {
                    break;
                }
                var parentPath = ts.getDirectoryPath(searchPath);
                if (parentPath === searchPath) {
                    break;
                }
                searchPath = parentPath;
            }
            if (sourceFile) {
                if (sourceFile.symbol) {
                    return sourceFile.symbol;
                }
                error(moduleReferenceLiteral, ts.Diagnostics.File_0_is_not_a_module, sourceFile.fileName);
                return;
            }
            error(moduleReferenceLiteral, ts.Diagnostics.Cannot_find_module_0, moduleName);
        }
        // An external module with an 'export =' declaration resolves to the target of the 'export =' declaration,
        // and an external module with no 'export =' declaration resolves to the module itself.
        function resolveExternalModuleSymbol(moduleSymbol) {
            return moduleSymbol && resolveSymbol(moduleSymbol.exports["export="]) || moduleSymbol;
        }
        // An external module with an 'export =' declaration may be referenced as an ES6 module provided the 'export ='
        // references a symbol that is at least declared as a module or a variable. The target of the 'export =' may
        // combine other declarations with the module or variable (e.g. a class/module, function/module, interface/variable).
        function resolveESModuleSymbol(moduleSymbol, moduleReferenceExpression) {
            var symbol = resolveExternalModuleSymbol(moduleSymbol);
            if (symbol && !(symbol.flags & (1536 /* Module */ | 3 /* Variable */))) {
                error(moduleReferenceExpression, ts.Diagnostics.Module_0_resolves_to_a_non_module_entity_and_cannot_be_imported_using_this_construct, symbolToString(moduleSymbol));
                symbol = undefined;
            }
            return symbol;
        }
        function getExportAssignmentSymbol(moduleSymbol) {
            return moduleSymbol.exports["export="];
        }
        function getExportsOfModuleAsArray(moduleSymbol) {
            return symbolsToArray(getExportsOfModule(moduleSymbol));
        }
        function getExportsOfSymbol(symbol) {
            return symbol.flags & 1536 /* Module */ ? getExportsOfModule(symbol) : symbol.exports || emptySymbols;
        }
        function getExportsOfModule(moduleSymbol) {
            var links = getSymbolLinks(moduleSymbol);
            return links.resolvedExports || (links.resolvedExports = getExportsForModule(moduleSymbol));
        }
        function extendExportSymbols(target, source) {
            for (var id in source) {
                if (id !== "default" && !ts.hasProperty(target, id)) {
                    target[id] = source[id];
                }
            }
        }
        function getExportsForModule(moduleSymbol) {
            var result;
            var visitedSymbols = [];
            visit(moduleSymbol);
            return result || moduleSymbol.exports;
            // The ES6 spec permits export * declarations in a module to circularly reference the module itself. For example,
            // module 'a' can 'export * from "b"' and 'b' can 'export * from "a"' without error.
            function visit(symbol) {
                if (symbol && symbol.flags & 1952 /* HasExports */ && !ts.contains(visitedSymbols, symbol)) {
                    visitedSymbols.push(symbol);
                    if (symbol !== moduleSymbol) {
                        if (!result) {
                            result = cloneSymbolTable(moduleSymbol.exports);
                        }
                        extendExportSymbols(result, symbol.exports);
                    }
                    // All export * declarations are collected in an __export symbol by the binder
                    var exportStars = symbol.exports["__export"];
                    if (exportStars) {
                        for (var _i = 0, _a = exportStars.declarations; _i < _a.length; _i++) {
                            var node = _a[_i];
                            visit(resolveExternalModuleName(node, node.moduleSpecifier));
                        }
                    }
                }
            }
        }
        function getMergedSymbol(symbol) {
            var merged;
            return symbol && symbol.mergeId && (merged = mergedSymbols[symbol.mergeId]) ? merged : symbol;
        }
        function getSymbolOfNode(node) {
            return getMergedSymbol(node.symbol);
        }
        function getParentOfSymbol(symbol) {
            return getMergedSymbol(symbol.parent);
        }
        function getExportSymbolOfValueSymbolIfExported(symbol) {
            return symbol && (symbol.flags & 1048576 /* ExportValue */) !== 0
                ? getMergedSymbol(symbol.exportSymbol)
                : symbol;
        }
        function symbolIsValue(symbol) {
            // If it is an instantiated symbol, then it is a value if the symbol it is an
            // instantiation of is a value.
            if (symbol.flags & 16777216 /* Instantiated */) {
                return symbolIsValue(getSymbolLinks(symbol).target);
            }
            // If the symbol has the value flag, it is trivially a value.
            if (symbol.flags & 107455 /* Value */) {
                return true;
            }
            // If it is an alias, then it is a value if the symbol it resolves to is a value.
            if (symbol.flags & 8388608 /* Alias */) {
                return (resolveAlias(symbol).flags & 107455 /* Value */) !== 0;
            }
            return false;
        }
        function findConstructorDeclaration(node) {
            var members = node.members;
            for (var _i = 0; _i < members.length; _i++) {
                var member = members[_i];
                if (member.kind === 140 /* Constructor */ && ts.nodeIsPresent(member.body)) {
                    return member;
                }
            }
        }
        function createType(flags) {
            var result = new Type(checker, flags);
            result.id = typeCount++;
            return result;
        }
        function createIntrinsicType(kind, intrinsicName) {
            var type = createType(kind);
            type.intrinsicName = intrinsicName;
            return type;
        }
        function createObjectType(kind, symbol) {
            var type = createType(kind);
            type.symbol = symbol;
            return type;
        }
        // A reserved member name starts with two underscores, but the third character cannot be an underscore
        // or the @ symbol. A third underscore indicates an escaped form of an identifer that started
        // with at least two underscores. The @ character indicates that the name is denoted by a well known ES
        // Symbol instance.
        function isReservedMemberName(name) {
            return name.charCodeAt(0) === 95 /* _ */ &&
                name.charCodeAt(1) === 95 /* _ */ &&
                name.charCodeAt(2) !== 95 /* _ */ &&
                name.charCodeAt(2) !== 64 /* at */;
        }
        function getNamedMembers(members) {
            var result;
            for (var id in members) {
                if (ts.hasProperty(members, id)) {
                    if (!isReservedMemberName(id)) {
                        if (!result)
                            result = [];
                        var symbol = members[id];
                        if (symbolIsValue(symbol)) {
                            result.push(symbol);
                        }
                    }
                }
            }
            return result || emptyArray;
        }
        function setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType) {
            type.members = members;
            type.properties = getNamedMembers(members);
            type.callSignatures = callSignatures;
            type.constructSignatures = constructSignatures;
            if (stringIndexType)
                type.stringIndexType = stringIndexType;
            if (numberIndexType)
                type.numberIndexType = numberIndexType;
            return type;
        }
        function createAnonymousType(symbol, members, callSignatures, constructSignatures, stringIndexType, numberIndexType) {
            return setObjectTypeMembers(createObjectType(32768 /* Anonymous */, symbol), members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function forEachSymbolTableInScope(enclosingDeclaration, callback) {
            var result;
            for (var location_1 = enclosingDeclaration; location_1; location_1 = location_1.parent) {
                // Locals of a source file are not in scope (because they get merged into the global symbol table)
                if (location_1.locals && !isGlobalSourceFile(location_1)) {
                    if (result = callback(location_1.locals)) {
                        return result;
                    }
                }
                switch (location_1.kind) {
                    case 243 /* SourceFile */:
                        if (!ts.isExternalModule(location_1)) {
                            break;
                        }
                    case 213 /* ModuleDeclaration */:
                        if (result = callback(getSymbolOfNode(location_1).exports)) {
                            return result;
                        }
                        break;
                    case 209 /* ClassDeclaration */:
                    case 210 /* InterfaceDeclaration */:
                        if (result = callback(getSymbolOfNode(location_1).members)) {
                            return result;
                        }
                        break;
                }
            }
            return callback(globals);
        }
        function getQualifiedLeftMeaning(rightMeaning) {
            // If we are looking in value space, the parent meaning is value, other wise it is namespace
            return rightMeaning === 107455 /* Value */ ? 107455 /* Value */ : 1536 /* Namespace */;
        }
        function getAccessibleSymbolChain(symbol, enclosingDeclaration, meaning, useOnlyExternalAliasing) {
            function getAccessibleSymbolChainFromSymbolTable(symbols) {
                function canQualifySymbol(symbolFromSymbolTable, meaning) {
                    // If the symbol is equivalent and doesn't need further qualification, this symbol is accessible
                    if (!needsQualification(symbolFromSymbolTable, enclosingDeclaration, meaning)) {
                        return true;
                    }
                    // If symbol needs qualification, make sure that parent is accessible, if it is then this symbol is accessible too
                    var accessibleParent = getAccessibleSymbolChain(symbolFromSymbolTable.parent, enclosingDeclaration, getQualifiedLeftMeaning(meaning), useOnlyExternalAliasing);
                    return !!accessibleParent;
                }
                function isAccessible(symbolFromSymbolTable, resolvedAliasSymbol) {
                    if (symbol === (resolvedAliasSymbol || symbolFromSymbolTable)) {
                        // if the symbolFromSymbolTable is not external module (it could be if it was determined as ambient external module and would be in globals table)
                        // and if symbolfrom symbolTable or alias resolution matches the symbol,
                        // check the symbol can be qualified, it is only then this symbol is accessible
                        return !ts.forEach(symbolFromSymbolTable.declarations, hasExternalModuleSymbol) &&
                            canQualifySymbol(symbolFromSymbolTable, meaning);
                    }
                }
                // If symbol is directly available by its name in the symbol table
                if (isAccessible(ts.lookUp(symbols, symbol.name))) {
                    return [symbol];
                }
                // Check if symbol is any of the alias
                return ts.forEachValue(symbols, function (symbolFromSymbolTable) {
                    if (symbolFromSymbolTable.flags & 8388608 /* Alias */
                        && symbolFromSymbolTable.name !== "export="
                        && !ts.getDeclarationOfKind(symbolFromSymbolTable, 225 /* ExportSpecifier */)) {
                        if (!useOnlyExternalAliasing ||
                            // Is this external alias, then use it to name
                            ts.forEach(symbolFromSymbolTable.declarations, ts.isExternalModuleImportEqualsDeclaration)) {
                            var resolvedImportedSymbol = resolveAlias(symbolFromSymbolTable);
                            if (isAccessible(symbolFromSymbolTable, resolveAlias(symbolFromSymbolTable))) {
                                return [symbolFromSymbolTable];
                            }
                            // Look in the exported members, if we can find accessibleSymbolChain, symbol is accessible using this chain
                            // but only if the symbolFromSymbolTable can be qualified
                            var accessibleSymbolsFromExports = resolvedImportedSymbol.exports ? getAccessibleSymbolChainFromSymbolTable(resolvedImportedSymbol.exports) : undefined;
                            if (accessibleSymbolsFromExports && canQualifySymbol(symbolFromSymbolTable, getQualifiedLeftMeaning(meaning))) {
                                return [symbolFromSymbolTable].concat(accessibleSymbolsFromExports);
                            }
                        }
                    }
                });
            }
            if (symbol) {
                return forEachSymbolTableInScope(enclosingDeclaration, getAccessibleSymbolChainFromSymbolTable);
            }
        }
        function needsQualification(symbol, enclosingDeclaration, meaning) {
            var qualify = false;
            forEachSymbolTableInScope(enclosingDeclaration, function (symbolTable) {
                // If symbol of this name is not available in the symbol table we are ok
                if (!ts.hasProperty(symbolTable, symbol.name)) {
                    // Continue to the next symbol table
                    return false;
                }
                // If the symbol with this name is present it should refer to the symbol
                var symbolFromSymbolTable = symbolTable[symbol.name];
                if (symbolFromSymbolTable === symbol) {
                    // No need to qualify
                    return true;
                }
                // Qualify if the symbol from symbol table has same meaning as expected
                symbolFromSymbolTable = (symbolFromSymbolTable.flags & 8388608 /* Alias */ && !ts.getDeclarationOfKind(symbolFromSymbolTable, 225 /* ExportSpecifier */)) ? resolveAlias(symbolFromSymbolTable) : symbolFromSymbolTable;
                if (symbolFromSymbolTable.flags & meaning) {
                    qualify = true;
                    return true;
                }
                // Continue to the next symbol table
                return false;
            });
            return qualify;
        }
        function isSymbolAccessible(symbol, enclosingDeclaration, meaning) {
            if (symbol && enclosingDeclaration && !(symbol.flags & 262144 /* TypeParameter */)) {
                var initialSymbol = symbol;
                var meaningToLook = meaning;
                while (symbol) {
                    // Symbol is accessible if it by itself is accessible
                    var accessibleSymbolChain = getAccessibleSymbolChain(symbol, enclosingDeclaration, meaningToLook, false);
                    if (accessibleSymbolChain) {
                        var hasAccessibleDeclarations = hasVisibleDeclarations(accessibleSymbolChain[0]);
                        if (!hasAccessibleDeclarations) {
                            return {
                                accessibility: 1 /* NotAccessible */,
                                errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning),
                                errorModuleName: symbol !== initialSymbol ? symbolToString(symbol, enclosingDeclaration, 1536 /* Namespace */) : undefined
                            };
                        }
                        return hasAccessibleDeclarations;
                    }
                    // If we haven't got the accessible symbol, it doesn't mean the symbol is actually inaccessible.
                    // It could be a qualified symbol and hence verify the path
                    // e.g.:
                    // module m {
                    //     export class c {
                    //     }
                    // }
                    // let x: typeof m.c
                    // In the above example when we start with checking if typeof m.c symbol is accessible,
                    // we are going to see if c can be accessed in scope directly.
                    // But it can't, hence the accessible is going to be undefined, but that doesn't mean m.c is inaccessible
                    // It is accessible if the parent m is accessible because then m.c can be accessed through qualification
                    meaningToLook = getQualifiedLeftMeaning(meaning);
                    symbol = getParentOfSymbol(symbol);
                }
                // This could be a symbol that is not exported in the external module
                // or it could be a symbol from different external module that is not aliased and hence cannot be named
                var symbolExternalModule = ts.forEach(initialSymbol.declarations, getExternalModuleContainer);
                if (symbolExternalModule) {
                    var enclosingExternalModule = getExternalModuleContainer(enclosingDeclaration);
                    if (symbolExternalModule !== enclosingExternalModule) {
                        // name from different external module that is not visible
                        return {
                            accessibility: 2 /* CannotBeNamed */,
                            errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning),
                            errorModuleName: symbolToString(symbolExternalModule)
                        };
                    }
                }
                // Just a local name that is not accessible
                return {
                    accessibility: 1 /* NotAccessible */,
                    errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning)
                };
            }
            return { accessibility: 0 /* Accessible */ };
            function getExternalModuleContainer(declaration) {
                for (; declaration; declaration = declaration.parent) {
                    if (hasExternalModuleSymbol(declaration)) {
                        return getSymbolOfNode(declaration);
                    }
                }
            }
        }
        function hasExternalModuleSymbol(declaration) {
            return (declaration.kind === 213 /* ModuleDeclaration */ && declaration.name.kind === 8 /* StringLiteral */) ||
                (declaration.kind === 243 /* SourceFile */ && ts.isExternalModule(declaration));
        }
        function hasVisibleDeclarations(symbol) {
            var aliasesToMakeVisible;
            if (ts.forEach(symbol.declarations, function (declaration) { return !getIsDeclarationVisible(declaration); })) {
                return undefined;
            }
            return { accessibility: 0 /* Accessible */, aliasesToMakeVisible: aliasesToMakeVisible };
            function getIsDeclarationVisible(declaration) {
                if (!isDeclarationVisible(declaration)) {
                    // Mark the unexported alias as visible if its parent is visible
                    // because these kind of aliases can be used to name types in declaration file
                    var anyImportSyntax = getAnyImportSyntax(declaration);
                    if (anyImportSyntax &&
                        !(anyImportSyntax.flags & 1 /* Export */) &&
                        isDeclarationVisible(anyImportSyntax.parent)) {
                        getNodeLinks(declaration).isVisible = true;
                        if (aliasesToMakeVisible) {
                            if (!ts.contains(aliasesToMakeVisible, anyImportSyntax)) {
                                aliasesToMakeVisible.push(anyImportSyntax);
                            }
                        }
                        else {
                            aliasesToMakeVisible = [anyImportSyntax];
                        }
                        return true;
                    }
                    // Declaration is not visible
                    return false;
                }
                return true;
            }
        }
        function isEntityNameVisible(entityName, enclosingDeclaration) {
            // get symbol of the first identifier of the entityName
            var meaning;
            if (entityName.parent.kind === 150 /* TypeQuery */) {
                // Typeof value
                meaning = 107455 /* Value */ | 1048576 /* ExportValue */;
            }
            else if (entityName.kind === 131 /* QualifiedName */ || entityName.kind === 161 /* PropertyAccessExpression */ ||
                entityName.parent.kind === 216 /* ImportEqualsDeclaration */) {
                // Left identifier from type reference or TypeAlias
                // Entity name of the import declaration
                meaning = 1536 /* Namespace */;
            }
            else {
                // Type Reference or TypeAlias entity = Identifier
                meaning = 793056 /* Type */;
            }
            var firstIdentifier = getFirstIdentifier(entityName);
            var symbol = resolveName(enclosingDeclaration, firstIdentifier.text, meaning, undefined, undefined);
            // Verify if the symbol is accessible
            return (symbol && hasVisibleDeclarations(symbol)) || {
                accessibility: 1 /* NotAccessible */,
                errorSymbolName: ts.getTextOfNode(firstIdentifier),
                errorNode: firstIdentifier
            };
        }
        function writeKeyword(writer, kind) {
            writer.writeKeyword(ts.tokenToString(kind));
        }
        function writePunctuation(writer, kind) {
            writer.writePunctuation(ts.tokenToString(kind));
        }
        function writeSpace(writer) {
            writer.writeSpace(" ");
        }
        function symbolToString(symbol, enclosingDeclaration, meaning) {
            var writer = ts.getSingleLineStringWriter();
            getSymbolDisplayBuilder().buildSymbolDisplay(symbol, writer, enclosingDeclaration, meaning);
            var result = writer.string();
            ts.releaseStringWriter(writer);
            return result;
        }
        function signatureToString(signature, enclosingDeclaration, flags) {
            var writer = ts.getSingleLineStringWriter();
            getSymbolDisplayBuilder().buildSignatureDisplay(signature, writer, enclosingDeclaration, flags);
            var result = writer.string();
            ts.releaseStringWriter(writer);
            return result;
        }
        function typeToString(type, enclosingDeclaration, flags) {
            var writer = ts.getSingleLineStringWriter();
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
            var result = writer.string();
            ts.releaseStringWriter(writer);
            var maxLength = compilerOptions.noErrorTruncation || flags & 4 /* NoTruncation */ ? undefined : 100;
            if (maxLength && result.length >= maxLength) {
                result = result.substr(0, maxLength - "...".length) + "...";
            }
            return result;
        }
        function getTypeAliasForTypeLiteral(type) {
            if (type.symbol && type.symbol.flags & 2048 /* TypeLiteral */) {
                var node = type.symbol.declarations[0].parent;
                while (node.kind === 155 /* ParenthesizedType */) {
                    node = node.parent;
                }
                if (node.kind === 211 /* TypeAliasDeclaration */) {
                    return getSymbolOfNode(node);
                }
            }
            return undefined;
        }
        // This is for caching the result of getSymbolDisplayBuilder. Do not access directly.
        var _displayBuilder;
        function getSymbolDisplayBuilder() {
            function getNameOfSymbol(symbol) {
                if (symbol.declarations && symbol.declarations.length) {
                    var declaration = symbol.declarations[0];
                    if (declaration.name) {
                        return ts.declarationNameToString(declaration.name);
                    }
                    switch (declaration.kind) {
                        case 181 /* ClassExpression */:
                            return "(Anonymous class)";
                        case 168 /* FunctionExpression */:
                        case 169 /* ArrowFunction */:
                            return "(Anonymous function)";
                    }
                }
                return symbol.name;
            }
            /**
             * Writes only the name of the symbol out to the writer. Uses the original source text
             * for the name of the symbol if it is available to match how the user inputted the name.
             */
            function appendSymbolNameOnly(symbol, writer) {
                writer.writeSymbol(getNameOfSymbol(symbol), symbol);
            }
            /**
             * Enclosing declaration is optional when we don't want to get qualified name in the enclosing declaration scope
             * Meaning needs to be specified if the enclosing declaration is given
             */
            function buildSymbolDisplay(symbol, writer, enclosingDeclaration, meaning, flags, typeFlags) {
                var parentSymbol;
                function appendParentTypeArgumentsAndSymbolName(symbol) {
                    if (parentSymbol) {
                        // Write type arguments of instantiated class/interface here
                        if (flags & 1 /* WriteTypeParametersOrArguments */) {
                            if (symbol.flags & 16777216 /* Instantiated */) {
                                buildDisplayForTypeArgumentsAndDelimiters(getTypeParametersOfClassOrInterface(parentSymbol), symbol.mapper, writer, enclosingDeclaration);
                            }
                            else {
                                buildTypeParameterDisplayFromSymbol(parentSymbol, writer, enclosingDeclaration);
                            }
                        }
                        writePunctuation(writer, 20 /* DotToken */);
                    }
                    parentSymbol = symbol;
                    appendSymbolNameOnly(symbol, writer);
                }
                // Let the writer know we just wrote out a symbol.  The declaration emitter writer uses
                // this to determine if an import it has previously seen (and not written out) needs
                // to be written to the file once the walk of the tree is complete.
                //
                // NOTE(cyrusn): This approach feels somewhat unfortunate.  A simple pass over the tree
                // up front (for example, during checking) could determine if we need to emit the imports
                // and we could then access that data during declaration emit.
                writer.trackSymbol(symbol, enclosingDeclaration, meaning);
                function walkSymbol(symbol, meaning) {
                    if (symbol) {
                        var accessibleSymbolChain = getAccessibleSymbolChain(symbol, enclosingDeclaration, meaning, !!(flags & 2 /* UseOnlyExternalAliasing */));
                        if (!accessibleSymbolChain ||
                            needsQualification(accessibleSymbolChain[0], enclosingDeclaration, accessibleSymbolChain.length === 1 ? meaning : getQualifiedLeftMeaning(meaning))) {
                            // Go up and add our parent.
                            walkSymbol(getParentOfSymbol(accessibleSymbolChain ? accessibleSymbolChain[0] : symbol), getQualifiedLeftMeaning(meaning));
                        }
                        if (accessibleSymbolChain) {
                            for (var _i = 0; _i < accessibleSymbolChain.length; _i++) {
                                var accessibleSymbol = accessibleSymbolChain[_i];
                                appendParentTypeArgumentsAndSymbolName(accessibleSymbol);
                            }
                        }
                        else {
                            // If we didn't find accessible symbol chain for this symbol, break if this is external module
                            if (!parentSymbol && ts.forEach(symbol.declarations, hasExternalModuleSymbol)) {
                                return;
                            }
                            // if this is anonymous type break
                            if (symbol.flags & 2048 /* TypeLiteral */ || symbol.flags & 4096 /* ObjectLiteral */) {
                                return;
                            }
                            appendParentTypeArgumentsAndSymbolName(symbol);
                        }
                    }
                }
                // Get qualified name if the symbol is not a type parameter
                // and there is an enclosing declaration or we specifically
                // asked for it
                var isTypeParameter = symbol.flags & 262144 /* TypeParameter */;
                var typeFormatFlag = 128 /* UseFullyQualifiedType */ & typeFlags;
                if (!isTypeParameter && (enclosingDeclaration || typeFormatFlag)) {
                    walkSymbol(symbol, meaning);
                    return;
                }
                return appendParentTypeArgumentsAndSymbolName(symbol);
            }
            function buildTypeDisplay(type, writer, enclosingDeclaration, globalFlags, symbolStack) {
                var globalFlagsToPass = globalFlags & 16 /* WriteOwnNameForAnyLike */;
                return writeType(type, globalFlags);
                function writeType(type, flags) {
                    // Write undefined/null type as any
                    if (type.flags & 2097279 /* Intrinsic */) {
                        // Special handling for unknown / resolving types, they should show up as any and not unknown or __resolving
                        writer.writeKeyword(!(globalFlags & 16 /* WriteOwnNameForAnyLike */) && isTypeAny(type)
                            ? "any"
                            : type.intrinsicName);
                    }
                    else if (type.flags & 4096 /* Reference */) {
                        writeTypeReference(type, flags);
                    }
                    else if (type.flags & (1024 /* Class */ | 2048 /* Interface */ | 128 /* Enum */ | 512 /* TypeParameter */)) {
                        // The specified symbol flags need to be reinterpreted as type flags
                        buildSymbolDisplay(type.symbol, writer, enclosingDeclaration, 793056 /* Type */, 0 /* None */, flags);
                    }
                    else if (type.flags & 8192 /* Tuple */) {
                        writeTupleType(type);
                    }
                    else if (type.flags & 16384 /* Union */) {
                        writeUnionType(type, flags);
                    }
                    else if (type.flags & 32768 /* Anonymous */) {
                        writeAnonymousType(type, flags);
                    }
                    else if (type.flags & 256 /* StringLiteral */) {
                        writer.writeStringLiteral(type.text);
                    }
                    else {
                        // Should never get here
                        // { ... }
                        writePunctuation(writer, 14 /* OpenBraceToken */);
                        writeSpace(writer);
                        writePunctuation(writer, 21 /* DotDotDotToken */);
                        writeSpace(writer);
                        writePunctuation(writer, 15 /* CloseBraceToken */);
                    }
                }
                function writeTypeList(types, union) {
                    for (var i = 0; i < types.length; i++) {
                        if (i > 0) {
                            if (union) {
                                writeSpace(writer);
                            }
                            writePunctuation(writer, union ? 45 /* BarToken */ : 23 /* CommaToken */);
                            writeSpace(writer);
                        }
                        writeType(types[i], union ? 64 /* InElementType */ : 0 /* None */);
                    }
                }
                function writeSymbolTypeReference(symbol, typeArguments, pos, end) {
                    // Unnamed function expressions, arrow functions, and unnamed class expressions have reserved names that
                    // we don't want to display
                    if (!isReservedMemberName(symbol.name)) {
                        buildSymbolDisplay(symbol, writer, enclosingDeclaration, 793056 /* Type */);
                    }
                    if (pos < end) {
                        writePunctuation(writer, 24 /* LessThanToken */);
                        writeType(typeArguments[pos++], 0 /* None */);
                        while (pos < end) {
                            writePunctuation(writer, 23 /* CommaToken */);
                            writeSpace(writer);
                            writeType(typeArguments[pos++], 0 /* None */);
                        }
                        writePunctuation(writer, 26 /* GreaterThanToken */);
                    }
                }
                function writeTypeReference(type, flags) {
                    var typeArguments = type.typeArguments;
                    if (type.target === globalArrayType && !(flags & 1 /* WriteArrayAsGenericType */)) {
                        writeType(typeArguments[0], 64 /* InElementType */);
                        writePunctuation(writer, 18 /* OpenBracketToken */);
                        writePunctuation(writer, 19 /* CloseBracketToken */);
                    }
                    else {
                        // Write the type reference in the format f<A>.g<B>.C<X, Y> where A and B are type arguments
                        // for outer type parameters, and f and g are the respective declaring containers of those
                        // type parameters.
                        var outerTypeParameters = type.target.outerTypeParameters;
                        var i = 0;
                        if (outerTypeParameters) {
                            var length_1 = outerTypeParameters.length;
                            while (i < length_1) {
                                // Find group of type arguments for type parameters with the same declaring container.
                                var start = i;
                                var parent_1 = getParentSymbolOfTypeParameter(outerTypeParameters[i]);
                                do {
                                    i++;
                                } while (i < length_1 && getParentSymbolOfTypeParameter(outerTypeParameters[i]) === parent_1);
                                // When type parameters are their own type arguments for the whole group (i.e. we have
                                // the default outer type arguments), we don't show the group.
                                if (!ts.rangeEquals(outerTypeParameters, typeArguments, start, i)) {
                                    writeSymbolTypeReference(parent_1, typeArguments, start, i);
                                    writePunctuation(writer, 20 /* DotToken */);
                                }
                            }
                        }
                        writeSymbolTypeReference(type.symbol, typeArguments, i, typeArguments.length);
                    }
                }
                function writeTupleType(type) {
                    writePunctuation(writer, 18 /* OpenBracketToken */);
                    writeTypeList(type.elementTypes, false);
                    writePunctuation(writer, 19 /* CloseBracketToken */);
                }
                function writeUnionType(type, flags) {
                    if (flags & 64 /* InElementType */) {
                        writePunctuation(writer, 16 /* OpenParenToken */);
                    }
                    writeTypeList(type.types, true);
                    if (flags & 64 /* InElementType */) {
                        writePunctuation(writer, 17 /* CloseParenToken */);
                    }
                }
                function writeAnonymousType(type, flags) {
                    var symbol = type.symbol;
                    if (symbol) {
                        // Always use 'typeof T' for type of class, enum, and module objects
                        if (symbol.flags & (32 /* Class */ | 384 /* Enum */ | 512 /* ValueModule */)) {
                            writeTypeofSymbol(type, flags);
                        }
                        else if (shouldWriteTypeOfFunctionSymbol()) {
                            writeTypeofSymbol(type, flags);
                        }
                        else if (ts.contains(symbolStack, symbol)) {
                            // If type is an anonymous type literal in a type alias declaration, use type alias name
                            var typeAlias = getTypeAliasForTypeLiteral(type);
                            if (typeAlias) {
                                // The specified symbol flags need to be reinterpreted as type flags
                                buildSymbolDisplay(typeAlias, writer, enclosingDeclaration, 793056 /* Type */, 0 /* None */, flags);
                            }
                            else {
                                // Recursive usage, use any
                                writeKeyword(writer, 113 /* AnyKeyword */);
                            }
                        }
                        else {
                            // Since instantiations of the same anonymous type have the same symbol, tracking symbols instead
                            // of types allows us to catch circular references to instantiations of the same anonymous type
                            if (!symbolStack) {
                                symbolStack = [];
                            }
                            symbolStack.push(symbol);
                            writeLiteralType(type, flags);
                            symbolStack.pop();
                        }
                    }
                    else {
                        // Anonymous types with no symbol are never circular
                        writeLiteralType(type, flags);
                    }
                    function shouldWriteTypeOfFunctionSymbol() {
                        var isStaticMethodSymbol = !!(symbol.flags & 8192 /* Method */ &&
                            ts.forEach(symbol.declarations, function (declaration) { return declaration.flags & 128 /* Static */; }));
                        var isNonLocalFunctionSymbol = !!(symbol.flags & 16 /* Function */) &&
                            (symbol.parent ||
                                ts.forEach(symbol.declarations, function (declaration) {
                                    return declaration.parent.kind === 243 /* SourceFile */ || declaration.parent.kind === 214 /* ModuleBlock */;
                                }));
                        if (isStaticMethodSymbol || isNonLocalFunctionSymbol) {
                            // typeof is allowed only for static/non local functions
                            return !!(flags & 2 /* UseTypeOfFunction */) ||
                                (ts.contains(symbolStack, symbol)); // it is type of the symbol uses itself recursively
                        }
                    }
                }
                function writeTypeofSymbol(type, typeFormatFlags) {
                    writeKeyword(writer, 98 /* TypeOfKeyword */);
                    writeSpace(writer);
                    buildSymbolDisplay(type.symbol, writer, enclosingDeclaration, 107455 /* Value */, 0 /* None */, typeFormatFlags);
                }
                function getIndexerParameterName(type, indexKind, fallbackName) {
                    var declaration = getIndexDeclarationOfSymbol(type.symbol, indexKind);
                    if (!declaration) {
                        // declaration might not be found if indexer was added from the contextual type.
                        // in this case use fallback name
                        return fallbackName;
                    }
                    ts.Debug.assert(declaration.parameters.length !== 0);
                    return ts.declarationNameToString(declaration.parameters[0].name);
                }
                function writeLiteralType(type, flags) {
                    var resolved = resolveObjectOrUnionTypeMembers(type);
                    if (!resolved.properties.length && !resolved.stringIndexType && !resolved.numberIndexType) {
                        if (!resolved.callSignatures.length && !resolved.constructSignatures.length) {
                            writePunctuation(writer, 14 /* OpenBraceToken */);
                            writePunctuation(writer, 15 /* CloseBraceToken */);
                            return;
                        }
                        if (resolved.callSignatures.length === 1 && !resolved.constructSignatures.length) {
                            if (flags & 64 /* InElementType */) {
                                writePunctuation(writer, 16 /* OpenParenToken */);
                            }
                            buildSignatureDisplay(resolved.callSignatures[0], writer, enclosingDeclaration, globalFlagsToPass | 8 /* WriteArrowStyleSignature */, symbolStack);
                            if (flags & 64 /* InElementType */) {
                                writePunctuation(writer, 17 /* CloseParenToken */);
                            }
                            return;
                        }
                        if (resolved.constructSignatures.length === 1 && !resolved.callSignatures.length) {
                            if (flags & 64 /* InElementType */) {
                                writePunctuation(writer, 16 /* OpenParenToken */);
                            }
                            writeKeyword(writer, 89 /* NewKeyword */);
                            writeSpace(writer);
                            buildSignatureDisplay(resolved.constructSignatures[0], writer, enclosingDeclaration, globalFlagsToPass | 8 /* WriteArrowStyleSignature */, symbolStack);
                            if (flags & 64 /* InElementType */) {
                                writePunctuation(writer, 17 /* CloseParenToken */);
                            }
                            return;
                        }
                    }
                    writePunctuation(writer, 14 /* OpenBraceToken */);
                    writer.writeLine();
                    writer.increaseIndent();
                    for (var _i = 0, _a = resolved.callSignatures; _i < _a.length; _i++) {
                        var signature = _a[_i];
                        buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, symbolStack);
                        writePunctuation(writer, 22 /* SemicolonToken */);
                        writer.writeLine();
                    }
                    for (var _b = 0, _c = resolved.constructSignatures; _b < _c.length; _b++) {
                        var signature = _c[_b];
                        writeKeyword(writer, 89 /* NewKeyword */);
                        writeSpace(writer);
                        buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, symbolStack);
                        writePunctuation(writer, 22 /* SemicolonToken */);
                        writer.writeLine();
                    }
                    if (resolved.stringIndexType) {
                        // [x: string]:
                        writePunctuation(writer, 18 /* OpenBracketToken */);
                        writer.writeParameter(getIndexerParameterName(resolved, 0 /* String */, "x"));
                        writePunctuation(writer, 52 /* ColonToken */);
                        writeSpace(writer);
                        writeKeyword(writer, 126 /* StringKeyword */);
                        writePunctuation(writer, 19 /* CloseBracketToken */);
                        writePunctuation(writer, 52 /* ColonToken */);
                        writeSpace(writer);
                        writeType(resolved.stringIndexType, 0 /* None */);
                        writePunctuation(writer, 22 /* SemicolonToken */);
                        writer.writeLine();
                    }
                    if (resolved.numberIndexType) {
                        // [x: number]:
                        writePunctuation(writer, 18 /* OpenBracketToken */);
                        writer.writeParameter(getIndexerParameterName(resolved, 1 /* Number */, "x"));
                        writePunctuation(writer, 52 /* ColonToken */);
                        writeSpace(writer);
                        writeKeyword(writer, 124 /* NumberKeyword */);
                        writePunctuation(writer, 19 /* CloseBracketToken */);
                        writePunctuation(writer, 52 /* ColonToken */);
                        writeSpace(writer);
                        writeType(resolved.numberIndexType, 0 /* None */);
                        writePunctuation(writer, 22 /* SemicolonToken */);
                        writer.writeLine();
                    }
                    for (var _d = 0, _e = resolved.properties; _d < _e.length; _d++) {
                        var p = _e[_d];
                        var t = getTypeOfSymbol(p);
                        if (p.flags & (16 /* Function */ | 8192 /* Method */) && !getPropertiesOfObjectType(t).length) {
                            var signatures = getSignaturesOfType(t, 0 /* Call */);
                            for (var _f = 0; _f < signatures.length; _f++) {
                                var signature = signatures[_f];
                                buildSymbolDisplay(p, writer);
                                if (p.flags & 536870912 /* Optional */) {
                                    writePunctuation(writer, 51 /* QuestionToken */);
                                }
                                buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, symbolStack);
                                writePunctuation(writer, 22 /* SemicolonToken */);
                                writer.writeLine();
                            }
                        }
                        else {
                            buildSymbolDisplay(p, writer);
                            if (p.flags & 536870912 /* Optional */) {
                                writePunctuation(writer, 51 /* QuestionToken */);
                            }
                            writePunctuation(writer, 52 /* ColonToken */);
                            writeSpace(writer);
                            writeType(t, 0 /* None */);
                            writePunctuation(writer, 22 /* SemicolonToken */);
                            writer.writeLine();
                        }
                    }
                    writer.decreaseIndent();
                    writePunctuation(writer, 15 /* CloseBraceToken */);
                }
            }
            function buildTypeParameterDisplayFromSymbol(symbol, writer, enclosingDeclaraiton, flags) {
                var targetSymbol = getTargetSymbol(symbol);
                if (targetSymbol.flags & 32 /* Class */ || targetSymbol.flags & 64 /* Interface */) {
                    buildDisplayForTypeParametersAndDelimiters(getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(symbol), writer, enclosingDeclaraiton, flags);
                }
            }
            function buildTypeParameterDisplay(tp, writer, enclosingDeclaration, flags, symbolStack) {
                appendSymbolNameOnly(tp.symbol, writer);
                var constraint = getConstraintOfTypeParameter(tp);
                if (constraint) {
                    writeSpace(writer);
                    writeKeyword(writer, 80 /* ExtendsKeyword */);
                    writeSpace(writer);
                    buildTypeDisplay(constraint, writer, enclosingDeclaration, flags, symbolStack);
                }
            }
            function buildParameterDisplay(p, writer, enclosingDeclaration, flags, symbolStack) {
                var parameterNode = p.valueDeclaration;
                if (ts.isRestParameter(parameterNode)) {
                    writePunctuation(writer, 21 /* DotDotDotToken */);
                }
                appendSymbolNameOnly(p, writer);
                if (isOptionalParameter(parameterNode)) {
                    writePunctuation(writer, 51 /* QuestionToken */);
                }
                writePunctuation(writer, 52 /* ColonToken */);
                writeSpace(writer);
                buildTypeDisplay(getTypeOfSymbol(p), writer, enclosingDeclaration, flags, symbolStack);
            }
            function buildDisplayForTypeParametersAndDelimiters(typeParameters, writer, enclosingDeclaration, flags, symbolStack) {
                if (typeParameters && typeParameters.length) {
                    writePunctuation(writer, 24 /* LessThanToken */);
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (i > 0) {
                            writePunctuation(writer, 23 /* CommaToken */);
                            writeSpace(writer);
                        }
                        buildTypeParameterDisplay(typeParameters[i], writer, enclosingDeclaration, flags, symbolStack);
                    }
                    writePunctuation(writer, 26 /* GreaterThanToken */);
                }
            }
            function buildDisplayForTypeArgumentsAndDelimiters(typeParameters, mapper, writer, enclosingDeclaration, flags, symbolStack) {
                if (typeParameters && typeParameters.length) {
                    writePunctuation(writer, 24 /* LessThanToken */);
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (i > 0) {
                            writePunctuation(writer, 23 /* CommaToken */);
                            writeSpace(writer);
                        }
                        buildTypeDisplay(mapper(typeParameters[i]), writer, enclosingDeclaration, 0 /* None */);
                    }
                    writePunctuation(writer, 26 /* GreaterThanToken */);
                }
            }
            function buildDisplayForParametersAndDelimiters(parameters, writer, enclosingDeclaration, flags, symbolStack) {
                writePunctuation(writer, 16 /* OpenParenToken */);
                for (var i = 0; i < parameters.length; i++) {
                    if (i > 0) {
                        writePunctuation(writer, 23 /* CommaToken */);
                        writeSpace(writer);
                    }
                    buildParameterDisplay(parameters[i], writer, enclosingDeclaration, flags, symbolStack);
                }
                writePunctuation(writer, 17 /* CloseParenToken */);
            }
            function buildReturnTypeDisplay(signature, writer, enclosingDeclaration, flags, symbolStack) {
                if (flags & 8 /* WriteArrowStyleSignature */) {
                    writeSpace(writer);
                    writePunctuation(writer, 33 /* EqualsGreaterThanToken */);
                }
                else {
                    writePunctuation(writer, 52 /* ColonToken */);
                }
                writeSpace(writer);
                buildTypeDisplay(getReturnTypeOfSignature(signature), writer, enclosingDeclaration, flags, symbolStack);
            }
            function buildSignatureDisplay(signature, writer, enclosingDeclaration, flags, symbolStack) {
                if (signature.target && (flags & 32 /* WriteTypeArgumentsOfSignature */)) {
                    // Instantiated signature, write type arguments instead
                    // This is achieved by passing in the mapper separately
                    buildDisplayForTypeArgumentsAndDelimiters(signature.target.typeParameters, signature.mapper, writer, enclosingDeclaration);
                }
                else {
                    buildDisplayForTypeParametersAndDelimiters(signature.typeParameters, writer, enclosingDeclaration, flags, symbolStack);
                }
                buildDisplayForParametersAndDelimiters(signature.parameters, writer, enclosingDeclaration, flags, symbolStack);
                buildReturnTypeDisplay(signature, writer, enclosingDeclaration, flags, symbolStack);
            }
            return _displayBuilder || (_displayBuilder = {
                symbolToString: symbolToString,
                typeToString: typeToString,
                buildSymbolDisplay: buildSymbolDisplay,
                buildTypeDisplay: buildTypeDisplay,
                buildTypeParameterDisplay: buildTypeParameterDisplay,
                buildParameterDisplay: buildParameterDisplay,
                buildDisplayForParametersAndDelimiters: buildDisplayForParametersAndDelimiters,
                buildDisplayForTypeParametersAndDelimiters: buildDisplayForTypeParametersAndDelimiters,
                buildDisplayForTypeArgumentsAndDelimiters: buildDisplayForTypeArgumentsAndDelimiters,
                buildTypeParameterDisplayFromSymbol: buildTypeParameterDisplayFromSymbol,
                buildSignatureDisplay: buildSignatureDisplay,
                buildReturnTypeDisplay: buildReturnTypeDisplay
            });
        }
        function isDeclarationVisible(node) {
            function getContainingExternalModule(node) {
                for (; node; node = node.parent) {
                    if (node.kind === 213 /* ModuleDeclaration */) {
                        if (node.name.kind === 8 /* StringLiteral */) {
                            return node;
                        }
                    }
                    else if (node.kind === 243 /* SourceFile */) {
                        return ts.isExternalModule(node) ? node : undefined;
                    }
                }
                ts.Debug.fail("getContainingModule cant reach here");
            }
            function isUsedInExportAssignment(node) {
                // Get source File and see if it is external module and has export assigned symbol
                var externalModule = getContainingExternalModule(node);
                var exportAssignmentSymbol;
                var resolvedExportSymbol;
                if (externalModule) {
                    // This is export assigned symbol node
                    var externalModuleSymbol = getSymbolOfNode(externalModule);
                    exportAssignmentSymbol = getExportAssignmentSymbol(externalModuleSymbol);
                    var symbolOfNode = getSymbolOfNode(node);
                    if (isSymbolUsedInExportAssignment(symbolOfNode)) {
                        return true;
                    }
                    // if symbolOfNode is alias declaration, resolve the symbol declaration and check
                    if (symbolOfNode.flags & 8388608 /* Alias */) {
                        return isSymbolUsedInExportAssignment(resolveAlias(symbolOfNode));
                    }
                }
                // Check if the symbol is used in export assignment
                function isSymbolUsedInExportAssignment(symbol) {
                    if (exportAssignmentSymbol === symbol) {
                        return true;
                    }
                    if (exportAssignmentSymbol && !!(exportAssignmentSymbol.flags & 8388608 /* Alias */)) {
                        // if export assigned symbol is alias declaration, resolve the alias
                        resolvedExportSymbol = resolvedExportSymbol || resolveAlias(exportAssignmentSymbol);
                        if (resolvedExportSymbol === symbol) {
                            return true;
                        }
                        // Container of resolvedExportSymbol is visible
                        return ts.forEach(resolvedExportSymbol.declarations, function (current) {
                            while (current) {
                                if (current === node) {
                                    return true;
                                }
                                current = current.parent;
                            }
                        });
                    }
                }
            }
            function determineIfDeclarationIsVisible() {
                switch (node.kind) {
                    case 158 /* BindingElement */:
                        return isDeclarationVisible(node.parent.parent);
                    case 206 /* VariableDeclaration */:
                        if (ts.isBindingPattern(node.name) &&
                            !node.name.elements.length) {
                            // If the binding pattern is empty, this variable declaration is not visible
                            return false;
                        }
                    // Otherwise fall through
                    case 213 /* ModuleDeclaration */:
                    case 209 /* ClassDeclaration */:
                    case 210 /* InterfaceDeclaration */:
                    case 211 /* TypeAliasDeclaration */:
                    case 208 /* FunctionDeclaration */:
                    case 212 /* EnumDeclaration */:
                    case 216 /* ImportEqualsDeclaration */:
                        var parent_2 = getDeclarationContainer(node);
                        // If the node is not exported or it is not ambient module element (except import declaration)
                        if (!(ts.getCombinedNodeFlags(node) & 1 /* Export */) &&
                            !(node.kind !== 216 /* ImportEqualsDeclaration */ && parent_2.kind !== 243 /* SourceFile */ && ts.isInAmbientContext(parent_2))) {
                            return isGlobalSourceFile(parent_2);
                        }
                        // Exported members/ambient module elements (exception import declaration) are visible if parent is visible
                        return isDeclarationVisible(parent_2);
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                        if (node.flags & (32 /* Private */ | 64 /* Protected */)) {
                            // Private/protected properties/methods are not visible
                            return false;
                        }
                    // Public properties/methods are visible if its parents are visible, so let it fall into next case statement
                    case 140 /* Constructor */:
                    case 144 /* ConstructSignature */:
                    case 143 /* CallSignature */:
                    case 145 /* IndexSignature */:
                    case 134 /* Parameter */:
                    case 214 /* ModuleBlock */:
                    case 148 /* FunctionType */:
                    case 149 /* ConstructorType */:
                    case 151 /* TypeLiteral */:
                    case 147 /* TypeReference */:
                    case 152 /* ArrayType */:
                    case 153 /* TupleType */:
                    case 154 /* UnionType */:
                    case 155 /* ParenthesizedType */:
                        return isDeclarationVisible(node.parent);
                    // Default binding, import specifier and namespace import is visible 
                    // only on demand so by default it is not visible
                    case 218 /* ImportClause */:
                    case 219 /* NamespaceImport */:
                    case 221 /* ImportSpecifier */:
                        return false;
                    // Type parameters are always visible
                    case 133 /* TypeParameter */:
                    // Source file is always visible
                    case 243 /* SourceFile */:
                        return true;
                    // Export assignements do not create name bindings outside the module
                    case 222 /* ExportAssignment */:
                        return false;
                    default:
                        ts.Debug.fail("isDeclarationVisible unknown: SyntaxKind: " + node.kind);
                }
            }
            if (node) {
                var links = getNodeLinks(node);
                if (links.isVisible === undefined) {
                    links.isVisible = !!determineIfDeclarationIsVisible();
                }
                return links.isVisible;
            }
        }
        function collectLinkedAliases(node) {
            var exportSymbol;
            if (node.parent && node.parent.kind === 222 /* ExportAssignment */) {
                exportSymbol = resolveName(node.parent, node.text, 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */, ts.Diagnostics.Cannot_find_name_0, node);
            }
            else if (node.parent.kind === 225 /* ExportSpecifier */) {
                exportSymbol = getTargetOfExportSpecifier(node.parent);
            }
            var result = [];
            if (exportSymbol) {
                buildVisibleNodeList(exportSymbol.declarations);
            }
            return result;
            function buildVisibleNodeList(declarations) {
                ts.forEach(declarations, function (declaration) {
                    getNodeLinks(declaration).isVisible = true;
                    var resultNode = getAnyImportSyntax(declaration) || declaration;
                    if (!ts.contains(result, resultNode)) {
                        result.push(resultNode);
                    }
                    if (ts.isInternalModuleImportEqualsDeclaration(declaration)) {
                        // Add the referenced top container visible
                        var internalModuleReference = declaration.moduleReference;
                        var firstIdentifier = getFirstIdentifier(internalModuleReference);
                        var importSymbol = resolveName(declaration, firstIdentifier.text, 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */, ts.Diagnostics.Cannot_find_name_0, firstIdentifier);
                        buildVisibleNodeList(importSymbol.declarations);
                    }
                });
            }
        }
        // Push an entry on the type resolution stack. If an entry with the given target is not already on the stack,
        // a new entry with that target and an associated result value of true is pushed on the stack, and the value
        // true is returned. Otherwise, a circularity has occurred and the result values of the existing entry and
        // all entries pushed after it are changed to false, and the value false is returned. The target object provides
        // a unique identity for a particular type resolution result: Symbol instances are used to track resolution of
        // SymbolLinks.type, SymbolLinks instances are used to track resolution of SymbolLinks.declaredType, and
        // Signature instances are used to track resolution of Signature.resolvedReturnType.
        function pushTypeResolution(target) {
            var i = 0;
            var count = resolutionTargets.length;
            while (i < count && resolutionTargets[i] !== target) {
                i++;
            }
            if (i < count) {
                do {
                    resolutionResults[i++] = false;
                } while (i < count);
                return false;
            }
            resolutionTargets.push(target);
            resolutionResults.push(true);
            return true;
        }
        // Pop an entry from the type resolution stack and return its associated result value. The result value will
        // be true if no circularities were detected, or false if a circularity was found.
        function popTypeResolution() {
            resolutionTargets.pop();
            return resolutionResults.pop();
        }
        function getDeclarationContainer(node) {
            node = ts.getRootDeclaration(node);
            // Parent chain:
            // VaribleDeclaration -> VariableDeclarationList -> VariableStatement -> 'Declaration Container'
            return node.kind === 206 /* VariableDeclaration */ ? node.parent.parent.parent : node.parent;
        }
        function getTypeOfPrototypeProperty(prototype) {
            // TypeScript 1.0 spec (April 2014): 8.4
            // Every class automatically contains a static property member named 'prototype',
            // the type of which is an instantiation of the class type with type Any supplied as a type argument for each type parameter.
            // It is an error to explicitly declare a static property member with the name 'prototype'.
            var classType = getDeclaredTypeOfSymbol(prototype.parent);
            return classType.typeParameters ? createTypeReference(classType, ts.map(classType.typeParameters, function (_) { return anyType; })) : classType;
        }
        // Return the type of the given property in the given type, or undefined if no such property exists
        function getTypeOfPropertyOfType(type, name) {
            var prop = getPropertyOfType(type, name);
            return prop ? getTypeOfSymbol(prop) : undefined;
        }
        function isTypeAny(type) {
            return type && (type.flags & 1 /* Any */) !== 0;
        }
        // Return the inferred type for a binding element
        function getTypeForBindingElement(declaration) {
            var pattern = declaration.parent;
            var parentType = getTypeForVariableLikeDeclaration(pattern.parent);
            // If parent has the unknown (error) type, then so does this binding element
            if (parentType === unknownType) {
                return unknownType;
            }
            // If no type was specified or inferred for parent, or if the specified or inferred type is any,
            // infer from the initializer of the binding element if one is present. Otherwise, go with the
            // undefined or any type of the parent.
            if (!parentType || isTypeAny(parentType)) {
                if (declaration.initializer) {
                    return checkExpressionCached(declaration.initializer);
                }
                return parentType;
            }
            var type;
            if (pattern.kind === 156 /* ObjectBindingPattern */) {
                // Use explicitly specified property name ({ p: xxx } form), or otherwise the implied name ({ p } form)
                var name_2 = declaration.propertyName || declaration.name;
                // Use type of the specified property, or otherwise, for a numeric name, the type of the numeric index signature,
                // or otherwise the type of the string index signature.
                type = getTypeOfPropertyOfType(parentType, name_2.text) ||
                    isNumericLiteralName(name_2.text) && getIndexTypeOfType(parentType, 1 /* Number */) ||
                    getIndexTypeOfType(parentType, 0 /* String */);
                if (!type) {
                    error(name_2, ts.Diagnostics.Type_0_has_no_property_1_and_no_string_index_signature, typeToString(parentType), ts.declarationNameToString(name_2));
                    return unknownType;
                }
            }
            else {
                // This elementType will be used if the specific property corresponding to this index is not
                // present (aka the tuple element property). This call also checks that the parentType is in
                // fact an iterable or array (depending on target language).
                var elementType = checkIteratedTypeOrElementType(parentType, pattern, false);
                if (!declaration.dotDotDotToken) {
                    if (isTypeAny(elementType)) {
                        return elementType;
                    }
                    // Use specific property type when parent is a tuple or numeric index type when parent is an array
                    var propName = "" + ts.indexOf(pattern.elements, declaration);
                    type = isTupleLikeType(parentType)
                        ? getTypeOfPropertyOfType(parentType, propName)
                        : elementType;
                    if (!type) {
                        if (isTupleType(parentType)) {
                            error(declaration, ts.Diagnostics.Tuple_type_0_with_length_1_cannot_be_assigned_to_tuple_with_length_2, typeToString(parentType), parentType.elementTypes.length, pattern.elements.length);
                        }
                        else {
                            error(declaration, ts.Diagnostics.Type_0_has_no_property_1, typeToString(parentType), propName);
                        }
                        return unknownType;
                    }
                }
                else {
                    // Rest element has an array type with the same element type as the parent type
                    type = createArrayType(elementType);
                }
            }
            return type;
        }
        // Return the inferred type for a variable, parameter, or property declaration
        function getTypeForVariableLikeDeclaration(declaration) {
            // A variable declared in a for..in statement is always of type any
            if (declaration.parent.parent.kind === 195 /* ForInStatement */) {
                return anyType;
            }
            if (declaration.parent.parent.kind === 196 /* ForOfStatement */) {
                // checkRightHandSideOfForOf will return undefined if the for-of expression type was
                // missing properties/signatures required to get its iteratedType (like
                // [Symbol.iterator] or next). This may be because we accessed properties from anyType,
                // or it may have led to an error inside getElementTypeOfIterable.
                return checkRightHandSideOfForOf(declaration.parent.parent.expression) || anyType;
            }
            if (ts.isBindingPattern(declaration.parent)) {
                return getTypeForBindingElement(declaration);
            }
            // Use type from type annotation if one is present
            if (declaration.type) {
                return getTypeFromTypeNode(declaration.type);
            }
            if (declaration.kind === 134 /* Parameter */) {
                var func = declaration.parent;
                // For a parameter of a set accessor, use the type of the get accessor if one is present
                if (func.kind === 142 /* SetAccessor */ && !ts.hasDynamicName(func)) {
                    var getter = ts.getDeclarationOfKind(declaration.parent.symbol, 141 /* GetAccessor */);
                    if (getter) {
                        return getReturnTypeOfSignature(getSignatureFromDeclaration(getter));
                    }
                }
                // Use contextual parameter type if one is available
                var type = getContextuallyTypedParameterType(declaration);
                if (type) {
                    return type;
                }
            }
            // Use the type of the initializer expression if one is present
            if (declaration.initializer) {
                return checkExpressionCached(declaration.initializer);
            }
            // If it is a short-hand property assignment, use the type of the identifier
            if (declaration.kind === 241 /* ShorthandPropertyAssignment */) {
                return checkIdentifier(declaration.name);
            }
            // No type specified and nothing can be inferred
            return undefined;
        }
        // Return the type implied by a binding pattern element. This is the type of the initializer of the element if
        // one is present. Otherwise, if the element is itself a binding pattern, it is the type implied by the binding
        // pattern. Otherwise, it is the type any.
        function getTypeFromBindingElement(element) {
            if (element.initializer) {
                return getWidenedType(checkExpressionCached(element.initializer));
            }
            if (ts.isBindingPattern(element.name)) {
                return getTypeFromBindingPattern(element.name);
            }
            return anyType;
        }
        // Return the type implied by an object binding pattern
        function getTypeFromObjectBindingPattern(pattern) {
            var members = {};
            ts.forEach(pattern.elements, function (e) {
                var flags = 4 /* Property */ | 67108864 /* Transient */ | (e.initializer ? 536870912 /* Optional */ : 0);
                var name = e.propertyName || e.name;
                var symbol = createSymbol(flags, name.text);
                symbol.type = getTypeFromBindingElement(e);
                members[symbol.name] = symbol;
            });
            return createAnonymousType(undefined, members, emptyArray, emptyArray, undefined, undefined);
        }
        // Return the type implied by an array binding pattern
        function getTypeFromArrayBindingPattern(pattern) {
            var hasSpreadElement = false;
            var elementTypes = [];
            ts.forEach(pattern.elements, function (e) {
                elementTypes.push(e.kind === 182 /* OmittedExpression */ || e.dotDotDotToken ? anyType : getTypeFromBindingElement(e));
                if (e.dotDotDotToken) {
                    hasSpreadElement = true;
                }
            });
            if (!elementTypes.length) {
                return languageVersion >= 2 /* ES6 */ ? createIterableType(anyType) : anyArrayType;
            }
            else if (hasSpreadElement) {
                var unionOfElements = getUnionType(elementTypes);
                return languageVersion >= 2 /* ES6 */ ? createIterableType(unionOfElements) : createArrayType(unionOfElements);
            }
            // If the pattern has at least one element, and no rest element, then it should imply a tuple type.
            return createTupleType(elementTypes);
        }
        // Return the type implied by a binding pattern. This is the type implied purely by the binding pattern itself
        // and without regard to its context (i.e. without regard any type annotation or initializer associated with the
        // declaration in which the binding pattern is contained). For example, the implied type of [x, y] is [any, any]
        // and the implied type of { x, y: z = 1 } is { x: any; y: number; }. The type implied by a binding pattern is
        // used as the contextual type of an initializer associated with the binding pattern. Also, for a destructuring
        // parameter with no type annotation or initializer, the type implied by the binding pattern becomes the type of
        // the parameter.
        function getTypeFromBindingPattern(pattern) {
            return pattern.kind === 156 /* ObjectBindingPattern */
                ? getTypeFromObjectBindingPattern(pattern)
                : getTypeFromArrayBindingPattern(pattern);
        }
        // Return the type associated with a variable, parameter, or property declaration. In the simple case this is the type
        // specified in a type annotation or inferred from an initializer. However, in the case of a destructuring declaration it
        // is a bit more involved. For example:
        //
        //   var [x, s = ""] = [1, "one"];
        //
        // Here, the array literal [1, "one"] is contextually typed by the type [any, string], which is the implied type of the
        // binding pattern [x, s = ""]. Because the contextual type is a tuple type, the resulting type of [1, "one"] is the
        // tuple type [number, string]. Thus, the type inferred for 'x' is number and the type inferred for 's' is string.
        function getWidenedTypeForVariableLikeDeclaration(declaration, reportErrors) {
            var type = getTypeForVariableLikeDeclaration(declaration);
            if (type) {
                if (reportErrors) {
                    reportErrorsFromWidening(declaration, type);
                }
                // During a normal type check we'll never get to here with a property assignment (the check of the containing
                // object literal uses a different path). We exclude widening only so that language services and type verification
                // tools see the actual type.
                return declaration.kind !== 240 /* PropertyAssignment */ ? getWidenedType(type) : type;
            }
            // If no type was specified and nothing could be inferred, and if the declaration specifies a binding pattern, use
            // the type implied by the binding pattern
            if (ts.isBindingPattern(declaration.name)) {
                return getTypeFromBindingPattern(declaration.name);
            }
            // Rest parameters default to type any[], other parameters default to type any
            type = declaration.dotDotDotToken ? anyArrayType : anyType;
            // Report implicit any errors unless this is a private property within an ambient declaration
            if (reportErrors && compilerOptions.noImplicitAny) {
                var root = ts.getRootDeclaration(declaration);
                if (!isPrivateWithinAmbient(root) && !(root.kind === 134 /* Parameter */ && isPrivateWithinAmbient(root.parent))) {
                    reportImplicitAnyError(declaration, type);
                }
            }
            return type;
        }
        function getTypeOfVariableOrParameterOrProperty(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                // Handle prototype property
                if (symbol.flags & 134217728 /* Prototype */) {
                    return links.type = getTypeOfPrototypeProperty(symbol);
                }
                // Handle catch clause variables
                var declaration = symbol.valueDeclaration;
                if (declaration.parent.kind === 239 /* CatchClause */) {
                    return links.type = anyType;
                }
                // Handle export default expressions
                if (declaration.kind === 222 /* ExportAssignment */) {
                    return links.type = checkExpression(declaration.expression);
                }
                // Handle variable, parameter or property
                if (!pushTypeResolution(symbol)) {
                    return unknownType;
                }
                var type = getWidenedTypeForVariableLikeDeclaration(declaration, true);
                if (!popTypeResolution()) {
                    if (symbol.valueDeclaration.type) {
                        // Variable has type annotation that circularly references the variable itself
                        type = unknownType;
                        error(symbol.valueDeclaration, ts.Diagnostics._0_is_referenced_directly_or_indirectly_in_its_own_type_annotation, symbolToString(symbol));
                    }
                    else {
                        // Variable has initializer that circularly references the variable itself
                        type = anyType;
                        if (compilerOptions.noImplicitAny) {
                            error(symbol.valueDeclaration, ts.Diagnostics._0_implicitly_has_type_any_because_it_does_not_have_a_type_annotation_and_is_referenced_directly_or_indirectly_in_its_own_initializer, symbolToString(symbol));
                        }
                    }
                }
                links.type = type;
            }
            return links.type;
        }
        function getSetAccessorTypeAnnotationNode(accessor) {
            return accessor && accessor.parameters.length > 0 && accessor.parameters[0].type;
        }
        function getAnnotatedAccessorType(accessor) {
            if (accessor) {
                if (accessor.kind === 141 /* GetAccessor */) {
                    return accessor.type && getTypeFromTypeNode(accessor.type);
                }
                else {
                    var setterTypeAnnotation = getSetAccessorTypeAnnotationNode(accessor);
                    return setterTypeAnnotation && getTypeFromTypeNode(setterTypeAnnotation);
                }
            }
            return undefined;
        }
        function getTypeOfAccessors(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                if (!pushTypeResolution(symbol)) {
                    return unknownType;
                }
                var getter = ts.getDeclarationOfKind(symbol, 141 /* GetAccessor */);
                var setter = ts.getDeclarationOfKind(symbol, 142 /* SetAccessor */);
                var type;
                // First try to see if the user specified a return type on the get-accessor.
                var getterReturnType = getAnnotatedAccessorType(getter);
                if (getterReturnType) {
                    type = getterReturnType;
                }
                else {
                    // If the user didn't specify a return type, try to use the set-accessor's parameter type.
                    var setterParameterType = getAnnotatedAccessorType(setter);
                    if (setterParameterType) {
                        type = setterParameterType;
                    }
                    else {
                        // If there are no specified types, try to infer it from the body of the get accessor if it exists.
                        if (getter && getter.body) {
                            type = getReturnTypeFromBody(getter);
                        }
                        else {
                            if (compilerOptions.noImplicitAny) {
                                error(setter, ts.Diagnostics.Property_0_implicitly_has_type_any_because_its_set_accessor_lacks_a_type_annotation, symbolToString(symbol));
                            }
                            type = anyType;
                        }
                    }
                }
                if (!popTypeResolution()) {
                    type = anyType;
                    if (compilerOptions.noImplicitAny) {
                        var getter_1 = ts.getDeclarationOfKind(symbol, 141 /* GetAccessor */);
                        error(getter_1, ts.Diagnostics._0_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions, symbolToString(symbol));
                    }
                }
                links.type = type;
            }
            return links.type;
        }
        function getTypeOfFuncClassEnumModule(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = createObjectType(32768 /* Anonymous */, symbol);
            }
            return links.type;
        }
        function getTypeOfEnumMember(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = getDeclaredTypeOfEnum(getParentOfSymbol(symbol));
            }
            return links.type;
        }
        function getTypeOfAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                var targetSymbol = resolveAlias(symbol);
                // It only makes sense to get the type of a value symbol. If the result of resolving
                // the alias is not a value, then it has no type. To get the type associated with a
                // type symbol, call getDeclaredTypeOfSymbol.
                // This check is important because without it, a call to getTypeOfSymbol could end
                // up recursively calling getTypeOfAlias, causing a stack overflow.
                links.type = targetSymbol.flags & 107455 /* Value */
                    ? getTypeOfSymbol(targetSymbol)
                    : unknownType;
            }
            return links.type;
        }
        function getTypeOfInstantiatedSymbol(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = instantiateType(getTypeOfSymbol(links.target), links.mapper);
            }
            return links.type;
        }
        function getTypeOfSymbol(symbol) {
            if (symbol.flags & 16777216 /* Instantiated */) {
                return getTypeOfInstantiatedSymbol(symbol);
            }
            if (symbol.flags & (3 /* Variable */ | 4 /* Property */)) {
                return getTypeOfVariableOrParameterOrProperty(symbol);
            }
            if (symbol.flags & (16 /* Function */ | 8192 /* Method */ | 32 /* Class */ | 384 /* Enum */ | 512 /* ValueModule */)) {
                return getTypeOfFuncClassEnumModule(symbol);
            }
            if (symbol.flags & 8 /* EnumMember */) {
                return getTypeOfEnumMember(symbol);
            }
            if (symbol.flags & 98304 /* Accessor */) {
                return getTypeOfAccessors(symbol);
            }
            if (symbol.flags & 8388608 /* Alias */) {
                return getTypeOfAlias(symbol);
            }
            return unknownType;
        }
        function getTargetType(type) {
            return type.flags & 4096 /* Reference */ ? type.target : type;
        }
        function hasBaseType(type, checkBase) {
            return check(type);
            function check(type) {
                var target = getTargetType(type);
                return target === checkBase || ts.forEach(getBaseTypes(target), check);
            }
        }
        // Appends the type parameters given by a list of declarations to a set of type parameters and returns the resulting set.
        // The function allocates a new array if the input type parameter set is undefined, but otherwise it modifies the set
        // in-place and returns the same array.
        function appendTypeParameters(typeParameters, declarations) {
            for (var _i = 0; _i < declarations.length; _i++) {
                var declaration = declarations[_i];
                var tp = getDeclaredTypeOfTypeParameter(getSymbolOfNode(declaration));
                if (!typeParameters) {
                    typeParameters = [tp];
                }
                else if (!ts.contains(typeParameters, tp)) {
                    typeParameters.push(tp);
                }
            }
            return typeParameters;
        }
        // Appends the outer type parameters of a node to a set of type parameters and returns the resulting set. The function
        // allocates a new array if the input type parameter set is undefined, but otherwise it modifies the set in-place and
        // returns the same array.
        function appendOuterTypeParameters(typeParameters, node) {
            while (true) {
                node = node.parent;
                if (!node) {
                    return typeParameters;
                }
                if (node.kind === 209 /* ClassDeclaration */ || node.kind === 181 /* ClassExpression */ ||
                    node.kind === 208 /* FunctionDeclaration */ || node.kind === 168 /* FunctionExpression */ ||
                    node.kind === 139 /* MethodDeclaration */ || node.kind === 169 /* ArrowFunction */) {
                    var declarations = node.typeParameters;
                    if (declarations) {
                        return appendTypeParameters(appendOuterTypeParameters(typeParameters, node), declarations);
                    }
                }
            }
        }
        // The outer type parameters are those defined by enclosing generic classes, methods, or functions.
        function getOuterTypeParametersOfClassOrInterface(symbol) {
            var declaration = symbol.flags & 32 /* Class */ ? symbol.valueDeclaration : ts.getDeclarationOfKind(symbol, 210 /* InterfaceDeclaration */);
            return appendOuterTypeParameters(undefined, declaration);
        }
        // The local type parameters are the combined set of type parameters from all declarations of the class,
        // interface, or type alias.
        function getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(symbol) {
            var result;
            for (var _i = 0, _a = symbol.declarations; _i < _a.length; _i++) {
                var node = _a[_i];
                if (node.kind === 210 /* InterfaceDeclaration */ || node.kind === 209 /* ClassDeclaration */ ||
                    node.kind === 181 /* ClassExpression */ || node.kind === 211 /* TypeAliasDeclaration */) {
                    var declaration = node;
                    if (declaration.typeParameters) {
                        result = appendTypeParameters(result, declaration.typeParameters);
                    }
                }
            }
            return result;
        }
        // The full set of type parameters for a generic class or interface type consists of its outer type parameters plus
        // its locally declared type parameters.
        function getTypeParametersOfClassOrInterface(symbol) {
            return ts.concatenate(getOuterTypeParametersOfClassOrInterface(symbol), getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(symbol));
        }
        function isConstructorType(type) {
            return type.flags & 48128 /* ObjectType */ && getSignaturesOfType(type, 1 /* Construct */).length > 0;
        }
        function getBaseTypeNodeOfClass(type) {
            return ts.getClassExtendsHeritageClauseElement(type.symbol.valueDeclaration);
        }
        function getConstructorsForTypeArguments(type, typeArgumentNodes) {
            var typeArgCount = typeArgumentNodes ? typeArgumentNodes.length : 0;
            return ts.filter(getSignaturesOfType(type, 1 /* Construct */), function (sig) { return (sig.typeParameters ? sig.typeParameters.length : 0) === typeArgCount; });
        }
        function getInstantiatedConstructorsForTypeArguments(type, typeArgumentNodes) {
            var signatures = getConstructorsForTypeArguments(type, typeArgumentNodes);
            if (typeArgumentNodes) {
                var typeArguments = ts.map(typeArgumentNodes, getTypeFromTypeNode);
                signatures = ts.map(signatures, function (sig) { return getSignatureInstantiation(sig, typeArguments); });
            }
            return signatures;
        }
        // The base constructor of a class can resolve to
        // undefinedType if the class has no extends clause,
        // unknownType if an error occurred during resolution of the extends expression,
        // nullType if the extends expression is the null value, or
        // an object type with at least one construct signature.
        function getBaseConstructorTypeOfClass(type) {
            if (!type.resolvedBaseConstructorType) {
                var baseTypeNode = getBaseTypeNodeOfClass(type);
                if (!baseTypeNode) {
                    return type.resolvedBaseConstructorType = undefinedType;
                }
                if (!pushTypeResolution(type)) {
                    return unknownType;
                }
                var baseConstructorType = checkExpression(baseTypeNode.expression);
                if (baseConstructorType.flags & 48128 /* ObjectType */) {
                    // Resolving the members of a class requires us to resolve the base class of that class.
                    // We force resolution here such that we catch circularities now.
                    resolveObjectOrUnionTypeMembers(baseConstructorType);
                }
                if (!popTypeResolution()) {
                    error(type.symbol.valueDeclaration, ts.Diagnostics._0_is_referenced_directly_or_indirectly_in_its_own_base_expression, symbolToString(type.symbol));
                    return type.resolvedBaseConstructorType = unknownType;
                }
                if (baseConstructorType !== unknownType && baseConstructorType !== nullType && !isConstructorType(baseConstructorType)) {
                    error(baseTypeNode.expression, ts.Diagnostics.Type_0_is_not_a_constructor_function_type, typeToString(baseConstructorType));
                    return type.resolvedBaseConstructorType = unknownType;
                }
                type.resolvedBaseConstructorType = baseConstructorType;
            }
            return type.resolvedBaseConstructorType;
        }
        function getBaseTypes(type) {
            if (!type.resolvedBaseTypes) {
                if (type.symbol.flags & 32 /* Class */) {
                    resolveBaseTypesOfClass(type);
                }
                else if (type.symbol.flags & 64 /* Interface */) {
                    resolveBaseTypesOfInterface(type);
                }
                else {
                    ts.Debug.fail("type must be class or interface");
                }
            }
            return type.resolvedBaseTypes;
        }
        function resolveBaseTypesOfClass(type) {
            type.resolvedBaseTypes = emptyArray;
            var baseContructorType = getBaseConstructorTypeOfClass(type);
            if (!(baseContructorType.flags & 48128 /* ObjectType */)) {
                return;
            }
            var baseTypeNode = getBaseTypeNodeOfClass(type);
            var baseType;
            if (baseContructorType.symbol && baseContructorType.symbol.flags & 32 /* Class */) {
                // When base constructor type is a class we know that the constructors all have the same type parameters as the
                // class and all return the instance type of the class. There is no need for further checks and we can apply the
                // type arguments in the same manner as a type reference to get the same error reporting experience.
                baseType = getTypeFromClassOrInterfaceReference(baseTypeNode, baseContructorType.symbol);
            }
            else {
                // The class derives from a "class-like" constructor function, check that we have at least one construct signature
                // with a matching number of type parameters and use the return type of the first instantiated signature. Elsewhere
                // we check that all instantiated signatures return the same type.
                var constructors = getInstantiatedConstructorsForTypeArguments(baseContructorType, baseTypeNode.typeArguments);
                if (!constructors.length) {
                    error(baseTypeNode.expression, ts.Diagnostics.No_base_constructor_has_the_specified_number_of_type_arguments);
                    return;
                }
                baseType = getReturnTypeOfSignature(constructors[0]);
            }
            if (baseType === unknownType) {
                return;
            }
            if (!(getTargetType(baseType).flags & (1024 /* Class */ | 2048 /* Interface */))) {
                error(baseTypeNode.expression, ts.Diagnostics.Base_constructor_return_type_0_is_not_a_class_or_interface_type, typeToString(baseType));
                return;
            }
            if (type === baseType || hasBaseType(baseType, type)) {
                error(type.symbol.valueDeclaration, ts.Diagnostics.Type_0_recursively_references_itself_as_a_base_type, typeToString(type, undefined, 1 /* WriteArrayAsGenericType */));
                return;
            }
            type.resolvedBaseTypes = [baseType];
        }
        function resolveBaseTypesOfInterface(type) {
            type.resolvedBaseTypes = [];
            for (var _i = 0, _a = type.symbol.declarations; _i < _a.length; _i++) {
                var declaration = _a[_i];
                if (declaration.kind === 210 /* InterfaceDeclaration */ && ts.getInterfaceBaseTypeNodes(declaration)) {
                    for (var _b = 0, _c = ts.getInterfaceBaseTypeNodes(declaration); _b < _c.length; _b++) {
                        var node = _c[_b];
                        var baseType = getTypeFromTypeNode(node);
                        if (baseType !== unknownType) {
                            if (getTargetType(baseType).flags & (1024 /* Class */ | 2048 /* Interface */)) {
                                if (type !== baseType && !hasBaseType(baseType, type)) {
                                    type.resolvedBaseTypes.push(baseType);
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Type_0_recursively_references_itself_as_a_base_type, typeToString(type, undefined, 1 /* WriteArrayAsGenericType */));
                                }
                            }
                            else {
                                error(node, ts.Diagnostics.An_interface_may_only_extend_a_class_or_another_interface);
                            }
                        }
                    }
                }
            }
        }
        function getDeclaredTypeOfClassOrInterface(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var kind = symbol.flags & 32 /* Class */ ? 1024 /* Class */ : 2048 /* Interface */;
                var type = links.declaredType = createObjectType(kind, symbol);
                var outerTypeParameters = getOuterTypeParametersOfClassOrInterface(symbol);
                var localTypeParameters = getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(symbol);
                if (outerTypeParameters || localTypeParameters) {
                    type.flags |= 4096 /* Reference */;
                    type.typeParameters = ts.concatenate(outerTypeParameters, localTypeParameters);
                    type.outerTypeParameters = outerTypeParameters;
                    type.localTypeParameters = localTypeParameters;
                    type.instantiations = {};
                    type.instantiations[getTypeListId(type.typeParameters)] = type;
                    type.target = type;
                    type.typeArguments = type.typeParameters;
                }
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfTypeAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                // Note that we use the links object as the target here because the symbol object is used as the unique
                // identity for resolution of the 'type' property in SymbolLinks.
                if (!pushTypeResolution(links)) {
                    return unknownType;
                }
                var declaration = ts.getDeclarationOfKind(symbol, 211 /* TypeAliasDeclaration */);
                var type = getTypeFromTypeNode(declaration.type);
                if (popTypeResolution()) {
                    links.typeParameters = getLocalTypeParametersOfClassOrInterfaceOrTypeAlias(symbol);
                    if (links.typeParameters) {
                        // Initialize the instantiation cache for generic type aliases. The declared type corresponds to
                        // an instantiation of the type alias with the type parameters supplied as type arguments.
                        links.instantiations = {};
                        links.instantiations[getTypeListId(links.typeParameters)] = type;
                    }
                }
                else {
                    type = unknownType;
                    error(declaration.name, ts.Diagnostics.Type_alias_0_circularly_references_itself, symbolToString(symbol));
                }
                links.declaredType = type;
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfEnum(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var type = createType(128 /* Enum */);
                type.symbol = symbol;
                links.declaredType = type;
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfTypeParameter(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var type = createType(512 /* TypeParameter */);
                type.symbol = symbol;
                if (!ts.getDeclarationOfKind(symbol, 133 /* TypeParameter */).constraint) {
                    type.constraint = noConstraintType;
                }
                links.declaredType = type;
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                links.declaredType = getDeclaredTypeOfSymbol(resolveAlias(symbol));
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfSymbol(symbol) {
            ts.Debug.assert((symbol.flags & 16777216 /* Instantiated */) === 0);
            if (symbol.flags & (32 /* Class */ | 64 /* Interface */)) {
                return getDeclaredTypeOfClassOrInterface(symbol);
            }
            if (symbol.flags & 524288 /* TypeAlias */) {
                return getDeclaredTypeOfTypeAlias(symbol);
            }
            if (symbol.flags & 384 /* Enum */) {
                return getDeclaredTypeOfEnum(symbol);
            }
            if (symbol.flags & 262144 /* TypeParameter */) {
                return getDeclaredTypeOfTypeParameter(symbol);
            }
            if (symbol.flags & 8388608 /* Alias */) {
                return getDeclaredTypeOfAlias(symbol);
            }
            return unknownType;
        }
        function createSymbolTable(symbols) {
            var result = {};
            for (var _i = 0; _i < symbols.length; _i++) {
                var symbol = symbols[_i];
                result[symbol.name] = symbol;
            }
            return result;
        }
        function createInstantiatedSymbolTable(symbols, mapper) {
            var result = {};
            for (var _i = 0; _i < symbols.length; _i++) {
                var symbol = symbols[_i];
                result[symbol.name] = instantiateSymbol(symbol, mapper);
            }
            return result;
        }
        function addInheritedMembers(symbols, baseSymbols) {
            for (var _i = 0; _i < baseSymbols.length; _i++) {
                var s = baseSymbols[_i];
                if (!ts.hasProperty(symbols, s.name)) {
                    symbols[s.name] = s;
                }
            }
        }
        function addInheritedSignatures(signatures, baseSignatures) {
            if (baseSignatures) {
                for (var _i = 0; _i < baseSignatures.length; _i++) {
                    var signature = baseSignatures[_i];
                    signatures.push(signature);
                }
            }
        }
        function resolveDeclaredMembers(type) {
            if (!type.declaredProperties) {
                var symbol = type.symbol;
                type.declaredProperties = getNamedMembers(symbol.members);
                type.declaredCallSignatures = getSignaturesOfSymbol(symbol.members["__call"]);
                type.declaredConstructSignatures = getSignaturesOfSymbol(symbol.members["__new"]);
                type.declaredStringIndexType = getIndexTypeOfSymbol(symbol, 0 /* String */);
                type.declaredNumberIndexType = getIndexTypeOfSymbol(symbol, 1 /* Number */);
            }
            return type;
        }
        function resolveClassOrInterfaceMembers(type) {
            var target = resolveDeclaredMembers(type);
            var members = target.symbol.members;
            var callSignatures = target.declaredCallSignatures;
            var constructSignatures = target.declaredConstructSignatures;
            var stringIndexType = target.declaredStringIndexType;
            var numberIndexType = target.declaredNumberIndexType;
            var baseTypes = getBaseTypes(target);
            if (baseTypes.length) {
                members = createSymbolTable(target.declaredProperties);
                for (var _i = 0; _i < baseTypes.length; _i++) {
                    var baseType = baseTypes[_i];
                    addInheritedMembers(members, getPropertiesOfObjectType(baseType));
                    callSignatures = ts.concatenate(callSignatures, getSignaturesOfType(baseType, 0 /* Call */));
                    constructSignatures = ts.concatenate(constructSignatures, getSignaturesOfType(baseType, 1 /* Construct */));
                    stringIndexType = stringIndexType || getIndexTypeOfType(baseType, 0 /* String */);
                    numberIndexType = numberIndexType || getIndexTypeOfType(baseType, 1 /* Number */);
                }
            }
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveTypeReferenceMembers(type) {
            var target = resolveDeclaredMembers(type.target);
            var mapper = createTypeMapper(target.typeParameters, type.typeArguments);
            var members = createInstantiatedSymbolTable(target.declaredProperties, mapper);
            var callSignatures = instantiateList(target.declaredCallSignatures, mapper, instantiateSignature);
            var constructSignatures = instantiateList(target.declaredConstructSignatures, mapper, instantiateSignature);
            var stringIndexType = target.declaredStringIndexType ? instantiateType(target.declaredStringIndexType, mapper) : undefined;
            var numberIndexType = target.declaredNumberIndexType ? instantiateType(target.declaredNumberIndexType, mapper) : undefined;
            ts.forEach(getBaseTypes(target), function (baseType) {
                var instantiatedBaseType = instantiateType(baseType, mapper);
                addInheritedMembers(members, getPropertiesOfObjectType(instantiatedBaseType));
                callSignatures = ts.concatenate(callSignatures, getSignaturesOfType(instantiatedBaseType, 0 /* Call */));
                constructSignatures = ts.concatenate(constructSignatures, getSignaturesOfType(instantiatedBaseType, 1 /* Construct */));
                stringIndexType = stringIndexType || getIndexTypeOfType(instantiatedBaseType, 0 /* String */);
                numberIndexType = numberIndexType || getIndexTypeOfType(instantiatedBaseType, 1 /* Number */);
            });
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function createSignature(declaration, typeParameters, parameters, resolvedReturnType, typePredicate, minArgumentCount, hasRestParameter, hasStringLiterals) {
            var sig = new Signature(checker);
            sig.declaration = declaration;
            sig.typeParameters = typeParameters;
            sig.parameters = parameters;
            sig.resolvedReturnType = resolvedReturnType;
            sig.typePredicate = typePredicate;
            sig.minArgumentCount = minArgumentCount;
            sig.hasRestParameter = hasRestParameter;
            sig.hasStringLiterals = hasStringLiterals;
            return sig;
        }
        function cloneSignature(sig) {
            return createSignature(sig.declaration, sig.typeParameters, sig.parameters, sig.resolvedReturnType, sig.typePredicate, sig.minArgumentCount, sig.hasRestParameter, sig.hasStringLiterals);
        }
        function getDefaultConstructSignatures(classType) {
            if (!getBaseTypes(classType).length) {
                return [createSignature(undefined, classType.localTypeParameters, emptyArray, classType, undefined, 0, false, false)];
            }
            var baseConstructorType = getBaseConstructorTypeOfClass(classType);
            var baseSignatures = getSignaturesOfType(baseConstructorType, 1 /* Construct */);
            var baseTypeNode = getBaseTypeNodeOfClass(classType);
            var typeArguments = ts.map(baseTypeNode.typeArguments, getTypeFromTypeNode);
            var typeArgCount = typeArguments ? typeArguments.length : 0;
            var result = [];
            for (var _i = 0; _i < baseSignatures.length; _i++) {
                var baseSig = baseSignatures[_i];
                var typeParamCount = baseSig.typeParameters ? baseSig.typeParameters.length : 0;
                if (typeParamCount === typeArgCount) {
                    var sig = typeParamCount ? getSignatureInstantiation(baseSig, typeArguments) : cloneSignature(baseSig);
                    sig.typeParameters = classType.localTypeParameters;
                    sig.resolvedReturnType = classType;
                    result.push(sig);
                }
            }
            return result;
        }
        function createTupleTypeMemberSymbols(memberTypes) {
            var members = {};
            for (var i = 0; i < memberTypes.length; i++) {
                var symbol = createSymbol(4 /* Property */ | 67108864 /* Transient */, "" + i);
                symbol.type = memberTypes[i];
                members[i] = symbol;
            }
            return members;
        }
        function resolveTupleTypeMembers(type) {
            var arrayType = resolveObjectOrUnionTypeMembers(createArrayType(getUnionType(type.elementTypes)));
            var members = createTupleTypeMemberSymbols(type.elementTypes);
            addInheritedMembers(members, arrayType.properties);
            setObjectTypeMembers(type, members, arrayType.callSignatures, arrayType.constructSignatures, arrayType.stringIndexType, arrayType.numberIndexType);
        }
        function signatureListsIdentical(s, t) {
            if (s.length !== t.length) {
                return false;
            }
            for (var i = 0; i < s.length; i++) {
                if (!compareSignatures(s[i], t[i], false, compareTypes)) {
                    return false;
                }
            }
            return true;
        }
        // If the lists of call or construct signatures in the given types are all identical except for return types,
        // and if none of the signatures are generic, return a list of signatures that has substitutes a union of the
        // return types of the corresponding signatures in each resulting signature.
        function getUnionSignatures(types, kind) {
            var signatureLists = ts.map(types, function (t) { return getSignaturesOfType(t, kind); });
            var signatures = signatureLists[0];
            for (var _i = 0; _i < signatures.length; _i++) {
                var signature = signatures[_i];
                if (signature.typeParameters) {
                    return emptyArray;
                }
            }
            for (var i_1 = 1; i_1 < signatureLists.length; i_1++) {
                if (!signatureListsIdentical(signatures, signatureLists[i_1])) {
                    return emptyArray;
                }
            }
            var result = ts.map(signatures, cloneSignature);
            for (var i = 0; i < result.length; i++) {
                var s = result[i];
                // Clear resolved return type we possibly got from cloneSignature
                s.resolvedReturnType = undefined;
                s.unionSignatures = ts.map(signatureLists, function (signatures) { return signatures[i]; });
            }
            return result;
        }
        function getUnionIndexType(types, kind) {
            var indexTypes = [];
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                var indexType = getIndexTypeOfType(type, kind);
                if (!indexType) {
                    return undefined;
                }
                indexTypes.push(indexType);
            }
            return getUnionType(indexTypes);
        }
        function resolveUnionTypeMembers(type) {
            // The members and properties collections are empty for union types. To get all properties of a union
            // type use getPropertiesOfType (only the language service uses this).
            var callSignatures = getUnionSignatures(type.types, 0 /* Call */);
            var constructSignatures = getUnionSignatures(type.types, 1 /* Construct */);
            var stringIndexType = getUnionIndexType(type.types, 0 /* String */);
            var numberIndexType = getUnionIndexType(type.types, 1 /* Number */);
            setObjectTypeMembers(type, emptySymbols, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveAnonymousTypeMembers(type) {
            var symbol = type.symbol;
            var members;
            var callSignatures;
            var constructSignatures;
            var stringIndexType;
            var numberIndexType;
            if (symbol.flags & 2048 /* TypeLiteral */) {
                members = symbol.members;
                callSignatures = getSignaturesOfSymbol(members["__call"]);
                constructSignatures = getSignaturesOfSymbol(members["__new"]);
                stringIndexType = getIndexTypeOfSymbol(symbol, 0 /* String */);
                numberIndexType = getIndexTypeOfSymbol(symbol, 1 /* Number */);
            }
            else {
                // Combinations of function, class, enum and module
                members = emptySymbols;
                callSignatures = emptyArray;
                constructSignatures = emptyArray;
                if (symbol.flags & 1952 /* HasExports */) {
                    members = getExportsOfSymbol(symbol);
                }
                if (symbol.flags & (16 /* Function */ | 8192 /* Method */)) {
                    callSignatures = getSignaturesOfSymbol(symbol);
                }
                if (symbol.flags & 32 /* Class */) {
                    var classType = getDeclaredTypeOfClassOrInterface(symbol);
                    constructSignatures = getSignaturesOfSymbol(symbol.members["__constructor"]);
                    if (!constructSignatures.length) {
                        constructSignatures = getDefaultConstructSignatures(classType);
                    }
                    var baseConstructorType = getBaseConstructorTypeOfClass(classType);
                    if (baseConstructorType.flags & 48128 /* ObjectType */) {
                        members = createSymbolTable(getNamedMembers(members));
                        addInheritedMembers(members, getPropertiesOfObjectType(baseConstructorType));
                    }
                }
                stringIndexType = undefined;
                numberIndexType = (symbol.flags & 384 /* Enum */) ? stringType : undefined;
            }
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveObjectOrUnionTypeMembers(type) {
            if (!type.members) {
                if (type.flags & (1024 /* Class */ | 2048 /* Interface */)) {
                    resolveClassOrInterfaceMembers(type);
                }
                else if (type.flags & 32768 /* Anonymous */) {
                    resolveAnonymousTypeMembers(type);
                }
                else if (type.flags & 8192 /* Tuple */) {
                    resolveTupleTypeMembers(type);
                }
                else if (type.flags & 16384 /* Union */) {
                    resolveUnionTypeMembers(type);
                }
                else {
                    resolveTypeReferenceMembers(type);
                }
            }
            return type;
        }
        // Return properties of an object type or an empty array for other types
        function getPropertiesOfObjectType(type) {
            if (type.flags & 48128 /* ObjectType */) {
                return resolveObjectOrUnionTypeMembers(type).properties;
            }
            return emptyArray;
        }
        // If the given type is an object type and that type has a property by the given name, return
        // the symbol for that property. Otherwise return undefined.
        function getPropertyOfObjectType(type, name) {
            if (type.flags & 48128 /* ObjectType */) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (ts.hasProperty(resolved.members, name)) {
                    var symbol = resolved.members[name];
                    if (symbolIsValue(symbol)) {
                        return symbol;
                    }
                }
            }
        }
        function getPropertiesOfUnionType(type) {
            var result = [];
            ts.forEach(getPropertiesOfType(type.types[0]), function (prop) {
                var unionProp = getPropertyOfUnionType(type, prop.name);
                if (unionProp) {
                    result.push(unionProp);
                }
            });
            return result;
        }
        function getPropertiesOfType(type) {
            type = getApparentType(type);
            return type.flags & 16384 /* Union */ ? getPropertiesOfUnionType(type) : getPropertiesOfObjectType(type);
        }
        // For a type parameter, return the base constraint of the type parameter. For the string, number,
        // boolean, and symbol primitive types, return the corresponding object types. Otherwise return the
        // type itself. Note that the apparent type of a union type is the union type itself.
        function getApparentType(type) {
            if (type.flags & 16384 /* Union */) {
                type = getReducedTypeOfUnionType(type);
            }
            if (type.flags & 512 /* TypeParameter */) {
                do {
                    type = getConstraintOfTypeParameter(type);
                } while (type && type.flags & 512 /* TypeParameter */);
                if (!type) {
                    type = emptyObjectType;
                }
            }
            if (type.flags & 258 /* StringLike */) {
                type = globalStringType;
            }
            else if (type.flags & 132 /* NumberLike */) {
                type = globalNumberType;
            }
            else if (type.flags & 8 /* Boolean */) {
                type = globalBooleanType;
            }
            else if (type.flags & 2097152 /* ESSymbol */) {
                type = globalESSymbolType;
            }
            return type;
        }
        function createUnionProperty(unionType, name) {
            var types = unionType.types;
            var props;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                var type = getApparentType(current);
                if (type !== unknownType) {
                    var prop = getPropertyOfType(type, name);
                    if (!prop || getDeclarationFlagsFromSymbol(prop) & (32 /* Private */ | 64 /* Protected */)) {
                        return undefined;
                    }
                    if (!props) {
                        props = [prop];
                    }
                    else {
                        props.push(prop);
                    }
                }
            }
            var propTypes = [];
            var declarations = [];
            for (var _a = 0; _a < props.length; _a++) {
                var prop = props[_a];
                if (prop.declarations) {
                    declarations.push.apply(declarations, prop.declarations);
                }
                propTypes.push(getTypeOfSymbol(prop));
            }
            var result = createSymbol(4 /* Property */ | 67108864 /* Transient */ | 268435456 /* UnionProperty */, name);
            result.unionType = unionType;
            result.declarations = declarations;
            result.type = getUnionType(propTypes);
            return result;
        }
        function getPropertyOfUnionType(type, name) {
            var properties = type.resolvedProperties || (type.resolvedProperties = {});
            if (ts.hasProperty(properties, name)) {
                return properties[name];
            }
            var property = createUnionProperty(type, name);
            if (property) {
                properties[name] = property;
            }
            return property;
        }
        // Return the symbol for the property with the given name in the given type. Creates synthetic union properties when
        // necessary, maps primitive types and type parameters are to their apparent types, and augments with properties from
        // Object and Function as appropriate.
        function getPropertyOfType(type, name) {
            type = getApparentType(type);
            if (type.flags & 48128 /* ObjectType */) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (ts.hasProperty(resolved.members, name)) {
                    var symbol = resolved.members[name];
                    if (symbolIsValue(symbol)) {
                        return symbol;
                    }
                }
                if (resolved === anyFunctionType || resolved.callSignatures.length || resolved.constructSignatures.length) {
                    var symbol = getPropertyOfObjectType(globalFunctionType, name);
                    if (symbol) {
                        return symbol;
                    }
                }
                return getPropertyOfObjectType(globalObjectType, name);
            }
            if (type.flags & 16384 /* Union */) {
                return getPropertyOfUnionType(type, name);
            }
            return undefined;
        }
        function getSignaturesOfObjectOrUnionType(type, kind) {
            if (type.flags & (48128 /* ObjectType */ | 16384 /* Union */)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return kind === 0 /* Call */ ? resolved.callSignatures : resolved.constructSignatures;
            }
            return emptyArray;
        }
        // Return the signatures of the given kind in the given type. Creates synthetic union signatures when necessary and
        // maps primitive types and type parameters are to their apparent types.
        function getSignaturesOfType(type, kind) {
            return getSignaturesOfObjectOrUnionType(getApparentType(type), kind);
        }
        function typeHasCallOrConstructSignatures(type) {
            var apparentType = getApparentType(type);
            if (apparentType.flags & (48128 /* ObjectType */ | 16384 /* Union */)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return resolved.callSignatures.length > 0
                    || resolved.constructSignatures.length > 0;
            }
            return false;
        }
        function getIndexTypeOfObjectOrUnionType(type, kind) {
            if (type.flags & (48128 /* ObjectType */ | 16384 /* Union */)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return kind === 0 /* String */ ? resolved.stringIndexType : resolved.numberIndexType;
            }
        }
        // Return the index type of the given kind in the given type. Creates synthetic union index types when necessary and
        // maps primitive types and type parameters are to their apparent types.
        function getIndexTypeOfType(type, kind) {
            return getIndexTypeOfObjectOrUnionType(getApparentType(type), kind);
        }
        // Return list of type parameters with duplicates removed (duplicate identifier errors are generated in the actual
        // type checking functions).
        function getTypeParametersFromDeclaration(typeParameterDeclarations) {
            var result = [];
            ts.forEach(typeParameterDeclarations, function (node) {
                var tp = getDeclaredTypeOfTypeParameter(node.symbol);
                if (!ts.contains(result, tp)) {
                    result.push(tp);
                }
            });
            return result;
        }
        function symbolsToArray(symbols) {
            var result = [];
            for (var id in symbols) {
                if (!isReservedMemberName(id)) {
                    result.push(symbols[id]);
                }
            }
            return result;
        }
        function isOptionalParameter(node) {
            return ts.hasQuestionToken(node) || !!node.initializer;
        }
        function getSignatureFromDeclaration(declaration) {
            var links = getNodeLinks(declaration);
            if (!links.resolvedSignature) {
                var classType = declaration.kind === 140 /* Constructor */ ? getDeclaredTypeOfClassOrInterface(declaration.parent.symbol) : undefined;
                var typeParameters = classType ? classType.localTypeParameters :
                    declaration.typeParameters ? getTypeParametersFromDeclaration(declaration.typeParameters) : undefined;
                var parameters = [];
                var hasStringLiterals = false;
                var minArgumentCount = -1;
                for (var i = 0, n = declaration.parameters.length; i < n; i++) {
                    var param = declaration.parameters[i];
                    parameters.push(param.symbol);
                    if (param.type && param.type.kind === 8 /* StringLiteral */) {
                        hasStringLiterals = true;
                    }
                    if (minArgumentCount < 0) {
                        if (param.initializer || param.questionToken || param.dotDotDotToken) {
                            minArgumentCount = i;
                        }
                    }
                }
                if (minArgumentCount < 0) {
                    minArgumentCount = declaration.parameters.length;
                }
                var returnType;
                var typePredicate;
                if (classType) {
                    returnType = classType;
                }
                else if (declaration.type) {
                    returnType = getTypeFromTypeNode(declaration.type);
                    if (declaration.type.kind === 146 /* TypePredicate */) {
                        var typePredicateNode = declaration.type;
                        typePredicate = {
                            parameterName: typePredicateNode.parameterName ? typePredicateNode.parameterName.text : undefined,
                            parameterIndex: typePredicateNode.parameterName ? getTypePredicateParameterIndex(declaration.parameters, typePredicateNode.parameterName) : undefined,
                            type: getTypeFromTypeNode(typePredicateNode.type)
                        };
                    }
                }
                else {
                    // TypeScript 1.0 spec (April 2014):
                    // If only one accessor includes a type annotation, the other behaves as if it had the same type annotation.
                    if (declaration.kind === 141 /* GetAccessor */ && !ts.hasDynamicName(declaration)) {
                        var setter = ts.getDeclarationOfKind(declaration.symbol, 142 /* SetAccessor */);
                        returnType = getAnnotatedAccessorType(setter);
                    }
                    if (!returnType && ts.nodeIsMissing(declaration.body)) {
                        returnType = anyType;
                    }
                }
                links.resolvedSignature = createSignature(declaration, typeParameters, parameters, returnType, typePredicate, minArgumentCount, ts.hasRestParameter(declaration), hasStringLiterals);
            }
            return links.resolvedSignature;
        }
        function getSignaturesOfSymbol(symbol) {
            if (!symbol)
                return emptyArray;
            var result = [];
            for (var i = 0, len = symbol.declarations.length; i < len; i++) {
                var node = symbol.declarations[i];
                switch (node.kind) {
                    case 148 /* FunctionType */:
                    case 149 /* ConstructorType */:
                    case 208 /* FunctionDeclaration */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 140 /* Constructor */:
                    case 143 /* CallSignature */:
                    case 144 /* ConstructSignature */:
                    case 145 /* IndexSignature */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    case 168 /* FunctionExpression */:
                    case 169 /* ArrowFunction */:
                        // Don't include signature if node is the implementation of an overloaded function. A node is considered
                        // an implementation node if it has a body and the previous node is of the same kind and immediately
                        // precedes the implementation node (i.e. has the same parent and ends where the implementation starts).
                        if (i > 0 && node.body) {
                            var previous = symbol.declarations[i - 1];
                            if (node.parent === previous.parent && node.kind === previous.kind && node.pos === previous.end) {
                                break;
                            }
                        }
                        result.push(getSignatureFromDeclaration(node));
                }
            }
            return result;
        }
        function getReturnTypeOfSignature(signature) {
            if (!signature.resolvedReturnType) {
                if (!pushTypeResolution(signature)) {
                    return unknownType;
                }
                var type;
                if (signature.target) {
                    type = instantiateType(getReturnTypeOfSignature(signature.target), signature.mapper);
                }
                else if (signature.unionSignatures) {
                    type = getUnionType(ts.map(signature.unionSignatures, getReturnTypeOfSignature));
                }
                else {
                    type = getReturnTypeFromBody(signature.declaration);
                }
                if (!popTypeResolution()) {
                    type = anyType;
                    if (compilerOptions.noImplicitAny) {
                        var declaration = signature.declaration;
                        if (declaration.name) {
                            error(declaration.name, ts.Diagnostics._0_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions, ts.declarationNameToString(declaration.name));
                        }
                        else {
                            error(declaration, ts.Diagnostics.Function_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions);
                        }
                    }
                }
                signature.resolvedReturnType = type;
            }
            return signature.resolvedReturnType;
        }
        function getRestTypeOfSignature(signature) {
            if (signature.hasRestParameter) {
                var type = getTypeOfSymbol(ts.lastOrUndefined(signature.parameters));
                if (type.flags & 4096 /* Reference */ && type.target === globalArrayType) {
                    return type.typeArguments[0];
                }
            }
            return anyType;
        }
        function getSignatureInstantiation(signature, typeArguments) {
            return instantiateSignature(signature, createTypeMapper(signature.typeParameters, typeArguments), true);
        }
        function getErasedSignature(signature) {
            if (!signature.typeParameters)
                return signature;
            if (!signature.erasedSignatureCache) {
                if (signature.target) {
                    signature.erasedSignatureCache = instantiateSignature(getErasedSignature(signature.target), signature.mapper);
                }
                else {
                    signature.erasedSignatureCache = instantiateSignature(signature, createTypeEraser(signature.typeParameters), true);
                }
            }
            return signature.erasedSignatureCache;
        }
        function getOrCreateTypeFromSignature(signature) {
            // There are two ways to declare a construct signature, one is by declaring a class constructor
            // using the constructor keyword, and the other is declaring a bare construct signature in an
            // object type literal or interface (using the new keyword). Each way of declaring a constructor
            // will result in a different declaration kind.
            if (!signature.isolatedSignatureType) {
                var isConstructor = signature.declaration.kind === 140 /* Constructor */ || signature.declaration.kind === 144 /* ConstructSignature */;
                var type = createObjectType(32768 /* Anonymous */ | 131072 /* FromSignature */);
                type.members = emptySymbols;
                type.properties = emptyArray;
                type.callSignatures = !isConstructor ? [signature] : emptyArray;
                type.constructSignatures = isConstructor ? [signature] : emptyArray;
                signature.isolatedSignatureType = type;
            }
            return signature.isolatedSignatureType;
        }
        function getIndexSymbol(symbol) {
            return symbol.members["__index"];
        }
        function getIndexDeclarationOfSymbol(symbol, kind) {
            var syntaxKind = kind === 1 /* Number */ ? 124 /* NumberKeyword */ : 126 /* StringKeyword */;
            var indexSymbol = getIndexSymbol(symbol);
            if (indexSymbol) {
                for (var _i = 0, _a = indexSymbol.declarations; _i < _a.length; _i++) {
                    var decl = _a[_i];
                    var node = decl;
                    if (node.parameters.length === 1) {
                        var parameter = node.parameters[0];
                        if (parameter && parameter.type && parameter.type.kind === syntaxKind) {
                            return node;
                        }
                    }
                }
            }
            return undefined;
        }
        function getIndexTypeOfSymbol(symbol, kind) {
            var declaration = getIndexDeclarationOfSymbol(symbol, kind);
            return declaration
                ? declaration.type ? getTypeFromTypeNode(declaration.type) : anyType
                : undefined;
        }
        function getConstraintOfTypeParameter(type) {
            if (!type.constraint) {
                if (type.target) {
                    var targetConstraint = getConstraintOfTypeParameter(type.target);
                    type.constraint = targetConstraint ? instantiateType(targetConstraint, type.mapper) : noConstraintType;
                }
                else {
                    type.constraint = getTypeFromTypeNode(ts.getDeclarationOfKind(type.symbol, 133 /* TypeParameter */).constraint);
                }
            }
            return type.constraint === noConstraintType ? undefined : type.constraint;
        }
        function getParentSymbolOfTypeParameter(typeParameter) {
            return getSymbolOfNode(ts.getDeclarationOfKind(typeParameter.symbol, 133 /* TypeParameter */).parent);
        }
        function getTypeListId(types) {
            switch (types.length) {
                case 1:
                    return "" + types[0].id;
                case 2:
                    return types[0].id + "," + types[1].id;
                default:
                    var result = "";
                    for (var i = 0; i < types.length; i++) {
                        if (i > 0) {
                            result += ",";
                        }
                        result += types[i].id;
                    }
                    return result;
            }
        }
        // This function is used to propagate widening flags when creating new object types references and union types.
        // It is only necessary to do so if a constituent type might be the undefined type, the null type, or the type
        // of an object literal (since those types have widening related information we need to track).
        function getWideningFlagsOfTypes(types) {
            var result = 0;
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                result |= type.flags;
            }
            return result & 1572864 /* RequiresWidening */;
        }
        function createTypeReference(target, typeArguments) {
            var id = getTypeListId(typeArguments);
            var type = target.instantiations[id];
            if (!type) {
                var flags = 4096 /* Reference */ | getWideningFlagsOfTypes(typeArguments);
                type = target.instantiations[id] = createObjectType(flags, target.symbol);
                type.target = target;
                type.typeArguments = typeArguments;
            }
            return type;
        }
        function isTypeParameterReferenceIllegalInConstraint(typeReferenceNode, typeParameterSymbol) {
            var links = getNodeLinks(typeReferenceNode);
            if (links.isIllegalTypeReferenceInConstraint !== undefined) {
                return links.isIllegalTypeReferenceInConstraint;
            }
            // bubble up to the declaration
            var currentNode = typeReferenceNode;
            // forEach === exists
            while (!ts.forEach(typeParameterSymbol.declarations, function (d) { return d.parent === currentNode.parent; })) {
                currentNode = currentNode.parent;
            }
            // if last step was made from the type parameter this means that path has started somewhere in constraint which is illegal
            links.isIllegalTypeReferenceInConstraint = currentNode.kind === 133 /* TypeParameter */;
            return links.isIllegalTypeReferenceInConstraint;
        }
        function checkTypeParameterHasIllegalReferencesInConstraint(typeParameter) {
            var typeParameterSymbol;
            function check(n) {
                if (n.kind === 147 /* TypeReference */ && n.typeName.kind === 66 /* Identifier */) {
                    var links = getNodeLinks(n);
                    if (links.isIllegalTypeReferenceInConstraint === undefined) {
                        var symbol = resolveName(typeParameter, n.typeName.text, 793056 /* Type */, undefined, undefined);
                        if (symbol && (symbol.flags & 262144 /* TypeParameter */)) {
                            // TypeScript 1.0 spec (April 2014): 3.4.1
                            // Type parameters declared in a particular type parameter list
                            // may not be referenced in constraints in that type parameter list
                            // symbol.declaration.parent === typeParameter.parent
                            // -> typeParameter and symbol.declaration originate from the same type parameter list
                            // -> illegal for all declarations in symbol
                            // forEach === exists
                            links.isIllegalTypeReferenceInConstraint = ts.forEach(symbol.declarations, function (d) { return d.parent === typeParameter.parent; });
                        }
                    }
                    if (links.isIllegalTypeReferenceInConstraint) {
                        error(typeParameter, ts.Diagnostics.Constraint_of_a_type_parameter_cannot_reference_any_type_parameter_from_the_same_type_parameter_list);
                    }
                }
                ts.forEachChild(n, check);
            }
            if (typeParameter.constraint) {
                typeParameterSymbol = getSymbolOfNode(typeParameter);
                check(typeParameter.constraint);
            }
        }
        // Get type from reference to class or interface
        function getTypeFromClassOrInterfaceReference(node, symbol) {
            var type = getDeclaredTypeOfSymbol(symbol);
            var typeParameters = type.localTypeParameters;
            if (typeParameters) {
                if (!node.typeArguments || node.typeArguments.length !== typeParameters.length) {
                    error(node, ts.Diagnostics.Generic_type_0_requires_1_type_argument_s, typeToString(type, undefined, 1 /* WriteArrayAsGenericType */), typeParameters.length);
                    return unknownType;
                }
                // In a type reference, the outer type parameters of the referenced class or interface are automatically
                // supplied as type arguments and the type reference only specifies arguments for the local type parameters
                // of the class or interface.
                return createTypeReference(type, ts.concatenate(type.outerTypeParameters, ts.map(node.typeArguments, getTypeFromTypeNode)));
            }
            if (node.typeArguments) {
                error(node, ts.Diagnostics.Type_0_is_not_generic, typeToString(type));
                return unknownType;
            }
            return type;
        }
        // Get type from reference to type alias. When a type alias is generic, the declared type of the type alias may include
        // references to the type parameters of the alias. We replace those with the actual type arguments by instantiating the
        // declared type. Instantiations are cached using the type identities of the type arguments as the key.
        function getTypeFromTypeAliasReference(node, symbol) {
            var type = getDeclaredTypeOfSymbol(symbol);
            var links = getSymbolLinks(symbol);
            var typeParameters = links.typeParameters;
            if (typeParameters) {
                if (!node.typeArguments || node.typeArguments.length !== typeParameters.length) {
                    error(node, ts.Diagnostics.Generic_type_0_requires_1_type_argument_s, symbolToString(symbol), typeParameters.length);
                    return unknownType;
                }
                var typeArguments = ts.map(node.typeArguments, getTypeFromTypeNode);
                var id = getTypeListId(typeArguments);
                return links.instantiations[id] || (links.instantiations[id] = instantiateType(type, createTypeMapper(typeParameters, typeArguments)));
            }
            if (node.typeArguments) {
                error(node, ts.Diagnostics.Type_0_is_not_generic, symbolToString(symbol));
                return unknownType;
            }
            return type;
        }
        // Get type from reference to named type that cannot be generic (enum or type parameter)
        function getTypeFromNonGenericTypeReference(node, symbol) {
            if (symbol.flags & 262144 /* TypeParameter */ && isTypeParameterReferenceIllegalInConstraint(node, symbol)) {
                // TypeScript 1.0 spec (April 2014): 3.4.1
                // Type parameters declared in a particular type parameter list
                // may not be referenced in constraints in that type parameter list
                // Implementation: such type references are resolved to 'unknown' type that usually denotes error
                return unknownType;
            }
            if (node.typeArguments) {
                error(node, ts.Diagnostics.Type_0_is_not_generic, symbolToString(symbol));
                return unknownType;
            }
            return getDeclaredTypeOfSymbol(symbol);
        }
        function getTypeFromTypeReference(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                // We only support expressions that are simple qualified names. For other expressions this produces undefined.
                var typeNameOrExpression = node.kind === 147 /* TypeReference */ ? node.typeName :
                    ts.isSupportedExpressionWithTypeArguments(node) ? node.expression :
                        undefined;
                var symbol = typeNameOrExpression && resolveEntityName(typeNameOrExpression, 793056 /* Type */) || unknownSymbol;
                var type = symbol === unknownSymbol ? unknownType :
                    symbol.flags & (32 /* Class */ | 64 /* Interface */) ? getTypeFromClassOrInterfaceReference(node, symbol) :
                        symbol.flags & 524288 /* TypeAlias */ ? getTypeFromTypeAliasReference(node, symbol) :
                            getTypeFromNonGenericTypeReference(node, symbol);
                // Cache both the resolved symbol and the resolved type. The resolved symbol is needed in when we check the
                // type reference in checkTypeReferenceOrExpressionWithTypeArguments.
                links.resolvedSymbol = symbol;
                links.resolvedType = type;
            }
            return links.resolvedType;
        }
        function getTypeFromTypeQueryNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                // TypeScript 1.0 spec (April 2014): 3.6.3
                // The expression is processed as an identifier expression (section 4.3)
                // or property access expression(section 4.10),
                // the widened type(section 3.9) of which becomes the result.
                links.resolvedType = getWidenedType(checkExpression(node.exprName));
            }
            return links.resolvedType;
        }
        function getTypeOfGlobalSymbol(symbol, arity) {
            function getTypeDeclaration(symbol) {
                var declarations = symbol.declarations;
                for (var _i = 0; _i < declarations.length; _i++) {
                    var declaration = declarations[_i];
                    switch (declaration.kind) {
                        case 209 /* ClassDeclaration */:
                        case 210 /* InterfaceDeclaration */:
                        case 212 /* EnumDeclaration */:
                            return declaration;
                    }
                }
            }
            if (!symbol) {
                return arity ? emptyGenericType : emptyObjectType;
            }
            var type = getDeclaredTypeOfSymbol(symbol);
            if (!(type.flags & 48128 /* ObjectType */)) {
                error(getTypeDeclaration(symbol), ts.Diagnostics.Global_type_0_must_be_a_class_or_interface_type, symbol.name);
                return arity ? emptyGenericType : emptyObjectType;
            }
            if ((type.typeParameters ? type.typeParameters.length : 0) !== arity) {
                error(getTypeDeclaration(symbol), ts.Diagnostics.Global_type_0_must_have_1_type_parameter_s, symbol.name, arity);
                return arity ? emptyGenericType : emptyObjectType;
            }
            return type;
        }
        function getGlobalValueSymbol(name) {
            return getGlobalSymbol(name, 107455 /* Value */, ts.Diagnostics.Cannot_find_global_value_0);
        }
        function getGlobalTypeSymbol(name) {
            return getGlobalSymbol(name, 793056 /* Type */, ts.Diagnostics.Cannot_find_global_type_0);
        }
        function getGlobalSymbol(name, meaning, diagnostic) {
            return resolveName(undefined, name, meaning, diagnostic, name);
        }
        function getGlobalType(name, arity) {
            if (arity === void 0) { arity = 0; }
            return getTypeOfGlobalSymbol(getGlobalTypeSymbol(name), arity);
        }
        function tryGetGlobalType(name, arity) {
            if (arity === void 0) { arity = 0; }
            return getTypeOfGlobalSymbol(getGlobalSymbol(name, 793056 /* Type */, undefined), arity);
        }
        /**
         * Returns a type that is inside a namespace at the global scope, e.g.
         * getExportedTypeFromNamespace('JSX', 'Element') returns the JSX.Element type
         */
        function getExportedTypeFromNamespace(namespace, name) {
            var namespaceSymbol = getGlobalSymbol(namespace, 1536 /* Namespace */, undefined);
            var typeSymbol = namespaceSymbol && getSymbol(namespaceSymbol.exports, name, 793056 /* Type */);
            return typeSymbol && getDeclaredTypeOfSymbol(typeSymbol);
        }
        function getGlobalESSymbolConstructorSymbol() {
            return globalESSymbolConstructorSymbol || (globalESSymbolConstructorSymbol = getGlobalValueSymbol("Symbol"));
        }
        /**
          * Creates a TypeReference for a generic `TypedPropertyDescriptor<T>`.
          */
        function createTypedPropertyDescriptorType(propertyType) {
            var globalTypedPropertyDescriptorType = getGlobalTypedPropertyDescriptorType();
            return globalTypedPropertyDescriptorType !== emptyObjectType
                ? createTypeReference(globalTypedPropertyDescriptorType, [propertyType])
                : emptyObjectType;
        }
        /**
         * Instantiates a global type that is generic with some element type, and returns that instantiation.
         */
        function createTypeFromGenericGlobalType(genericGlobalType, elementType) {
            return genericGlobalType !== emptyGenericType ? createTypeReference(genericGlobalType, [elementType]) : emptyObjectType;
        }
        function createIterableType(elementType) {
            return createTypeFromGenericGlobalType(globalIterableType, elementType);
        }
        function createIterableIteratorType(elementType) {
            return createTypeFromGenericGlobalType(globalIterableIteratorType, elementType);
        }
        function createArrayType(elementType) {
            return createTypeFromGenericGlobalType(globalArrayType, elementType);
        }
        function getTypeFromArrayTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = createArrayType(getTypeFromTypeNode(node.elementType));
            }
            return links.resolvedType;
        }
        function createTupleType(elementTypes) {
            var id = getTypeListId(elementTypes);
            var type = tupleTypes[id];
            if (!type) {
                type = tupleTypes[id] = createObjectType(8192 /* Tuple */);
                type.elementTypes = elementTypes;
            }
            return type;
        }
        function getTypeFromTupleTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = createTupleType(ts.map(node.elementTypes, getTypeFromTypeNode));
            }
            return links.resolvedType;
        }
        function addTypeToSortedSet(sortedSet, type) {
            if (type.flags & 16384 /* Union */) {
                addTypesToSortedSet(sortedSet, type.types);
            }
            else {
                var i = 0;
                var id = type.id;
                while (i < sortedSet.length && sortedSet[i].id < id) {
                    i++;
                }
                if (i === sortedSet.length || sortedSet[i].id !== id) {
                    sortedSet.splice(i, 0, type);
                }
            }
        }
        function addTypesToSortedSet(sortedTypes, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                addTypeToSortedSet(sortedTypes, type);
            }
        }
        function isSubtypeOfAny(candidate, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (candidate !== type && isTypeSubtypeOf(candidate, type)) {
                    return true;
                }
            }
            return false;
        }
        function removeSubtypes(types) {
            var i = types.length;
            while (i > 0) {
                i--;
                if (isSubtypeOfAny(types[i], types)) {
                    types.splice(i, 1);
                }
            }
        }
        function containsTypeAny(types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (isTypeAny(type)) {
                    return true;
                }
            }
            return false;
        }
        function removeAllButLast(types, typeToRemove) {
            var i = types.length;
            while (i > 0 && types.length > 1) {
                i--;
                if (types[i] === typeToRemove) {
                    types.splice(i, 1);
                }
            }
        }
        // The noSubtypeReduction flag is there because it isn't possible to always do subtype reduction. The flag
        // is true when creating a union type from a type node and when instantiating a union type. In both of those
        // cases subtype reduction has to be deferred to properly support recursive union types. For example, a
        // type alias of the form "type Item = string | (() => Item)" cannot be reduced during its declaration.
        function getUnionType(types, noSubtypeReduction) {
            if (types.length === 0) {
                return emptyObjectType;
            }
            var sortedTypes = [];
            addTypesToSortedSet(sortedTypes, types);
            if (noSubtypeReduction) {
                if (containsTypeAny(sortedTypes)) {
                    return anyType;
                }
                removeAllButLast(sortedTypes, undefinedType);
                removeAllButLast(sortedTypes, nullType);
            }
            else {
                removeSubtypes(sortedTypes);
            }
            if (sortedTypes.length === 1) {
                return sortedTypes[0];
            }
            var id = getTypeListId(sortedTypes);
            var type = unionTypes[id];
            if (!type) {
                type = unionTypes[id] = createObjectType(16384 /* Union */ | getWideningFlagsOfTypes(sortedTypes));
                type.types = sortedTypes;
                type.reducedType = noSubtypeReduction ? undefined : type;
            }
            return type;
        }
        // Subtype reduction is basically an optimization we do to avoid excessively large union types, which take longer
        // to process and look strange in quick info and error messages. Semantically there is no difference between the
        // reduced type and the type itself. So, when we detect a circularity we simply say that the reduced type is the
        // type itself.
        function getReducedTypeOfUnionType(type) {
            if (!type.reducedType) {
                type.reducedType = circularType;
                var reducedType = getUnionType(type.types, false);
                if (type.reducedType === circularType) {
                    type.reducedType = reducedType;
                }
            }
            else if (type.reducedType === circularType) {
                type.reducedType = type;
            }
            return type.reducedType;
        }
        function getTypeFromUnionTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = getUnionType(ts.map(node.types, getTypeFromTypeNode), true);
            }
            return links.resolvedType;
        }
        function getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                // Deferred resolution of members is handled by resolveObjectTypeMembers
                links.resolvedType = createObjectType(32768 /* Anonymous */, node.symbol);
            }
            return links.resolvedType;
        }
        function getStringLiteralType(node) {
            if (ts.hasProperty(stringLiteralTypes, node.text)) {
                return stringLiteralTypes[node.text];
            }
            var type = stringLiteralTypes[node.text] = createType(256 /* StringLiteral */);
            type.text = ts.getTextOfNode(node);
            return type;
        }
        function getTypeFromStringLiteral(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = getStringLiteralType(node);
            }
            return links.resolvedType;
        }
        function getTypeFromTypeNode(node) {
            switch (node.kind) {
                case 113 /* AnyKeyword */:
                    return anyType;
                case 126 /* StringKeyword */:
                    return stringType;
                case 124 /* NumberKeyword */:
                    return numberType;
                case 116 /* BooleanKeyword */:
                    return booleanType;
                case 127 /* SymbolKeyword */:
                    return esSymbolType;
                case 100 /* VoidKeyword */:
                    return voidType;
                case 8 /* StringLiteral */:
                    return getTypeFromStringLiteral(node);
                case 147 /* TypeReference */:
                    return getTypeFromTypeReference(node);
                case 146 /* TypePredicate */:
                    return booleanType;
                case 183 /* ExpressionWithTypeArguments */:
                    return getTypeFromTypeReference(node);
                case 150 /* TypeQuery */:
                    return getTypeFromTypeQueryNode(node);
                case 152 /* ArrayType */:
                    return getTypeFromArrayTypeNode(node);
                case 153 /* TupleType */:
                    return getTypeFromTupleTypeNode(node);
                case 154 /* UnionType */:
                    return getTypeFromUnionTypeNode(node);
                case 155 /* ParenthesizedType */:
                    return getTypeFromTypeNode(node.type);
                case 148 /* FunctionType */:
                case 149 /* ConstructorType */:
                case 151 /* TypeLiteral */:
                    return getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node);
                // This function assumes that an identifier or qualified name is a type expression
                // Callers should first ensure this by calling isTypeNode
                case 66 /* Identifier */:
                case 131 /* QualifiedName */:
                    var symbol = getSymbolInfo(node);
                    return symbol && getDeclaredTypeOfSymbol(symbol);
                default:
                    return unknownType;
            }
        }
        function instantiateList(items, mapper, instantiator) {
            if (items && items.length) {
                var result = [];
                for (var _i = 0; _i < items.length; _i++) {
                    var v = items[_i];
                    result.push(instantiator(v, mapper));
                }
                return result;
            }
            return items;
        }
        function createUnaryTypeMapper(source, target) {
            return function (t) { return t === source ? target : t; };
        }
        function createBinaryTypeMapper(source1, target1, source2, target2) {
            return function (t) { return t === source1 ? target1 : t === source2 ? target2 : t; };
        }
        function createTypeMapper(sources, targets) {
            switch (sources.length) {
                case 1: return createUnaryTypeMapper(sources[0], targets[0]);
                case 2: return createBinaryTypeMapper(sources[0], targets[0], sources[1], targets[1]);
            }
            return function (t) {
                for (var i = 0; i < sources.length; i++) {
                    if (t === sources[i]) {
                        return targets[i];
                    }
                }
                return t;
            };
        }
        function createUnaryTypeEraser(source) {
            return function (t) { return t === source ? anyType : t; };
        }
        function createBinaryTypeEraser(source1, source2) {
            return function (t) { return t === source1 || t === source2 ? anyType : t; };
        }
        function createTypeEraser(sources) {
            switch (sources.length) {
                case 1: return createUnaryTypeEraser(sources[0]);
                case 2: return createBinaryTypeEraser(sources[0], sources[1]);
            }
            return function (t) {
                for (var _i = 0; _i < sources.length; _i++) {
                    var source = sources[_i];
                    if (t === source) {
                        return anyType;
                    }
                }
                return t;
            };
        }
        function createInferenceMapper(context) {
            return function (t) {
                for (var i = 0; i < context.typeParameters.length; i++) {
                    if (t === context.typeParameters[i]) {
                        context.inferences[i].isFixed = true;
                        return getInferredType(context, i);
                    }
                }
                return t;
            };
        }
        function identityMapper(type) {
            return type;
        }
        function combineTypeMappers(mapper1, mapper2) {
            return function (t) { return instantiateType(mapper1(t), mapper2); };
        }
        function instantiateTypeParameter(typeParameter, mapper) {
            var result = createType(512 /* TypeParameter */);
            result.symbol = typeParameter.symbol;
            if (typeParameter.constraint) {
                result.constraint = instantiateType(typeParameter.constraint, mapper);
            }
            else {
                result.target = typeParameter;
                result.mapper = mapper;
            }
            return result;
        }
        function instantiateSignature(signature, mapper, eraseTypeParameters) {
            var freshTypeParameters;
            var freshTypePredicate;
            if (signature.typeParameters && !eraseTypeParameters) {
                freshTypeParameters = instantiateList(signature.typeParameters, mapper, instantiateTypeParameter);
                mapper = combineTypeMappers(createTypeMapper(signature.typeParameters, freshTypeParameters), mapper);
            }
            if (signature.typePredicate) {
                freshTypePredicate = {
                    parameterName: signature.typePredicate.parameterName,
                    parameterIndex: signature.typePredicate.parameterIndex,
                    type: instantiateType(signature.typePredicate.type, mapper)
                };
            }
            var result = createSignature(signature.declaration, freshTypeParameters, instantiateList(signature.parameters, mapper, instantiateSymbol), signature.resolvedReturnType ? instantiateType(signature.resolvedReturnType, mapper) : undefined, freshTypePredicate, signature.minArgumentCount, signature.hasRestParameter, signature.hasStringLiterals);
            result.target = signature;
            result.mapper = mapper;
            return result;
        }
        function instantiateSymbol(symbol, mapper) {
            if (symbol.flags & 16777216 /* Instantiated */) {
                var links = getSymbolLinks(symbol);
                // If symbol being instantiated is itself a instantiation, fetch the original target and combine the
                // type mappers. This ensures that original type identities are properly preserved and that aliases
                // always reference a non-aliases.
                symbol = links.target;
                mapper = combineTypeMappers(links.mapper, mapper);
            }
            // Keep the flags from the symbol we're instantiating.  Mark that is instantiated, and
            // also transient so that we can just store data on it directly.
            var result = createSymbol(16777216 /* Instantiated */ | 67108864 /* Transient */ | symbol.flags, symbol.name);
            result.declarations = symbol.declarations;
            result.parent = symbol.parent;
            result.target = symbol;
            result.mapper = mapper;
            if (symbol.valueDeclaration) {
                result.valueDeclaration = symbol.valueDeclaration;
            }
            return result;
        }
        function instantiateAnonymousType(type, mapper) {
            // Mark the anonymous type as instantiated such that our infinite instantiation detection logic can recognize it
            var result = createObjectType(32768 /* Anonymous */ | 65536 /* Instantiated */, type.symbol);
            result.properties = instantiateList(getPropertiesOfObjectType(type), mapper, instantiateSymbol);
            result.members = createSymbolTable(result.properties);
            result.callSignatures = instantiateList(getSignaturesOfType(type, 0 /* Call */), mapper, instantiateSignature);
            result.constructSignatures = instantiateList(getSignaturesOfType(type, 1 /* Construct */), mapper, instantiateSignature);
            var stringIndexType = getIndexTypeOfType(type, 0 /* String */);
            var numberIndexType = getIndexTypeOfType(type, 1 /* Number */);
            if (stringIndexType)
                result.stringIndexType = instantiateType(stringIndexType, mapper);
            if (numberIndexType)
                result.numberIndexType = instantiateType(numberIndexType, mapper);
            return result;
        }
        function instantiateType(type, mapper) {
            if (mapper !== identityMapper) {
                if (type.flags & 512 /* TypeParameter */) {
                    return mapper(type);
                }
                if (type.flags & 32768 /* Anonymous */) {
                    return type.symbol && type.symbol.flags & (16 /* Function */ | 8192 /* Method */ | 32 /* Class */ | 2048 /* TypeLiteral */ | 4096 /* ObjectLiteral */) ?
                        instantiateAnonymousType(type, mapper) : type;
                }
                if (type.flags & 4096 /* Reference */) {
                    return createTypeReference(type.target, instantiateList(type.typeArguments, mapper, instantiateType));
                }
                if (type.flags & 8192 /* Tuple */) {
                    return createTupleType(instantiateList(type.elementTypes, mapper, instantiateType));
                }
                if (type.flags & 16384 /* Union */) {
                    return getUnionType(instantiateList(type.types, mapper, instantiateType), true);
                }
            }
            return type;
        }
        // Returns true if the given expression contains (at any level of nesting) a function or arrow expression
        // that is subject to contextual typing.
        function isContextSensitive(node) {
            ts.Debug.assert(node.kind !== 139 /* MethodDeclaration */ || ts.isObjectLiteralMethod(node));
            switch (node.kind) {
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                    return isContextSensitiveFunctionLikeDeclaration(node);
                case 160 /* ObjectLiteralExpression */:
                    return ts.forEach(node.properties, isContextSensitive);
                case 159 /* ArrayLiteralExpression */:
                    return ts.forEach(node.elements, isContextSensitive);
                case 177 /* ConditionalExpression */:
                    return isContextSensitive(node.whenTrue) ||
                        isContextSensitive(node.whenFalse);
                case 176 /* BinaryExpression */:
                    return node.operatorToken.kind === 50 /* BarBarToken */ &&
                        (isContextSensitive(node.left) || isContextSensitive(node.right));
                case 240 /* PropertyAssignment */:
                    return isContextSensitive(node.initializer);
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                    return isContextSensitiveFunctionLikeDeclaration(node);
                case 167 /* ParenthesizedExpression */:
                    return isContextSensitive(node.expression);
            }
            return false;
        }
        function isContextSensitiveFunctionLikeDeclaration(node) {
            return !node.typeParameters && node.parameters.length && !ts.forEach(node.parameters, function (p) { return p.type; });
        }
        function getTypeWithoutSignatures(type) {
            if (type.flags & 48128 /* ObjectType */) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (resolved.constructSignatures.length) {
                    var result = createObjectType(32768 /* Anonymous */, type.symbol);
                    result.members = resolved.members;
                    result.properties = resolved.properties;
                    result.callSignatures = emptyArray;
                    result.constructSignatures = emptyArray;
                    type = result;
                }
            }
            return type;
        }
        // TYPE CHECKING
        function isTypeIdenticalTo(source, target) {
            return checkTypeRelatedTo(source, target, identityRelation, undefined);
        }
        function compareTypes(source, target) {
            return checkTypeRelatedTo(source, target, identityRelation, undefined) ? -1 /* True */ : 0 /* False */;
        }
        function isTypeSubtypeOf(source, target) {
            return checkTypeSubtypeOf(source, target, undefined);
        }
        function isTypeAssignableTo(source, target) {
            return checkTypeAssignableTo(source, target, undefined);
        }
        function checkTypeSubtypeOf(source, target, errorNode, headMessage, containingMessageChain) {
            return checkTypeRelatedTo(source, target, subtypeRelation, errorNode, headMessage, containingMessageChain);
        }
        function checkTypeAssignableTo(source, target, errorNode, headMessage, containingMessageChain) {
            return checkTypeRelatedTo(source, target, assignableRelation, errorNode, headMessage, containingMessageChain);
        }
        function isSignatureAssignableTo(source, target) {
            var sourceType = getOrCreateTypeFromSignature(source);
            var targetType = getOrCreateTypeFromSignature(target);
            return checkTypeRelatedTo(sourceType, targetType, assignableRelation, undefined);
        }
        function checkTypeRelatedTo(source, target, relation, errorNode, headMessage, containingMessageChain) {
            var errorInfo;
            var sourceStack;
            var targetStack;
            var maybeStack;
            var expandingFlags;
            var depth = 0;
            var overflow = false;
            var elaborateErrors = false;
            ts.Debug.assert(relation !== identityRelation || !errorNode, "no error reporting in identity checking");
            var result = isRelatedTo(source, target, errorNode !== undefined, headMessage);
            if (overflow) {
                error(errorNode, ts.Diagnostics.Excessive_stack_depth_comparing_types_0_and_1, typeToString(source), typeToString(target));
            }
            else if (errorInfo) {
                // If we already computed this relation, but in a context where we didn't want to report errors (e.g. overload resolution),
                // then we'll only have a top-level error (e.g. 'Class X does not implement interface Y') without any details. If this happened,
                // request a recompuation to get a complete error message. This will be skipped if we've already done this computation in a context
                // where errors were being reported.
                if (errorInfo.next === undefined) {
                    errorInfo = undefined;
                    elaborateErrors = true;
                    isRelatedTo(source, target, errorNode !== undefined, headMessage);
                }
                if (containingMessageChain) {
                    errorInfo = ts.concatenateDiagnosticMessageChains(containingMessageChain, errorInfo);
                }
                diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(errorNode, errorInfo));
            }
            return result !== 0 /* False */;
            function reportError(message, arg0, arg1, arg2) {
                errorInfo = ts.chainDiagnosticMessages(errorInfo, message, arg0, arg1, arg2);
            }
            // Compare two types and return
            // Ternary.True if they are related with no assumptions,
            // Ternary.Maybe if they are related with assumptions of other relationships, or
            // Ternary.False if they are not related.
            function isRelatedTo(source, target, reportErrors, headMessage) {
                var result;
                // both types are the same - covers 'they are the same primitive type or both are Any' or the same type parameter cases
                if (source === target)
                    return -1 /* True */;
                if (relation !== identityRelation) {
                    if (isTypeAny(target))
                        return -1 /* True */;
                    if (source === undefinedType)
                        return -1 /* True */;
                    if (source === nullType && target !== undefinedType)
                        return -1 /* True */;
                    if (source.flags & 128 /* Enum */ && target === numberType)
                        return -1 /* True */;
                    if (source.flags & 256 /* StringLiteral */ && target === stringType)
                        return -1 /* True */;
                    if (relation === assignableRelation) {
                        if (isTypeAny(source))
                            return -1 /* True */;
                        if (source === numberType && target.flags & 128 /* Enum */)
                            return -1 /* True */;
                    }
                }
                var saveErrorInfo = errorInfo;
                if (source.flags & 16384 /* Union */ || target.flags & 16384 /* Union */) {
                    if (relation === identityRelation) {
                        if (source.flags & 16384 /* Union */ && target.flags & 16384 /* Union */) {
                            if (result = unionTypeRelatedToUnionType(source, target)) {
                                if (result &= unionTypeRelatedToUnionType(target, source)) {
                                    return result;
                                }
                            }
                        }
                        else if (source.flags & 16384 /* Union */) {
                            if (result = unionTypeRelatedToType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                        else {
                            if (result = unionTypeRelatedToType(target, source, reportErrors)) {
                                return result;
                            }
                        }
                    }
                    else {
                        if (source.flags & 16384 /* Union */) {
                            if (result = unionTypeRelatedToType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                        else {
                            if (result = typeRelatedToUnionType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                    }
                }
                else if (source.flags & 512 /* TypeParameter */ && target.flags & 512 /* TypeParameter */) {
                    if (result = typeParameterRelatedTo(source, target, reportErrors)) {
                        return result;
                    }
                }
                else if (source.flags & 4096 /* Reference */ && target.flags & 4096 /* Reference */ && source.target === target.target) {
                    // We have type references to same target type, see if relationship holds for all type arguments
                    if (result = typesRelatedTo(source.typeArguments, target.typeArguments, reportErrors)) {
                        return result;
                    }
                }
                // Even if relationship doesn't hold for unions, type parameters, or generic type references,
                // it may hold in a structural comparison.
                // Report structural errors only if we haven't reported any errors yet
                var reportStructuralErrors = reportErrors && errorInfo === saveErrorInfo;
                // identity relation does not use apparent type
                var sourceOrApparentType = relation === identityRelation ? source : getApparentType(source);
                if (sourceOrApparentType.flags & 48128 /* ObjectType */ && target.flags & 48128 /* ObjectType */) {
                    if (result = objectTypeRelatedTo(sourceOrApparentType, target, reportStructuralErrors)) {
                        errorInfo = saveErrorInfo;
                        return result;
                    }
                }
                else if (source.flags & 512 /* TypeParameter */ && sourceOrApparentType.flags & 16384 /* Union */) {
                    // We clear the errors first because the following check often gives a better error than
                    // the union comparison above if it is applicable.
                    errorInfo = saveErrorInfo;
                    if (result = isRelatedTo(sourceOrApparentType, target, reportErrors)) {
                        return result;
                    }
                }
                if (reportErrors) {
                    headMessage = headMessage || ts.Diagnostics.Type_0_is_not_assignable_to_type_1;
                    var sourceType = typeToString(source);
                    var targetType = typeToString(target);
                    if (sourceType === targetType) {
                        sourceType = typeToString(source, undefined, 128 /* UseFullyQualifiedType */);
                        targetType = typeToString(target, undefined, 128 /* UseFullyQualifiedType */);
                    }
                    reportError(headMessage, sourceType, targetType);
                }
                return 0 /* False */;
            }
            function unionTypeRelatedToUnionType(source, target) {
                var result = -1 /* True */;
                var sourceTypes = source.types;
                for (var _i = 0; _i < sourceTypes.length; _i++) {
                    var sourceType = sourceTypes[_i];
                    var related = typeRelatedToUnionType(sourceType, target, false);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
                return result;
            }
            function typeRelatedToUnionType(source, target, reportErrors) {
                var targetTypes = target.types;
                for (var i = 0, len = targetTypes.length; i < len; i++) {
                    var related = isRelatedTo(source, targetTypes[i], reportErrors && i === len - 1);
                    if (related) {
                        return related;
                    }
                }
                return 0 /* False */;
            }
            function unionTypeRelatedToType(source, target, reportErrors) {
                var result = -1 /* True */;
                var sourceTypes = source.types;
                for (var _i = 0; _i < sourceTypes.length; _i++) {
                    var sourceType = sourceTypes[_i];
                    var related = isRelatedTo(sourceType, target, reportErrors);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
                return result;
            }
            function typesRelatedTo(sources, targets, reportErrors) {
                var result = -1 /* True */;
                for (var i = 0, len = sources.length; i < len; i++) {
                    var related = isRelatedTo(sources[i], targets[i], reportErrors);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
                return result;
            }
            function typeParameterRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    if (source.symbol.name !== target.symbol.name) {
                        return 0 /* False */;
                    }
                    // covers case when both type parameters does not have constraint (both equal to noConstraintType)
                    if (source.constraint === target.constraint) {
                        return -1 /* True */;
                    }
                    if (source.constraint === noConstraintType || target.constraint === noConstraintType) {
                        return 0 /* False */;
                    }
                    return isRelatedTo(source.constraint, target.constraint, reportErrors);
                }
                else {
                    while (true) {
                        var constraint = getConstraintOfTypeParameter(source);
                        if (constraint === target)
                            return -1 /* True */;
                        if (!(constraint && constraint.flags & 512 /* TypeParameter */))
                            break;
                        source = constraint;
                    }
                    return 0 /* False */;
                }
            }
            // Determine if two object types are related by structure. First, check if the result is already available in the global cache.
            // Second, check if we have already started a comparison of the given two types in which case we assume the result to be true.
            // Third, check if both types are part of deeply nested chains of generic type instantiations and if so assume the types are
            // equal and infinitely expanding. Fourth, if we have reached a depth of 100 nested comparisons, assume we have runaway recursion
            // and issue an error. Otherwise, actually compare the structure of the two types.
            function objectTypeRelatedTo(source, target, reportErrors) {
                if (overflow) {
                    return 0 /* False */;
                }
                var id = relation !== identityRelation || source.id < target.id ? source.id + "," + target.id : target.id + "," + source.id;
                var related = relation[id];
                //let related: RelationComparisonResult = undefined; // relation[id];
                if (related !== undefined) {
                    // If we computed this relation already and it was failed and reported, or if we're not being asked to elaborate
                    // errors, we can use the cached value. Otherwise, recompute the relation
                    if (!elaborateErrors || (related === 3 /* FailedAndReported */)) {
                        return related === 1 /* Succeeded */ ? -1 /* True */ : 0 /* False */;
                    }
                }
                if (depth > 0) {
                    for (var i = 0; i < depth; i++) {
                        // If source and target are already being compared, consider them related with assumptions
                        if (maybeStack[i][id]) {
                            return 1 /* Maybe */;
                        }
                    }
                    if (depth === 100) {
                        overflow = true;
                        return 0 /* False */;
                    }
                }
                else {
                    sourceStack = [];
                    targetStack = [];
                    maybeStack = [];
                    expandingFlags = 0;
                }
                sourceStack[depth] = source;
                targetStack[depth] = target;
                maybeStack[depth] = {};
                maybeStack[depth][id] = 1 /* Succeeded */;
                depth++;
                var saveExpandingFlags = expandingFlags;
                if (!(expandingFlags & 1) && isDeeplyNestedGeneric(source, sourceStack, depth))
                    expandingFlags |= 1;
                if (!(expandingFlags & 2) && isDeeplyNestedGeneric(target, targetStack, depth))
                    expandingFlags |= 2;
                var result;
                if (expandingFlags === 3) {
                    result = 1 /* Maybe */;
                }
                else {
                    result = propertiesRelatedTo(source, target, reportErrors);
                    if (result) {
                        result &= signaturesRelatedTo(source, target, 0 /* Call */, reportErrors);
                        if (result) {
                            result &= signaturesRelatedTo(source, target, 1 /* Construct */, reportErrors);
                            if (result) {
                                result &= stringIndexTypesRelatedTo(source, target, reportErrors);
                                if (result) {
                                    result &= numberIndexTypesRelatedTo(source, target, reportErrors);
                                }
                            }
                        }
                    }
                }
                expandingFlags = saveExpandingFlags;
                depth--;
                if (result) {
                    var maybeCache = maybeStack[depth];
                    // If result is definitely true, copy assumptions to global cache, else copy to next level up
                    var destinationCache = (result === -1 /* True */ || depth === 0) ? relation : maybeStack[depth - 1];
                    ts.copyMap(maybeCache, destinationCache);
                }
                else {
                    // A false result goes straight into global cache (when something is false under assumptions it
                    // will also be false without assumptions)
                    relation[id] = reportErrors ? 3 /* FailedAndReported */ : 2 /* Failed */;
                }
                return result;
            }
            function propertiesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return propertiesIdenticalTo(source, target);
                }
                var result = -1 /* True */;
                var properties = getPropertiesOfObjectType(target);
                var requireOptionalProperties = relation === subtypeRelation && !(source.flags & 262144 /* ObjectLiteral */);
                for (var _i = 0; _i < properties.length; _i++) {
                    var targetProp = properties[_i];
                    var sourceProp = getPropertyOfType(source, targetProp.name);
                    if (sourceProp !== targetProp) {
                        if (!sourceProp) {
                            if (!(targetProp.flags & 536870912 /* Optional */) || requireOptionalProperties) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_missing_in_type_1, symbolToString(targetProp), typeToString(source));
                                }
                                return 0 /* False */;
                            }
                        }
                        else if (!(targetProp.flags & 134217728 /* Prototype */)) {
                            var sourceFlags = getDeclarationFlagsFromSymbol(sourceProp);
                            var targetFlags = getDeclarationFlagsFromSymbol(targetProp);
                            if (sourceFlags & 32 /* Private */ || targetFlags & 32 /* Private */) {
                                if (sourceProp.valueDeclaration !== targetProp.valueDeclaration) {
                                    if (reportErrors) {
                                        if (sourceFlags & 32 /* Private */ && targetFlags & 32 /* Private */) {
                                            reportError(ts.Diagnostics.Types_have_separate_declarations_of_a_private_property_0, symbolToString(targetProp));
                                        }
                                        else {
                                            reportError(ts.Diagnostics.Property_0_is_private_in_type_1_but_not_in_type_2, symbolToString(targetProp), typeToString(sourceFlags & 32 /* Private */ ? source : target), typeToString(sourceFlags & 32 /* Private */ ? target : source));
                                        }
                                    }
                                    return 0 /* False */;
                                }
                            }
                            else if (targetFlags & 64 /* Protected */) {
                                var sourceDeclaredInClass = sourceProp.parent && sourceProp.parent.flags & 32 /* Class */;
                                var sourceClass = sourceDeclaredInClass ? getDeclaredTypeOfSymbol(sourceProp.parent) : undefined;
                                var targetClass = getDeclaredTypeOfSymbol(targetProp.parent);
                                if (!sourceClass || !hasBaseType(sourceClass, targetClass)) {
                                    if (reportErrors) {
                                        reportError(ts.Diagnostics.Property_0_is_protected_but_type_1_is_not_a_class_derived_from_2, symbolToString(targetProp), typeToString(sourceClass || source), typeToString(targetClass));
                                    }
                                    return 0 /* False */;
                                }
                            }
                            else if (sourceFlags & 64 /* Protected */) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_protected_in_type_1_but_public_in_type_2, symbolToString(targetProp), typeToString(source), typeToString(target));
                                }
                                return 0 /* False */;
                            }
                            var related = isRelatedTo(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp), reportErrors);
                            if (!related) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Types_of_property_0_are_incompatible, symbolToString(targetProp));
                                }
                                return 0 /* False */;
                            }
                            result &= related;
                            if (sourceProp.flags & 536870912 /* Optional */ && !(targetProp.flags & 536870912 /* Optional */)) {
                                // TypeScript 1.0 spec (April 2014): 3.8.3
                                // S is a subtype of a type T, and T is a supertype of S if ...
                                // S' and T are object types and, for each member M in T..
                                // M is a property and S' contains a property N where
                                // if M is a required property, N is also a required property
                                // (M - property in T)
                                // (N - property in S)
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_optional_in_type_1_but_required_in_type_2, symbolToString(targetProp), typeToString(source), typeToString(target));
                                }
                                return 0 /* False */;
                            }
                        }
                    }
                }
                return result;
            }
            function propertiesIdenticalTo(source, target) {
                var sourceProperties = getPropertiesOfObjectType(source);
                var targetProperties = getPropertiesOfObjectType(target);
                if (sourceProperties.length !== targetProperties.length) {
                    return 0 /* False */;
                }
                var result = -1 /* True */;
                for (var _i = 0; _i < sourceProperties.length; _i++) {
                    var sourceProp = sourceProperties[_i];
                    var targetProp = getPropertyOfObjectType(target, sourceProp.name);
                    if (!targetProp) {
                        return 0 /* False */;
                    }
                    var related = compareProperties(sourceProp, targetProp, isRelatedTo);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
                return result;
            }
            function signaturesRelatedTo(source, target, kind, reportErrors) {
                if (relation === identityRelation) {
                    return signaturesIdenticalTo(source, target, kind);
                }
                if (target === anyFunctionType || source === anyFunctionType) {
                    return -1 /* True */;
                }
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                var result = -1 /* True */;
                var saveErrorInfo = errorInfo;
                outer: for (var _i = 0; _i < targetSignatures.length; _i++) {
                    var t = targetSignatures[_i];
                    if (!t.hasStringLiterals || target.flags & 131072 /* FromSignature */) {
                        var localErrors = reportErrors;
                        for (var _a = 0; _a < sourceSignatures.length; _a++) {
                            var s = sourceSignatures[_a];
                            if (!s.hasStringLiterals || source.flags & 131072 /* FromSignature */) {
                                var related = signatureRelatedTo(s, t, localErrors);
                                if (related) {
                                    result &= related;
                                    errorInfo = saveErrorInfo;
                                    continue outer;
                                }
                                // Only report errors from the first failure
                                localErrors = false;
                            }
                        }
                        return 0 /* False */;
                    }
                }
                return result;
            }
            function signatureRelatedTo(source, target, reportErrors) {
                if (source === target) {
                    return -1 /* True */;
                }
                if (!target.hasRestParameter && source.minArgumentCount > target.parameters.length) {
                    return 0 /* False */;
                }
                var sourceMax = source.parameters.length;
                var targetMax = target.parameters.length;
                var checkCount;
                if (source.hasRestParameter && target.hasRestParameter) {
                    checkCount = sourceMax > targetMax ? sourceMax : targetMax;
                    sourceMax--;
                    targetMax--;
                }
                else if (source.hasRestParameter) {
                    sourceMax--;
                    checkCount = targetMax;
                }
                else if (target.hasRestParameter) {
                    targetMax--;
                    checkCount = sourceMax;
                }
                else {
                    checkCount = sourceMax < targetMax ? sourceMax : targetMax;
                }
                // Spec 1.0 Section 3.8.3 & 3.8.4:
                // M and N (the signatures) are instantiated using type Any as the type argument for all type parameters declared by M and N
                source = getErasedSignature(source);
                target = getErasedSignature(target);
                var result = -1 /* True */;
                for (var i = 0; i < checkCount; i++) {
                    var s_1 = i < sourceMax ? getTypeOfSymbol(source.parameters[i]) : getRestTypeOfSignature(source);
                    var t_1 = i < targetMax ? getTypeOfSymbol(target.parameters[i]) : getRestTypeOfSignature(target);
                    var saveErrorInfo = errorInfo;
                    var related = isRelatedTo(s_1, t_1, reportErrors);
                    if (!related) {
                        related = isRelatedTo(t_1, s_1, false);
                        if (!related) {
                            if (reportErrors) {
                                reportError(ts.Diagnostics.Types_of_parameters_0_and_1_are_incompatible, source.parameters[i < sourceMax ? i : sourceMax].name, target.parameters[i < targetMax ? i : targetMax].name);
                            }
                            return 0 /* False */;
                        }
                        errorInfo = saveErrorInfo;
                    }
                    result &= related;
                }
                if (source.typePredicate && target.typePredicate) {
                    var hasDifferentParameterIndex = source.typePredicate.parameterIndex !== target.typePredicate.parameterIndex;
                    var hasDifferentTypes;
                    if (hasDifferentParameterIndex ||
                        (hasDifferentTypes = !isTypeIdenticalTo(source.typePredicate.type, target.typePredicate.type))) {
                        if (reportErrors) {
                            var sourceParamText = source.typePredicate.parameterName;
                            var targetParamText = target.typePredicate.parameterName;
                            var sourceTypeText = typeToString(source.typePredicate.type);
                            var targetTypeText = typeToString(target.typePredicate.type);
                            if (hasDifferentParameterIndex) {
                                reportError(ts.Diagnostics.Parameter_0_is_not_in_the_same_position_as_parameter_1, sourceParamText, targetParamText);
                            }
                            else if (hasDifferentTypes) {
                                reportError(ts.Diagnostics.Type_0_is_not_assignable_to_type_1, sourceTypeText, targetTypeText);
                            }
                            reportError(ts.Diagnostics.Type_predicate_0_is_not_assignable_to_1, sourceParamText + " is " + sourceTypeText, targetParamText + " is " + targetTypeText);
                        }
                        return 0 /* False */;
                    }
                }
                else if (!source.typePredicate && target.typePredicate) {
                    if (reportErrors) {
                        reportError(ts.Diagnostics.Signature_0_must_have_a_type_predicate, signatureToString(source));
                    }
                    return 0 /* False */;
                }
                var t = getReturnTypeOfSignature(target);
                if (t === voidType)
                    return result;
                var s = getReturnTypeOfSignature(source);
                return result & isRelatedTo(s, t, reportErrors);
            }
            function signaturesIdenticalTo(source, target, kind) {
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                if (sourceSignatures.length !== targetSignatures.length) {
                    return 0 /* False */;
                }
                var result = -1 /* True */;
                for (var i = 0, len = sourceSignatures.length; i < len; ++i) {
                    var related = compareSignatures(sourceSignatures[i], targetSignatures[i], true, isRelatedTo);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
                return result;
            }
            function stringIndexTypesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return indexTypesIdenticalTo(0 /* String */, source, target);
                }
                var targetType = getIndexTypeOfType(target, 0 /* String */);
                if (targetType) {
                    var sourceType = getIndexTypeOfType(source, 0 /* String */);
                    if (!sourceType) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signature_is_missing_in_type_0, typeToString(source));
                        }
                        return 0 /* False */;
                    }
                    var related = isRelatedTo(sourceType, targetType, reportErrors);
                    if (!related) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signatures_are_incompatible);
                        }
                        return 0 /* False */;
                    }
                    return related;
                }
                return -1 /* True */;
            }
            function numberIndexTypesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return indexTypesIdenticalTo(1 /* Number */, source, target);
                }
                var targetType = getIndexTypeOfType(target, 1 /* Number */);
                if (targetType) {
                    var sourceStringType = getIndexTypeOfType(source, 0 /* String */);
                    var sourceNumberType = getIndexTypeOfType(source, 1 /* Number */);
                    if (!(sourceStringType || sourceNumberType)) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signature_is_missing_in_type_0, typeToString(source));
                        }
                        return 0 /* False */;
                    }
                    var related;
                    if (sourceStringType && sourceNumberType) {
                        // If we know for sure we're testing both string and numeric index types then only report errors from the second one
                        related = isRelatedTo(sourceStringType, targetType, false) || isRelatedTo(sourceNumberType, targetType, reportErrors);
                    }
                    else {
                        related = isRelatedTo(sourceStringType || sourceNumberType, targetType, reportErrors);
                    }
                    if (!related) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signatures_are_incompatible);
                        }
                        return 0 /* False */;
                    }
                    return related;
                }
                return -1 /* True */;
            }
            function indexTypesIdenticalTo(indexKind, source, target) {
                var targetType = getIndexTypeOfType(target, indexKind);
                var sourceType = getIndexTypeOfType(source, indexKind);
                if (!sourceType && !targetType) {
                    return -1 /* True */;
                }
                if (sourceType && targetType) {
                    return isRelatedTo(sourceType, targetType);
                }
                return 0 /* False */;
            }
        }
        // Return true if the given type is part of a deeply nested chain of generic instantiations. We consider this to be the case
        // when structural type comparisons have been started for 10 or more instantiations of the same generic type. It is possible,
        // though highly unlikely, for this test to be true in a situation where a chain of instantiations is not infinitely expanding.
        // Effectively, we will generate a false positive when two types are structurally equal to at least 10 levels, but unequal at
        // some level beyond that.
        function isDeeplyNestedGeneric(type, stack, depth) {
            // We track type references (created by createTypeReference) and instantiated types (created by instantiateType)
            if (type.flags & (4096 /* Reference */ | 65536 /* Instantiated */) && depth >= 5) {
                var symbol = type.symbol;
                var count = 0;
                for (var i = 0; i < depth; i++) {
                    var t = stack[i];
                    if (t.flags & (4096 /* Reference */ | 65536 /* Instantiated */) && t.symbol === symbol) {
                        count++;
                        if (count >= 5)
                            return true;
                    }
                }
            }
            return false;
        }
        function isPropertyIdenticalTo(sourceProp, targetProp) {
            return compareProperties(sourceProp, targetProp, compareTypes) !== 0 /* False */;
        }
        function compareProperties(sourceProp, targetProp, compareTypes) {
            // Two members are considered identical when
            // - they are public properties with identical names, optionality, and types,
            // - they are private or protected properties originating in the same declaration and having identical types
            if (sourceProp === targetProp) {
                return -1 /* True */;
            }
            var sourcePropAccessibility = getDeclarationFlagsFromSymbol(sourceProp) & (32 /* Private */ | 64 /* Protected */);
            var targetPropAccessibility = getDeclarationFlagsFromSymbol(targetProp) & (32 /* Private */ | 64 /* Protected */);
            if (sourcePropAccessibility !== targetPropAccessibility) {
                return 0 /* False */;
            }
            if (sourcePropAccessibility) {
                if (getTargetSymbol(sourceProp) !== getTargetSymbol(targetProp)) {
                    return 0 /* False */;
                }
            }
            else {
                if ((sourceProp.flags & 536870912 /* Optional */) !== (targetProp.flags & 536870912 /* Optional */)) {
                    return 0 /* False */;
                }
            }
            return compareTypes(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp));
        }
        function compareSignatures(source, target, compareReturnTypes, compareTypes) {
            if (source === target) {
                return -1 /* True */;
            }
            if (source.parameters.length !== target.parameters.length ||
                source.minArgumentCount !== target.minArgumentCount ||
                source.hasRestParameter !== target.hasRestParameter) {
                return 0 /* False */;
            }
            var result = -1 /* True */;
            if (source.typeParameters && target.typeParameters) {
                if (source.typeParameters.length !== target.typeParameters.length) {
                    return 0 /* False */;
                }
                for (var i = 0, len = source.typeParameters.length; i < len; ++i) {
                    var related = compareTypes(source.typeParameters[i], target.typeParameters[i]);
                    if (!related) {
                        return 0 /* False */;
                    }
                    result &= related;
                }
            }
            else if (source.typeParameters || target.typeParameters) {
                return 0 /* False */;
            }
            // Spec 1.0 Section 3.8.3 & 3.8.4:
            // M and N (the signatures) are instantiated using type Any as the type argument for all type parameters declared by M and N
            source = getErasedSignature(source);
            target = getErasedSignature(target);
            for (var i = 0, len = source.parameters.length; i < len; i++) {
                var s = source.hasRestParameter && i === len - 1 ? getRestTypeOfSignature(source) : getTypeOfSymbol(source.parameters[i]);
                var t = target.hasRestParameter && i === len - 1 ? getRestTypeOfSignature(target) : getTypeOfSymbol(target.parameters[i]);
                var related = compareTypes(s, t);
                if (!related) {
                    return 0 /* False */;
                }
                result &= related;
            }
            if (compareReturnTypes) {
                result &= compareTypes(getReturnTypeOfSignature(source), getReturnTypeOfSignature(target));
            }
            return result;
        }
        function isSupertypeOfEach(candidate, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (candidate !== type && !isTypeSubtypeOf(type, candidate))
                    return false;
            }
            return true;
        }
        function getCommonSupertype(types) {
            return ts.forEach(types, function (t) { return isSupertypeOfEach(t, types) ? t : undefined; });
        }
        function reportNoCommonSupertypeError(types, errorLocation, errorMessageChainHead) {
            // The downfallType/bestSupertypeDownfallType is the first type that caused a particular candidate
            // to not be the common supertype. So if it weren't for this one downfallType (and possibly others),
            // the type in question could have been the common supertype.
            var bestSupertype;
            var bestSupertypeDownfallType;
            var bestSupertypeScore = 0;
            for (var i = 0; i < types.length; i++) {
                var score = 0;
                var downfallType = undefined;
                for (var j = 0; j < types.length; j++) {
                    if (isTypeSubtypeOf(types[j], types[i])) {
                        score++;
                    }
                    else if (!downfallType) {
                        downfallType = types[j];
                    }
                }
                ts.Debug.assert(!!downfallType, "If there is no common supertype, each type should have a downfallType");
                if (score > bestSupertypeScore) {
                    bestSupertype = types[i];
                    bestSupertypeDownfallType = downfallType;
                    bestSupertypeScore = score;
                }
                // types.length - 1 is the maximum score, given that getCommonSupertype returned false
                if (bestSupertypeScore === types.length - 1) {
                    break;
                }
            }
            // In the following errors, the {1} slot is before the {0} slot because checkTypeSubtypeOf supplies the
            // subtype as the first argument to the error
            checkTypeSubtypeOf(bestSupertypeDownfallType, bestSupertype, errorLocation, ts.Diagnostics.Type_argument_candidate_1_is_not_a_valid_type_argument_because_it_is_not_a_supertype_of_candidate_0, errorMessageChainHead);
        }
        function isArrayType(type) {
            return type.flags & 4096 /* Reference */ && type.target === globalArrayType;
        }
        function isArrayLikeType(type) {
            // A type is array-like if it is not the undefined or null type and if it is assignable to any[]
            return !(type.flags & (32 /* Undefined */ | 64 /* Null */)) && isTypeAssignableTo(type, anyArrayType);
        }
        function isTupleLikeType(type) {
            return !!getPropertyOfType(type, "0");
        }
        /**
         * Check if a Type was written as a tuple type literal.
         * Prefer using isTupleLikeType() unless the use of `elementTypes` is required.
         */
        function isTupleType(type) {
            return (type.flags & 8192 /* Tuple */) && !!type.elementTypes;
        }
        function getWidenedTypeOfObjectLiteral(type) {
            var properties = getPropertiesOfObjectType(type);
            var members = {};
            ts.forEach(properties, function (p) {
                var propType = getTypeOfSymbol(p);
                var widenedType = getWidenedType(propType);
                if (propType !== widenedType) {
                    var symbol = createSymbol(p.flags | 67108864 /* Transient */, p.name);
                    symbol.declarations = p.declarations;
                    symbol.parent = p.parent;
                    symbol.type = widenedType;
                    symbol.target = p;
                    if (p.valueDeclaration)
                        symbol.valueDeclaration = p.valueDeclaration;
                    p = symbol;
                }
                members[p.name] = p;
            });
            var stringIndexType = getIndexTypeOfType(type, 0 /* String */);
            var numberIndexType = getIndexTypeOfType(type, 1 /* Number */);
            if (stringIndexType)
                stringIndexType = getWidenedType(stringIndexType);
            if (numberIndexType)
                numberIndexType = getWidenedType(numberIndexType);
            return createAnonymousType(type.symbol, members, emptyArray, emptyArray, stringIndexType, numberIndexType);
        }
        function getWidenedType(type) {
            if (type.flags & 1572864 /* RequiresWidening */) {
                if (type.flags & (32 /* Undefined */ | 64 /* Null */)) {
                    return anyType;
                }
                if (type.flags & 262144 /* ObjectLiteral */) {
                    return getWidenedTypeOfObjectLiteral(type);
                }
                if (type.flags & 16384 /* Union */) {
                    return getUnionType(ts.map(type.types, getWidenedType));
                }
                if (isArrayType(type)) {
                    return createArrayType(getWidenedType(type.typeArguments[0]));
                }
            }
            return type;
        }
        function reportWideningErrorsInType(type) {
            if (type.flags & 16384 /* Union */) {
                var errorReported = false;
                ts.forEach(type.types, function (t) {
                    if (reportWideningErrorsInType(t)) {
                        errorReported = true;
                    }
                });
                return errorReported;
            }
            if (isArrayType(type)) {
                return reportWideningErrorsInType(type.typeArguments[0]);
            }
            if (type.flags & 262144 /* ObjectLiteral */) {
                var errorReported = false;
                ts.forEach(getPropertiesOfObjectType(type), function (p) {
                    var t = getTypeOfSymbol(p);
                    if (t.flags & 524288 /* ContainsUndefinedOrNull */) {
                        if (!reportWideningErrorsInType(t)) {
                            error(p.valueDeclaration, ts.Diagnostics.Object_literal_s_property_0_implicitly_has_an_1_type, p.name, typeToString(getWidenedType(t)));
                        }
                        errorReported = true;
                    }
                });
                return errorReported;
            }
            return false;
        }
        function reportImplicitAnyError(declaration, type) {
            var typeAsString = typeToString(getWidenedType(type));
            var diagnostic;
            switch (declaration.kind) {
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                    diagnostic = ts.Diagnostics.Member_0_implicitly_has_an_1_type;
                    break;
                case 134 /* Parameter */:
                    diagnostic = declaration.dotDotDotToken ?
                        ts.Diagnostics.Rest_parameter_0_implicitly_has_an_any_type :
                        ts.Diagnostics.Parameter_0_implicitly_has_an_1_type;
                    break;
                case 208 /* FunctionDeclaration */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                    if (!declaration.name) {
                        error(declaration, ts.Diagnostics.Function_expression_which_lacks_return_type_annotation_implicitly_has_an_0_return_type, typeAsString);
                        return;
                    }
                    diagnostic = ts.Diagnostics._0_which_lacks_return_type_annotation_implicitly_has_an_1_return_type;
                    break;
                default:
                    diagnostic = ts.Diagnostics.Variable_0_implicitly_has_an_1_type;
            }
            error(declaration, diagnostic, ts.declarationNameToString(declaration.name), typeAsString);
        }
        function reportErrorsFromWidening(declaration, type) {
            if (produceDiagnostics && compilerOptions.noImplicitAny && type.flags & 524288 /* ContainsUndefinedOrNull */) {
                // Report implicit any error within type if possible, otherwise report error on declaration
                if (!reportWideningErrorsInType(type)) {
                    reportImplicitAnyError(declaration, type);
                }
            }
        }
        function forEachMatchingParameterType(source, target, callback) {
            var sourceMax = source.parameters.length;
            var targetMax = target.parameters.length;
            var count;
            if (source.hasRestParameter && target.hasRestParameter) {
                count = sourceMax > targetMax ? sourceMax : targetMax;
                sourceMax--;
                targetMax--;
            }
            else if (source.hasRestParameter) {
                sourceMax--;
                count = targetMax;
            }
            else if (target.hasRestParameter) {
                targetMax--;
                count = sourceMax;
            }
            else {
                count = sourceMax < targetMax ? sourceMax : targetMax;
            }
            for (var i = 0; i < count; i++) {
                var s = i < sourceMax ? getTypeOfSymbol(source.parameters[i]) : getRestTypeOfSignature(source);
                var t = i < targetMax ? getTypeOfSymbol(target.parameters[i]) : getRestTypeOfSignature(target);
                callback(s, t);
            }
        }
        function createInferenceContext(typeParameters, inferUnionTypes) {
            var inferences = [];
            for (var _i = 0; _i < typeParameters.length; _i++) {
                var unused = typeParameters[_i];
                inferences.push({ primary: undefined, secondary: undefined, isFixed: false });
            }
            return {
                typeParameters: typeParameters,
                inferUnionTypes: inferUnionTypes,
                inferences: inferences,
                inferredTypes: new Array(typeParameters.length)
            };
        }
        function inferTypes(context, source, target) {
            var sourceStack;
            var targetStack;
            var depth = 0;
            var inferiority = 0;
            inferFromTypes(source, target);
            function isInProcess(source, target) {
                for (var i = 0; i < depth; i++) {
                    if (source === sourceStack[i] && target === targetStack[i]) {
                        return true;
                    }
                }
                return false;
            }
            function inferFromTypes(source, target) {
                if (source === anyFunctionType) {
                    return;
                }
                if (target.flags & 512 /* TypeParameter */) {
                    // If target is a type parameter, make an inference
                    var typeParameters = context.typeParameters;
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (target === typeParameters[i]) {
                            var inferences = context.inferences[i];
                            if (!inferences.isFixed) {
                                // Any inferences that are made to a type parameter in a union type are inferior
                                // to inferences made to a flat (non-union) type. This is because if we infer to
                                // T | string[], we really don't know if we should be inferring to T or not (because
                                // the correct constituent on the target side could be string[]). Therefore, we put
                                // such inferior inferences into a secondary bucket, and only use them if the primary
                                // bucket is empty.
                                var candidates = inferiority ?
                                    inferences.secondary || (inferences.secondary = []) :
                                    inferences.primary || (inferences.primary = []);
                                if (!ts.contains(candidates, source)) {
                                    candidates.push(source);
                                }
                            }
                            return;
                        }
                    }
                }
                else if (source.flags & 4096 /* Reference */ && target.flags & 4096 /* Reference */ && source.target === target.target) {
                    // If source and target are references to the same generic type, infer from type arguments
                    var sourceTypes = source.typeArguments;
                    var targetTypes = target.typeArguments;
                    for (var i = 0; i < sourceTypes.length; i++) {
                        inferFromTypes(sourceTypes[i], targetTypes[i]);
                    }
                }
                else if (target.flags & 16384 /* Union */) {
                    var targetTypes = target.types;
                    var typeParameterCount = 0;
                    var typeParameter;
                    // First infer to each type in union that isn't a type parameter
                    for (var _i = 0; _i < targetTypes.length; _i++) {
                        var t = targetTypes[_i];
                        if (t.flags & 512 /* TypeParameter */ && ts.contains(context.typeParameters, t)) {
                            typeParameter = t;
                            typeParameterCount++;
                        }
                        else {
                            inferFromTypes(source, t);
                        }
                    }
                    // If union contains a single naked type parameter, make a secondary inference to that type parameter
                    if (typeParameterCount === 1) {
                        inferiority++;
                        inferFromTypes(source, typeParameter);
                        inferiority--;
                    }
                }
                else if (source.flags & 16384 /* Union */) {
                    // Source is a union type, infer from each consituent type
                    var sourceTypes = source.types;
                    for (var _a = 0; _a < sourceTypes.length; _a++) {
                        var sourceType = sourceTypes[_a];
                        inferFromTypes(sourceType, target);
                    }
                }
                else if (source.flags & 48128 /* ObjectType */ && (target.flags & (4096 /* Reference */ | 8192 /* Tuple */) ||
                    (target.flags & 32768 /* Anonymous */) && target.symbol && target.symbol.flags & (8192 /* Method */ | 2048 /* TypeLiteral */))) {
                    // If source is an object type, and target is a type reference, a tuple type, the type of a method, or a type literal, infer from members
                    if (isInProcess(source, target)) {
                        return;
                    }
                    if (isDeeplyNestedGeneric(source, sourceStack, depth) && isDeeplyNestedGeneric(target, targetStack, depth)) {
                        return;
                    }
                    if (depth === 0) {
                        sourceStack = [];
                        targetStack = [];
                    }
                    sourceStack[depth] = source;
                    targetStack[depth] = target;
                    depth++;
                    inferFromProperties(source, target);
                    inferFromSignatures(source, target, 0 /* Call */);
                    inferFromSignatures(source, target, 1 /* Construct */);
                    inferFromIndexTypes(source, target, 0 /* String */, 0 /* String */);
                    inferFromIndexTypes(source, target, 1 /* Number */, 1 /* Number */);
                    inferFromIndexTypes(source, target, 0 /* String */, 1 /* Number */);
                    depth--;
                }
            }
            function inferFromProperties(source, target) {
                var properties = getPropertiesOfObjectType(target);
                for (var _i = 0; _i < properties.length; _i++) {
                    var targetProp = properties[_i];
                    var sourceProp = getPropertyOfObjectType(source, targetProp.name);
                    if (sourceProp) {
                        inferFromTypes(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp));
                    }
                }
            }
            function inferFromSignatures(source, target, kind) {
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                var sourceLen = sourceSignatures.length;
                var targetLen = targetSignatures.length;
                var len = sourceLen < targetLen ? sourceLen : targetLen;
                for (var i = 0; i < len; i++) {
                    inferFromSignature(getErasedSignature(sourceSignatures[sourceLen - len + i]), getErasedSignature(targetSignatures[targetLen - len + i]));
                }
            }
            function inferFromSignature(source, target) {
                forEachMatchingParameterType(source, target, inferFromTypes);
                if (source.typePredicate && target.typePredicate) {
                    if (target.typePredicate.parameterIndex === source.typePredicate.parameterIndex) {
                        // Return types from type predicates are treated as booleans. In order to infer types
                        // from type predicates we would need to infer using the type within the type predicate
                        // (i.e. 'Foo' from 'x is Foo').
                        inferFromTypes(source.typePredicate.type, target.typePredicate.type);
                    }
                }
                else {
                    inferFromTypes(getReturnTypeOfSignature(source), getReturnTypeOfSignature(target));
                }
            }
            function inferFromIndexTypes(source, target, sourceKind, targetKind) {
                var targetIndexType = getIndexTypeOfType(target, targetKind);
                if (targetIndexType) {
                    var sourceIndexType = getIndexTypeOfType(source, sourceKind);
                    if (sourceIndexType) {
                        inferFromTypes(sourceIndexType, targetIndexType);
                    }
                }
            }
        }
        function getInferenceCandidates(context, index) {
            var inferences = context.inferences[index];
            return inferences.primary || inferences.secondary || emptyArray;
        }
        function getInferredType(context, index) {
            var inferredType = context.inferredTypes[index];
            var inferenceSucceeded;
            if (!inferredType) {
                var inferences = getInferenceCandidates(context, index);
                if (inferences.length) {
                    // Infer widened union or supertype, or the unknown type for no common supertype
                    var unionOrSuperType = context.inferUnionTypes ? getUnionType(inferences) : getCommonSupertype(inferences);
                    inferredType = unionOrSuperType ? getWidenedType(unionOrSuperType) : unknownType;
                    inferenceSucceeded = !!unionOrSuperType;
                }
                else {
                    // Infer the empty object type when no inferences were made. It is important to remember that
                    // in this case, inference still succeeds, meaning there is no error for not having inference
                    // candidates. An inference error only occurs when there are *conflicting* candidates, i.e.
                    // candidates with no common supertype.
                    inferredType = emptyObjectType;
                    inferenceSucceeded = true;
                }
                // Only do the constraint check if inference succeeded (to prevent cascading errors)
                if (inferenceSucceeded) {
                    var constraint = getConstraintOfTypeParameter(context.typeParameters[index]);
                    inferredType = constraint && !isTypeAssignableTo(inferredType, constraint) ? constraint : inferredType;
                }
                else if (context.failedTypeParameterIndex === undefined || context.failedTypeParameterIndex > index) {
                    // If inference failed, it is necessary to record the index of the failed type parameter (the one we are on).
                    // It might be that inference has already failed on a later type parameter on a previous call to inferTypeArguments.
                    // So if this failure is on preceding type parameter, this type parameter is the new failure index.
                    context.failedTypeParameterIndex = index;
                }
                context.inferredTypes[index] = inferredType;
            }
            return inferredType;
        }
        function getInferredTypes(context) {
            for (var i = 0; i < context.inferredTypes.length; i++) {
                getInferredType(context, i);
            }
            return context.inferredTypes;
        }
        function hasAncestor(node, kind) {
            return ts.getAncestor(node, kind) !== undefined;
        }
        // EXPRESSION TYPE CHECKING
        function getResolvedSymbol(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedSymbol) {
                links.resolvedSymbol = (!ts.nodeIsMissing(node) && resolveName(node, node.text, 107455 /* Value */ | 1048576 /* ExportValue */, ts.Diagnostics.Cannot_find_name_0, node)) || unknownSymbol;
            }
            return links.resolvedSymbol;
        }
        function isInTypeQuery(node) {
            // TypeScript 1.0 spec (April 2014): 3.6.3
            // A type query consists of the keyword typeof followed by an expression.
            // The expression is restricted to a single identifier or a sequence of identifiers separated by periods
            while (node) {
                switch (node.kind) {
                    case 150 /* TypeQuery */:
                        return true;
                    case 66 /* Identifier */:
                    case 131 /* QualifiedName */:
                        node = node.parent;
                        continue;
                    default:
                        return false;
                }
            }
            ts.Debug.fail("should not get here");
        }
        // For a union type, remove all constituent types that are of the given type kind (when isOfTypeKind is true)
        // or not of the given type kind (when isOfTypeKind is false)
        function removeTypesFromUnionType(type, typeKind, isOfTypeKind, allowEmptyUnionResult) {
            if (type.flags & 16384 /* Union */) {
                var types = type.types;
                if (ts.forEach(types, function (t) { return !!(t.flags & typeKind) === isOfTypeKind; })) {
                    // Above we checked if we have anything to remove, now use the opposite test to do the removal
                    var narrowedType = getUnionType(ts.filter(types, function (t) { return !(t.flags & typeKind) === isOfTypeKind; }));
                    if (allowEmptyUnionResult || narrowedType !== emptyObjectType) {
                        return narrowedType;
                    }
                }
            }
            else if (allowEmptyUnionResult && !!(type.flags & typeKind) === isOfTypeKind) {
                // Use getUnionType(emptyArray) instead of emptyObjectType in case the way empty union types
                // are represented ever changes.
                return getUnionType(emptyArray);
            }
            return type;
        }
        function hasInitializer(node) {
            return !!(node.initializer || ts.isBindingPattern(node.parent) && hasInitializer(node.parent.parent));
        }
        // Check if a given variable is assigned within a given syntax node
        function isVariableAssignedWithin(symbol, node) {
            var links = getNodeLinks(node);
            if (links.assignmentChecks) {
                var cachedResult = links.assignmentChecks[symbol.id];
                if (cachedResult !== undefined) {
                    return cachedResult;
                }
            }
            else {
                links.assignmentChecks = {};
            }
            return links.assignmentChecks[symbol.id] = isAssignedIn(node);
            function isAssignedInBinaryExpression(node) {
                if (node.operatorToken.kind >= 54 /* FirstAssignment */ && node.operatorToken.kind <= 65 /* LastAssignment */) {
                    var n = node.left;
                    while (n.kind === 167 /* ParenthesizedExpression */) {
                        n = n.expression;
                    }
                    if (n.kind === 66 /* Identifier */ && getResolvedSymbol(n) === symbol) {
                        return true;
                    }
                }
                return ts.forEachChild(node, isAssignedIn);
            }
            function isAssignedInVariableDeclaration(node) {
                if (!ts.isBindingPattern(node.name) && getSymbolOfNode(node) === symbol && hasInitializer(node)) {
                    return true;
                }
                return ts.forEachChild(node, isAssignedIn);
            }
            function isAssignedIn(node) {
                switch (node.kind) {
                    case 176 /* BinaryExpression */:
                        return isAssignedInBinaryExpression(node);
                    case 206 /* VariableDeclaration */:
                    case 158 /* BindingElement */:
                        return isAssignedInVariableDeclaration(node);
                    case 156 /* ObjectBindingPattern */:
                    case 157 /* ArrayBindingPattern */:
                    case 159 /* ArrayLiteralExpression */:
                    case 160 /* ObjectLiteralExpression */:
                    case 161 /* PropertyAccessExpression */:
                    case 162 /* ElementAccessExpression */:
                    case 163 /* CallExpression */:
                    case 164 /* NewExpression */:
                    case 166 /* TypeAssertionExpression */:
                    case 184 /* AsExpression */:
                    case 167 /* ParenthesizedExpression */:
                    case 174 /* PrefixUnaryExpression */:
                    case 170 /* DeleteExpression */:
                    case 173 /* AwaitExpression */:
                    case 171 /* TypeOfExpression */:
                    case 172 /* VoidExpression */:
                    case 175 /* PostfixUnaryExpression */:
                    case 179 /* YieldExpression */:
                    case 177 /* ConditionalExpression */:
                    case 180 /* SpreadElementExpression */:
                    case 187 /* Block */:
                    case 188 /* VariableStatement */:
                    case 190 /* ExpressionStatement */:
                    case 191 /* IfStatement */:
                    case 192 /* DoStatement */:
                    case 193 /* WhileStatement */:
                    case 194 /* ForStatement */:
                    case 195 /* ForInStatement */:
                    case 196 /* ForOfStatement */:
                    case 199 /* ReturnStatement */:
                    case 200 /* WithStatement */:
                    case 201 /* SwitchStatement */:
                    case 236 /* CaseClause */:
                    case 237 /* DefaultClause */:
                    case 202 /* LabeledStatement */:
                    case 203 /* ThrowStatement */:
                    case 204 /* TryStatement */:
                    case 239 /* CatchClause */:
                    case 228 /* JsxElement */:
                    case 229 /* JsxSelfClosingElement */:
                    case 233 /* JsxAttribute */:
                    case 234 /* JsxSpreadAttribute */:
                    case 230 /* JsxOpeningElement */:
                    case 235 /* JsxExpression */:
                        return ts.forEachChild(node, isAssignedIn);
                }
                return false;
            }
        }
        function resolveLocation(node) {
            // Resolve location from top down towards node if it is a context sensitive expression
            // That helps in making sure not assigning types as any when resolved out of order
            var containerNodes = [];
            for (var parent_3 = node.parent; parent_3; parent_3 = parent_3.parent) {
                if ((ts.isExpression(parent_3) || ts.isObjectLiteralMethod(node)) &&
                    isContextSensitive(parent_3)) {
                    containerNodes.unshift(parent_3);
                }
            }
            ts.forEach(containerNodes, function (node) { getTypeOfNode(node); });
        }
        function getSymbolAtLocation(node) {
            resolveLocation(node);
            return getSymbolInfo(node);
        }
        function getTypeAtLocation(node) {
            resolveLocation(node);
            return getTypeOfNode(node);
        }
        function getTypeOfSymbolAtLocation(symbol, node) {
            resolveLocation(node);
            // Get the narrowed type of symbol at given location instead of just getting
            // the type of the symbol.
            // eg.
            // function foo(a: string | number) {
            //     if (typeof a === "string") {
            //         a/**/
            //     }
            // }
            // getTypeOfSymbol for a would return type of parameter symbol string | number
            // Unless we provide location /**/, checker wouldn't know how to narrow the type
            // By using getNarrowedTypeOfSymbol would return string since it would be able to narrow
            // it by typeguard in the if true condition
            return getNarrowedTypeOfSymbol(symbol, node);
        }
        // Get the narrowed type of a given symbol at a given location
        function getNarrowedTypeOfSymbol(symbol, node) {
            var type = getTypeOfSymbol(symbol);
            // Only narrow when symbol is variable of type any or an object, union, or type parameter type
            if (node && symbol.flags & 3 /* Variable */) {
                if (isTypeAny(type) || type.flags & (48128 /* ObjectType */ | 16384 /* Union */ | 512 /* TypeParameter */)) {
                    loop: while (node.parent) {
                        var child = node;
                        node = node.parent;
                        var narrowedType = type;
                        switch (node.kind) {
                            case 191 /* IfStatement */:
                                // In a branch of an if statement, narrow based on controlling expression
                                if (child !== node.expression) {
                                    narrowedType = narrowType(type, node.expression, child === node.thenStatement);
                                }
                                break;
                            case 177 /* ConditionalExpression */:
                                // In a branch of a conditional expression, narrow based on controlling condition
                                if (child !== node.condition) {
                                    narrowedType = narrowType(type, node.condition, child === node.whenTrue);
                                }
                                break;
                            case 176 /* BinaryExpression */:
                                // In the right operand of an && or ||, narrow based on left operand
                                if (child === node.right) {
                                    if (node.operatorToken.kind === 49 /* AmpersandAmpersandToken */) {
                                        narrowedType = narrowType(type, node.left, true);
                                    }
                                    else if (node.operatorToken.kind === 50 /* BarBarToken */) {
                                        narrowedType = narrowType(type, node.left, false);
                                    }
                                }
                                break;
                            case 243 /* SourceFile */:
                            case 213 /* ModuleDeclaration */:
                            case 208 /* FunctionDeclaration */:
                            case 139 /* MethodDeclaration */:
                            case 138 /* MethodSignature */:
                            case 141 /* GetAccessor */:
                            case 142 /* SetAccessor */:
                            case 140 /* Constructor */:
                                // Stop at the first containing function or module declaration
                                break loop;
                        }
                        // Use narrowed type if construct contains no assignments to variable
                        if (narrowedType !== type) {
                            if (isVariableAssignedWithin(symbol, node)) {
                                break;
                            }
                            type = narrowedType;
                        }
                    }
                }
            }
            return type;
            function narrowTypeByEquality(type, expr, assumeTrue) {
                // Check that we have 'typeof <symbol>' on the left and string literal on the right
                if (expr.left.kind !== 171 /* TypeOfExpression */ || expr.right.kind !== 8 /* StringLiteral */) {
                    return type;
                }
                var left = expr.left;
                var right = expr.right;
                if (left.expression.kind !== 66 /* Identifier */ || getResolvedSymbol(left.expression) !== symbol) {
                    return type;
                }
                var typeInfo = primitiveTypeInfo[right.text];
                if (expr.operatorToken.kind === 32 /* ExclamationEqualsEqualsToken */) {
                    assumeTrue = !assumeTrue;
                }
                if (assumeTrue) {
                    // Assumed result is true. If check was not for a primitive type, remove all primitive types
                    if (!typeInfo) {
                        return removeTypesFromUnionType(type, 258 /* StringLike */ | 132 /* NumberLike */ | 8 /* Boolean */ | 2097152 /* ESSymbol */, 
                        /*isOfTypeKind*/ true, false);
                    }
                    // Check was for a primitive type, return that primitive type if it is a subtype
                    if (isTypeSubtypeOf(typeInfo.type, type)) {
                        return typeInfo.type;
                    }
                    // Otherwise, remove all types that aren't of the primitive type kind. This can happen when the type is
                    // union of enum types and other types.
                    return removeTypesFromUnionType(type, typeInfo.flags, false, false);
                }
                else {
                    // Assumed result is false. If check was for a primitive type, remove that primitive type
                    if (typeInfo) {
                        return removeTypesFromUnionType(type, typeInfo.flags, true, false);
                    }
                    // Otherwise we don't have enough information to do anything.
                    return type;
                }
            }
            function narrowTypeByAnd(type, expr, assumeTrue) {
                if (assumeTrue) {
                    // The assumed result is true, therefore we narrow assuming each operand to be true.
                    return narrowType(narrowType(type, expr.left, true), expr.right, true);
                }
                else {
                    // The assumed result is false. This means either the first operand was false, or the first operand was true
                    // and the second operand was false. We narrow with those assumptions and union the two resulting types.
                    return getUnionType([
                        narrowType(type, expr.left, false),
                        narrowType(narrowType(type, expr.left, true), expr.right, false)
                    ]);
                }
            }
            function narrowTypeByOr(type, expr, assumeTrue) {
                if (assumeTrue) {
                    // The assumed result is true. This means either the first operand was true, or the first operand was false
                    // and the second operand was true. We narrow with those assumptions and union the two resulting types.
                    return getUnionType([
                        narrowType(type, expr.left, true),
                        narrowType(narrowType(type, expr.left, false), expr.right, true)
                    ]);
                }
                else {
                    // The assumed result is false, therefore we narrow assuming each operand to be false.
                    return narrowType(narrowType(type, expr.left, false), expr.right, false);
                }
            }
            function narrowTypeByInstanceof(type, expr, assumeTrue) {
                // Check that type is not any, assumed result is true, and we have variable symbol on the left
                if (isTypeAny(type) || !assumeTrue || expr.left.kind !== 66 /* Identifier */ || getResolvedSymbol(expr.left) !== symbol) {
                    return type;
                }
                // Check that right operand is a function type with a prototype property
                var rightType = checkExpression(expr.right);
                if (!isTypeSubtypeOf(rightType, globalFunctionType)) {
                    return type;
                }
                var targetType;
                var prototypeProperty = getPropertyOfType(rightType, "prototype");
                if (prototypeProperty) {
                    // Target type is type of the prototype property
                    var prototypePropertyType = getTypeOfSymbol(prototypeProperty);
                    if (!isTypeAny(prototypePropertyType)) {
                        targetType = prototypePropertyType;
                    }
                }
                if (!targetType) {
                    // Target type is type of construct signature
                    var constructSignatures;
                    if (rightType.flags & 2048 /* Interface */) {
                        constructSignatures = resolveDeclaredMembers(rightType).declaredConstructSignatures;
                    }
                    else if (rightType.flags & 32768 /* Anonymous */) {
                        constructSignatures = getSignaturesOfType(rightType, 1 /* Construct */);
                    }
                    if (constructSignatures && constructSignatures.length) {
                        targetType = getUnionType(ts.map(constructSignatures, function (signature) { return getReturnTypeOfSignature(getErasedSignature(signature)); }));
                    }
                }
                if (targetType) {
                    return getNarrowedType(type, targetType);
                }
                return type;
            }
            function getNarrowedType(originalType, narrowedTypeCandidate) {
                // Narrow to the target type if it's a subtype of the current type
                if (isTypeSubtypeOf(narrowedTypeCandidate, originalType)) {
                    return narrowedTypeCandidate;
                }
                // If the current type is a union type, remove all constituents that aren't subtypes of the target.
                if (originalType.flags & 16384 /* Union */) {
                    return getUnionType(ts.filter(originalType.types, function (t) { return isTypeSubtypeOf(t, narrowedTypeCandidate); }));
                }
                return originalType;
            }
            function narrowTypeByTypePredicate(type, expr, assumeTrue) {
                if (type.flags & 1 /* Any */) {
                    return type;
                }
                var signature = getResolvedSignature(expr);
                if (signature.typePredicate &&
                    expr.arguments[signature.typePredicate.parameterIndex] &&
                    getSymbolAtLocation(expr.arguments[signature.typePredicate.parameterIndex]) === symbol) {
                    if (!assumeTrue) {
                        if (type.flags & 16384 /* Union */) {
                            return getUnionType(ts.filter(type.types, function (t) { return !isTypeSubtypeOf(t, signature.typePredicate.type); }));
                        }
                        return type;
                    }
                    return getNarrowedType(type, signature.typePredicate.type);
                }
                return type;
            }
            // Narrow the given type based on the given expression having the assumed boolean value. The returned type
            // will be a subtype or the same type as the argument.
            function narrowType(type, expr, assumeTrue) {
                switch (expr.kind) {
                    case 163 /* CallExpression */:
                        return narrowTypeByTypePredicate(type, expr, assumeTrue);
                    case 167 /* ParenthesizedExpression */:
                        return narrowType(type, expr.expression, assumeTrue);
                    case 176 /* BinaryExpression */:
                        var operator = expr.operatorToken.kind;
                        if (operator === 31 /* EqualsEqualsEqualsToken */ || operator === 32 /* ExclamationEqualsEqualsToken */) {
                            return narrowTypeByEquality(type, expr, assumeTrue);
                        }
                        else if (operator === 49 /* AmpersandAmpersandToken */) {
                            return narrowTypeByAnd(type, expr, assumeTrue);
                        }
                        else if (operator === 50 /* BarBarToken */) {
                            return narrowTypeByOr(type, expr, assumeTrue);
                        }
                        else if (operator === 88 /* InstanceOfKeyword */) {
                            return narrowTypeByInstanceof(type, expr, assumeTrue);
                        }
                        break;
                    case 174 /* PrefixUnaryExpression */:
                        if (expr.operator === 47 /* ExclamationToken */) {
                            return narrowType(type, expr.operand, !assumeTrue);
                        }
                        break;
                }
                return type;
            }
        }
        function checkIdentifier(node) {
            var symbol = getResolvedSymbol(node);
            // As noted in ECMAScript 6 language spec, arrow functions never have an arguments objects.
            // Although in down-level emit of arrow function, we emit it using function expression which means that
            // arguments objects will be bound to the inner object; emitting arrow function natively in ES6, arguments objects
            // will be bound to non-arrow function that contain this arrow function. This results in inconsistent behavior.
            // To avoid that we will give an error to users if they use arguments objects in arrow function so that they
            // can explicitly bound arguments objects
            if (symbol === argumentsSymbol) {
                var container = ts.getContainingFunction(node);
                if (container.kind === 169 /* ArrowFunction */) {
                    if (languageVersion < 2 /* ES6 */) {
                        error(node, ts.Diagnostics.The_arguments_object_cannot_be_referenced_in_an_arrow_function_in_ES3_and_ES5_Consider_using_a_standard_function_expression);
                    }
                }
                if (node.parserContextFlags & 8 /* Await */) {
                    getNodeLinks(container).flags |= 4096 /* CaptureArguments */;
                    getNodeLinks(node).flags |= 2048 /* LexicalArguments */;
                }
            }
            if (symbol.flags & 8388608 /* Alias */ && !isInTypeQuery(node) && !isConstEnumOrConstEnumOnlyModule(resolveAlias(symbol))) {
                markAliasSymbolAsReferenced(symbol);
            }
            checkCollisionWithCapturedSuperVariable(node, node);
            checkCollisionWithCapturedThisVariable(node, node);
            checkBlockScopedBindingCapturedInLoop(node, symbol);
            return getNarrowedTypeOfSymbol(getExportSymbolOfValueSymbolIfExported(symbol), node);
        }
        function isInsideFunction(node, threshold) {
            var current = node;
            while (current && current !== threshold) {
                if (ts.isFunctionLike(current)) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        }
        function checkBlockScopedBindingCapturedInLoop(node, symbol) {
            if (languageVersion >= 2 /* ES6 */ ||
                (symbol.flags & 2 /* BlockScopedVariable */) === 0 ||
                symbol.valueDeclaration.parent.kind === 239 /* CatchClause */) {
                return;
            }
            // - check if binding is used in some function
            // (stop the walk when reaching container of binding declaration)
            // - if first check succeeded - check if variable is declared inside the loop
            // nesting structure:
            // (variable declaration or binding element) -> variable declaration list -> container
            var container = symbol.valueDeclaration;
            while (container.kind !== 207 /* VariableDeclarationList */) {
                container = container.parent;
            }
            // get the parent of variable declaration list
            container = container.parent;
            if (container.kind === 188 /* VariableStatement */) {
                // if parent is variable statement - get its parent
                container = container.parent;
            }
            var inFunction = isInsideFunction(node.parent, container);
            var current = container;
            while (current && !ts.nodeStartsNewLexicalEnvironment(current)) {
                if (isIterationStatement(current, false)) {
                    if (inFunction) {
                        grammarErrorOnFirstToken(current, ts.Diagnostics.Loop_contains_block_scoped_variable_0_referenced_by_a_function_in_the_loop_This_is_only_supported_in_ECMAScript_6_or_higher, ts.declarationNameToString(node));
                    }
                    // mark value declaration so during emit they can have a special handling
                    getNodeLinks(symbol.valueDeclaration).flags |= 16384 /* BlockScopedBindingInLoop */;
                    break;
                }
                current = current.parent;
            }
        }
        function captureLexicalThis(node, container) {
            getNodeLinks(node).flags |= 2 /* LexicalThis */;
            if (container.kind === 137 /* PropertyDeclaration */ || container.kind === 140 /* Constructor */) {
                var classNode = container.parent;
                getNodeLinks(classNode).flags |= 4 /* CaptureThis */;
            }
            else {
                getNodeLinks(container).flags |= 4 /* CaptureThis */;
            }
        }
        function checkThisExpression(node) {
            // Stop at the first arrow function so that we can
            // tell whether 'this' needs to be captured.
            var container = ts.getThisContainer(node, true);
            var needToCaptureLexicalThis = false;
            // Now skip arrow functions to get the "real" owner of 'this'.
            if (container.kind === 169 /* ArrowFunction */) {
                container = ts.getThisContainer(container, false);
                // When targeting es6, arrow function lexically bind "this" so we do not need to do the work of binding "this" in emitted code
                needToCaptureLexicalThis = (languageVersion < 2 /* ES6 */);
            }
            switch (container.kind) {
                case 213 /* ModuleDeclaration */:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_module_or_namespace_body);
                    // do not return here so in case if lexical this is captured - it will be reflected in flags on NodeLinks
                    break;
                case 212 /* EnumDeclaration */:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_current_location);
                    // do not return here so in case if lexical this is captured - it will be reflected in flags on NodeLinks
                    break;
                case 140 /* Constructor */:
                    if (isInConstructorArgumentInitializer(node, container)) {
                        error(node, ts.Diagnostics.this_cannot_be_referenced_in_constructor_arguments);
                    }
                    break;
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                    if (container.flags & 128 /* Static */) {
                        error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_static_property_initializer);
                    }
                    break;
                case 132 /* ComputedPropertyName */:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_computed_property_name);
                    break;
            }
            if (needToCaptureLexicalThis) {
                captureLexicalThis(node, container);
            }
            if (ts.isClassLike(container.parent)) {
                var symbol = getSymbolOfNode(container.parent);
                return container.flags & 128 /* Static */ ? getTypeOfSymbol(symbol) : getDeclaredTypeOfSymbol(symbol);
            }
            return anyType;
        }
        function isInConstructorArgumentInitializer(node, constructorDecl) {
            for (var n = node; n && n !== constructorDecl; n = n.parent) {
                if (n.kind === 134 /* Parameter */) {
                    return true;
                }
            }
            return false;
        }
        function checkSuperExpression(node) {
            var isCallExpression = node.parent.kind === 163 /* CallExpression */ && node.parent.expression === node;
            var classDeclaration = ts.getContainingClass(node);
            var classType = classDeclaration && getDeclaredTypeOfSymbol(getSymbolOfNode(classDeclaration));
            var baseClassType = classType && getBaseTypes(classType)[0];
            if (!baseClassType) {
                if (!classDeclaration || !ts.getClassExtendsHeritageClauseElement(classDeclaration)) {
                    error(node, ts.Diagnostics.super_can_only_be_referenced_in_a_derived_class);
                }
                return unknownType;
            }
            var container = ts.getSuperContainer(node, true);
            if (container) {
                var canUseSuperExpression = false;
                var needToCaptureLexicalThis;
                if (isCallExpression) {
                    // TS 1.0 SPEC (April 2014): 4.8.1
                    // Super calls are only permitted in constructors of derived classes
                    canUseSuperExpression = container.kind === 140 /* Constructor */;
                }
                else {
                    // TS 1.0 SPEC (April 2014)
                    // 'super' property access is allowed
                    // - In a constructor, instance member function, instance member accessor, or instance member variable initializer where this references a derived class instance
                    // - In a static member function or static member accessor
                    // super property access might appear in arrow functions with arbitrary deep nesting
                    needToCaptureLexicalThis = false;
                    while (container && container.kind === 169 /* ArrowFunction */) {
                        container = ts.getSuperContainer(container, true);
                        needToCaptureLexicalThis = languageVersion < 2 /* ES6 */;
                    }
                    // topmost container must be something that is directly nested in the class declaration
                    if (container && ts.isClassLike(container.parent)) {
                        if (container.flags & 128 /* Static */) {
                            canUseSuperExpression =
                                container.kind === 139 /* MethodDeclaration */ ||
                                    container.kind === 138 /* MethodSignature */ ||
                                    container.kind === 141 /* GetAccessor */ ||
                                    container.kind === 142 /* SetAccessor */;
                        }
                        else {
                            canUseSuperExpression =
                                container.kind === 139 /* MethodDeclaration */ ||
                                    container.kind === 138 /* MethodSignature */ ||
                                    container.kind === 141 /* GetAccessor */ ||
                                    container.kind === 142 /* SetAccessor */ ||
                                    container.kind === 137 /* PropertyDeclaration */ ||
                                    container.kind === 136 /* PropertySignature */ ||
                                    container.kind === 140 /* Constructor */;
                        }
                    }
                }
                if (canUseSuperExpression) {
                    var returnType;
                    if ((container.flags & 128 /* Static */) || isCallExpression) {
                        getNodeLinks(node).flags |= 512 /* SuperStatic */;
                        returnType = getBaseConstructorTypeOfClass(classType);
                    }
                    else {
                        getNodeLinks(node).flags |= 256 /* SuperInstance */;
                        returnType = baseClassType;
                    }
                    if (container.kind === 140 /* Constructor */ && isInConstructorArgumentInitializer(node, container)) {
                        // issue custom error message for super property access in constructor arguments (to be aligned with old compiler)
                        error(node, ts.Diagnostics.super_cannot_be_referenced_in_constructor_arguments);
                        returnType = unknownType;
                    }
                    if (!isCallExpression && needToCaptureLexicalThis) {
                        // call expressions are allowed only in constructors so they should always capture correct 'this'
                        // super property access expressions can also appear in arrow functions -
                        // in this case they should also use correct lexical this
                        captureLexicalThis(node.parent, container);
                    }
                    return returnType;
                }
            }
            if (container && container.kind === 132 /* ComputedPropertyName */) {
                error(node, ts.Diagnostics.super_cannot_be_referenced_in_a_computed_property_name);
            }
            else if (isCallExpression) {
                error(node, ts.Diagnostics.Super_calls_are_not_permitted_outside_constructors_or_in_nested_functions_inside_constructors);
            }
            else {
                error(node, ts.Diagnostics.super_property_access_is_permitted_only_in_a_constructor_member_function_or_member_accessor_of_a_derived_class);
            }
            return unknownType;
        }
        // Return contextual type of parameter or undefined if no contextual type is available
        function getContextuallyTypedParameterType(parameter) {
            if (isFunctionExpressionOrArrowFunction(parameter.parent)) {
                var func = parameter.parent;
                if (isContextSensitive(func)) {
                    var contextualSignature = getContextualSignature(func);
                    if (contextualSignature) {
                        var funcHasRestParameters = ts.hasRestParameter(func);
                        var len = func.parameters.length - (funcHasRestParameters ? 1 : 0);
                        var indexOfParameter = ts.indexOf(func.parameters, parameter);
                        if (indexOfParameter < len) {
                            return getTypeAtPosition(contextualSignature, indexOfParameter);
                        }
                        // If last parameter is contextually rest parameter get its type
                        if (indexOfParameter === (func.parameters.length - 1) &&
                            funcHasRestParameters && contextualSignature.hasRestParameter && func.parameters.length >= contextualSignature.parameters.length) {
                            return getTypeOfSymbol(ts.lastOrUndefined(contextualSignature.parameters));
                        }
                    }
                }
            }
            return undefined;
        }
        // In a variable, parameter or property declaration with a type annotation, the contextual type of an initializer
        // expression is the type of the variable, parameter or property. Otherwise, in a parameter declaration of a
        // contextually typed function expression, the contextual type of an initializer expression is the contextual type
        // of the parameter. Otherwise, in a variable or parameter declaration with a binding pattern name, the contextual
        // type of an initializer expression is the type implied by the binding pattern.
        function getContextualTypeForInitializerExpression(node) {
            var declaration = node.parent;
            if (node === declaration.initializer) {
                if (declaration.type) {
                    return getTypeFromTypeNode(declaration.type);
                }
                if (declaration.kind === 134 /* Parameter */) {
                    var type = getContextuallyTypedParameterType(declaration);
                    if (type) {
                        return type;
                    }
                }
                if (ts.isBindingPattern(declaration.name)) {
                    return getTypeFromBindingPattern(declaration.name);
                }
            }
            return undefined;
        }
        function getContextualTypeForReturnExpression(node) {
            var func = ts.getContainingFunction(node);
            if (func && !func.asteriskToken) {
                return getContextualReturnType(func);
            }
            return undefined;
        }
        function getContextualTypeForYieldOperand(node) {
            var func = ts.getContainingFunction(node);
            if (func) {
                var contextualReturnType = getContextualReturnType(func);
                if (contextualReturnType) {
                    return node.asteriskToken
                        ? contextualReturnType
                        : getElementTypeOfIterableIterator(contextualReturnType);
                }
            }
            return undefined;
        }
        function isInParameterInitializerBeforeContainingFunction(node) {
            while (node.parent && !ts.isFunctionLike(node.parent)) {
                if (node.parent.kind === 134 /* Parameter */ && node.parent.initializer === node) {
                    return true;
                }
                node = node.parent;
            }
            return false;
        }
        function getContextualReturnType(functionDecl) {
            // If the containing function has a return type annotation, is a constructor, or is a get accessor whose
            // corresponding set accessor has a type annotation, return statements in the function are contextually typed
            if (functionDecl.type ||
                functionDecl.kind === 140 /* Constructor */ ||
                functionDecl.kind === 141 /* GetAccessor */ && getSetAccessorTypeAnnotationNode(ts.getDeclarationOfKind(functionDecl.symbol, 142 /* SetAccessor */))) {
                return getReturnTypeOfSignature(getSignatureFromDeclaration(functionDecl));
            }
            // Otherwise, if the containing function is contextually typed by a function type with exactly one call signature
            // and that call signature is non-generic, return statements are contextually typed by the return type of the signature
            var signature = getContextualSignatureForFunctionLikeDeclaration(functionDecl);
            if (signature) {
                return getReturnTypeOfSignature(signature);
            }
            return undefined;
        }
        // In a typed function call, an argument or substitution expression is contextually typed by the type of the corresponding parameter.
        function getContextualTypeForArgument(callTarget, arg) {
            var args = getEffectiveCallArguments(callTarget);
            var argIndex = ts.indexOf(args, arg);
            if (argIndex >= 0) {
                var signature = getResolvedSignature(callTarget);
                return getTypeAtPosition(signature, argIndex);
            }
            return undefined;
        }
        function getContextualTypeForSubstitutionExpression(template, substitutionExpression) {
            if (template.parent.kind === 165 /* TaggedTemplateExpression */) {
                return getContextualTypeForArgument(template.parent, substitutionExpression);
            }
            return undefined;
        }
        function getContextualTypeForBinaryOperand(node) {
            var binaryExpression = node.parent;
            var operator = binaryExpression.operatorToken.kind;
            if (operator >= 54 /* FirstAssignment */ && operator <= 65 /* LastAssignment */) {
                // In an assignment expression, the right operand is contextually typed by the type of the left operand.
                if (node === binaryExpression.right) {
                    return checkExpression(binaryExpression.left);
                }
            }
            else if (operator === 50 /* BarBarToken */) {
                // When an || expression has a contextual type, the operands are contextually typed by that type. When an ||
                // expression has no contextual type, the right operand is contextually typed by the type of the left operand.
                var type = getContextualType(binaryExpression);
                if (!type && node === binaryExpression.right) {
                    type = checkExpression(binaryExpression.left);
                }
                return type;
            }
            return undefined;
        }
        // Apply a mapping function to a contextual type and return the resulting type. If the contextual type
        // is a union type, the mapping function is applied to each constituent type and a union of the resulting
        // types is returned.
        function applyToContextualType(type, mapper) {
            if (!(type.flags & 16384 /* Union */)) {
                return mapper(type);
            }
            var types = type.types;
            var mappedType;
            var mappedTypes;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                var t = mapper(current);
                if (t) {
                    if (!mappedType) {
                        mappedType = t;
                    }
                    else if (!mappedTypes) {
                        mappedTypes = [mappedType, t];
                    }
                    else {
                        mappedTypes.push(t);
                    }
                }
            }
            return mappedTypes ? getUnionType(mappedTypes) : mappedType;
        }
        function getTypeOfPropertyOfContextualType(type, name) {
            return applyToContextualType(type, function (t) {
                var prop = getPropertyOfObjectType(t, name);
                return prop ? getTypeOfSymbol(prop) : undefined;
            });
        }
        function getIndexTypeOfContextualType(type, kind) {
            return applyToContextualType(type, function (t) { return getIndexTypeOfObjectOrUnionType(t, kind); });
        }
        // Return true if the given contextual type is a tuple-like type
        function contextualTypeIsTupleLikeType(type) {
            return !!(type.flags & 16384 /* Union */ ? ts.forEach(type.types, isTupleLikeType) : isTupleLikeType(type));
        }
        // Return true if the given contextual type provides an index signature of the given kind
        function contextualTypeHasIndexSignature(type, kind) {
            return !!(type.flags & 16384 /* Union */ ? ts.forEach(type.types, function (t) { return getIndexTypeOfObjectOrUnionType(t, kind); }) : getIndexTypeOfObjectOrUnionType(type, kind));
        }
        // In an object literal contextually typed by a type T, the contextual type of a property assignment is the type of
        // the matching property in T, if one exists. Otherwise, it is the type of the numeric index signature in T, if one
        // exists. Otherwise, it is the type of the string index signature in T, if one exists.
        function getContextualTypeForObjectLiteralMethod(node) {
            ts.Debug.assert(ts.isObjectLiteralMethod(node));
            if (isInsideWithStatementBody(node)) {
                // We cannot answer semantic questions within a with block, do not proceed any further
                return undefined;
            }
            return getContextualTypeForObjectLiteralElement(node);
        }
        function getContextualTypeForObjectLiteralElement(element) {
            var objectLiteral = element.parent;
            var type = getContextualType(objectLiteral);
            if (type) {
                if (!ts.hasDynamicName(element)) {
                    // For a (non-symbol) computed property, there is no reason to look up the name
                    // in the type. It will just be "__computed", which does not appear in any
                    // SymbolTable.
                    var symbolName = getSymbolOfNode(element).name;
                    var propertyType = getTypeOfPropertyOfContextualType(type, symbolName);
                    if (propertyType) {
                        return propertyType;
                    }
                }
                return isNumericName(element.name) && getIndexTypeOfContextualType(type, 1 /* Number */) ||
                    getIndexTypeOfContextualType(type, 0 /* String */);
            }
            return undefined;
        }
        // In an array literal contextually typed by a type T, the contextual type of an element expression at index N is
        // the type of the property with the numeric name N in T, if one exists. Otherwise, if T has a numeric index signature,
        // it is the type of the numeric index signature in T. Otherwise, in ES6 and higher, the contextual type is the iterated
        // type of T.
        function getContextualTypeForElementExpression(node) {
            var arrayLiteral = node.parent;
            var type = getContextualType(arrayLiteral);
            if (type) {
                var index = ts.indexOf(arrayLiteral.elements, node);
                return getTypeOfPropertyOfContextualType(type, "" + index)
                    || getIndexTypeOfContextualType(type, 1 /* Number */)
                    || (languageVersion >= 2 /* ES6 */ ? getElementTypeOfIterable(type, undefined) : undefined);
            }
            return undefined;
        }
        // In a contextually typed conditional expression, the true/false expressions are contextually typed by the same type.
        function getContextualTypeForConditionalOperand(node) {
            var conditional = node.parent;
            return node === conditional.whenTrue || node === conditional.whenFalse ? getContextualType(conditional) : undefined;
        }
        function getContextualTypeForJsxExpression(expr) {
            // Contextual type only applies to JSX expressions that are in attribute assignments (not in 'Children' positions)
            if (expr.parent.kind === 233 /* JsxAttribute */) {
                var attrib = expr.parent;
                var attrsType = getJsxElementAttributesType(attrib.parent);
                if (!attrsType || isTypeAny(attrsType)) {
                    return undefined;
                }
                else {
                    return getTypeOfPropertyOfType(attrsType, attrib.name.text);
                }
            }
            if (expr.kind === 234 /* JsxSpreadAttribute */) {
                return getJsxElementAttributesType(expr.parent);
            }
            return undefined;
        }
        // Return the contextual type for a given expression node. During overload resolution, a contextual type may temporarily
        // be "pushed" onto a node using the contextualType property.
        function getContextualType(node) {
            if (isInsideWithStatementBody(node)) {
                // We cannot answer semantic questions within a with block, do not proceed any further
                return undefined;
            }
            if (node.contextualType) {
                return node.contextualType;
            }
            var parent = node.parent;
            switch (parent.kind) {
                case 206 /* VariableDeclaration */:
                case 134 /* Parameter */:
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                case 158 /* BindingElement */:
                    return getContextualTypeForInitializerExpression(node);
                case 169 /* ArrowFunction */:
                case 199 /* ReturnStatement */:
                    return getContextualTypeForReturnExpression(node);
                case 179 /* YieldExpression */:
                    return getContextualTypeForYieldOperand(parent);
                case 163 /* CallExpression */:
                case 164 /* NewExpression */:
                    return getContextualTypeForArgument(parent, node);
                case 166 /* TypeAssertionExpression */:
                case 184 /* AsExpression */:
                    return getTypeFromTypeNode(parent.type);
                case 176 /* BinaryExpression */:
                    return getContextualTypeForBinaryOperand(node);
                case 240 /* PropertyAssignment */:
                    return getContextualTypeForObjectLiteralElement(parent);
                case 159 /* ArrayLiteralExpression */:
                    return getContextualTypeForElementExpression(node);
                case 177 /* ConditionalExpression */:
                    return getContextualTypeForConditionalOperand(node);
                case 185 /* TemplateSpan */:
                    ts.Debug.assert(parent.parent.kind === 178 /* TemplateExpression */);
                    return getContextualTypeForSubstitutionExpression(parent.parent, node);
                case 167 /* ParenthesizedExpression */:
                    return getContextualType(parent);
                case 235 /* JsxExpression */:
                case 234 /* JsxSpreadAttribute */:
                    return getContextualTypeForJsxExpression(parent);
            }
            return undefined;
        }
        // If the given type is an object or union type, if that type has a single signature, and if
        // that signature is non-generic, return the signature. Otherwise return undefined.
        function getNonGenericSignature(type) {
            var signatures = getSignaturesOfObjectOrUnionType(type, 0 /* Call */);
            if (signatures.length === 1) {
                var signature = signatures[0];
                if (!signature.typeParameters) {
                    return signature;
                }
            }
        }
        function isFunctionExpressionOrArrowFunction(node) {
            return node.kind === 168 /* FunctionExpression */ || node.kind === 169 /* ArrowFunction */;
        }
        function getContextualSignatureForFunctionLikeDeclaration(node) {
            // Only function expressions, arrow functions, and object literal methods are contextually typed.
            return isFunctionExpressionOrArrowFunction(node) || ts.isObjectLiteralMethod(node)
                ? getContextualSignature(node)
                : undefined;
        }
        // Return the contextual signature for a given expression node. A contextual type provides a
        // contextual signature if it has a single call signature and if that call signature is non-generic.
        // If the contextual type is a union type, get the signature from each type possible and if they are
        // all identical ignoring their return type, the result is same signature but with return type as
        // union type of return types from these signatures
        function getContextualSignature(node) {
            ts.Debug.assert(node.kind !== 139 /* MethodDeclaration */ || ts.isObjectLiteralMethod(node));
            var type = ts.isObjectLiteralMethod(node)
                ? getContextualTypeForObjectLiteralMethod(node)
                : getContextualType(node);
            if (!type) {
                return undefined;
            }
            if (!(type.flags & 16384 /* Union */)) {
                return getNonGenericSignature(type);
            }
            var signatureList;
            var types = type.types;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                // The signature set of all constituent type with call signatures should match
                // So number of signatures allowed is either 0 or 1
                if (signatureList &&
                    getSignaturesOfObjectOrUnionType(current, 0 /* Call */).length > 1) {
                    return undefined;
                }
                var signature = getNonGenericSignature(current);
                if (signature) {
                    if (!signatureList) {
                        // This signature will contribute to contextual union signature
                        signatureList = [signature];
                    }
                    else if (!compareSignatures(signatureList[0], signature, false, compareTypes)) {
                        // Signatures aren't identical, do not use
                        return undefined;
                    }
                    else {
                        // Use this signature for contextual union signature
                        signatureList.push(signature);
                    }
                }
            }
            // Result is union of signatures collected (return type is union of return types of this signature set)
            var result;
            if (signatureList) {
                result = cloneSignature(signatureList[0]);
                // Clear resolved return type we possibly got from cloneSignature
                result.resolvedReturnType = undefined;
                result.unionSignatures = signatureList;
            }
            return result;
        }
        // Presence of a contextual type mapper indicates inferential typing, except the identityMapper object is
        // used as a special marker for other purposes.
        function isInferentialContext(mapper) {
            return mapper && mapper !== identityMapper;
        }
        // A node is an assignment target if it is on the left hand side of an '=' token, if it is parented by a property
        // assignment in an object literal that is an assignment target, or if it is parented by an array literal that is
        // an assignment target. Examples include 'a = xxx', '{ p: a } = xxx', '[{ p: a}] = xxx'.
        function isAssignmentTarget(node) {
            var parent = node.parent;
            if (parent.kind === 176 /* BinaryExpression */ && parent.operatorToken.kind === 54 /* EqualsToken */ && parent.left === node) {
                return true;
            }
            if (parent.kind === 240 /* PropertyAssignment */) {
                return isAssignmentTarget(parent.parent);
            }
            if (parent.kind === 159 /* ArrayLiteralExpression */) {
                return isAssignmentTarget(parent);
            }
            return false;
        }
        function checkSpreadElementExpression(node, contextualMapper) {
            // It is usually not safe to call checkExpressionCached if we can be contextually typing.
            // You can tell that we are contextually typing because of the contextualMapper parameter.
            // While it is true that a spread element can have a contextual type, it does not do anything
            // with this type. It is neither affected by it, nor does it propagate it to its operand.
            // So the fact that contextualMapper is passed is not important, because the operand of a spread
            // element is not contextually typed.
            var arrayOrIterableType = checkExpressionCached(node.expression, contextualMapper);
            return checkIteratedTypeOrElementType(arrayOrIterableType, node.expression, false);
        }
        function checkArrayLiteral(node, contextualMapper) {
            var elements = node.elements;
            if (!elements.length) {
                return createArrayType(undefinedType);
            }
            var hasSpreadElement = false;
            var elementTypes = [];
            var inDestructuringPattern = isAssignmentTarget(node);
            for (var _i = 0; _i < elements.length; _i++) {
                var e = elements[_i];
                if (inDestructuringPattern && e.kind === 180 /* SpreadElementExpression */) {
                    // Given the following situation:
                    //    var c: {};
                    //    [...c] = ["", 0];
                    //
                    // c is represented in the tree as a spread element in an array literal.
                    // But c really functions as a rest element, and its purpose is to provide
                    // a contextual type for the right hand side of the assignment. Therefore,
                    // instead of calling checkExpression on "...c", which will give an error 
                    // if c is not iterable/array-like, we need to act as if we are trying to
                    // get the contextual element type from it. So we do something similar to
                    // getContextualTypeForElementExpression, which will crucially not error
                    // if there is no index type / iterated type.
                    var restArrayType = checkExpression(e.expression, contextualMapper);
                    var restElementType = getIndexTypeOfType(restArrayType, 1 /* Number */) ||
                        (languageVersion >= 2 /* ES6 */ ? getElementTypeOfIterable(restArrayType, undefined) : undefined);
                    if (restElementType) {
                        elementTypes.push(restElementType);
                    }
                }
                else {
                    var type = checkExpression(e, contextualMapper);
                    elementTypes.push(type);
                }
                hasSpreadElement = hasSpreadElement || e.kind === 180 /* SpreadElementExpression */;
            }
            if (!hasSpreadElement) {
                var contextualType = getContextualType(node);
                if (contextualType && contextualTypeIsTupleLikeType(contextualType) || inDestructuringPattern) {
                    return createTupleType(elementTypes);
                }
            }
            return createArrayType(getUnionType(elementTypes));
        }
        function isNumericName(name) {
            return name.kind === 132 /* ComputedPropertyName */ ? isNumericComputedName(name) : isNumericLiteralName(name.text);
        }
        function isNumericComputedName(name) {
            // It seems odd to consider an expression of type Any to result in a numeric name,
            // but this behavior is consistent with checkIndexedAccess
            return isTypeAnyOrAllConstituentTypesHaveKind(checkComputedPropertyName(name), 132 /* NumberLike */);
        }
        function isTypeAnyOrAllConstituentTypesHaveKind(type, kind) {
            return isTypeAny(type) || allConstituentTypesHaveKind(type, kind);
        }
        function isNumericLiteralName(name) {
            // The intent of numeric names is that
            //     - they are names with text in a numeric form, and that
            //     - setting properties/indexing with them is always equivalent to doing so with the numeric literal 'numLit',
            //         acquired by applying the abstract 'ToNumber' operation on the name's text.
            //
            // The subtlety is in the latter portion, as we cannot reliably say that anything that looks like a numeric literal is a numeric name.
            // In fact, it is the case that the text of the name must be equal to 'ToString(numLit)' for this to hold.
            //
            // Consider the property name '"0xF00D"'. When one indexes with '0xF00D', they are actually indexing with the value of 'ToString(0xF00D)'
            // according to the ECMAScript specification, so it is actually as if the user indexed with the string '"61453"'.
            // Thus, the text of all numeric literals equivalent to '61543' such as '0xF00D', '0xf00D', '0170015', etc. are not valid numeric names
            // because their 'ToString' representation is not equal to their original text.
            // This is motivated by ECMA-262 sections 9.3.1, 9.8.1, 11.1.5, and 11.2.1.
            //
            // Here, we test whether 'ToString(ToNumber(name))' is exactly equal to 'name'.
            // The '+' prefix operator is equivalent here to applying the abstract ToNumber operation.
            // Applying the 'toString()' method on a number gives us the abstract ToString operation on a number.
            //
            // Note that this accepts the values 'Infinity', '-Infinity', and 'NaN', and that this is intentional.
            // This is desired behavior, because when indexing with them as numeric entities, you are indexing
            // with the strings '"Infinity"', '"-Infinity"', and '"NaN"' respectively.
            return (+name).toString() === name;
        }
        function checkComputedPropertyName(node) {
            var links = getNodeLinks(node.expression);
            if (!links.resolvedType) {
                links.resolvedType = checkExpression(node.expression);
                // This will allow types number, string, symbol or any. It will also allow enums, the unknown
                // type, and any union of these types (like string | number).
                if (!isTypeAnyOrAllConstituentTypesHaveKind(links.resolvedType, 132 /* NumberLike */ | 258 /* StringLike */ | 2097152 /* ESSymbol */)) {
                    error(node, ts.Diagnostics.A_computed_property_name_must_be_of_type_string_number_symbol_or_any);
                }
                else {
                    checkThatExpressionIsProperSymbolReference(node.expression, links.resolvedType, true);
                }
            }
            return links.resolvedType;
        }
        function checkObjectLiteral(node, contextualMapper) {
            // Grammar checking
            checkGrammarObjectLiteralExpression(node);
            var propertiesTable = {};
            var propertiesArray = [];
            var contextualType = getContextualType(node);
            var typeFlags;
            for (var _i = 0, _a = node.properties; _i < _a.length; _i++) {
                var memberDecl = _a[_i];
                var member = memberDecl.symbol;
                if (memberDecl.kind === 240 /* PropertyAssignment */ ||
                    memberDecl.kind === 241 /* ShorthandPropertyAssignment */ ||
                    ts.isObjectLiteralMethod(memberDecl)) {
                    var type = void 0;
                    if (memberDecl.kind === 240 /* PropertyAssignment */) {
                        type = checkPropertyAssignment(memberDecl, contextualMapper);
                    }
                    else if (memberDecl.kind === 139 /* MethodDeclaration */) {
                        type = checkObjectLiteralMethod(memberDecl, contextualMapper);
                    }
                    else {
                        ts.Debug.assert(memberDecl.kind === 241 /* ShorthandPropertyAssignment */);
                        type = checkExpression(memberDecl.name, contextualMapper);
                    }
                    typeFlags |= type.flags;
                    var prop = createSymbol(4 /* Property */ | 67108864 /* Transient */ | member.flags, member.name);
                    prop.declarations = member.declarations;
                    prop.parent = member.parent;
                    if (member.valueDeclaration) {
                        prop.valueDeclaration = member.valueDeclaration;
                    }
                    prop.type = type;
                    prop.target = member;
                    member = prop;
                }
                else {
                    // TypeScript 1.0 spec (April 2014)
                    // A get accessor declaration is processed in the same manner as
                    // an ordinary function declaration(section 6.1) with no parameters.
                    // A set accessor declaration is processed in the same manner
                    // as an ordinary function declaration with a single parameter and a Void return type.
                    ts.Debug.assert(memberDecl.kind === 141 /* GetAccessor */ || memberDecl.kind === 142 /* SetAccessor */);
                    checkAccessorDeclaration(memberDecl);
                }
                if (!ts.hasDynamicName(memberDecl)) {
                    propertiesTable[member.name] = member;
                }
                propertiesArray.push(member);
            }
            var stringIndexType = getIndexType(0 /* String */);
            var numberIndexType = getIndexType(1 /* Number */);
            var result = createAnonymousType(node.symbol, propertiesTable, emptyArray, emptyArray, stringIndexType, numberIndexType);
            result.flags |= 262144 /* ObjectLiteral */ | 1048576 /* ContainsObjectLiteral */ | (typeFlags & 524288 /* ContainsUndefinedOrNull */);
            return result;
            function getIndexType(kind) {
                if (contextualType && contextualTypeHasIndexSignature(contextualType, kind)) {
                    var propTypes = [];
                    for (var i = 0; i < propertiesArray.length; i++) {
                        var propertyDecl = node.properties[i];
                        if (kind === 0 /* String */ || isNumericName(propertyDecl.name)) {
                            // Do not call getSymbolOfNode(propertyDecl), as that will get the
                            // original symbol for the node. We actually want to get the symbol
                            // created by checkObjectLiteral, since that will be appropriately
                            // contextually typed and resolved.
                            var type = getTypeOfSymbol(propertiesArray[i]);
                            if (!ts.contains(propTypes, type)) {
                                propTypes.push(type);
                            }
                        }
                    }
                    var result_1 = propTypes.length ? getUnionType(propTypes) : undefinedType;
                    typeFlags |= result_1.flags;
                    return result_1;
                }
                return undefined;
            }
        }
        function checkJsxSelfClosingElement(node) {
            checkJsxOpeningLikeElement(node);
            return jsxElementType || anyType;
        }
        function tagNamesAreEquivalent(lhs, rhs) {
            if (lhs.kind !== rhs.kind) {
                return false;
            }
            if (lhs.kind === 66 /* Identifier */) {
                return lhs.text === rhs.text;
            }
            return lhs.right.text === rhs.right.text &&
                tagNamesAreEquivalent(lhs.left, rhs.left);
        }
        function checkJsxElement(node) {
            // Check that the closing tag matches
            if (!tagNamesAreEquivalent(node.openingElement.tagName, node.closingElement.tagName)) {
                error(node.closingElement, ts.Diagnostics.Expected_corresponding_JSX_closing_tag_for_0, ts.getTextOfNode(node.openingElement.tagName));
            }
            // Check attributes
            checkJsxOpeningLikeElement(node.openingElement);
            // Check children
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                switch (child.kind) {
                    case 235 /* JsxExpression */:
                        checkJsxExpression(child);
                        break;
                    case 228 /* JsxElement */:
                        checkJsxElement(child);
                        break;
                    case 229 /* JsxSelfClosingElement */:
                        checkJsxSelfClosingElement(child);
                        break;
                    default:
                        // No checks for JSX Text
                        ts.Debug.assert(child.kind === 231 /* JsxText */);
                }
            }
            return jsxElementType || anyType;
        }
        /**
         * Returns true iff the JSX element name would be a valid JS identifier, ignoring restrictions about keywords not being identifiers
         */
        function isUnhyphenatedJsxName(name) {
            // - is the only character supported in JSX attribute names that isn't valid in JavaScript identifiers
            return name.indexOf("-") < 0;
        }
        /**
         * Returns true iff React would emit this tag name as a string rather than an identifier or qualified name
         */
        function isJsxIntrinsicIdentifier(tagName) {
            if (tagName.kind === 131 /* QualifiedName */) {
                return false;
            }
            else {
                return ts.isIntrinsicJsxName(tagName.text);
            }
        }
        function checkJsxAttribute(node, elementAttributesType, nameTable) {
            var correspondingPropType = undefined;
            // Look up the corresponding property for this attribute
            if (elementAttributesType === emptyObjectType && isUnhyphenatedJsxName(node.name.text)) {
                // If there is no 'props' property, you may not have non-"data-" attributes
                error(node.parent, ts.Diagnostics.JSX_element_class_does_not_support_attributes_because_it_does_not_have_a_0_property, getJsxElementPropertiesName());
            }
            else if (elementAttributesType && !isTypeAny(elementAttributesType)) {
                var correspondingPropSymbol = getPropertyOfType(elementAttributesType, node.name.text);
                correspondingPropType = correspondingPropSymbol && getTypeOfSymbol(correspondingPropSymbol);
                // If there's no corresponding property with this name, error
                if (!correspondingPropType && isUnhyphenatedJsxName(node.name.text)) {
                    error(node.name, ts.Diagnostics.Property_0_does_not_exist_on_type_1, node.name.text, typeToString(elementAttributesType));
                    return unknownType;
                }
            }
            var exprType;
            if (node.initializer) {
                exprType = checkExpression(node.initializer);
            }
            else {
                // <Elem attr /> is sugar for <Elem attr={true} />
                exprType = booleanType;
            }
            if (correspondingPropType) {
                checkTypeAssignableTo(exprType, correspondingPropType, node);
            }
            nameTable[node.name.text] = true;
            return exprType;
        }
        function checkJsxSpreadAttribute(node, elementAttributesType, nameTable) {
            var type = checkExpression(node.expression);
            var props = getPropertiesOfType(type);
            for (var _i = 0; _i < props.length; _i++) {
                var prop = props[_i];
                // Is there a corresponding property in the element attributes type? Skip checking of properties
                // that have already been assigned to, as these are not actually pushed into the resulting type
                if (!nameTable[prop.name]) {
                    var targetPropSym = getPropertyOfType(elementAttributesType, prop.name);
                    if (targetPropSym) {
                        var msg = ts.chainDiagnosticMessages(undefined, ts.Diagnostics.Property_0_of_JSX_spread_attribute_is_not_assignable_to_target_property, prop.name);
                        checkTypeAssignableTo(getTypeOfSymbol(prop), getTypeOfSymbol(targetPropSym), node, undefined, msg);
                    }
                    nameTable[prop.name] = true;
                }
            }
            return type;
        }
        /// Returns the type JSX.IntrinsicElements. May return `unknownType` if that type is not present.
        function getJsxIntrinsicElementsType() {
            if (!jsxIntrinsicElementsType) {
                jsxIntrinsicElementsType = getExportedTypeFromNamespace(JsxNames.JSX, JsxNames.IntrinsicElements) || unknownType;
            }
            return jsxIntrinsicElementsType;
        }
        /// Given a JSX opening element or self-closing element, return the symbol of the property that the tag name points to if
        /// this is an intrinsic tag. This might be a named
        /// property of the IntrinsicElements interface, or its string indexer.
        /// If this is a class-based tag (otherwise returns undefined), returns the symbol of the class
        /// type or factory function.
        /// Otherwise, returns unknownSymbol.
        function getJsxElementTagSymbol(node) {
            var flags = 8 /* UnknownElement */;
            var links = getNodeLinks(node);
            if (!links.resolvedSymbol) {
                if (isJsxIntrinsicIdentifier(node.tagName)) {
                    links.resolvedSymbol = lookupIntrinsicTag(node);
                }
                else {
                    links.resolvedSymbol = lookupClassTag(node);
                }
            }
            return links.resolvedSymbol;
            function lookupIntrinsicTag(node) {
                var intrinsicElementsType = getJsxIntrinsicElementsType();
                if (intrinsicElementsType !== unknownType) {
                    // Property case
                    var intrinsicProp = getPropertyOfType(intrinsicElementsType, node.tagName.text);
                    if (intrinsicProp) {
                        links.jsxFlags |= 1 /* IntrinsicNamedElement */;
                        return intrinsicProp;
                    }
                    // Intrinsic string indexer case
                    var indexSignatureType = getIndexTypeOfType(intrinsicElementsType, 0 /* String */);
                    if (indexSignatureType) {
                        links.jsxFlags |= 2 /* IntrinsicIndexedElement */;
                        return intrinsicElementsType.symbol;
                    }
                    // Wasn't found
                    error(node, ts.Diagnostics.Property_0_does_not_exist_on_type_1, node.tagName.text, 'JSX.' + JsxNames.IntrinsicElements);
                    return unknownSymbol;
                }
                else {
                    if (compilerOptions.noImplicitAny) {
                        error(node, ts.Diagnostics.JSX_element_implicitly_has_type_any_because_no_interface_JSX_0_exists, JsxNames.IntrinsicElements);
                    }
                }
            }
            function lookupClassTag(node) {
                var valueSymbol;
                // Look up the value in the current scope
                if (node.tagName.kind === 66 /* Identifier */) {
                    valueSymbol = getResolvedSymbol(node.tagName);
                }
                else {
                    valueSymbol = checkQualifiedName(node.tagName).symbol;
                }
                if (valueSymbol !== unknownSymbol) {
                    links.jsxFlags |= 4 /* ClassElement */;
                }
                return valueSymbol || unknownSymbol;
            }
        }
        /**
         * Given a JSX element that is a class element, finds the Element Instance Type. If the
         * element is not a class element, or the class element type cannot be determined, returns 'undefined'.
         * For example, in the element <MyClass>, the element instance type is `MyClass` (not `typeof MyClass`).
         */
        function getJsxElementInstanceType(node) {
            if (!(getNodeLinks(node).jsxFlags & 4 /* ClassElement */)) {
                // There is no such thing as an instance type for a non-class element
                return undefined;
            }
            var classSymbol = getJsxElementTagSymbol(node);
            if (classSymbol === unknownSymbol) {
                // Couldn't find the class instance type. Error has already been issued
                return anyType;
            }
            var valueType = getTypeOfSymbol(classSymbol);
            if (isTypeAny(valueType)) {
                // Short-circuit if the class tag is using an element type 'any'
                return anyType;
            }
            // Resolve the signatures, preferring constructors
            var signatures = getSignaturesOfType(valueType, 1 /* Construct */);
            if (signatures.length === 0) {
                // No construct signatures, try call signatures
                signatures = getSignaturesOfType(valueType, 0 /* Call */);
                if (signatures.length === 0) {
                    // We found no signatures at all, which is an error
                    error(node.tagName, ts.Diagnostics.JSX_element_type_0_does_not_have_any_construct_or_call_signatures, ts.getTextOfNode(node.tagName));
                    return undefined;
                }
            }
            // Check that the constructor/factory returns an object type
            var returnType = getUnionType(signatures.map(function (s) { return getReturnTypeOfSignature(s); }));
            if (!isTypeAny(returnType) && !(returnType.flags & 48128 /* ObjectType */)) {
                error(node.tagName, ts.Diagnostics.The_return_type_of_a_JSX_element_constructor_must_return_an_object_type);
                return undefined;
            }
            // Issue an error if this return type isn't assignable to JSX.ElementClass
            var elemClassType = getJsxGlobalElementClassType();
            if (elemClassType) {
                checkTypeRelatedTo(returnType, elemClassType, assignableRelation, node, ts.Diagnostics.JSX_element_type_0_is_not_a_constructor_function_for_JSX_elements);
            }
            return returnType;
        }
        /// e.g. "props" for React.d.ts,
        /// or 'undefined' if ElementAttributesPropery doesn't exist (which means all
        ///     non-intrinsic elements' attributes type is 'any'),
        /// or '' if it has 0 properties (which means every
        ///     non-instrinsic elements' attributes type is the element instance type)
        function getJsxElementPropertiesName() {
            // JSX
            var jsxNamespace = getGlobalSymbol(JsxNames.JSX, 1536 /* Namespace */, undefined);
            // JSX.ElementAttributesProperty [symbol]
            var attribsPropTypeSym = jsxNamespace && getSymbol(jsxNamespace.exports, JsxNames.ElementAttributesPropertyNameContainer, 793056 /* Type */);
            // JSX.ElementAttributesProperty [type]
            var attribPropType = attribsPropTypeSym && getDeclaredTypeOfSymbol(attribsPropTypeSym);
            // The properites of JSX.ElementAttributesProperty
            var attribProperties = attribPropType && getPropertiesOfType(attribPropType);
            if (attribProperties) {
                // Element Attributes has zero properties, so the element attributes type will be the class instance type
                if (attribProperties.length === 0) {
                    return "";
                }
                else if (attribProperties.length === 1) {
                    return attribProperties[0].name;
                }
                else {
                    error(attribsPropTypeSym.declarations[0], ts.Diagnostics.The_global_type_JSX_0_may_not_have_more_than_one_property, JsxNames.ElementAttributesPropertyNameContainer);
                    return undefined;
                }
            }
            else {
                // No interface exists, so the element attributes type will be an implicit any
                return undefined;
            }
        }
        /**
         * Given an opening/self-closing element, get the 'element attributes type', i.e. the type that tells
         * us which attributes are valid on a given element.
         */
        function getJsxElementAttributesType(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedJsxType) {
                var sym = getJsxElementTagSymbol(node);
                if (links.jsxFlags & 4 /* ClassElement */) {
                    var elemInstanceType = getJsxElementInstanceType(node);
                    if (isTypeAny(elemInstanceType)) {
                        return links.resolvedJsxType = anyType;
                    }
                    var propsName = getJsxElementPropertiesName();
                    if (propsName === undefined) {
                        // There is no type ElementAttributesProperty, return 'any'
                        return links.resolvedJsxType = anyType;
                    }
                    else if (propsName === "") {
                        // If there is no e.g. 'props' member in ElementAttributesProperty, use the element class type instead
                        return links.resolvedJsxType = elemInstanceType;
                    }
                    else {
                        var attributesType = getTypeOfPropertyOfType(elemInstanceType, propsName);
                        if (!attributesType) {
                            // There is no property named 'props' on this instance type
                            return links.resolvedJsxType = emptyObjectType;
                        }
                        else if (isTypeAny(attributesType) || (attributesType === unknownType)) {
                            return links.resolvedJsxType = attributesType;
                        }
                        else if (!(attributesType.flags & 48128 /* ObjectType */)) {
                            error(node.tagName, ts.Diagnostics.JSX_element_attributes_type_0_must_be_an_object_type, typeToString(attributesType));
                            return links.resolvedJsxType = anyType;
                        }
                        else {
                            return links.resolvedJsxType = attributesType;
                        }
                    }
                }
                else if (links.jsxFlags & 1 /* IntrinsicNamedElement */) {
                    return links.resolvedJsxType = getTypeOfSymbol(sym);
                }
                else if (links.jsxFlags & 2 /* IntrinsicIndexedElement */) {
                    return links.resolvedJsxType = getIndexTypeOfSymbol(sym, 0 /* String */);
                }
                else {
                    // Resolution failed, so we don't know
                    return links.resolvedJsxType = anyType;
                }
            }
            return links.resolvedJsxType;
        }
        /**
         * Given a JSX attribute, returns the symbol for the corresponds property
         * of the element attributes type. Will return unknownSymbol for attributes
         * that have no matching element attributes type property.
         */
        function getJsxAttributePropertySymbol(attrib) {
            var attributesType = getJsxElementAttributesType(attrib.parent);
            var prop = getPropertyOfType(attributesType, attrib.name.text);
            return prop || unknownSymbol;
        }
        var jsxElementClassType = undefined;
        function getJsxGlobalElementClassType() {
            if (!jsxElementClassType) {
                jsxElementClassType = getExportedTypeFromNamespace(JsxNames.JSX, JsxNames.ElementClass);
            }
            return jsxElementClassType;
        }
        /// Returns all the properties of the Jsx.IntrinsicElements interface
        function getJsxIntrinsicTagNames() {
            var intrinsics = getJsxIntrinsicElementsType();
            return intrinsics ? getPropertiesOfType(intrinsics) : emptyArray;
        }
        function checkJsxPreconditions(errorNode) {
            // Preconditions for using JSX
            if ((compilerOptions.jsx || 0 /* None */) === 0 /* None */) {
                error(errorNode, ts.Diagnostics.Cannot_use_JSX_unless_the_jsx_flag_is_provided);
            }
            if (jsxElementType === undefined) {
                if (compilerOptions.noImplicitAny) {
                    error(errorNode, ts.Diagnostics.JSX_element_implicitly_has_type_any_because_the_global_type_JSX_Element_does_not_exist);
                }
            }
        }
        function checkJsxOpeningLikeElement(node) {
            checkGrammarJsxElement(node);
            checkJsxPreconditions(node);
            var targetAttributesType = getJsxElementAttributesType(node);
            if (getNodeLinks(node).jsxFlags & 4 /* ClassElement */) {
                if (node.tagName.kind === 66 /* Identifier */) {
                    checkIdentifier(node.tagName);
                }
                else {
                    checkQualifiedName(node.tagName);
                }
            }
            var nameTable = {};
            // Process this array in right-to-left order so we know which
            // attributes (mostly from spreads) are being overwritten and
            // thus should have their types ignored
            var sawSpreadedAny = false;
            for (var i = node.attributes.length - 1; i >= 0; i--) {
                if (node.attributes[i].kind === 233 /* JsxAttribute */) {
                    checkJsxAttribute((node.attributes[i]), targetAttributesType, nameTable);
                }
                else {
                    ts.Debug.assert(node.attributes[i].kind === 234 /* JsxSpreadAttribute */);
                    var spreadType = checkJsxSpreadAttribute((node.attributes[i]), targetAttributesType, nameTable);
                    if (isTypeAny(spreadType)) {
                        sawSpreadedAny = true;
                    }
                }
            }
            // Check that all required properties have been provided. If an 'any'
            // was spreaded in, though, assume that it provided all required properties
            if (targetAttributesType && !sawSpreadedAny) {
                var targetProperties = getPropertiesOfType(targetAttributesType);
                for (var i = 0; i < targetProperties.length; i++) {
                    if (!(targetProperties[i].flags & 536870912 /* Optional */) &&
                        nameTable[targetProperties[i].name] === undefined) {
                        error(node, ts.Diagnostics.Property_0_is_missing_in_type_1, targetProperties[i].name, typeToString(targetAttributesType));
                    }
                }
            }
        }
        function checkJsxExpression(node) {
            if (node.expression) {
                return checkExpression(node.expression);
            }
            else {
                return unknownType;
            }
        }
        // If a symbol is a synthesized symbol with no value declaration, we assume it is a property. Example of this are the synthesized
        // '.prototype' property as well as synthesized tuple index properties.
        function getDeclarationKindFromSymbol(s) {
            return s.valueDeclaration ? s.valueDeclaration.kind : 137 /* PropertyDeclaration */;
        }
        function getDeclarationFlagsFromSymbol(s) {
            return s.valueDeclaration ? ts.getCombinedNodeFlags(s.valueDeclaration) : s.flags & 134217728 /* Prototype */ ? 16 /* Public */ | 128 /* Static */ : 0;
        }
        function checkClassPropertyAccess(node, left, type, prop) {
            var flags = getDeclarationFlagsFromSymbol(prop);
            // Public properties are always accessible
            if (!(flags & (32 /* Private */ | 64 /* Protected */))) {
                return;
            }
            // Property is known to be private or protected at this point
            // Get the declaring and enclosing class instance types
            var enclosingClassDeclaration = ts.getContainingClass(node);
            var enclosingClass = enclosingClassDeclaration ? getDeclaredTypeOfSymbol(getSymbolOfNode(enclosingClassDeclaration)) : undefined;
            var declaringClass = getDeclaredTypeOfSymbol(prop.parent);
            // Private property is accessible if declaring and enclosing class are the same
            if (flags & 32 /* Private */) {
                if (declaringClass !== enclosingClass) {
                    error(node, ts.Diagnostics.Property_0_is_private_and_only_accessible_within_class_1, symbolToString(prop), typeToString(declaringClass));
                }
                return;
            }
            // Property is known to be protected at this point
            // All protected properties of a supertype are accessible in a super access
            if (left.kind === 92 /* SuperKeyword */) {
                return;
            }
            // A protected property is accessible in the declaring class and classes derived from it
            if (!enclosingClass || !hasBaseType(enclosingClass, declaringClass)) {
                error(node, ts.Diagnostics.Property_0_is_protected_and_only_accessible_within_class_1_and_its_subclasses, symbolToString(prop), typeToString(declaringClass));
                return;
            }
            // No further restrictions for static properties
            if (flags & 128 /* Static */) {
                return;
            }
            // An instance property must be accessed through an instance of the enclosing class
            if (!(getTargetType(type).flags & (1024 /* Class */ | 2048 /* Interface */) && hasBaseType(type, enclosingClass))) {
                error(node, ts.Diagnostics.Property_0_is_protected_and_only_accessible_through_an_instance_of_class_1, symbolToString(prop), typeToString(enclosingClass));
            }
        }
        function checkPropertyAccessExpression(node) {
            return checkPropertyAccessExpressionOrQualifiedName(node, node.expression, node.name);
        }
        function checkQualifiedName(node) {
            return checkPropertyAccessExpressionOrQualifiedName(node, node.left, node.right);
        }
        function checkPropertyAccessExpressionOrQualifiedName(node, left, right) {
            var type = checkExpression(left);
            if (isTypeAny(type)) {
                return type;
            }
            var apparentType = getApparentType(getWidenedType(type));
            if (apparentType === unknownType) {
                // handle cases when type is Type parameter with invalid constraint
                return unknownType;
            }
            var prop = getPropertyOfType(apparentType, right.text);
            if (!prop) {
                if (right.text) {
                    error(right, ts.Diagnostics.Property_0_does_not_exist_on_type_1, ts.declarationNameToString(right), typeToString(type));
                }
                return unknownType;
            }
            getNodeLinks(node).resolvedSymbol = prop;
            if (prop.parent && prop.parent.flags & 32 /* Class */) {
                // TS 1.0 spec (April 2014): 4.8.2
                // - In a constructor, instance member function, instance member accessor, or
                //   instance member variable initializer where this references a derived class instance,
                //   a super property access is permitted and must specify a public instance member function of the base class.
                // - In a static member function or static member accessor
                //   where this references the constructor function object of a derived class,
                //   a super property access is permitted and must specify a public static member function of the base class.
                if (left.kind === 92 /* SuperKeyword */ && getDeclarationKindFromSymbol(prop) !== 139 /* MethodDeclaration */) {
                    error(right, ts.Diagnostics.Only_public_and_protected_methods_of_the_base_class_are_accessible_via_the_super_keyword);
                }
                else {
                    checkClassPropertyAccess(node, left, type, prop);
                }
            }
            return getTypeOfSymbol(prop);
        }
        function isValidPropertyAccess(node, propertyName) {
            var left = node.kind === 161 /* PropertyAccessExpression */
                ? node.expression
                : node.left;
            var type = checkExpression(left);
            if (type !== unknownType && !isTypeAny(type)) {
                var prop = getPropertyOfType(getWidenedType(type), propertyName);
                if (prop && prop.parent && prop.parent.flags & 32 /* Class */) {
                    if (left.kind === 92 /* SuperKeyword */ && getDeclarationKindFromSymbol(prop) !== 139 /* MethodDeclaration */) {
                        return false;
                    }
                    else {
                        var modificationCount = diagnostics.getModificationCount();
                        checkClassPropertyAccess(node, left, type, prop);
                        return diagnostics.getModificationCount() === modificationCount;
                    }
                }
            }
            return true;
        }
        function checkIndexedAccess(node) {
            // Grammar checking
            if (!node.argumentExpression) {
                var sourceFile = getSourceFile(node);
                if (node.parent.kind === 164 /* NewExpression */ && node.parent.expression === node) {
                    var start = ts.skipTrivia(sourceFile.text, node.expression.end);
                    var end = node.end;
                    grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.new_T_cannot_be_used_to_create_an_array_Use_new_Array_T_instead);
                }
                else {
                    var start = node.end - "]".length;
                    var end = node.end;
                    grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Expression_expected);
                }
            }
            // Obtain base constraint such that we can bail out if the constraint is an unknown type
            var objectType = getApparentType(checkExpression(node.expression));
            var indexType = node.argumentExpression ? checkExpression(node.argumentExpression) : unknownType;
            if (objectType === unknownType) {
                return unknownType;
            }
            var isConstEnum = isConstEnumObjectType(objectType);
            if (isConstEnum &&
                (!node.argumentExpression || node.argumentExpression.kind !== 8 /* StringLiteral */)) {
                error(node.argumentExpression, ts.Diagnostics.A_const_enum_member_can_only_be_accessed_using_a_string_literal);
                return unknownType;
            }
            // TypeScript 1.0 spec (April 2014): 4.10 Property Access
            // - If IndexExpr is a string literal or a numeric literal and ObjExpr's apparent type has a property with the name
            //    given by that literal(converted to its string representation in the case of a numeric literal), the property access is of the type of that property.
            // - Otherwise, if ObjExpr's apparent type has a numeric index signature and IndexExpr is of type Any, the Number primitive type, or an enum type,
            //    the property access is of the type of that index signature.
            // - Otherwise, if ObjExpr's apparent type has a string index signature and IndexExpr is of type Any, the String or Number primitive type, or an enum type,
            //    the property access is of the type of that index signature.
            // - Otherwise, if IndexExpr is of type Any, the String or Number primitive type, or an enum type, the property access is of type Any.
            // See if we can index as a property.
            if (node.argumentExpression) {
                var name_3 = getPropertyNameForIndexedAccess(node.argumentExpression, indexType);
                if (name_3 !== undefined) {
                    var prop = getPropertyOfType(objectType, name_3);
                    if (prop) {
                        getNodeLinks(node).resolvedSymbol = prop;
                        return getTypeOfSymbol(prop);
                    }
                    else if (isConstEnum) {
                        error(node.argumentExpression, ts.Diagnostics.Property_0_does_not_exist_on_const_enum_1, name_3, symbolToString(objectType.symbol));
                        return unknownType;
                    }
                }
            }
            // Check for compatible indexer types.
            if (isTypeAnyOrAllConstituentTypesHaveKind(indexType, 258 /* StringLike */ | 132 /* NumberLike */ | 2097152 /* ESSymbol */)) {
                // Try to use a number indexer.
                if (isTypeAnyOrAllConstituentTypesHaveKind(indexType, 132 /* NumberLike */)) {
                    var numberIndexType = getIndexTypeOfType(objectType, 1 /* Number */);
                    if (numberIndexType) {
                        return numberIndexType;
                    }
                }
                // Try to use string indexing.
                var stringIndexType = getIndexTypeOfType(objectType, 0 /* String */);
                if (stringIndexType) {
                    return stringIndexType;
                }
                // Fall back to any.
                if (compilerOptions.noImplicitAny && !compilerOptions.suppressImplicitAnyIndexErrors && !isTypeAny(objectType)) {
                    error(node, ts.Diagnostics.Index_signature_of_object_type_implicitly_has_an_any_type);
                }
                return anyType;
            }
            // REVIEW: Users should know the type that was actually used.
            error(node, ts.Diagnostics.An_index_expression_argument_must_be_of_type_string_number_symbol_or_any);
            return unknownType;
        }
        /**
         * If indexArgumentExpression is a string literal or number literal, returns its text.
         * If indexArgumentExpression is a well known symbol, returns the property name corresponding
         *    to this symbol, as long as it is a proper symbol reference.
         * Otherwise, returns undefined.
         */
        function getPropertyNameForIndexedAccess(indexArgumentExpression, indexArgumentType) {
            if (indexArgumentExpression.kind === 8 /* StringLiteral */ || indexArgumentExpression.kind === 7 /* NumericLiteral */) {
                return indexArgumentExpression.text;
            }
            if (checkThatExpressionIsProperSymbolReference(indexArgumentExpression, indexArgumentType, false)) {
                var rightHandSideName = indexArgumentExpression.name.text;
                return ts.getPropertyNameForKnownSymbolName(rightHandSideName);
            }
            return undefined;
        }
        /**
         * A proper symbol reference requires the following:
         *   1. The property access denotes a property that exists
         *   2. The expression is of the form Symbol.<identifier>
         *   3. The property access is of the primitive type symbol.
         *   4. Symbol in this context resolves to the global Symbol object
         */
        function checkThatExpressionIsProperSymbolReference(expression, expressionType, reportError) {
            if (expressionType === unknownType) {
                // There is already an error, so no need to report one.
                return false;
            }
            if (!ts.isWellKnownSymbolSyntactically(expression)) {
                return false;
            }
            // Make sure the property type is the primitive symbol type
            if ((expressionType.flags & 2097152 /* ESSymbol */) === 0) {
                if (reportError) {
                    error(expression, ts.Diagnostics.A_computed_property_name_of_the_form_0_must_be_of_type_symbol, ts.getTextOfNode(expression));
                }
                return false;
            }
            // The name is Symbol.<someName>, so make sure Symbol actually resolves to the
            // global Symbol object
            var leftHandSide = expression.expression;
            var leftHandSideSymbol = getResolvedSymbol(leftHandSide);
            if (!leftHandSideSymbol) {
                return false;
            }
            var globalESSymbol = getGlobalESSymbolConstructorSymbol();
            if (!globalESSymbol) {
                // Already errored when we tried to look up the symbol
                return false;
            }
            if (leftHandSideSymbol !== globalESSymbol) {
                if (reportError) {
                    error(leftHandSide, ts.Diagnostics.Symbol_reference_does_not_refer_to_the_global_Symbol_constructor_object);
                }
                return false;
            }
            return true;
        }
        function resolveUntypedCall(node) {
            if (node.kind === 165 /* TaggedTemplateExpression */) {
                checkExpression(node.template);
            }
            else if (node.kind !== 135 /* Decorator */) {
                ts.forEach(node.arguments, function (argument) {
                    checkExpression(argument);
                });
            }
            return anySignature;
        }
        function resolveErrorCall(node) {
            resolveUntypedCall(node);
            return unknownSignature;
        }
        // Re-order candidate signatures into the result array. Assumes the result array to be empty.
        // The candidate list orders groups in reverse, but within a group signatures are kept in declaration order
        // A nit here is that we reorder only signatures that belong to the same symbol,
        // so order how inherited signatures are processed is still preserved.
        // interface A { (x: string): void }
        // interface B extends A { (x: 'foo'): string }
        // let b: B;
        // b('foo') // <- here overloads should be processed as [(x:'foo'): string, (x: string): void]
        function reorderCandidates(signatures, result) {
            var lastParent;
            var lastSymbol;
            var cutoffIndex = 0;
            var index;
            var specializedIndex = -1;
            var spliceIndex;
            ts.Debug.assert(!result.length);
            for (var _i = 0; _i < signatures.length; _i++) {
                var signature = signatures[_i];
                var symbol = signature.declaration && getSymbolOfNode(signature.declaration);
                var parent_4 = signature.declaration && signature.declaration.parent;
                if (!lastSymbol || symbol === lastSymbol) {
                    if (lastParent && parent_4 === lastParent) {
                        index++;
                    }
                    else {
                        lastParent = parent_4;
                        index = cutoffIndex;
                    }
                }
                else {
                    // current declaration belongs to a different symbol
                    // set cutoffIndex so re-orderings in the future won't change result set from 0 to cutoffIndex
                    index = cutoffIndex = result.length;
                    lastParent = parent_4;
                }
                lastSymbol = symbol;
                // specialized signatures always need to be placed before non-specialized signatures regardless
                // of the cutoff position; see GH#1133
                if (signature.hasStringLiterals) {
                    specializedIndex++;
                    spliceIndex = specializedIndex;
                    // The cutoff index always needs to be greater than or equal to the specialized signature index
                    // in order to prevent non-specialized signatures from being added before a specialized
                    // signature.
                    cutoffIndex++;
                }
                else {
                    spliceIndex = index;
                }
                result.splice(spliceIndex, 0, signature);
            }
        }
        function getSpreadArgumentIndex(args) {
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (arg && arg.kind === 180 /* SpreadElementExpression */) {
                    return i;
                }
            }
            return -1;
        }
        function hasCorrectArity(node, args, signature) {
            var adjustedArgCount; // Apparent number of arguments we will have in this call
            var typeArguments; // Type arguments (undefined if none)
            var callIsIncomplete; // In incomplete call we want to be lenient when we have too few arguments
            var isDecorator;
            var spreadArgIndex = -1;
            if (node.kind === 165 /* TaggedTemplateExpression */) {
                var tagExpression = node;
                // Even if the call is incomplete, we'll have a missing expression as our last argument,
                // so we can say the count is just the arg list length
                adjustedArgCount = args.length;
                typeArguments = undefined;
                if (tagExpression.template.kind === 178 /* TemplateExpression */) {
                    // If a tagged template expression lacks a tail literal, the call is incomplete.
                    // Specifically, a template only can end in a TemplateTail or a Missing literal.
                    var templateExpression = tagExpression.template;
                    var lastSpan = ts.lastOrUndefined(templateExpression.templateSpans);
                    ts.Debug.assert(lastSpan !== undefined); // we should always have at least one span.
                    callIsIncomplete = ts.nodeIsMissing(lastSpan.literal) || !!lastSpan.literal.isUnterminated;
                }
                else {
                    // If the template didn't end in a backtick, or its beginning occurred right prior to EOF,
                    // then this might actually turn out to be a TemplateHead in the future;
                    // so we consider the call to be incomplete.
                    var templateLiteral = tagExpression.template;
                    ts.Debug.assert(templateLiteral.kind === 10 /* NoSubstitutionTemplateLiteral */);
                    callIsIncomplete = !!templateLiteral.isUnterminated;
                }
            }
            else if (node.kind === 135 /* Decorator */) {
                isDecorator = true;
                typeArguments = undefined;
                adjustedArgCount = getEffectiveArgumentCount(node, undefined, signature);
            }
            else {
                var callExpression = node;
                if (!callExpression.arguments) {
                    // This only happens when we have something of the form: 'new C'
                    ts.Debug.assert(callExpression.kind === 164 /* NewExpression */);
                    return signature.minArgumentCount === 0;
                }
                // For IDE scenarios we may have an incomplete call, so a trailing comma is tantamount to adding another argument.
                adjustedArgCount = callExpression.arguments.hasTrailingComma ? args.length + 1 : args.length;
                // If we are missing the close paren, the call is incomplete.
                callIsIncomplete = callExpression.arguments.end === callExpression.end;
                typeArguments = callExpression.typeArguments;
                spreadArgIndex = getSpreadArgumentIndex(args);
            }
            // If the user supplied type arguments, but the number of type arguments does not match
            // the declared number of type parameters, the call has an incorrect arity.
            var hasRightNumberOfTypeArgs = !typeArguments ||
                (signature.typeParameters && typeArguments.length === signature.typeParameters.length);
            if (!hasRightNumberOfTypeArgs) {
                return false;
            }
            // If spread arguments are present, check that they correspond to a rest parameter. If so, no
            // further checking is necessary.
            if (spreadArgIndex >= 0) {
                return signature.hasRestParameter && spreadArgIndex >= signature.parameters.length - 1;
            }
            // Too many arguments implies incorrect arity.
            if (!signature.hasRestParameter && adjustedArgCount > signature.parameters.length) {
                return false;
            }
            // If the call is incomplete, we should skip the lower bound check.
            var hasEnoughArguments = adjustedArgCount >= signature.minArgumentCount;
            return callIsIncomplete || hasEnoughArguments;
        }
        // If type has a single call signature and no other members, return that signature. Otherwise, return undefined.
        function getSingleCallSignature(type) {
            if (type.flags & 48128 /* ObjectType */) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (resolved.callSignatures.length === 1 && resolved.constructSignatures.length === 0 &&
                    resolved.properties.length === 0 && !resolved.stringIndexType && !resolved.numberIndexType) {
                    return resolved.callSignatures[0];
                }
            }
            return undefined;
        }
        // Instantiate a generic signature in the context of a non-generic signature (section 3.8.5 in TypeScript spec)
        function instantiateSignatureInContextOf(signature, contextualSignature, contextualMapper) {
            var context = createInferenceContext(signature.typeParameters, true);
            forEachMatchingParameterType(contextualSignature, signature, function (source, target) {
                // Type parameters from outer context referenced by source type are fixed by instantiation of the source type
                inferTypes(context, instantiateType(source, contextualMapper), target);
            });
            return getSignatureInstantiation(signature, getInferredTypes(context));
        }
        function inferTypeArguments(node, signature, args, excludeArgument, context) {
            var typeParameters = signature.typeParameters;
            var inferenceMapper = createInferenceMapper(context);
            // Clear out all the inference results from the last time inferTypeArguments was called on this context
            for (var i = 0; i < typeParameters.length; i++) {
                // As an optimization, we don't have to clear (and later recompute) inferred types
                // for type parameters that have already been fixed on the previous call to inferTypeArguments.
                // It would be just as correct to reset all of them. But then we'd be repeating the same work
                // for the type parameters that were fixed, namely the work done by getInferredType.
                if (!context.inferences[i].isFixed) {
                    context.inferredTypes[i] = undefined;
                }
            }
            // On this call to inferTypeArguments, we may get more inferences for certain type parameters that were not
            // fixed last time. This means that a type parameter that failed inference last time may succeed this time,
            // or vice versa. Therefore, the failedTypeParameterIndex is useless if it points to an unfixed type parameter,
            // because it may change. So here we reset it. However, getInferredType will not revisit any type parameters
            // that were previously fixed. So if a fixed type parameter failed previously, it will fail again because
            // it will contain the exact same set of inferences. So if we reset the index from a fixed type parameter,
            // we will lose information that we won't recover this time around.
            if (context.failedTypeParameterIndex !== undefined && !context.inferences[context.failedTypeParameterIndex].isFixed) {
                context.failedTypeParameterIndex = undefined;
            }
            // We perform two passes over the arguments. In the first pass we infer from all arguments, but use
            // wildcards for all context sensitive function expressions.
            var argCount = getEffectiveArgumentCount(node, args, signature);
            for (var i = 0; i < argCount; i++) {
                var arg = getEffectiveArgument(node, args, i);
                // If the effective argument is 'undefined', then it is an argument that is present but is synthetic.
                if (arg === undefined || arg.kind !== 182 /* OmittedExpression */) {
                    var paramType = getTypeAtPosition(signature, i);
                    var argType = getEffectiveArgumentType(node, i, arg);
                    // If the effective argument type is 'undefined', there is no synthetic type 
                    // for the argument. In that case, we should check the argument.
                    if (argType === undefined) {
                        // For context sensitive arguments we pass the identityMapper, which is a signal to treat all
                        // context sensitive function expressions as wildcards
                        var mapper = excludeArgument && excludeArgument[i] !== undefined ? identityMapper : inferenceMapper;
                        argType = checkExpressionWithContextualType(arg, paramType, mapper);
                    }
                    inferTypes(context, argType, paramType);
                }
            }
            // In the second pass we visit only context sensitive arguments, and only those that aren't excluded, this
            // time treating function expressions normally (which may cause previously inferred type arguments to be fixed
            // as we construct types for contextually typed parameters)
            // Decorators will not have `excludeArgument`, as their arguments cannot be contextually typed.
            // Tagged template expressions will always have `undefined` for `excludeArgument[0]`.
            if (excludeArgument) {
                for (var i = 0; i < argCount; i++) {
                    // No need to check for omitted args and template expressions, their exlusion value is always undefined
                    if (excludeArgument[i] === false) {
                        var arg = args[i];
                        var paramType = getTypeAtPosition(signature, i);
                        inferTypes(context, checkExpressionWithContextualType(arg, paramType, inferenceMapper), paramType);
                    }
                }
            }
            getInferredTypes(context);
        }
        function checkTypeArguments(signature, typeArguments, typeArgumentResultTypes, reportErrors, headMessage) {
            var typeParameters = signature.typeParameters;
            var typeArgumentsAreAssignable = true;
            for (var i = 0; i < typeParameters.length; i++) {
                var typeArgNode = typeArguments[i];
                var typeArgument = getTypeFromTypeNode(typeArgNode);
                // Do not push on this array! It has a preallocated length
                typeArgumentResultTypes[i] = typeArgument;
                if (typeArgumentsAreAssignable /* so far */) {
                    var constraint = getConstraintOfTypeParameter(typeParameters[i]);
                    if (constraint) {
                        var errorInfo = void 0;
                        var typeArgumentHeadMessage = ts.Diagnostics.Type_0_does_not_satisfy_the_constraint_1;
                        if (reportErrors && headMessage) {
                            errorInfo = ts.chainDiagnosticMessages(errorInfo, typeArgumentHeadMessage);
                            typeArgumentHeadMessage = headMessage;
                        }
                        typeArgumentsAreAssignable = checkTypeAssignableTo(typeArgument, constraint, reportErrors ? typeArgNode : undefined, typeArgumentHeadMessage, errorInfo);
                    }
                }
            }
            return typeArgumentsAreAssignable;
        }
        function checkApplicableSignature(node, args, signature, relation, excludeArgument, reportErrors) {
            var argCount = getEffectiveArgumentCount(node, args, signature);
            for (var i = 0; i < argCount; i++) {
                var arg = getEffectiveArgument(node, args, i);
                // If the effective argument is 'undefined', then it is an argument that is present but is synthetic.
                if (arg === undefined || arg.kind !== 182 /* OmittedExpression */) {
                    // Check spread elements against rest type (from arity check we know spread argument corresponds to a rest parameter)
                    var paramType = getTypeAtPosition(signature, i);
                    var argType = getEffectiveArgumentType(node, i, arg);
                    // If the effective argument type is 'undefined', there is no synthetic type 
                    // for the argument. In that case, we should check the argument.
                    if (argType === undefined) {
                        argType = arg.kind === 8 /* StringLiteral */ && !reportErrors
                            ? getStringLiteralType(arg)
                            : checkExpressionWithContextualType(arg, paramType, excludeArgument && excludeArgument[i] ? identityMapper : undefined);
                    }
                    // Use argument expression as error location when reporting errors
                    var errorNode = reportErrors ? getEffectiveArgumentErrorNode(node, i, arg) : undefined;
                    var headMessage = ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1;
                    if (!checkTypeRelatedTo(argType, paramType, relation, errorNode, headMessage)) {
                        return false;
                    }
                }
            }
            return true;
        }
        /**
         * Returns the effective arguments for an expression that works like a function invocation.
         *
         * If 'node' is a CallExpression or a NewExpression, then its argument list is returned.
         * If 'node' is a TaggedTemplateExpression, a new argument list is constructed from the substitution
         *    expressions, where the first element of the list is `undefined`.
         * If 'node' is a Decorator, the argument list will be `undefined`, and its arguments and types
         *    will be supplied from calls to `getEffectiveArgumentCount` and `getEffectiveArgumentType`.
         */
        function getEffectiveCallArguments(node) {
            var args;
            if (node.kind === 165 /* TaggedTemplateExpression */) {
                var template = node.template;
                args = [undefined];
                if (template.kind === 178 /* TemplateExpression */) {
                    ts.forEach(template.templateSpans, function (span) {
                        args.push(span.expression);
                    });
                }
            }
            else if (node.kind === 135 /* Decorator */) {
                // For a decorator, we return undefined as we will determine
                // the number and types of arguments for a decorator using
                // `getEffectiveArgumentCount` and `getEffectiveArgumentType` below.
                return undefined;
            }
            else {
                args = node.arguments || emptyArray;
            }
            return args;
        }
        /**
          * Returns the effective argument count for a node that works like a function invocation.
          * If 'node' is a Decorator, the number of arguments is derived from the decoration
          *    target and the signature:
          *    If 'node.target' is a class declaration or class expression, the effective argument
          *       count is 1.
          *    If 'node.target' is a parameter declaration, the effective argument count is 3.
          *    If 'node.target' is a property declaration, the effective argument count is 2.
          *    If 'node.target' is a method or accessor declaration, the effective argument count
          *       is 3, although it can be 2 if the signature only accepts two arguments, allowing
          *       us to match a property decorator.
          * Otherwise, the argument count is the length of the 'args' array.
          */
        function getEffectiveArgumentCount(node, args, signature) {
            if (node.kind === 135 /* Decorator */) {
                switch (node.parent.kind) {
                    case 209 /* ClassDeclaration */:
                    case 181 /* ClassExpression */:
                        // A class decorator will have one argument (see `ClassDecorator` in core.d.ts)
                        return 1;
                    case 137 /* PropertyDeclaration */:
                        // A property declaration decorator will have two arguments (see 
                        // `PropertyDecorator` in core.d.ts)
                        return 2;
                    case 139 /* MethodDeclaration */:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                        // A method or accessor declaration decorator will have two or three arguments (see
                        // `PropertyDecorator` and `MethodDecorator` in core.d.ts)
                        // If the method decorator signature only accepts a target and a key, we will only  
                        // type check those arguments.
                        return signature.parameters.length >= 3 ? 3 : 2;
                    case 134 /* Parameter */:
                        // A parameter declaration decorator will have three arguments (see 
                        // `ParameterDecorator` in core.d.ts)
                        return 3;
                }
            }
            else {
                return args.length;
            }
        }
        /**
          * Returns the effective type of the first argument to a decorator.
          * If 'node' is a class declaration or class expression, the effective argument type
          *    is the type of the static side of the class.
          * If 'node' is a parameter declaration, the effective argument type is either the type
          *    of the static or instance side of the class for the parameter's parent method,
          *    depending on whether the method is declared static.
          *    For a constructor, the type is always the type of the static side of the class.
          * If 'node' is a property, method, or accessor declaration, the effective argument
          *    type is the type of the static or instance side of the parent class for class
          *    element, depending on whether the element is declared static.
          */
        function getEffectiveDecoratorFirstArgumentType(node) {
            // The first argument to a decorator is its `target`.
            switch (node.kind) {
                case 209 /* ClassDeclaration */:
                case 181 /* ClassExpression */:
                    // For a class decorator, the `target` is the type of the class (e.g. the 
                    // "static" or "constructor" side of the class)
                    var classSymbol = getSymbolOfNode(node);
                    return getTypeOfSymbol(classSymbol);
                case 134 /* Parameter */:
                    // For a parameter decorator, the `target` is the parent type of the 
                    // parameter's containing method. 
                    node = node.parent;
                    if (node.kind === 140 /* Constructor */) {
                        var classSymbol_1 = getSymbolOfNode(node);
                        return getTypeOfSymbol(classSymbol_1);
                    }
                // fall-through
                case 137 /* PropertyDeclaration */:
                case 139 /* MethodDeclaration */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    // For a property or method decorator, the `target` is the
                    // "static"-side type of the parent of the member if the member is
                    // declared "static"; otherwise, it is the "instance"-side type of the 
                    // parent of the member.
                    return getParentTypeOfClassElement(node);
                default:
                    ts.Debug.fail("Unsupported decorator target.");
                    return unknownType;
            }
        }
        /**
          * Returns the effective type for the second argument to a decorator.
          * If 'node' is a parameter, its effective argument type is one of the following:
          *    If 'node.parent' is a constructor, the effective argument type is 'any', as we
          *       will emit `undefined`.
          *    If 'node.parent' is a member with an identifier, numeric, or string literal name,
          *       the effective argument type will be a string literal type for the member name.
          *    If 'node.parent' is a computed property name, the effective argument type will
          *       either be a symbol type or the string type.
          * If 'node' is a member with an identifier, numeric, or string literal name, the
          *    effective argument type will be a string literal type for the member name.
          * If 'node' is a computed property name, the effective argument type will either
          *    be a symbol type or the string type.
          * A class decorator does not have a second argument type.
          */
        function getEffectiveDecoratorSecondArgumentType(node) {
            // The second argument to a decorator is its `propertyKey`
            switch (node.kind) {
                case 209 /* ClassDeclaration */:
                    ts.Debug.fail("Class decorators should not have a second synthetic argument.");
                    return unknownType;
                case 134 /* Parameter */:
                    node = node.parent;
                    if (node.kind === 140 /* Constructor */) {
                        // For a constructor parameter decorator, the `propertyKey` will be `undefined`.
                        return anyType;
                    }
                // For a non-constructor parameter decorator, the `propertyKey` will be either
                // a string or a symbol, based on the name of the parameter's containing method.
                // fall-through
                case 137 /* PropertyDeclaration */:
                case 139 /* MethodDeclaration */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    // The `propertyKey` for a property or method decorator will be a
                    // string literal type if the member name is an identifier, number, or string; 
                    // otherwise, if the member name is a computed property name it will
                    // be either string or symbol.
                    var element = node;
                    switch (element.name.kind) {
                        case 66 /* Identifier */:
                        case 7 /* NumericLiteral */:
                        case 8 /* StringLiteral */:
                            return getStringLiteralType(element.name);
                        case 132 /* ComputedPropertyName */:
                            var nameType = checkComputedPropertyName(element.name);
                            if (allConstituentTypesHaveKind(nameType, 2097152 /* ESSymbol */)) {
                                return nameType;
                            }
                            else {
                                return stringType;
                            }
                        default:
                            ts.Debug.fail("Unsupported property name.");
                            return unknownType;
                    }
                default:
                    ts.Debug.fail("Unsupported decorator target.");
                    return unknownType;
            }
        }
        /**
          * Returns the effective argument type for the third argument to a decorator.
          * If 'node' is a parameter, the effective argument type is the number type.
          * If 'node' is a method or accessor, the effective argument type is a
          *    `TypedPropertyDescriptor<T>` instantiated with the type of the member.
          * Class and property decorators do not have a third effective argument.
          */
        function getEffectiveDecoratorThirdArgumentType(node) {
            // The third argument to a decorator is either its `descriptor` for a method decorator
            // or its `parameterIndex` for a paramter decorator
            switch (node.kind) {
                case 209 /* ClassDeclaration */:
                    ts.Debug.fail("Class decorators should not have a third synthetic argument.");
                    return unknownType;
                case 134 /* Parameter */:
                    // The `parameterIndex` for a parameter decorator is always a number
                    return numberType;
                case 137 /* PropertyDeclaration */:
                    ts.Debug.fail("Property decorators should not have a third synthetic argument.");
                    return unknownType;
                case 139 /* MethodDeclaration */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    // The `descriptor` for a method decorator will be a `TypedPropertyDescriptor<T>`
                    // for the type of the member.
                    var propertyType = getTypeOfNode(node);
                    return createTypedPropertyDescriptorType(propertyType);
                default:
                    ts.Debug.fail("Unsupported decorator target.");
                    return unknownType;
            }
        }
        /**
          * Returns the effective argument type for the provided argument to a decorator.
          */
        function getEffectiveDecoratorArgumentType(node, argIndex) {
            if (argIndex === 0) {
                return getEffectiveDecoratorFirstArgumentType(node.parent);
            }
            else if (argIndex === 1) {
                return getEffectiveDecoratorSecondArgumentType(node.parent);
            }
            else if (argIndex === 2) {
                return getEffectiveDecoratorThirdArgumentType(node.parent);
            }
            ts.Debug.fail("Decorators should not have a fourth synthetic argument.");
            return unknownType;
        }
        /**
          * Gets the effective argument type for an argument in a call expression.
          */
        function getEffectiveArgumentType(node, argIndex, arg) {
            // Decorators provide special arguments, a tagged template expression provides 
            // a special first argument, and string literals get string literal types
            // unless we're reporting errors
            if (node.kind === 135 /* Decorator */) {
                return getEffectiveDecoratorArgumentType(node, argIndex);
            }
            else if (argIndex === 0 && node.kind === 165 /* TaggedTemplateExpression */) {
                return globalTemplateStringsArrayType;
            }
            // This is not a synthetic argument, so we return 'undefined'
            // to signal that the caller needs to check the argument.            
            return undefined;
        }
        /**
          * Gets the effective argument expression for an argument in a call expression.
          */
        function getEffectiveArgument(node, args, argIndex) {
            // For a decorator or the first argument of a tagged template expression we return undefined.
            if (node.kind === 135 /* Decorator */ ||
                (argIndex === 0 && node.kind === 165 /* TaggedTemplateExpression */)) {
                return undefined;
            }
            return args[argIndex];
        }
        /**
          * Gets the error node to use when reporting errors for an effective argument.
          */
        function getEffectiveArgumentErrorNode(node, argIndex, arg) {
            if (node.kind === 135 /* Decorator */) {
                // For a decorator, we use the expression of the decorator for error reporting.
                return node.expression;
            }
            else if (argIndex === 0 && node.kind === 165 /* TaggedTemplateExpression */) {
                // For a the first argument of a tagged template expression, we use the template of the tag for error reporting.
                return node.template;
            }
            else {
                return arg;
            }
        }
        function resolveCall(node, signatures, candidatesOutArray, headMessage) {
            var isTaggedTemplate = node.kind === 165 /* TaggedTemplateExpression */;
            var isDecorator = node.kind === 135 /* Decorator */;
            var typeArguments;
            if (!isTaggedTemplate && !isDecorator) {
                typeArguments = node.typeArguments;
                // We already perform checking on the type arguments on the class declaration itself.
                if (node.expression.kind !== 92 /* SuperKeyword */) {
                    ts.forEach(typeArguments, checkSourceElement);
                }
            }
            var candidates = candidatesOutArray || [];
            // reorderCandidates fills up the candidates array directly
            reorderCandidates(signatures, candidates);
            if (!candidates.length) {
                reportError(ts.Diagnostics.Supplied_parameters_do_not_match_any_signature_of_call_target);
                return resolveErrorCall(node);
            }
            var args = getEffectiveCallArguments(node);
            // The following applies to any value of 'excludeArgument[i]':
            //    - true:      the argument at 'i' is susceptible to a one-time permanent contextual typing.
            //    - undefined: the argument at 'i' is *not* susceptible to permanent contextual typing.
            //    - false:     the argument at 'i' *was* and *has been* permanently contextually typed.
            //
            // The idea is that we will perform type argument inference & assignability checking once
            // without using the susceptible parameters that are functions, and once more for each of those
            // parameters, contextually typing each as we go along.
            //
            // For a tagged template, then the first argument be 'undefined' if necessary
            // because it represents a TemplateStringsArray.
            //
            // For a decorator, no arguments are susceptible to contextual typing due to the fact 
            // decorators are applied to a declaration by the emitter, and not to an expression.
            var excludeArgument;
            if (!isDecorator) {
                // We do not need to call `getEffectiveArgumentCount` here as it only
                // applies when calculating the number of arguments for a decorator.
                for (var i = isTaggedTemplate ? 1 : 0; i < args.length; i++) {
                    if (isContextSensitive(args[i])) {
                        if (!excludeArgument) {
                            excludeArgument = new Array(args.length);
                        }
                        excludeArgument[i] = true;
                    }
                }
            }
            // The following variables are captured and modified by calls to chooseOverload.
            // If overload resolution or type argument inference fails, we want to report the
            // best error possible. The best error is one which says that an argument was not
            // assignable to a parameter. This implies that everything else about the overload
            // was fine. So if there is any overload that is only incorrect because of an
            // argument, we will report an error on that one.
            //
            //     function foo(s: string) {}
            //     function foo(n: number) {} // Report argument error on this overload
            //     function foo() {}
            //     foo(true);
            //
            // If none of the overloads even made it that far, there are two possibilities.
            // There was a problem with type arguments for some overload, in which case
            // report an error on that. Or none of the overloads even had correct arity,
            // in which case give an arity error.
            //
            //     function foo<T>(x: T, y: T) {} // Report type argument inference error
            //     function foo() {}
            //     foo(0, true);
            //
            var candidateForArgumentError;
            var candidateForTypeArgumentError;
            var resultOfFailedInference;
            var result;
            // Section 4.12.1:
            // if the candidate list contains one or more signatures for which the type of each argument
            // expression is a subtype of each corresponding parameter type, the return type of the first
            // of those signatures becomes the return type of the function call.
            // Otherwise, the return type of the first signature in the candidate list becomes the return
            // type of the function call.
            //
            // Whether the call is an error is determined by assignability of the arguments. The subtype pass
            // is just important for choosing the best signature. So in the case where there is only one
            // signature, the subtype pass is useless. So skipping it is an optimization.
            if (candidates.length > 1) {
                result = chooseOverload(candidates, subtypeRelation);
            }
            if (!result) {
                // Reinitialize these pointers for round two
                candidateForArgumentError = undefined;
                candidateForTypeArgumentError = undefined;
                resultOfFailedInference = undefined;
                result = chooseOverload(candidates, assignableRelation);
            }
            if (result) {
                return result;
            }
            // No signatures were applicable. Now report errors based on the last applicable signature with
            // no arguments excluded from assignability checks.
            // If candidate is undefined, it means that no candidates had a suitable arity. In that case,
            // skip the checkApplicableSignature check.
            if (candidateForArgumentError) {
                // excludeArgument is undefined, in this case also equivalent to [undefined, undefined, ...]
                // The importance of excludeArgument is to prevent us from typing function expression parameters
                // in arguments too early. If possible, we'd like to only type them once we know the correct
                // overload. However, this matters for the case where the call is correct. When the call is
                // an error, we don't need to exclude any arguments, although it would cause no harm to do so.
                checkApplicableSignature(node, args, candidateForArgumentError, assignableRelation, undefined, true);
            }
            else if (candidateForTypeArgumentError) {
                if (!isTaggedTemplate && !isDecorator && typeArguments) {
                    checkTypeArguments(candidateForTypeArgumentError, node.typeArguments, [], true, headMessage);
                }
                else {
                    ts.Debug.assert(resultOfFailedInference.failedTypeParameterIndex >= 0);
                    var failedTypeParameter = candidateForTypeArgumentError.typeParameters[resultOfFailedInference.failedTypeParameterIndex];
                    var inferenceCandidates = getInferenceCandidates(resultOfFailedInference, resultOfFailedInference.failedTypeParameterIndex);
                    var diagnosticChainHead = ts.chainDiagnosticMessages(undefined, ts.Diagnostics.The_type_argument_for_type_parameter_0_cannot_be_inferred_from_the_usage_Consider_specifying_the_type_arguments_explicitly, typeToString(failedTypeParameter));
                    if (headMessage) {
                        diagnosticChainHead = ts.chainDiagnosticMessages(diagnosticChainHead, headMessage);
                    }
                    reportNoCommonSupertypeError(inferenceCandidates, node.expression || node.tag, diagnosticChainHead);
                }
            }
            else {
                reportError(ts.Diagnostics.Supplied_parameters_do_not_match_any_signature_of_call_target);
            }
            // No signature was applicable. We have already reported the errors for the invalid signature.
            // If this is a type resolution session, e.g. Language Service, try to get better information that anySignature.
            // Pick the first candidate that matches the arity. This way we can get a contextual type for cases like:
            //  declare function f(a: { xa: number; xb: number; });
            //  f({ |
            if (!produceDiagnostics) {
                for (var _i = 0; _i < candidates.length; _i++) {
                    var candidate = candidates[_i];
                    if (hasCorrectArity(node, args, candidate)) {
                        return candidate;
                    }
                }
            }
            return resolveErrorCall(node);
            function reportError(message, arg0, arg1, arg2) {
                var errorInfo;
                errorInfo = ts.chainDiagnosticMessages(errorInfo, message, arg0, arg1, arg2);
                if (headMessage) {
                    errorInfo = ts.chainDiagnosticMessages(errorInfo, headMessage);
                }
                diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(node, errorInfo));
            }
            function chooseOverload(candidates, relation) {
                for (var _i = 0; _i < candidates.length; _i++) {
                    var originalCandidate = candidates[_i];
                    if (!hasCorrectArity(node, args, originalCandidate)) {
                        continue;
                    }
                    var candidate = void 0;
                    var typeArgumentsAreValid = void 0;
                    var inferenceContext = originalCandidate.typeParameters
                        ? createInferenceContext(originalCandidate.typeParameters, false)
                        : undefined;
                    while (true) {
                        candidate = originalCandidate;
                        if (candidate.typeParameters) {
                            var typeArgumentTypes = void 0;
                            if (typeArguments) {
                                typeArgumentTypes = new Array(candidate.typeParameters.length);
                                typeArgumentsAreValid = checkTypeArguments(candidate, typeArguments, typeArgumentTypes, false);
                            }
                            else {
                                inferTypeArguments(node, candidate, args, excludeArgument, inferenceContext);
                                typeArgumentsAreValid = inferenceContext.failedTypeParameterIndex === undefined;
                                typeArgumentTypes = inferenceContext.inferredTypes;
                            }
                            if (!typeArgumentsAreValid) {
                                break;
                            }
                            candidate = getSignatureInstantiation(candidate, typeArgumentTypes);
                        }
                        if (!checkApplicableSignature(node, args, candidate, relation, excludeArgument, false)) {
                            break;
                        }
                        var index = excludeArgument ? ts.indexOf(excludeArgument, true) : -1;
                        if (index < 0) {
                            return candidate;
                        }
                        excludeArgument[index] = false;
                    }
                    // A post-mortem of this iteration of the loop. The signature was not applicable,
                    // so we want to track it as a candidate for reporting an error. If the candidate
                    // had no type parameters, or had no issues related to type arguments, we can
                    // report an error based on the arguments. If there was an issue with type
                    // arguments, then we can only report an error based on the type arguments.
                    if (originalCandidate.typeParameters) {
                        var instantiatedCandidate = candidate;
                        if (typeArgumentsAreValid) {
                            candidateForArgumentError = instantiatedCandidate;
                        }
                        else {
                            candidateForTypeArgumentError = originalCandidate;
                            if (!typeArguments) {
                                resultOfFailedInference = inferenceContext;
                            }
                        }
                    }
                    else {
                        ts.Debug.assert(originalCandidate === candidate);
                        candidateForArgumentError = originalCandidate;
                    }
                }
                return undefined;
            }
        }
        function resolveCallExpression(node, candidatesOutArray) {
            if (node.expression.kind === 92 /* SuperKeyword */) {
                var superType = checkSuperExpression(node.expression);
                if (superType !== unknownType) {
                    // In super call, the candidate signatures are the matching arity signatures of the base constructor function instantiated
                    // with the type arguments specified in the extends clause.
                    var baseTypeNode = ts.getClassExtendsHeritageClauseElement(ts.getContainingClass(node));
                    var baseConstructors = getInstantiatedConstructorsForTypeArguments(superType, baseTypeNode.typeArguments);
                    return resolveCall(node, baseConstructors, candidatesOutArray);
                }
                return resolveUntypedCall(node);
            }
            var funcType = checkExpression(node.expression);
            var apparentType = getApparentType(funcType);
            if (apparentType === unknownType) {
                // Another error has already been reported
                return resolveErrorCall(node);
            }
            // Technically, this signatures list may be incomplete. We are taking the apparent type,
            // but we are not including call signatures that may have been added to the Object or
            // Function interface, since they have none by default. This is a bit of a leap of faith
            // that the user will not add any.
            var callSignatures = getSignaturesOfType(apparentType, 0 /* Call */);
            var constructSignatures = getSignaturesOfType(apparentType, 1 /* Construct */);
            // TS 1.0 spec: 4.12
            // If FuncExpr is of type Any, or of an object type that has no call or construct signatures
            // but is a subtype of the Function interface, the call is an untyped function call. In an
            // untyped function call no TypeArgs are permitted, Args can be any argument list, no contextual
            // types are provided for the argument expressions, and the result is always of type Any.
            // We exclude union types because we may have a union of function types that happen to have
            // no common signatures.
            if (isTypeAny(funcType) || (!callSignatures.length && !constructSignatures.length && !(funcType.flags & 16384 /* Union */) && isTypeAssignableTo(funcType, globalFunctionType))) {
                // The unknownType indicates that an error already occured (and was reported).  No
                // need to report another error in this case.
                if (funcType !== unknownType && node.typeArguments) {
                    error(node, ts.Diagnostics.Untyped_function_calls_may_not_accept_type_arguments);
                }
                return resolveUntypedCall(node);
            }
            // If FuncExpr's apparent type(section 3.8.1) is a function type, the call is a typed function call.
            // TypeScript employs overload resolution in typed function calls in order to support functions
            // with multiple call signatures.
            if (!callSignatures.length) {
                if (constructSignatures.length) {
                    error(node, ts.Diagnostics.Value_of_type_0_is_not_callable_Did_you_mean_to_include_new, typeToString(funcType));
                }
                else {
                    error(node, ts.Diagnostics.Cannot_invoke_an_expression_whose_type_lacks_a_call_signature);
                }
                return resolveErrorCall(node);
            }
            return resolveCall(node, callSignatures, candidatesOutArray);
        }
        function resolveNewExpression(node, candidatesOutArray) {
            if (node.arguments && languageVersion < 1 /* ES5 */) {
                var spreadIndex = getSpreadArgumentIndex(node.arguments);
                if (spreadIndex >= 0) {
                    error(node.arguments[spreadIndex], ts.Diagnostics.Spread_operator_in_new_expressions_is_only_available_when_targeting_ECMAScript_5_and_higher);
                }
            }
            var expressionType = checkExpression(node.expression);
            // If ConstructExpr's apparent type(section 3.8.1) is an object type with one or
            // more construct signatures, the expression is processed in the same manner as a
            // function call, but using the construct signatures as the initial set of candidate
            // signatures for overload resolution. The result type of the function call becomes
            // the result type of the operation.
            expressionType = getApparentType(expressionType);
            if (expressionType === unknownType) {
                // Another error has already been reported
                return resolveErrorCall(node);
            }
            // TS 1.0 spec: 4.11
            // If ConstructExpr is of type Any, Args can be any argument
            // list and the result of the operation is of type Any.
            if (isTypeAny(expressionType)) {
                if (node.typeArguments) {
                    error(node, ts.Diagnostics.Untyped_function_calls_may_not_accept_type_arguments);
                }
                return resolveUntypedCall(node);
            }
            // Technically, this signatures list may be incomplete. We are taking the apparent type,
            // but we are not including construct signatures that may have been added to the Object or
            // Function interface, since they have none by default. This is a bit of a leap of faith
            // that the user will not add any.
            var constructSignatures = getSignaturesOfType(expressionType, 1 /* Construct */);
            if (constructSignatures.length) {
                return resolveCall(node, constructSignatures, candidatesOutArray);
            }
            // If ConstructExpr's apparent type is an object type with no construct signatures but
            // one or more call signatures, the expression is processed as a function call. A compile-time
            // error occurs if the result of the function call is not Void. The type of the result of the
            // operation is Any.
            var callSignatures = getSignaturesOfType(expressionType, 0 /* Call */);
            if (callSignatures.length) {
                var signature = resolveCall(node, callSignatures, candidatesOutArray);
                if (getReturnTypeOfSignature(signature) !== voidType) {
                    error(node, ts.Diagnostics.Only_a_void_function_can_be_called_with_the_new_keyword);
                }
                return signature;
            }
            error(node, ts.Diagnostics.Cannot_use_new_with_an_expression_whose_type_lacks_a_call_or_construct_signature);
            return resolveErrorCall(node);
        }
        function resolveTaggedTemplateExpression(node, candidatesOutArray) {
            var tagType = checkExpression(node.tag);
            var apparentType = getApparentType(tagType);
            if (apparentType === unknownType) {
                // Another error has already been reported
                return resolveErrorCall(node);
            }
            var callSignatures = getSignaturesOfType(apparentType, 0 /* Call */);
            if (isTypeAny(tagType) || (!callSignatures.length && !(tagType.flags & 16384 /* Union */) && isTypeAssignableTo(tagType, globalFunctionType))) {
                return resolveUntypedCall(node);
            }
            if (!callSignatures.length) {
                error(node, ts.Diagnostics.Cannot_invoke_an_expression_whose_type_lacks_a_call_signature);
                return resolveErrorCall(node);
            }
            return resolveCall(node, callSignatures, candidatesOutArray);
        }
        /**
          * Gets the localized diagnostic head message to use for errors when resolving a decorator as a call expression.
          */
        function getDiagnosticHeadMessageForDecoratorResolution(node) {
            switch (node.parent.kind) {
                case 209 /* ClassDeclaration */:
                case 181 /* ClassExpression */:
                    return ts.Diagnostics.Unable_to_resolve_signature_of_class_decorator_when_called_as_an_expression;
                case 134 /* Parameter */:
                    return ts.Diagnostics.Unable_to_resolve_signature_of_parameter_decorator_when_called_as_an_expression;
                case 137 /* PropertyDeclaration */:
                    return ts.Diagnostics.Unable_to_resolve_signature_of_property_decorator_when_called_as_an_expression;
                case 139 /* MethodDeclaration */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    return ts.Diagnostics.Unable_to_resolve_signature_of_method_decorator_when_called_as_an_expression;
            }
        }
        /**
          * Resolves a decorator as if it were a call expression.
          */
        function resolveDecorator(node, candidatesOutArray) {
            var funcType = checkExpression(node.expression);
            var apparentType = getApparentType(funcType);
            if (apparentType === unknownType) {
                return resolveErrorCall(node);
            }
            var callSignatures = getSignaturesOfType(apparentType, 0 /* Call */);
            if (funcType === anyType || (!callSignatures.length && !(funcType.flags & 16384 /* Union */) && isTypeAssignableTo(funcType, globalFunctionType))) {
                return resolveUntypedCall(node);
            }
            var headMessage = getDiagnosticHeadMessageForDecoratorResolution(node);
            if (!callSignatures.length) {
                var errorInfo;
                errorInfo = ts.chainDiagnosticMessages(errorInfo, ts.Diagnostics.Cannot_invoke_an_expression_whose_type_lacks_a_call_signature);
                errorInfo = ts.chainDiagnosticMessages(errorInfo, headMessage);
                diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(node, errorInfo));
                return resolveErrorCall(node);
            }
            return resolveCall(node, callSignatures, candidatesOutArray, headMessage);
        }
        // candidatesOutArray is passed by signature help in the language service, and collectCandidates
        // must fill it up with the appropriate candidate signatures
        function getResolvedSignature(node, candidatesOutArray) {
            var links = getNodeLinks(node);
            // If getResolvedSignature has already been called, we will have cached the resolvedSignature.
            // However, it is possible that either candidatesOutArray was not passed in the first time,
            // or that a different candidatesOutArray was passed in. Therefore, we need to redo the work
            // to correctly fill the candidatesOutArray.
            if (!links.resolvedSignature || candidatesOutArray) {
                links.resolvedSignature = anySignature;
                if (node.kind === 163 /* CallExpression */) {
                    links.resolvedSignature = resolveCallExpression(node, candidatesOutArray);
                }
                else if (node.kind === 164 /* NewExpression */) {
                    links.resolvedSignature = resolveNewExpression(node, candidatesOutArray);
                }
                else if (node.kind === 165 /* TaggedTemplateExpression */) {
                    links.resolvedSignature = resolveTaggedTemplateExpression(node, candidatesOutArray);
                }
                else if (node.kind === 135 /* Decorator */) {
                    links.resolvedSignature = resolveDecorator(node, candidatesOutArray);
                }
                else {
                    ts.Debug.fail("Branch in 'getResolvedSignature' should be unreachable.");
                }
            }
            return links.resolvedSignature;
        }
        function checkCallExpression(node) {
            // Grammar checking; stop grammar-checking if checkGrammarTypeArguments return true
            checkGrammarTypeArguments(node, node.typeArguments) || checkGrammarArguments(node, node.arguments);
            var signature = getResolvedSignature(node);
            if (node.expression.kind === 92 /* SuperKeyword */) {
                return voidType;
            }
            if (node.kind === 164 /* NewExpression */) {
                var declaration = signature.declaration;
                if (declaration &&
                    declaration.kind !== 140 /* Constructor */ &&
                    declaration.kind !== 144 /* ConstructSignature */ &&
                    declaration.kind !== 149 /* ConstructorType */) {
                    // When resolved signature is a call signature (and not a construct signature) the result type is any
                    if (compilerOptions.noImplicitAny) {
                        error(node, ts.Diagnostics.new_expression_whose_target_lacks_a_construct_signature_implicitly_has_an_any_type);
                    }
                    return anyType;
                }
            }
            return getReturnTypeOfSignature(signature);
        }
        function checkTaggedTemplateExpression(node) {
            return getReturnTypeOfSignature(getResolvedSignature(node));
        }
        function checkAssertion(node) {
            var exprType = checkExpression(node.expression);
            var targetType = getTypeFromTypeNode(node.type);
            if (produceDiagnostics && targetType !== unknownType) {
                var widenedType = getWidenedType(exprType);
                if (!(isTypeAssignableTo(targetType, widenedType))) {
                    checkTypeAssignableTo(exprType, targetType, node, ts.Diagnostics.Neither_type_0_nor_type_1_is_assignable_to_the_other);
                }
            }
            return targetType;
        }
        function getTypeAtPosition(signature, pos) {
            return signature.hasRestParameter ?
                pos < signature.parameters.length - 1 ? getTypeOfSymbol(signature.parameters[pos]) : getRestTypeOfSignature(signature) :
                pos < signature.parameters.length ? getTypeOfSymbol(signature.parameters[pos]) : anyType;
        }
        function assignContextualParameterTypes(signature, context, mapper) {
            var len = signature.parameters.length - (signature.hasRestParameter ? 1 : 0);
            for (var i = 0; i < len; i++) {
                var parameter = signature.parameters[i];
                var links = getSymbolLinks(parameter);
                links.type = instantiateType(getTypeAtPosition(context, i), mapper);
            }
            if (signature.hasRestParameter && context.hasRestParameter && signature.parameters.length >= context.parameters.length) {
                var parameter = ts.lastOrUndefined(signature.parameters);
                var links = getSymbolLinks(parameter);
                links.type = instantiateType(getTypeOfSymbol(ts.lastOrUndefined(context.parameters)), mapper);
            }
        }
        function createPromiseType(promisedType) {
            // creates a `Promise<T>` type where `T` is the promisedType argument
            var globalPromiseType = getGlobalPromiseType();
            if (globalPromiseType !== emptyObjectType) {
                // if the promised type is itself a promise, get the underlying type; otherwise, fallback to the promised type
                promisedType = getAwaitedType(promisedType);
                return createTypeReference(globalPromiseType, [promisedType]);
            }
            return emptyObjectType;
        }
        function getReturnTypeFromBody(func, contextualMapper) {
            var contextualSignature = getContextualSignatureForFunctionLikeDeclaration(func);
            if (!func.body) {
                return unknownType;
            }
            var isAsync = ts.isAsyncFunctionLike(func);
            var type;
            if (func.body.kind !== 187 /* Block */) {
                type = checkExpressionCached(func.body, contextualMapper);
                if (isAsync) {
                    // From within an async function you can return either a non-promise value or a promise. Any 
                    // Promise/A+ compatible implementation will always assimilate any foreign promise, so the 
                    // return type of the body should be unwrapped to its awaited type, which we will wrap in 
                    // the native Promise<T> type later in this function.
                    type = checkAwaitedType(type, func, ts.Diagnostics.Return_expression_in_async_function_does_not_have_a_valid_callable_then_member);
                }
            }
            else {
                var types;
                var funcIsGenerator = !!func.asteriskToken;
                if (funcIsGenerator) {
                    types = checkAndAggregateYieldOperandTypes(func.body, contextualMapper);
                    if (types.length === 0) {
                        var iterableIteratorAny = createIterableIteratorType(anyType);
                        if (compilerOptions.noImplicitAny) {
                            error(func.asteriskToken, ts.Diagnostics.Generator_implicitly_has_type_0_because_it_does_not_yield_any_values_Consider_supplying_a_return_type, typeToString(iterableIteratorAny));
                        }
                        return iterableIteratorAny;
                    }
                }
                else {
                    types = checkAndAggregateReturnExpressionTypes(func.body, contextualMapper, isAsync);
                    if (types.length === 0) {
                        if (isAsync) {
                            // For an async function, the return type will not be void, but rather a Promise for void.
                            var promiseType = createPromiseType(voidType);
                            if (promiseType === emptyObjectType) {
                                error(func, ts.Diagnostics.An_async_function_or_method_must_have_a_valid_awaitable_return_type);
                                return unknownType;
                            }
                            return promiseType;
                        }
                        else {
                            return voidType;
                        }
                    }
                }
                // When yield/return statements are contextually typed we allow the return type to be a union type.
                // Otherwise we require the yield/return expressions to have a best common supertype.
                type = contextualSignature ? getUnionType(types) : getCommonSupertype(types);
                if (!type) {
                    if (funcIsGenerator) {
                        error(func, ts.Diagnostics.No_best_common_type_exists_among_yield_expressions);
                        return createIterableIteratorType(unknownType);
                    }
                    else {
                        error(func, ts.Diagnostics.No_best_common_type_exists_among_return_expressions);
                        return unknownType;
                    }
                }
                if (funcIsGenerator) {
                    type = createIterableIteratorType(type);
                }
            }
            if (!contextualSignature) {
                reportErrorsFromWidening(func, type);
            }
            var widenedType = getWidenedType(type);
            if (isAsync) {
                // From within an async function you can return either a non-promise value or a promise. Any 
                // Promise/A+ compatible implementation will always assimilate any foreign promise, so the 
                // return type of the body is awaited type of the body, wrapped in a native Promise<T> type.
                var promiseType = createPromiseType(widenedType);
                if (promiseType === emptyObjectType) {
                    error(func, ts.Diagnostics.An_async_function_or_method_must_have_a_valid_awaitable_return_type);
                    return unknownType;
                }
                return promiseType;
            }
            else {
                return widenedType;
            }
        }
        function checkAndAggregateYieldOperandTypes(body, contextualMapper) {
            var aggregatedTypes = [];
            ts.forEachYieldExpression(body, function (yieldExpression) {
                var expr = yieldExpression.expression;
                if (expr) {
                    var type = checkExpressionCached(expr, contextualMapper);
                    if (yieldExpression.asteriskToken) {
                        // A yield* expression effectively yields everything that its operand yields
                        type = checkElementTypeOfIterable(type, yieldExpression.expression);
                    }
                    if (!ts.contains(aggregatedTypes, type)) {
                        aggregatedTypes.push(type);
                    }
                }
            });
            return aggregatedTypes;
        }
        function checkAndAggregateReturnExpressionTypes(body, contextualMapper, isAsync) {
            var aggregatedTypes = [];
            ts.forEachReturnStatement(body, function (returnStatement) {
                var expr = returnStatement.expression;
                if (expr) {
                    var type = checkExpressionCached(expr, contextualMapper);
                    if (isAsync) {
                        // From within an async function you can return either a non-promise value or a promise. Any 
                        // Promise/A+ compatible implementation will always assimilate any foreign promise, so the 
                        // return type of the body should be unwrapped to its awaited type, which should be wrapped in 
                        // the native Promise<T> type by the caller.
                        type = checkAwaitedType(type, body.parent, ts.Diagnostics.Return_expression_in_async_function_does_not_have_a_valid_callable_then_member);
                    }
                    if (!ts.contains(aggregatedTypes, type)) {
                        aggregatedTypes.push(type);
                    }
                }
            });
            return aggregatedTypes;
        }
        function bodyContainsAReturnStatement(funcBody) {
            return ts.forEachReturnStatement(funcBody, function (returnStatement) {
                return true;
            });
        }
        function bodyContainsSingleThrowStatement(body) {
            return (body.statements.length === 1) && (body.statements[0].kind === 203 /* ThrowStatement */);
        }
        // TypeScript Specification 1.0 (6.3) - July 2014
        // An explicitly typed function whose return type isn't the Void or the Any type
        // must have at least one return statement somewhere in its body.
        // An exception to this rule is if the function implementation consists of a single 'throw' statement.
        function checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(func, returnType) {
            if (!produceDiagnostics) {
                return;
            }
            // Functions that return 'void' or 'any' don't need any return expressions.
            if (returnType === voidType || isTypeAny(returnType)) {
                return;
            }
            // If all we have is a function signature, or an arrow function with an expression body, then there is nothing to check.
            if (ts.nodeIsMissing(func.body) || func.body.kind !== 187 /* Block */) {
                return;
            }
            var bodyBlock = func.body;
            // Ensure the body has at least one return expression.
            if (bodyContainsAReturnStatement(bodyBlock)) {
                return;
            }
            // If there are no return expressions, then we need to check if
            // the function body consists solely of a throw statement;
            // this is to make an exception for unimplemented functions.
            if (bodyContainsSingleThrowStatement(bodyBlock)) {
                return;
            }
            // This function does not conform to the specification.
            error(func.type, ts.Diagnostics.A_function_whose_declared_type_is_neither_void_nor_any_must_return_a_value_or_consist_of_a_single_throw_statement);
        }
        function checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper) {
            ts.Debug.assert(node.kind !== 139 /* MethodDeclaration */ || ts.isObjectLiteralMethod(node));
            // Grammar checking
            var hasGrammarError = checkGrammarFunctionLikeDeclaration(node);
            if (!hasGrammarError && node.kind === 168 /* FunctionExpression */) {
                checkGrammarForGenerator(node);
            }
            // The identityMapper object is used to indicate that function expressions are wildcards
            if (contextualMapper === identityMapper && isContextSensitive(node)) {
                return anyFunctionType;
            }
            var isAsync = ts.isAsyncFunctionLike(node);
            if (isAsync) {
                emitAwaiter = true;
            }
            var links = getNodeLinks(node);
            var type = getTypeOfSymbol(node.symbol);
            // Check if function expression is contextually typed and assign parameter types if so
            if (!(links.flags & 1024 /* ContextChecked */)) {
                var contextualSignature = getContextualSignature(node);
                // If a type check is started at a function expression that is an argument of a function call, obtaining the
                // contextual type may recursively get back to here during overload resolution of the call. If so, we will have
                // already assigned contextual types.
                if (!(links.flags & 1024 /* ContextChecked */)) {
                    links.flags |= 1024 /* ContextChecked */;
                    if (contextualSignature) {
                        var signature = getSignaturesOfType(type, 0 /* Call */)[0];
                        if (isContextSensitive(node)) {
                            assignContextualParameterTypes(signature, contextualSignature, contextualMapper || identityMapper);
                        }
                        if (!node.type && !signature.resolvedReturnType) {
                            var returnType = getReturnTypeFromBody(node, contextualMapper);
                            if (!signature.resolvedReturnType) {
                                signature.resolvedReturnType = returnType;
                            }
                        }
                    }
                    checkSignatureDeclaration(node);
                }
            }
            if (produceDiagnostics && node.kind !== 139 /* MethodDeclaration */ && node.kind !== 138 /* MethodSignature */) {
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
            }
            return type;
        }
        function checkFunctionExpressionOrObjectLiteralMethodBody(node) {
            ts.Debug.assert(node.kind !== 139 /* MethodDeclaration */ || ts.isObjectLiteralMethod(node));
            var isAsync = ts.isAsyncFunctionLike(node);
            if (isAsync) {
                emitAwaiter = true;
            }
            var returnType = node.type && getTypeFromTypeNode(node.type);
            var promisedType;
            if (returnType && isAsync) {
                promisedType = checkAsyncFunctionReturnType(node);
            }
            if (returnType && !node.asteriskToken) {
                checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(node, isAsync ? promisedType : returnType);
            }
            if (node.body) {
                if (!node.type) {
                    // There are some checks that are only performed in getReturnTypeFromBody, that may produce errors
                    // we need. An example is the noImplicitAny errors resulting from widening the return expression
                    // of a function. Because checking of function expression bodies is deferred, there was never an
                    // appropriate time to do this during the main walk of the file (see the comment at the top of
                    // checkFunctionExpressionBodies). So it must be done now.
                    getReturnTypeOfSignature(getSignatureFromDeclaration(node));
                }
                if (node.body.kind === 187 /* Block */) {
                    checkSourceElement(node.body);
                }
                else {
                    // From within an async function you can return either a non-promise value or a promise. Any 
                    // Promise/A+ compatible implementation will always assimilate any foreign promise, so we 
                    // should not be checking assignability of a promise to the return type. Instead, we need to 
                    // check assignability of the awaited type of the expression body against the promised type of 
                    // its return type annotation.
                    var exprType = checkExpression(node.body);
                    if (returnType) {
                        if (isAsync) {
                            var awaitedType = checkAwaitedType(exprType, node.body, ts.Diagnostics.Expression_body_for_async_arrow_function_does_not_have_a_valid_callable_then_member);
                            checkTypeAssignableTo(awaitedType, promisedType, node.body);
                        }
                        else {
                            checkTypeAssignableTo(exprType, returnType, node.body);
                        }
                    }
                    checkFunctionAndClassExpressionBodies(node.body);
                }
            }
        }
        function checkArithmeticOperandType(operand, type, diagnostic) {
            if (!isTypeAnyOrAllConstituentTypesHaveKind(type, 132 /* NumberLike */)) {
                error(operand, diagnostic);
                return false;
            }
            return true;
        }
        function checkReferenceExpression(n, invalidReferenceMessage, constantVariableMessage) {
            function findSymbol(n) {
                var symbol = getNodeLinks(n).resolvedSymbol;
                // Because we got the symbol from the resolvedSymbol property, it might be of kind
                // SymbolFlags.ExportValue. In this case it is necessary to get the actual export
                // symbol, which will have the correct flags set on it.
                return symbol && getExportSymbolOfValueSymbolIfExported(symbol);
            }
            function isReferenceOrErrorExpression(n) {
                // TypeScript 1.0 spec (April 2014):
                // Expressions are classified as values or references.
                // References are the subset of expressions that are permitted as the target of an assignment.
                // Specifically, references are combinations of identifiers(section 4.3), parentheses(section 4.7),
                // and property accesses(section 4.10).
                // All other expression constructs described in this chapter are classified as values.
                switch (n.kind) {
                    case 66 /* Identifier */: {
                        var symbol = findSymbol(n);
                        // TypeScript 1.0 spec (April 2014): 4.3
                        // An identifier expression that references a variable or parameter is classified as a reference.
                        // An identifier expression that references any other kind of entity is classified as a value(and therefore cannot be the target of an assignment).
                        return !symbol || symbol === unknownSymbol || symbol === argumentsSymbol || (symbol.flags & 3 /* Variable */) !== 0;
                    }
                    case 161 /* PropertyAccessExpression */: {
                        var symbol = findSymbol(n);
                        // TypeScript 1.0 spec (April 2014): 4.10
                        // A property access expression is always classified as a reference.
                        // NOTE (not in spec): assignment to enum members should not be allowed
                        return !symbol || symbol === unknownSymbol || (symbol.flags & ~8 /* EnumMember */) !== 0;
                    }
                    case 162 /* ElementAccessExpression */:
                        //  old compiler doesn't check indexed assess
                        return true;
                    case 167 /* ParenthesizedExpression */:
                        return isReferenceOrErrorExpression(n.expression);
                    default:
                        return false;
                }
            }
            function isConstVariableReference(n) {
                switch (n.kind) {
                    case 66 /* Identifier */:
                    case 161 /* PropertyAccessExpression */: {
                        var symbol = findSymbol(n);
                        return symbol && (symbol.flags & 3 /* Variable */) !== 0 && (getDeclarationFlagsFromSymbol(symbol) & 8192 /* Const */) !== 0;
                    }
                    case 162 /* ElementAccessExpression */: {
                        var index = n.argumentExpression;
                        var symbol = findSymbol(n.expression);
                        if (symbol && index && index.kind === 8 /* StringLiteral */) {
                            var name_4 = index.text;
                            var prop = getPropertyOfType(getTypeOfSymbol(symbol), name_4);
                            return prop && (prop.flags & 3 /* Variable */) !== 0 && (getDeclarationFlagsFromSymbol(prop) & 8192 /* Const */) !== 0;
                        }
                        return false;
                    }
                    case 167 /* ParenthesizedExpression */:
                        return isConstVariableReference(n.expression);
                    default:
                        return false;
                }
            }
            if (!isReferenceOrErrorExpression(n)) {
                error(n, invalidReferenceMessage);
                return false;
            }
            if (isConstVariableReference(n)) {
                error(n, constantVariableMessage);
                return false;
            }
            return true;
        }
        function checkDeleteExpression(node) {
            checkExpression(node.expression);
            return booleanType;
        }
        function checkTypeOfExpression(node) {
            checkExpression(node.expression);
            return stringType;
        }
        function checkVoidExpression(node) {
            checkExpression(node.expression);
            return undefinedType;
        }
        function checkAwaitExpression(node) {
            // Grammar checking
            if (produceDiagnostics) {
                if (!(node.parserContextFlags & 8 /* Await */)) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.await_expression_is_only_allowed_within_an_async_function);
                }
                if (isInParameterInitializerBeforeContainingFunction(node)) {
                    error(node, ts.Diagnostics.await_expressions_cannot_be_used_in_a_parameter_initializer);
                }
            }
            var operandType = checkExpression(node.expression);
            return checkAwaitedType(operandType, node);
        }
        function checkPrefixUnaryExpression(node) {
            var operandType = checkExpression(node.operand);
            switch (node.operator) {
                case 34 /* PlusToken */:
                case 35 /* MinusToken */:
                case 48 /* TildeToken */:
                    if (someConstituentTypeHasKind(operandType, 2097152 /* ESSymbol */)) {
                        error(node.operand, ts.Diagnostics.The_0_operator_cannot_be_applied_to_type_symbol, ts.tokenToString(node.operator));
                    }
                    return numberType;
                case 47 /* ExclamationToken */:
                    return booleanType;
                case 39 /* PlusPlusToken */:
                case 40 /* MinusMinusToken */:
                    var ok = checkArithmeticOperandType(node.operand, operandType, ts.Diagnostics.An_arithmetic_operand_must_be_of_type_any_number_or_an_enum_type);
                    if (ok) {
                        // run check only if former checks succeeded to avoid reporting cascading errors
                        checkReferenceExpression(node.operand, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_must_be_a_variable_property_or_indexer, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_cannot_be_a_constant);
                    }
                    return numberType;
            }
            return unknownType;
        }
        function checkPostfixUnaryExpression(node) {
            var operandType = checkExpression(node.operand);
            var ok = checkArithmeticOperandType(node.operand, operandType, ts.Diagnostics.An_arithmetic_operand_must_be_of_type_any_number_or_an_enum_type);
            if (ok) {
                // run check only if former checks succeeded to avoid reporting cascading errors
                checkReferenceExpression(node.operand, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_must_be_a_variable_property_or_indexer, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_cannot_be_a_constant);
            }
            return numberType;
        }
        // Just like isTypeOfKind below, except that it returns true if *any* constituent
        // has this kind.
        function someConstituentTypeHasKind(type, kind) {
            if (type.flags & kind) {
                return true;
            }
            if (type.flags & 16384 /* Union */) {
                var types = type.types;
                for (var _i = 0; _i < types.length; _i++) {
                    var current = types[_i];
                    if (current.flags & kind) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        }
        // Return true if type has the given flags, or is a union type composed of types that all have those flags.
        function allConstituentTypesHaveKind(type, kind) {
            if (type.flags & kind) {
                return true;
            }
            if (type.flags & 16384 /* Union */) {
                var types = type.types;
                for (var _i = 0; _i < types.length; _i++) {
                    var current = types[_i];
                    if (!(current.flags & kind)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        function isConstEnumObjectType(type) {
            return type.flags & (48128 /* ObjectType */ | 32768 /* Anonymous */) && type.symbol && isConstEnumSymbol(type.symbol);
        }
        function isConstEnumSymbol(symbol) {
            return (symbol.flags & 128 /* ConstEnum */) !== 0;
        }
        function checkInstanceOfExpression(node, leftType, rightType) {
            // TypeScript 1.0 spec (April 2014): 4.15.4
            // The instanceof operator requires the left operand to be of type Any, an object type, or a type parameter type,
            // and the right operand to be of type Any or a subtype of the 'Function' interface type.
            // The result is always of the Boolean primitive type.
            // NOTE: do not raise error if leftType is unknown as related error was already reported
            if (allConstituentTypesHaveKind(leftType, 2097662 /* Primitive */)) {
                error(node.left, ts.Diagnostics.The_left_hand_side_of_an_instanceof_expression_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            // NOTE: do not raise error if right is unknown as related error was already reported
            if (!(isTypeAny(rightType) || isTypeSubtypeOf(rightType, globalFunctionType))) {
                error(node.right, ts.Diagnostics.The_right_hand_side_of_an_instanceof_expression_must_be_of_type_any_or_of_a_type_assignable_to_the_Function_interface_type);
            }
            return booleanType;
        }
        function checkInExpression(node, leftType, rightType) {
            // TypeScript 1.0 spec (April 2014): 4.15.5
            // The in operator requires the left operand to be of type Any, the String primitive type, or the Number primitive type,
            // and the right operand to be of type Any, an object type, or a type parameter type.
            // The result is always of the Boolean primitive type.
            if (!isTypeAnyOrAllConstituentTypesHaveKind(leftType, 258 /* StringLike */ | 132 /* NumberLike */ | 2097152 /* ESSymbol */)) {
                error(node.left, ts.Diagnostics.The_left_hand_side_of_an_in_expression_must_be_of_type_any_string_number_or_symbol);
            }
            if (!isTypeAnyOrAllConstituentTypesHaveKind(rightType, 48128 /* ObjectType */ | 512 /* TypeParameter */)) {
                error(node.right, ts.Diagnostics.The_right_hand_side_of_an_in_expression_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            return booleanType;
        }
        function checkObjectLiteralAssignment(node, sourceType, contextualMapper) {
            var properties = node.properties;
            for (var _i = 0; _i < properties.length; _i++) {
                var p = properties[_i];
                if (p.kind === 240 /* PropertyAssignment */ || p.kind === 241 /* ShorthandPropertyAssignment */) {
                    // TODO(andersh): Computed property support
                    var name_5 = p.name;
                    var type = isTypeAny(sourceType)
                        ? sourceType
                        : getTypeOfPropertyOfType(sourceType, name_5.text) ||
                            isNumericLiteralName(name_5.text) && getIndexTypeOfType(sourceType, 1 /* Number */) ||
                            getIndexTypeOfType(sourceType, 0 /* String */);
                    if (type) {
                        checkDestructuringAssignment(p.initializer || name_5, type);
                    }
                    else {
                        error(name_5, ts.Diagnostics.Type_0_has_no_property_1_and_no_string_index_signature, typeToString(sourceType), ts.declarationNameToString(name_5));
                    }
                }
                else {
                    error(p, ts.Diagnostics.Property_assignment_expected);
                }
            }
            return sourceType;
        }
        function checkArrayLiteralAssignment(node, sourceType, contextualMapper) {
            // This elementType will be used if the specific property corresponding to this index is not
            // present (aka the tuple element property). This call also checks that the parentType is in
            // fact an iterable or array (depending on target language).
            var elementType = checkIteratedTypeOrElementType(sourceType, node, false) || unknownType;
            var elements = node.elements;
            for (var i = 0; i < elements.length; i++) {
                var e = elements[i];
                if (e.kind !== 182 /* OmittedExpression */) {
                    if (e.kind !== 180 /* SpreadElementExpression */) {
                        var propName = "" + i;
                        var type = isTypeAny(sourceType)
                            ? sourceType
                            : isTupleLikeType(sourceType)
                                ? getTypeOfPropertyOfType(sourceType, propName)
                                : elementType;
                        if (type) {
                            checkDestructuringAssignment(e, type, contextualMapper);
                        }
                        else {
                            if (isTupleType(sourceType)) {
                                error(e, ts.Diagnostics.Tuple_type_0_with_length_1_cannot_be_assigned_to_tuple_with_length_2, typeToString(sourceType), sourceType.elementTypes.length, elements.length);
                            }
                            else {
                                error(e, ts.Diagnostics.Type_0_has_no_property_1, typeToString(sourceType), propName);
                            }
                        }
                    }
                    else {
                        if (i < elements.length - 1) {
                            error(e, ts.Diagnostics.A_rest_element_must_be_last_in_an_array_destructuring_pattern);
                        }
                        else {
                            var restExpression = e.expression;
                            if (restExpression.kind === 176 /* BinaryExpression */ && restExpression.operatorToken.kind === 54 /* EqualsToken */) {
                                error(restExpression.operatorToken, ts.Diagnostics.A_rest_element_cannot_have_an_initializer);
                            }
                            else {
                                checkDestructuringAssignment(restExpression, createArrayType(elementType), contextualMapper);
                            }
                        }
                    }
                }
            }
            return sourceType;
        }
        function checkDestructuringAssignment(target, sourceType, contextualMapper) {
            if (target.kind === 176 /* BinaryExpression */ && target.operatorToken.kind === 54 /* EqualsToken */) {
                checkBinaryExpression(target, contextualMapper);
                target = target.left;
            }
            if (target.kind === 160 /* ObjectLiteralExpression */) {
                return checkObjectLiteralAssignment(target, sourceType, contextualMapper);
            }
            if (target.kind === 159 /* ArrayLiteralExpression */) {
                return checkArrayLiteralAssignment(target, sourceType, contextualMapper);
            }
            return checkReferenceAssignment(target, sourceType, contextualMapper);
        }
        function checkReferenceAssignment(target, sourceType, contextualMapper) {
            var targetType = checkExpression(target, contextualMapper);
            if (checkReferenceExpression(target, ts.Diagnostics.Invalid_left_hand_side_of_assignment_expression, ts.Diagnostics.Left_hand_side_of_assignment_expression_cannot_be_a_constant)) {
                checkTypeAssignableTo(sourceType, targetType, target, undefined);
            }
            return sourceType;
        }
        function checkBinaryExpression(node, contextualMapper) {
            var operator = node.operatorToken.kind;
            if (operator === 54 /* EqualsToken */ && (node.left.kind === 160 /* ObjectLiteralExpression */ || node.left.kind === 159 /* ArrayLiteralExpression */)) {
                return checkDestructuringAssignment(node.left, checkExpression(node.right, contextualMapper), contextualMapper);
            }
            var leftType = checkExpression(node.left, contextualMapper);
            var rightType = checkExpression(node.right, contextualMapper);
            switch (operator) {
                case 36 /* AsteriskToken */:
                case 57 /* AsteriskEqualsToken */:
                case 37 /* SlashToken */:
                case 58 /* SlashEqualsToken */:
                case 38 /* PercentToken */:
                case 59 /* PercentEqualsToken */:
                case 35 /* MinusToken */:
                case 56 /* MinusEqualsToken */:
                case 41 /* LessThanLessThanToken */:
                case 60 /* LessThanLessThanEqualsToken */:
                case 42 /* GreaterThanGreaterThanToken */:
                case 61 /* GreaterThanGreaterThanEqualsToken */:
                case 43 /* GreaterThanGreaterThanGreaterThanToken */:
                case 62 /* GreaterThanGreaterThanGreaterThanEqualsToken */:
                case 45 /* BarToken */:
                case 64 /* BarEqualsToken */:
                case 46 /* CaretToken */:
                case 65 /* CaretEqualsToken */:
                case 44 /* AmpersandToken */:
                case 63 /* AmpersandEqualsToken */:
                    // TypeScript 1.0 spec (April 2014): 4.15.1
                    // These operators require their operands to be of type Any, the Number primitive type,
                    // or an enum type. Operands of an enum type are treated
                    // as having the primitive type Number. If one operand is the null or undefined value,
                    // it is treated as having the type of the other operand.
                    // The result is always of the Number primitive type.
                    if (leftType.flags & (32 /* Undefined */ | 64 /* Null */))
                        leftType = rightType;
                    if (rightType.flags & (32 /* Undefined */ | 64 /* Null */))
                        rightType = leftType;
                    var suggestedOperator;
                    // if a user tries to apply a bitwise operator to 2 boolean operands
                    // try and return them a helpful suggestion
                    if ((leftType.flags & 8 /* Boolean */) &&
                        (rightType.flags & 8 /* Boolean */) &&
                        (suggestedOperator = getSuggestedBooleanOperator(node.operatorToken.kind)) !== undefined) {
                        error(node, ts.Diagnostics.The_0_operator_is_not_allowed_for_boolean_types_Consider_using_1_instead, ts.tokenToString(node.operatorToken.kind), ts.tokenToString(suggestedOperator));
                    }
                    else {
                        // otherwise just check each operand separately and report errors as normal
                        var leftOk = checkArithmeticOperandType(node.left, leftType, ts.Diagnostics.The_left_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_or_an_enum_type);
                        var rightOk = checkArithmeticOperandType(node.right, rightType, ts.Diagnostics.The_right_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_or_an_enum_type);
                        if (leftOk && rightOk) {
                            checkAssignmentOperator(numberType);
                        }
                    }
                    return numberType;
                case 34 /* PlusToken */:
                case 55 /* PlusEqualsToken */:
                    // TypeScript 1.0 spec (April 2014): 4.15.2
                    // The binary + operator requires both operands to be of the Number primitive type or an enum type,
                    // or at least one of the operands to be of type Any or the String primitive type.
                    // If one operand is the null or undefined value, it is treated as having the type of the other operand.
                    if (leftType.flags & (32 /* Undefined */ | 64 /* Null */))
                        leftType = rightType;
                    if (rightType.flags & (32 /* Undefined */ | 64 /* Null */))
                        rightType = leftType;
                    var resultType;
                    if (allConstituentTypesHaveKind(leftType, 132 /* NumberLike */) && allConstituentTypesHaveKind(rightType, 132 /* NumberLike */)) {
                        // Operands of an enum type are treated as having the primitive type Number.
                        // If both operands are of the Number primitive type, the result is of the Number primitive type.
                        resultType = numberType;
                    }
                    else {
                        if (allConstituentTypesHaveKind(leftType, 258 /* StringLike */) || allConstituentTypesHaveKind(rightType, 258 /* StringLike */)) {
                            // If one or both operands are of the String primitive type, the result is of the String primitive type.
                            resultType = stringType;
                        }
                        else if (isTypeAny(leftType) || isTypeAny(rightType)) {
                            // Otherwise, the result is of type Any.
                            // NOTE: unknown type here denotes error type. Old compiler treated this case as any type so do we.
                            resultType = leftType === unknownType || rightType === unknownType ? unknownType : anyType;
                        }
                        // Symbols are not allowed at all in arithmetic expressions
                        if (resultType && !checkForDisallowedESSymbolOperand(operator)) {
                            return resultType;
                        }
                    }
                    if (!resultType) {
                        reportOperatorError();
                        return anyType;
                    }
                    if (operator === 55 /* PlusEqualsToken */) {
                        checkAssignmentOperator(resultType);
                    }
                    return resultType;
                case 24 /* LessThanToken */:
                case 26 /* GreaterThanToken */:
                case 27 /* LessThanEqualsToken */:
                case 28 /* GreaterThanEqualsToken */:
                    if (!checkForDisallowedESSymbolOperand(operator)) {
                        return booleanType;
                    }
                // Fall through
                case 29 /* EqualsEqualsToken */:
                case 30 /* ExclamationEqualsToken */:
                case 31 /* EqualsEqualsEqualsToken */:
                case 32 /* ExclamationEqualsEqualsToken */:
                    if (!isTypeAssignableTo(leftType, rightType) && !isTypeAssignableTo(rightType, leftType)) {
                        reportOperatorError();
                    }
                    return booleanType;
                case 88 /* InstanceOfKeyword */:
                    return checkInstanceOfExpression(node, leftType, rightType);
                case 87 /* InKeyword */:
                    return checkInExpression(node, leftType, rightType);
                case 49 /* AmpersandAmpersandToken */:
                    return rightType;
                case 50 /* BarBarToken */:
                    return getUnionType([leftType, rightType]);
                case 54 /* EqualsToken */:
                    checkAssignmentOperator(rightType);
                    return rightType;
                case 23 /* CommaToken */:
                    return rightType;
            }
            // Return true if there was no error, false if there was an error.
            function checkForDisallowedESSymbolOperand(operator) {
                var offendingSymbolOperand = someConstituentTypeHasKind(leftType, 2097152 /* ESSymbol */) ? node.left :
                    someConstituentTypeHasKind(rightType, 2097152 /* ESSymbol */) ? node.right :
                        undefined;
                if (offendingSymbolOperand) {
                    error(offendingSymbolOperand, ts.Diagnostics.The_0_operator_cannot_be_applied_to_type_symbol, ts.tokenToString(operator));
                    return false;
                }
                return true;
            }
            function getSuggestedBooleanOperator(operator) {
                switch (operator) {
                    case 45 /* BarToken */:
                    case 64 /* BarEqualsToken */:
                        return 50 /* BarBarToken */;
                    case 46 /* CaretToken */:
                    case 65 /* CaretEqualsToken */:
                        return 32 /* ExclamationEqualsEqualsToken */;
                    case 44 /* AmpersandToken */:
                    case 63 /* AmpersandEqualsToken */:
                        return 49 /* AmpersandAmpersandToken */;
                    default:
                        return undefined;
                }
            }
            function checkAssignmentOperator(valueType) {
                if (produceDiagnostics && operator >= 54 /* FirstAssignment */ && operator <= 65 /* LastAssignment */) {
                    // TypeScript 1.0 spec (April 2014): 4.17
                    // An assignment of the form
                    //    VarExpr = ValueExpr
                    // requires VarExpr to be classified as a reference
                    // A compound assignment furthermore requires VarExpr to be classified as a reference (section 4.1)
                    // and the type of the non - compound operation to be assignable to the type of VarExpr.
                    var ok = checkReferenceExpression(node.left, ts.Diagnostics.Invalid_left_hand_side_of_assignment_expression, ts.Diagnostics.Left_hand_side_of_assignment_expression_cannot_be_a_constant);
                    // Use default messages
                    if (ok) {
                        // to avoid cascading errors check assignability only if 'isReference' check succeeded and no errors were reported
                        checkTypeAssignableTo(valueType, leftType, node.left, undefined);
                    }
                }
            }
            function reportOperatorError() {
                error(node, ts.Diagnostics.Operator_0_cannot_be_applied_to_types_1_and_2, ts.tokenToString(node.operatorToken.kind), typeToString(leftType), typeToString(rightType));
            }
        }
        function isYieldExpressionInClass(node) {
            var current = node;
            var parent = node.parent;
            while (parent) {
                if (ts.isFunctionLike(parent) && current === parent.body) {
                    return false;
                }
                else if (ts.isClassLike(current)) {
                    return true;
                }
                current = parent;
                parent = parent.parent;
            }
            return false;
        }
        function checkYieldExpression(node) {
            // Grammar checking
            if (produceDiagnostics) {
                if (!(node.parserContextFlags & 2 /* Yield */) || isYieldExpressionInClass(node)) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.A_yield_expression_is_only_allowed_in_a_generator_body);
                }
                if (isInParameterInitializerBeforeContainingFunction(node)) {
                    error(node, ts.Diagnostics.yield_expressions_cannot_be_used_in_a_parameter_initializer);
                }
            }
            if (node.expression) {
                var func = ts.getContainingFunction(node);
                // If the user's code is syntactically correct, the func should always have a star. After all,
                // we are in a yield context.
                if (func && func.asteriskToken) {
                    var expressionType = checkExpressionCached(node.expression, undefined);
                    var expressionElementType;
                    var nodeIsYieldStar = !!node.asteriskToken;
                    if (nodeIsYieldStar) {
                        expressionElementType = checkElementTypeOfIterable(expressionType, node.expression);
                    }
                    // There is no point in doing an assignability check if the function
                    // has no explicit return type because the return type is directly computed
                    // from the yield expressions.
                    if (func.type) {
                        var signatureElementType = getElementTypeOfIterableIterator(getTypeFromTypeNode(func.type)) || anyType;
                        if (nodeIsYieldStar) {
                            checkTypeAssignableTo(expressionElementType, signatureElementType, node.expression, undefined);
                        }
                        else {
                            checkTypeAssignableTo(expressionType, signatureElementType, node.expression, undefined);
                        }
                    }
                }
            }
            // Both yield and yield* expressions have type 'any'
            return anyType;
        }
        function checkConditionalExpression(node, contextualMapper) {
            checkExpression(node.condition);
            var type1 = checkExpression(node.whenTrue, contextualMapper);
            var type2 = checkExpression(node.whenFalse, contextualMapper);
            return getUnionType([type1, type2]);
        }
        function checkTemplateExpression(node) {
            // We just want to check each expressions, but we are unconcerned with
            // the type of each expression, as any value may be coerced into a string.
            // It is worth asking whether this is what we really want though.
            // A place where we actually *are* concerned with the expressions' types are
            // in tagged templates.
            ts.forEach(node.templateSpans, function (templateSpan) {
                checkExpression(templateSpan.expression);
            });
            return stringType;
        }
        function checkExpressionWithContextualType(node, contextualType, contextualMapper) {
            var saveContextualType = node.contextualType;
            node.contextualType = contextualType;
            var result = checkExpression(node, contextualMapper);
            node.contextualType = saveContextualType;
            return result;
        }
        function checkExpressionCached(node, contextualMapper) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = checkExpression(node, contextualMapper);
            }
            return links.resolvedType;
        }
        function checkPropertyAssignment(node, contextualMapper) {
            // Do not use hasDynamicName here, because that returns false for well known symbols.
            // We want to perform checkComputedPropertyName for all computed properties, including
            // well known symbols.
            if (node.name.kind === 132 /* ComputedPropertyName */) {
                checkComputedPropertyName(node.name);
            }
            return checkExpression(node.initializer, contextualMapper);
        }
        function checkObjectLiteralMethod(node, contextualMapper) {
            // Grammar checking
            checkGrammarMethod(node);
            // Do not use hasDynamicName here, because that returns false for well known symbols.
            // We want to perform checkComputedPropertyName for all computed properties, including
            // well known symbols.
            if (node.name.kind === 132 /* ComputedPropertyName */) {
                checkComputedPropertyName(node.name);
            }
            var uninstantiatedType = checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper);
            return instantiateTypeWithSingleGenericCallSignature(node, uninstantiatedType, contextualMapper);
        }
        function instantiateTypeWithSingleGenericCallSignature(node, type, contextualMapper) {
            if (contextualMapper && contextualMapper !== identityMapper) {
                var signature = getSingleCallSignature(type);
                if (signature && signature.typeParameters) {
                    var contextualType = getContextualType(node);
                    if (contextualType) {
                        var contextualSignature = getSingleCallSignature(contextualType);
                        if (contextualSignature && !contextualSignature.typeParameters) {
                            return getOrCreateTypeFromSignature(instantiateSignatureInContextOf(signature, contextualSignature, contextualMapper));
                        }
                    }
                }
            }
            return type;
        }
        // Checks an expression and returns its type. The contextualMapper parameter serves two purposes: When
        // contextualMapper is not undefined and not equal to the identityMapper function object it indicates that the
        // expression is being inferentially typed (section 4.12.2 in spec) and provides the type mapper to use in
        // conjunction with the generic contextual type. When contextualMapper is equal to the identityMapper function
        // object, it serves as an indicator that all contained function and arrow expressions should be considered to
        // have the wildcard function type; this form of type check is used during overload resolution to exclude
        // contextually typed function and arrow expressions in the initial phase.
        function checkExpression(node, contextualMapper) {
            var type;
            if (node.kind === 131 /* QualifiedName */) {
                type = checkQualifiedName(node);
            }
            else {
                var uninstantiatedType = checkExpressionWorker(node, contextualMapper);
                type = instantiateTypeWithSingleGenericCallSignature(node, uninstantiatedType, contextualMapper);
            }
            if (isConstEnumObjectType(type)) {
                // enum object type for const enums are only permitted in:
                // - 'left' in property access
                // - 'object' in indexed access
                // - target in rhs of import statement
                var ok = (node.parent.kind === 161 /* PropertyAccessExpression */ && node.parent.expression === node) ||
                    (node.parent.kind === 162 /* ElementAccessExpression */ && node.parent.expression === node) ||
                    ((node.kind === 66 /* Identifier */ || node.kind === 131 /* QualifiedName */) && isInRightSideOfImportOrExportAssignment(node));
                if (!ok) {
                    error(node, ts.Diagnostics.const_enums_can_only_be_used_in_property_or_index_access_expressions_or_the_right_hand_side_of_an_import_declaration_or_export_assignment);
                }
            }
            return type;
        }
        function checkNumericLiteral(node) {
            // Grammar checking
            checkGrammarNumericLiteral(node);
            return numberType;
        }
        function checkExpressionWorker(node, contextualMapper) {
            switch (node.kind) {
                case 66 /* Identifier */:
                    return checkIdentifier(node);
                case 94 /* ThisKeyword */:
                    return checkThisExpression(node);
                case 92 /* SuperKeyword */:
                    return checkSuperExpression(node);
                case 90 /* NullKeyword */:
                    return nullType;
                case 96 /* TrueKeyword */:
                case 81 /* FalseKeyword */:
                    return booleanType;
                case 7 /* NumericLiteral */:
                    return checkNumericLiteral(node);
                case 178 /* TemplateExpression */:
                    return checkTemplateExpression(node);
                case 8 /* StringLiteral */:
                case 10 /* NoSubstitutionTemplateLiteral */:
                    return stringType;
                case 9 /* RegularExpressionLiteral */:
                    return globalRegExpType;
                case 159 /* ArrayLiteralExpression */:
                    return checkArrayLiteral(node, contextualMapper);
                case 160 /* ObjectLiteralExpression */:
                    return checkObjectLiteral(node, contextualMapper);
                case 161 /* PropertyAccessExpression */:
                    return checkPropertyAccessExpression(node);
                case 162 /* ElementAccessExpression */:
                    return checkIndexedAccess(node);
                case 163 /* CallExpression */:
                case 164 /* NewExpression */:
                    return checkCallExpression(node);
                case 165 /* TaggedTemplateExpression */:
                    return checkTaggedTemplateExpression(node);
                case 167 /* ParenthesizedExpression */:
                    return checkExpression(node.expression, contextualMapper);
                case 181 /* ClassExpression */:
                    return checkClassExpression(node);
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                    return checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper);
                case 171 /* TypeOfExpression */:
                    return checkTypeOfExpression(node);
                case 166 /* TypeAssertionExpression */:
                case 184 /* AsExpression */:
                    return checkAssertion(node);
                case 170 /* DeleteExpression */:
                    return checkDeleteExpression(node);
                case 172 /* VoidExpression */:
                    return checkVoidExpression(node);
                case 173 /* AwaitExpression */:
                    return checkAwaitExpression(node);
                case 174 /* PrefixUnaryExpression */:
                    return checkPrefixUnaryExpression(node);
                case 175 /* PostfixUnaryExpression */:
                    return checkPostfixUnaryExpression(node);
                case 176 /* BinaryExpression */:
                    return checkBinaryExpression(node, contextualMapper);
                case 177 /* ConditionalExpression */:
                    return checkConditionalExpression(node, contextualMapper);
                case 180 /* SpreadElementExpression */:
                    return checkSpreadElementExpression(node, contextualMapper);
                case 182 /* OmittedExpression */:
                    return undefinedType;
                case 179 /* YieldExpression */:
                    return checkYieldExpression(node);
                case 235 /* JsxExpression */:
                    return checkJsxExpression(node);
                case 228 /* JsxElement */:
                    return checkJsxElement(node);
                case 229 /* JsxSelfClosingElement */:
                    return checkJsxSelfClosingElement(node);
                case 230 /* JsxOpeningElement */:
                    ts.Debug.fail("Shouldn't ever directly check a JsxOpeningElement");
            }
            return unknownType;
        }
        // DECLARATION AND STATEMENT TYPE CHECKING
        function checkTypeParameter(node) {
            // Grammar Checking
            if (node.expression) {
                grammarErrorOnFirstToken(node.expression, ts.Diagnostics.Type_expected);
            }
            checkSourceElement(node.constraint);
            if (produceDiagnostics) {
                checkTypeParameterHasIllegalReferencesInConstraint(node);
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Type_parameter_name_cannot_be_0);
            }
            // TODO: Check multiple declarations are identical
        }
        function checkParameter(node) {
            // Grammar checking
            // It is a SyntaxError if the Identifier "eval" or the Identifier "arguments" occurs as the
            // Identifier in a PropertySetParameterList of a PropertyAssignment that is contained in strict code
            // or if its FunctionBody is strict code(11.1.5).
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node);
            checkVariableLikeDeclaration(node);
            var func = ts.getContainingFunction(node);
            if (node.flags & 112 /* AccessibilityModifier */) {
                func = ts.getContainingFunction(node);
                if (!(func.kind === 140 /* Constructor */ && ts.nodeIsPresent(func.body))) {
                    error(node, ts.Diagnostics.A_parameter_property_is_only_allowed_in_a_constructor_implementation);
                }
            }
            if (node.questionToken && ts.isBindingPattern(node.name) && func.body) {
                error(node, ts.Diagnostics.A_binding_pattern_parameter_cannot_be_optional_in_an_implementation_signature);
            }
            // Only check rest parameter type if it's not a binding pattern. Since binding patterns are
            // not allowed in a rest parameter, we already have an error from checkGrammarParameterList.
            if (node.dotDotDotToken && !ts.isBindingPattern(node.name) && !isArrayType(getTypeOfSymbol(node.symbol))) {
                error(node, ts.Diagnostics.A_rest_parameter_must_be_of_an_array_type);
            }
        }
        function isSyntacticallyValidGenerator(node) {
            if (!node.asteriskToken || !node.body) {
                return false;
            }
            return node.kind === 139 /* MethodDeclaration */ ||
                node.kind === 208 /* FunctionDeclaration */ ||
                node.kind === 168 /* FunctionExpression */;
        }
        function getTypePredicateParameterIndex(parameterList, parameter) {
            if (parameterList) {
                for (var i = 0; i < parameterList.length; i++) {
                    var param = parameterList[i];
                    if (param.name.kind === 66 /* Identifier */ &&
                        param.name.text === parameter.text) {
                        return i;
                    }
                }
            }
            return -1;
        }
        function isInLegalTypePredicatePosition(node) {
            switch (node.parent.kind) {
                case 169 /* ArrowFunction */:
                case 143 /* CallSignature */:
                case 208 /* FunctionDeclaration */:
                case 168 /* FunctionExpression */:
                case 148 /* FunctionType */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                    return node === node.parent.type;
            }
            return false;
        }
        function checkSignatureDeclaration(node) {
            // Grammar checking
            if (node.kind === 145 /* IndexSignature */) {
                checkGrammarIndexSignature(node);
            }
            else if (node.kind === 148 /* FunctionType */ || node.kind === 208 /* FunctionDeclaration */ || node.kind === 149 /* ConstructorType */ ||
                node.kind === 143 /* CallSignature */ || node.kind === 140 /* Constructor */ ||
                node.kind === 144 /* ConstructSignature */) {
                checkGrammarFunctionLikeDeclaration(node);
            }
            checkTypeParameters(node.typeParameters);
            ts.forEach(node.parameters, checkParameter);
            if (node.type) {
                if (node.type.kind === 146 /* TypePredicate */) {
                    var typePredicate = getSignatureFromDeclaration(node).typePredicate;
                    var typePredicateNode = node.type;
                    if (isInLegalTypePredicatePosition(typePredicateNode)) {
                        if (typePredicate.parameterIndex >= 0) {
                            if (node.parameters[typePredicate.parameterIndex].dotDotDotToken) {
                                error(typePredicateNode.parameterName, ts.Diagnostics.A_type_predicate_cannot_reference_a_rest_parameter);
                            }
                            else {
                                checkTypeAssignableTo(typePredicate.type, getTypeAtLocation(node.parameters[typePredicate.parameterIndex]), typePredicateNode.type);
                            }
                        }
                        else if (typePredicateNode.parameterName) {
                            var hasReportedError = false;
                            for (var _i = 0, _a = node.parameters; _i < _a.length; _i++) {
                                var param = _a[_i];
                                if (hasReportedError) {
                                    break;
                                }
                                if (param.name.kind === 156 /* ObjectBindingPattern */ ||
                                    param.name.kind === 157 /* ArrayBindingPattern */) {
                                    (function checkBindingPattern(pattern) {
                                        for (var _i = 0, _a = pattern.elements; _i < _a.length; _i++) {
                                            var element = _a[_i];
                                            if (element.name.kind === 66 /* Identifier */ &&
                                                element.name.text === typePredicate.parameterName) {
                                                error(typePredicateNode.parameterName, ts.Diagnostics.A_type_predicate_cannot_reference_element_0_in_a_binding_pattern, typePredicate.parameterName);
                                                hasReportedError = true;
                                                break;
                                            }
                                            else if (element.name.kind === 157 /* ArrayBindingPattern */ ||
                                                element.name.kind === 156 /* ObjectBindingPattern */) {
                                                checkBindingPattern(element.name);
                                            }
                                        }
                                    })(param.name);
                                }
                            }
                            if (!hasReportedError) {
                                error(typePredicateNode.parameterName, ts.Diagnostics.Cannot_find_parameter_0, typePredicate.parameterName);
                            }
                        }
                    }
                    else {
                        error(typePredicateNode, ts.Diagnostics.A_type_predicate_is_only_allowed_in_return_type_position_for_functions_and_methods);
                    }
                }
                else {
                    checkSourceElement(node.type);
                }
            }
            if (produceDiagnostics) {
                checkCollisionWithArgumentsInGeneratedCode(node);
                if (compilerOptions.noImplicitAny && !node.type) {
                    switch (node.kind) {
                        case 144 /* ConstructSignature */:
                            error(node, ts.Diagnostics.Construct_signature_which_lacks_return_type_annotation_implicitly_has_an_any_return_type);
                            break;
                        case 143 /* CallSignature */:
                            error(node, ts.Diagnostics.Call_signature_which_lacks_return_type_annotation_implicitly_has_an_any_return_type);
                            break;
                    }
                }
                if (node.type) {
                    if (languageVersion >= 2 /* ES6 */ && isSyntacticallyValidGenerator(node)) {
                        var returnType = getTypeFromTypeNode(node.type);
                        if (returnType === voidType) {
                            error(node.type, ts.Diagnostics.A_generator_cannot_have_a_void_type_annotation);
                        }
                        else {
                            var generatorElementType = getElementTypeOfIterableIterator(returnType) || anyType;
                            var iterableIteratorInstantiation = createIterableIteratorType(generatorElementType);
                            // Naively, one could check that IterableIterator<any> is assignable to the return type annotation.
                            // However, that would not catch the error in the following case.
                            //
                            //    interface BadGenerator extends Iterable<number>, Iterator<string> { }
                            //    function* g(): BadGenerator { } // Iterable and Iterator have different types!
                            //
                            checkTypeAssignableTo(iterableIteratorInstantiation, returnType, node.type);
                        }
                    }
                }
            }
            checkSpecializedSignatureDeclaration(node);
        }
        function checkTypeForDuplicateIndexSignatures(node) {
            if (node.kind === 210 /* InterfaceDeclaration */) {
                var nodeSymbol = getSymbolOfNode(node);
                // in case of merging interface declaration it is possible that we'll enter this check procedure several times for every declaration
                // to prevent this run check only for the first declaration of a given kind
                if (nodeSymbol.declarations.length > 0 && nodeSymbol.declarations[0] !== node) {
                    return;
                }
            }
            // TypeScript 1.0 spec (April 2014)
            // 3.7.4: An object type can contain at most one string index signature and one numeric index signature.
            // 8.5: A class declaration can have at most one string index member declaration and one numeric index member declaration
            var indexSymbol = getIndexSymbol(getSymbolOfNode(node));
            if (indexSymbol) {
                var seenNumericIndexer = false;
                var seenStringIndexer = false;
                for (var _i = 0, _a = indexSymbol.declarations; _i < _a.length; _i++) {
                    var decl = _a[_i];
                    var declaration = decl;
                    if (declaration.parameters.length === 1 && declaration.parameters[0].type) {
                        switch (declaration.parameters[0].type.kind) {
                            case 126 /* StringKeyword */:
                                if (!seenStringIndexer) {
                                    seenStringIndexer = true;
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Duplicate_string_index_signature);
                                }
                                break;
                            case 124 /* NumberKeyword */:
                                if (!seenNumericIndexer) {
                                    seenNumericIndexer = true;
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Duplicate_number_index_signature);
                                }
                                break;
                        }
                    }
                }
            }
        }
        function checkPropertyDeclaration(node) {
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarProperty(node) || checkGrammarComputedPropertyName(node.name);
            checkVariableLikeDeclaration(node);
        }
        function checkMethodDeclaration(node) {
            // Grammar checking
            checkGrammarMethod(node) || checkGrammarComputedPropertyName(node.name);
            // Grammar checking for modifiers is done inside the function checkGrammarFunctionLikeDeclaration
            checkFunctionLikeDeclaration(node);
        }
        function checkConstructorDeclaration(node) {
            // Grammar check on signature of constructor and modifier of the constructor is done in checkSignatureDeclaration function.
            checkSignatureDeclaration(node);
            // Grammar check for checking only related to constructoDeclaration
            checkGrammarConstructorTypeParameters(node) || checkGrammarConstructorTypeAnnotation(node);
            checkSourceElement(node.body);
            var symbol = getSymbolOfNode(node);
            var firstDeclaration = ts.getDeclarationOfKind(symbol, node.kind);
            // Only type check the symbol once
            if (node === firstDeclaration) {
                checkFunctionOrConstructorSymbol(symbol);
            }
            // exit early in the case of signature - super checks are not relevant to them
            if (ts.nodeIsMissing(node.body)) {
                return;
            }
            if (!produceDiagnostics) {
                return;
            }
            function isSuperCallExpression(n) {
                return n.kind === 163 /* CallExpression */ && n.expression.kind === 92 /* SuperKeyword */;
            }
            function containsSuperCall(n) {
                if (isSuperCallExpression(n)) {
                    return true;
                }
                switch (n.kind) {
                    case 168 /* FunctionExpression */:
                    case 208 /* FunctionDeclaration */:
                    case 169 /* ArrowFunction */:
                    case 160 /* ObjectLiteralExpression */: return false;
                    default: return ts.forEachChild(n, containsSuperCall);
                }
            }
            function markThisReferencesAsErrors(n) {
                if (n.kind === 94 /* ThisKeyword */) {
                    error(n, ts.Diagnostics.this_cannot_be_referenced_in_current_location);
                }
                else if (n.kind !== 168 /* FunctionExpression */ && n.kind !== 208 /* FunctionDeclaration */) {
                    ts.forEachChild(n, markThisReferencesAsErrors);
                }
            }
            function isInstancePropertyWithInitializer(n) {
                return n.kind === 137 /* PropertyDeclaration */ &&
                    !(n.flags & 128 /* Static */) &&
                    !!n.initializer;
            }
            // TS 1.0 spec (April 2014): 8.3.2
            // Constructors of classes with no extends clause may not contain super calls, whereas
            // constructors of derived classes must contain at least one super call somewhere in their function body.
            if (ts.getClassExtendsHeritageClauseElement(node.parent)) {
                if (containsSuperCall(node.body)) {
                    // The first statement in the body of a constructor must be a super call if both of the following are true:
                    // - The containing class is a derived class.
                    // - The constructor declares parameter properties
                    //   or the containing class declares instance member variables with initializers.
                    var superCallShouldBeFirst = ts.forEach(node.parent.members, isInstancePropertyWithInitializer) ||
                        ts.forEach(node.parameters, function (p) { return p.flags & (16 /* Public */ | 32 /* Private */ | 64 /* Protected */); });
                    if (superCallShouldBeFirst) {
                        var statements = node.body.statements;
                        if (!statements.length || statements[0].kind !== 190 /* ExpressionStatement */ || !isSuperCallExpression(statements[0].expression)) {
                            error(node, ts.Diagnostics.A_super_call_must_be_the_first_statement_in_the_constructor_when_a_class_contains_initialized_properties_or_has_parameter_properties);
                        }
                        else {
                            // In such a required super call, it is a compile-time error for argument expressions to reference this.
                            markThisReferencesAsErrors(statements[0].expression);
                        }
                    }
                }
                else {
                    error(node, ts.Diagnostics.Constructors_for_derived_classes_must_contain_a_super_call);
                }
            }
        }
        function checkAccessorDeclaration(node) {
            if (produceDiagnostics) {
                // Grammar checking accessors
                checkGrammarFunctionLikeDeclaration(node) || checkGrammarAccessor(node) || checkGrammarComputedPropertyName(node.name);
                if (node.kind === 141 /* GetAccessor */) {
                    if (!ts.isInAmbientContext(node) && ts.nodeIsPresent(node.body) && !(bodyContainsAReturnStatement(node.body) || bodyContainsSingleThrowStatement(node.body))) {
                        error(node.name, ts.Diagnostics.A_get_accessor_must_return_a_value_or_consist_of_a_single_throw_statement);
                    }
                }
                if (!ts.hasDynamicName(node)) {
                    // TypeScript 1.0 spec (April 2014): 8.4.3
                    // Accessors for the same member name must specify the same accessibility.
                    var otherKind = node.kind === 141 /* GetAccessor */ ? 142 /* SetAccessor */ : 141 /* GetAccessor */;
                    var otherAccessor = ts.getDeclarationOfKind(node.symbol, otherKind);
                    if (otherAccessor) {
                        if (((node.flags & 112 /* AccessibilityModifier */) !== (otherAccessor.flags & 112 /* AccessibilityModifier */))) {
                            error(node.name, ts.Diagnostics.Getter_and_setter_accessors_do_not_agree_in_visibility);
                        }
                        var currentAccessorType = getAnnotatedAccessorType(node);
                        var otherAccessorType = getAnnotatedAccessorType(otherAccessor);
                        // TypeScript 1.0 spec (April 2014): 4.5
                        // If both accessors include type annotations, the specified types must be identical.
                        if (currentAccessorType && otherAccessorType) {
                            if (!isTypeIdenticalTo(currentAccessorType, otherAccessorType)) {
                                error(node, ts.Diagnostics.get_and_set_accessor_must_have_the_same_type);
                            }
                        }
                    }
                }
                getTypeOfAccessors(getSymbolOfNode(node));
            }
            checkFunctionLikeDeclaration(node);
        }
        function checkMissingDeclaration(node) {
            checkDecorators(node);
        }
        function checkTypeArgumentConstraints(typeParameters, typeArguments) {
            var result = true;
            for (var i = 0; i < typeParameters.length; i++) {
                var constraint = getConstraintOfTypeParameter(typeParameters[i]);
                if (constraint) {
                    var typeArgument = typeArguments[i];
                    result = result && checkTypeAssignableTo(getTypeFromTypeNode(typeArgument), constraint, typeArgument, ts.Diagnostics.Type_0_does_not_satisfy_the_constraint_1);
                }
            }
            return result;
        }
        function checkTypeReferenceNode(node) {
            checkGrammarTypeArguments(node, node.typeArguments);
            var type = getTypeFromTypeReference(node);
            if (type !== unknownType && node.typeArguments) {
                // Do type argument local checks only if referenced type is successfully resolved
                ts.forEach(node.typeArguments, checkSourceElement);
                if (produceDiagnostics) {
                    var symbol = getNodeLinks(node).resolvedSymbol;
                    var typeParameters = symbol.flags & 524288 /* TypeAlias */ ? getSymbolLinks(symbol).typeParameters : type.target.localTypeParameters;
                    checkTypeArgumentConstraints(typeParameters, node.typeArguments);
                }
            }
        }
        function checkTypeQuery(node) {
            getTypeFromTypeQueryNode(node);
        }
        function checkTypeLiteral(node) {
            ts.forEach(node.members, checkSourceElement);
            if (produceDiagnostics) {
                var type = getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node);
                checkIndexConstraints(type);
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function checkArrayType(node) {
            checkSourceElement(node.elementType);
        }
        function checkTupleType(node) {
            // Grammar checking
            var hasErrorFromDisallowedTrailingComma = checkGrammarForDisallowedTrailingComma(node.elementTypes);
            if (!hasErrorFromDisallowedTrailingComma && node.elementTypes.length === 0) {
                grammarErrorOnNode(node, ts.Diagnostics.A_tuple_type_element_list_cannot_be_empty);
            }
            ts.forEach(node.elementTypes, checkSourceElement);
        }
        function checkUnionType(node) {
            ts.forEach(node.types, checkSourceElement);
        }
        function isPrivateWithinAmbient(node) {
            return (node.flags & 32 /* Private */) && ts.isInAmbientContext(node);
        }
        function checkSpecializedSignatureDeclaration(signatureDeclarationNode) {
            if (!produceDiagnostics) {
                return;
            }
            var signature = getSignatureFromDeclaration(signatureDeclarationNode);
            if (!signature.hasStringLiterals) {
                return;
            }
            // TypeScript 1.0 spec (April 2014): 3.7.2.2
            // Specialized signatures are not permitted in conjunction with a function body
            if (ts.nodeIsPresent(signatureDeclarationNode.body)) {
                error(signatureDeclarationNode, ts.Diagnostics.A_signature_with_an_implementation_cannot_use_a_string_literal_type);
                return;
            }
            // TypeScript 1.0 spec (April 2014): 3.7.2.4
            // Every specialized call or construct signature in an object type must be assignable
            // to at least one non-specialized call or construct signature in the same object type
            var signaturesToCheck;
            // Unnamed (call\construct) signatures in interfaces are inherited and not shadowed so examining just node symbol won't give complete answer.
            // Use declaring type to obtain full list of signatures.
            if (!signatureDeclarationNode.name && signatureDeclarationNode.parent && signatureDeclarationNode.parent.kind === 210 /* InterfaceDeclaration */) {
                ts.Debug.assert(signatureDeclarationNode.kind === 143 /* CallSignature */ || signatureDeclarationNode.kind === 144 /* ConstructSignature */);
                var signatureKind = signatureDeclarationNode.kind === 143 /* CallSignature */ ? 0 /* Call */ : 1 /* Construct */;
                var containingSymbol = getSymbolOfNode(signatureDeclarationNode.parent);
                var containingType = getDeclaredTypeOfSymbol(containingSymbol);
                signaturesToCheck = getSignaturesOfType(containingType, signatureKind);
            }
            else {
                signaturesToCheck = getSignaturesOfSymbol(getSymbolOfNode(signatureDeclarationNode));
            }
            for (var _i = 0; _i < signaturesToCheck.length; _i++) {
                var otherSignature = signaturesToCheck[_i];
                if (!otherSignature.hasStringLiterals && isSignatureAssignableTo(signature, otherSignature)) {
                    return;
                }
            }
            error(signatureDeclarationNode, ts.Diagnostics.Specialized_overload_signature_is_not_assignable_to_any_non_specialized_signature);
        }
        function getEffectiveDeclarationFlags(n, flagsToCheck) {
            var flags = ts.getCombinedNodeFlags(n);
            if (n.parent.kind !== 210 /* InterfaceDeclaration */ && ts.isInAmbientContext(n)) {
                if (!(flags & 2 /* Ambient */)) {
                    // It is nested in an ambient context, which means it is automatically exported
                    flags |= 1 /* Export */;
                }
                flags |= 2 /* Ambient */;
            }
            return flags & flagsToCheck;
        }
        function checkFunctionOrConstructorSymbol(symbol) {
            if (!produceDiagnostics) {
                return;
            }
            function getCanonicalOverload(overloads, implementation) {
                // Consider the canonical set of flags to be the flags of the bodyDeclaration or the first declaration
                // Error on all deviations from this canonical set of flags
                // The caveat is that if some overloads are defined in lib.d.ts, we don't want to
                // report the errors on those. To achieve this, we will say that the implementation is
                // the canonical signature only if it is in the same container as the first overload
                var implementationSharesContainerWithFirstOverload = implementation !== undefined && implementation.parent === overloads[0].parent;
                return implementationSharesContainerWithFirstOverload ? implementation : overloads[0];
            }
            function checkFlagAgreementBetweenOverloads(overloads, implementation, flagsToCheck, someOverloadFlags, allOverloadFlags) {
                // Error if some overloads have a flag that is not shared by all overloads. To find the
                // deviations, we XOR someOverloadFlags with allOverloadFlags
                var someButNotAllOverloadFlags = someOverloadFlags ^ allOverloadFlags;
                if (someButNotAllOverloadFlags !== 0) {
                    var canonicalFlags = getEffectiveDeclarationFlags(getCanonicalOverload(overloads, implementation), flagsToCheck);
                    ts.forEach(overloads, function (o) {
                        var deviation = getEffectiveDeclarationFlags(o, flagsToCheck) ^ canonicalFlags;
                        if (deviation & 1 /* Export */) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_exported_or_not_exported);
                        }
                        else if (deviation & 2 /* Ambient */) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_ambient_or_non_ambient);
                        }
                        else if (deviation & (32 /* Private */ | 64 /* Protected */)) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_public_private_or_protected);
                        }
                    });
                }
            }
            function checkQuestionTokenAgreementBetweenOverloads(overloads, implementation, someHaveQuestionToken, allHaveQuestionToken) {
                if (someHaveQuestionToken !== allHaveQuestionToken) {
                    var canonicalHasQuestionToken = ts.hasQuestionToken(getCanonicalOverload(overloads, implementation));
                    ts.forEach(overloads, function (o) {
                        var deviation = ts.hasQuestionToken(o) !== canonicalHasQuestionToken;
                        if (deviation) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_optional_or_required);
                        }
                    });
                }
            }
            var flagsToCheck = 1 /* Export */ | 2 /* Ambient */ | 32 /* Private */ | 64 /* Protected */;
            var someNodeFlags = 0;
            var allNodeFlags = flagsToCheck;
            var someHaveQuestionToken = false;
            var allHaveQuestionToken = true;
            var hasOverloads = false;
            var bodyDeclaration;
            var lastSeenNonAmbientDeclaration;
            var previousDeclaration;
            var declarations = symbol.declarations;
            var isConstructor = (symbol.flags & 16384 /* Constructor */) !== 0;
            function reportImplementationExpectedError(node) {
                if (node.name && ts.nodeIsMissing(node.name)) {
                    return;
                }
                var seen = false;
                var subsequentNode = ts.forEachChild(node.parent, function (c) {
                    if (seen) {
                        return c;
                    }
                    else {
                        seen = c === node;
                    }
                });
                if (subsequentNode) {
                    if (subsequentNode.kind === node.kind) {
                        var errorNode_1 = subsequentNode.name || subsequentNode;
                        // TODO(jfreeman): These are methods, so handle computed name case
                        if (node.name && subsequentNode.name && node.name.text === subsequentNode.name.text) {
                            // the only situation when this is possible (same kind\same name but different symbol) - mixed static and instance class members
                            ts.Debug.assert(node.kind === 139 /* MethodDeclaration */ || node.kind === 138 /* MethodSignature */);
                            ts.Debug.assert((node.flags & 128 /* Static */) !== (subsequentNode.flags & 128 /* Static */));
                            var diagnostic = node.flags & 128 /* Static */ ? ts.Diagnostics.Function_overload_must_be_static : ts.Diagnostics.Function_overload_must_not_be_static;
                            error(errorNode_1, diagnostic);
                            return;
                        }
                        else if (ts.nodeIsPresent(subsequentNode.body)) {
                            error(errorNode_1, ts.Diagnostics.Function_implementation_name_must_be_0, ts.declarationNameToString(node.name));
                            return;
                        }
                    }
                }
                var errorNode = node.name || node;
                if (isConstructor) {
                    error(errorNode, ts.Diagnostics.Constructor_implementation_is_missing);
                }
                else {
                    error(errorNode, ts.Diagnostics.Function_implementation_is_missing_or_not_immediately_following_the_declaration);
                }
            }
            // when checking exported function declarations across modules check only duplicate implementations
            // names and consistency of modifiers are verified when we check local symbol
            var isExportSymbolInsideModule = symbol.parent && symbol.parent.flags & 1536 /* Module */;
            var duplicateFunctionDeclaration = false;
            var multipleConstructorImplementation = false;
            for (var _i = 0; _i < declarations.length; _i++) {
                var current = declarations[_i];
                var node = current;
                var inAmbientContext = ts.isInAmbientContext(node);
                var inAmbientContextOrInterface = node.parent.kind === 210 /* InterfaceDeclaration */ || node.parent.kind === 151 /* TypeLiteral */ || inAmbientContext;
                if (inAmbientContextOrInterface) {
                    // check if declarations are consecutive only if they are non-ambient
                    // 1. ambient declarations can be interleaved
                    // i.e. this is legal
                    //     declare function foo();
                    //     declare function bar();
                    //     declare function foo();
                    // 2. mixing ambient and non-ambient declarations is a separate error that will be reported - do not want to report an extra one
                    previousDeclaration = undefined;
                }
                if (node.kind === 208 /* FunctionDeclaration */ || node.kind === 139 /* MethodDeclaration */ || node.kind === 138 /* MethodSignature */ || node.kind === 140 /* Constructor */) {
                    var currentNodeFlags = getEffectiveDeclarationFlags(node, flagsToCheck);
                    someNodeFlags |= currentNodeFlags;
                    allNodeFlags &= currentNodeFlags;
                    someHaveQuestionToken = someHaveQuestionToken || ts.hasQuestionToken(node);
                    allHaveQuestionToken = allHaveQuestionToken && ts.hasQuestionToken(node);
                    if (ts.nodeIsPresent(node.body) && bodyDeclaration) {
                        if (isConstructor) {
                            multipleConstructorImplementation = true;
                        }
                        else {
                            duplicateFunctionDeclaration = true;
                        }
                    }
                    else if (!isExportSymbolInsideModule && previousDeclaration && previousDeclaration.parent === node.parent && previousDeclaration.end !== node.pos) {
                        reportImplementationExpectedError(previousDeclaration);
                    }
                    if (ts.nodeIsPresent(node.body)) {
                        if (!bodyDeclaration) {
                            bodyDeclaration = node;
                        }
                    }
                    else {
                        hasOverloads = true;
                    }
                    previousDeclaration = node;
                    if (!inAmbientContextOrInterface) {
                        lastSeenNonAmbientDeclaration = node;
                    }
                }
            }
            if (multipleConstructorImplementation) {
                ts.forEach(declarations, function (declaration) {
                    error(declaration, ts.Diagnostics.Multiple_constructor_implementations_are_not_allowed);
                });
            }
            if (duplicateFunctionDeclaration) {
                ts.forEach(declarations, function (declaration) {
                    error(declaration.name, ts.Diagnostics.Duplicate_function_implementation);
                });
            }
            if (!isExportSymbolInsideModule && lastSeenNonAmbientDeclaration && !lastSeenNonAmbientDeclaration.body) {
                reportImplementationExpectedError(lastSeenNonAmbientDeclaration);
            }
            if (hasOverloads) {
                checkFlagAgreementBetweenOverloads(declarations, bodyDeclaration, flagsToCheck, someNodeFlags, allNodeFlags);
                checkQuestionTokenAgreementBetweenOverloads(declarations, bodyDeclaration, someHaveQuestionToken, allHaveQuestionToken);
                if (bodyDeclaration) {
                    var signatures = getSignaturesOfSymbol(symbol);
                    var bodySignature = getSignatureFromDeclaration(bodyDeclaration);
                    // If the implementation signature has string literals, we will have reported an error in
                    // checkSpecializedSignatureDeclaration
                    if (!bodySignature.hasStringLiterals) {
                        // TypeScript 1.0 spec (April 2014): 6.1
                        // If a function declaration includes overloads, the overloads determine the call
                        // signatures of the type given to the function object
                        // and the function implementation signature must be assignable to that type
                        //
                        // TypeScript 1.0 spec (April 2014): 3.8.4
                        // Note that specialized call and construct signatures (section 3.7.2.4) are not significant when determining assignment compatibility
                        // Consider checking against specialized signatures too. Not doing so creates a type hole:
                        //
                        // function g(x: "hi", y: boolean);
                        // function g(x: string, y: {});
                        // function g(x: string, y: string) { }
                        //
                        // The implementation is completely unrelated to the specialized signature, yet we do not check this.
                        for (var _a = 0; _a < signatures.length; _a++) {
                            var signature = signatures[_a];
                            if (!signature.hasStringLiterals && !isSignatureAssignableTo(bodySignature, signature)) {
                                error(signature.declaration, ts.Diagnostics.Overload_signature_is_not_compatible_with_function_implementation);
                                break;
                            }
                        }
                    }
                }
            }
        }
        function checkExportsOnMergedDeclarations(node) {
            if (!produceDiagnostics) {
                return;
            }
            // Exports should be checked only if enclosing module contains both exported and non exported declarations.
            // In case if all declarations are non-exported check is unnecessary.
            // if localSymbol is defined on node then node itself is exported - check is required
            var symbol = node.localSymbol;
            if (!symbol) {
                // local symbol is undefined => this declaration is non-exported.
                // however symbol might contain other declarations that are exported
                symbol = getSymbolOfNode(node);
                if (!(symbol.flags & 7340032 /* Export */)) {
                    // this is a pure local symbol (all declarations are non-exported) - no need to check anything
                    return;
                }
            }
            // run the check only for the first declaration in the list
            if (ts.getDeclarationOfKind(symbol, node.kind) !== node) {
                return;
            }
            // we use SymbolFlags.ExportValue, SymbolFlags.ExportType and SymbolFlags.ExportNamespace
            // to denote disjoint declarationSpaces (without making new enum type).
            var exportedDeclarationSpaces = 0;
            var nonExportedDeclarationSpaces = 0;
            ts.forEach(symbol.declarations, function (d) {
                var declarationSpaces = getDeclarationSpaces(d);
                if (getEffectiveDeclarationFlags(d, 1 /* Export */)) {
                    exportedDeclarationSpaces |= declarationSpaces;
                }
                else {
                    nonExportedDeclarationSpaces |= declarationSpaces;
                }
            });
            var commonDeclarationSpace = exportedDeclarationSpaces & nonExportedDeclarationSpaces;
            if (commonDeclarationSpace) {
                // declaration spaces for exported and non-exported declarations intersect
                ts.forEach(symbol.declarations, function (d) {
                    if (getDeclarationSpaces(d) & commonDeclarationSpace) {
                        error(d.name, ts.Diagnostics.Individual_declarations_in_merged_declaration_0_must_be_all_exported_or_all_local, ts.declarationNameToString(d.name));
                    }
                });
            }
            function getDeclarationSpaces(d) {
                switch (d.kind) {
                    case 210 /* InterfaceDeclaration */:
                        return 2097152 /* ExportType */;
                    case 213 /* ModuleDeclaration */:
                        return d.name.kind === 8 /* StringLiteral */ || ts.getModuleInstanceState(d) !== 0 /* NonInstantiated */
                            ? 4194304 /* ExportNamespace */ | 1048576 /* ExportValue */
                            : 4194304 /* ExportNamespace */;
                    case 209 /* ClassDeclaration */:
                    case 212 /* EnumDeclaration */:
                        return 2097152 /* ExportType */ | 1048576 /* ExportValue */;
                    case 216 /* ImportEqualsDeclaration */:
                        var result = 0;
                        var target = resolveAlias(getSymbolOfNode(d));
                        ts.forEach(target.declarations, function (d) { result |= getDeclarationSpaces(d); });
                        return result;
                    default:
                        return 1048576 /* ExportValue */;
                }
            }
        }
        function checkNonThenableType(type, location, message) {
            if (!(type.flags & 1 /* Any */) && isTypeAssignableTo(type, getGlobalThenableType())) {
                if (location) {
                    if (!message) {
                        message = ts.Diagnostics.Operand_for_await_does_not_have_a_valid_callable_then_member;
                    }
                    error(location, message);
                }
                return unknownType;
            }
            return type;
        }
        /**
          * Gets the "promised type" of a promise.
          * @param type The type of the promise.
          * @remarks The "promised type" of a type is the type of the "value" parameter of the "onfulfilled" callback.
          */
        function getPromisedType(promise) {
            //
            //  { // promise
            //      then( // thenFunction
            //          onfulfilled: ( // onfulfilledParameterType
            //              value: T // valueParameterType
            //          ) => any
            //      ): any;
            //  }
            // 
            if (promise.flags & 1 /* Any */) {
                return undefined;
            }
            if ((promise.flags & 4096 /* Reference */) && promise.target === tryGetGlobalPromiseType()) {
                return promise.typeArguments[0];
            }
            var globalPromiseLikeType = getInstantiatedGlobalPromiseLikeType();
            if (globalPromiseLikeType === emptyObjectType || !isTypeAssignableTo(promise, globalPromiseLikeType)) {
                return undefined;
            }
            var thenFunction = getTypeOfPropertyOfType(promise, "then");
            if (thenFunction && (thenFunction.flags & 1 /* Any */)) {
                return undefined;
            }
            var thenSignatures = thenFunction ? getSignaturesOfType(thenFunction, 0 /* Call */) : emptyArray;
            if (thenSignatures.length === 0) {
                return undefined;
            }
            var onfulfilledParameterType = getUnionType(ts.map(thenSignatures, getTypeOfFirstParameterOfSignature));
            if (onfulfilledParameterType.flags & 1 /* Any */) {
                return undefined;
            }
            var onfulfilledParameterSignatures = getSignaturesOfType(onfulfilledParameterType, 0 /* Call */);
            if (onfulfilledParameterSignatures.length === 0) {
                return undefined;
            }
            var valueParameterType = getUnionType(ts.map(onfulfilledParameterSignatures, getTypeOfFirstParameterOfSignature));
            return valueParameterType;
        }
        function getTypeOfFirstParameterOfSignature(signature) {
            return getTypeAtPosition(signature, 0);
        }
        /**
          * Gets the "awaited type" of a type.
          * @param type The type to await.
          * @remarks The "awaited type" of an expression is its "promised type" if the expression is a
          * Promise-like type; otherwise, it is the type of the expression. This is used to reflect
          * The runtime behavior of the `await` keyword.
          */
        function getAwaitedType(type) {
            return checkAwaitedType(type, undefined, undefined);
        }
        function checkAwaitedType(type, location, message) {
            return checkAwaitedTypeWorker(type);
            function checkAwaitedTypeWorker(type) {
                if (type.flags & 16384 /* Union */) {
                    var types = [];
                    for (var _i = 0, _a = type.types; _i < _a.length; _i++) {
                        var constituentType = _a[_i];
                        types.push(checkAwaitedTypeWorker(constituentType));
                    }
                    return getUnionType(types);
                }
                else {
                    var promisedType = getPromisedType(type);
                    if (promisedType === undefined) {
                        // The type was not a PromiseLike, so it could not be unwrapped any further.
                        // As long as the type does not have a callable "then" property, it is 
                        // safe to return the type; otherwise, an error will have been reported in
                        // the call to checkNonThenableType and we will return unknownType.
                        //
                        // An example of a non-promise "thenable" might be:
                        //
                        //  await { then(): void {} }
                        //
                        // The "thenable" does not match the minimal definition for a PromiseLike. When
                        // a Promise/A+-compatible or ES6 promise tries to adopt this value, the promise
                        // will never settle. We treat this as an error to help flag an early indicator
                        // of a runtime problem. If the user wants to return this value from an async 
                        // function, they would need to wrap it in some other value. If they want it to
                        // be treated as a promise, they can cast to <any>.
                        return checkNonThenableType(type, location, message);
                    }
                    else {
                        if (type.id === promisedType.id || awaitedTypeStack.indexOf(promisedType.id) >= 0) {
                            // We have a bad actor in the form of a promise whose promised type is
                            // the same promise type, or a mutually recursive promise. Return the 
                            // unknown type as we cannot guess the shape. If this were the actual 
                            // case in the JavaScript, this Promise would never resolve.
                            //
                            // An example of a bad actor with a singly-recursive promise type might 
                            // be:
                            //
                            //  interface BadPromise {
                            //      then(
                            //          onfulfilled: (value: BadPromise) => any, 
                            //          onrejected: (error: any) => any): BadPromise;
                            //  }
                            //
                            // The above interface will pass the PromiseLike check, and return a 
                            // promised type of `BadPromise`. Since this is a self reference, we 
                            // don't want to keep recursing ad infinitum.
                            //
                            // An example of a bad actor in the form of a mutually-recursive 
                            // promise type might be:
                            //
                            //  interface BadPromiseA {
                            //      then(
                            //          onfulfilled: (value: BadPromiseB) => any, 
                            //          onrejected: (error: any) => any): BadPromiseB;
                            //  }
                            //
                            //  interface BadPromiseB {
                            //      then(
                            //          onfulfilled: (value: BadPromiseA) => any, 
                            //          onrejected: (error: any) => any): BadPromiseA;
                            //  }
                            //
                            if (location) {
                                error(location, ts.Diagnostics._0_is_referenced_directly_or_indirectly_in_the_fulfillment_callback_of_its_own_then_method, symbolToString(type.symbol));
                            }
                            return unknownType;
                        }
                        // Keep track of the type we're about to unwrap to avoid bad recursive promise types.
                        // See the comments above for more information.
                        awaitedTypeStack.push(type.id);
                        var awaitedType = checkAwaitedTypeWorker(promisedType);
                        awaitedTypeStack.pop();
                        return awaitedType;
                    }
                }
            }
        }
        /**
          * Checks the return type of an async function to ensure it is a compatible
          * Promise implementation.
          * @param node The signature to check
          * @param returnType The return type for the function
          * @remarks
          * This checks that an async function has a valid Promise-compatible return type,
          * and returns the *awaited type* of the promise. An async function has a valid
          * Promise-compatible return type if the resolved value of the return type has a
          * construct signature that takes in an `initializer` function that in turn supplies
          * a `resolve` function as one of its arguments and results in an object with a
          * callable `then` signature.
          */
        function checkAsyncFunctionReturnType(node) {
            var globalPromiseConstructorLikeType = getGlobalPromiseConstructorLikeType();
            if (globalPromiseConstructorLikeType === emptyObjectType) {
                // If we couldn't resolve the global PromiseConstructorLike type we cannot verify
                // compatibility with __awaiter.
                return unknownType;
            }
            // As part of our emit for an async function, we will need to emit the entity name of
            // the return type annotation as an expression. To meet the necessary runtime semantics
            // for __awaiter, we must also check that the type of the declaration (e.g. the static 
            // side or "constructor" of the promise type) is compatible `PromiseConstructorLike`.
            //
            // An example might be (from lib.es6.d.ts):
            //
            //  interface Promise<T> { ... }
            //  interface PromiseConstructor {
            //      new <T>(...): Promise<T>;
            //  } 
            //  declare var Promise: PromiseConstructor;
            //
            // When an async function declares a return type annotation of `Promise<T>`, we 
            // need to get the type of the `Promise` variable declaration above, which would 
            // be `PromiseConstructor`.
            //
            // The same case applies to a class:
            //
            //  declare class Promise<T> {
            //      constructor(...);
            //      then<U>(...): Promise<U>;
            //  }
            //
            // When we get the type of the `Promise` symbol here, we get the type of the static
            // side of the `Promise` class, which would be `{ new <T>(...): Promise<T> }`.
            var promiseType = getTypeFromTypeNode(node.type);
            if (promiseType === unknownType && compilerOptions.isolatedModules) {
                // If we are compiling with isolatedModules, we may not be able to resolve the 
                // type as a value. As such, we will just return unknownType;
                return unknownType;
            }
            var promiseConstructor = getMergedSymbol(promiseType.symbol);
            if (!promiseConstructor || !symbolIsValue(promiseConstructor)) {
                error(node, ts.Diagnostics.Type_0_is_not_a_valid_async_function_return_type, typeToString(promiseType));
                return unknownType;
            }
            // Validate the promise constructor type.
            var promiseConstructorType = getTypeOfSymbol(promiseConstructor);
            if (!checkTypeAssignableTo(promiseConstructorType, globalPromiseConstructorLikeType, node, ts.Diagnostics.Type_0_is_not_a_valid_async_function_return_type)) {
                return unknownType;
            }
            // Verify there is no local declaration that could collide with the promise constructor.
            var promiseName = ts.getEntityNameFromTypeNode(node.type);
            var root = getFirstIdentifier(promiseName);
            var rootSymbol = getSymbol(node.locals, root.text, 107455 /* Value */);
            if (rootSymbol) {
                error(rootSymbol.valueDeclaration, ts.Diagnostics.Duplicate_identifier_0_Compiler_uses_declaration_1_to_support_async_functions, root.text, getFullyQualifiedName(promiseConstructor));
                return unknownType;
            }
            // Get and return the awaited type of the return type.
            return checkAwaitedType(promiseType, node, ts.Diagnostics.An_async_function_or_method_must_have_a_valid_awaitable_return_type);
        }
        /** Check a decorator */
        function checkDecorator(node) {
            var signature = getResolvedSignature(node);
            var returnType = getReturnTypeOfSignature(signature);
            if (returnType.flags & 1 /* Any */) {
                return;
            }
            var expectedReturnType;
            var headMessage = getDiagnosticHeadMessageForDecoratorResolution(node);
            var errorInfo;
            switch (node.parent.kind) {
                case 209 /* ClassDeclaration */:
                    var classSymbol = getSymbolOfNode(node.parent);
                    var classConstructorType = getTypeOfSymbol(classSymbol);
                    expectedReturnType = getUnionType([classConstructorType, voidType]);
                    break;
                case 134 /* Parameter */:
                    expectedReturnType = voidType;
                    errorInfo = ts.chainDiagnosticMessages(errorInfo, ts.Diagnostics.The_return_type_of_a_parameter_decorator_function_must_be_either_void_or_any);
                    break;
                case 137 /* PropertyDeclaration */:
                    expectedReturnType = voidType;
                    errorInfo = ts.chainDiagnosticMessages(errorInfo, ts.Diagnostics.The_return_type_of_a_property_decorator_function_must_be_either_void_or_any);
                    break;
                case 139 /* MethodDeclaration */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    var methodType = getTypeOfNode(node.parent);
                    var descriptorType = createTypedPropertyDescriptorType(methodType);
                    expectedReturnType = getUnionType([descriptorType, voidType]);
                    break;
            }
            checkTypeAssignableTo(returnType, expectedReturnType, node, headMessage, errorInfo);
        }
        /** Checks a type reference node as an expression. */
        function checkTypeNodeAsExpression(node) {
            // When we are emitting type metadata for decorators, we need to try to check the type
            // as if it were an expression so that we can emit the type in a value position when we 
            // serialize the type metadata.
            if (node && node.kind === 147 /* TypeReference */) {
                var type = getTypeFromTypeNode(node);
                var shouldCheckIfUnknownType = type === unknownType && compilerOptions.isolatedModules;
                if (!type || (!shouldCheckIfUnknownType && type.flags & (2097279 /* Intrinsic */ | 132 /* NumberLike */ | 258 /* StringLike */))) {
                    return;
                }
                if (shouldCheckIfUnknownType || type.symbol.valueDeclaration) {
                    checkExpression(node.typeName);
                }
            }
        }
        /**
          * Checks the type annotation of an accessor declaration or property declaration as
          * an expression if it is a type reference to a type with a value declaration.
          */
        function checkTypeAnnotationAsExpression(node) {
            switch (node.kind) {
                case 137 /* PropertyDeclaration */:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 134 /* Parameter */:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 139 /* MethodDeclaration */:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 141 /* GetAccessor */:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 142 /* SetAccessor */:
                    checkTypeNodeAsExpression(getSetAccessorTypeAnnotationNode(node));
                    break;
            }
        }
        /** Checks the type annotation of the parameters of a function/method or the constructor of a class as expressions */
        function checkParameterTypeAnnotationsAsExpressions(node) {
            // ensure all type annotations with a value declaration are checked as an expression
            for (var _i = 0, _a = node.parameters; _i < _a.length; _i++) {
                var parameter = _a[_i];
                checkTypeAnnotationAsExpression(parameter);
            }
        }
        /** Check the decorators of a node */
        function checkDecorators(node) {
            if (!node.decorators) {
                return;
            }
            // skip this check for nodes that cannot have decorators. These should have already had an error reported by
            // checkGrammarDecorators.
            if (!ts.nodeCanBeDecorated(node)) {
                return;
            }
            if (!compilerOptions.experimentalDecorators) {
                error(node, ts.Diagnostics.Experimental_support_for_decorators_is_a_feature_that_is_subject_to_change_in_a_future_release_Specify_experimentalDecorators_to_remove_this_warning);
            }
            if (compilerOptions.emitDecoratorMetadata) {
                // we only need to perform these checks if we are emitting serialized type metadata for the target of a decorator.
                switch (node.kind) {
                    case 209 /* ClassDeclaration */:
                        var constructor = ts.getFirstConstructorWithBody(node);
                        if (constructor) {
                            checkParameterTypeAnnotationsAsExpressions(constructor);
                        }
                        break;
                    case 139 /* MethodDeclaration */:
                        checkParameterTypeAnnotationsAsExpressions(node);
                    // fall-through
                    case 142 /* SetAccessor */:
                    case 141 /* GetAccessor */:
                    case 137 /* PropertyDeclaration */:
                    case 134 /* Parameter */:
                        checkTypeAnnotationAsExpression(node);
                        break;
                }
            }
            emitDecorate = true;
            if (node.kind === 134 /* Parameter */) {
                emitParam = true;
            }
            ts.forEach(node.decorators, checkDecorator);
        }
        function checkFunctionDeclaration(node) {
            if (produceDiagnostics) {
                checkFunctionLikeDeclaration(node) || checkGrammarForGenerator(node);
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
        }
        function checkFunctionLikeDeclaration(node) {
            checkDecorators(node);
            checkSignatureDeclaration(node);
            var isAsync = ts.isAsyncFunctionLike(node);
            if (isAsync) {
                if (!compilerOptions.experimentalAsyncFunctions) {
                    error(node, ts.Diagnostics.Experimental_support_for_async_functions_is_a_feature_that_is_subject_to_change_in_a_future_release_Specify_experimentalAsyncFunctions_to_remove_this_warning);
                }
                emitAwaiter = true;
            }
            // Do not use hasDynamicName here, because that returns false for well known symbols.
            // We want to perform checkComputedPropertyName for all computed properties, including
            // well known symbols.
            if (node.name && node.name.kind === 132 /* ComputedPropertyName */) {
                // This check will account for methods in class/interface declarations,
                // as well as accessors in classes/object literals
                checkComputedPropertyName(node.name);
            }
            if (!ts.hasDynamicName(node)) {
                // first we want to check the local symbol that contain this declaration
                // - if node.localSymbol !== undefined - this is current declaration is exported and localSymbol points to the local symbol
                // - if node.localSymbol === undefined - this node is non-exported so we can just pick the result of getSymbolOfNode
                var symbol = getSymbolOfNode(node);
                var localSymbol = node.localSymbol || symbol;
                var firstDeclaration = ts.getDeclarationOfKind(localSymbol, node.kind);
                // Only type check the symbol once
                if (node === firstDeclaration) {
                    checkFunctionOrConstructorSymbol(localSymbol);
                }
                if (symbol.parent) {
                    // run check once for the first declaration
                    if (ts.getDeclarationOfKind(symbol, node.kind) === node) {
                        // run check on export symbol to check that modifiers agree across all exported declarations
                        checkFunctionOrConstructorSymbol(symbol);
                    }
                }
            }
            checkSourceElement(node.body);
            if (node.type && !isAccessor(node.kind) && !node.asteriskToken) {
                var returnType = getTypeFromTypeNode(node.type);
                var promisedType;
                if (isAsync) {
                    promisedType = checkAsyncFunctionReturnType(node);
                }
                checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(node, isAsync ? promisedType : returnType);
            }
            if (produceDiagnostics && !node.type) {
                // Report an implicit any error if there is no body, no explicit return type, and node is not a private method
                // in an ambient context
                if (compilerOptions.noImplicitAny && ts.nodeIsMissing(node.body) && !isPrivateWithinAmbient(node)) {
                    reportImplicitAnyError(node, anyType);
                }
                if (node.asteriskToken && ts.nodeIsPresent(node.body)) {
                    // A generator with a body and no type annotation can still cause errors. It can error if the
                    // yielded values have no common supertype, or it can give an implicit any error if it has no
                    // yielded values. The only way to trigger these errors is to try checking its return type.
                    getReturnTypeOfSignature(getSignatureFromDeclaration(node));
                }
            }
        }
        function checkBlock(node) {
            // Grammar checking for SyntaxKind.Block
            if (node.kind === 187 /* Block */) {
                checkGrammarStatementInAmbientContext(node);
            }
            ts.forEach(node.statements, checkSourceElement);
            if (ts.isFunctionBlock(node) || node.kind === 214 /* ModuleBlock */) {
                checkFunctionAndClassExpressionBodies(node);
            }
        }
        function checkCollisionWithArgumentsInGeneratedCode(node) {
            // no rest parameters \ declaration context \ overload - no codegen impact
            if (!ts.hasRestParameter(node) || ts.isInAmbientContext(node) || ts.nodeIsMissing(node.body)) {
                return;
            }
            ts.forEach(node.parameters, function (p) {
                if (p.name && !ts.isBindingPattern(p.name) && p.name.text === argumentsSymbol.name) {
                    error(p, ts.Diagnostics.Duplicate_identifier_arguments_Compiler_uses_arguments_to_initialize_rest_parameters);
                }
            });
        }
        function needCollisionCheckForIdentifier(node, identifier, name) {
            if (!(identifier && identifier.text === name)) {
                return false;
            }
            if (node.kind === 137 /* PropertyDeclaration */ ||
                node.kind === 136 /* PropertySignature */ ||
                node.kind === 139 /* MethodDeclaration */ ||
                node.kind === 138 /* MethodSignature */ ||
                node.kind === 141 /* GetAccessor */ ||
                node.kind === 142 /* SetAccessor */) {
                // it is ok to have member named '_super' or '_this' - member access is always qualified
                return false;
            }
            if (ts.isInAmbientContext(node)) {
                // ambient context - no codegen impact
                return false;
            }
            var root = ts.getRootDeclaration(node);
            if (root.kind === 134 /* Parameter */ && ts.nodeIsMissing(root.parent.body)) {
                // just an overload - no codegen impact
                return false;
            }
            return true;
        }
        function checkCollisionWithCapturedThisVariable(node, name) {
            if (needCollisionCheckForIdentifier(node, name, "_this")) {
                potentialThisCollisions.push(node);
            }
        }
        // this function will run after checking the source file so 'CaptureThis' is correct for all nodes
        function checkIfThisIsCapturedInEnclosingScope(node) {
            var current = node;
            while (current) {
                if (getNodeCheckFlags(current) & 4 /* CaptureThis */) {
                    var isDeclaration_1 = node.kind !== 66 /* Identifier */;
                    if (isDeclaration_1) {
                        error(node.name, ts.Diagnostics.Duplicate_identifier_this_Compiler_uses_variable_declaration_this_to_capture_this_reference);
                    }
                    else {
                        error(node, ts.Diagnostics.Expression_resolves_to_variable_declaration_this_that_compiler_uses_to_capture_this_reference);
                    }
                    return;
                }
                current = current.parent;
            }
        }
        function checkCollisionWithCapturedSuperVariable(node, name) {
            if (!needCollisionCheckForIdentifier(node, name, "_super")) {
                return;
            }
            // bubble up and find containing type
            var enclosingClass = ts.getContainingClass(node);
            // if containing type was not found or it is ambient - exit (no codegen)
            if (!enclosingClass || ts.isInAmbientContext(enclosingClass)) {
                return;
            }
            if (ts.getClassExtendsHeritageClauseElement(enclosingClass)) {
                var isDeclaration_2 = node.kind !== 66 /* Identifier */;
                if (isDeclaration_2) {
                    error(node, ts.Diagnostics.Duplicate_identifier_super_Compiler_uses_super_to_capture_base_class_reference);
                }
                else {
                    error(node, ts.Diagnostics.Expression_resolves_to_super_that_compiler_uses_to_capture_base_class_reference);
                }
            }
        }
        function checkCollisionWithRequireExportsInGeneratedCode(node, name) {
            if (!needCollisionCheckForIdentifier(node, name, "require") && !needCollisionCheckForIdentifier(node, name, "exports")) {
                return;
            }
            // Uninstantiated modules shouldnt do this check
            if (node.kind === 213 /* ModuleDeclaration */ && ts.getModuleInstanceState(node) !== 1 /* Instantiated */) {
                return;
            }
            // In case of variable declaration, node.parent is variable statement so look at the variable statement's parent
            var parent = getDeclarationContainer(node);
            if (parent.kind === 243 /* SourceFile */ && ts.isExternalModule(parent)) {
                // If the declaration happens to be in external module, report error that require and exports are reserved keywords
                error(name, ts.Diagnostics.Duplicate_identifier_0_Compiler_reserves_name_1_in_top_level_scope_of_a_module, ts.declarationNameToString(name), ts.declarationNameToString(name));
            }
        }
        function checkVarDeclaredNamesNotShadowed(node) {
            // - ScriptBody : StatementList
            // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList
            // also occurs in the VarDeclaredNames of StatementList.
            // - Block : { StatementList }
            // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList
            // also occurs in the VarDeclaredNames of StatementList.
            // Variable declarations are hoisted to the top of their function scope. They can shadow
            // block scoped declarations, which bind tighter. this will not be flagged as duplicate definition
            // by the binder as the declaration scope is different.
            // A non-initialized declaration is a no-op as the block declaration will resolve before the var
            // declaration. the problem is if the declaration has an initializer. this will act as a write to the
            // block declared value. this is fine for let, but not const.
            // Only consider declarations with initializers, uninitialized let declarations will not
            // step on a let/const variable.
            // Do not consider let and const declarations, as duplicate block-scoped declarations
            // are handled by the binder.
            // We are only looking for let declarations that step on let\const declarations from a
            // different scope. e.g.:
            //      {
            //          const x = 0; // localDeclarationSymbol obtained after name resolution will correspond to this declaration
            //          let x = 0; // symbol for this declaration will be 'symbol'
            //      }
            // skip block-scoped variables and parameters
            if ((ts.getCombinedNodeFlags(node) & 12288 /* BlockScoped */) !== 0 || ts.isParameterDeclaration(node)) {
                return;
            }
            // skip variable declarations that don't have initializers
            // NOTE: in ES6 spec initializer is required in variable declarations where name is binding pattern
            // so we'll always treat binding elements as initialized
            if (node.kind === 206 /* VariableDeclaration */ && !node.initializer) {
                return;
            }
            var symbol = getSymbolOfNode(node);
            if (symbol.flags & 1 /* FunctionScopedVariable */) {
                var localDeclarationSymbol = resolveName(node, node.name.text, 3 /* Variable */, undefined, undefined);
                if (localDeclarationSymbol &&
                    localDeclarationSymbol !== symbol &&
                    localDeclarationSymbol.flags & 2 /* BlockScopedVariable */) {
                    if (getDeclarationFlagsFromSymbol(localDeclarationSymbol) & 12288 /* BlockScoped */) {
                        var varDeclList = ts.getAncestor(localDeclarationSymbol.valueDeclaration, 207 /* VariableDeclarationList */);
                        var container = varDeclList.parent.kind === 188 /* VariableStatement */ && varDeclList.parent.parent
                            ? varDeclList.parent.parent
                            : undefined;
                        // names of block-scoped and function scoped variables can collide only
                        // if block scoped variable is defined in the function\module\source file scope (because of variable hoisting)
                        var namesShareScope = container &&
                            (container.kind === 187 /* Block */ && ts.isFunctionLike(container.parent) ||
                                container.kind === 214 /* ModuleBlock */ ||
                                container.kind === 213 /* ModuleDeclaration */ ||
                                container.kind === 243 /* SourceFile */);
                        // here we know that function scoped variable is shadowed by block scoped one
                        // if they are defined in the same scope - binder has already reported redeclaration error
                        // otherwise if variable has an initializer - show error that initialization will fail
                        // since LHS will be block scoped name instead of function scoped
                        if (!namesShareScope) {
                            var name_6 = symbolToString(localDeclarationSymbol);
                            error(node, ts.Diagnostics.Cannot_initialize_outer_scoped_variable_0_in_the_same_scope_as_block_scoped_declaration_1, name_6, name_6);
                        }
                    }
                }
            }
        }
        // Check that a parameter initializer contains no references to parameters declared to the right of itself
        function checkParameterInitializer(node) {
            if (ts.getRootDeclaration(node).kind !== 134 /* Parameter */) {
                return;
            }
            var func = ts.getContainingFunction(node);
            visit(node.initializer);
            function visit(n) {
                if (n.kind === 66 /* Identifier */) {
                    var referencedSymbol = getNodeLinks(n).resolvedSymbol;
                    // check FunctionLikeDeclaration.locals (stores parameters\function local variable)
                    // if it contains entry with a specified name and if this entry matches the resolved symbol
                    if (referencedSymbol && referencedSymbol !== unknownSymbol && getSymbol(func.locals, referencedSymbol.name, 107455 /* Value */) === referencedSymbol) {
                        if (referencedSymbol.valueDeclaration.kind === 134 /* Parameter */) {
                            if (referencedSymbol.valueDeclaration === node) {
                                error(n, ts.Diagnostics.Parameter_0_cannot_be_referenced_in_its_initializer, ts.declarationNameToString(node.name));
                                return;
                            }
                            if (referencedSymbol.valueDeclaration.pos < node.pos) {
                                // legal case - parameter initializer references some parameter strictly on left of current parameter declaration
                                return;
                            }
                        }
                        error(n, ts.Diagnostics.Initializer_of_parameter_0_cannot_reference_identifier_1_declared_after_it, ts.declarationNameToString(node.name), ts.declarationNameToString(n));
                    }
                }
                else {
                    ts.forEachChild(n, visit);
                }
            }
        }
        // Check variable, parameter, or property declaration
        function checkVariableLikeDeclaration(node) {
            checkDecorators(node);
            checkSourceElement(node.type);
            // For a computed property, just check the initializer and exit
            // Do not use hasDynamicName here, because that returns false for well known symbols.
            // We want to perform checkComputedPropertyName for all computed properties, including
            // well known symbols.
            if (node.name.kind === 132 /* ComputedPropertyName */) {
                checkComputedPropertyName(node.name);
                if (node.initializer) {
                    checkExpressionCached(node.initializer);
                }
            }
            // For a binding pattern, check contained binding elements
            if (ts.isBindingPattern(node.name)) {
                ts.forEach(node.name.elements, checkSourceElement);
            }
            // For a parameter declaration with an initializer, error and exit if the containing function doesn't have a body
            if (node.initializer && ts.getRootDeclaration(node).kind === 134 /* Parameter */ && ts.nodeIsMissing(ts.getContainingFunction(node).body)) {
                error(node, ts.Diagnostics.A_parameter_initializer_is_only_allowed_in_a_function_or_constructor_implementation);
                return;
            }
            // For a binding pattern, validate the initializer and exit
            if (ts.isBindingPattern(node.name)) {
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), getWidenedTypeForVariableLikeDeclaration(node), node, undefined);
                    checkParameterInitializer(node);
                }
                return;
            }
            var symbol = getSymbolOfNode(node);
            var type = getTypeOfVariableOrParameterOrProperty(symbol);
            if (node === symbol.valueDeclaration) {
                // Node is the primary declaration of the symbol, just validate the initializer
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), type, node, undefined);
                    checkParameterInitializer(node);
                }
            }
            else {
                // Node is a secondary declaration, check that type is identical to primary declaration and check that
                // initializer is consistent with type associated with the node
                var declarationType = getWidenedTypeForVariableLikeDeclaration(node);
                if (type !== unknownType && declarationType !== unknownType && !isTypeIdenticalTo(type, declarationType)) {
                    error(node.name, ts.Diagnostics.Subsequent_variable_declarations_must_have_the_same_type_Variable_0_must_be_of_type_1_but_here_has_type_2, ts.declarationNameToString(node.name), typeToString(type), typeToString(declarationType));
                }
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), declarationType, node, undefined);
                }
            }
            if (node.kind !== 137 /* PropertyDeclaration */ && node.kind !== 136 /* PropertySignature */) {
                // We know we don't have a binding pattern or computed name here
                checkExportsOnMergedDeclarations(node);
                if (node.kind === 206 /* VariableDeclaration */ || node.kind === 158 /* BindingElement */) {
                    checkVarDeclaredNamesNotShadowed(node);
                }
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
        }
        function checkVariableDeclaration(node) {
            checkGrammarVariableDeclaration(node);
            return checkVariableLikeDeclaration(node);
        }
        function checkBindingElement(node) {
            checkGrammarBindingElement(node);
            return checkVariableLikeDeclaration(node);
        }
        function checkVariableStatement(node) {
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarVariableDeclarationList(node.declarationList) || checkGrammarForDisallowedLetOrConstStatement(node);
            ts.forEach(node.declarationList.declarations, checkSourceElement);
        }
        function checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) {
            if (node.modifiers) {
                if (inBlockOrObjectLiteralExpression(node)) {
                    if (ts.isAsyncFunctionLike(node)) {
                        if (node.modifiers.length > 1) {
                            return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                        }
                    }
                    else {
                        return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                    }
                }
            }
        }
        function inBlockOrObjectLiteralExpression(node) {
            while (node) {
                if (node.kind === 187 /* Block */ || node.kind === 160 /* ObjectLiteralExpression */) {
                    return true;
                }
                node = node.parent;
            }
            return false;
        }
        function checkExpressionStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
        }
        function checkIfStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
            checkSourceElement(node.thenStatement);
            checkSourceElement(node.elseStatement);
        }
        function checkDoStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            checkSourceElement(node.statement);
            checkExpression(node.expression);
        }
        function checkWhileStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
            checkSourceElement(node.statement);
        }
        function checkForStatement(node) {
            // Grammar checking
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.initializer && node.initializer.kind === 207 /* VariableDeclarationList */) {
                    checkGrammarVariableDeclarationList(node.initializer);
                }
            }
            if (node.initializer) {
                if (node.initializer.kind === 207 /* VariableDeclarationList */) {
                    ts.forEach(node.initializer.declarations, checkVariableDeclaration);
                }
                else {
                    checkExpression(node.initializer);
                }
            }
            if (node.condition)
                checkExpression(node.condition);
            if (node.incrementor)
                checkExpression(node.incrementor);
            checkSourceElement(node.statement);
        }
        function checkForOfStatement(node) {
            checkGrammarForInOrForOfStatement(node);
            // Check the LHS and RHS
            // If the LHS is a declaration, just check it as a variable declaration, which will in turn check the RHS
            // via checkRightHandSideOfForOf.
            // If the LHS is an expression, check the LHS, as a destructuring assignment or as a reference.
            // Then check that the RHS is assignable to it.
            if (node.initializer.kind === 207 /* VariableDeclarationList */) {
                checkForInOrForOfVariableDeclaration(node);
            }
            else {
                var varExpr = node.initializer;
                var iteratedType = checkRightHandSideOfForOf(node.expression);
                // There may be a destructuring assignment on the left side
                if (varExpr.kind === 159 /* ArrayLiteralExpression */ || varExpr.kind === 160 /* ObjectLiteralExpression */) {
                    // iteratedType may be undefined. In this case, we still want to check the structure of
                    // varExpr, in particular making sure it's a valid LeftHandSideExpression. But we'd like
                    // to short circuit the type relation checking as much as possible, so we pass the unknownType.
                    checkDestructuringAssignment(varExpr, iteratedType || unknownType);
                }
                else {
                    var leftType = checkExpression(varExpr);
                    checkReferenceExpression(varExpr, ts.Diagnostics.Invalid_left_hand_side_in_for_of_statement, 
                    /*constantVariableMessage*/ ts.Diagnostics.The_left_hand_side_of_a_for_of_statement_cannot_be_a_previously_defined_constant);
                    // iteratedType will be undefined if the rightType was missing properties/signatures
                    // required to get its iteratedType (like [Symbol.iterator] or next). This may be
                    // because we accessed properties from anyType, or it may have led to an error inside
                    // getElementTypeOfIterable.
                    if (iteratedType) {
                        checkTypeAssignableTo(iteratedType, leftType, varExpr, undefined);
                    }
                }
            }
            checkSourceElement(node.statement);
        }
        function checkForInStatement(node) {
            // Grammar checking
            checkGrammarForInOrForOfStatement(node);
            // TypeScript 1.0 spec  (April 2014): 5.4
            // In a 'for-in' statement of the form
            // for (let VarDecl in Expr) Statement
            //   VarDecl must be a variable declaration without a type annotation that declares a variable of type Any,
            //   and Expr must be an expression of type Any, an object type, or a type parameter type.
            if (node.initializer.kind === 207 /* VariableDeclarationList */) {
                var variable = node.initializer.declarations[0];
                if (variable && ts.isBindingPattern(variable.name)) {
                    error(variable.name, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_destructuring_pattern);
                }
                checkForInOrForOfVariableDeclaration(node);
            }
            else {
                // In a 'for-in' statement of the form
                // for (Var in Expr) Statement
                //   Var must be an expression classified as a reference of type Any or the String primitive type,
                //   and Expr must be an expression of type Any, an object type, or a type parameter type.
                var varExpr = node.initializer;
                var leftType = checkExpression(varExpr);
                if (varExpr.kind === 159 /* ArrayLiteralExpression */ || varExpr.kind === 160 /* ObjectLiteralExpression */) {
                    error(varExpr, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_destructuring_pattern);
                }
                else if (!isTypeAnyOrAllConstituentTypesHaveKind(leftType, 258 /* StringLike */)) {
                    error(varExpr, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_must_be_of_type_string_or_any);
                }
                else {
                    // run check only former check succeeded to avoid cascading errors
                    checkReferenceExpression(varExpr, ts.Diagnostics.Invalid_left_hand_side_in_for_in_statement, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_previously_defined_constant);
                }
            }
            var rightType = checkExpression(node.expression);
            // unknownType is returned i.e. if node.expression is identifier whose name cannot be resolved
            // in this case error about missing name is already reported - do not report extra one
            if (!isTypeAnyOrAllConstituentTypesHaveKind(rightType, 48128 /* ObjectType */ | 512 /* TypeParameter */)) {
                error(node.expression, ts.Diagnostics.The_right_hand_side_of_a_for_in_statement_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            checkSourceElement(node.statement);
        }
        function checkForInOrForOfVariableDeclaration(iterationStatement) {
            var variableDeclarationList = iterationStatement.initializer;
            // checkGrammarForInOrForOfStatement will check that there is exactly one declaration.
            if (variableDeclarationList.declarations.length >= 1) {
                var decl = variableDeclarationList.declarations[0];
                checkVariableDeclaration(decl);
            }
        }
        function checkRightHandSideOfForOf(rhsExpression) {
            var expressionType = getTypeOfExpression(rhsExpression);
            return checkIteratedTypeOrElementType(expressionType, rhsExpression, true);
        }
        function checkIteratedTypeOrElementType(inputType, errorNode, allowStringInput) {
            if (isTypeAny(inputType)) {
                return inputType;
            }
            if (languageVersion >= 2 /* ES6 */) {
                return checkElementTypeOfIterable(inputType, errorNode);
            }
            if (allowStringInput) {
                return checkElementTypeOfArrayOrString(inputType, errorNode);
            }
            if (isArrayLikeType(inputType)) {
                var indexType = getIndexTypeOfType(inputType, 1 /* Number */);
                if (indexType) {
                    return indexType;
                }
            }
            error(errorNode, ts.Diagnostics.Type_0_is_not_an_array_type, typeToString(inputType));
            return unknownType;
        }
        /**
         * When errorNode is undefined, it means we should not report any errors.
         */
        function checkElementTypeOfIterable(iterable, errorNode) {
            var elementType = getElementTypeOfIterable(iterable, errorNode);
            // Now even though we have extracted the iteratedType, we will have to validate that the type
            // passed in is actually an Iterable.
            if (errorNode && elementType) {
                checkTypeAssignableTo(iterable, createIterableType(elementType), errorNode);
            }
            return elementType || anyType;
        }
        /**
         * We want to treat type as an iterable, and get the type it is an iterable of. The iterable
         * must have the following structure (annotated with the names of the variables below):
         *
         * { // iterable
         *     [Symbol.iterator]: { // iteratorFunction
         *         (): Iterator<T>
         *     }
         * }
         *
         * T is the type we are after. At every level that involves analyzing return types
         * of signatures, we union the return types of all the signatures.
         *
         * Another thing to note is that at any step of this process, we could run into a dead end,
         * meaning either the property is missing, or we run into the anyType. If either of these things
         * happens, we return undefined to signal that we could not find the iterated type. If a property
         * is missing, and the previous step did not result in 'any', then we also give an error if the
         * caller requested it. Then the caller can decide what to do in the case where there is no iterated
         * type. This is different from returning anyType, because that would signify that we have matched the
         * whole pattern and that T (above) is 'any'.
         */
        function getElementTypeOfIterable(type, errorNode) {
            if (isTypeAny(type)) {
                return undefined;
            }
            var typeAsIterable = type;
            if (!typeAsIterable.iterableElementType) {
                // As an optimization, if the type is instantiated directly using the globalIterableType (Iterable<number>),
                // then just grab its type argument.
                if ((type.flags & 4096 /* Reference */) && type.target === globalIterableType) {
                    typeAsIterable.iterableElementType = type.typeArguments[0];
                }
                else {
                    var iteratorFunction = getTypeOfPropertyOfType(type, ts.getPropertyNameForKnownSymbolName("iterator"));
                    if (isTypeAny(iteratorFunction)) {
                        return undefined;
                    }
                    var iteratorFunctionSignatures = iteratorFunction ? getSignaturesOfType(iteratorFunction, 0 /* Call */) : emptyArray;
                    if (iteratorFunctionSignatures.length === 0) {
                        if (errorNode) {
                            error(errorNode, ts.Diagnostics.Type_must_have_a_Symbol_iterator_method_that_returns_an_iterator);
                        }
                        return undefined;
                    }
                    typeAsIterable.iterableElementType = getElementTypeOfIterator(getUnionType(ts.map(iteratorFunctionSignatures, getReturnTypeOfSignature)), errorNode);
                }
            }
            return typeAsIterable.iterableElementType;
        }
        /**
         * This function has very similar logic as getElementTypeOfIterable, except that it operates on
         * Iterators instead of Iterables. Here is the structure:
         *
         *  { // iterator
         *      next: { // iteratorNextFunction
         *          (): { // iteratorNextResult
         *              value: T // iteratorNextValue
         *          }
         *      }
         *  }
         *
         */
        function getElementTypeOfIterator(type, errorNode) {
            if (isTypeAny(type)) {
                return undefined;
            }
            var typeAsIterator = type;
            if (!typeAsIterator.iteratorElementType) {
                // As an optimization, if the type is instantiated directly using the globalIteratorType (Iterator<number>),
                // then just grab its type argument.
                if ((type.flags & 4096 /* Reference */) && type.target === globalIteratorType) {
                    typeAsIterator.iteratorElementType = type.typeArguments[0];
                }
                else {
                    var iteratorNextFunction = getTypeOfPropertyOfType(type, "next");
                    if (isTypeAny(iteratorNextFunction)) {
                        return undefined;
                    }
                    var iteratorNextFunctionSignatures = iteratorNextFunction ? getSignaturesOfType(iteratorNextFunction, 0 /* Call */) : emptyArray;
                    if (iteratorNextFunctionSignatures.length === 0) {
                        if (errorNode) {
                            error(errorNode, ts.Diagnostics.An_iterator_must_have_a_next_method);
                        }
                        return undefined;
                    }
                    var iteratorNextResult = getUnionType(ts.map(iteratorNextFunctionSignatures, getReturnTypeOfSignature));
                    if (isTypeAny(iteratorNextResult)) {
                        return undefined;
                    }
                    var iteratorNextValue = getTypeOfPropertyOfType(iteratorNextResult, "value");
                    if (!iteratorNextValue) {
                        if (errorNode) {
                            error(errorNode, ts.Diagnostics.The_type_returned_by_the_next_method_of_an_iterator_must_have_a_value_property);
                        }
                        return undefined;
                    }
                    typeAsIterator.iteratorElementType = iteratorNextValue;
                }
            }
            return typeAsIterator.iteratorElementType;
        }
        function getElementTypeOfIterableIterator(type) {
            if (isTypeAny(type)) {
                return undefined;
            }
            // As an optimization, if the type is instantiated directly using the globalIterableIteratorType (IterableIterator<number>),
            // then just grab its type argument.
            if ((type.flags & 4096 /* Reference */) && type.target === globalIterableIteratorType) {
                return type.typeArguments[0];
            }
            return getElementTypeOfIterable(type, undefined) ||
                getElementTypeOfIterator(type, undefined);
        }
        /**
         * This function does the following steps:
         *   1. Break up arrayOrStringType (possibly a union) into its string constituents and array constituents.
         *   2. Take the element types of the array constituents.
         *   3. Return the union of the element types, and string if there was a string constitutent.
         *
         * For example:
         *     string -> string
         *     number[] -> number
         *     string[] | number[] -> string | number
         *     string | number[] -> string | number
         *     string | string[] | number[] -> string | number
         *
         * It also errors if:
         *   1. Some constituent is neither a string nor an array.
         *   2. Some constituent is a string and target is less than ES5 (because in ES3 string is not indexable).
         */
        function checkElementTypeOfArrayOrString(arrayOrStringType, errorNode) {
            ts.Debug.assert(languageVersion < 2 /* ES6 */);
            // After we remove all types that are StringLike, we will know if there was a string constituent
            // based on whether the remaining type is the same as the initial type.
            var arrayType = removeTypesFromUnionType(arrayOrStringType, 258 /* StringLike */, true, true);
            var hasStringConstituent = arrayOrStringType !== arrayType;
            var reportedError = false;
            if (hasStringConstituent) {
                if (languageVersion < 1 /* ES5 */) {
                    error(errorNode, ts.Diagnostics.Using_a_string_in_a_for_of_statement_is_only_supported_in_ECMAScript_5_and_higher);
                    reportedError = true;
                }
                // Now that we've removed all the StringLike types, if no constituents remain, then the entire
                // arrayOrStringType was a string.
                if (arrayType === emptyObjectType) {
                    return stringType;
                }
            }
            if (!isArrayLikeType(arrayType)) {
                if (!reportedError) {
                    // Which error we report depends on whether there was a string constituent. For example,
                    // if the input type is number | string, we want to say that number is not an array type.
                    // But if the input was just number, we want to say that number is not an array type
                    // or a string type.
                    var diagnostic = hasStringConstituent
                        ? ts.Diagnostics.Type_0_is_not_an_array_type
                        : ts.Diagnostics.Type_0_is_not_an_array_type_or_a_string_type;
                    error(errorNode, diagnostic, typeToString(arrayType));
                }
                return hasStringConstituent ? stringType : unknownType;
            }
            var arrayElementType = getIndexTypeOfType(arrayType, 1 /* Number */) || unknownType;
            if (hasStringConstituent) {
                // This is just an optimization for the case where arrayOrStringType is string | string[]
                if (arrayElementType.flags & 258 /* StringLike */) {
                    return stringType;
                }
                return getUnionType([arrayElementType, stringType]);
            }
            return arrayElementType;
        }
        function checkBreakOrContinueStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node) || checkGrammarBreakOrContinueStatement(node);
            // TODO: Check that target label is valid
        }
        function isGetAccessorWithAnnotatatedSetAccessor(node) {
            return !!(node.kind === 141 /* GetAccessor */ && getSetAccessorTypeAnnotationNode(ts.getDeclarationOfKind(node.symbol, 142 /* SetAccessor */)));
        }
        function checkReturnStatement(node) {
            // Grammar checking
            if (!checkGrammarStatementInAmbientContext(node)) {
                var functionBlock = ts.getContainingFunction(node);
                if (!functionBlock) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.A_return_statement_can_only_be_used_within_a_function_body);
                }
            }
            if (node.expression) {
                var func = ts.getContainingFunction(node);
                if (func) {
                    var signature = getSignatureFromDeclaration(func);
                    var returnType = getReturnTypeOfSignature(signature);
                    var exprType = checkExpressionCached(node.expression);
                    if (func.asteriskToken) {
                        // A generator does not need its return expressions checked against its return type.
                        // Instead, the yield expressions are checked against the element type.
                        // TODO: Check return expressions of generators when return type tracking is added
                        // for generators.
                        return;
                    }
                    if (func.kind === 142 /* SetAccessor */) {
                        error(node.expression, ts.Diagnostics.Setters_cannot_return_a_value);
                    }
                    else if (func.kind === 140 /* Constructor */) {
                        if (!isTypeAssignableTo(exprType, returnType)) {
                            error(node.expression, ts.Diagnostics.Return_type_of_constructor_signature_must_be_assignable_to_the_instance_type_of_the_class);
                        }
                    }
                    else if (func.type || isGetAccessorWithAnnotatatedSetAccessor(func) || signature.typePredicate) {
                        if (ts.isAsyncFunctionLike(func)) {
                            var promisedType = getPromisedType(returnType);
                            var awaitedType = checkAwaitedType(exprType, node.expression, ts.Diagnostics.Return_expression_in_async_function_does_not_have_a_valid_callable_then_member);
                            checkTypeAssignableTo(awaitedType, promisedType, node.expression);
                        }
                        else {
                            checkTypeAssignableTo(exprType, returnType, node.expression);
                        }
                    }
                }
            }
        }
        function checkWithStatement(node) {
            // Grammar checking for withStatement
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.parserContextFlags & 8 /* Await */) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.with_statements_are_not_allowed_in_an_async_function_block);
                }
            }
            checkExpression(node.expression);
            error(node.expression, ts.Diagnostics.All_symbols_within_a_with_block_will_be_resolved_to_any);
        }
        function checkSwitchStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            var firstDefaultClause;
            var hasDuplicateDefaultClause = false;
            var expressionType = checkExpression(node.expression);
            ts.forEach(node.caseBlock.clauses, function (clause) {
                // Grammar check for duplicate default clauses, skip if we already report duplicate default clause
                if (clause.kind === 237 /* DefaultClause */ && !hasDuplicateDefaultClause) {
                    if (firstDefaultClause === undefined) {
                        firstDefaultClause = clause;
                    }
                    else {
                        var sourceFile = ts.getSourceFileOfNode(node);
                        var start = ts.skipTrivia(sourceFile.text, clause.pos);
                        var end = clause.statements.length > 0 ? clause.statements[0].pos : clause.end;
                        grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.A_default_clause_cannot_appear_more_than_once_in_a_switch_statement);
                        hasDuplicateDefaultClause = true;
                    }
                }
                if (produceDiagnostics && clause.kind === 236 /* CaseClause */) {
                    var caseClause = clause;
                    // TypeScript 1.0 spec (April 2014):5.9
                    // In a 'switch' statement, each 'case' expression must be of a type that is assignable to or from the type of the 'switch' expression.
                    var caseType = checkExpression(caseClause.expression);
                    if (!isTypeAssignableTo(expressionType, caseType)) {
                        // check 'expressionType isAssignableTo caseType' failed, try the reversed check and report errors if it fails
                        checkTypeAssignableTo(caseType, expressionType, caseClause.expression, undefined);
                    }
                }
                ts.forEach(clause.statements, checkSourceElement);
            });
        }
        function checkLabeledStatement(node) {
            // Grammar checking
            if (!checkGrammarStatementInAmbientContext(node)) {
                var current = node.parent;
                while (current) {
                    if (ts.isFunctionLike(current)) {
                        break;
                    }
                    if (current.kind === 202 /* LabeledStatement */ && current.label.text === node.label.text) {
                        var sourceFile = ts.getSourceFileOfNode(node);
                        grammarErrorOnNode(node.label, ts.Diagnostics.Duplicate_label_0, ts.getTextOfNodeFromSourceText(sourceFile.text, node.label));
                        break;
                    }
                    current = current.parent;
                }
            }
            // ensure that label is unique
            checkSourceElement(node.statement);
        }
        function checkThrowStatement(node) {
            // Grammar checking
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.expression === undefined) {
                    grammarErrorAfterFirstToken(node, ts.Diagnostics.Line_break_not_permitted_here);
                }
            }
            if (node.expression) {
                checkExpression(node.expression);
            }
        }
        function checkTryStatement(node) {
            // Grammar checking
            checkGrammarStatementInAmbientContext(node);
            checkBlock(node.tryBlock);
            var catchClause = node.catchClause;
            if (catchClause) {
                // Grammar checking
                if (catchClause.variableDeclaration) {
                    if (catchClause.variableDeclaration.name.kind !== 66 /* Identifier */) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.name, ts.Diagnostics.Catch_clause_variable_name_must_be_an_identifier);
                    }
                    else if (catchClause.variableDeclaration.type) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.type, ts.Diagnostics.Catch_clause_variable_cannot_have_a_type_annotation);
                    }
                    else if (catchClause.variableDeclaration.initializer) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.initializer, ts.Diagnostics.Catch_clause_variable_cannot_have_an_initializer);
                    }
                    else {
                        var identifierName = catchClause.variableDeclaration.name.text;
                        var locals = catchClause.block.locals;
                        if (locals && ts.hasProperty(locals, identifierName)) {
                            var localSymbol = locals[identifierName];
                            if (localSymbol && (localSymbol.flags & 2 /* BlockScopedVariable */) !== 0) {
                                grammarErrorOnNode(localSymbol.valueDeclaration, ts.Diagnostics.Cannot_redeclare_identifier_0_in_catch_clause, identifierName);
                            }
                        }
                    }
                }
                checkBlock(catchClause.block);
            }
            if (node.finallyBlock) {
                checkBlock(node.finallyBlock);
            }
        }
        function checkIndexConstraints(type) {
            var declaredNumberIndexer = getIndexDeclarationOfSymbol(type.symbol, 1 /* Number */);
            var declaredStringIndexer = getIndexDeclarationOfSymbol(type.symbol, 0 /* String */);
            var stringIndexType = getIndexTypeOfType(type, 0 /* String */);
            var numberIndexType = getIndexTypeOfType(type, 1 /* Number */);
            if (stringIndexType || numberIndexType) {
                ts.forEach(getPropertiesOfObjectType(type), function (prop) {
                    var propType = getTypeOfSymbol(prop);
                    checkIndexConstraintForProperty(prop, propType, type, declaredStringIndexer, stringIndexType, 0 /* String */);
                    checkIndexConstraintForProperty(prop, propType, type, declaredNumberIndexer, numberIndexType, 1 /* Number */);
                });
                if (type.flags & 1024 /* Class */ && ts.isClassLike(type.symbol.valueDeclaration)) {
                    var classDeclaration = type.symbol.valueDeclaration;
                    for (var _i = 0, _a = classDeclaration.members; _i < _a.length; _i++) {
                        var member = _a[_i];
                        // Only process instance properties with computed names here.
                        // Static properties cannot be in conflict with indexers,
                        // and properties with literal names were already checked.
                        if (!(member.flags & 128 /* Static */) && ts.hasDynamicName(member)) {
                            var propType = getTypeOfSymbol(member.symbol);
                            checkIndexConstraintForProperty(member.symbol, propType, type, declaredStringIndexer, stringIndexType, 0 /* String */);
                            checkIndexConstraintForProperty(member.symbol, propType, type, declaredNumberIndexer, numberIndexType, 1 /* Number */);
                        }
                    }
                }
            }
            var errorNode;
            if (stringIndexType && numberIndexType) {
                errorNode = declaredNumberIndexer || declaredStringIndexer;
                // condition 'errorNode === undefined' may appear if types does not declare nor string neither number indexer
                if (!errorNode && (type.flags & 2048 /* Interface */)) {
                    var someBaseTypeHasBothIndexers = ts.forEach(getBaseTypes(type), function (base) { return getIndexTypeOfType(base, 0 /* String */) && getIndexTypeOfType(base, 1 /* Number */); });
                    errorNode = someBaseTypeHasBothIndexers ? undefined : type.symbol.declarations[0];
                }
            }
            if (errorNode && !isTypeAssignableTo(numberIndexType, stringIndexType)) {
                error(errorNode, ts.Diagnostics.Numeric_index_type_0_is_not_assignable_to_string_index_type_1, typeToString(numberIndexType), typeToString(stringIndexType));
            }
            function checkIndexConstraintForProperty(prop, propertyType, containingType, indexDeclaration, indexType, indexKind) {
                if (!indexType) {
                    return;
                }
                // index is numeric and property name is not valid numeric literal
                if (indexKind === 1 /* Number */ && !isNumericName(prop.valueDeclaration.name)) {
                    return;
                }
                // perform property check if property or indexer is declared in 'type'
                // this allows to rule out cases when both property and indexer are inherited from the base class
                var errorNode;
                if (prop.valueDeclaration.name.kind === 132 /* ComputedPropertyName */ || prop.parent === containingType.symbol) {
                    errorNode = prop.valueDeclaration;
                }
                else if (indexDeclaration) {
                    errorNode = indexDeclaration;
                }
                else if (containingType.flags & 2048 /* Interface */) {
                    // for interfaces property and indexer might be inherited from different bases
                    // check if any base class already has both property and indexer.
                    // check should be performed only if 'type' is the first type that brings property\indexer together
                    var someBaseClassHasBothPropertyAndIndexer = ts.forEach(getBaseTypes(containingType), function (base) { return getPropertyOfObjectType(base, prop.name) && getIndexTypeOfType(base, indexKind); });
                    errorNode = someBaseClassHasBothPropertyAndIndexer ? undefined : containingType.symbol.declarations[0];
                }
                if (errorNode && !isTypeAssignableTo(propertyType, indexType)) {
                    var errorMessage = indexKind === 0 /* String */
                        ? ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_string_index_type_2
                        : ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_numeric_index_type_2;
                    error(errorNode, errorMessage, symbolToString(prop), typeToString(propertyType), typeToString(indexType));
                }
            }
        }
        function checkTypeNameIsReserved(name, message) {
            // TS 1.0 spec (April 2014): 3.6.1
            // The predefined type keywords are reserved and cannot be used as names of user defined types.
            switch (name.text) {
                case "any":
                case "number":
                case "boolean":
                case "string":
                case "symbol":
                case "void":
                    error(name, message, name.text);
            }
        }
        // Check each type parameter and check that list has no duplicate type parameter declarations
        function checkTypeParameters(typeParameterDeclarations) {
            if (typeParameterDeclarations) {
                for (var i = 0, n = typeParameterDeclarations.length; i < n; i++) {
                    var node = typeParameterDeclarations[i];
                    checkTypeParameter(node);
                    if (produceDiagnostics) {
                        for (var j = 0; j < i; j++) {
                            if (typeParameterDeclarations[j].symbol === node.symbol) {
                                error(node.name, ts.Diagnostics.Duplicate_identifier_0, ts.declarationNameToString(node.name));
                            }
                        }
                    }
                }
            }
        }
        function checkClassExpression(node) {
            checkClassLikeDeclaration(node);
            return getTypeOfSymbol(getSymbolOfNode(node));
        }
        function checkClassDeclaration(node) {
            if (!node.name && !(node.flags & 256 /* Default */)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.A_class_declaration_without_the_default_modifier_must_have_a_name);
            }
            checkClassLikeDeclaration(node);
            ts.forEach(node.members, checkSourceElement);
        }
        function checkClassLikeDeclaration(node) {
            checkGrammarClassDeclarationHeritageClauses(node);
            checkDecorators(node);
            if (node.name) {
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Class_name_cannot_be_0);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
            checkTypeParameters(node.typeParameters);
            checkExportsOnMergedDeclarations(node);
            var symbol = getSymbolOfNode(node);
            var type = getDeclaredTypeOfSymbol(symbol);
            var staticType = getTypeOfSymbol(symbol);
            var baseTypeNode = ts.getClassExtendsHeritageClauseElement(node);
            if (baseTypeNode) {
                emitExtends = emitExtends || !ts.isInAmbientContext(node);
                var baseTypes = getBaseTypes(type);
                if (baseTypes.length && produceDiagnostics) {
                    var baseType = baseTypes[0];
                    var staticBaseType = getBaseConstructorTypeOfClass(type);
                    if (baseTypeNode.typeArguments) {
                        ts.forEach(baseTypeNode.typeArguments, checkSourceElement);
                        for (var _i = 0, _a = getConstructorsForTypeArguments(staticBaseType, baseTypeNode.typeArguments); _i < _a.length; _i++) {
                            var constructor = _a[_i];
                            if (!checkTypeArgumentConstraints(constructor.typeParameters, baseTypeNode.typeArguments)) {
                                break;
                            }
                        }
                    }
                    checkTypeAssignableTo(type, baseType, node.name || node, ts.Diagnostics.Class_0_incorrectly_extends_base_class_1);
                    checkTypeAssignableTo(staticType, getTypeWithoutSignatures(staticBaseType), node.name || node, ts.Diagnostics.Class_static_side_0_incorrectly_extends_base_class_static_side_1);
                    if (!(staticBaseType.symbol && staticBaseType.symbol.flags & 32 /* Class */)) {
                        // When the static base type is a "class-like" constructor function (but not actually a class), we verify
                        // that all instantiated base constructor signatures return the same type. We can simply compare the type
                        // references (as opposed to checking the structure of the types) because elsewhere we have already checked
                        // that the base type is a class or interface type (and not, for example, an anonymous object type).
                        var constructors = getInstantiatedConstructorsForTypeArguments(staticBaseType, baseTypeNode.typeArguments);
                        if (ts.forEach(constructors, function (sig) { return getReturnTypeOfSignature(sig) !== baseType; })) {
                            error(baseTypeNode.expression, ts.Diagnostics.Base_constructors_must_all_have_the_same_return_type);
                        }
                    }
                    checkKindsOfPropertyMemberOverrides(type, baseType);
                }
            }
            var implementedTypeNodes = ts.getClassImplementsHeritageClauseElements(node);
            if (implementedTypeNodes) {
                ts.forEach(implementedTypeNodes, function (typeRefNode) {
                    if (!ts.isSupportedExpressionWithTypeArguments(typeRefNode)) {
                        error(typeRefNode.expression, ts.Diagnostics.A_class_can_only_implement_an_identifier_Slashqualified_name_with_optional_type_arguments);
                    }
                    checkTypeReferenceNode(typeRefNode);
                    if (produceDiagnostics) {
                        var t = getTypeFromTypeNode(typeRefNode);
                        if (t !== unknownType) {
                            var declaredType = (t.flags & 4096 /* Reference */) ? t.target : t;
                            if (declaredType.flags & (1024 /* Class */ | 2048 /* Interface */)) {
                                checkTypeAssignableTo(type, t, node.name || node, ts.Diagnostics.Class_0_incorrectly_implements_interface_1);
                            }
                            else {
                                error(typeRefNode, ts.Diagnostics.A_class_may_only_implement_another_class_or_interface);
                            }
                        }
                    }
                });
            }
            if (produceDiagnostics) {
                checkIndexConstraints(type);
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function getTargetSymbol(s) {
            // if symbol is instantiated its flags are not copied from the 'target'
            // so we'll need to get back original 'target' symbol to work with correct set of flags
            return s.flags & 16777216 /* Instantiated */ ? getSymbolLinks(s).target : s;
        }
        function checkKindsOfPropertyMemberOverrides(type, baseType) {
            // TypeScript 1.0 spec (April 2014): 8.2.3
            // A derived class inherits all members from its base class it doesn't override.
            // Inheritance means that a derived class implicitly contains all non - overridden members of the base class.
            // Both public and private property members are inherited, but only public property members can be overridden.
            // A property member in a derived class is said to override a property member in a base class
            // when the derived class property member has the same name and kind(instance or static)
            // as the base class property member.
            // The type of an overriding property member must be assignable(section 3.8.4)
            // to the type of the overridden property member, or otherwise a compile - time error occurs.
            // Base class instance member functions can be overridden by derived class instance member functions,
            // but not by other kinds of members.
            // Base class instance member variables and accessors can be overridden by
            // derived class instance member variables and accessors, but not by other kinds of members.
            // NOTE: assignability is checked in checkClassDeclaration
            var baseProperties = getPropertiesOfObjectType(baseType);
            for (var _i = 0; _i < baseProperties.length; _i++) {
                var baseProperty = baseProperties[_i];
                var base = getTargetSymbol(baseProperty);
                if (base.flags & 134217728 /* Prototype */) {
                    continue;
                }
                var derived = getTargetSymbol(getPropertyOfObjectType(type, base.name));
                if (derived) {
                    var baseDeclarationFlags = getDeclarationFlagsFromSymbol(base);
                    var derivedDeclarationFlags = getDeclarationFlagsFromSymbol(derived);
                    if ((baseDeclarationFlags & 32 /* Private */) || (derivedDeclarationFlags & 32 /* Private */)) {
                        // either base or derived property is private - not override, skip it
                        continue;
                    }
                    if ((baseDeclarationFlags & 128 /* Static */) !== (derivedDeclarationFlags & 128 /* Static */)) {
                        // value of 'static' is not the same for properties - not override, skip it
                        continue;
                    }
                    if ((base.flags & derived.flags & 8192 /* Method */) || ((base.flags & 98308 /* PropertyOrAccessor */) && (derived.flags & 98308 /* PropertyOrAccessor */))) {
                        // method is overridden with method or property/accessor is overridden with property/accessor - correct case
                        continue;
                    }
                    var errorMessage = void 0;
                    if (base.flags & 8192 /* Method */) {
                        if (derived.flags & 98304 /* Accessor */) {
                            errorMessage = ts.Diagnostics.Class_0_defines_instance_member_function_1_but_extended_class_2_defines_it_as_instance_member_accessor;
                        }
                        else {
                            ts.Debug.assert((derived.flags & 4 /* Property */) !== 0);
                            errorMessage = ts.Diagnostics.Class_0_defines_instance_member_function_1_but_extended_class_2_defines_it_as_instance_member_property;
                        }
                    }
                    else if (base.flags & 4 /* Property */) {
                        ts.Debug.assert((derived.flags & 8192 /* Method */) !== 0);
                        errorMessage = ts.Diagnostics.Class_0_defines_instance_member_property_1_but_extended_class_2_defines_it_as_instance_member_function;
                    }
                    else {
                        ts.Debug.assert((base.flags & 98304 /* Accessor */) !== 0);
                        ts.Debug.assert((derived.flags & 8192 /* Method */) !== 0);
                        errorMessage = ts.Diagnostics.Class_0_defines_instance_member_accessor_1_but_extended_class_2_defines_it_as_instance_member_function;
                    }
                    error(derived.valueDeclaration.name, errorMessage, typeToString(baseType), symbolToString(base), typeToString(type));
                }
            }
        }
        function isAccessor(kind) {
            return kind === 141 /* GetAccessor */ || kind === 142 /* SetAccessor */;
        }
        function areTypeParametersIdentical(list1, list2) {
            if (!list1 && !list2) {
                return true;
            }
            if (!list1 || !list2 || list1.length !== list2.length) {
                return false;
            }
            // TypeScript 1.0 spec (April 2014):
            // When a generic interface has multiple declarations,  all declarations must have identical type parameter
            // lists, i.e. identical type parameter names with identical constraints in identical order.
            for (var i = 0, len = list1.length; i < len; i++) {
                var tp1 = list1[i];
                var tp2 = list2[i];
                if (tp1.name.text !== tp2.name.text) {
                    return false;
                }
                if (!tp1.constraint && !tp2.constraint) {
                    continue;
                }
                if (!tp1.constraint || !tp2.constraint) {
                    return false;
                }
                if (!isTypeIdenticalTo(getTypeFromTypeNode(tp1.constraint), getTypeFromTypeNode(tp2.constraint))) {
                    return false;
                }
            }
            return true;
        }
        function checkInheritedPropertiesAreIdentical(type, typeNode) {
            var baseTypes = getBaseTypes(type);
            if (baseTypes.length < 2) {
                return true;
            }
            var seen = {};
            ts.forEach(resolveDeclaredMembers(type).declaredProperties, function (p) { seen[p.name] = { prop: p, containingType: type }; });
            var ok = true;
            for (var _i = 0; _i < baseTypes.length; _i++) {
                var base = baseTypes[_i];
                var properties = getPropertiesOfObjectType(base);
                for (var _a = 0; _a < properties.length; _a++) {
                    var prop = properties[_a];
                    if (!ts.hasProperty(seen, prop.name)) {
                        seen[prop.name] = { prop: prop, containingType: base };
                    }
                    else {
                        var existing = seen[prop.name];
                        var isInheritedProperty = existing.containingType !== type;
                        if (isInheritedProperty && !isPropertyIdenticalTo(existing.prop, prop)) {
                            ok = false;
                            var typeName1 = typeToString(existing.containingType);
                            var typeName2 = typeToString(base);
                            var errorInfo = ts.chainDiagnosticMessages(undefined, ts.Diagnostics.Named_property_0_of_types_1_and_2_are_not_identical, symbolToString(prop), typeName1, typeName2);
                            errorInfo = ts.chainDiagnosticMessages(errorInfo, ts.Diagnostics.Interface_0_cannot_simultaneously_extend_types_1_and_2, typeToString(type), typeName1, typeName2);
                            diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(typeNode, errorInfo));
                        }
                    }
                }
            }
            return ok;
        }
        function checkInterfaceDeclaration(node) {
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarInterfaceDeclaration(node);
            checkTypeParameters(node.typeParameters);
            if (produceDiagnostics) {
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Interface_name_cannot_be_0);
                checkExportsOnMergedDeclarations(node);
                var symbol = getSymbolOfNode(node);
                var firstInterfaceDecl = ts.getDeclarationOfKind(symbol, 210 /* InterfaceDeclaration */);
                if (symbol.declarations.length > 1) {
                    if (node !== firstInterfaceDecl && !areTypeParametersIdentical(firstInterfaceDecl.typeParameters, node.typeParameters)) {
                        error(node.name, ts.Diagnostics.All_declarations_of_an_interface_must_have_identical_type_parameters);
                    }
                }
                // Only check this symbol once
                if (node === firstInterfaceDecl) {
                    var type = getDeclaredTypeOfSymbol(symbol);
                    // run subsequent checks only if first set succeeded
                    if (checkInheritedPropertiesAreIdentical(type, node.name)) {
                        ts.forEach(getBaseTypes(type), function (baseType) {
                            checkTypeAssignableTo(type, baseType, node.name, ts.Diagnostics.Interface_0_incorrectly_extends_interface_1);
                        });
                        checkIndexConstraints(type);
                    }
                }
            }
            ts.forEach(ts.getInterfaceBaseTypeNodes(node), function (heritageElement) {
                if (!ts.isSupportedExpressionWithTypeArguments(heritageElement)) {
                    error(heritageElement.expression, ts.Diagnostics.An_interface_can_only_extend_an_identifier_Slashqualified_name_with_optional_type_arguments);
                }
                checkTypeReferenceNode(heritageElement);
            });
            ts.forEach(node.members, checkSourceElement);
            if (produceDiagnostics) {
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function checkTypeAliasDeclaration(node) {
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node);
            checkTypeNameIsReserved(node.name, ts.Diagnostics.Type_alias_name_cannot_be_0);
            checkSourceElement(node.type);
        }
        function computeEnumMemberValues(node) {
            var nodeLinks = getNodeLinks(node);
            if (!(nodeLinks.flags & 8192 /* EnumValuesComputed */)) {
                var enumSymbol = getSymbolOfNode(node);
                var enumType = getDeclaredTypeOfSymbol(enumSymbol);
                var autoValue = 0;
                var ambient = ts.isInAmbientContext(node);
                var enumIsConst = ts.isConst(node);
                ts.forEach(node.members, function (member) {
                    if (member.name.kind !== 132 /* ComputedPropertyName */ && isNumericLiteralName(member.name.text)) {
                        error(member.name, ts.Diagnostics.An_enum_member_cannot_have_a_numeric_name);
                    }
                    var initializer = member.initializer;
                    if (initializer) {
                        autoValue = getConstantValueForEnumMemberInitializer(initializer);
                        if (autoValue === undefined) {
                            if (enumIsConst) {
                                error(initializer, ts.Diagnostics.In_const_enum_declarations_member_initializer_must_be_constant_expression);
                            }
                            else if (!ambient) {
                                // Only here do we need to check that the initializer is assignable to the enum type.
                                // If it is a constant value (not undefined), it is syntactically constrained to be a number.
                                // Also, we do not need to check this for ambients because there is already
                                // a syntax error if it is not a constant.
                                checkTypeAssignableTo(checkExpression(initializer), enumType, initializer, undefined);
                            }
                        }
                        else if (enumIsConst) {
                            if (isNaN(autoValue)) {
                                error(initializer, ts.Diagnostics.const_enum_member_initializer_was_evaluated_to_disallowed_value_NaN);
                            }
                            else if (!isFinite(autoValue)) {
                                error(initializer, ts.Diagnostics.const_enum_member_initializer_was_evaluated_to_a_non_finite_value);
                            }
                        }
                    }
                    else if (ambient && !enumIsConst) {
                        autoValue = undefined;
                    }
                    if (autoValue !== undefined) {
                        getNodeLinks(member).enumMemberValue = autoValue++;
                    }
                });
                nodeLinks.flags |= 8192 /* EnumValuesComputed */;
            }
            function getConstantValueForEnumMemberInitializer(initializer) {
                return evalConstant(initializer);
                function evalConstant(e) {
                    switch (e.kind) {
                        case 174 /* PrefixUnaryExpression */:
                            var value = evalConstant(e.operand);
                            if (value === undefined) {
                                return undefined;
                            }
                            switch (e.operator) {
                                case 34 /* PlusToken */: return value;
                                case 35 /* MinusToken */: return -value;
                                case 48 /* TildeToken */: return ~value;
                            }
                            return undefined;
                        case 176 /* BinaryExpression */:
                            var left = evalConstant(e.left);
                            if (left === undefined) {
                                return undefined;
                            }
                            var right = evalConstant(e.right);
                            if (right === undefined) {
                                return undefined;
                            }
                            switch (e.operatorToken.kind) {
                                case 45 /* BarToken */: return left | right;
                                case 44 /* AmpersandToken */: return left & right;
                                case 42 /* GreaterThanGreaterThanToken */: return left >> right;
                                case 43 /* GreaterThanGreaterThanGreaterThanToken */: return left >>> right;
                                case 41 /* LessThanLessThanToken */: return left << right;
                                case 46 /* CaretToken */: return left ^ right;
                                case 36 /* AsteriskToken */: return left * right;
                                case 37 /* SlashToken */: return left / right;
                                case 34 /* PlusToken */: return left + right;
                                case 35 /* MinusToken */: return left - right;
                                case 38 /* PercentToken */: return left % right;
                            }
                            return undefined;
                        case 7 /* NumericLiteral */:
                            return +e.text;
                        case 167 /* ParenthesizedExpression */:
                            return evalConstant(e.expression);
                        case 66 /* Identifier */:
                        case 162 /* ElementAccessExpression */:
                        case 161 /* PropertyAccessExpression */:
                            var member = initializer.parent;
                            var currentType = getTypeOfSymbol(getSymbolOfNode(member.parent));
                            var enumType;
                            var propertyName;
                            if (e.kind === 66 /* Identifier */) {
                                // unqualified names can refer to member that reside in different declaration of the enum so just doing name resolution won't work.
                                // instead pick current enum type and later try to fetch member from the type
                                enumType = currentType;
                                propertyName = e.text;
                            }
                            else {
                                var expression;
                                if (e.kind === 162 /* ElementAccessExpression */) {
                                    if (e.argumentExpression === undefined ||
                                        e.argumentExpression.kind !== 8 /* StringLiteral */) {
                                        return undefined;
                                    }
                                    expression = e.expression;
                                    propertyName = e.argumentExpression.text;
                                }
                                else {
                                    expression = e.expression;
                                    propertyName = e.name.text;
                                }
                                // expression part in ElementAccess\PropertyAccess should be either identifier or dottedName
                                var current = expression;
                                while (current) {
                                    if (current.kind === 66 /* Identifier */) {
                                        break;
                                    }
                                    else if (current.kind === 161 /* PropertyAccessExpression */) {
                                        current = current.expression;
                                    }
                                    else {
                                        return undefined;
                                    }
                                }
                                enumType = checkExpression(expression);
                                // allow references to constant members of other enums
                                if (!(enumType.symbol && (enumType.symbol.flags & 384 /* Enum */))) {
                                    return undefined;
                                }
                            }
                            if (propertyName === undefined) {
                                return undefined;
                            }
                            var property = getPropertyOfObjectType(enumType, propertyName);
                            if (!property || !(property.flags & 8 /* EnumMember */)) {
                                return undefined;
                            }
                            var propertyDecl = property.valueDeclaration;
                            // self references are illegal
                            if (member === propertyDecl) {
                                return undefined;
                            }
                            // illegal case: forward reference
                            if (!isDefinedBefore(propertyDecl, member)) {
                                return undefined;
                            }
                            return getNodeLinks(propertyDecl).enumMemberValue;
                    }
                }
            }
        }
        function checkEnumDeclaration(node) {
            if (!produceDiagnostics) {
                return;
            }
            // Grammar checking
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarEnumDeclaration(node);
            checkTypeNameIsReserved(node.name, ts.Diagnostics.Enum_name_cannot_be_0);
            checkCollisionWithCapturedThisVariable(node, node.name);
            checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            checkExportsOnMergedDeclarations(node);
            computeEnumMemberValues(node);
            var enumIsConst = ts.isConst(node);
            if (compilerOptions.isolatedModules && enumIsConst && ts.isInAmbientContext(node)) {
                error(node.name, ts.Diagnostics.Ambient_const_enums_are_not_allowed_when_the_isolatedModules_flag_is_provided);
            }
            // Spec 2014 - Section 9.3:
            // It isn't possible for one enum declaration to continue the automatic numbering sequence of another,
            // and when an enum type has multiple declarations, only one declaration is permitted to omit a value
            // for the first member.
            //
            // Only perform this check once per symbol
            var enumSymbol = getSymbolOfNode(node);
            var firstDeclaration = ts.getDeclarationOfKind(enumSymbol, node.kind);
            if (node === firstDeclaration) {
                if (enumSymbol.declarations.length > 1) {
                    // check that const is placed\omitted on all enum declarations
                    ts.forEach(enumSymbol.declarations, function (decl) {
                        if (ts.isConstEnumDeclaration(decl) !== enumIsConst) {
                            error(decl.name, ts.Diagnostics.Enum_declarations_must_all_be_const_or_non_const);
                        }
                    });
                }
                var seenEnumMissingInitialInitializer = false;
                ts.forEach(enumSymbol.declarations, function (declaration) {
                    // return true if we hit a violation of the rule, false otherwise
                    if (declaration.kind !== 212 /* EnumDeclaration */) {
                        return false;
                    }
                    var enumDeclaration = declaration;
                    if (!enumDeclaration.members.length) {
                        return false;
                    }
                    var firstEnumMember = enumDeclaration.members[0];
                    if (!firstEnumMember.initializer) {
                        if (seenEnumMissingInitialInitializer) {
                            error(firstEnumMember.name, ts.Diagnostics.In_an_enum_with_multiple_declarations_only_one_declaration_can_omit_an_initializer_for_its_first_enum_element);
                        }
                        else {
                            seenEnumMissingInitialInitializer = true;
                        }
                    }
                });
            }
        }
        function getFirstNonAmbientClassOrFunctionDeclaration(symbol) {
            var declarations = symbol.declarations;
            for (var _i = 0; _i < declarations.length; _i++) {
                var declaration = declarations[_i];
                if ((declaration.kind === 209 /* ClassDeclaration */ ||
                    (declaration.kind === 208 /* FunctionDeclaration */ && ts.nodeIsPresent(declaration.body))) &&
                    !ts.isInAmbientContext(declaration)) {
                    return declaration;
                }
            }
            return undefined;
        }
        function inSameLexicalScope(node1, node2) {
            var container1 = ts.getEnclosingBlockScopeContainer(node1);
            var container2 = ts.getEnclosingBlockScopeContainer(node2);
            if (isGlobalSourceFile(container1)) {
                return isGlobalSourceFile(container2);
            }
            else if (isGlobalSourceFile(container2)) {
                return false;
            }
            else {
                return container1 === container2;
            }
        }
        function checkModuleDeclaration(node) {
            if (produceDiagnostics) {
                // Grammar checking
                var isAmbientExternalModule = node.name.kind === 8 /* StringLiteral */;
                var contextErrorMessage = isAmbientExternalModule
                    ? ts.Diagnostics.An_ambient_module_declaration_is_only_allowed_at_the_top_level_in_a_file
                    : ts.Diagnostics.A_namespace_declaration_is_only_allowed_in_a_namespace_or_module;
                if (checkGrammarModuleElementContext(node, contextErrorMessage)) {
                    // If we hit a module declaration in an illegal context, just bail out to avoid cascading errors.
                    return;
                }
                if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node)) {
                    if (!ts.isInAmbientContext(node) && node.name.kind === 8 /* StringLiteral */) {
                        grammarErrorOnNode(node.name, ts.Diagnostics.Only_ambient_modules_can_use_quoted_names);
                    }
                }
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
                checkExportsOnMergedDeclarations(node);
                var symbol = getSymbolOfNode(node);
                // The following checks only apply on a non-ambient instantiated module declaration.
                if (symbol.flags & 512 /* ValueModule */
                    && symbol.declarations.length > 1
                    && !ts.isInAmbientContext(node)
                    && ts.isInstantiatedModule(node, compilerOptions.preserveConstEnums || compilerOptions.isolatedModules)) {
                    var firstNonAmbientClassOrFunc = getFirstNonAmbientClassOrFunctionDeclaration(symbol);
                    if (firstNonAmbientClassOrFunc) {
                        if (ts.getSourceFileOfNode(node) !== ts.getSourceFileOfNode(firstNonAmbientClassOrFunc)) {
                            error(node.name, ts.Diagnostics.A_namespace_declaration_cannot_be_in_a_different_file_from_a_class_or_function_with_which_it_is_merged);
                        }
                        else if (node.pos < firstNonAmbientClassOrFunc.pos) {
                            error(node.name, ts.Diagnostics.A_namespace_declaration_cannot_be_located_prior_to_a_class_or_function_with_which_it_is_merged);
                        }
                    }
                    // if the module merges with a class declaration in the same lexical scope, 
                    // we need to track this to ensure the correct emit.
                    var mergedClass = ts.getDeclarationOfKind(symbol, 209 /* ClassDeclaration */);
                    if (mergedClass &&
                        inSameLexicalScope(node, mergedClass)) {
                        getNodeLinks(node).flags |= 32768 /* LexicalModuleMergesWithClass */;
                    }
                }
                // Checks for ambient external modules.
                if (isAmbientExternalModule) {
                    if (!isGlobalSourceFile(node.parent)) {
                        error(node.name, ts.Diagnostics.Ambient_modules_cannot_be_nested_in_other_modules);
                    }
                    if (isExternalModuleNameRelative(node.name.text)) {
                        error(node.name, ts.Diagnostics.Ambient_module_declaration_cannot_specify_relative_module_name);
                    }
                }
            }
            checkSourceElement(node.body);
        }
        function getFirstIdentifier(node) {
            while (true) {
                if (node.kind === 131 /* QualifiedName */) {
                    node = node.left;
                }
                else if (node.kind === 161 /* PropertyAccessExpression */) {
                    node = node.expression;
                }
                else {
                    break;
                }
            }
            ts.Debug.assert(node.kind === 66 /* Identifier */);
            return node;
        }
        function checkExternalImportOrExportDeclaration(node) {
            var moduleName = ts.getExternalModuleName(node);
            if (!ts.nodeIsMissing(moduleName) && moduleName.kind !== 8 /* StringLiteral */) {
                error(moduleName, ts.Diagnostics.String_literal_expected);
                return false;
            }
            var inAmbientExternalModule = node.parent.kind === 214 /* ModuleBlock */ && node.parent.parent.name.kind === 8 /* StringLiteral */;
            if (node.parent.kind !== 243 /* SourceFile */ && !inAmbientExternalModule) {
                error(moduleName, node.kind === 223 /* ExportDeclaration */ ?
                    ts.Diagnostics.Export_declarations_are_not_permitted_in_a_namespace :
                    ts.Diagnostics.Import_declarations_in_a_namespace_cannot_reference_a_module);
                return false;
            }
            if (inAmbientExternalModule && isExternalModuleNameRelative(moduleName.text)) {
                // TypeScript 1.0 spec (April 2013): 12.1.6
                // An ExternalImportDeclaration in an AmbientExternalModuleDeclaration may reference
                // other external modules only through top - level external module names.
                // Relative external module names are not permitted.
                error(node, ts.Diagnostics.Import_or_export_declaration_in_an_ambient_module_declaration_cannot_reference_module_through_relative_module_name);
                return false;
            }
            return true;
        }
        function checkAliasSymbol(node) {
            var symbol = getSymbolOfNode(node);
            var target = resolveAlias(symbol);
            if (target !== unknownSymbol) {
                var excludedMeanings = (symbol.flags & 107455 /* Value */ ? 107455 /* Value */ : 0) |
                    (symbol.flags & 793056 /* Type */ ? 793056 /* Type */ : 0) |
                    (symbol.flags & 1536 /* Namespace */ ? 1536 /* Namespace */ : 0);
                if (target.flags & excludedMeanings) {
                    var message = node.kind === 225 /* ExportSpecifier */ ?
                        ts.Diagnostics.Export_declaration_conflicts_with_exported_declaration_of_0 :
                        ts.Diagnostics.Import_declaration_conflicts_with_local_declaration_of_0;
                    error(node, message, symbolToString(symbol));
                }
            }
        }
        function checkImportBinding(node) {
            checkCollisionWithCapturedThisVariable(node, node.name);
            checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            checkAliasSymbol(node);
        }
        function checkImportDeclaration(node) {
            if (checkGrammarModuleElementContext(node, ts.Diagnostics.An_import_declaration_can_only_be_used_in_a_namespace_or_module)) {
                // If we hit an import declaration in an illegal context, just bail out to avoid cascading errors.
                return;
            }
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 131571 /* Modifier */)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_import_declaration_cannot_have_modifiers);
            }
            if (checkExternalImportOrExportDeclaration(node)) {
                var importClause = node.importClause;
                if (importClause) {
                    if (importClause.name) {
                        checkImportBinding(importClause);
                    }
                    if (importClause.namedBindings) {
                        if (importClause.namedBindings.kind === 219 /* NamespaceImport */) {
                            checkImportBinding(importClause.namedBindings);
                        }
                        else {
                            ts.forEach(importClause.namedBindings.elements, checkImportBinding);
                        }
                    }
                }
            }
        }
        function checkImportEqualsDeclaration(node) {
            if (checkGrammarModuleElementContext(node, ts.Diagnostics.An_import_declaration_can_only_be_used_in_a_namespace_or_module)) {
                // If we hit an import declaration in an illegal context, just bail out to avoid cascading errors.
                return;
            }
            checkGrammarDecorators(node) || checkGrammarModifiers(node);
            if (ts.isInternalModuleImportEqualsDeclaration(node) || checkExternalImportOrExportDeclaration(node)) {
                checkImportBinding(node);
                if (node.flags & 1 /* Export */) {
                    markExportAsReferenced(node);
                }
                if (ts.isInternalModuleImportEqualsDeclaration(node)) {
                    var target = resolveAlias(getSymbolOfNode(node));
                    if (target !== unknownSymbol) {
                        if (target.flags & 107455 /* Value */) {
                            // Target is a value symbol, check that it is not hidden by a local declaration with the same name
                            var moduleName = getFirstIdentifier(node.moduleReference);
                            if (!(resolveEntityName(moduleName, 107455 /* Value */ | 1536 /* Namespace */).flags & 1536 /* Namespace */)) {
                                error(moduleName, ts.Diagnostics.Module_0_is_hidden_by_a_local_declaration_with_the_same_name, ts.declarationNameToString(moduleName));
                            }
                        }
                        if (target.flags & 793056 /* Type */) {
                            checkTypeNameIsReserved(node.name, ts.Diagnostics.Import_name_cannot_be_0);
                        }
                    }
                }
                else {
                    if (languageVersion >= 2 /* ES6 */) {
                        // Import equals declaration is deprecated in es6 or above
                        grammarErrorOnNode(node, ts.Diagnostics.Import_assignment_cannot_be_used_when_targeting_ECMAScript_6_or_higher_Consider_using_import_Asterisk_as_ns_from_mod_import_a_from_mod_or_import_d_from_mod_instead);
                    }
                }
            }
        }
        function checkExportDeclaration(node) {
            if (checkGrammarModuleElementContext(node, ts.Diagnostics.An_export_declaration_can_only_be_used_in_a_module)) {
                // If we hit an export in an illegal context, just bail out to avoid cascading errors.
                return;
            }
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 131571 /* Modifier */)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_export_declaration_cannot_have_modifiers);
            }
            if (!node.moduleSpecifier || checkExternalImportOrExportDeclaration(node)) {
                if (node.exportClause) {
                    // export { x, y }
                    // export { x, y } from "foo"
                    ts.forEach(node.exportClause.elements, checkExportSpecifier);
                    var inAmbientExternalModule = node.parent.kind === 214 /* ModuleBlock */ && node.parent.parent.name.kind === 8 /* StringLiteral */;
                    if (node.parent.kind !== 243 /* SourceFile */ && !inAmbientExternalModule) {
                        error(node, ts.Diagnostics.Export_declarations_are_not_permitted_in_a_namespace);
                    }
                }
                else {
                    // export * from "foo"
                    var moduleSymbol = resolveExternalModuleName(node, node.moduleSpecifier);
                    if (moduleSymbol && moduleSymbol.exports["export="]) {
                        error(node.moduleSpecifier, ts.Diagnostics.Module_0_uses_export_and_cannot_be_used_with_export_Asterisk, symbolToString(moduleSymbol));
                    }
                }
            }
        }
        function checkGrammarModuleElementContext(node, errorMessage) {
            if (node.parent.kind !== 243 /* SourceFile */ && node.parent.kind !== 214 /* ModuleBlock */ && node.parent.kind !== 213 /* ModuleDeclaration */) {
                return grammarErrorOnFirstToken(node, errorMessage);
            }
        }
        function checkExportSpecifier(node) {
            checkAliasSymbol(node);
            if (!node.parent.parent.moduleSpecifier) {
                markExportAsReferenced(node);
            }
        }
        function checkExportAssignment(node) {
            if (checkGrammarModuleElementContext(node, ts.Diagnostics.An_export_assignment_can_only_be_used_in_a_module)) {
                // If we hit an export assignment in an illegal context, just bail out to avoid cascading errors.
                return;
            }
            var container = node.parent.kind === 243 /* SourceFile */ ? node.parent : node.parent.parent;
            if (container.kind === 213 /* ModuleDeclaration */ && container.name.kind === 66 /* Identifier */) {
                error(node, ts.Diagnostics.An_export_assignment_cannot_be_used_in_a_namespace);
                return;
            }
            // Grammar checking
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 131571 /* Modifier */)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_export_assignment_cannot_have_modifiers);
            }
            if (node.expression.kind === 66 /* Identifier */) {
                markExportAsReferenced(node);
            }
            else {
                checkExpressionCached(node.expression);
            }
            checkExternalModuleExports(container);
            if (node.isExportEquals && !ts.isInAmbientContext(node)) {
                if (languageVersion >= 2 /* ES6 */) {
                    // export assignment is deprecated in es6 or above
                    grammarErrorOnNode(node, ts.Diagnostics.Export_assignment_cannot_be_used_when_targeting_ECMAScript_6_or_higher_Consider_using_export_default_instead);
                }
                else if (compilerOptions.module === 4 /* System */) {
                    // system modules does not support export assignment
                    grammarErrorOnNode(node, ts.Diagnostics.Export_assignment_is_not_supported_when_module_flag_is_system);
                }
            }
        }
        function getModuleStatements(node) {
            if (node.kind === 243 /* SourceFile */) {
                return node.statements;
            }
            if (node.kind === 213 /* ModuleDeclaration */ && node.body.kind === 214 /* ModuleBlock */) {
                return node.body.statements;
            }
            return emptyArray;
        }
        function hasExportedMembers(moduleSymbol) {
            for (var id in moduleSymbol.exports) {
                if (id !== "export=") {
                    return true;
                }
            }
            return false;
        }
        function checkExternalModuleExports(node) {
            var moduleSymbol = getSymbolOfNode(node);
            var links = getSymbolLinks(moduleSymbol);
            if (!links.exportsChecked) {
                var exportEqualsSymbol = moduleSymbol.exports["export="];
                if (exportEqualsSymbol && hasExportedMembers(moduleSymbol)) {
                    var declaration = getDeclarationOfAliasSymbol(exportEqualsSymbol) || exportEqualsSymbol.valueDeclaration;
                    error(declaration, ts.Diagnostics.An_export_assignment_cannot_be_used_in_a_module_with_other_exported_elements);
                }
                links.exportsChecked = true;
            }
        }
        function checkTypePredicate(node) {
            if (!isInLegalTypePredicatePosition(node)) {
                error(node, ts.Diagnostics.A_type_predicate_is_only_allowed_in_return_type_position_for_functions_and_methods);
            }
        }
        function checkSourceElement(node) {
            if (!node)
                return;
            switch (node.kind) {
                case 133 /* TypeParameter */:
                    return checkTypeParameter(node);
                case 134 /* Parameter */:
                    return checkParameter(node);
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                    return checkPropertyDeclaration(node);
                case 148 /* FunctionType */:
                case 149 /* ConstructorType */:
                case 143 /* CallSignature */:
                case 144 /* ConstructSignature */:
                    return checkSignatureDeclaration(node);
                case 145 /* IndexSignature */:
                    return checkSignatureDeclaration(node);
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                    return checkMethodDeclaration(node);
                case 140 /* Constructor */:
                    return checkConstructorDeclaration(node);
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                    return checkAccessorDeclaration(node);
                case 147 /* TypeReference */:
                    return checkTypeReferenceNode(node);
                case 146 /* TypePredicate */:
                    return checkTypePredicate(node);
                case 150 /* TypeQuery */:
                    return checkTypeQuery(node);
                case 151 /* TypeLiteral */:
                    return checkTypeLiteral(node);
                case 152 /* ArrayType */:
                    return checkArrayType(node);
                case 153 /* TupleType */:
                    return checkTupleType(node);
                case 154 /* UnionType */:
                    return checkUnionType(node);
                case 155 /* ParenthesizedType */:
                    return checkSourceElement(node.type);
                case 208 /* FunctionDeclaration */:
                    return checkFunctionDeclaration(node);
                case 187 /* Block */:
                case 214 /* ModuleBlock */:
                    return checkBlock(node);
                case 188 /* VariableStatement */:
                    return checkVariableStatement(node);
                case 190 /* ExpressionStatement */:
                    return checkExpressionStatement(node);
                case 191 /* IfStatement */:
                    return checkIfStatement(node);
                case 192 /* DoStatement */:
                    return checkDoStatement(node);
                case 193 /* WhileStatement */:
                    return checkWhileStatement(node);
                case 194 /* ForStatement */:
                    return checkForStatement(node);
                case 195 /* ForInStatement */:
                    return checkForInStatement(node);
                case 196 /* ForOfStatement */:
                    return checkForOfStatement(node);
                case 197 /* ContinueStatement */:
                case 198 /* BreakStatement */:
                    return checkBreakOrContinueStatement(node);
                case 199 /* ReturnStatement */:
                    return checkReturnStatement(node);
                case 200 /* WithStatement */:
                    return checkWithStatement(node);
                case 201 /* SwitchStatement */:
                    return checkSwitchStatement(node);
                case 202 /* LabeledStatement */:
                    return checkLabeledStatement(node);
                case 203 /* ThrowStatement */:
                    return checkThrowStatement(node);
                case 204 /* TryStatement */:
                    return checkTryStatement(node);
                case 206 /* VariableDeclaration */:
                    return checkVariableDeclaration(node);
                case 158 /* BindingElement */:
                    return checkBindingElement(node);
                case 209 /* ClassDeclaration */:
                    return checkClassDeclaration(node);
                case 210 /* InterfaceDeclaration */:
                    return checkInterfaceDeclaration(node);
                case 211 /* TypeAliasDeclaration */:
                    return checkTypeAliasDeclaration(node);
                case 212 /* EnumDeclaration */:
                    return checkEnumDeclaration(node);
                case 213 /* ModuleDeclaration */:
                    return checkModuleDeclaration(node);
                case 217 /* ImportDeclaration */:
                    return checkImportDeclaration(node);
                case 216 /* ImportEqualsDeclaration */:
                    return checkImportEqualsDeclaration(node);
                case 223 /* ExportDeclaration */:
                    return checkExportDeclaration(node);
                case 222 /* ExportAssignment */:
                    return checkExportAssignment(node);
                case 189 /* EmptyStatement */:
                    checkGrammarStatementInAmbientContext(node);
                    return;
                case 205 /* DebuggerStatement */:
                    checkGrammarStatementInAmbientContext(node);
                    return;
                case 226 /* MissingDeclaration */:
                    return checkMissingDeclaration(node);
            }
        }
        // Function and class expression bodies are checked after all statements in the enclosing body. This is
        // to ensure constructs like the following are permitted:
        //     let foo = function () {
        //        let s = foo();
        //        return "hello";
        //     }
        // Here, performing a full type check of the body of the function expression whilst in the process of
        // determining the type of foo would cause foo to be given type any because of the recursive reference.
        // Delaying the type check of the body ensures foo has been assigned a type.
        function checkFunctionAndClassExpressionBodies(node) {
            switch (node.kind) {
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                    ts.forEach(node.parameters, checkFunctionAndClassExpressionBodies);
                    checkFunctionExpressionOrObjectLiteralMethodBody(node);
                    break;
                case 181 /* ClassExpression */:
                    ts.forEach(node.members, checkSourceElement);
                    break;
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                    ts.forEach(node.decorators, checkFunctionAndClassExpressionBodies);
                    ts.forEach(node.parameters, checkFunctionAndClassExpressionBodies);
                    if (ts.isObjectLiteralMethod(node)) {
                        checkFunctionExpressionOrObjectLiteralMethodBody(node);
                    }
                    break;
                case 140 /* Constructor */:
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 208 /* FunctionDeclaration */:
                    ts.forEach(node.parameters, checkFunctionAndClassExpressionBodies);
                    break;
                case 200 /* WithStatement */:
                    checkFunctionAndClassExpressionBodies(node.expression);
                    break;
                case 135 /* Decorator */:
                case 134 /* Parameter */:
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                case 156 /* ObjectBindingPattern */:
                case 157 /* ArrayBindingPattern */:
                case 158 /* BindingElement */:
                case 159 /* ArrayLiteralExpression */:
                case 160 /* ObjectLiteralExpression */:
                case 240 /* PropertyAssignment */:
                case 161 /* PropertyAccessExpression */:
                case 162 /* ElementAccessExpression */:
                case 163 /* CallExpression */:
                case 164 /* NewExpression */:
                case 165 /* TaggedTemplateExpression */:
                case 178 /* TemplateExpression */:
                case 185 /* TemplateSpan */:
                case 166 /* TypeAssertionExpression */:
                case 184 /* AsExpression */:
                case 167 /* ParenthesizedExpression */:
                case 171 /* TypeOfExpression */:
                case 172 /* VoidExpression */:
                case 173 /* AwaitExpression */:
                case 170 /* DeleteExpression */:
                case 174 /* PrefixUnaryExpression */:
                case 175 /* PostfixUnaryExpression */:
                case 176 /* BinaryExpression */:
                case 177 /* ConditionalExpression */:
                case 180 /* SpreadElementExpression */:
                case 179 /* YieldExpression */:
                case 187 /* Block */:
                case 214 /* ModuleBlock */:
                case 188 /* VariableStatement */:
                case 190 /* ExpressionStatement */:
                case 191 /* IfStatement */:
                case 192 /* DoStatement */:
                case 193 /* WhileStatement */:
                case 194 /* ForStatement */:
                case 195 /* ForInStatement */:
                case 196 /* ForOfStatement */:
                case 197 /* ContinueStatement */:
                case 198 /* BreakStatement */:
                case 199 /* ReturnStatement */:
                case 201 /* SwitchStatement */:
                case 215 /* CaseBlock */:
                case 236 /* CaseClause */:
                case 237 /* DefaultClause */:
                case 202 /* LabeledStatement */:
                case 203 /* ThrowStatement */:
                case 204 /* TryStatement */:
                case 239 /* CatchClause */:
                case 206 /* VariableDeclaration */:
                case 207 /* VariableDeclarationList */:
                case 209 /* ClassDeclaration */:
                case 212 /* EnumDeclaration */:
                case 242 /* EnumMember */:
                case 222 /* ExportAssignment */:
                case 243 /* SourceFile */:
                case 235 /* JsxExpression */:
                case 228 /* JsxElement */:
                case 229 /* JsxSelfClosingElement */:
                case 233 /* JsxAttribute */:
                case 234 /* JsxSpreadAttribute */:
                case 230 /* JsxOpeningElement */:
                    ts.forEachChild(node, checkFunctionAndClassExpressionBodies);
                    break;
            }
        }
        function checkSourceFile(node) {
            var start = new Date().getTime();
            checkSourceFileWorker(node);
            ts.checkTime += new Date().getTime() - start;
        }
        // Fully type check a source file and collect the relevant diagnostics.
        function checkSourceFileWorker(node) {
            var links = getNodeLinks(node);
            if (!(links.flags & 1 /* TypeChecked */)) {
                // Check whether the file has declared it is the default lib,
                // and whether the user has specifically chosen to avoid checking it.
                if (node.isDefaultLib && compilerOptions.skipDefaultLibCheck) {
                    return;
                }
                // Grammar checking
                checkGrammarSourceFile(node);
                emitExtends = false;
                emitDecorate = false;
                emitParam = false;
                potentialThisCollisions.length = 0;
                ts.forEach(node.statements, checkSourceElement);
                checkFunctionAndClassExpressionBodies(node);
                if (ts.isExternalModule(node)) {
                    checkExternalModuleExports(node);
                }
                if (potentialThisCollisions.length) {
                    ts.forEach(potentialThisCollisions, checkIfThisIsCapturedInEnclosingScope);
                    potentialThisCollisions.length = 0;
                }
                if (emitExtends) {
                    links.flags |= 8 /* EmitExtends */;
                }
                if (emitDecorate) {
                    links.flags |= 16 /* EmitDecorate */;
                }
                if (emitParam) {
                    links.flags |= 32 /* EmitParam */;
                }
                if (emitAwaiter) {
                    links.flags |= 64 /* EmitAwaiter */;
                }
                if (emitGenerator || (emitAwaiter && languageVersion < 2 /* ES6 */)) {
                    links.flags |= 128 /* EmitGenerator */;
                }
                links.flags |= 1 /* TypeChecked */;
            }
        }
        function getDiagnostics(sourceFile) {
            throwIfNonDiagnosticsProducing();
            if (sourceFile) {
                checkSourceFile(sourceFile);
                return diagnostics.getDiagnostics(sourceFile.fileName);
            }
            ts.forEach(host.getSourceFiles(), checkSourceFile);
            return diagnostics.getDiagnostics();
        }
        function getGlobalDiagnostics() {
            throwIfNonDiagnosticsProducing();
            return diagnostics.getGlobalDiagnostics();
        }
        function throwIfNonDiagnosticsProducing() {
            if (!produceDiagnostics) {
                throw new Error("Trying to get diagnostics from a type checker that does not produce them.");
            }
        }
        // Language service support
        function isInsideWithStatementBody(node) {
            if (node) {
                while (node.parent) {
                    if (node.parent.kind === 200 /* WithStatement */ && node.parent.statement === node) {
                        return true;
                    }
                    node = node.parent;
                }
            }
            return false;
        }
        function getSymbolsInScope(location, meaning) {
            var symbols = {};
            var memberFlags = 0;
            if (isInsideWithStatementBody(location)) {
                // We cannot answer semantic questions within a with block, do not proceed any further
                return [];
            }
            populateSymbols();
            return symbolsToArray(symbols);
            function populateSymbols() {
                while (location) {
                    if (location.locals && !isGlobalSourceFile(location)) {
                        copySymbols(location.locals, meaning);
                    }
                    switch (location.kind) {
                        case 243 /* SourceFile */:
                            if (!ts.isExternalModule(location)) {
                                break;
                            }
                        case 213 /* ModuleDeclaration */:
                            copySymbols(getSymbolOfNode(location).exports, meaning & 8914931 /* ModuleMember */);
                            break;
                        case 212 /* EnumDeclaration */:
                            copySymbols(getSymbolOfNode(location).exports, meaning & 8 /* EnumMember */);
                            break;
                        case 181 /* ClassExpression */:
                            if (location.name) {
                                copySymbol(location.symbol, meaning);
                            }
                        // Fall through
                        case 209 /* ClassDeclaration */:
                        case 210 /* InterfaceDeclaration */:
                            if (!(memberFlags & 128 /* Static */)) {
                                copySymbols(getSymbolOfNode(location).members, meaning & 793056 /* Type */);
                            }
                            break;
                        case 168 /* FunctionExpression */:
                            if (location.name) {
                                copySymbol(location.symbol, meaning);
                            }
                            break;
                    }
                    memberFlags = location.flags;
                    location = location.parent;
                }
                copySymbols(globals, meaning);
            }
            // Returns 'true' if we should stop processing symbols.
            function copySymbol(symbol, meaning) {
                if (symbol.flags & meaning) {
                    var id = symbol.name;
                    if (!isReservedMemberName(id) && !ts.hasProperty(symbols, id)) {
                        symbols[id] = symbol;
                    }
                }
            }
            function copySymbols(source, meaning) {
                if (meaning) {
                    for (var id in source) {
                        if (ts.hasProperty(source, id)) {
                            copySymbol(source[id], meaning);
                        }
                    }
                }
            }
        }
        function isTypeDeclarationName(name) {
            return name.kind === 66 /* Identifier */ &&
                isTypeDeclaration(name.parent) &&
                name.parent.name === name;
        }
        function isTypeDeclaration(node) {
            switch (node.kind) {
                case 133 /* TypeParameter */:
                case 209 /* ClassDeclaration */:
                case 210 /* InterfaceDeclaration */:
                case 211 /* TypeAliasDeclaration */:
                case 212 /* EnumDeclaration */:
                    return true;
            }
        }
        // True if the given identifier is part of a type reference
        function isTypeReferenceIdentifier(entityName) {
            var node = entityName;
            while (node.parent && node.parent.kind === 131 /* QualifiedName */) {
                node = node.parent;
            }
            return node.parent && node.parent.kind === 147 /* TypeReference */;
        }
        function isHeritageClauseElementIdentifier(entityName) {
            var node = entityName;
            while (node.parent && node.parent.kind === 161 /* PropertyAccessExpression */) {
                node = node.parent;
            }
            return node.parent && node.parent.kind === 183 /* ExpressionWithTypeArguments */;
        }
        function getLeftSideOfImportEqualsOrExportAssignment(nodeOnRightSide) {
            while (nodeOnRightSide.parent.kind === 131 /* QualifiedName */) {
                nodeOnRightSide = nodeOnRightSide.parent;
            }
            if (nodeOnRightSide.parent.kind === 216 /* ImportEqualsDeclaration */) {
                return nodeOnRightSide.parent.moduleReference === nodeOnRightSide && nodeOnRightSide.parent;
            }
            if (nodeOnRightSide.parent.kind === 222 /* ExportAssignment */) {
                return nodeOnRightSide.parent.expression === nodeOnRightSide && nodeOnRightSide.parent;
            }
            return undefined;
        }
        function isInRightSideOfImportOrExportAssignment(node) {
            return getLeftSideOfImportEqualsOrExportAssignment(node) !== undefined;
        }
        function getSymbolOfEntityNameOrPropertyAccessExpression(entityName) {
            if (ts.isDeclarationName(entityName)) {
                return getSymbolOfNode(entityName.parent);
            }
            if (entityName.parent.kind === 222 /* ExportAssignment */) {
                return resolveEntityName(entityName, 
                /*all meanings*/ 107455 /* Value */ | 793056 /* Type */ | 1536 /* Namespace */ | 8388608 /* Alias */);
            }
            if (entityName.kind !== 161 /* PropertyAccessExpression */) {
                if (isInRightSideOfImportOrExportAssignment(entityName)) {
                    // Since we already checked for ExportAssignment, this really could only be an Import
                    return getSymbolOfPartOfRightHandSideOfImportEquals(entityName);
                }
            }
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(entityName)) {
                entityName = entityName.parent;
            }
            if (isHeritageClauseElementIdentifier(entityName)) {
                var meaning = entityName.parent.kind === 183 /* ExpressionWithTypeArguments */ ? 793056 /* Type */ : 1536 /* Namespace */;
                meaning |= 8388608 /* Alias */;
                return resolveEntityName(entityName, meaning);
            }
            else if ((entityName.parent.kind === 230 /* JsxOpeningElement */) || (entityName.parent.kind === 229 /* JsxSelfClosingElement */)) {
                return getJsxElementTagSymbol(entityName.parent);
            }
            else if (ts.isExpression(entityName)) {
                if (ts.nodeIsMissing(entityName)) {
                    // Missing entity name.
                    return undefined;
                }
                if (entityName.kind === 66 /* Identifier */) {
                    // Include aliases in the meaning, this ensures that we do not follow aliases to where they point and instead
                    // return the alias symbol.
                    var meaning = 107455 /* Value */ | 8388608 /* Alias */;
                    return resolveEntityName(entityName, meaning);
                }
                else if (entityName.kind === 161 /* PropertyAccessExpression */) {
                    var symbol = getNodeLinks(entityName).resolvedSymbol;
                    if (!symbol) {
                        checkPropertyAccessExpression(entityName);
                    }
                    return getNodeLinks(entityName).resolvedSymbol;
                }
                else if (entityName.kind === 131 /* QualifiedName */) {
                    var symbol = getNodeLinks(entityName).resolvedSymbol;
                    if (!symbol) {
                        checkQualifiedName(entityName);
                    }
                    return getNodeLinks(entityName).resolvedSymbol;
                }
            }
            else if (isTypeReferenceIdentifier(entityName)) {
                var meaning = entityName.parent.kind === 147 /* TypeReference */ ? 793056 /* Type */ : 1536 /* Namespace */;
                // Include aliases in the meaning, this ensures that we do not follow aliases to where they point and instead
                // return the alias symbol.
                meaning |= 8388608 /* Alias */;
                return resolveEntityName(entityName, meaning);
            }
            else if (entityName.parent.kind === 233 /* JsxAttribute */) {
                return getJsxAttributePropertySymbol(entityName.parent);
            }
            if (entityName.parent.kind === 146 /* TypePredicate */) {
                return resolveEntityName(entityName, 1 /* FunctionScopedVariable */);
            }
            // Do we want to return undefined here?
            return undefined;
        }
        function getSymbolInfo(node) {
            if (isInsideWithStatementBody(node)) {
                // We cannot answer semantic questions within a with block, do not proceed any further
                return undefined;
            }
            if (ts.isDeclarationName(node)) {
                // This is a declaration, call getSymbolOfNode
                return getSymbolOfNode(node.parent);
            }
            if (node.kind === 66 /* Identifier */ && isInRightSideOfImportOrExportAssignment(node)) {
                return node.parent.kind === 222 /* ExportAssignment */
                    ? getSymbolOfEntityNameOrPropertyAccessExpression(node)
                    : getSymbolOfPartOfRightHandSideOfImportEquals(node);
            }
            switch (node.kind) {
                case 66 /* Identifier */:
                case 161 /* PropertyAccessExpression */:
                case 131 /* QualifiedName */:
                    return getSymbolOfEntityNameOrPropertyAccessExpression(node);
                case 94 /* ThisKeyword */:
                case 92 /* SuperKeyword */:
                    var type = checkExpression(node);
                    return type.symbol;
                case 117 /* ConstructorKeyword */:
                    // constructor keyword for an overload, should take us to the definition if it exist
                    var constructorDeclaration = node.parent;
                    if (constructorDeclaration && constructorDeclaration.kind === 140 /* Constructor */) {
                        return constructorDeclaration.parent.symbol;
                    }
                    return undefined;
                case 8 /* StringLiteral */:
                    // External module name in an import declaration
                    if ((ts.isExternalModuleImportEqualsDeclaration(node.parent.parent) &&
                        ts.getExternalModuleImportEqualsDeclarationExpression(node.parent.parent) === node) ||
                        ((node.parent.kind === 217 /* ImportDeclaration */ || node.parent.kind === 223 /* ExportDeclaration */) &&
                            node.parent.moduleSpecifier === node)) {
                        return resolveExternalModuleName(node, node);
                    }
                // fall through
                case 7 /* NumericLiteral */:
                    // index access
                    if (node.parent.kind === 162 /* ElementAccessExpression */ && node.parent.argumentExpression === node) {
                        var objectType = checkExpression(node.parent.expression);
                        if (objectType === unknownType)
                            return undefined;
                        var apparentType = getApparentType(objectType);
                        if (apparentType === unknownType)
                            return undefined;
                        return getPropertyOfType(apparentType, node.text);
                    }
                    break;
            }
            return undefined;
        }
        function getShorthandAssignmentValueSymbol(location) {
            // The function returns a value symbol of an identifier in the short-hand property assignment.
            // This is necessary as an identifier in short-hand property assignment can contains two meaning:
            // property name and property value.
            if (location && location.kind === 241 /* ShorthandPropertyAssignment */) {
                return resolveEntityName(location.name, 107455 /* Value */);
            }
            return undefined;
        }
        function getTypeOfNode(node) {
            if (isInsideWithStatementBody(node)) {
                // We cannot answer semantic questions within a with block, do not proceed any further
                return unknownType;
            }
            if (ts.isTypeNode(node)) {
                return getTypeFromTypeNode(node);
            }
            if (ts.isExpression(node)) {
                return getTypeOfExpression(node);
            }
            if (ts.isExpressionWithTypeArgumentsInClassExtendsClause(node)) {
                // A SyntaxKind.ExpressionWithTypeArguments is considered a type node, except when it occurs in the
                // extends clause of a class. We handle that case here.
                return getBaseTypes(getDeclaredTypeOfSymbol(getSymbolOfNode(node.parent.parent)))[0];
            }
            if (isTypeDeclaration(node)) {
                // In this case, we call getSymbolOfNode instead of getSymbolInfo because it is a declaration
                var symbol = getSymbolOfNode(node);
                return getDeclaredTypeOfSymbol(symbol);
            }
            if (isTypeDeclarationName(node)) {
                var symbol = getSymbolInfo(node);
                return symbol && getDeclaredTypeOfSymbol(symbol);
            }
            if (ts.isDeclaration(node)) {
                // In this case, we call getSymbolOfNode instead of getSymbolInfo because it is a declaration
                var symbol = getSymbolOfNode(node);
                return getTypeOfSymbol(symbol);
            }
            if (ts.isDeclarationName(node)) {
                var symbol = getSymbolInfo(node);
                return symbol && getTypeOfSymbol(symbol);
            }
            if (ts.isBindingPattern(node)) {
                return getTypeForVariableLikeDeclaration(node.parent);
            }
            if (isInRightSideOfImportOrExportAssignment(node)) {
                var symbol = getSymbolInfo(node);
                var declaredType = symbol && getDeclaredTypeOfSymbol(symbol);
                return declaredType !== unknownType ? declaredType : getTypeOfSymbol(symbol);
            }
            return unknownType;
        }
        function getTypeOfExpression(expr) {
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(expr)) {
                expr = expr.parent;
            }
            return checkExpression(expr);
        }
        /**
          * Gets either the static or instance type of a class element, based on
          * whether the element is declared as "static".
          */
        function getParentTypeOfClassElement(node) {
            var classSymbol = getSymbolOfNode(node.parent);
            return node.flags & 128 /* Static */
                ? getTypeOfSymbol(classSymbol)
                : getDeclaredTypeOfSymbol(classSymbol);
        }
        // Return the list of properties of the given type, augmented with properties from Function
        // if the type has call or construct signatures
        function getAugmentedPropertiesOfType(type) {
            type = getApparentType(type);
            var propsByName = createSymbolTable(getPropertiesOfType(type));
            if (getSignaturesOfType(type, 0 /* Call */).length || getSignaturesOfType(type, 1 /* Construct */).length) {
                ts.forEach(getPropertiesOfType(globalFunctionType), function (p) {
                    if (!ts.hasProperty(propsByName, p.name)) {
                        propsByName[p.name] = p;
                    }
                });
            }
            return getNamedMembers(propsByName);
        }
        function getRootSymbols(symbol) {
            if (symbol.flags & 268435456 /* UnionProperty */) {
                var symbols = [];
                var name_7 = symbol.name;
                ts.forEach(getSymbolLinks(symbol).unionType.types, function (t) {
                    symbols.push(getPropertyOfType(t, name_7));
                });
                return symbols;
            }
            else if (symbol.flags & 67108864 /* Transient */) {
                var target = getSymbolLinks(symbol).target;
                if (target) {
                    return [target];
                }
            }
            return [symbol];
        }
        // Emitter support
        // When resolved as an expression identifier, if the given node references an exported entity, return the declaration
        // node of the exported entity's container. Otherwise, return undefined.
        function getReferencedExportContainer(node) {
            var symbol = getReferencedValueSymbol(node);
            if (symbol) {
                if (symbol.flags & 1048576 /* ExportValue */) {
                    // If we reference an exported entity within the same module declaration, then whether
                    // we prefix depends on the kind of entity. SymbolFlags.ExportHasLocal encompasses all the
                    // kinds that we do NOT prefix.
                    var exportSymbol = getMergedSymbol(symbol.exportSymbol);
                    if (exportSymbol.flags & 944 /* ExportHasLocal */) {
                        return undefined;
                    }
                    symbol = exportSymbol;
                }
                var parentSymbol = getParentOfSymbol(symbol);
                if (parentSymbol) {
                    if (parentSymbol.flags & 512 /* ValueModule */ && parentSymbol.valueDeclaration.kind === 243 /* SourceFile */) {
                        return parentSymbol.valueDeclaration;
                    }
                    for (var n = node.parent; n; n = n.parent) {
                        if ((n.kind === 213 /* ModuleDeclaration */ || n.kind === 212 /* EnumDeclaration */) && getSymbolOfNode(n) === parentSymbol) {
                            return n;
                        }
                    }
                }
            }
        }
        // When resolved as an expression identifier, if the given node references an import, return the declaration of
        // that import. Otherwise, return undefined.
        function getReferencedImportDeclaration(node) {
            var symbol = getReferencedValueSymbol(node);
            return symbol && symbol.flags & 8388608 /* Alias */ ? getDeclarationOfAliasSymbol(symbol) : undefined;
        }
        function isStatementWithLocals(node) {
            switch (node.kind) {
                case 187 /* Block */:
                case 215 /* CaseBlock */:
                case 194 /* ForStatement */:
                case 195 /* ForInStatement */:
                case 196 /* ForOfStatement */:
                    return true;
            }
            return false;
        }
        function isNestedRedeclarationSymbol(symbol) {
            if (symbol.flags & 418 /* BlockScoped */) {
                var links = getSymbolLinks(symbol);
                if (links.isNestedRedeclaration === undefined) {
                    var container = ts.getEnclosingBlockScopeContainer(symbol.valueDeclaration);
                    links.isNestedRedeclaration = isStatementWithLocals(container) &&
                        !!resolveName(container.parent, symbol.name, 107455 /* Value */, undefined, undefined);
                }
                return links.isNestedRedeclaration;
            }
            return false;
        }
        // When resolved as an expression identifier, if the given node references a nested block scoped entity with
        // a name that hides an existing name, return the declaration of that entity. Otherwise, return undefined.
        function getReferencedNestedRedeclaration(node) {
            var symbol = getReferencedValueSymbol(node);
            return symbol && isNestedRedeclarationSymbol(symbol) ? symbol.valueDeclaration : undefined;
        }
        // Return true if the given node is a declaration of a nested block scoped entity with a name that hides an
        // existing name.
        function isNestedRedeclaration(node) {
            return isNestedRedeclarationSymbol(getSymbolOfNode(node));
        }
        function isValueAliasDeclaration(node) {
            switch (node.kind) {
                case 216 /* ImportEqualsDeclaration */:
                case 218 /* ImportClause */:
                case 219 /* NamespaceImport */:
                case 221 /* ImportSpecifier */:
                case 225 /* ExportSpecifier */:
                    return isAliasResolvedToValue(getSymbolOfNode(node));
                case 223 /* ExportDeclaration */:
                    var exportClause = node.exportClause;
                    return exportClause && ts.forEach(exportClause.elements, isValueAliasDeclaration);
                case 222 /* ExportAssignment */:
                    return node.expression && node.expression.kind === 66 /* Identifier */ ? isAliasResolvedToValue(getSymbolOfNode(node)) : true;
            }
            return false;
        }
        function isTopLevelValueImportEqualsWithEntityName(node) {
            if (node.parent.kind !== 243 /* SourceFile */ || !ts.isInternalModuleImportEqualsDeclaration(node)) {
                // parent is not source file or it is not reference to internal module
                return false;
            }
            var isValue = isAliasResolvedToValue(getSymbolOfNode(node));
            return isValue && node.moduleReference && !ts.nodeIsMissing(node.moduleReference);
        }
        function isAliasResolvedToValue(symbol) {
            var target = resolveAlias(symbol);
            if (target === unknownSymbol && compilerOptions.isolatedModules) {
                return true;
            }
            // const enums and modules that contain only const enums are not considered values from the emit perespective
            return target !== unknownSymbol && target && target.flags & 107455 /* Value */ && !isConstEnumOrConstEnumOnlyModule(target);
        }
        function isConstEnumOrConstEnumOnlyModule(s) {
            return isConstEnumSymbol(s) || s.constEnumOnlyModule;
        }
        function isReferencedAliasDeclaration(node, checkChildren) {
            if (ts.isAliasSymbolDeclaration(node)) {
                var symbol = getSymbolOfNode(node);
                if (getSymbolLinks(symbol).referenced) {
                    return true;
                }
            }
            if (checkChildren) {
                return ts.forEachChild(node, function (node) { return isReferencedAliasDeclaration(node, checkChildren); });
            }
            return false;
        }
        function isImplementationOfOverload(node) {
            if (ts.nodeIsPresent(node.body)) {
                var symbol = getSymbolOfNode(node);
                var signaturesOfSymbol = getSignaturesOfSymbol(symbol);
                // If this function body corresponds to function with multiple signature, it is implementation of overload
                // e.g.: function foo(a: string): string;
                //       function foo(a: number): number;
                //       function foo(a: any) { // This is implementation of the overloads
                //           return a;
                //       }
                return signaturesOfSymbol.length > 1 ||
                    // If there is single signature for the symbol, it is overload if that signature isn't coming from the node
                    // e.g.: function foo(a: string): string;
                    //       function foo(a: any) { // This is implementation of the overloads
                    //           return a;
                    //       }
                    (signaturesOfSymbol.length === 1 && signaturesOfSymbol[0].declaration !== node);
            }
            return false;
        }
        function getNodeCheckFlags(node) {
            return getNodeLinks(node).flags;
        }
        function getEnumMemberValue(node) {
            computeEnumMemberValues(node.parent);
            return getNodeLinks(node).enumMemberValue;
        }
        function getConstantValue(node) {
            if (node.kind === 242 /* EnumMember */) {
                return getEnumMemberValue(node);
            }
            var symbol = getNodeLinks(node).resolvedSymbol;
            if (symbol && (symbol.flags & 8 /* EnumMember */)) {
                // inline property\index accesses only for const enums
                if (ts.isConstEnumDeclaration(symbol.valueDeclaration.parent)) {
                    return getEnumMemberValue(symbol.valueDeclaration);
                }
            }
            return undefined;
        }
        /** Serializes an EntityName (with substitutions) to an appropriate JS constructor value. Used by the __metadata decorator. */
        function serializeEntityName(node, fallbackPath) {
            if (node.kind === 66 /* Identifier */) {
                // TODO(ron.buckton): The getExpressionNameSubstitution function has been removed, but calling it
                // here has no effect anyway as an identifier in a type name is not an expression.
                // var substitution = getExpressionNameSubstitution(<Identifier>node, getGeneratedNameForNode);
                // var text = substitution || (<Identifier>node).text;
                var text = node.text;
                if (fallbackPath) {
                    fallbackPath.push(text);
                }
                else {
                    return text;
                }
            }
            else {
                var left = serializeEntityName(node.left, fallbackPath);
                var right = serializeEntityName(node.right, fallbackPath);
                if (!fallbackPath) {
                    return left + "." + right;
                }
            }
        }
        /** Serializes a TypeReferenceNode to an appropriate JS constructor value. Used by the __metadata decorator. */
        function serializeTypeReferenceNode(node) {
            // serialization of a TypeReferenceNode uses the following rules:
            //
            // * The serialized type of a TypeReference that is `void` is "void 0".
            // * The serialized type of a TypeReference that is a `boolean` is "Boolean".
            // * The serialized type of a TypeReference that is an enum or `number` is "Number".
            // * The serialized type of a TypeReference that is a string literal or `string` is "String".
            // * The serialized type of a TypeReference that is a tuple is "Array".
            // * The serialized type of a TypeReference that is a `symbol` is "Symbol".
            // * The serialized type of a TypeReference with a value declaration is its entity name.
            // * The serialized type of a TypeReference with a call or construct signature is "Function".
            // * The serialized type of any other type is "Object".
            var type = getTypeFromTypeNode(node);
            if (type.flags & 16 /* Void */) {
                return "void 0";
            }
            else if (type.flags & 8 /* Boolean */) {
                return "Boolean";
            }
            else if (type.flags & 132 /* NumberLike */) {
                return "Number";
            }
            else if (type.flags & 258 /* StringLike */) {
                return "String";
            }
            else if (type.flags & 8192 /* Tuple */) {
                return "Array";
            }
            else if (type.flags & 2097152 /* ESSymbol */) {
                return "Symbol";
            }
            else if (type === unknownType) {
                var fallbackPath = [];
                serializeEntityName(node.typeName, fallbackPath);
                return fallbackPath;
            }
            else if (type.symbol && type.symbol.valueDeclaration) {
                return serializeEntityName(node.typeName);
            }
            else if (typeHasCallOrConstructSignatures(type)) {
                return "Function";
            }
            return "Object";
        }
        /** Serializes a TypeNode to an appropriate JS constructor value. Used by the __metadata decorator. */
        function serializeTypeNode(node) {
            // serialization of a TypeNode uses the following rules:
            //
            // * The serialized type of `void` is "void 0" (undefined).
            // * The serialized type of a parenthesized type is the serialized type of its nested type.
            // * The serialized type of a Function or Constructor type is "Function".
            // * The serialized type of an Array or Tuple type is "Array".
            // * The serialized type of `boolean` is "Boolean".
            // * The serialized type of `string` or a string-literal type is "String".
            // * The serialized type of a type reference is handled by `serializeTypeReferenceNode`.
            // * The serialized type of any other type node is "Object".
            if (node) {
                switch (node.kind) {
                    case 100 /* VoidKeyword */:
                        return "void 0";
                    case 155 /* ParenthesizedType */:
                        return serializeTypeNode(node.type);
                    case 148 /* FunctionType */:
                    case 149 /* ConstructorType */:
                        return "Function";
                    case 152 /* ArrayType */:
                    case 153 /* TupleType */:
                        return "Array";
                    case 116 /* BooleanKeyword */:
                        return "Boolean";
                    case 126 /* StringKeyword */:
                    case 8 /* StringLiteral */:
                        return "String";
                    case 124 /* NumberKeyword */:
                        return "Number";
                    case 147 /* TypeReference */:
                        return serializeTypeReferenceNode(node);
                    case 150 /* TypeQuery */:
                    case 151 /* TypeLiteral */:
                    case 154 /* UnionType */:
                    case 113 /* AnyKeyword */:
                        break;
                    default:
                        ts.Debug.fail("Cannot serialize unexpected type node.");
                        break;
                }
            }
            return "Object";
        }
        /** Serializes the type of a declaration to an appropriate JS constructor value. Used by the __metadata decorator for a class member. */
        function serializeTypeOfNode(node) {
            // serialization of the type of a declaration uses the following rules:
            //
            // * The serialized type of a ClassDeclaration is "Function"
            // * The serialized type of a ParameterDeclaration is the serialized type of its type annotation.
            // * The serialized type of a PropertyDeclaration is the serialized type of its type annotation.
            // * The serialized type of an AccessorDeclaration is the serialized type of the return type annotation of its getter or parameter type annotation of its setter.
            // * The serialized type of any other FunctionLikeDeclaration is "Function".
            // * The serialized type of any other node is "void 0".
            // 
            // For rules on serializing type annotations, see `serializeTypeNode`.
            switch (node.kind) {
                case 209 /* ClassDeclaration */: return "Function";
                case 137 /* PropertyDeclaration */: return serializeTypeNode(node.type);
                case 134 /* Parameter */: return serializeTypeNode(node.type);
                case 141 /* GetAccessor */: return serializeTypeNode(node.type);
                case 142 /* SetAccessor */: return serializeTypeNode(getSetAccessorTypeAnnotationNode(node));
            }
            if (ts.isFunctionLike(node)) {
                return "Function";
            }
            return "void 0";
        }
        /** Serializes the parameter types of a function or the constructor of a class. Used by the __metadata decorator for a method or set accessor. */
        function serializeParameterTypesOfNode(node) {
            // serialization of parameter types uses the following rules:
            //
            // * If the declaration is a class, the parameters of the first constructor with a body are used.
            // * If the declaration is function-like and has a body, the parameters of the function are used.
            // 
            // For the rules on serializing the type of each parameter declaration, see `serializeTypeOfDeclaration`.
            if (node) {
                var valueDeclaration;
                if (node.kind === 209 /* ClassDeclaration */) {
                    valueDeclaration = ts.getFirstConstructorWithBody(node);
                }
                else if (ts.isFunctionLike(node) && ts.nodeIsPresent(node.body)) {
                    valueDeclaration = node;
                }
                if (valueDeclaration) {
                    var result;
                    var parameters = valueDeclaration.parameters;
                    var parameterCount = parameters.length;
                    if (parameterCount > 0) {
                        result = new Array(parameterCount);
                        for (var i = 0; i < parameterCount; i++) {
                            if (parameters[i].dotDotDotToken) {
                                var parameterType = parameters[i].type;
                                if (parameterType.kind === 152 /* ArrayType */) {
                                    parameterType = parameterType.elementType;
                                }
                                else if (parameterType.kind === 147 /* TypeReference */ && parameterType.typeArguments && parameterType.typeArguments.length === 1) {
                                    parameterType = parameterType.typeArguments[0];
                                }
                                else {
                                    parameterType = undefined;
                                }
                                result[i] = serializeTypeNode(parameterType);
                            }
                            else {
                                result[i] = serializeTypeOfNode(parameters[i]);
                            }
                        }
                        return result;
                    }
                }
            }
            return emptyArray;
        }
        /** Serializes the return type of function. Used by the __metadata decorator for a method. */
        function serializeReturnTypeOfNode(node) {
            if (node && ts.isFunctionLike(node)) {
                return serializeTypeNode(node.type);
            }
            return "void 0";
        }
        function writeTypeOfDeclaration(declaration, enclosingDeclaration, flags, writer) {
            // Get type of the symbol if this is the valid symbol otherwise get type at location
            var symbol = getSymbolOfNode(declaration);
            var type = symbol && !(symbol.flags & (2048 /* TypeLiteral */ | 131072 /* Signature */))
                ? getTypeOfSymbol(symbol)
                : unknownType;
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
        }
        function writeReturnTypeOfSignatureDeclaration(signatureDeclaration, enclosingDeclaration, flags, writer) {
            var signature = getSignatureFromDeclaration(signatureDeclaration);
            getSymbolDisplayBuilder().buildTypeDisplay(getReturnTypeOfSignature(signature), writer, enclosingDeclaration, flags);
        }
        function writeTypeOfExpression(expr, enclosingDeclaration, flags, writer) {
            var type = getTypeOfExpression(expr);
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
        }
        function hasGlobalName(name) {
            return ts.hasProperty(globals, name);
        }
        function getReferencedValueSymbol(reference) {
            return getNodeLinks(reference).resolvedSymbol ||
                resolveName(reference, reference.text, 107455 /* Value */ | 1048576 /* ExportValue */ | 8388608 /* Alias */, 
                /*nodeNotFoundMessage*/ undefined, undefined);
        }
        function getReferencedValueDeclaration(reference) {
            ts.Debug.assert(!ts.nodeIsSynthesized(reference));
            var symbol = getReferencedValueSymbol(reference);
            return symbol && getExportSymbolOfValueSymbolIfExported(symbol).valueDeclaration;
        }
        function getBlockScopedVariableId(n) {
            ts.Debug.assert(!ts.nodeIsSynthesized(n));
            var isVariableDeclarationOrBindingElement = n.parent.kind === 158 /* BindingElement */ || (n.parent.kind === 206 /* VariableDeclaration */ && n.parent.name === n);
            var symbol = (isVariableDeclarationOrBindingElement ? getSymbolOfNode(n.parent) : undefined) ||
                getNodeLinks(n).resolvedSymbol ||
                resolveName(n, n.text, 107455 /* Value */ | 8388608 /* Alias */, undefined, undefined);
            var isLetOrConst = symbol &&
                (symbol.flags & 2 /* BlockScopedVariable */) &&
                symbol.valueDeclaration.parent.kind !== 239 /* CatchClause */;
            if (isLetOrConst) {
                // side-effect of calling this method:
                //   assign id to symbol if it was not yet set
                getSymbolLinks(symbol);
                return symbol.id;
            }
            return undefined;
        }
        function instantiateSingleCallFunctionType(functionType, typeArguments) {
            if (functionType === unknownType) {
                return unknownType;
            }
            var signature = getSingleCallSignature(functionType);
            if (!signature) {
                return unknownType;
            }
            var instantiatedSignature = getSignatureInstantiation(signature, typeArguments);
            return getOrCreateTypeFromSignature(instantiatedSignature);
        }
        function createResolver() {
            return {
                getReferencedExportContainer: getReferencedExportContainer,
                getReferencedImportDeclaration: getReferencedImportDeclaration,
                getReferencedNestedRedeclaration: getReferencedNestedRedeclaration,
                isNestedRedeclaration: isNestedRedeclaration,
                isValueAliasDeclaration: isValueAliasDeclaration,
                hasGlobalName: hasGlobalName,
                isReferencedAliasDeclaration: isReferencedAliasDeclaration,
                getNodeCheckFlags: getNodeCheckFlags,
                isTopLevelValueImportEqualsWithEntityName: isTopLevelValueImportEqualsWithEntityName,
                isDeclarationVisible: isDeclarationVisible,
                isImplementationOfOverload: isImplementationOfOverload,
                writeTypeOfDeclaration: writeTypeOfDeclaration,
                writeReturnTypeOfSignatureDeclaration: writeReturnTypeOfSignatureDeclaration,
                writeTypeOfExpression: writeTypeOfExpression,
                isSymbolAccessible: isSymbolAccessible,
                isEntityNameVisible: isEntityNameVisible,
                getConstantValue: getConstantValue,
                collectLinkedAliases: collectLinkedAliases,
                getBlockScopedVariableId: getBlockScopedVariableId,
                getReferencedValueDeclaration: getReferencedValueDeclaration,
                serializeTypeOfNode: serializeTypeOfNode,
                serializeParameterTypesOfNode: serializeParameterTypesOfNode,
                serializeReturnTypeOfNode: serializeReturnTypeOfNode
            };
        }
        function initializeTypeChecker() {
            // Bind all source files and propagate errors
            ts.forEach(host.getSourceFiles(), function (file) {
                ts.bindSourceFile(file);
            });
            // Initialize global symbol table
            ts.forEach(host.getSourceFiles(), function (file) {
                if (!ts.isExternalModule(file)) {
                    mergeSymbolTable(globals, file.locals);
                }
            });
            // Initialize special symbols
            getSymbolLinks(undefinedSymbol).type = undefinedType;
            getSymbolLinks(argumentsSymbol).type = getGlobalType("IArguments");
            getSymbolLinks(unknownSymbol).type = unknownType;
            globals[undefinedSymbol.name] = undefinedSymbol;
            // Initialize special types
            globalArrayType = getGlobalType("Array", 1);
            globalObjectType = getGlobalType("Object");
            globalFunctionType = getGlobalType("Function");
            globalStringType = getGlobalType("String");
            globalNumberType = getGlobalType("Number");
            globalBooleanType = getGlobalType("Boolean");
            globalRegExpType = getGlobalType("RegExp");
            jsxElementType = getExportedTypeFromNamespace("JSX", JsxNames.Element);
            getGlobalClassDecoratorType = ts.memoize(function () { return getGlobalType("ClassDecorator"); });
            getGlobalPropertyDecoratorType = ts.memoize(function () { return getGlobalType("PropertyDecorator"); });
            getGlobalMethodDecoratorType = ts.memoize(function () { return getGlobalType("MethodDecorator"); });
            getGlobalParameterDecoratorType = ts.memoize(function () { return getGlobalType("ParameterDecorator"); });
            getGlobalTypedPropertyDescriptorType = ts.memoize(function () { return getGlobalType("TypedPropertyDescriptor", 1); });
            getGlobalPromiseType = ts.memoize(function () { return getGlobalType("Promise", 1); });
            tryGetGlobalPromiseType = ts.memoize(function () { return getGlobalSymbol("Promise", 793056 /* Type */, undefined) && getGlobalPromiseType(); });
            getGlobalPromiseLikeType = ts.memoize(function () { return getGlobalType("PromiseLike", 1); });
            getInstantiatedGlobalPromiseLikeType = ts.memoize(createInstantiatedPromiseLikeType);
            getGlobalPromiseConstructorSymbol = ts.memoize(function () { return getGlobalValueSymbol("Promise"); });
            getGlobalPromiseConstructorLikeType = ts.memoize(function () { return getGlobalType("PromiseConstructorLike"); });
            getGlobalThenableType = ts.memoize(createThenableType);
            // If we're in ES6 mode, load the TemplateStringsArray.
            // Otherwise, default to 'unknown' for the purposes of type checking in LS scenarios.
            if (languageVersion >= 2 /* ES6 */) {
                globalTemplateStringsArrayType = getGlobalType("TemplateStringsArray");
                globalESSymbolType = getGlobalType("Symbol");
                globalESSymbolConstructorSymbol = getGlobalValueSymbol("Symbol");
                globalIterableType = getGlobalType("Iterable", 1);
                globalIteratorType = getGlobalType("Iterator", 1);
                globalIterableIteratorType = getGlobalType("IterableIterator", 1);
            }
            else {
                globalTemplateStringsArrayType = unknownType;
                // Consider putting Symbol interface in lib.d.ts. On the plus side, putting it in lib.d.ts would make it
                // extensible for Polyfilling Symbols. But putting it into lib.d.ts could also break users that have
                // a global Symbol already, particularly if it is a class.
                globalESSymbolType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
                globalESSymbolConstructorSymbol = undefined;
                globalIterableType = emptyGenericType;
                globalIteratorType = emptyGenericType;
                globalIterableIteratorType = emptyGenericType;
            }
            anyArrayType = createArrayType(anyType);
        }
        function createInstantiatedPromiseLikeType() {
            var promiseLikeType = getGlobalPromiseLikeType();
            if (promiseLikeType !== emptyObjectType) {
                return createTypeReference(promiseLikeType, [anyType]);
            }
            return emptyObjectType;
        }
        function createThenableType() {
            // build the thenable type that is used to verify against a non-promise "thenable" operand to `await`.
            var thenPropertySymbol = createSymbol(67108864 /* Transient */ | 4 /* Property */, "then");
            getSymbolLinks(thenPropertySymbol).type = globalFunctionType;
            var thenableType = createObjectType(32768 /* Anonymous */);
            thenableType.properties = [thenPropertySymbol];
            thenableType.members = createSymbolTable(thenableType.properties);
            thenableType.callSignatures = [];
            thenableType.constructSignatures = [];
            return thenableType;
        }
        // GRAMMAR CHECKING
        function checkGrammarDecorators(node) {
            if (!node.decorators) {
                return false;
            }
            if (!ts.nodeCanBeDecorated(node)) {
                return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_are_not_valid_here);
            }
            else if (languageVersion < 1 /* ES5 */) {
                return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_are_only_available_when_targeting_ECMAScript_5_and_higher);
            }
            else if (node.kind === 141 /* GetAccessor */ || node.kind === 142 /* SetAccessor */) {
                var accessors = ts.getAllAccessorDeclarations(node.parent.members, node);
                if (accessors.firstAccessor.decorators && node === accessors.secondAccessor) {
                    return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_cannot_be_applied_to_multiple_get_Slashset_accessors_of_the_same_name);
                }
            }
            return false;
        }
        function checkGrammarModifiers(node) {
            switch (node.kind) {
                case 141 /* GetAccessor */:
                case 142 /* SetAccessor */:
                case 140 /* Constructor */:
                case 137 /* PropertyDeclaration */:
                case 136 /* PropertySignature */:
                case 139 /* MethodDeclaration */:
                case 138 /* MethodSignature */:
                case 145 /* IndexSignature */:
                case 213 /* ModuleDeclaration */:
                case 217 /* ImportDeclaration */:
                case 216 /* ImportEqualsDeclaration */:
                case 223 /* ExportDeclaration */:
                case 222 /* ExportAssignment */:
                case 134 /* Parameter */:
                    break;
                case 208 /* FunctionDeclaration */:
                    if (node.modifiers && (node.modifiers.length > 1 || node.modifiers[0].kind !== 114 /* AsyncKeyword */) &&
                        node.parent.kind !== 214 /* ModuleBlock */ && node.parent.kind !== 243 /* SourceFile */) {
                        return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                    }
                    break;
                case 209 /* ClassDeclaration */:
                case 210 /* InterfaceDeclaration */:
                case 188 /* VariableStatement */:
                case 211 /* TypeAliasDeclaration */:
                    if (node.modifiers && node.parent.kind !== 214 /* ModuleBlock */ && node.parent.kind !== 243 /* SourceFile */) {
                        return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                    }
                    break;
                case 212 /* EnumDeclaration */:
                    if (node.modifiers && (node.modifiers.length > 1 || node.modifiers[0].kind !== 71 /* ConstKeyword */) &&
                        node.parent.kind !== 214 /* ModuleBlock */ && node.parent.kind !== 243 /* SourceFile */) {
                        return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                    }
                    break;
                default:
                    return false;
            }
            if (!node.modifiers) {
                return;
            }
            var lastStatic, lastPrivate, lastProtected, lastDeclare, lastAsync;
            var flags = 0;
            for (var _i = 0, _a = node.modifiers; _i < _a.length; _i++) {
                var modifier = _a[_i];
                switch (modifier.kind) {
                    case 109 /* PublicKeyword */:
                    case 108 /* ProtectedKeyword */:
                    case 107 /* PrivateKeyword */:
                        var text = void 0;
                        if (modifier.kind === 109 /* PublicKeyword */) {
                            text = "public";
                        }
                        else if (modifier.kind === 108 /* ProtectedKeyword */) {
                            text = "protected";
                            lastProtected = modifier;
                        }
                        else {
                            text = "private";
                            lastPrivate = modifier;
                        }
                        if (flags & 112 /* AccessibilityModifier */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics.Accessibility_modifier_already_seen);
                        }
                        else if (flags & 128 /* Static */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, text, "static");
                        }
                        else if (flags & 131072 /* Async */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, text, "async");
                        }
                        else if (node.parent.kind === 214 /* ModuleBlock */ || node.parent.kind === 243 /* SourceFile */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_module_element, text);
                        }
                        flags |= ts.modifierToFlag(modifier.kind);
                        break;
                    case 110 /* StaticKeyword */:
                        if (flags & 128 /* Static */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "static");
                        }
                        else if (flags & 131072 /* Async */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, "static", "async");
                        }
                        else if (node.parent.kind === 214 /* ModuleBlock */ || node.parent.kind === 243 /* SourceFile */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_module_element, "static");
                        }
                        else if (node.kind === 134 /* Parameter */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "static");
                        }
                        flags |= 128 /* Static */;
                        lastStatic = modifier;
                        break;
                    case 79 /* ExportKeyword */:
                        if (flags & 1 /* Export */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "export");
                        }
                        else if (flags & 2 /* Ambient */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, "export", "declare");
                        }
                        else if (flags & 131072 /* Async */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, "export", "async");
                        }
                        else if (node.parent.kind === 209 /* ClassDeclaration */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_class_element, "export");
                        }
                        else if (node.kind === 134 /* Parameter */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "export");
                        }
                        flags |= 1 /* Export */;
                        break;
                    case 118 /* DeclareKeyword */:
                        if (flags & 2 /* Ambient */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "declare");
                        }
                        else if (flags & 131072 /* Async */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_be_used_in_an_ambient_context, "async");
                        }
                        else if (node.parent.kind === 209 /* ClassDeclaration */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_class_element, "declare");
                        }
                        else if (node.kind === 134 /* Parameter */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "declare");
                        }
                        else if (ts.isInAmbientContext(node.parent) && node.parent.kind === 214 /* ModuleBlock */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics.A_declare_modifier_cannot_be_used_in_an_already_ambient_context);
                        }
                        flags |= 2 /* Ambient */;
                        lastDeclare = modifier;
                        break;
                    case 114 /* AsyncKeyword */:
                        if (flags & 131072 /* Async */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "async");
                        }
                        else if (flags & 2 /* Ambient */ || ts.isInAmbientContext(node.parent)) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_be_used_in_an_ambient_context, "async");
                        }
                        else if (node.kind === 134 /* Parameter */) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "async");
                        }
                        flags |= 131072 /* Async */;
                        lastAsync = modifier;
                        break;
                }
            }
            if (node.kind === 140 /* Constructor */) {
                if (flags & 128 /* Static */) {
                    return grammarErrorOnNode(lastStatic, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "static");
                }
                else if (flags & 64 /* Protected */) {
                    return grammarErrorOnNode(lastProtected, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "protected");
                }
                else if (flags & 32 /* Private */) {
                    return grammarErrorOnNode(lastPrivate, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "private");
                }
                else if (flags & 131072 /* Async */) {
                    return grammarErrorOnNode(lastAsync, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "async");
                }
                return;
            }
            else if ((node.kind === 217 /* ImportDeclaration */ || node.kind === 216 /* ImportEqualsDeclaration */) && flags & 2 /* Ambient */) {
                return grammarErrorOnNode(lastDeclare, ts.Diagnostics.A_0_modifier_cannot_be_used_with_an_import_declaration, "declare");
            }
            else if (node.kind === 134 /* Parameter */ && (flags & 112 /* AccessibilityModifier */) && ts.isBindingPattern(node.name)) {
                return grammarErrorOnNode(node, ts.Diagnostics.A_parameter_property_may_not_be_a_binding_pattern);
            }
            if (flags & 131072 /* Async */) {
                return checkGrammarAsyncModifier(node, lastAsync);
            }
        }
        function checkGrammarAsyncModifier(node, asyncModifier) {
            if (languageVersion < 2 /* ES6 */) {
                return grammarErrorOnNode(asyncModifier, ts.Diagnostics.Async_functions_are_only_available_when_targeting_ECMAScript_6_and_higher);
            }
            switch (node.kind) {
                case 139 /* MethodDeclaration */:
                case 208 /* FunctionDeclaration */:
                case 168 /* FunctionExpression */:
                case 169 /* ArrowFunction */:
                    if (!node.asteriskToken) {
                        return false;
                    }
                    break;
            }
            return grammarErrorOnNode(asyncModifier, ts.Diagnostics._0_modifier_cannot_be_used_here, "async");
        }
        function checkGrammarForDisallowedTrailingComma(list) {
            if (list && list.hasTrailingComma) {
                var start = list.end - ",".length;
                var end = list.end;
                var sourceFile = ts.getSourceFileOfNode(list[0]);
                return grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Trailing_comma_not_allowed);
            }
        }
        function checkGrammarTypeParameterList(node, typeParameters, file) {
            if (checkGrammarForDisallowedTrailingComma(typeParameters)) {
                return true;
            }
            if (typeParameters && typeParameters.length === 0) {
                var start = typeParameters.pos - "<".length;
                var end = ts.skipTrivia(file.text, typeParameters.end) + ">".length;
                return grammarErrorAtPos(file, start, end - start, ts.Diagnostics.Type_parameter_list_cannot_be_empty);
            }
        }
        function checkGrammarParameterList(parameters) {
            if (checkGrammarForDisallowedTrailingComma(parameters)) {
                return true;
            }
            var seenOptionalParameter = false;
            var parameterCount = parameters.length;
            for (var i = 0; i < parameterCount; i++) {
                var parameter = parameters[i];
                if (parameter.dotDotDotToken) {
                    if (i !== (parameterCount - 1)) {
                        return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.A_rest_parameter_must_be_last_in_a_parameter_list);
                    }
                    if (ts.isBindingPattern(parameter.name)) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_rest_element_cannot_contain_a_binding_pattern);
                    }
                    if (parameter.questionToken) {
                        return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.A_rest_parameter_cannot_be_optional);
                    }
                    if (parameter.initializer) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_rest_parameter_cannot_have_an_initializer);
                    }
                }
                else if (parameter.questionToken || parameter.initializer) {
                    seenOptionalParameter = true;
                    if (parameter.questionToken && parameter.initializer) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.Parameter_cannot_have_question_mark_and_initializer);
                    }
                }
                else {
                    if (seenOptionalParameter) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_required_parameter_cannot_follow_an_optional_parameter);
                    }
                }
            }
        }
        function checkGrammarFunctionLikeDeclaration(node) {
            // Prevent cascading error by short-circuit
            var file = ts.getSourceFileOfNode(node);
            return checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarTypeParameterList(node, node.typeParameters, file) ||
                checkGrammarParameterList(node.parameters) || checkGrammarArrowFunction(node, file);
        }
        function checkGrammarArrowFunction(node, file) {
            if (node.kind === 169 /* ArrowFunction */) {
                var arrowFunction = node;
                var startLine = ts.getLineAndCharacterOfPosition(file, arrowFunction.equalsGreaterThanToken.pos).line;
                var endLine = ts.getLineAndCharacterOfPosition(file, arrowFunction.equalsGreaterThanToken.end).line;
                if (startLine !== endLine) {
                    return grammarErrorOnNode(arrowFunction.equalsGreaterThanToken, ts.Diagnostics.Line_terminator_not_permitted_before_arrow);
                }
            }
            return false;
        }
        function checkGrammarIndexSignatureParameters(node) {
            var parameter = node.parameters[0];
            if (node.parameters.length !== 1) {
                if (parameter) {
                    return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_must_have_exactly_one_parameter);
                }
                else {
                    return grammarErrorOnNode(node, ts.Diagnostics.An_index_signature_must_have_exactly_one_parameter);
                }
            }
            if (parameter.dotDotDotToken) {
                return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.An_index_signature_cannot_have_a_rest_parameter);
            }
            if (parameter.flags & 131571 /* Modifier */) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_cannot_have_an_accessibility_modifier);
            }
            if (parameter.questionToken) {
                return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.An_index_signature_parameter_cannot_have_a_question_mark);
            }
            if (parameter.initializer) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_cannot_have_an_initializer);
            }
            if (!parameter.type) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_must_have_a_type_annotation);
            }
            if (parameter.type.kind !== 126 /* StringKeyword */ && parameter.type.kind !== 124 /* NumberKeyword */) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_type_must_be_string_or_number);
            }
            if (!node.type) {
                return grammarErrorOnNode(node, ts.Diagnostics.An_index_signature_must_have_a_type_annotation);
            }
        }
        function checkGrammarForIndexSignatureModifier(node) {
            if (node.flags & 131571 /* Modifier */) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_not_permitted_on_index_signature_members);
            }
        }
        function checkGrammarIndexSignature(node) {
            // Prevent cascading error by short-circuit
            return checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarIndexSignatureParameters(node) || checkGrammarForIndexSignatureModifier(node);
        }
        function checkGrammarForAtLeastOneTypeArgument(node, typeArguments) {
            if (typeArguments && typeArguments.length === 0) {
                var sourceFile = ts.getSourceFileOfNode(node);
                var start = typeArguments.pos - "<".length;
                var end = ts.skipTrivia(sourceFile.text, typeArguments.end) + ">".length;
                return grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Type_argument_list_cannot_be_empty);
            }
        }
        function checkGrammarTypeArguments(node, typeArguments) {
            return checkGrammarForDisallowedTrailingComma(typeArguments) ||
                checkGrammarForAtLeastOneTypeArgument(node, typeArguments);
        }
        function checkGrammarForOmittedArgument(node, arguments) {
            if (arguments) {
                var sourceFile = ts.getSourceFileOfNode(node);
                for (var _i = 0; _i < arguments.length; _i++) {
                    var arg = arguments[_i];
                    if (arg.kind === 182 /* OmittedExpression */) {
                        return grammarErrorAtPos(sourceFile, arg.pos, 0, ts.Diagnostics.Argument_expression_expected);
                    }
                }
            }
        }
        function checkGrammarArguments(node, arguments) {
            return checkGrammarForDisallowedTrailingComma(arguments) ||
                checkGrammarForOmittedArgument(node, arguments);
        }
        function checkGrammarHeritageClause(node) {
            var types = node.types;
            if (checkGrammarForDisallowedTrailingComma(types)) {
                return true;
            }
            if (types && types.length === 0) {
                var listType = ts.tokenToString(node.token);
                var sourceFile = ts.getSourceFileOfNode(node);
                return grammarErrorAtPos(sourceFile, types.pos, 0, ts.Diagnostics._0_list_cannot_be_empty, listType);
            }
        }
        function checkGrammarClassDeclarationHeritageClauses(node) {
            var seenExtendsClause = false;
            var seenImplementsClause = false;
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && node.heritageClauses) {
                for (var _i = 0, _a = node.heritageClauses; _i < _a.length; _i++) {
                    var heritageClause = _a[_i];
                    if (heritageClause.token === 80 /* ExtendsKeyword */) {
                        if (seenExtendsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_already_seen);
                        }
                        if (seenImplementsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_must_precede_implements_clause);
                        }
                        if (heritageClause.types.length > 1) {
                            return grammarErrorOnFirstToken(heritageClause.types[1], ts.Diagnostics.Classes_can_only_extend_a_single_class);
                        }
                        seenExtendsClause = true;
                    }
                    else {
                        ts.Debug.assert(heritageClause.token === 103 /* ImplementsKeyword */);
                        if (seenImplementsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.implements_clause_already_seen);
                        }
                        seenImplementsClause = true;
                    }
                    // Grammar checking heritageClause inside class declaration
                    checkGrammarHeritageClause(heritageClause);
                }
            }
        }
        function checkGrammarInterfaceDeclaration(node) {
            var seenExtendsClause = false;
            if (node.heritageClauses) {
                for (var _i = 0, _a = node.heritageClauses; _i < _a.length; _i++) {
                    var heritageClause = _a[_i];
                    if (heritageClause.token === 80 /* ExtendsKeyword */) {
                        if (seenExtendsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_already_seen);
                        }
                        seenExtendsClause = true;
                    }
                    else {
                        ts.Debug.assert(heritageClause.token === 103 /* ImplementsKeyword */);
                        return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.Interface_declaration_cannot_have_implements_clause);
                    }
                    // Grammar checking heritageClause inside class declaration
                    checkGrammarHeritageClause(heritageClause);
                }
            }
            return false;
        }
        function checkGrammarComputedPropertyName(node) {
            // If node is not a computedPropertyName, just skip the grammar checking
            if (node.kind !== 132 /* ComputedPropertyName */) {
                return false;
            }
            var computedPropertyName = node;
            if (computedPropertyName.expression.kind === 176 /* BinaryExpression */ && computedPropertyName.expression.operatorToken.kind === 23 /* CommaToken */) {
                return grammarErrorOnNode(computedPropertyName.expression, ts.Diagnostics.A_comma_expression_is_not_allowed_in_a_computed_property_name);
            }
        }
        function checkGrammarForGenerator(node) {
            if (node.asteriskToken) {
                ts.Debug.assert(node.kind === 208 /* FunctionDeclaration */ ||
                    node.kind === 168 /* FunctionExpression */ ||
                    node.kind === 139 /* MethodDeclaration */);
                if (ts.isInAmbientContext(node)) {
                    return grammarErrorOnNode(node.asteriskToken, ts.Diagnostics.Generators_are_not_allowed_in_an_ambient_context);
                }
                if (!node.body) {
                    return grammarErrorOnNode(node.asteriskToken, ts.Diagnostics.An_overload_signature_cannot_be_declared_as_a_generator);
                }
                if (languageVersion < 2 /* ES6 */) {
                    return grammarErrorOnNode(node.asteriskToken, ts.Diagnostics.Generators_are_only_available_when_targeting_ECMAScript_6_or_higher);
                }
            }
        }
        function checkGrammarForInvalidQuestionMark(node, questionToken, message) {
            if (questionToken) {
                return grammarErrorOnNode(questionToken, message);
            }
        }
        function checkGrammarObjectLiteralExpression(node) {
            var seen = {};
            var Property = 1;
            var GetAccessor = 2;
            var SetAccesor = 4;
            var GetOrSetAccessor = GetAccessor | SetAccesor;
            for (var _i = 0, _a = node.properties; _i < _a.length; _i++) {
                var prop = _a[_i];
                var name_8 = prop.name;
                if (prop.kind === 182 /* OmittedExpression */ ||
                    name_8.kind === 132 /* ComputedPropertyName */) {
                    // If the name is not a ComputedPropertyName, the grammar checking will skip it
                    checkGrammarComputedPropertyName(name_8);
                    continue;
                }
                // ECMA-262 11.1.5 Object Initialiser
                // If previous is not undefined then throw a SyntaxError exception if any of the following conditions are true
                // a.This production is contained in strict code and IsDataDescriptor(previous) is true and
                // IsDataDescriptor(propId.descriptor) is true.
                //    b.IsDataDescriptor(previous) is true and IsAccessorDescriptor(propId.descriptor) is true.
                //    c.IsAccessorDescriptor(previous) is true and IsDataDescriptor(propId.descriptor) is true.
                //    d.IsAccessorDescriptor(previous) is true and IsAccessorDescriptor(propId.descriptor) is true
                // and either both previous and propId.descriptor have[[Get]] fields or both previous and propId.descriptor have[[Set]] fields
                var currentKind = void 0;
                if (prop.kind === 240 /* PropertyAssignment */ || prop.kind === 241 /* ShorthandPropertyAssignment */) {
                    // Grammar checking for computedPropertName and shorthandPropertyAssignment
                    checkGrammarForInvalidQuestionMark(prop, prop.questionToken, ts.Diagnostics.An_object_member_cannot_be_declared_optional);
                    if (name_8.kind === 7 /* NumericLiteral */) {
                        checkGrammarNumericLiteral(name_8);
                    }
                    currentKind = Property;
                }
                else if (prop.kind === 139 /* MethodDeclaration */) {
                    currentKind = Property;
                }
                else if (prop.kind === 141 /* GetAccessor */) {
                    currentKind = GetAccessor;
                }
                else if (prop.kind === 142 /* SetAccessor */) {
                    currentKind = SetAccesor;
                }
                else {
                    ts.Debug.fail("Unexpected syntax kind:" + prop.kind);
                }
                if (!ts.hasProperty(seen, name_8.text)) {
                    seen[name_8.text] = currentKind;
                }
                else {
                    var existingKind = seen[name_8.text];
                    if (currentKind === Property && existingKind === Property) {
                        continue;
                    }
                    else if ((currentKind & GetOrSetAccessor) && (existingKind & GetOrSetAccessor)) {
                        if (existingKind !== GetOrSetAccessor && currentKind !== existingKind) {
                            seen[name_8.text] = currentKind | existingKind;
                        }
                        else {
                            return grammarErrorOnNode(name_8, ts.Diagnostics.An_object_literal_cannot_have_multiple_get_Slashset_accessors_with_the_same_name);
                        }
                    }
                    else {
                        return grammarErrorOnNode(name_8, ts.Diagnostics.An_object_literal_cannot_have_property_and_accessor_with_the_same_name);
                    }
                }
            }
        }
        function checkGrammarJsxElement(node) {
            var seen = {};
            for (var _i = 0, _a = node.attributes; _i < _a.length; _i++) {
                var attr = _a[_i];
                if (attr.kind === 234 /* JsxSpreadAttribute */) {
                    continue;
                }
                var jsxAttr = attr;
                var name_9 = jsxAttr.name;
                if (!ts.hasProperty(seen, name_9.text)) {
                    seen[name_9.text] = true;
                }
                else {
                    return grammarErrorOnNode(name_9, ts.Diagnostics.JSX_elements_cannot_have_multiple_attributes_with_the_same_name);
                }
                var initializer = jsxAttr.initializer;
                if (initializer && initializer.kind === 235 /* JsxExpression */ && !initializer.expression) {
                    return grammarErrorOnNode(jsxAttr.initializer, ts.Diagnostics.JSX_attributes_must_only_be_assigned_a_non_empty_expression);
                }
            }
        }
        function checkGrammarForInOrForOfStatement(forInOrOfStatement) {
            if (checkGrammarStatementInAmbientContext(forInOrOfStatement)) {
                return true;
            }
            if (forInOrOfStatement.initializer.kind === 207 /* VariableDeclarationList */) {
                var variableList = forInOrOfStatement.initializer;
                if (!checkGrammarVariableDeclarationList(variableList)) {
                    if (variableList.declarations.length > 1) {
                        var diagnostic = forInOrOfStatement.kind === 195 /* ForInStatement */
                            ? ts.Diagnostics.Only_a_single_variable_declaration_is_allowed_in_a_for_in_statement
                            : ts.Diagnostics.Only_a_single_variable_declaration_is_allowed_in_a_for_of_statement;
                        return grammarErrorOnFirstToken(variableList.declarations[1], diagnostic);
                    }
                    var firstDeclaration = variableList.declarations[0];
                    if (firstDeclaration.initializer) {
                        var diagnostic = forInOrOfStatement.kind === 195 /* ForInStatement */
                            ? ts.Diagnostics.The_variable_declaration_of_a_for_in_statement_cannot_have_an_initializer
                            : ts.Diagnostics.The_variable_declaration_of_a_for_of_statement_cannot_have_an_initializer;
                        return grammarErrorOnNode(firstDeclaration.name, diagnostic);
                    }
                    if (firstDeclaration.type) {
                        var diagnostic = forInOrOfStatement.kind === 195 /* ForInStatement */
                            ? ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_use_a_type_annotation
                            : ts.Diagnostics.The_left_hand_side_of_a_for_of_statement_cannot_use_a_type_annotation;
                        return grammarErrorOnNode(firstDeclaration, diagnostic);
                    }
                }
            }
            return false;
        }
        function checkGrammarAccessor(accessor) {
            var kind = accessor.kind;
            if (languageVersion < 1 /* ES5 */) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.Accessors_are_only_available_when_targeting_ECMAScript_5_and_higher);
            }
            else if (ts.isInAmbientContext(accessor)) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.An_accessor_cannot_be_declared_in_an_ambient_context);
            }
            else if (accessor.body === undefined) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(accessor), accessor.end - 1, ";".length, ts.Diagnostics._0_expected, "{");
            }
            else if (accessor.typeParameters) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.An_accessor_cannot_have_type_parameters);
            }
            else if (kind === 141 /* GetAccessor */ && accessor.parameters.length) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_get_accessor_cannot_have_parameters);
            }
            else if (kind === 142 /* SetAccessor */) {
                if (accessor.type) {
                    return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_cannot_have_a_return_type_annotation);
                }
                else if (accessor.parameters.length !== 1) {
                    return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_must_have_exactly_one_parameter);
                }
                else {
                    var parameter = accessor.parameters[0];
                    if (parameter.dotDotDotToken) {
                        return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.A_set_accessor_cannot_have_rest_parameter);
                    }
                    else if (parameter.flags & 131571 /* Modifier */) {
                        return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_parameter_property_is_only_allowed_in_a_constructor_implementation);
                    }
                    else if (parameter.questionToken) {
                        return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.A_set_accessor_cannot_have_an_optional_parameter);
                    }
                    else if (parameter.initializer) {
                        return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_parameter_cannot_have_an_initializer);
                    }
                }
            }
        }
        function checkGrammarForNonSymbolComputedProperty(node, message) {
            if (node.kind === 132 /* ComputedPropertyName */ && !ts.isWellKnownSymbolSyntactically(node.expression)) {
                return grammarErrorOnNode(node, message);
            }
        }
        function checkGrammarMethod(node) {
            if (checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) ||
                checkGrammarFunctionLikeDeclaration(node) ||
                checkGrammarForGenerator(node)) {
                return true;
            }
            if (node.parent.kind === 160 /* ObjectLiteralExpression */) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional)) {
                    return true;
                }
                else if (node.body === undefined) {
                    return grammarErrorAtPos(getSourceFile(node), node.end - 1, ";".length, ts.Diagnostics._0_expected, "{");
                }
            }
            if (ts.isClassLike(node.parent)) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional)) {
                    return true;
                }
                // Technically, computed properties in ambient contexts is disallowed
                // for property declarations and accessors too, not just methods.
                // However, property declarations disallow computed names in general,
                // and accessors are not allowed in ambient contexts in general,
                // so this error only really matters for methods.
                if (ts.isInAmbientContext(node)) {
                    return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_ambient_context_must_directly_refer_to_a_built_in_symbol);
                }
                else if (!node.body) {
                    return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_method_overload_must_directly_refer_to_a_built_in_symbol);
                }
            }
            else if (node.parent.kind === 210 /* InterfaceDeclaration */) {
                return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_interface_must_directly_refer_to_a_built_in_symbol);
            }
            else if (node.parent.kind === 151 /* TypeLiteral */) {
                return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_type_literal_must_directly_refer_to_a_built_in_symbol);
            }
        }
        function isIterationStatement(node, lookInLabeledStatements) {
            switch (node.kind) {
                case 194 /* ForStatement */:
                case 195 /* ForInStatement */:
                case 196 /* ForOfStatement */:
                case 192 /* DoStatement */:
                case 193 /* WhileStatement */:
                    return true;
                case 202 /* LabeledStatement */:
                    return lookInLabeledStatements && isIterationStatement(node.statement, lookInLabeledStatements);
            }
            return false;
        }
        function checkGrammarBreakOrContinueStatement(node) {
            var current = node;
            while (current) {
                if (ts.isFunctionLike(current)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.Jump_target_cannot_cross_function_boundary);
                }
                switch (current.kind) {
                    case 202 /* LabeledStatement */:
                        if (node.label && current.label.text === node.label.text) {
                            // found matching label - verify that label usage is correct
                            // continue can only target labels that are on iteration statements
                            var isMisplacedContinueLabel = node.kind === 197 /* ContinueStatement */
                                && !isIterationStatement(current.statement, true);
                            if (isMisplacedContinueLabel) {
                                return grammarErrorOnNode(node, ts.Diagnostics.A_continue_statement_can_only_jump_to_a_label_of_an_enclosing_iteration_statement);
                            }
                            return false;
                        }
                        break;
                    case 201 /* SwitchStatement */:
                        if (node.kind === 198 /* BreakStatement */ && !node.label) {
                            // unlabeled break within switch statement - ok
                            return false;
                        }
                        break;
                    default:
                        if (isIterationStatement(current, false) && !node.label) {
                            // unlabeled break or continue within iteration statement - ok
                            return false;
                        }
                        break;
                }
                current = current.parent;
            }
            if (node.label) {
                var message = node.kind === 198 /* BreakStatement */
                    ? ts.Diagnostics.A_break_statement_can_only_jump_to_a_label_of_an_enclosing_statement
                    : ts.Diagnostics.A_continue_statement_can_only_jump_to_a_label_of_an_enclosing_iteration_statement;
                return grammarErrorOnNode(node, message);
            }
            else {
                var message = node.kind === 198 /* BreakStatement */
                    ? ts.Diagnostics.A_break_statement_can_only_be_used_within_an_enclosing_iteration_or_switch_statement
                    : ts.Diagnostics.A_continue_statement_can_only_be_used_within_an_enclosing_iteration_statement;
                return grammarErrorOnNode(node, message);
            }
        }
        function checkGrammarBindingElement(node) {
            if (node.dotDotDotToken) {
                var elements = node.parent.elements;
                if (node !== ts.lastOrUndefined(elements)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.A_rest_element_must_be_last_in_an_array_destructuring_pattern);
                }
                if (node.name.kind === 157 /* ArrayBindingPattern */ || node.name.kind === 156 /* ObjectBindingPattern */) {
                    return grammarErrorOnNode(node.name, ts.Diagnostics.A_rest_element_cannot_contain_a_binding_pattern);
                }
                if (node.initializer) {
                    // Error on equals token which immediate precedes the initializer
                    return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.initializer.pos - 1, 1, ts.Diagnostics.A_rest_element_cannot_have_an_initializer);
                }
            }
        }
        function checkGrammarVariableDeclaration(node) {
            if (node.parent.parent.kind !== 195 /* ForInStatement */ && node.parent.parent.kind !== 196 /* ForOfStatement */) {
                if (ts.isInAmbientContext(node)) {
                    if (node.initializer) {
                        // Error on equals token which immediate precedes the initializer
                        var equalsTokenLength = "=".length;
                        return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.initializer.pos - equalsTokenLength, equalsTokenLength, ts.Diagnostics.Initializers_are_not_allowed_in_ambient_contexts);
                    }
                }
                else if (!node.initializer) {
                    if (ts.isBindingPattern(node.name) && !ts.isBindingPattern(node.parent)) {
                        return grammarErrorOnNode(node, ts.Diagnostics.A_destructuring_declaration_must_have_an_initializer);
                    }
                    if (ts.isConst(node)) {
                        return grammarErrorOnNode(node, ts.Diagnostics.const_declarations_must_be_initialized);
                    }
                }
            }
            var checkLetConstNames = languageVersion >= 2 /* ES6 */ && (ts.isLet(node) || ts.isConst(node));
            // 1. LexicalDeclaration : LetOrConst BindingList ;
            // It is a Syntax Error if the BoundNames of BindingList contains "let".
            // 2. ForDeclaration: ForDeclaration : LetOrConst ForBinding
            // It is a Syntax Error if the BoundNames of ForDeclaration contains "let".
            // It is a SyntaxError if a VariableDeclaration or VariableDeclarationNoIn occurs within strict code
            // and its Identifier is eval or arguments
            return checkLetConstNames && checkGrammarNameInLetOrConstDeclarations(node.name);
        }
        function checkGrammarNameInLetOrConstDeclarations(name) {
            if (name.kind === 66 /* Identifier */) {
                if (name.text === "let") {
                    return grammarErrorOnNode(name, ts.Diagnostics.let_is_not_allowed_to_be_used_as_a_name_in_let_or_const_declarations);
                }
            }
            else {
                var elements = name.elements;
                for (var _i = 0; _i < elements.length; _i++) {
                    var element = elements[_i];
                    if (element.kind !== 182 /* OmittedExpression */) {
                        checkGrammarNameInLetOrConstDeclarations(element.name);
                    }
                }
            }
        }
        function checkGrammarVariableDeclarationList(declarationList) {
            var declarations = declarationList.declarations;
            if (checkGrammarForDisallowedTrailingComma(declarationList.declarations)) {
                return true;
            }
            if (!declarationList.declarations.length) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(declarationList), declarations.pos, declarations.end - declarations.pos, ts.Diagnostics.Variable_declaration_list_cannot_be_empty);
            }
        }
        function allowLetAndConstDeclarations(parent) {
            switch (parent.kind) {
                case 191 /* IfStatement */:
                case 192 /* DoStatement */:
                case 193 /* WhileStatement */:
                case 200 /* WithStatement */:
                case 194 /* ForStatement */:
                case 195 /* ForInStatement */:
                case 196 /* ForOfStatement */:
                    return false;
                case 202 /* LabeledStatement */:
                    return allowLetAndConstDeclarations(parent.parent);
            }
            return true;
        }
        function checkGrammarForDisallowedLetOrConstStatement(node) {
            if (!allowLetAndConstDeclarations(node.parent)) {
                if (ts.isLet(node.declarationList)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.let_declarations_can_only_be_declared_inside_a_block);
                }
                else if (ts.isConst(node.declarationList)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.const_declarations_can_only_be_declared_inside_a_block);
                }
            }
        }
        function isIntegerLiteral(expression) {
            if (expression.kind === 174 /* PrefixUnaryExpression */) {
                var unaryExpression = expression;
                if (unaryExpression.operator === 34 /* PlusToken */ || unaryExpression.operator === 35 /* MinusToken */) {
                    expression = unaryExpression.operand;
                }
            }
            if (expression.kind === 7 /* NumericLiteral */) {
                // Allows for scientific notation since literalExpression.text was formed by
                // coercing a number to a string. Sometimes this coercion can yield a string
                // in scientific notation.
                // We also don't need special logic for hex because a hex integer is converted
                // to decimal when it is coerced.
                return /^[0-9]+([eE]\+?[0-9]+)?$/.test(expression.text);
            }
            return false;
        }
        function checkGrammarEnumDeclaration(enumDecl) {
            var enumIsConst = (enumDecl.flags & 8192 /* Const */) !== 0;
            var hasError = false;
            // skip checks below for const enums  - they allow arbitrary initializers as long as they can be evaluated to constant expressions.
            // since all values are known in compile time - it is not necessary to check that constant enum section precedes computed enum members.
            if (!enumIsConst) {
                var inConstantEnumMemberSection = true;
                var inAmbientContext = ts.isInAmbientContext(enumDecl);
                for (var _i = 0, _a = enumDecl.members; _i < _a.length; _i++) {
                    var node = _a[_i];
                    // Do not use hasDynamicName here, because that returns false for well known symbols.
                    // We want to perform checkComputedPropertyName for all computed properties, including
                    // well known symbols.
                    if (node.name.kind === 132 /* ComputedPropertyName */) {
                        hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Computed_property_names_are_not_allowed_in_enums);
                    }
                    else if (inAmbientContext) {
                        if (node.initializer && !isIntegerLiteral(node.initializer)) {
                            hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Ambient_enum_elements_can_only_have_integer_literal_initializers) || hasError;
                        }
                    }
                    else if (node.initializer) {
                        inConstantEnumMemberSection = isIntegerLiteral(node.initializer);
                    }
                    else if (!inConstantEnumMemberSection) {
                        hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Enum_member_must_have_initializer) || hasError;
                    }
                }
            }
            return hasError;
        }
        function hasParseDiagnostics(sourceFile) {
            return sourceFile.parseDiagnostics.length > 0;
        }
        function grammarErrorOnFirstToken(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                var span = ts.getSpanOfTokenAtPosition(sourceFile, node.pos);
                diagnostics.add(ts.createFileDiagnostic(sourceFile, span.start, span.length, message, arg0, arg1, arg2));
                return true;
            }
        }
        function grammarErrorAtPos(sourceFile, start, length, message, arg0, arg1, arg2) {
            if (!hasParseDiagnostics(sourceFile)) {
                diagnostics.add(ts.createFileDiagnostic(sourceFile, start, length, message, arg0, arg1, arg2));
                return true;
            }
        }
        function grammarErrorOnNode(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                diagnostics.add(ts.createDiagnosticForNode(node, message, arg0, arg1, arg2));
                return true;
            }
        }
        function isEvalOrArgumentsIdentifier(node) {
            return node.kind === 66 /* Identifier */ &&
                (node.text === "eval" || node.text === "arguments");
        }
        function checkGrammarConstructorTypeParameters(node) {
            if (node.typeParameters) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.typeParameters.pos, node.typeParameters.end - node.typeParameters.pos, ts.Diagnostics.Type_parameters_cannot_appear_on_a_constructor_declaration);
            }
        }
        function checkGrammarConstructorTypeAnnotation(node) {
            if (node.type) {
                return grammarErrorOnNode(node.type, ts.Diagnostics.Type_annotation_cannot_appear_on_a_constructor_declaration);
            }
        }
        function checkGrammarProperty(node) {
            if (ts.isClassLike(node.parent)) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional) ||
                    checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_class_property_declaration_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            else if (node.parent.kind === 210 /* InterfaceDeclaration */) {
                if (checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_interface_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            else if (node.parent.kind === 151 /* TypeLiteral */) {
                if (checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_type_literal_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            if (ts.isInAmbientContext(node) && node.initializer) {
                return grammarErrorOnFirstToken(node.initializer, ts.Diagnostics.Initializers_are_not_allowed_in_ambient_contexts);
            }
        }
        function checkGrammarTopLevelElementForRequiredDeclareModifier(node) {
            // A declare modifier is required for any top level .d.ts declaration except export=, export default,
            // interfaces and imports categories:
            //
            //  DeclarationElement:
            //     ExportAssignment
            //     export_opt   InterfaceDeclaration
            //     export_opt   ImportDeclaration
            //     export_opt   ExternalImportDeclaration
            //     export_opt   AmbientDeclaration
            //
            if (node.kind === 210 /* InterfaceDeclaration */ ||
                node.kind === 217 /* ImportDeclaration */ ||
                node.kind === 216 /* ImportEqualsDeclaration */ ||
                node.kind === 223 /* ExportDeclaration */ ||
                node.kind === 222 /* ExportAssignment */ ||
                (node.flags & 2 /* Ambient */) ||
                (node.flags & (1 /* Export */ | 256 /* Default */))) {
                return false;
            }
            return grammarErrorOnFirstToken(node, ts.Diagnostics.A_declare_modifier_is_required_for_a_top_level_declaration_in_a_d_ts_file);
        }
        function checkGrammarTopLevelElementsForRequiredDeclareModifier(file) {
            for (var _i = 0, _a = file.statements; _i < _a.length; _i++) {
                var decl = _a[_i];
                if (ts.isDeclaration(decl) || decl.kind === 188 /* VariableStatement */) {
                    if (checkGrammarTopLevelElementForRequiredDeclareModifier(decl)) {
                        return true;
                    }
                }
            }
        }
        function checkGrammarSourceFile(node) {
            return ts.isInAmbientContext(node) && checkGrammarTopLevelElementsForRequiredDeclareModifier(node);
        }
        function checkGrammarStatementInAmbientContext(node) {
            if (ts.isInAmbientContext(node)) {
                // An accessors is already reported about the ambient context
                if (isAccessor(node.parent.kind)) {
                    return getNodeLinks(node).hasReportedStatementInAmbientContext = true;
                }
                // Find containing block which is either Block, ModuleBlock, SourceFile
                var links = getNodeLinks(node);
                if (!links.hasReportedStatementInAmbientContext && ts.isFunctionLike(node.parent)) {
                    return getNodeLinks(node).hasReportedStatementInAmbientContext = grammarErrorOnFirstToken(node, ts.Diagnostics.An_implementation_cannot_be_declared_in_ambient_contexts);
                }
                // We are either parented by another statement, or some sort of block.
                // If we're in a block, we only want to really report an error once
                // to prevent noisyness.  So use a bit on the block to indicate if
                // this has already been reported, and don't report if it has.
                //
                if (node.parent.kind === 187 /* Block */ || node.parent.kind === 214 /* ModuleBlock */ || node.parent.kind === 243 /* SourceFile */) {
                    var links_1 = getNodeLinks(node.parent);
                    // Check if the containing block ever report this error
                    if (!links_1.hasReportedStatementInAmbientContext) {
                        return links_1.hasReportedStatementInAmbientContext = grammarErrorOnFirstToken(node, ts.Diagnostics.Statements_are_not_allowed_in_ambient_contexts);
                    }
                }
                else {
                }
            }
        }
        function checkGrammarNumericLiteral(node) {
            // Grammar checking
            if (node.flags & 16384 /* OctalLiteral */ && languageVersion >= 1 /* ES5 */) {
                return grammarErrorOnNode(node, ts.Diagnostics.Octal_literals_are_not_available_when_targeting_ECMAScript_5_and_higher);
            }
        }
        function grammarErrorAfterFirstToken(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                var span = ts.getSpanOfTokenAtPosition(sourceFile, node.pos);
                diagnostics.add(ts.createFileDiagnostic(sourceFile, ts.textSpanEnd(span), 0, message, arg0, arg1, arg2));
                return true;
            }
        }
    }
    ts.createTypeChecker = createTypeChecker;
})(ts || (ts = {}));
