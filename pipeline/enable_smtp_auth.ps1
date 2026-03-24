# Включает Authenticated SMTP для ящика (после того как модуль Exchange установлен).
# Запуск из корня репо или из pipeline/:
#   pwsh pipeline/enable_smtp_auth.ps1
# Откроется вход Microsoft — используй учётку с правами Exchange Admin.

$ErrorActionPreference = "Stop"
Import-Module ExchangeOnlineManagement

$Mailbox = "customer@pixid.studio"

Connect-ExchangeOnline

Set-CASMailbox -Identity $Mailbox -SmtpClientAuthenticationDisabled $false

Write-Host "--- Mailbox $Mailbox ---"
Get-CASMailbox -Identity $Mailbox | Select-Object Name, SmtpClientAuthenticationDisabled

Write-Host "--- Tenant transport (global SMTP AUTH flag) ---"
Get-TransportConfig | Select-Object SmtpClientAuthenticationDisabled

Disconnect-ExchangeOnline -Confirm:$false
Write-Host "Done."
