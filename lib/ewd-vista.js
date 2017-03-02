// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

/* Two needed imports */
sessions = require('ewd-session');
runRPC   = require('ewd-vista/lib/runRPC');

module.exports = {
  servicesAllowed: {
    // Added dynamically below with addServices()
  },
  handlers: {
    getModules: function() {
      let modulesData = getVistaModules().slice(1);
      
      return modulesData;
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
      
      let arrayKey = node.$('0').$('MAP').value;
      let entriesArray = [];
      
      node.forEachChild(
        {
          range: {
            from: '1',
            to: ' '
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
    listDic: function(query) {
      /*
      Requires this to be the worker process for the calling module handler:
        let result = this.handlers['ewd-vista'].listDic.call(this, query);
      
      query: {
        file: {
          name: '',
          number: '1'
        },
        fields: ['.01'],
        flags: '',
        identifier: '',
        iens: '',
        index: '',
        screen: '',
        stringFrom: request.term,
        stringPart: request.term,
        quantity: 8
      }
      */
      
      // FIXME Handle FileMan errors
      
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
  
      // let query = messageObj.params.query;
      
      // Add file data to results
      let fileNode = new this.documentStore.DocumentNode('DIC', [query.file.number, '0']);
      let fileName = fileNode.value.split('^')[0];
  
      results.file.number = query.file.number;
      results.file.name   = fileName;
  
      // Add fields data to results
      for (let i = 0; i < query.fields.length; i++) {
        let fieldNode = new this.documentStore.DocumentNode('DD', [query.file.number, query.fields[i], '0']);
        let fieldName = fieldNode.value.split('^')[0];
    
        let field = {
          number: query.fields[i],
          name: fieldName,
          key: fieldName.toLowerCase().replace(/ /g, '')
        };
    
        results.fields.push(field);
      }
  
      // Submit primary query & add records to results
      let fields    = '@;' + query.fields.join(';');
      let fieldsMap = 'IEN^' + query.fields.join('^');

      let response = this.db.function({
        function: 'LIST^ewdVistAFileman',
        arguments: [
          query.file.number,
          query.iens || '',
          fields,
          query.flags || 'PQ',
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
      recordsData     = recordsData[fieldsMap];

      recordsData.forEach(function(recordData) {
        recordData = recordData.split('^');
    
        let record      = {};
        // Use results.fields to dynamically assign pieces of data to properties
        results.fields.forEach(function(field, index) {
          record[field.key] = recordData[index];
        });
    
        results.records.push(record);
      });
  
      return results;
    }
  }
};

// Grab data about installed VistA modules
function getVistaModules() {
  const fs   = require('fs');
  const path = require('path');

  let modulesPath  = __dirname.split('/').slice(0,-2).join('/');
  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];
  allModules.forEach(function(element) {
    if (element.match('ewd-vista')) {
      vistaModules.push(element);
    }
  });
  
  let vistaModulesData = [];
  vistaModules.forEach(function(element) {
    if (element != 'ewd-vista') {
      vistaModulesData.push((require(element + '/package.json')).ewdVista);
    }
  });
  vistaModulesData.sort((x,y) => { return x.sortOrder > y.sortOrder; });
  
  return vistaModulesData;
}

// Add services to module exports
function addServices() {
  let modulesData = getVistaModules();
  
  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });  
}
addServices();

