/// Powershell header parser
///  (C)opyright 2016 Nocturnal Holdings AS
///
/// This parser is designed to extract input, output and value variables from the header comments of a 
///   Powershell script in order to allow a single file to be used when developing code for Cisco UCS Director.
///   There is no reason this can't be used for other tools calling Powershell that needs input and output variable
///   mappings as well as information to be used as macros in a boilerplate template for executing the code remotely.

{
    var variables = {
        inputs : [ ],
        outputs : [ ],
        macros : [ ]
    };
    
    var variableLookup = function(name) {
        for(var i=0; i<variables.length; i++) {
            if(variables[i].name == name) {
                return variables[i].value;
            }
        }
        return "<<not found>>";
    };
    
    var addInputVariable = function(ucsName, psName) {
        variables.inputs.push({ ucsName: ucsName, psName: psName });
    };

    var addOutputVariable = function(ucsName, psName) {
        variables.outputs.push({ ucsName: ucsName, psName: psName });
    };
    
    var addMacro = function(name, value) {
        variables.macros.push({ name: name, value: value });
    };
}

Script
	= header:Header ws Body { return variables; }
    
Header 
	= ws HeaderStart vars:Variables HeaderEnd { return vars; }

HeaderStart
	= ws "##{" ws nl 

HeaderEnd
	= ws "##}" ws nl

Variables
	= Variable*
    
Variable
	= InputVariable
    / OutputVariable
    / MacroAssignment
    / Comment
    
InputVariable
	= ws "##" ws ucsName:VariableName ws '->' ws psName:VariableName ws nl { addInputVariable(ucsName, psName); }
    
OutputVariable
	= ws "##" ws ucsName:VariableName ws '<-' ws psName:VariableName ws nl { addOutputVariable(ucsName, psName); }

MacroAssignment
	= ws "##" ws macroName:VariableName ws '=' ws value:StringValue ws nl { addMacro(macroName, '\'' + value + '\''); }
	/ ws "##" ws macroName:VariableName ws '=' ws value:VariableName ws nl { addMacro(macroName, 'input.' + value); }

Comment
    = ws "##" ws nl 
    / ws "###" [^\r\n]* nl

StringValue = 
	'"' value:[^"]* '"' { return value.join(""); }

VariableName
  = first:VariableFirstChar following:VariableFollowingChars? { return following ? first + following : first; }
    
VariableFirstChar = [A-Za-z_]

VariableFollowingChars = chars:[A-Za-z0-9_]+ { return chars.join(""); }

Body
	= chars:.* { return chars.join(""); }

ws = [ \t]*
nl 
	=  "\n"  
    / "\r\n"
