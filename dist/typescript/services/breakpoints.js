// Copyright (c) Microsoft. All rights reserved. Licensed under the Apache License, Version 2.0. 
// See LICENSE.txt in the project root for complete license information.
/// <reference path='services.ts' />
/* @internal */
var ts;
(function (ts) {
    var BreakpointResolver;
    (function (BreakpointResolver) {
        /**
         * Get the breakpoint span in given sourceFile
         */
        function spanInSourceFileAtLocation(sourceFile, position) {
            // Cannot set breakpoint in dts file
            if (sourceFile.flags & 2048 /* DeclarationFile */) {
                return undefined;
            }
            var tokenAtLocation = ts.getTokenAtPosition(sourceFile, position);
            var lineOfPosition = sourceFile.getLineAndCharacterOfPosition(position).line;
            if (sourceFile.getLineAndCharacterOfPosition(tokenAtLocation.getStart()).line > lineOfPosition) {
                // Get previous token if the token is returned starts on new line
                // eg: let x =10; |--- cursor is here
                //     let y = 10; 
                // token at position will return let keyword on second line as the token but we would like to use 
                // token on same line if trailing trivia (comments or white spaces on same line) part of the last token on that line
                tokenAtLocation = ts.findPrecedingToken(tokenAtLocation.pos, sourceFile);
                // Its a blank line
                if (!tokenAtLocation || sourceFile.getLineAndCharacterOfPosition(tokenAtLocation.getEnd()).line !== lineOfPosition) {
                    return undefined;
                }
            }
            // Cannot set breakpoint in ambient declarations
            if (ts.isInAmbientContext(tokenAtLocation)) {
                return undefined;
            }
            // Get the span in the node based on its syntax
            return spanInNode(tokenAtLocation);
            function textSpan(startNode, endNode) {
                return ts.createTextSpanFromBounds(startNode.getStart(), (endNode || startNode).getEnd());
            }
            function spanInNodeIfStartsOnSameLine(node, otherwiseOnNode) {
                if (node && lineOfPosition === sourceFile.getLineAndCharacterOfPosition(node.getStart()).line) {
                    return spanInNode(node);
                }
                return spanInNode(otherwiseOnNode);
            }
            function spanInPreviousNode(node) {
                return spanInNode(ts.findPrecedingToken(node.pos, sourceFile));
            }
            function spanInNextNode(node) {
                return spanInNode(ts.findNextToken(node, node.parent));
            }
            function spanInNode(node) {
                if (node) {
                    if (ts.isExpression(node)) {
                        if (node.parent.kind === 192 /* DoStatement */) {
                            // Set span as if on while keyword
                            return spanInPreviousNode(node);
                        }
                        if (node.parent.kind === 194 /* ForStatement */) {
                            // For now lets set the span on this expression, fix it later
                            return textSpan(node);
                        }
                        if (node.parent.kind === 176 /* BinaryExpression */ && node.parent.operatorToken.kind === 23 /* CommaToken */) {
                            // if this is comma expression, the breakpoint is possible in this expression
                            return textSpan(node);
                        }
                        if (node.parent.kind === 169 /* ArrowFunction */ && node.parent.body === node) {
                            // If this is body of arrow function, it is allowed to have the breakpoint
                            return textSpan(node);
                        }
                    }
                    switch (node.kind) {
                        case 188 /* VariableStatement */:
                            // Span on first variable declaration
                            return spanInVariableDeclaration(node.declarationList.declarations[0]);
                        case 206 /* VariableDeclaration */:
                        case 137 /* PropertyDeclaration */:
                        case 136 /* PropertySignature */:
                            return spanInVariableDeclaration(node);
                        case 134 /* Parameter */:
                            return spanInParameterDeclaration(node);
                        case 208 /* FunctionDeclaration */:
                        case 139 /* MethodDeclaration */:
                        case 138 /* MethodSignature */:
                        case 141 /* GetAccessor */:
                        case 142 /* SetAccessor */:
                        case 140 /* Constructor */:
                        case 168 /* FunctionExpression */:
                        case 169 /* ArrowFunction */:
                            return spanInFunctionDeclaration(node);
                        case 187 /* Block */:
                            if (ts.isFunctionBlock(node)) {
                                return spanInFunctionBlock(node);
                            }
                        // Fall through
                        case 214 /* ModuleBlock */:
                            return spanInBlock(node);
                        case 239 /* CatchClause */:
                            return spanInBlock(node.block);
                        case 190 /* ExpressionStatement */:
                            // span on the expression
                            return textSpan(node.expression);
                        case 199 /* ReturnStatement */:
                            // span on return keyword and expression if present
                            return textSpan(node.getChildAt(0), node.expression);
                        case 193 /* WhileStatement */:
                            // Span on while(...)
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 192 /* DoStatement */:
                            // span in statement of the do statement
                            return spanInNode(node.statement);
                        case 205 /* DebuggerStatement */:
                            // span on debugger keyword
                            return textSpan(node.getChildAt(0));
                        case 191 /* IfStatement */:
                            // set on if(..) span
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 202 /* LabeledStatement */:
                            // span in statement
                            return spanInNode(node.statement);
                        case 198 /* BreakStatement */:
                        case 197 /* ContinueStatement */:
                            // On break or continue keyword and label if present
                            return textSpan(node.getChildAt(0), node.label);
                        case 194 /* ForStatement */:
                            return spanInForStatement(node);
                        case 195 /* ForInStatement */:
                        case 196 /* ForOfStatement */:
                            // span on for (a in ...)
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 201 /* SwitchStatement */:
                            // span on switch(...)
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 236 /* CaseClause */:
                        case 237 /* DefaultClause */:
                            // span in first statement of the clause
                            return spanInNode(node.statements[0]);
                        case 204 /* TryStatement */:
                            // span in try block
                            return spanInBlock(node.tryBlock);
                        case 203 /* ThrowStatement */:
                            // span in throw ...
                            return textSpan(node, node.expression);
                        case 222 /* ExportAssignment */:
                            // span on export = id
                            return textSpan(node, node.expression);
                        case 216 /* ImportEqualsDeclaration */:
                            // import statement without including semicolon
                            return textSpan(node, node.moduleReference);
                        case 217 /* ImportDeclaration */:
                            // import statement without including semicolon
                            return textSpan(node, node.moduleSpecifier);
                        case 223 /* ExportDeclaration */:
                            // import statement without including semicolon
                            return textSpan(node, node.moduleSpecifier);
                        case 213 /* ModuleDeclaration */:
                            // span on complete module if it is instantiated
                            if (ts.getModuleInstanceState(node) !== 1 /* Instantiated */) {
                                return undefined;
                            }
                        case 209 /* ClassDeclaration */:
                        case 212 /* EnumDeclaration */:
                        case 242 /* EnumMember */:
                        case 163 /* CallExpression */:
                        case 164 /* NewExpression */:
                            // span on complete node
                            return textSpan(node);
                        case 200 /* WithStatement */:
                            // span in statement
                            return spanInNode(node.statement);
                        // No breakpoint in interface, type alias
                        case 210 /* InterfaceDeclaration */:
                        case 211 /* TypeAliasDeclaration */:
                            return undefined;
                        // Tokens:
                        case 22 /* SemicolonToken */:
                        case 1 /* EndOfFileToken */:
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile));
                        case 23 /* CommaToken */:
                            return spanInPreviousNode(node);
                        case 14 /* OpenBraceToken */:
                            return spanInOpenBraceToken(node);
                        case 15 /* CloseBraceToken */:
                            return spanInCloseBraceToken(node);
                        case 16 /* OpenParenToken */:
                            return spanInOpenParenToken(node);
                        case 17 /* CloseParenToken */:
                            return spanInCloseParenToken(node);
                        case 52 /* ColonToken */:
                            return spanInColonToken(node);
                        case 26 /* GreaterThanToken */:
                        case 24 /* LessThanToken */:
                            return spanInGreaterThanOrLessThanToken(node);
                        // Keywords:
                        case 101 /* WhileKeyword */:
                            return spanInWhileKeyword(node);
                        case 77 /* ElseKeyword */:
                        case 69 /* CatchKeyword */:
                        case 82 /* FinallyKeyword */:
                            return spanInNextNode(node);
                        default:
                            // If this is name of property assignment, set breakpoint in the initializer
                            if (node.parent.kind === 240 /* PropertyAssignment */ && node.parent.name === node) {
                                return spanInNode(node.parent.initializer);
                            }
                            // Breakpoint in type assertion goes to its operand
                            if (node.parent.kind === 166 /* TypeAssertionExpression */ && node.parent.type === node) {
                                return spanInNode(node.parent.expression);
                            }
                            // return type of function go to previous token
                            if (ts.isFunctionLike(node.parent) && node.parent.type === node) {
                                return spanInPreviousNode(node);
                            }
                            // Default go to parent to set the breakpoint
                            return spanInNode(node.parent);
                    }
                }
                function spanInVariableDeclaration(variableDeclaration) {
                    // If declaration of for in statement, just set the span in parent
                    if (variableDeclaration.parent.parent.kind === 195 /* ForInStatement */ ||
                        variableDeclaration.parent.parent.kind === 196 /* ForOfStatement */) {
                        return spanInNode(variableDeclaration.parent.parent);
                    }
                    var isParentVariableStatement = variableDeclaration.parent.parent.kind === 188 /* VariableStatement */;
                    var isDeclarationOfForStatement = variableDeclaration.parent.parent.kind === 194 /* ForStatement */ && ts.contains(variableDeclaration.parent.parent.initializer.declarations, variableDeclaration);
                    var declarations = isParentVariableStatement
                        ? variableDeclaration.parent.parent.declarationList.declarations
                        : isDeclarationOfForStatement
                            ? variableDeclaration.parent.parent.initializer.declarations
                            : undefined;
                    // Breakpoint is possible in variableDeclaration only if there is initialization
                    if (variableDeclaration.initializer || (variableDeclaration.flags & 1 /* Export */)) {
                        if (declarations && declarations[0] === variableDeclaration) {
                            if (isParentVariableStatement) {
                                // First declaration - include let keyword
                                return textSpan(variableDeclaration.parent, variableDeclaration);
                            }
                            else {
                                ts.Debug.assert(isDeclarationOfForStatement);
                                // Include let keyword from for statement declarations in the span
                                return textSpan(ts.findPrecedingToken(variableDeclaration.pos, sourceFile, variableDeclaration.parent), variableDeclaration);
                            }
                        }
                        else {
                            // Span only on this declaration
                            return textSpan(variableDeclaration);
                        }
                    }
                    else if (declarations && declarations[0] !== variableDeclaration) {
                        // If we cant set breakpoint on this declaration, set it on previous one
                        var indexOfCurrentDeclaration = ts.indexOf(declarations, variableDeclaration);
                        return spanInVariableDeclaration(declarations[indexOfCurrentDeclaration - 1]);
                    }
                }
                function canHaveSpanInParameterDeclaration(parameter) {
                    // Breakpoint is possible on parameter only if it has initializer, is a rest parameter, or has public or private modifier
                    return !!parameter.initializer || parameter.dotDotDotToken !== undefined ||
                        !!(parameter.flags & 16 /* Public */) || !!(parameter.flags & 32 /* Private */);
                }
                function spanInParameterDeclaration(parameter) {
                    if (canHaveSpanInParameterDeclaration(parameter)) {
                        return textSpan(parameter);
                    }
                    else {
                        var functionDeclaration = parameter.parent;
                        var indexOfParameter = ts.indexOf(functionDeclaration.parameters, parameter);
                        if (indexOfParameter) {
                            // Not a first parameter, go to previous parameter
                            return spanInParameterDeclaration(functionDeclaration.parameters[indexOfParameter - 1]);
                        }
                        else {
                            // Set breakpoint in the function declaration body
                            return spanInNode(functionDeclaration.body);
                        }
                    }
                }
                function canFunctionHaveSpanInWholeDeclaration(functionDeclaration) {
                    return !!(functionDeclaration.flags & 1 /* Export */) ||
                        (functionDeclaration.parent.kind === 209 /* ClassDeclaration */ && functionDeclaration.kind !== 140 /* Constructor */);
                }
                function spanInFunctionDeclaration(functionDeclaration) {
                    // No breakpoints in the function signature
                    if (!functionDeclaration.body) {
                        return undefined;
                    }
                    if (canFunctionHaveSpanInWholeDeclaration(functionDeclaration)) {
                        // Set the span on whole function declaration
                        return textSpan(functionDeclaration);
                    }
                    // Set span in function body
                    return spanInNode(functionDeclaration.body);
                }
                function spanInFunctionBlock(block) {
                    var nodeForSpanInBlock = block.statements.length ? block.statements[0] : block.getLastToken();
                    if (canFunctionHaveSpanInWholeDeclaration(block.parent)) {
                        return spanInNodeIfStartsOnSameLine(block.parent, nodeForSpanInBlock);
                    }
                    return spanInNode(nodeForSpanInBlock);
                }
                function spanInBlock(block) {
                    switch (block.parent.kind) {
                        case 213 /* ModuleDeclaration */:
                            if (ts.getModuleInstanceState(block.parent) !== 1 /* Instantiated */) {
                                return undefined;
                            }
                        // Set on parent if on same line otherwise on first statement
                        case 193 /* WhileStatement */:
                        case 191 /* IfStatement */:
                        case 195 /* ForInStatement */:
                        case 196 /* ForOfStatement */:
                            return spanInNodeIfStartsOnSameLine(block.parent, block.statements[0]);
                        // Set span on previous token if it starts on same line otherwise on the first statement of the block
                        case 194 /* ForStatement */:
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(block.pos, sourceFile, block.parent), block.statements[0]);
                    }
                    // Default action is to set on first statement
                    return spanInNode(block.statements[0]);
                }
                function spanInForStatement(forStatement) {
                    if (forStatement.initializer) {
                        if (forStatement.initializer.kind === 207 /* VariableDeclarationList */) {
                            var variableDeclarationList = forStatement.initializer;
                            if (variableDeclarationList.declarations.length > 0) {
                                return spanInNode(variableDeclarationList.declarations[0]);
                            }
                        }
                        else {
                            return spanInNode(forStatement.initializer);
                        }
                    }
                    if (forStatement.condition) {
                        return textSpan(forStatement.condition);
                    }
                    if (forStatement.incrementor) {
                        return textSpan(forStatement.incrementor);
                    }
                }
                // Tokens:
                function spanInOpenBraceToken(node) {
                    switch (node.parent.kind) {
                        case 212 /* EnumDeclaration */:
                            var enumDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), enumDeclaration.members.length ? enumDeclaration.members[0] : enumDeclaration.getLastToken(sourceFile));
                        case 209 /* ClassDeclaration */:
                            var classDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), classDeclaration.members.length ? classDeclaration.members[0] : classDeclaration.getLastToken(sourceFile));
                        case 215 /* CaseBlock */:
                            return spanInNodeIfStartsOnSameLine(node.parent.parent, node.parent.clauses[0]);
                    }
                    // Default to parent node
                    return spanInNode(node.parent);
                }
                function spanInCloseBraceToken(node) {
                    switch (node.parent.kind) {
                        case 214 /* ModuleBlock */:
                            // If this is not instantiated module block no bp span
                            if (ts.getModuleInstanceState(node.parent.parent) !== 1 /* Instantiated */) {
                                return undefined;
                            }
                        case 212 /* EnumDeclaration */:
                        case 209 /* ClassDeclaration */:
                            // Span on close brace token
                            return textSpan(node);
                        case 187 /* Block */:
                            if (ts.isFunctionBlock(node.parent)) {
                                // Span on close brace token
                                return textSpan(node);
                            }
                        // fall through.
                        case 239 /* CatchClause */:
                            return spanInNode(ts.lastOrUndefined(node.parent.statements));
                            ;
                        case 215 /* CaseBlock */:
                            // breakpoint in last statement of the last clause
                            var caseBlock = node.parent;
                            var lastClause = ts.lastOrUndefined(caseBlock.clauses);
                            if (lastClause) {
                                return spanInNode(ts.lastOrUndefined(lastClause.statements));
                            }
                            return undefined;
                        // Default to parent node
                        default:
                            return spanInNode(node.parent);
                    }
                }
                function spanInOpenParenToken(node) {
                    if (node.parent.kind === 192 /* DoStatement */) {
                        // Go to while keyword and do action instead
                        return spanInPreviousNode(node);
                    }
                    // Default to parent node
                    return spanInNode(node.parent);
                }
                function spanInCloseParenToken(node) {
                    // Is this close paren token of parameter list, set span in previous token
                    switch (node.parent.kind) {
                        case 168 /* FunctionExpression */:
                        case 208 /* FunctionDeclaration */:
                        case 169 /* ArrowFunction */:
                        case 139 /* MethodDeclaration */:
                        case 138 /* MethodSignature */:
                        case 141 /* GetAccessor */:
                        case 142 /* SetAccessor */:
                        case 140 /* Constructor */:
                        case 193 /* WhileStatement */:
                        case 192 /* DoStatement */:
                        case 194 /* ForStatement */:
                            return spanInPreviousNode(node);
                        // Default to parent node
                        default:
                            return spanInNode(node.parent);
                    }
                    // Default to parent node
                    return spanInNode(node.parent);
                }
                function spanInColonToken(node) {
                    // Is this : specifying return annotation of the function declaration
                    if (ts.isFunctionLike(node.parent) || node.parent.kind === 240 /* PropertyAssignment */) {
                        return spanInPreviousNode(node);
                    }
                    return spanInNode(node.parent);
                }
                function spanInGreaterThanOrLessThanToken(node) {
                    if (node.parent.kind === 166 /* TypeAssertionExpression */) {
                        return spanInNode(node.parent.expression);
                    }
                    return spanInNode(node.parent);
                }
                function spanInWhileKeyword(node) {
                    if (node.parent.kind === 192 /* DoStatement */) {
                        // Set span on while expression
                        return textSpan(node, ts.findNextToken(node.parent.expression, node.parent));
                    }
                    // Default to parent node
                    return spanInNode(node.parent);
                }
            }
        }
        BreakpointResolver.spanInSourceFileAtLocation = spanInSourceFileAtLocation;
    })(BreakpointResolver = ts.BreakpointResolver || (ts.BreakpointResolver = {}));
})(ts || (ts = {}));
