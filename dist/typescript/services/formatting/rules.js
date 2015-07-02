///<reference path='references.ts' />
/* @internal */
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Rules = (function () {
            function Rules() {
                ///
                /// Common Rules
                ///
                // Leave comments alone
                this.IgnoreBeforeComment = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.Comments), formatting.RuleOperation.create1(1 /* Ignore */));
                this.IgnoreAfterLineComment = new formatting.Rule(formatting.RuleDescriptor.create3(2 /* SingleLineCommentTrivia */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create1(1 /* Ignore */));
                // Space after keyword but not before ; or : or ?
                this.NoSpaceBeforeSemicolon = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 22 /* SemicolonToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeColon = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 52 /* ColonToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8 /* Delete */));
                this.NoSpaceBeforeQuestionMark = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 51 /* QuestionToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8 /* Delete */));
                this.SpaceAfterColon = new formatting.Rule(formatting.RuleDescriptor.create3(52 /* ColonToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 2 /* Space */));
                this.SpaceAfterQuestionMarkInConditionalOperator = new formatting.Rule(formatting.RuleDescriptor.create3(51 /* QuestionToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsConditionalOperatorContext), 2 /* Space */));
                this.NoSpaceAfterQuestionMark = new formatting.Rule(formatting.RuleDescriptor.create3(51 /* QuestionToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.SpaceAfterSemicolon = new formatting.Rule(formatting.RuleDescriptor.create3(22 /* SemicolonToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                // Space after }.
                this.SpaceAfterCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create3(15 /* CloseBraceToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsAfterCodeBlockContext), 2 /* Space */));
                // Special case for (}, else) and (}, while) since else & while tokens are not part of the tree which makes SpaceAfterCloseBrace rule not applied
                this.SpaceBetweenCloseBraceAndElse = new formatting.Rule(formatting.RuleDescriptor.create1(15 /* CloseBraceToken */, 77 /* ElseKeyword */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.SpaceBetweenCloseBraceAndWhile = new formatting.Rule(formatting.RuleDescriptor.create1(15 /* CloseBraceToken */, 101 /* WhileKeyword */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.NoSpaceAfterCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create3(15 /* CloseBraceToken */, formatting.Shared.TokenRange.FromTokens([17 /* CloseParenToken */, 19 /* CloseBracketToken */, 23 /* CommaToken */, 22 /* SemicolonToken */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // No space for indexer and dot
                this.NoSpaceBeforeDot = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 20 /* DotToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterDot = new formatting.Rule(formatting.RuleDescriptor.create3(20 /* DotToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeOpenBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 18 /* OpenBracketToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterOpenBracket = new formatting.Rule(formatting.RuleDescriptor.create3(18 /* OpenBracketToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeCloseBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 19 /* CloseBracketToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterCloseBracket = new formatting.Rule(formatting.RuleDescriptor.create3(19 /* CloseBracketToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBeforeBlockInFunctionDeclarationContext), 8 /* Delete */));
                // Place a space before open brace in a function declaration
                this.FunctionOpenBraceLeftTokenRange = formatting.Shared.TokenRange.AnyIncludingMultilineComments;
                this.SpaceBeforeOpenBraceInFunction = new formatting.Rule(formatting.RuleDescriptor.create2(this.FunctionOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext, Rules.IsBeforeBlockContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2 /* Space */), 1 /* CanDeleteNewLines */);
                // Place a space before open brace in a TypeScript declaration that has braces as children (class, module, enum, etc)
                this.TypeScriptOpenBraceLeftTokenRange = formatting.Shared.TokenRange.FromTokens([66 /* Identifier */, 3 /* MultiLineCommentTrivia */]);
                this.SpaceBeforeOpenBraceInTypeScriptDeclWithBlock = new formatting.Rule(formatting.RuleDescriptor.create2(this.TypeScriptOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsTypeScriptDeclWithBlockContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2 /* Space */), 1 /* CanDeleteNewLines */);
                // Place a space before open brace in a control flow construct
                this.ControlOpenBraceLeftTokenRange = formatting.Shared.TokenRange.FromTokens([17 /* CloseParenToken */, 3 /* MultiLineCommentTrivia */, 76 /* DoKeyword */, 97 /* TryKeyword */, 82 /* FinallyKeyword */, 77 /* ElseKeyword */]);
                this.SpaceBeforeOpenBraceInControl = new formatting.Rule(formatting.RuleDescriptor.create2(this.ControlOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2 /* Space */), 1 /* CanDeleteNewLines */);
                // Insert a space after { and before } in single-line contexts, but remove space from empty object literals {}.
                this.SpaceAfterOpenBrace = new formatting.Rule(formatting.RuleDescriptor.create3(14 /* OpenBraceToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSingleLineBlockContext), 2 /* Space */));
                this.SpaceBeforeCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 15 /* CloseBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSingleLineBlockContext), 2 /* Space */));
                this.NoSpaceBetweenEmptyBraceBrackets = new formatting.Rule(formatting.RuleDescriptor.create1(14 /* OpenBraceToken */, 15 /* CloseBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsObjectContext), 8 /* Delete */));
                // Insert new line after { and before } in multi-line contexts.
                this.NewLineAfterOpenBraceInBlockContext = new formatting.Rule(formatting.RuleDescriptor.create3(14 /* OpenBraceToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsMultilineBlockContext), 4 /* NewLine */));
                // For functions and control block place } on a new line    [multi-line rule]
                this.NewLineBeforeCloseBraceInBlockContext = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.AnyIncludingMultilineComments, 15 /* CloseBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsMultilineBlockContext), 4 /* NewLine */));
                // Special handling of unary operators.
                // Prefix operators generally shouldn't have a space between
                // them and their target unary expression.
                this.NoSpaceAfterUnaryPrefixOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.UnaryPrefixOperators, formatting.Shared.TokenRange.UnaryPrefixExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8 /* Delete */));
                this.NoSpaceAfterUnaryPreincrementOperator = new formatting.Rule(formatting.RuleDescriptor.create3(39 /* PlusPlusToken */, formatting.Shared.TokenRange.UnaryPreincrementExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterUnaryPredecrementOperator = new formatting.Rule(formatting.RuleDescriptor.create3(40 /* MinusMinusToken */, formatting.Shared.TokenRange.UnaryPredecrementExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeUnaryPostincrementOperator = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.UnaryPostincrementExpressions, 39 /* PlusPlusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeUnaryPostdecrementOperator = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.UnaryPostdecrementExpressions, 40 /* MinusMinusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // More unary operator special-casing.
                // DevDiv 181814:  Be careful when removing leading whitespace
                // around unary operators.  Examples:
                //      1 - -2  --X-->  1--2
                //      a + ++b --X-->  a+++b
                this.SpaceAfterPostincrementWhenFollowedByAdd = new formatting.Rule(formatting.RuleDescriptor.create1(39 /* PlusPlusToken */, 34 /* PlusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterAddWhenFollowedByUnaryPlus = new formatting.Rule(formatting.RuleDescriptor.create1(34 /* PlusToken */, 34 /* PlusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterAddWhenFollowedByPreincrement = new formatting.Rule(formatting.RuleDescriptor.create1(34 /* PlusToken */, 39 /* PlusPlusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterPostdecrementWhenFollowedBySubtract = new formatting.Rule(formatting.RuleDescriptor.create1(40 /* MinusMinusToken */, 35 /* MinusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterSubtractWhenFollowedByUnaryMinus = new formatting.Rule(formatting.RuleDescriptor.create1(35 /* MinusToken */, 35 /* MinusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterSubtractWhenFollowedByPredecrement = new formatting.Rule(formatting.RuleDescriptor.create1(35 /* MinusToken */, 40 /* MinusMinusToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.NoSpaceBeforeComma = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 23 /* CommaToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.SpaceAfterCertainKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([99 /* VarKeyword */, 95 /* ThrowKeyword */, 89 /* NewKeyword */, 75 /* DeleteKeyword */, 91 /* ReturnKeyword */, 98 /* TypeOfKeyword */]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.SpaceAfterLetConstInVariableDeclaration = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([105 /* LetKeyword */, 71 /* ConstKeyword */]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsStartOfVariableDeclarationList), 2 /* Space */));
                this.NoSpaceBeforeOpenParenInFuncCall = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsFunctionCallOrNewContext, Rules.IsPreviousTokenNotComma), 8 /* Delete */));
                this.SpaceAfterFunctionInFuncDecl = new formatting.Rule(formatting.RuleDescriptor.create3(84 /* FunctionKeyword */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2 /* Space */));
                this.NoSpaceBeforeOpenParenInFuncDecl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsFunctionDeclContext), 8 /* Delete */));
                this.SpaceAfterVoidOperator = new formatting.Rule(formatting.RuleDescriptor.create3(100 /* VoidKeyword */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsVoidOpContext), 2 /* Space */));
                this.NoSpaceBetweenReturnAndSemicolon = new formatting.Rule(formatting.RuleDescriptor.create1(91 /* ReturnKeyword */, 22 /* SemicolonToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // Add a space between statements. All keywords except (do,else,case) has open/close parens after them.
                // So, we have a rule to add a space for [),Any], [do,Any], [else,Any], and [case,Any]
                this.SpaceBetweenStatements = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([17 /* CloseParenToken */, 76 /* DoKeyword */, 77 /* ElseKeyword */, 68 /* CaseKeyword */]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotForContext), 2 /* Space */));
                // This low-pri rule takes care of "try {" and "finally {" in case the rule SpaceBeforeOpenBraceInControl didn't execute on FormatOnEnter.
                this.SpaceAfterTryFinally = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([97 /* TryKeyword */, 82 /* FinallyKeyword */]), 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                //      get x() {}
                //      set x(val) {}
                this.SpaceAfterGetSetInMember = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([119 /* GetKeyword */, 125 /* SetKeyword */]), 66 /* Identifier */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2 /* Space */));
                // Special case for binary operators (that are keywords). For these we have to add a space and shouldn't follow any user options.
                this.SpaceBeforeBinaryKeywordOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryKeywordOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterBinaryKeywordOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryKeywordOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                // TypeScript-specific higher priority rules
                // Treat constructor as an identifier in a function declaration, and remove spaces between constructor and following left parentheses
                this.NoSpaceAfterConstructor = new formatting.Rule(formatting.RuleDescriptor.create1(117 /* ConstructorKeyword */, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // Use of module as a function call. e.g.: import m2 = module("m2");
                this.NoSpaceAfterModuleImport = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([121 /* ModuleKeyword */, 123 /* RequireKeyword */]), 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // Add a space around certain TypeScript keywords
                this.SpaceAfterCertainTypeScriptKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([70 /* ClassKeyword */, 118 /* DeclareKeyword */, 74 /* DefaultKeyword */, 78 /* EnumKeyword */, 79 /* ExportKeyword */, 80 /* ExtendsKeyword */, 119 /* GetKeyword */, 103 /* ImplementsKeyword */, 86 /* ImportKeyword */, 104 /* InterfaceKeyword */, 121 /* ModuleKeyword */, 122 /* NamespaceKeyword */, 107 /* PrivateKeyword */, 109 /* PublicKeyword */, 108 /* ProtectedKeyword */, 125 /* SetKeyword */, 110 /* StaticKeyword */]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.SpaceBeforeCertainTypeScriptKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.FromTokens([80 /* ExtendsKeyword */, 103 /* ImplementsKeyword */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                // Treat string literals in module names as identifiers, and add a space between the literal and the opening Brace braces, e.g.: module "m2" {
                this.SpaceAfterModuleName = new formatting.Rule(formatting.RuleDescriptor.create1(8 /* StringLiteral */, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsModuleDeclContext), 2 /* Space */));
                // Lambda expressions
                this.SpaceAfterArrow = new formatting.Rule(formatting.RuleDescriptor.create3(33 /* EqualsGreaterThanToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                // Optional parameters and let args
                this.NoSpaceAfterEllipsis = new formatting.Rule(formatting.RuleDescriptor.create1(21 /* DotDotDotToken */, 66 /* Identifier */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterOptionalParameters = new formatting.Rule(formatting.RuleDescriptor.create3(51 /* QuestionToken */, formatting.Shared.TokenRange.FromTokens([17 /* CloseParenToken */, 23 /* CommaToken */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8 /* Delete */));
                // generics
                this.NoSpaceBeforeOpenAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.TypeNames, 24 /* LessThanToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8 /* Delete */));
                this.NoSpaceBetweenCloseParenAndAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create1(17 /* CloseParenToken */, 24 /* LessThanToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8 /* Delete */));
                this.NoSpaceAfterOpenAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create3(24 /* LessThanToken */, formatting.Shared.TokenRange.TypeNames), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8 /* Delete */));
                this.NoSpaceBeforeCloseAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 26 /* GreaterThanToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8 /* Delete */));
                this.NoSpaceAfterCloseAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create3(26 /* GreaterThanToken */, formatting.Shared.TokenRange.FromTokens([16 /* OpenParenToken */, 18 /* OpenBracketToken */, 26 /* GreaterThanToken */, 23 /* CommaToken */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8 /* Delete */));
                // Remove spaces in empty interface literals. e.g.: x: {}
                this.NoSpaceBetweenEmptyInterfaceBraceBrackets = new formatting.Rule(formatting.RuleDescriptor.create1(14 /* OpenBraceToken */, 15 /* CloseBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsObjectTypeContext), 8 /* Delete */));
                // decorators
                this.SpaceBeforeAt = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 53 /* AtToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.NoSpaceAfterAt = new formatting.Rule(formatting.RuleDescriptor.create3(53 /* AtToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.SpaceAfterDecorator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.FromTokens([66 /* Identifier */, 79 /* ExportKeyword */, 74 /* DefaultKeyword */, 70 /* ClassKeyword */, 110 /* StaticKeyword */, 109 /* PublicKeyword */, 107 /* PrivateKeyword */, 108 /* ProtectedKeyword */, 119 /* GetKeyword */, 125 /* SetKeyword */, 18 /* OpenBracketToken */, 36 /* AsteriskToken */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsEndOfDecoratorContextOnSameLine), 2 /* Space */));
                this.NoSpaceBetweenFunctionKeywordAndStar = new formatting.Rule(formatting.RuleDescriptor.create1(84 /* FunctionKeyword */, 36 /* AsteriskToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclarationOrFunctionExpressionContext), 8 /* Delete */));
                this.SpaceAfterStarInGeneratorDeclaration = new formatting.Rule(formatting.RuleDescriptor.create3(36 /* AsteriskToken */, formatting.Shared.TokenRange.FromTokens([66 /* Identifier */, 16 /* OpenParenToken */])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclarationOrFunctionExpressionContext), 2 /* Space */));
                this.NoSpaceBetweenYieldKeywordAndStar = new formatting.Rule(formatting.RuleDescriptor.create1(111 /* YieldKeyword */, 36 /* AsteriskToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsYieldOrYieldStarWithOperand), 8 /* Delete */));
                this.SpaceBetweenYieldOrYieldStarAndOperand = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([111 /* YieldKeyword */, 36 /* AsteriskToken */]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsYieldOrYieldStarWithOperand), 2 /* Space */));
                // These rules are higher in priority than user-configurable rules.
                this.HighPriorityCommonRules =
                    [
                        this.IgnoreBeforeComment, this.IgnoreAfterLineComment,
                        this.NoSpaceBeforeColon, this.SpaceAfterColon, this.NoSpaceBeforeQuestionMark, this.SpaceAfterQuestionMarkInConditionalOperator,
                        this.NoSpaceAfterQuestionMark,
                        this.NoSpaceBeforeDot, this.NoSpaceAfterDot,
                        this.NoSpaceAfterUnaryPrefixOperator,
                        this.NoSpaceAfterUnaryPreincrementOperator, this.NoSpaceAfterUnaryPredecrementOperator,
                        this.NoSpaceBeforeUnaryPostincrementOperator, this.NoSpaceBeforeUnaryPostdecrementOperator,
                        this.SpaceAfterPostincrementWhenFollowedByAdd,
                        this.SpaceAfterAddWhenFollowedByUnaryPlus, this.SpaceAfterAddWhenFollowedByPreincrement,
                        this.SpaceAfterPostdecrementWhenFollowedBySubtract,
                        this.SpaceAfterSubtractWhenFollowedByUnaryMinus, this.SpaceAfterSubtractWhenFollowedByPredecrement,
                        this.NoSpaceAfterCloseBrace,
                        this.SpaceAfterOpenBrace, this.SpaceBeforeCloseBrace, this.NewLineBeforeCloseBraceInBlockContext,
                        this.SpaceAfterCloseBrace, this.SpaceBetweenCloseBraceAndElse, this.SpaceBetweenCloseBraceAndWhile, this.NoSpaceBetweenEmptyBraceBrackets,
                        this.NoSpaceBetweenFunctionKeywordAndStar, this.SpaceAfterStarInGeneratorDeclaration,
                        this.SpaceAfterFunctionInFuncDecl, this.NewLineAfterOpenBraceInBlockContext, this.SpaceAfterGetSetInMember,
                        this.NoSpaceBetweenYieldKeywordAndStar, this.SpaceBetweenYieldOrYieldStarAndOperand,
                        this.NoSpaceBetweenReturnAndSemicolon,
                        this.SpaceAfterCertainKeywords,
                        this.SpaceAfterLetConstInVariableDeclaration,
                        this.NoSpaceBeforeOpenParenInFuncCall,
                        this.SpaceBeforeBinaryKeywordOperator, this.SpaceAfterBinaryKeywordOperator,
                        this.SpaceAfterVoidOperator,
                        // TypeScript-specific rules
                        this.NoSpaceAfterConstructor, this.NoSpaceAfterModuleImport,
                        this.SpaceAfterCertainTypeScriptKeywords, this.SpaceBeforeCertainTypeScriptKeywords,
                        this.SpaceAfterModuleName,
                        this.SpaceAfterArrow,
                        this.NoSpaceAfterEllipsis,
                        this.NoSpaceAfterOptionalParameters,
                        this.NoSpaceBetweenEmptyInterfaceBraceBrackets,
                        this.NoSpaceBeforeOpenAngularBracket,
                        this.NoSpaceBetweenCloseParenAndAngularBracket,
                        this.NoSpaceAfterOpenAngularBracket,
                        this.NoSpaceBeforeCloseAngularBracket,
                        this.NoSpaceAfterCloseAngularBracket,
                        this.SpaceBeforeAt,
                        this.NoSpaceAfterAt,
                        this.SpaceAfterDecorator,
                    ];
                // These rules are lower in priority than user-configurable rules.
                this.LowPriorityCommonRules =
                    [
                        this.NoSpaceBeforeSemicolon,
                        this.SpaceBeforeOpenBraceInControl, this.SpaceBeforeOpenBraceInFunction, this.SpaceBeforeOpenBraceInTypeScriptDeclWithBlock,
                        this.NoSpaceBeforeComma,
                        this.NoSpaceBeforeOpenBracket, this.NoSpaceAfterOpenBracket,
                        this.NoSpaceBeforeCloseBracket, this.NoSpaceAfterCloseBracket,
                        this.SpaceAfterSemicolon,
                        this.NoSpaceBeforeOpenParenInFuncDecl,
                        this.SpaceBetweenStatements, this.SpaceAfterTryFinally
                    ];
                ///
                /// Rules controlled by user options
                ///
                // Insert space after comma delimiter
                this.SpaceAfterComma = new formatting.Rule(formatting.RuleDescriptor.create3(23 /* CommaToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.NoSpaceAfterComma = new formatting.Rule(formatting.RuleDescriptor.create3(23 /* CommaToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // Insert space before and after binary operators
                this.SpaceBeforeBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.SpaceAfterBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2 /* Space */));
                this.NoSpaceBeforeBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 8 /* Delete */));
                this.NoSpaceAfterBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 8 /* Delete */));
                // Insert space after keywords in control flow statements
                this.SpaceAfterKeywordInControl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Keywords, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext), 2 /* Space */));
                this.NoSpaceAfterKeywordInControl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Keywords, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext), 8 /* Delete */));
                // Open Brace braces after function
                //TypeScript: Function can have return types, which can be made of tons of different token kinds
                this.NewLineBeforeOpenBraceInFunction = new formatting.Rule(formatting.RuleDescriptor.create2(this.FunctionOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext, Rules.IsBeforeMultilineBlockContext), 4 /* NewLine */), 1 /* CanDeleteNewLines */);
                // Open Brace braces after TypeScript module/class/interface
                this.NewLineBeforeOpenBraceInTypeScriptDeclWithBlock = new formatting.Rule(formatting.RuleDescriptor.create2(this.TypeScriptOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsTypeScriptDeclWithBlockContext, Rules.IsBeforeMultilineBlockContext), 4 /* NewLine */), 1 /* CanDeleteNewLines */);
                // Open Brace braces after control block
                this.NewLineBeforeOpenBraceInControl = new formatting.Rule(formatting.RuleDescriptor.create2(this.ControlOpenBraceLeftTokenRange, 14 /* OpenBraceToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext, Rules.IsBeforeMultilineBlockContext), 4 /* NewLine */), 1 /* CanDeleteNewLines */);
                // Insert space after semicolon in for statement
                this.SpaceAfterSemicolonInFor = new formatting.Rule(formatting.RuleDescriptor.create3(22 /* SemicolonToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsForContext), 2 /* Space */));
                this.NoSpaceAfterSemicolonInFor = new formatting.Rule(formatting.RuleDescriptor.create3(22 /* SemicolonToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsForContext), 8 /* Delete */));
                // Insert space after opening and before closing nonempty parenthesis
                this.SpaceAfterOpenParen = new formatting.Rule(formatting.RuleDescriptor.create3(16 /* OpenParenToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.SpaceBeforeCloseParen = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 17 /* CloseParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2 /* Space */));
                this.NoSpaceBetweenParens = new formatting.Rule(formatting.RuleDescriptor.create1(16 /* OpenParenToken */, 17 /* CloseParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceAfterOpenParen = new formatting.Rule(formatting.RuleDescriptor.create3(16 /* OpenParenToken */, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                this.NoSpaceBeforeCloseParen = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 17 /* CloseParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8 /* Delete */));
                // Insert space after function keyword for anonymous functions
                this.SpaceAfterAnonymousFunctionKeyword = new formatting.Rule(formatting.RuleDescriptor.create1(84 /* FunctionKeyword */, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2 /* Space */));
                this.NoSpaceAfterAnonymousFunctionKeyword = new formatting.Rule(formatting.RuleDescriptor.create1(84 /* FunctionKeyword */, 16 /* OpenParenToken */), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 8 /* Delete */));
            }
            Rules.prototype.getRuleName = function (rule) {
                var o = this;
                for (var name_1 in o) {
                    if (o[name_1] === rule) {
                        return name_1;
                    }
                }
                throw new Error("Unknown rule");
            };
            ///
            /// Contexts
            ///
            Rules.IsForContext = function (context) {
                return context.contextNode.kind === 194 /* ForStatement */;
            };
            Rules.IsNotForContext = function (context) {
                return !Rules.IsForContext(context);
            };
            Rules.IsBinaryOpContext = function (context) {
                switch (context.contextNode.kind) {
                    case 176 /* BinaryExpression */:
                    case 177 /* ConditionalExpression */:
                    case 184 /* AsExpression */:
                    case 146 /* TypePredicate */:
                        return true;
                    // equals in binding elements: function foo([[x, y] = [1, 2]])
                    case 158 /* BindingElement */:
                    // equals in type X = ...
                    case 211 /* TypeAliasDeclaration */:
                    // equal in import a = module('a');
                    case 216 /* ImportEqualsDeclaration */:
                    // equal in let a = 0;
                    case 206 /* VariableDeclaration */:
                    // equal in p = 0;
                    case 134 /* Parameter */:
                    case 242 /* EnumMember */:
                    case 137 /* PropertyDeclaration */:
                    case 136 /* PropertySignature */:
                        return context.currentTokenSpan.kind === 54 /* EqualsToken */ || context.nextTokenSpan.kind === 54 /* EqualsToken */;
                    // "in" keyword in for (let x in []) { }
                    case 195 /* ForInStatement */:
                        return context.currentTokenSpan.kind === 87 /* InKeyword */ || context.nextTokenSpan.kind === 87 /* InKeyword */;
                    // Technically, "of" is not a binary operator, but format it the same way as "in"
                    case 196 /* ForOfStatement */:
                        return context.currentTokenSpan.kind === 130 /* OfKeyword */ || context.nextTokenSpan.kind === 130 /* OfKeyword */;
                }
                return false;
            };
            Rules.IsNotBinaryOpContext = function (context) {
                return !Rules.IsBinaryOpContext(context);
            };
            Rules.IsConditionalOperatorContext = function (context) {
                return context.contextNode.kind === 177 /* ConditionalExpression */;
            };
            Rules.IsSameLineTokenOrBeforeMultilineBlockContext = function (context) {
                //// This check is mainly used inside SpaceBeforeOpenBraceInControl and SpaceBeforeOpenBraceInFunction.
                ////
                //// Ex: 
                //// if (1)     { ....
                ////      * ) and { are on the same line so apply the rule. Here we don't care whether it's same or multi block context
                ////
                //// Ex: 
                //// if (1)
                //// { ... }
                ////      * ) and { are on differnet lines. We only need to format if the block is multiline context. So in this case we don't format.
                ////
                //// Ex:
                //// if (1) 
                //// { ...
                //// }
                ////      * ) and { are on differnet lines. We only need to format if the block is multiline context. So in this case we format.
                return context.TokensAreOnSameLine() || Rules.IsBeforeMultilineBlockContext(context);
            };
            // This check is done before an open brace in a control construct, a function, or a typescript block declaration
            Rules.IsBeforeMultilineBlockContext = function (context) {
                return Rules.IsBeforeBlockContext(context) && !(context.NextNodeAllOnSameLine() || context.NextNodeBlockIsOnOneLine());
            };
            Rules.IsMultilineBlockContext = function (context) {
                return Rules.IsBlockContext(context) && !(context.ContextNodeAllOnSameLine() || context.ContextNodeBlockIsOnOneLine());
            };
            Rules.IsSingleLineBlockContext = function (context) {
                return Rules.IsBlockContext(context) && (context.ContextNodeAllOnSameLine() || context.ContextNodeBlockIsOnOneLine());
            };
            Rules.IsBlockContext = function (context) {
                return Rules.NodeIsBlockContext(context.contextNode);
            };
            Rules.IsBeforeBlockContext = function (context) {
                return Rules.NodeIsBlockContext(context.nextTokenParent);
            };
            // IMPORTANT!!! This method must return true ONLY for nodes with open and close braces as immediate children
            Rules.NodeIsBlockContext = function (node) {
                if (Rules.NodeIsTypeScriptDeclWithBlockContext(node)) {
                    // This means we are in a context that looks like a block to the user, but in the grammar is actually not a node (it's a class, module, enum, object type literal, etc).
                    return true;
                }
                switch (node.kind) {
                    case 187 /* Block */:
                    case 215 /* CaseBlock */:
                    case 160 /* ObjectLiteralExpression */:
                    case 214 /* ModuleBlock */:
                        return true;
                }
                return false;
            };
            Rules.IsFunctionDeclContext = function (context) {
                switch (context.contextNode.kind) {
                    case 208 /* FunctionDeclaration */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    //case SyntaxKind.MemberFunctionDeclaration:
                    case 141 /* GetAccessor */:
                    case 142 /* SetAccessor */:
                    ///case SyntaxKind.MethodSignature:
                    case 143 /* CallSignature */:
                    case 168 /* FunctionExpression */:
                    case 140 /* Constructor */:
                    case 169 /* ArrowFunction */:
                    //case SyntaxKind.ConstructorDeclaration:
                    //case SyntaxKind.SimpleArrowFunctionExpression:
                    //case SyntaxKind.ParenthesizedArrowFunctionExpression:
                    case 210 /* InterfaceDeclaration */:
                        return true;
                }
                return false;
            };
            Rules.IsFunctionDeclarationOrFunctionExpressionContext = function (context) {
                return context.contextNode.kind === 208 /* FunctionDeclaration */ || context.contextNode.kind === 168 /* FunctionExpression */;
            };
            Rules.IsTypeScriptDeclWithBlockContext = function (context) {
                return Rules.NodeIsTypeScriptDeclWithBlockContext(context.contextNode);
            };
            Rules.NodeIsTypeScriptDeclWithBlockContext = function (node) {
                switch (node.kind) {
                    case 209 /* ClassDeclaration */:
                    case 210 /* InterfaceDeclaration */:
                    case 212 /* EnumDeclaration */:
                    case 151 /* TypeLiteral */:
                    case 213 /* ModuleDeclaration */:
                        return true;
                }
                return false;
            };
            Rules.IsAfterCodeBlockContext = function (context) {
                switch (context.currentTokenParent.kind) {
                    case 209 /* ClassDeclaration */:
                    case 213 /* ModuleDeclaration */:
                    case 212 /* EnumDeclaration */:
                    case 187 /* Block */:
                    case 239 /* CatchClause */:
                    case 214 /* ModuleBlock */:
                    case 201 /* SwitchStatement */:
                        return true;
                }
                return false;
            };
            Rules.IsControlDeclContext = function (context) {
                switch (context.contextNode.kind) {
                    case 191 /* IfStatement */:
                    case 201 /* SwitchStatement */:
                    case 194 /* ForStatement */:
                    case 195 /* ForInStatement */:
                    case 196 /* ForOfStatement */:
                    case 193 /* WhileStatement */:
                    case 204 /* TryStatement */:
                    case 192 /* DoStatement */:
                    case 200 /* WithStatement */:
                    // TODO
                    // case SyntaxKind.ElseClause:
                    case 239 /* CatchClause */:
                        return true;
                    default:
                        return false;
                }
            };
            Rules.IsObjectContext = function (context) {
                return context.contextNode.kind === 160 /* ObjectLiteralExpression */;
            };
            Rules.IsFunctionCallContext = function (context) {
                return context.contextNode.kind === 163 /* CallExpression */;
            };
            Rules.IsNewContext = function (context) {
                return context.contextNode.kind === 164 /* NewExpression */;
            };
            Rules.IsFunctionCallOrNewContext = function (context) {
                return Rules.IsFunctionCallContext(context) || Rules.IsNewContext(context);
            };
            Rules.IsPreviousTokenNotComma = function (context) {
                return context.currentTokenSpan.kind !== 23 /* CommaToken */;
            };
            Rules.IsSameLineTokenContext = function (context) {
                return context.TokensAreOnSameLine();
            };
            Rules.IsNotBeforeBlockInFunctionDeclarationContext = function (context) {
                return !Rules.IsFunctionDeclContext(context) && !Rules.IsBeforeBlockContext(context);
            };
            Rules.IsEndOfDecoratorContextOnSameLine = function (context) {
                return context.TokensAreOnSameLine() &&
                    context.contextNode.decorators &&
                    Rules.NodeIsInDecoratorContext(context.currentTokenParent) &&
                    !Rules.NodeIsInDecoratorContext(context.nextTokenParent);
            };
            Rules.NodeIsInDecoratorContext = function (node) {
                while (ts.isExpression(node)) {
                    node = node.parent;
                }
                return node.kind === 135 /* Decorator */;
            };
            Rules.IsStartOfVariableDeclarationList = function (context) {
                return context.currentTokenParent.kind === 207 /* VariableDeclarationList */ &&
                    context.currentTokenParent.getStart(context.sourceFile) === context.currentTokenSpan.pos;
            };
            Rules.IsNotFormatOnEnter = function (context) {
                return context.formattingRequestKind !== 2 /* FormatOnEnter */;
            };
            Rules.IsModuleDeclContext = function (context) {
                return context.contextNode.kind === 213 /* ModuleDeclaration */;
            };
            Rules.IsObjectTypeContext = function (context) {
                return context.contextNode.kind === 151 /* TypeLiteral */; // && context.contextNode.parent.kind !== SyntaxKind.InterfaceDeclaration;
            };
            Rules.IsTypeArgumentOrParameter = function (token, parent) {
                if (token.kind !== 24 /* LessThanToken */ && token.kind !== 26 /* GreaterThanToken */) {
                    return false;
                }
                switch (parent.kind) {
                    case 147 /* TypeReference */:
                    case 209 /* ClassDeclaration */:
                    case 210 /* InterfaceDeclaration */:
                    case 208 /* FunctionDeclaration */:
                    case 168 /* FunctionExpression */:
                    case 169 /* ArrowFunction */:
                    case 139 /* MethodDeclaration */:
                    case 138 /* MethodSignature */:
                    case 143 /* CallSignature */:
                    case 144 /* ConstructSignature */:
                    case 163 /* CallExpression */:
                    case 164 /* NewExpression */:
                        return true;
                    default:
                        return false;
                }
            };
            Rules.IsTypeArgumentOrParameterContext = function (context) {
                return Rules.IsTypeArgumentOrParameter(context.currentTokenSpan, context.currentTokenParent) ||
                    Rules.IsTypeArgumentOrParameter(context.nextTokenSpan, context.nextTokenParent);
            };
            Rules.IsVoidOpContext = function (context) {
                return context.currentTokenSpan.kind === 100 /* VoidKeyword */ && context.currentTokenParent.kind === 172 /* VoidExpression */;
            };
            Rules.IsYieldOrYieldStarWithOperand = function (context) {
                return context.contextNode.kind === 179 /* YieldExpression */ && context.contextNode.expression !== undefined;
            };
            return Rules;
        })();
        formatting.Rules = Rules;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
