ewdVistAUtils ; VEN/ARC - VistA utilities ; 4/26/17 1:55pm
 ;
GetVar(var) ;
 ; If you want to see what's going on, comment these in, and kill ^SAM in Prog Mode (GT.M Only).
 ; N % S %=$I(^SAM)
 ; ZSHOW "V":^SAM(%)
 ;
 quit $$GETV^XWBPRS(var)
 ;
 ;
SetVar(var,val) ;
 set @var=val
 quit @var
 ;
 ;
KillVar(var) ;
 kill @var
 quit 1
 ;
D(entryref) ; (only for Cache as we use db.procedure on GT.M
 do @entryref
 quit ""
 ;
EOR ; End of routine ewdVistAUtils
