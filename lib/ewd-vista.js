// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

/* Necessary imports */
sessions   = require('ewd-session');
runRPC     = require('ewd-vista/lib/runRPC');
const fs   = require('fs');
const path = require('path');

module.exports = {
  servicesAllowed: {
    // Added dynamically below with addServices()
  },
  handlers: {
    getModules: function() {
      let modulesData = getVistaModules().slice(2);
      
      return modulesData;
    },
    checkDierr: function() {
      let err = '';
      
      let errNode = new this.documentStore.DocumentNode('TMP', ['DIERR', process.pid, 1]);
      if (errNode.exists) {
        err = {
          code: errNode.value,
          msg: errNode.lastChild.firstChild.value
        }
      }
      
      return err;
    },
    convertDilistToArray: function(node) {
      /*
      Calling code should first do something like:
      let node = 
      new this.documentStore.DocumentNode('TMP', ['DILIST', process.pid])
      
      ^TMP('DILIST',1314,0)='3236^*^0^'
      ^TMP('DILIST',1314,0,'MAP')='IEN^IX(1)'
      ^TMP('DILIST',1314,1,0)='1578^ACKQAUD1'
      ^TMP('DILIST',1314,2,0)='1579^ACKQAUD2'
      */
      
      let arrayKey     = node.$('0').$('MAP').value;
      let entriesArray = [];
      
      node.forEachChild(
        {
          range: {
            from: '1',
            to: ''
          }
        }, 
        function(name, ChildNode) {
          entriesArray.push(ChildNode.$('0').value);
        }
      );
      
      let results       = {};
      results[arrayKey] = entriesArray;
      
      return results;
    },
    listDic: function(messageObj, session, send, finished) {
      let query    = messageObj.params.query;
      // Disallow Mumps code from client
      query.screen = '';
      let results  = this.handlers['ewd-vista'].listDicSync.call(this, query);
      
      finished({results: results});
    },
    listDicSync: function(query) {
      /*
      Requires this to be the worker process for the calling module handler:
        let result = this.handlers['ewd-vista'].listDic.call(this, filemanMsg);
      */
      
      // This is for use later when sorting records
      let pointZeroOneField = '';
      
      // Start building final data structure of results
      // TODO Consider converting to formal JSON
      let results = {
        error: '',
        file: {},
        fields: [
          {
            key: 'ien',
            name: 'IEN',
            number: ''
          }
        ],
        records: []
      };
  
      // Add file data to results
      let fileNode = new this.documentStore.DocumentNode('DIC', [query.file.number, '0']);
      let fileName = fileNode.value.split('^')[0];
  
      results.file.number = query.file.number;
      results.file.name   = fileName;
      
      // If the query specifies fields, build the fields parameter for LIST^DIC
      let fieldNums   = [];
      let fieldsParam = '';
      if (query.fields && Array.isArray(query.fields) && query.fields.length) {
        fieldNums   = query.fields.map(x => {return x.number;});
        fieldsParam = '@;' + fieldNums.join(';');
      }
      
      // Submit primary query
      let response = this.db.function({
        function: 'LIST^ewdVistAFileman',
        arguments: [
          query.file.number,
          query.iens || '',
          fieldsParam,
          query.flags || 'PQM',
          query.quantity || '',
          query.stringFrom || '',
          query.stringPart || '',
          query.index || '',
          query.screen || '',
          query.identifier || ''
        ]
      });
      
      let recordsNode = new this.documentStore.DocumentNode('TMP', ['DILIST', process.pid]);
      let recordsData = this.handlers['ewd-vista'].convertDilistToArray(recordsNode);
      /*
        {
          'IEN^IX(1)^FID(1)^FID(28)^WID(W8)': [
            '2005.2^NETWORK LOCATION',
            '4.501^NETWORK SENDERS REJECTED',
            '4.5^NETWORK TRANSACTION',
            '200^NEW PERSON',
            '6920.1^NEW WORK ACTION'
          ]
        }
      */
      let fieldsMap = Object.keys(recordsData)[0];
      
      // Add fields data to results
      // Get field numbers
      if (!fieldNums.length) {
        // Parse fieldsMap & get field numbers from identifiers
        fieldsMap.split('^').slice(1).forEach(function(identifier, index) {
          if (identifier == 'IX(1)' || identifier == '.01I') {
            fieldNums.push('.01');
          }
          else if (identifier.match(/FID\(/)) {
            fieldNums.push(identifier.replace('FID(', '').replace(')', ''));
          }
          else if (identifier.match(/WID\(/)) {
            // These will have a preceding letter, eg, W8
            fieldNums.push(identifier.replace('WID(', '').replace(')', ''));
          }
        });
      }
      // Get field names
      for (let i = 0; i < fieldNums.length; i++) {
        let field = {};
        
        if (parseFloat(fieldNums[i])) {
          let fieldNode = new this.documentStore.DocumentNode('DD', [query.file.number, fieldNums[i], '0']);
          let fieldName = fieldNode.value.split('^')[0];
          let fieldKey  = fieldName.toLowerCase().replace(/ /g, '');
          
          field = {
            number: fieldNums[i],
            name: fieldName,
            key: fieldKey
          };
          
          // Save key of .01 field for sorting records
          if (fieldNums[i] == '.01') {pointZeroOneField = fieldKey;}
        }
        // Cover WID fields, for which we can't use field numbers
        else {
          field = {
            number: '',
            name: '',
            key: fieldNums[i].toLowerCase().replace(/ /g, '')
          };
        }

        results.fields.push(field);
      }
      
      // Add records data to results
      recordsData   = recordsData[fieldsMap];
      
      // If ^TMP("DILIST") doesn't contain results, check ^TMP("DIERR")
      if (recordsData.length) {
        recordsData.forEach(function(recordData) {
          recordData = recordData.split('^');
    
          let record      = {};
          // Use results.fields to dynamically assign pieces of data to properties
          results.fields.forEach(function(field, index) {
            record[field.key] = recordData[index].trim();
          });
    
          results.records.push(record);
        });
        
        // Sort results.records in case multiple indices produce matches.
        // Start by finding key of .01 field
        if (pointZeroOneField) {
          results.records.sort((x, y) => {
            if (x[pointZeroOneField] < y[pointZeroOneField]) {return -1};
            if (x[pointZeroOneField] > y[pointZeroOneField]) {return 1};
            return 0;
          });
        }
      }
      else {
        results.error = this.handlers['ewd-vista'].checkDierr.call(this);
      }
      
      return results;
    }
  }
};

// Grab data about installed VistA modules
function getVistaModules() {
  let cwd         = __dirname;
  let modulesPath = path.join(cwd, '../..'); 

  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];
  
  allModules.forEach(function(module) {
    if (module.match('ewd-vista')) {
      vistaModules.push(module);
    }
  });
  
  let vistaModulesData = [];
  
  vistaModules.forEach(function(module) {
    vistaModulesData.push(require(module + '/package.json').ewdVista);
  });
  vistaModulesData.sort((x,y) => { return x.sortOrder > y.sortOrder; });
    
  return vistaModulesData;
}

// Install Mumps routines and web assets for VistA modules
function installModules() {
  // This module essentially facilitates cp -R
  const ncp = require('ncp').ncp;
  
  // Determine default installation path for GT.M routines
  // TODO Find a solution for Caché & GT.M
  const cp = require('child_process');
  // Returns a string buffer
  let gtmRoutinesPath = cp.execSync("echo `mumps -r ^%XCMD 'W $$RTNDIR^%ZOSV'`");
  gtmRoutinesPath     = gtmRoutinesPath.toString('utf8').trim();
  
  let cwd         = __dirname;
  let qewdPath    = path.join(cwd, '../../..');
  let modulesPath = path.join(cwd, '../..');
  let modules     = getVistaModules();  
    
  modules.forEach(function(module) {
    // Install Mumps routines packaged with modules
    let moduleRoutinesPath = path.join(modulesPath, module.module, 'routines');
    
    if (fs.existsSync(moduleRoutinesPath)) {
      let routines = fs.readdirSync(moduleRoutinesPath);
      
      routines.forEach(function(routine) {
        let sourcePath = path.join(moduleRoutinesPath, routine);
        let targetPath = path.join(gtmRoutinesPath, routine);
        
        fs.createReadStream(sourcePath).pipe(fs.createWriteStream(targetPath));
      });
    }
    
    // Install web assets
    //
    // Only works if the following exist:
    //   ~/qewd/www/ewd-vista/index.html
    //   ~/qewd/www/ewd-vista/assets/javascripts/bundle.js
    let sourcePath = path.join(modulesPath, module.module, 'www');
    let targetPath = path.join(qewdPath, 'www', 'ewd-vista');
    
    let ncpOptions = {
      clobber: true,
      limit: 4
    }
    ncp(sourcePath, targetPath, ncpOptions, function(err) {
      if (err) {
        console.log('NCP Error:');
        console.log(err);
      }
    });    
  }); // End ~ modules.forEach
}
installModules();

// Add services to module exports
function addServices() {
  let modulesData = getVistaModules().slice(1);
  
  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });  
}
addServices();
