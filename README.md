# Panorama
Panorama is the core of a modular web interface for VistA. It is the next
generation of how VistA ought to be developed and is expressly written to provide a final answer to how VistA should evolve. Its use and development mirror classic VistA/DHCP in many ways, from the incremental development model to the security model. Javascript is the primary development language,
replacing M for all simple operations.

Panorama is based on QEWD, which runs on Node.js. More about QEWD can
be found at qewdjs.com.

Check the wiki for installation instructions and for how to write a brand new Panorama module: https://github.com/shabiel/ewd-vista/wiki.

## Browserify command
If you make changes to the client javascript in this module or in ewd-vista-login, you need to run this command to update bundle.js.
```
browserify -t [babelify] client/app.js -o www/assets/javascripts/bundle.js
```

##Fileman Messaging Format
````
filemanMsg: {
  file: {
    name: 'NEW PERSON',
    number: '200'
  },
  iens: '',
  fields: [
    {
      key: 'ien',
      name: 'IEN',
      number: ''
    },
    {
      key: 'name',
      name: 'Name',
      number: '.01'
    }
  ],
  flags: '',
  quantity: '8',
  stringFrom: 'CAR',
  stringPart: 'CAR',
  index: '',
  screen: '',
  identifier: '',
  //
  records: [
    {
      ien: '57',
      name: 'CARLSON,ALEXIS'
    }
  ],
  value: '',
  // Response-only attributes
  error: {
    code: '',
    message: '',
    help: ''
  },
  laygo: boolean,
  valid: boolean
}
````

## Modules
* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
* [TaskMan Monitor](https://github.com/shabiel/ewd-taskman-monitor)
* [FileMan](https://github.com/shabiel/ewd-vista-fileman)
* [Pharmacy](https://github.com/shabiel/ewd-vista-pharmacy)
* [Push Handler](https://github.com/shabiel/ewd-vista-push-handler)
* [Database Administration](https://github.com/shabiel/dba)
