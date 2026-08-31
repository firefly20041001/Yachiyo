; Yachiyo Windows installer (Inno Setup 6)
; Consumes the unpacked electron-builder output (dist/win-unpacked) and
; produces Yachiyo-<version>-setup.exe. APP_VERSION is passed by
; scripts/make-inno-installer.mjs from package.json.

#define MyAppName "Yachiyo"
#define MyAppExeName "Yachiyo.exe"
#define MyAppPublisher "Yachiyo"

#ifndef APP_VERSION
#define APP_VERSION "0.0.0"
#endif

[Setup]
AppId={{E5F37A63-73BE-47A7-81A9-85C3489941DA}}
AppName={#MyAppName}
AppVersion={#APP_VERSION}
AppPublisher={#MyAppPublisher}
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
; Per-user install like the previous NSIS config (no admin required)
PrivilegesRequired=lowest
DefaultDirName={localappdata}\Programs\{#MyAppName}
AllowNoIcons=yes
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=Yachiyo-{#APP_VERSION}-setup
SetupIconFile=icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
#if FileExists(CompilerPath + "\Languages\ChineseSimplified.isl")
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
#endif

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
