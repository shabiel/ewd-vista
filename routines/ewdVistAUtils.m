ewdVistAUtils ; VEN/ARC - VistA utilities ; 4/17/17 7:52pm
 ;
 ; 2016-12-27 ARC: Blah blah
 ;
 quit
 ;
 ;
GetVar(var) ;
 ;ARC;private;test;clean;silent;non-SAC
 ;
 ; If you want to see what's going on, comment these in, and kill ^SAM in Prog Mode (GT.M Only).
 ; N % S %=$I(^SAM)
 ; ZSHOW "V":^SAM(%)
 ;
 quit $$GETV^XWBPRS(var)
 ;
 ;
SetVar(var,val) ;
 ;ARC;private;test;clean;silent;non-SAC
 ;
 set @var=val
 ;
 quit @var
 ;
 ;
KillVar(var) ;
 ;ARC;private;test;clean;silent;non-SAC
 ;
 kill @var
 ;
 quit 1
 ;
 ;
EOR ; End of routine ewdVistAUtils
