## <span class="label label-info">Documentation</span>

### Powershell to UCS Director Cloupia Script converter for use with UCS Director Custom Workflow Tasks

UCS Director contains a tool for calling Powershell through a "Powershell Agent". For extremely simple tasks this tool is suitable. But for more advanced tasks which require better handling of input and output data as well as error management, the prebuilt task for executing Powershell scripts within the Windows infrastructure, Cloupiascript is better suited.

This tool is work in progress and extends Powershell through comments placed at the top of a Powershell script to permit the developer to have a single file that can be used for generating all the code necessary to execute Powershell on UCS Director and map input and output variables from the "custom workflow task" declaration.

By specially coding comments at the start of a script, there are three classes of values that can be defined.

*   Input variables passed as part of the UCSD _input_ structure as members
*   Output variables to be returned by Powershell and mapped to UCSD _output_ class member variables
*   Variable substitutions to be used to invoke the Powershell script such as what machine to run the script on.

Given the following as an example :

<pre>##{
### Execute Powershell Options
##    SubtaskLabel = "Create Machine Name"
##    PowershellAgent = "Development"
##    TargetIP = "1.2.3.4"
##    Username = "Administrator"
##    Password = "MaryHadALittleLambForDinner"
##    Domain = "MyAwesomeWindowsDomain"
### Inputs
##    optimizedApplicationName -> OptimizedApplicationName
##    siteName -> SiteName
##    domain -> Domain
##    adJoinAccount -> ADJoinAccount
##    zone -> Zone
##    subZone -> Subzone
### Outputs
##    machineName <- MachineName
##}
</pre>

This language is line oriented and therefore does not allow wrapping to new lines.

#### Comments

Comments are any text which starts with three hash signs "###". They extend to the end of the line and are purely informative and are otherwise ignored.

#### Variables/Macros

Variables are used for substitution within the boiler plate code for producing the output Cloupiascript. Variables are formated as :  

> ## _Name_ = _Value_

**Name** is a literal, this is simply a string of text starting with a letter or underscore (_) and followed by zero or more letters, numbers or underscores. The name is compared (case sensitive) to substitution macros in the boiler plate and the value is placed there.

**Value** can be formatted in two ways.

*   The first is encapsulated within double-quotes "". In this circumstance the resulting subtitution would substitute the value explicitly as written.
*   The second method allows UCSD Custom workflow task input values to be used. In this case the name of the input value is provided without quotes and the name is interpretted as meaning a member of the _input_ class passed by UCSD to the Cloupiascript.

#### Input variables

Input variables are variables passed from the UCS Director _input_ class into the Powershell _$inputs_ structure to be employed by the provided script. The format of an input variable is as follows :

> ## _CloupiascriptName_ -> _PowershellName_

As you can see, the direction of the arrow is referring to the copying from the Cloupiascript variable into the Powershell script variable.

Input variables are stored in a Powershell structure that in this circumstance would look like :

<pre>$inputs = @{
    OptimizedApplicationName = 'PUPPY'
    SiteName = 'USA'
    Domain = 'ENG'
    ADJoinAccount = 'Awesome@user.com'
    Zone = 'Here'
    Subzone = 'CN=poochie,DC=woochie,DC=puddin,DC=pie'
}
</pre>

The input variables are copied in the Cloupiascript from the _input_ class verbatim.

#### Output variables

Output variables provide mappings from Powershell return values that have been specially formatted into the Cloupiascript _output_ class. These values are single values, not arrays.

It is the responsibility of the script writer to properly format a return structure called _$outputs_ to be processed upon return.

The header definition for defining the relation ship is as follows :

> ## _CloupiascriptName_ <- _PowershellName_

As with input variables, the direction of the arror defines the direction for the data to be copied. The directive as above expressly specifies that the values will be extracted from the returned _$outputs_ structure into the Cloupiascript _output_ structure.

#### Format of return structure from Powershell

<pre>$result = @{
    'success' = $true
    'outputs' = @{
        'MachineName' = 'GoodieGoodie'
    }
    'error' = ''
    'log' = ''
}
return $result
</pre>

The result structure must be formatted precisely as seen above. There are four mandatory values to be included.

*   _success_ - specifies whether the Powershell script succeeded.
*   _error_ - provides a means for Powershell to return a meaningful error message back to UCS Director when something goes wrong. Even if there is no error, it is important to define this value as non-null.
*   _log_ - Provides a method of returning a meaningful log message from Powershell. As with _error_ it is important to ensure that this is a non-null value even if unused.
*   _outputs_ - Provides the return values that have been defined in the headers to be mapped to the Cloupiascript/UCS Director _output_ structure.

### Installation

There are a few prerequisites to use this program.

*   [Node.js](https://nodejs.org/en/) which is a command line JavaScript engine based on Googles V8 engine. Simply download and install Node.js
*   [Bower](https://bower.io/) which is a package manager for Node.js. To install this, simply type "**npm install bower**" on the command line once Node.js is installed.
*   [Google Angular.js](https://angularjs.org/), [Twitter Bootstrap](http://getbootstrap.com/), [PEG.js](http://pegjs.org/), [Codemirror](https://codemirror.net/), [jQuery](https://jquery.com/) which are libraries which were used to develop this tool. They can be downloaded simply by typing "**bower install**" from the directory where index.html was downloaded as part of this project.

### Running this program

Simply type "**node server.js**" from the command line where this application was installed. Then point your web browser to "[http://localhost:8080](http://localhost:8080)". Then paste your Powershell code into the left window and the output or errors will be shown in the right window.
