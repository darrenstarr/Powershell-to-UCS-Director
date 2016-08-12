##{
### Execute Powershell Options
##    SubtaskLabel = "Create Machine Name"
##    PowershellAgent = "Development"
##    TargetIP = "10.100.10.2"
##    Username = "Administrator"
##    Password = "C1sco12345"
##    Domain = "HNOCTURNAL"
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

# Written by Darren R. Starr <darren@nocturnal.no>

Function CreateMachineName {
    Param(
        [string]
        [ValidateNotNullOrEmpty()]
        $OptimizedApplicationName,

        [string]
        [ValidateNotNullOrEmpty()]
        $SiteName,

        [string]
        [ValidateNotNullOrEmpty()]
        $Domain
    )

    $machineNamePrefix = "{0}-{1}-{2}-" -f $SiteName, $OptimizedApplicationName, $Domain

    $existingNames = Get-ADComputer -Filter ('Name -like "{0}*"' -f $machineNamePrefix) | Select Name | Sort

    $machineName = ""
    for ($i=1; $i -lt 256; $i++) {
        $index = "{0:X2}" -f $i
        $match = $existingNames | Where-Object { $_.Name -like ("*{0}" -f $index) } 
        if ($match -eq $null) {
            $machineName = $machineNamePrefix + $index
            break
        }
    }

    return $machineName 
}

$result = @{
    'success' = $false
    'outputs' = @{
        'MachineName' = ''
    }
    'error' = ''
    'log' = ''
}

Try {
    $result['success'] = $true

    $result['outputs']['MachineName'] = CreateMachineName `
        -OptimizedApplicationName $inputs['OptimizedApplicationName'] `
        -SiteName $inputs['SiteName'] `
        -Domain $inputs['Domain']

} Catch {
    $result['error'] = $_.Exception.Message
}

return $result
