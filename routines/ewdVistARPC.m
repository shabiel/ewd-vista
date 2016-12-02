ewdVistARPC ; EWD.js VistA RPC wrapper function ; 8/16/16 3:19pm
 ;
 ; Modified version of Nikolay Topalov's VistA RPC wrapper function for EWD.js
 ; 
 ;  Main interface function is RPCEXECUTE()
 ;
 ;   Original Copyright notice follows:
 ;;
 ;;	Author: Nikolay Topalov
 ;;
 ;;	Copyright 2014 Nikolay Topalov
 ;;
 ;;	Licensed under the Apache License, Version 2.0 (the "License");
 ;;	you may not use this file except in compliance with the License.
 ;;	You may obtain a copy of the License at
 ;;
 ;;	http://www.apache.org/licenses/LICENSE-2.0
 ;;
 ;;	Unless required by applicable law or agreed to in writing, software
 ;;	distributed under the License is distributed on an "AS IS" BASIS,
 ;;	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ;;	See the License for the specific language governing permissions and
 ;;	limitations under the License.
 ;;
 ;;  Modifications Copyright 2016 M/Gateway Developments Ltd
 ;;   Also Apache 2.0 Licensed
 ;;
 QUIT
 ;
test() 
 s XQY0="OR CPRS GUI CHART"
 s ^TMP($j,"name")="ORWUX SYMTAB"
 s ok=$$RPCEXECUTE("^TMP($j)")
 QUIT ok
 ;
RPCEXECUTE(TMP,sessionId,sessionGlobal) ;
 ;n ix
 ;s ix=$increment(^rob)
 ;m ^rob(ix)=@TMP
 ;s ^robSession(ix,"id")=$g(sessionId)
 ;s ^robSession(ix,"global")=$g(sessionGlobal)
 ; TODO: Get rid of the notion of context. Check RPCs dynamically
 ; against all contexts that the user has.
 ;
 ; Execute an RPC based on paramaters provided in TMP reference global
 ;
 ; Input parameter
 ; ================
 ;
 ; TMP is a reference to a global with nodes. e.g.,  ^TMP($J)
 ;
 ;   ,"name")      NAME (#8994, .01)
 ;   ,"version")   VERSION (#8994, .09)
 ;   ,"use") = L|R
 ;   ,"input",n,"type")   PARAMETER TYPE (#8994.02, #02)
 ;   ,"input",n,"value")  input parameter value
 ;      e.g.
 ;      ,"input",n,"type")="LITERAL"
 ;      ,"input",n,"value")="abc"
 ;
 ;      ,"input",n,"type")="REFERENCE"
 ;      ,"input",n,"value")="^ABC"
 ;
 ;      ,"input",n,"type")="LIST"
 ;      ,"input",n,"value",m1)="list1"
 ;      ,"input",n,"value",m2,k1)="list21"
 ;      ,"input",n,"value",m2,k2)="list22"
 ;         
 ;          where m1, m2, k1, k2 are numbers or strings
 ;     
 ; Output value
 ; ==============
 ; The RPC output is in  @TMP@("result")
 ;  e.g., ,"result","type")="SINGLE VALUE"
 ;                  "value")="Hello World!"
 ;                
 ; Return {"success": result, "message" : message }
 ;    result 1 - success
 ;           0 - error
 ;
 S XWBVER=999 ; Set here; so that XQY0 won't be killed in POST2^XUSRB
 N rpc,pRpc,tArgs,tCnt,tI,tOut,trash,tResult,X
 ;
 S U=$G(U,"^")  ; set default to "^"
 S $ETRAP="D ^%ZTER d errorPointer D UNWIND^%ZTER"
 ;
 S pRpc("name")=$G(@TMP@("name"))
 I pRpc("name")="XUS SIGNON SETUP" d HOME^%ZIS
 i pRpc("name")="XUS AV CODE" d
 . n avcode
 . s avcode=$G(@TMP@("input",1,"value"))
 . s avcode=$$ENCRYP^XUSRB1(avcode)
 . s @TMP@("input",1,"value")=avcode
 i pRpc("name")="XUS CVC" d
 . n cvc s cvc=$G(@TMP@("input",1,"value"))
 . n p1,p2,p3,ep1,ep2,ep3
 . s p1=$p(cvc,U,1),ep1=$$ENCRYP^XUSRB1(p1)
 . s p2=$p(cvc,U,2),ep2=$$ENCRYP^XUSRB1(p2)
 . s p3=$p(cvc,U,3),ep3=$$ENCRYP^XUSRB1(p3)
 . s @TMP@("input",1,"value")=ep1_U_ep2_U_ep3
 i pRpc("name")="XWB CREATE CONTEXT" d
 . n ctx s ctx=$G(@TMP@("input",1,"value"))
 . n ectx s ectx=$$ENCRYP^XUSRB1(ctx)
 . s @TMP@("input",1,"value")=ectx
 ;
 I pRpc("name")["ORWDX SEND",'$D(^TMP($J,"input",5,"value")) S ^TMP($J,"input",5,"value")=""
 Q:pRpc("name")="" $$error(-1,"RPC name is missing")
 ;
 S rpc("ien")=$O(^XWB(8994,"B",pRpc("name"),""))
 Q:'rpc("ien") $$error(-2,"Undefined RPC ["_pRpc("name")_"]")
 ;
 S XWBAPVER=$G(@TMP@("version"))
 S pRpc("use")=$G(@TMP@("use"))
 ;
 S X=$G(^XWB(8994,rpc("ien"),0)) ;e.g., XWB EGCHO STRING^ECHO1^XWBZ1^1^R
 S rpc("routineTag")=$P(X,"^",2)
 S rpc("routineName")=$P(X,"^",3)
 Q:rpc("routineName") $$error(-4,"Undefined routine name for RPC ["_pRpc("name")_"]")
 ;
 ; 1=SINGLE VALUE; 2=ARRAY; 3=WORD PROCESSING; 4=GLOBAL ARRAY; 5=GLOBAL INSTANCE
 S rpc("resultType")=$P(X,"^",4)
 S rpc("resultWrapOn")=$P(X,"^",8)
 ;
 ; is the RPC available?
 D CKRPC^XWBLIB(.tOut,pRpc("name"),pRpc("use"),XWBAPVER)
 Q:'tOut $$error(-3,"RPC ["_pRpc("name")_"] cannot be run at this time.")
 ;
 S X=$$CHKPRMIT(pRpc("name"),$G(DUZ))
 Q:X'="" $$error(-4,"RPC ["_pRpc("name")_"] is not allowed to be run: "_X)
 ;
 S X=$$buildArguments(.tArgs,rpc("ien"),TMP)  ; build RPC arguments list - tArgs
 Q:X<0 $$error($P(X,U),$P(X,U,2)) ; error building arguments list
 ;
 ; now, prepare the arguments for the final call
 ; it is outside of the $$buildArgumets so we can newed the individual parameters
 S (tI,tCnt)=""
 F  S tI=$O(tArgs(tI)) Q:tI=""  F  S tCnt=$O(tArgs(tI,tCnt)) Q:tCnt=""  N @("tA"_tI) X tArgs(tI,tCnt)  ; set/merge actions
 ;
 S X="D "_rpc("routineTag")_"^"_rpc("routineName")_"(.tResult"_$S(tArgs="":"",1:","_tArgs)_")"
 S DIC(0)="" ; JAM 2014/9/5 - some obscure problem with LAYGO^XUA4A7
 ;s ^rob(ix,"X")=X
 ;s ^rob(ix,"tA1")=$g(tA1)
 X X  ; execute the routine
 ;s ^rob(ix,"executed")=""
 M @TMP@("result","value")=tResult
 S @TMP@("result","type")=$$EXTERNAL^DILFD(8994,.04,,rpc("resultType"))
 S trash=$$success()
 Q "OK"
 ;
 ;
isInputRequired(pIEN,pSeqIEN) ; is input RPC parameter is required
 ; pIEN - RPC IEN in file #8994
 ; pSeqIEN - Input parameter IEN in multiple file #8994.02
 ;
 Q $P(^XWB(8994,pIEN,2,pSeqIEN,0),U,4)=1
 ;
buildArguments(out,pIEN,TMP) ;Build RPC argument list
 ;
 ; Return values
 ; =============
 ; Success 1
 ; Error   -n^error message
 ;
 ; out array with arguments
 N count,tCnt,tError,tIEN,tI,tII,tIndexSeq,tParam,tRequired,X
 ;
 S tI=0
 S tII=""
 S tCnt=0
 ;
 K out
 S out=""
 S tError=0
 S tIndexSeq=$D(^XWB(8994,pIEN,2,"PARAMSEQ"))  ; is the cross-reference defined
 S tParam=$S(tIndexSeq:"^XWB(8994,pIEN,2,""PARAMSEQ"")",1:"^XWB(8994,pIEN,2)")
 ;
 S count=0
 F  S tII=$O(@TMP@("input",tII)) Q:('tII)!(tError)  D
 . S count=count+1
 . S tIEN=tII  ; get the IEN of the input parameter
 . I '$D(@TMP@("input",tII,"value")) S out=out_"," Q
 . I $D(@TMP@("input",tII,"value"))=1 D  Q
 . . S out=out_"tA"_tII_","   ; add the argument
 . . I $$UP^XLFSTR($G(@TMP@("input",tII,"type")))="REFERENCE" D
 . . . S tCnt=tCnt+1,out(tII,tCnt)="S tA"_tII_"=@@TMP@(""input"","_tII_",""value"")"  ; set it
 . . . Q
 . . E  S tCnt=tCnt+1,out(tII,tCnt)="S tA"_tII_"=@TMP@(""input"","_tII_",""value"")"  ; set it as action for later
 . . Q
 . ; list/array
 . S out=out_".tA"_tII_","
 . S tCnt=tCnt+1,out(tII,tCnt)="M tA"_tII_"=@TMP@(""input"","_tII_",""value"")"  ; merge it
 . Q
 ;
 Q:tError tError
 S out=$E(out,1,$L(out)-1)
 Q 1
 ;
formatResult(code,message) ; return JSON formatted result
 S ^TMP($J,"RPCEXECUTE","result")=code_U_message
 I code=0 Q "ERROR"
 Q "OK"
 ;Q "{""success"": "_code_", ""message"": """_$S($TR(message," ","")="":"",1:message)_"""}"
 ;
error(code,message) ;
 Q $$formatResult(0,code_" "_message)
 ;
success(code,message) ;
 Q $$formatResult(1,$G(code)_" "_$G(message))
 ;
 ; Is RPC pertmited to run in a context?
CHKPRMIT(pRPCName,DUZ) ;checks to see if remote procedure is permited to run
 ;Input:  pRPCName - Remote procedure to check
 ;        DUZ    - User
 ;        In Symbol Table: XQY0 for the context
 I DUZ Q:$$KCHK^XUSRB("XUPROGMODE",DUZ) ""  ; User has programmer key
 N result,X
 N XQMES
 S U=$G(U,"^")
 S result="" ;Return XWBSEC="" if OK to run RPC
 ;
 ;In the beginning, when no DUZ is defined and no context exist,
 ;setup default signon context
 S:'DUZ DUZ=0,XQY0="XUS SIGNON"   ;set up default context
 ;
 ; If you want to see what's going on, comment these in, and kill ^SAM in Prog Mode (GT.M Only).
 ; N % S %=$I(^SAM)
 ; ZSHOW "V":^SAM(%)
 ;
 ;These RPC's are allowed in any context, so we can just quit
 S X="^XWB IM HERE^XWB CREATE CONTEXT^XWB RPC LIST^XWB IS RPC AVAILABLE^XUS GET USER INFO^XUS GET TOKEN^XUS SET VISITOR^"
 S X=X_"XUS KAAJEE GET USER INFO^XUS KAAJEE LOGOUT^"  ; VistALink RPC's that are always allowed.
 I X[(U_pRPCName_U) Q result
 ;
 ;If in Signon context, only allow XUS and XWB rpc's
 I $G(XQY0)="XUS SIGNON","^XUS^XWB^"'[(U_$E(pRPCName,1,3)_U) Q "Application context has not been created 1!"
 ;XQCS allows all users access to the XUS SIGNON context.
 ;Also to any context in the XUCOMMAND menu.
 ;
 S X=$$CHK^XQCS(DUZ,XQY0,pRPCName)         ;do the check
 S:'X result=X
 Q result
 ;
errorPointer ;
 ; Save the latest error pointer into the ^TMP global
 ;  so that the error details can be recovered later
 n dd,no,rec
 s rec=$g(^%ZTER(1,0))
 s dd=$p(rec,"^",3)
 s rec=$g(^%ZTER(1,dd,0))
 s no=$p(rec,"^",2)
 s ^TMP($j,"ERRORTRAP",0)=1
 s ^TMP($j,"ERRORTRAP",1)=dd
 s ^TMP($j,"ERRORTRAP",2)=1
 s ^TMP($j,"ERRORTRAP",3)=no
 QUIT
