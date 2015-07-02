/// <reference path="sys.ts" />
/// <reference path="emitter.ts" />
var ts;
(function (ts) {
    /* @internal */ ts.programTime = 0;
    /* @internal */ ts.emitTime = 0;
    /* @internal */ ts.ioReadTime = 0;
    /* @internal */ ts.ioWriteTime = 0;
    /** The version of the TypeScript compiler release */
    ts.version = "1.5.3";
    function findConfigFile(searchPath) {
        var fileName = "tsconfig.json";
        while (true) {
            if (ts.sys.fileExists(fileName)) {
                return fileName;
            }
            var parentPath = ts.getDirectoryPath(searchPath);
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
            fileName = "../" + fileName;
        }
        return undefined;
    }
    ts.findConfigFile = findConfigFile;
    function createCompilerHost(options, setParentNodes) {
        var currentDirectory;
        var existingDirectories = {};
        function getCanonicalFileName(fileName) {
            // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
            // otherwise use toLowerCase as a canonical form.
            return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
        }
        // returned by CScript sys environment
        var unsupportedFileEncodingErrorCode = -2147024809;
        function getSourceFile(fileName, languageVersion, onError) {
            var text;
            try {
                var start = new Date().getTime();
                text = ts.sys.readFile(fileName, options.charset);
                ts.ioReadTime += new Date().getTime() - start;
            }
            catch (e) {
                if (onError) {
                    onError(e.number === unsupportedFileEncodingErrorCode
                        ? ts.createCompilerDiagnostic(ts.Diagnostics.Unsupported_file_encoding).messageText
                        : e.message);
                }
                text = "";
            }
            return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion, setParentNodes) : undefined;
        }
        function directoryExists(directoryPath) {
            if (ts.hasProperty(existingDirectories, directoryPath)) {
                return true;
            }
            if (ts.sys.directoryExists(directoryPath)) {
                existingDirectories[directoryPath] = true;
                return true;
            }
            return false;
        }
        function ensureDirectoriesExist(directoryPath) {
            if (directoryPath.length > ts.getRootLength(directoryPath) && !directoryExists(directoryPath)) {
                var parentDirectory = ts.getDirectoryPath(directoryPath);
                ensureDirectoriesExist(parentDirectory);
                ts.sys.createDirectory(directoryPath);
            }
        }
        function writeFile(fileName, data, writeByteOrderMark, onError) {
            try {
                var start = new Date().getTime();
                ensureDirectoriesExist(ts.getDirectoryPath(ts.normalizePath(fileName)));
                ts.sys.writeFile(fileName, data, writeByteOrderMark);
                ts.ioWriteTime += new Date().getTime() - start;
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
            }
        }
        var newLine = ts.getNewLineCharacter(options);
        return {
            getSourceFile: getSourceFile,
            getDefaultLibFileName: function (options) { return ts.combinePaths(ts.getDirectoryPath(ts.normalizePath(ts.sys.getExecutingFilePath())), ts.getDefaultLibFileName(options)); },
            writeFile: writeFile,
            getCurrentDirectory: function () { return currentDirectory || (currentDirectory = ts.sys.getCurrentDirectory()); },
            useCaseSensitiveFileNames: function () { return ts.sys.useCaseSensitiveFileNames; },
            getCanonicalFileName: getCanonicalFileName,
            getNewLine: function () { return newLine; }
        };
    }
    ts.createCompilerHost = createCompilerHost;
    function getPreEmitDiagnostics(program, sourceFile) {
        var diagnostics = program.getOptionsDiagnostics().concat(program.getSyntacticDiagnostics(sourceFile), program.getGlobalDiagnostics(), program.getSemanticDiagnostics(sourceFile));
        if (program.getCompilerOptions().declaration) {
            diagnostics.concat(program.getDeclarationDiagnostics(sourceFile));
        }
        return ts.sortAndDeduplicateDiagnostics(diagnostics);
    }
    ts.getPreEmitDiagnostics = getPreEmitDiagnostics;
    function flattenDiagnosticMessageText(messageText, newLine) {
        if (typeof messageText === "string") {
            return messageText;
        }
        else {
            var diagnosticChain = messageText;
            var result = "";
            var indent = 0;
            while (diagnosticChain) {
                if (indent) {
                    result += newLine;
                    for (var i = 0; i < indent; i++) {
                        result += "  ";
                    }
                }
                result += diagnosticChain.messageText;
                indent++;
                diagnosticChain = diagnosticChain.next;
            }
            return result;
        }
    }
    ts.flattenDiagnosticMessageText = flattenDiagnosticMessageText;
    function createProgram(rootNames, options, host) {
        var program;
        var files = [];
        var diagnostics = ts.createDiagnosticCollection();
        var commonSourceDirectory;
        var diagnosticsProducingTypeChecker;
        var noDiagnosticsTypeChecker;
        var classifiableNames;
        var skipDefaultLib = options.noLib;
        var start = new Date().getTime();
        host = host || createCompilerHost(options);
        var filesByName = ts.createFileMap(function (fileName) { return host.getCanonicalFileName(fileName); });
        ts.forEach(rootNames, function (name) { return processRootFile(name, false); });
        // Do not process the default library if:
        //  - The '--noLib' flag is used.
        //  - A 'no-default-lib' reference comment is encountered in
        //      processing the root files.
        if (!skipDefaultLib) {
            processRootFile(host.getDefaultLibFileName(options), true);
        }
        verifyCompilerOptions();
        ts.programTime += new Date().getTime() - start;
        program = {
            getSourceFile: getSourceFile,
            getSourceFiles: function () { return files; },
            getCompilerOptions: function () { return options; },
            getSyntacticDiagnostics: getSyntacticDiagnostics,
            getOptionsDiagnostics: getOptionsDiagnostics,
            getGlobalDiagnostics: getGlobalDiagnostics,
            getSemanticDiagnostics: getSemanticDiagnostics,
            getDeclarationDiagnostics: getDeclarationDiagnostics,
            getTypeChecker: getTypeChecker,
            getClassifiableNames: getClassifiableNames,
            getDiagnosticsProducingTypeChecker: getDiagnosticsProducingTypeChecker,
            getCommonSourceDirectory: function () { return commonSourceDirectory; },
            emit: emit,
            getCurrentDirectory: function () { return host.getCurrentDirectory(); },
            getNodeCount: function () { return getDiagnosticsProducingTypeChecker().getNodeCount(); },
            getIdentifierCount: function () { return getDiagnosticsProducingTypeChecker().getIdentifierCount(); },
            getSymbolCount: function () { return getDiagnosticsProducingTypeChecker().getSymbolCount(); },
            getTypeCount: function () { return getDiagnosticsProducingTypeChecker().getTypeCount(); }
        };
        return program;
        function getClassifiableNames() {
            if (!classifiableNames) {
                // Initialize a checker so that all our files are bound.
                getTypeChecker();
                classifiableNames = {};
                for (var _i = 0; _i < files.length; _i++) {
                    var sourceFile = files[_i];
                    ts.copyMap(sourceFile.classifiableNames, classifiableNames);
                }
            }
            return classifiableNames;
        }
        function getEmitHost(writeFileCallback) {
            return {
                getCanonicalFileName: function (fileName) { return host.getCanonicalFileName(fileName); },
                getCommonSourceDirectory: program.getCommonSourceDirectory,
                getCompilerOptions: program.getCompilerOptions,
                getCurrentDirectory: function () { return host.getCurrentDirectory(); },
                getNewLine: function () { return host.getNewLine(); },
                getSourceFile: program.getSourceFile,
                getSourceFiles: program.getSourceFiles,
                writeFile: writeFileCallback || (function (fileName, data, writeByteOrderMark, onError) { return host.writeFile(fileName, data, writeByteOrderMark, onError); })
            };
        }
        function getDiagnosticsProducingTypeChecker() {
            return diagnosticsProducingTypeChecker || (diagnosticsProducingTypeChecker = ts.createTypeChecker(program, true));
        }
        function getTypeChecker() {
            return noDiagnosticsTypeChecker || (noDiagnosticsTypeChecker = ts.createTypeChecker(program, false));
        }
        function emit(sourceFile, writeFileCallback) {
            // If the noEmitOnError flag is set, then check if we have any errors so far.  If so,
            // immediately bail out.
            if (options.noEmitOnError && getPreEmitDiagnostics(this).length > 0) {
                return { diagnostics: [], sourceMaps: undefined, emitSkipped: true };
            }
            // Create the emit resolver outside of the "emitTime" tracking code below.  That way
            // any cost associated with it (like type checking) are appropriate associated with
            // the type-checking counter.
            //
            // If the -out option is specified, we should not pass the source file to getEmitResolver.
            // This is because in the -out scenario all files need to be emitted, and therefore all
            // files need to be type checked. And the way to specify that all files need to be type
            // checked is to not pass the file to getEmitResolver.
            var emitResolver = getDiagnosticsProducingTypeChecker().getEmitResolver(options.out ? undefined : sourceFile);
            var start = new Date().getTime();
            var emitResult = ts.emitFiles(emitResolver, getEmitHost(writeFileCallback), sourceFile);
            ts.emitTime += new Date().getTime() - start;
            return emitResult;
        }
        function getSourceFile(fileName) {
            return filesByName.get(fileName);
        }
        function getDiagnosticsHelper(sourceFile, getDiagnostics) {
            if (sourceFile) {
                return getDiagnostics(sourceFile);
            }
            var allDiagnostics = [];
            ts.forEach(program.getSourceFiles(), function (sourceFile) {
                ts.addRange(allDiagnostics, getDiagnostics(sourceFile));
            });
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function getSyntacticDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getSyntacticDiagnosticsForFile);
        }
        function getSemanticDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getSemanticDiagnosticsForFile);
        }
        function getDeclarationDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getDeclarationDiagnosticsForFile);
        }
        function getSyntacticDiagnosticsForFile(sourceFile) {
            return sourceFile.parseDiagnostics;
        }
        function getSemanticDiagnosticsForFile(sourceFile) {
            var typeChecker = getDiagnosticsProducingTypeChecker();
            ts.Debug.assert(!!sourceFile.bindDiagnostics);
            var bindDiagnostics = sourceFile.bindDiagnostics;
            var checkDiagnostics = typeChecker.getDiagnostics(sourceFile);
            var programDiagnostics = diagnostics.getDiagnostics(sourceFile.fileName);
            return bindDiagnostics.concat(checkDiagnostics).concat(programDiagnostics);
        }
        function getDeclarationDiagnosticsForFile(sourceFile) {
            if (!ts.isDeclarationFile(sourceFile)) {
                var resolver = getDiagnosticsProducingTypeChecker().getEmitResolver(sourceFile);
                // Don't actually write any files since we're just getting diagnostics.
                var writeFile = function () { };
                return ts.getDeclarationDiagnostics(getEmitHost(writeFile), resolver, sourceFile);
            }
        }
        function getOptionsDiagnostics() {
            var allDiagnostics = [];
            ts.addRange(allDiagnostics, diagnostics.getGlobalDiagnostics());
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function getGlobalDiagnostics() {
            var allDiagnostics = [];
            ts.addRange(allDiagnostics, getDiagnosticsProducingTypeChecker().getGlobalDiagnostics());
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function hasExtension(fileName) {
            return ts.getBaseFileName(fileName).indexOf(".") >= 0;
        }
        function processRootFile(fileName, isDefaultLib) {
            processSourceFile(ts.normalizePath(fileName), isDefaultLib);
        }
        function processSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd) {
            var start;
            var length;
            var diagnosticArgument;
            if (refEnd !== undefined && refPos !== undefined) {
                start = refPos;
                length = refEnd - refPos;
            }
            var diagnostic;
            if (hasExtension(fileName)) {
                if (!options.allowNonTsExtensions && !ts.forEach(ts.supportedExtensions, function (extension) { return ts.fileExtensionIs(host.getCanonicalFileName(fileName), extension); })) {
                    diagnostic = ts.Diagnostics.File_0_has_unsupported_extension_The_only_supported_extensions_are_1;
                    diagnosticArgument = [fileName, "'" + ts.supportedExtensions.join("', '") + "'"];
                }
                else if (!findSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd)) {
                    diagnostic = ts.Diagnostics.File_0_not_found;
                    diagnosticArgument = [fileName];
                }
                else if (refFile && host.getCanonicalFileName(fileName) === host.getCanonicalFileName(refFile.fileName)) {
                    diagnostic = ts.Diagnostics.A_file_cannot_have_a_reference_to_itself;
                    diagnosticArgument = [fileName];
                }
            }
            else {
                var nonTsFile = options.allowNonTsExtensions && findSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd);
                if (!nonTsFile) {
                    if (options.allowNonTsExtensions) {
                        diagnostic = ts.Diagnostics.File_0_not_found;
                        diagnosticArgument = [fileName];
                    }
                    else if (!ts.forEach(ts.supportedExtensions, function (extension) { return findSourceFile(fileName + extension, isDefaultLib, refFile, refPos, refEnd); })) {
                        diagnostic = ts.Diagnostics.File_0_not_found;
                        fileName += ".ts";
                        diagnosticArgument = [fileName];
                    }
                }
            }
            if (diagnostic) {
                if (refFile) {
                    diagnostics.add(ts.createFileDiagnostic.apply(void 0, [refFile, start, length, diagnostic].concat(diagnosticArgument)));
                }
                else {
                    diagnostics.add(ts.createCompilerDiagnostic.apply(void 0, [diagnostic].concat(diagnosticArgument)));
                }
            }
        }
        // Get source file from normalized fileName
        function findSourceFile(fileName, isDefaultLib, refFile, refStart, refLength) {
            var canonicalName = host.getCanonicalFileName(ts.normalizeSlashes(fileName));
            if (filesByName.contains(canonicalName)) {
                // We've already looked for this file, use cached result
                return getSourceFileFromCache(fileName, canonicalName, false);
            }
            else {
                var normalizedAbsolutePath = ts.getNormalizedAbsolutePath(fileName, host.getCurrentDirectory());
                var canonicalAbsolutePath = host.getCanonicalFileName(normalizedAbsolutePath);
                if (filesByName.contains(canonicalAbsolutePath)) {
                    return getSourceFileFromCache(normalizedAbsolutePath, canonicalAbsolutePath, true);
                }
                // We haven't looked for this file, do so now and cache result
                var file = host.getSourceFile(fileName, options.target, function (hostErrorMessage) {
                    if (refFile) {
                        diagnostics.add(ts.createFileDiagnostic(refFile, refStart, refLength, ts.Diagnostics.Cannot_read_file_0_Colon_1, fileName, hostErrorMessage));
                    }
                    else {
                        diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_read_file_0_Colon_1, fileName, hostErrorMessage));
                    }
                });
                filesByName.set(canonicalName, file);
                if (file) {
                    skipDefaultLib = skipDefaultLib || file.hasNoDefaultLib;
                    // Set the source file for normalized absolute path
                    filesByName.set(canonicalAbsolutePath, file);
                    if (!options.noResolve) {
                        var basePath = ts.getDirectoryPath(fileName);
                        processReferencedFiles(file, basePath);
                        processImportedModules(file, basePath);
                    }
                    if (isDefaultLib) {
                        file.isDefaultLib = true;
                        files.unshift(file);
                    }
                    else {
                        files.push(file);
                    }
                }
                return file;
            }
            function getSourceFileFromCache(fileName, canonicalName, useAbsolutePath) {
                var file = filesByName.get(canonicalName);
                if (file && host.useCaseSensitiveFileNames()) {
                    var sourceFileName = useAbsolutePath ? ts.getNormalizedAbsolutePath(file.fileName, host.getCurrentDirectory()) : file.fileName;
                    if (canonicalName !== sourceFileName) {
                        diagnostics.add(ts.createFileDiagnostic(refFile, refStart, refLength, ts.Diagnostics.File_name_0_differs_from_already_included_file_name_1_only_in_casing, fileName, sourceFileName));
                    }
                }
                return file;
            }
        }
        function processReferencedFiles(file, basePath) {
            ts.forEach(file.referencedFiles, function (ref) {
                var referencedFileName = ts.isRootedDiskPath(ref.fileName) ? ref.fileName : ts.combinePaths(basePath, ref.fileName);
                processSourceFile(ts.normalizePath(referencedFileName), false, file, ref.pos, ref.end);
            });
        }
        function processImportedModules(file, basePath) {
            ts.forEach(file.statements, function (node) {
                if (node.kind === 217 /* ImportDeclaration */ || node.kind === 216 /* ImportEqualsDeclaration */ || node.kind === 223 /* ExportDeclaration */) {
                    var moduleNameExpr = ts.getExternalModuleName(node);
                    if (moduleNameExpr && moduleNameExpr.kind === 8 /* StringLiteral */) {
                        var moduleNameText = moduleNameExpr.text;
                        if (moduleNameText) {
                            var searchPath = basePath;
                            var searchName;
                            while (true) {
                                searchName = ts.normalizePath(ts.combinePaths(searchPath, moduleNameText));
                                if (ts.forEach(ts.supportedExtensions, function (extension) { return findModuleSourceFile(searchName + extension, moduleNameExpr); })) {
                                    break;
                                }
                                var parentPath = ts.getDirectoryPath(searchPath);
                                if (parentPath === searchPath) {
                                    break;
                                }
                                searchPath = parentPath;
                            }
                        }
                    }
                }
                else if (node.kind === 213 /* ModuleDeclaration */ && node.name.kind === 8 /* StringLiteral */ && (node.flags & 2 /* Ambient */ || ts.isDeclarationFile(file))) {
                    // TypeScript 1.0 spec (April 2014): 12.1.6
                    // An AmbientExternalModuleDeclaration declares an external module. 
                    // This type of declaration is permitted only in the global module.
                    // The StringLiteral must specify a top - level external module name.
                    // Relative external module names are not permitted
                    ts.forEachChild(node.body, function (node) {
                        if (ts.isExternalModuleImportEqualsDeclaration(node) &&
                            ts.getExternalModuleImportEqualsDeclarationExpression(node).kind === 8 /* StringLiteral */) {
                            var nameLiteral = ts.getExternalModuleImportEqualsDeclarationExpression(node);
                            var moduleName = nameLiteral.text;
                            if (moduleName) {
                                // TypeScript 1.0 spec (April 2014): 12.1.6
                                // An ExternalImportDeclaration in anAmbientExternalModuleDeclaration may reference other external modules 
                                // only through top - level external module names. Relative external module names are not permitted.
                                var searchName = ts.normalizePath(ts.combinePaths(basePath, moduleName));
                                ts.forEach(ts.supportedExtensions, function (extension) { return findModuleSourceFile(searchName + extension, nameLiteral); });
                            }
                        }
                    });
                }
            });
            function findModuleSourceFile(fileName, nameLiteral) {
                return findSourceFile(fileName, false, file, nameLiteral.pos, nameLiteral.end - nameLiteral.pos);
            }
        }
        function computeCommonSourceDirectory(sourceFiles) {
            var commonPathComponents;
            var currentDirectory = host.getCurrentDirectory();
            ts.forEach(files, function (sourceFile) {
                // Each file contributes into common source file path
                if (ts.isDeclarationFile(sourceFile)) {
                    return;
                }
                var sourcePathComponents = ts.getNormalizedPathComponents(sourceFile.fileName, currentDirectory);
                sourcePathComponents.pop(); // The base file name is not part of the common directory path
                if (!commonPathComponents) {
                    // first file
                    commonPathComponents = sourcePathComponents;
                    return;
                }
                for (var i = 0, n = Math.min(commonPathComponents.length, sourcePathComponents.length); i < n; i++) {
                    if (commonPathComponents[i] !== sourcePathComponents[i]) {
                        if (i === 0) {
                            diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_find_the_common_subdirectory_path_for_the_input_files));
                            return;
                        }
                        // New common path found that is 0 -> i-1
                        commonPathComponents.length = i;
                        break;
                    }
                }
                // If the sourcePathComponents was shorter than the commonPathComponents, truncate to the sourcePathComponents
                if (sourcePathComponents.length < commonPathComponents.length) {
                    commonPathComponents.length = sourcePathComponents.length;
                }
            });
            return ts.getNormalizedPathFromPathComponents(commonPathComponents);
        }
        function checkSourceFilesBelongToPath(sourceFiles, rootDirectory) {
            var allFilesBelongToPath = true;
            if (sourceFiles) {
                var currentDirectory = host.getCurrentDirectory();
                var absoluteRootDirectoryPath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(rootDirectory, currentDirectory));
                for (var _i = 0; _i < sourceFiles.length; _i++) {
                    var sourceFile = sourceFiles[_i];
                    if (!ts.isDeclarationFile(sourceFile)) {
                        var absoluteSourceFilePath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(sourceFile.fileName, currentDirectory));
                        if (absoluteSourceFilePath.indexOf(absoluteRootDirectoryPath) !== 0) {
                            diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.File_0_is_not_under_rootDir_1_rootDir_is_expected_to_contain_all_source_files, sourceFile.fileName, options.rootDir));
                            allFilesBelongToPath = false;
                        }
                    }
                }
            }
            return allFilesBelongToPath;
        }
        function verifyCompilerOptions() {
            if (options.isolatedModules) {
                if (options.sourceMap) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceMap_cannot_be_specified_with_option_isolatedModules));
                }
                if (options.declaration) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_declaration_cannot_be_specified_with_option_isolatedModules));
                }
                if (options.noEmitOnError) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmitOnError_cannot_be_specified_with_option_isolatedModules));
                }
                if (options.out) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_out_cannot_be_specified_with_option_isolatedModules));
                }
            }
            if (options.inlineSourceMap) {
                if (options.sourceMap) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceMap_cannot_be_specified_with_option_inlineSourceMap));
                }
                if (options.mapRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_mapRoot_cannot_be_specified_with_option_inlineSourceMap));
                }
                if (options.sourceRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceRoot_cannot_be_specified_with_option_inlineSourceMap));
                }
            }
            if (options.inlineSources) {
                if (!options.sourceMap && !options.inlineSourceMap) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_inlineSources_can_only_be_used_when_either_option_inlineSourceMap_or_option_sourceMap_is_provided));
                }
            }
            if (!options.sourceMap && (options.mapRoot || options.sourceRoot)) {
                // Error to specify --mapRoot or --sourceRoot without mapSourceFiles
                if (options.mapRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_mapRoot_cannot_be_specified_without_specifying_sourceMap_option));
                }
                if (options.sourceRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceRoot_cannot_be_specified_without_specifying_sourceMap_option));
                }
                return;
            }
            var languageVersion = options.target || 0 /* ES3 */;
            var firstExternalModuleSourceFile = ts.forEach(files, function (f) { return ts.isExternalModule(f) ? f : undefined; });
            if (options.isolatedModules) {
                if (!options.module && languageVersion < 2 /* ES6 */) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_isolatedModules_can_only_be_used_when_either_option_module_is_provided_or_option_target_is_ES6_or_higher));
                }
                var firstNonExternalModuleSourceFile = ts.forEach(files, function (f) { return !ts.isExternalModule(f) && !ts.isDeclarationFile(f) ? f : undefined; });
                if (firstNonExternalModuleSourceFile) {
                    var span = ts.getErrorSpanForNode(firstNonExternalModuleSourceFile, firstNonExternalModuleSourceFile);
                    diagnostics.add(ts.createFileDiagnostic(firstNonExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_compile_namespaces_when_the_isolatedModules_flag_is_provided));
                }
            }
            else if (firstExternalModuleSourceFile && languageVersion < 2 /* ES6 */ && !options.module) {
                // We cannot use createDiagnosticFromNode because nodes do not have parents yet 
                var span = ts.getErrorSpanForNode(firstExternalModuleSourceFile, firstExternalModuleSourceFile.externalModuleIndicator);
                diagnostics.add(ts.createFileDiagnostic(firstExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_compile_modules_unless_the_module_flag_is_provided));
            }
            // Cannot specify module gen target when in es6 or above
            if (options.module && languageVersion >= 2 /* ES6 */) {
                diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_compile_modules_into_commonjs_amd_system_or_umd_when_targeting_ES6_or_higher));
            }
            // there has to be common source directory if user specified --outdir || --sourceRoot
            // if user specified --mapRoot, there needs to be common source directory if there would be multiple files being emitted
            if (options.outDir ||
                options.sourceRoot ||
                (options.mapRoot &&
                    (!options.out || firstExternalModuleSourceFile !== undefined))) {
                if (options.rootDir && checkSourceFilesBelongToPath(files, options.rootDir)) {
                    // If a rootDir is specified and is valid use it as the commonSourceDirectory
                    commonSourceDirectory = ts.getNormalizedAbsolutePath(options.rootDir, host.getCurrentDirectory());
                }
                else {
                    // Compute the commonSourceDirectory from the input files
                    commonSourceDirectory = computeCommonSourceDirectory(files);
                }
                if (commonSourceDirectory && commonSourceDirectory[commonSourceDirectory.length - 1] !== ts.directorySeparator) {
                    // Make sure directory path ends with directory separator so this string can directly 
                    // used to replace with "" to get the relative path of the source file and the relative path doesn't
                    // start with / making it rooted path
                    commonSourceDirectory += ts.directorySeparator;
                }
            }
            if (options.noEmit) {
                if (options.out || options.outDir) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmit_cannot_be_specified_with_option_out_or_outDir));
                }
                if (options.declaration) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmit_cannot_be_specified_with_option_declaration));
                }
            }
            if (options.emitDecoratorMetadata &&
                !options.experimentalDecorators) {
                diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_experimentalDecorators_must_also_be_specified_when_option_emitDecoratorMetadata_is_specified));
            }
            if (options.experimentalAsyncFunctions &&
                options.target !== 2 /* ES6 */) {
                diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_experimentalAsyncFunctions_cannot_be_specified_when_targeting_ES5_or_lower));
            }
        }
    }
    ts.createProgram = createProgram;
})(ts || (ts = {}));
