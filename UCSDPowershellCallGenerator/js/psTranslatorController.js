(function () {
    'use strict'

    angular
       .module('app')
       .controller('psTranslatorController', psTranslatorController);

    psTranslatorController.$inject = ['$location', '$http'];

    /// Powershell Translator Controller
    ///   (C)opyright 2016 Nocturnal Holdings AS
    ///  Written by :
    ///    Darren R. Starr (darren at nocturnal dot no)
    ///  
    /// This module is used by the powershell to UCS Director transation platform.
    /// It is designed to parse header information added to a PowerShell script
    /// to identify inputs and outputs as used by Cisco UCS Director Custom scripts.
    /// It then performs template style replacement in the JavaScript boiler plate
    /// and pushes information to and from the Powershell agent included with
    /// Cisco UCS.
    ///
    /// See the documentation on the doc.html for more information.
    function psTranslatorController($location, $http) {
        var vm = this;

        vm.ucsdExecutePowershellCommand = '';
        vm.powershellJsonPegParser = '';
        vm.powershellHeaderParser = null;

        vm.psEditor = null;
        vm.jsEditor = null;

        /// Consumes a line of Powershell and converts it to a Javascript string
        ///  @param str The input string, a line of Powershell text to be consumed and escaped
        ///  @return the newly formatted string.
        vm.quoteLine = function (str) {
            var out = '';
            for (var i = 0; i < str.length; i++) {
                switch (str[i]) {
                    case "\t":
                        out += '\\t';
                        break;
                    case "\"":
                        out += '\\"';
                        break;
                    case "\\":
                        out += "\\\\";
                        break;
                    default:
                        out += str[i];
                        break;
                }
            }
            return out;
        };

        /// Looks up a value by name within the given array and returns the value or '{{notfound}}'
        ///  @param name The name to find within the array
        ///  @param substitutions An array of objects containing a field called name and another called value
        ///  @return Either the value found or the string '{{notfound}}'
        vm.lookupSubstitution = function (name, substitutions) {
            for (var i = 0; i < substitutions.length; i++) {
                if (substitutions[i].name == name) {
                    return substitutions[i].value;
                }
            }
            return '{{notfound}}';
        };

        /// Processes text to identify variables stored within double braces and replaces the referenced
        ///     variables with their values
        /// @param src The source text to find variable references within
        /// @param variables a list of variables stored as an array of objects each containing a member named 'name' and another named 'value'
        /// @return the processed text with the substitutions or '{{notfound}}' in their place
        vm.processSubstitutions = function (src, variables) {
            var substMatcher = new RegExp('{{([^}]+)}}');

            var out = '';

            var remaining = src;
            while (remaining.length > 0) {
                var matches = substMatcher.exec(remaining);
                var part = '';
                if (matches) {
                    part = remaining.substring(0, matches.index);
                    part += vm.lookupSubstitution(matches[1], variables);
                    remaining = remaining.substring(matches.index + matches[0].length);
                } else {
                    part = remaining;
                    remaining = '';
                }
                out += part;
            }

            return out;
        };

        /// Creates JavaScript to produce Powershell that maps input variables from UCSD to Powershell
        /// 
        /// The input values consumed from the UCSD script definition are referenced as members of the class input.
        /// The class generated within Powershell to provide access to these values is called '$inputs'.
        /// $inputs contains a value for each input variable to be passed.
        ///  @param inputVariables The input variables parsed from the Powershell script header
        ///  @return Powershell script formatted as a Javascript string containing the $inputs class
        vm.formatHeaderInputVariables = function (inputVariables) {
            var out = "  \"$inputs = @{\\n\" +\n";

            for (var i = 0; i < inputVariables.length; i++) {
                out += "  \"    '" + inputVariables[i].psName + "' = '\" + input." + inputVariables[i].ucsName + " + \"'\\n\" +\n";
            }

            out += "  \"}\\n\" +\n";

            return out;
        };

        /// Produces JavaScript to extract values passed from a Powershell script as a return value into UCSD output values
        ///
        /// The Powershell script is responsible for returning values in a format that contained within a structure that
        /// is received as JSON. The structure must contain a field called "outputs". This function uses the outputVariables
        /// list provided within the Powershell header to check for the presence of the output value and to copy the output
        /// value from the JSON to the UCS Director provided 'output' structure which is generated by using the GUI
        /// during function declaration.
        ///  @param outputVariables The list of output variables expected from the Powershell script.
        ///  @return JavaScript code that can copy the output variables from Powershell to UCS Director.
        vm.formatHeaderOutputvariables = function (outputVariables) {
            var out = '';

            for (var i = 0; i < outputVariables.length; i++) {
                out += "if (!psResult['outputs'].hasOwnProperty('";
                out += outputVariables[i].psName;
                out += "')) {\n";
                out += "\tthrow \"Attempting to extract Outputs.";
                out += outputVariables[i].psName;
                out += " from Powershell result. It does not exist.\";\n";
                out += "}\n\n";

                out += 'logger.addDebug("Outputs.';
                out += outputVariables[i].psName;
                out += ' = " + psResult[\'outputs\'].';
                out += outputVariables[i].psName;
                out += ');\n';

                out += 'output.';
                out += outputVariables[i].ucsName;
                out += ' = psResult[\'outputs\'].';
                out += outputVariables[i].psName;
                out += ';\n\n';
            }

            return out;
        };

        /// Called as an event when the contents of the Powershell script editor is altered.
        ///
        /// This function is responsible for processing the input data, substituting macros within the Javascript and
        /// extracting variable information from the header of the given Powershell script.
        vm.psEditorChanged = function () {
            var rawScript = vm.psEditor.getValue();
            var headerVariables = null;
            if (vm.powershellHeaderParser == null) {
                vm.jsEditor.setValue("Error : Powershell header parser not loaded");
                return;
            }
            try {
                headerVariables = vm.powershellHeaderParser.parse(rawScript);
            } catch (e) {
                vm.jsEditor.setValue(e.location.start.line.toString() + ":" + e.location.start.column.toString() + " - " + e.message);
                return;
            }

            var psHeader = vm.formatHeaderInputVariables(headerVariables.inputs);
            var outputs = vm.formatHeaderOutputvariables(headerVariables.outputs);

            var powershellScript = psHeader;
            var lines = rawScript.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = vm.quoteLine(lines[i]);
                if (i < lines.length - 1) {
                    powershellScript += "  \"" + line + "\\n\" + \n";
                } else {
                    powershellScript += "  \"" + line + "\";\n";
                }
            }

            var jsSubstitutions = [
                { 'name': 'PowershellScript', 'value': powershellScript },
                { 'name': 'JsonParser', 'value': vm.powershellJsonPegParser },
                { 'name': 'Outputs', 'value': outputs }
            ];
            for (var i = 0; i < headerVariables.macros.length; i++) {
                jsSubstitutions.push(headerVariables.macros[i]);
            }

            var out = vm.processSubstitutions(vm.ucsdExecutePowershellCommand, jsSubstitutions);

            vm.jsEditor.setValue(out);

            return;
        };

        /// Compiles the JSON data parser once it has been downloaded.
        ///  @param src The source code of the JSON header parser.
        vm.compileJsonParser = function (src) {
            try {
                vm.powershellJsonPegParser = "var jsonParser = " + PEG.buildParser(src, { output: "source", optimize: "size" });
            } catch (e) {
                vm.jsEditor.setValue("Failed to compile the JSON data parser");
            }
        };

        /// Compiles the Powershell header parser once it has been downloaded
        ///  @param src The source code of the Powershell header parser.
        vm.compilePowershellHeaderParser = function (src) {
            try {
                vm.powershellHeaderParser = PEG.buildParser(src);
            } catch (e) {
                vm.jsEditor.setValue("Failed to compile the Powershell header parser");
            }
        };

        /// Initialize the text areas within the document to be source code editors
        vm.initializeEditorViews = function () {
            vm.psEditor = CodeMirror.fromTextArea($('#SourceEditor')[0], {
                mode: "powershell",
                lineNumbers: true,
                indentUnit: 4,
                tabMode: "shift",
                matchBrackets: true
            });

            vm.psEditor.on('change', vm.psEditorChanged);

            vm.jsEditor = CodeMirror.fromTextArea($('#GeneratedEditor')[0], {
                mode: "javascript",
                lineNumbers: true,
                matchBrackets: true,
                continueComments: "Enter",
                extraKeys: { "Ctrl-Q": "toggleComment" }
            });
        };

        /// Download the template files and parser source code for processing the Powershell scripts
        vm.downloadTemplates = function () {
            // Download the template to be used for creating the resulting CloupiaScript
            $http.get("js/templates/ucsdExecutePowershellCommand.js")
                .then(function successCallback(response) {
                    vm.ucsdExecutePowershellCommand = response.data;
                }, function errorCallback(response) {
                    vm.jsEditor = "Failed to download - ucsdExecutePowershellCommand.js :" + response.statusText;
                });

            // Download the source for the parser used within the output script for parsing JSON from UCS Director
            $http.get("js/templates/parserSource/jsonParser.peg.js")
                .then(function successCallback(response) {
                    vm.compileJsonParser(response.data);
                }, function errorCallback(response) {
                    vm.jsEditor = "Failed to download - jsonParser.peg.js :" + response.statusText;
                });

            // Download the source for the parser for extracting bits from the Powerscript script's header
            $http.get("js/templates/parserSource/ucsPowershellHeaderParser.peg.js")
                .then(function successCallback(response) {
                    vm.compilePowershellHeaderParser(response.data);
                }, function errorCallback(response) {
                    vm.jsEditor = "Failed to download - ucsPowershellHeaderParser.peg.js :" +  response.statusText;
                });

        };

        function activate() {
            vm.initializeEditorViews();
            vm.downloadTemplates();
        };


        activate();
    }
})();
