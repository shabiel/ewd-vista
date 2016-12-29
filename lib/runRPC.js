/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-vistarpc: VistA RPC Interface for use with ewd-qoper8         |
 |                                                                          |
 | Copyright (c) 2016 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

 21 April 2016

*/

function runRPC(params, session, manageSymbolTable) {
  var rpcName = params.rpcName;

  if (typeof manageSymbolTable === 'undefined') manageSymbolTable = true;

  console.log('vistarpc.runRPC: ' + JSON.stringify(params));

  var data;
  var context = '';

  if (params.context) context = params.context;

  var tmpGlo = new this.documentStore.DocumentNode('TMP');
  tmpGlo.$('XQCS').$(process.pid).delete();
  
  var gloRef = tmpGlo.$(process.pid);
  // **** essential - must clear down the temporary global first:
  gloRef.delete();

  var flags = {};
  var rpcArgs = params.rpcArgs || [];

  if (!Array.isArray(rpcArgs)) {
    flags = rpcArgs.flags || {};
    rpcArgs = rpcArgs.inputs || [];
  }

  data = {
    name : rpcName,
    input: rpcArgs
  };
  if (manageSymbolTable) ok = this.db.symbolTable.restore(session);

  gloRef.setDocument(data, true, 1);
  //console.log('**** data = ' + JSON.stringify(data));

  var id = '';
  var documentName = '';
  if (session && session.id) {
    id = session.id;
    documentName = session.documentName;
  }

  var status = this.db.function({
    function: 'RPCEXECUTE^ewdVistARPC', 
    arguments: ['^TMP(' + process.pid + ')', id, documentName]
  });
  if (manageSymbolTable) {
    // Save the VistA symbol table
    ok = this.db.symbolTable.save(session);
    // clean up the back-end Cache/GT.M process:
    ok = this.db.symbolTable.clear();
  }

  console.log('***** status = ' + JSON.stringify(status));
  if (!status) return {
    error: 'Mumps wrapper function ewdVistARPC crashed'
  };

  if (status.ErrorMessage) {
    return {
      error: status.ErrorMessage
    };
  }
  if (status.result === 'ERROR') {
    var execResult = gloRef.$('RPCEXECUTE').$('result').value;
    var pieces = execResult.split('^');
    return {
      error: pieces[1]
    };
  }
  if (gloRef.$('ERRORTRAP').exists) {
    var subs = gloRef.$('ERRORTRAP').getDocument();
    if (session) {
      session.data.$('ERRORTRAP').delete();
      session.data.$('ERRORTRAP').setDocument(subs);
    }
    return {
      error: 'A run-time error occurred and has been trapped. Use the errorReport RPC for details'
    };
  }
  else {
    var resultsNode = gloRef.$('result');
    var results = resultsNode.getDocument(true);
    
    console.log('results array: ');
    console.log(results);



    if (results.type !== 'GLOBAL ARRAY' && params.format === 'raw') {
      return results;
    }
    /* SMH: Had to add the typeof thing b/c this crashed on numeric returns (don't have indexOf) */
    else {
      if (results.type === 'SINGLE VALUE') {
        if (results.value && typeof results.value === 'string' && results.value.indexOf('^') !== -1) {
          var arr = results.value.split('^');
          results.value = arr;
        }
      }

      if (results.type === 'GLOBAL ARRAY') {
        var node = convGRef2NRef.call(this, results.value);
        results.value = node.getDocument();
      }

      if (this.vistARPC && this.vistARPC.cleardown && this.vistARPC.cleardown[rpcName]) {
        var subList = this.vistARPC.cleardown[rpcName];
        for (var i = 0; i < subList.length; i++) {
          tmpGlo.$(subList[i]).$(process.pid).delete();
        }
      }

      if (!params.hasOwnProperty('deleteGlobal') || params.deleteGlobal) { // if we didn't set flag or if it's set true
        gloRef.delete();
      }
    }
    
    return results;
  }
}

/* Convert a global reference like ^TMP("XQ2",$J) to a node that EWD3 understands */
function convGRef2NRef(gloRef)
{
  //Remove leading ^
  if (gloRef.charAt(0) === '^')
  {
    gloRef = gloRef.slice(1, gloRef.length);
  }
  
  // Read till next (
  var paren1 = gloRef.indexOf('(');
  var Name;
  if (paren1 < 0) return (new this.documentStore.DocumentNode(gloRef));
  else
  {
    Name = gloRef.substr(0, paren1);
  }

  // Read all comma pieces
  // TODO: Exclude commas inside of strings
  var paren2 = gloRef.lastIndexOf(')');
  var subscripts = gloRef.slice(paren1+1,paren2).split(',');
  var fixedSubscripts = subscripts.map(function(s) {
    if (s.charAt(0) === '"' && s.charAt(s.length-1) === '"') s = s.slice(1,-1);
    return s;
  });
  
  return (new this.documentStore.DocumentNode(Name, fixedSubscripts));
}

module.exports = runRPC;

