/// UCS Director Powershell execution template
/// (C)opyright 2016 Nocturnal Holdings AS

importPackage(java.util);
importPackage(java.lang);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(com.cloupia.lib.util);

function executePowerShellCommand(
    label, // Input 'Label', mandatory=true, mappableTo=
    psAgent, // Input 'PowerShell Agent', mandatory=true, mappableTo=gen_text_input
    targetIPAddress, // Input 'Target Machine IP', mandatory=true, mappableTo=gen_text_input
    targetUserID, // Input 'User ID', mandatory=true, mappableTo=gen_text_input
    targetPassword, // Input 'Password', mandatory=true, mappableTo=password
    targetDomain, // Input 'Domain', mandatory=true, mappableTo=gen_text_input
    targetCommand, // Input 'Commands/Script', mandatory=true, mappableTo=gen_text_input
    rollbackCommand, // Input 'Commands/Rollback Script', mandatory=false, mappableTo=gen_text_input
    outputFormat, // Input 'Output Format', mandatory=false, mappableTo=
    depth, // Input 'Depth', mandatory=false, mappableTo=
    maxWaitTimeMinutes // Input 'Maximum Wait Time', mandatory=false, mappableTo=
) {
    var task = ctxt.createInnerTaskContext("Execute PowerShell Command");
    task.setInput("Label", label);
    task.setInput("PowerShell Agent", psAgent);
    task.setInput("Target Machine IP", targetIPAddress);
    task.setInput("User ID", targetUserID);
    task.setInput("Password", targetPassword);
    task.setInput("Domain", targetDomain);
    task.setInput("Commands/Script", targetCommand);
    task.setInput("Commands/Rollback Script", rollbackCommand);
    task.setInput("Output Format", outputFormat);
    task.setInput("Depth", depth);
    task.setInput("Maximum Wait Time", maxWaitTimeMinutes);

    // Now execute the task. If the task fails, then it will throw an exception
    task.execute();

    // Type of following output: gen_text_input
    return task.getOutput("POWERSHELL_COMMAND_RESULT");
}

{{JsonParser}}

var powershellScript = 
{{PowershellScript}}

try {
    var result = executePowerShellCommand(
        {{SubtaskLabel}},
        {{PowershellAgent}},
        {{TargetIP}},
        {{Username}},
        {{Password}},
        {{Domain}},
        powershellScript,
        '',
        'JSON',
        1,
        5
    );

    logger.addDebug("Powershell returned -> " + result);
} catch(e) {
    logger.addError("Error executing powershell -> " + e.message);
    throw "Powershell failed to execute"
}

var psResult = null;
try {
    psResult = jsonParser.parse(result);
} catch(e) {
    logger.addError("Failed to parse PowerShell results as JSON : " + e.location.start.row.toString() + ":" + e.location.start.column.toString() + " - " + e.message);
    throw "Powershell did not return valid JSON"
}

if (!psResult.hasOwnProperty('success')) {
    throw "Powershell returned invalid data -> Missing 'success'";
}

if (!psResult.hasOwnProperty('error')) {
    throw "Powershell returned invalid data -> Missing 'error'";
}

if (!psResult.hasOwnProperty('log')) {
    throw "Powershell returned invalid data -> Missing 'log'";
}

if (!psResult.hasOwnProperty('outputs')) {
    throw "Powershell returned invalid data -> Missing 'outputs'";
}

logger.addDebug("ps.success = " + psResult['success']);
logger.addDebug("ps.error = " + psResult['error']);
logger.addDebug("ps.log = " + psResult['log']);

if (!psResult['success']) {
    throw "Powershell returned an error -> " + psResult['error'];
} 

{{Outputs}}