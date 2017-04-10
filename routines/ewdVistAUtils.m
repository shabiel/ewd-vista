ewdVistAUtils	; ARC - VistA utilities ; 2016-12-27T04:05Z
	;;0.0;**LOCAL**;;
	;
	; Primary development: Alexis Carlson (ARC)
	;
	; 2016-12-27 ARC: Blah blah
	;
	quit
	;
	;
GetVar(var)	;
	;ARC;private;test;clean;silent;non-SAC
	;
	; If you want to see what's going on, comment these in, and kill ^SAM in Prog Mode (GT.M Only).
	; N % S %=$I(^SAM)
	; ZSHOW "V":^SAM(%)
	;
	quit $select($get(@var)]"":@var,1:"")
	;
	;
SetVar(var,val)	;
	;ARC;private;test;clean;silent;non-SAC
	;
	set @var=val
	;
	quit @var
	;
	;
KillVar(var)	;
	;ARC;private;test;clean;silent;non-SAC
	;
	kill @var
	;
	quit 1
	;
	;
EOR	; End of routine ewdVistAUtils
