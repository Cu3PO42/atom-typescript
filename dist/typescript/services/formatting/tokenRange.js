///<reference path='references.ts' />
/* @internal */
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Shared;
        (function (Shared) {
            var TokenRangeAccess = (function () {
                function TokenRangeAccess(from, to, except) {
                    this.tokens = [];
                    for (var token = from; token <= to; token++) {
                        if (except.indexOf(token) < 0) {
                            this.tokens.push(token);
                        }
                    }
                }
                TokenRangeAccess.prototype.GetTokens = function () {
                    return this.tokens;
                };
                TokenRangeAccess.prototype.Contains = function (token) {
                    return this.tokens.indexOf(token) >= 0;
                };
                return TokenRangeAccess;
            })();
            Shared.TokenRangeAccess = TokenRangeAccess;
            var TokenValuesAccess = (function () {
                function TokenValuesAccess(tks) {
                    this.tokens = tks && tks.length ? tks : [];
                }
                TokenValuesAccess.prototype.GetTokens = function () {
                    return this.tokens;
                };
                TokenValuesAccess.prototype.Contains = function (token) {
                    return this.tokens.indexOf(token) >= 0;
                };
                return TokenValuesAccess;
            })();
            Shared.TokenValuesAccess = TokenValuesAccess;
            var TokenSingleValueAccess = (function () {
                function TokenSingleValueAccess(token) {
                    this.token = token;
                }
                TokenSingleValueAccess.prototype.GetTokens = function () {
                    return [this.token];
                };
                TokenSingleValueAccess.prototype.Contains = function (tokenValue) {
                    return tokenValue === this.token;
                };
                return TokenSingleValueAccess;
            })();
            Shared.TokenSingleValueAccess = TokenSingleValueAccess;
            var TokenAllAccess = (function () {
                function TokenAllAccess() {
                }
                TokenAllAccess.prototype.GetTokens = function () {
                    var result = [];
                    for (var token = 0 /* FirstToken */; token <= 130 /* LastToken */; token++) {
                        result.push(token);
                    }
                    return result;
                };
                TokenAllAccess.prototype.Contains = function (tokenValue) {
                    return true;
                };
                TokenAllAccess.prototype.toString = function () {
                    return "[allTokens]";
                };
                return TokenAllAccess;
            })();
            Shared.TokenAllAccess = TokenAllAccess;
            var TokenRange = (function () {
                function TokenRange(tokenAccess) {
                    this.tokenAccess = tokenAccess;
                }
                TokenRange.FromToken = function (token) {
                    return new TokenRange(new TokenSingleValueAccess(token));
                };
                TokenRange.FromTokens = function (tokens) {
                    return new TokenRange(new TokenValuesAccess(tokens));
                };
                TokenRange.FromRange = function (f, to, except) {
                    if (except === void 0) { except = []; }
                    return new TokenRange(new TokenRangeAccess(f, to, except));
                };
                TokenRange.AllTokens = function () {
                    return new TokenRange(new TokenAllAccess());
                };
                TokenRange.prototype.GetTokens = function () {
                    return this.tokenAccess.GetTokens();
                };
                TokenRange.prototype.Contains = function (token) {
                    return this.tokenAccess.Contains(token);
                };
                TokenRange.prototype.toString = function () {
                    return this.tokenAccess.toString();
                };
                TokenRange.Any = TokenRange.AllTokens();
                TokenRange.AnyIncludingMultilineComments = TokenRange.FromTokens(TokenRange.Any.GetTokens().concat([3 /* MultiLineCommentTrivia */]));
                TokenRange.Keywords = TokenRange.FromRange(67 /* FirstKeyword */, 130 /* LastKeyword */);
                TokenRange.BinaryOperators = TokenRange.FromRange(24 /* FirstBinaryOperator */, 65 /* LastBinaryOperator */);
                TokenRange.BinaryKeywordOperators = TokenRange.FromTokens([87 /* InKeyword */, 88 /* InstanceOfKeyword */, 130 /* OfKeyword */, 112 /* AsKeyword */, 120 /* IsKeyword */]);
                TokenRange.UnaryPrefixOperators = TokenRange.FromTokens([39 /* PlusPlusToken */, 40 /* MinusMinusToken */, 48 /* TildeToken */, 47 /* ExclamationToken */]);
                TokenRange.UnaryPrefixExpressions = TokenRange.FromTokens([7 /* NumericLiteral */, 66 /* Identifier */, 16 /* OpenParenToken */, 18 /* OpenBracketToken */, 14 /* OpenBraceToken */, 94 /* ThisKeyword */, 89 /* NewKeyword */]);
                TokenRange.UnaryPreincrementExpressions = TokenRange.FromTokens([66 /* Identifier */, 16 /* OpenParenToken */, 94 /* ThisKeyword */, 89 /* NewKeyword */]);
                TokenRange.UnaryPostincrementExpressions = TokenRange.FromTokens([66 /* Identifier */, 17 /* CloseParenToken */, 19 /* CloseBracketToken */, 89 /* NewKeyword */]);
                TokenRange.UnaryPredecrementExpressions = TokenRange.FromTokens([66 /* Identifier */, 16 /* OpenParenToken */, 94 /* ThisKeyword */, 89 /* NewKeyword */]);
                TokenRange.UnaryPostdecrementExpressions = TokenRange.FromTokens([66 /* Identifier */, 17 /* CloseParenToken */, 19 /* CloseBracketToken */, 89 /* NewKeyword */]);
                TokenRange.Comments = TokenRange.FromTokens([2 /* SingleLineCommentTrivia */, 3 /* MultiLineCommentTrivia */]);
                TokenRange.TypeNames = TokenRange.FromTokens([66 /* Identifier */, 124 /* NumberKeyword */, 126 /* StringKeyword */, 116 /* BooleanKeyword */, 127 /* SymbolKeyword */, 100 /* VoidKeyword */, 113 /* AnyKeyword */]);
                return TokenRange;
            })();
            Shared.TokenRange = TokenRange;
        })(Shared = formatting.Shared || (formatting.Shared = {}));
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
