import {noAvatarBase64, noImageBase64} from './noimage';
import {isArray, isObject, merge} from 'lodash';
import {hasValue} from '../libs/hasValue';
import {getUser} from '/imports/libs/getUser';
import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import { Match } from 'meteor/check';

// Conters
const Counts = new Mongo.Collection('counts');
Counts.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});

const getNoImage = (
    isAvatar = false, name = 'dfasdfasfadsfadsdfasd', size = 64) => {

  if (!isAvatar) {
    return noImageBase64;
  } else {
    return noAvatarBase64;
  }

};

const defaultOptions = {
  restApi: {
    useDefaultAuth: true,
    apiVersion: 1,
  },
  disableDefaultPublications: false,
};

// region Base Model
export class ApiBase {
  dao;
  isTest;
  publications;
  logCollection;
  restApiOptions;
  restApi = {};
  schema: any;
  collectionName: string | null;
  collectionInstance: Mongo.Collection<any>;
  counts: Mongo.Collection<any>;

  /**
   * Constructor
   * @param  {Object} daoBase - The DAO created by other collection.
   * @param  {Object} options
   * @param  {Object} isTest - To use the model in unit tests.
   */
  constructor(apiName: string, apiSch: any, options?: object) {

    options = merge(
        {},
        defaultOptions,
        options,
    );
    this.noImagePath = options.noImagePath;
    this.collectionName = apiName;
    this.restApiOptions = options.restApi;
    this.schema = apiSch;

    this.initCollection(apiName);
    this.initApiRest();
    this.publications = {};

    this.counts = Counts;

    this.initCollection = this.initCollection.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.findOne = this.findOne.bind(this);
    this.find = this.find.bind(this);

    this.addPublication = this.addPublication.bind(this);
    this.registerAllMethods = this.registerAllMethods.bind(this);
    this.serverUpdate = this.serverUpdate.bind(this);
    this.serverInsert = this.serverInsert.bind(this);
    this.serverRemove = this.serverRemove.bind(this);
    this.serverUpsert = this.serverUpsert.bind(this);
    this.serverGetDocs = this.serverGetDocs.bind(this);

    this.afterInsert = this.afterInsert.bind(this);
    this.beforeUpdate = this.beforeUpdate.bind(this);
    this.beforeRemove = this.beforeRemove.bind(this);
    this.sync = this.sync.bind(this);
    this.createAPIRESTForIMGFields = this.createAPIRESTForIMGFields.bind(this);
    this.createAPIRESTThumbnailForIMGFields = this.createAPIRESTThumbnailForIMGFields.bind(this);



    this.countDocuments = this.countDocuments.bind(this);
    this.callMethod = this.callMethod.bind(this);
    this.defaultCollectionPublication = this.defaultCollectionPublication.bind(this);

    this.registerPublications(options);
    this.registerAllMethods();
    this.includeAuditData = this.includeAuditData.bind(this);

    this.createAPIRESTForIMGFields();

    if(Meteor.isServer) {
      import sharp from "sharp"
      this.createAPIRESTThumbnailForIMGFields(sharp);
    }


    if (Meteor.isClient && !Meteor.isProduction) {
      // ##################################
      // Put model on Window variable
      if (window) {
        if (!window.$app) {
          window.$app = {};
        }

        if (!window.$app.api) {
          window.$app.api = {};
        }

        window.$app.api[this.collectionName] = this;

      }
      // ####################################
    }

  }

  getSchema = () => {
    return {...this.schema};
  };

  initCollection(apiName) {
    const self = this;
    this.collectionName = apiName;
    if (Meteor.isClient) {
      if (this.collectionName !== 'users') {
        this.collectionInstance = new Mongo.Collection(this.collectionName, {
          transform: (doc) => { // for get path of image fields.
            return self.addImgPathToFields(doc);
          },
        });
        // Deny all client-side updates on the Lists collection
        this.getCollectionInstance().deny({
          insert() {
            return true;
          },
          update() {
            return true;
          },
          remove() {
            return true;
          },
        });
      } else {
        this.collectionInstance = Meteor.users;
        // Deny all client-side updates on the Lists collection
        this.getCollectionInstance().deny({
          insert() {
            return true;
          },
          update() {
            return true;
          },
          remove() {
            return true;
          },
        });
      }
    } else if (this.collectionName !== 'users') { // If Is SERVER
      this.collectionInstance = new Mongo.Collection(this.collectionName);
      // Deny all client-side updates on the Lists collection
      this.getCollectionInstance().deny({
        insert() {
          return true;
        },
        update() {
          return true;
        },
        remove() {
          return true;
        },
      });
    } else {
      this.collectionInstance = Meteor.users;
      // Deny all client-side updates on the Lists collection
      this.getCollectionInstance().deny({
        insert() {
          return true;
        },
        update() {
          return true;
        },
        remove() {
          return true;
        },
      });
    }
  }

  addImgPathToFields = (doc) => {
    Object.keys(this.schema).forEach(field => {
      if (this.schema[field].isImage) {
        if(doc['has'+field]) {
          doc[field] = (`${Meteor.absoluteUrl()}thumbnail/${this.collectionName}/${field}/${doc._id}?date=${doc.lastupdate
          && doc.lastupdate.toISOString ? doc.lastupdate.toISOString()
              : '1'}`);
        } else{
          doc[field] = (this.noImagePath?this.noImagePath:`${Meteor.absoluteUrl()}images/noimage.jpg`);
        }

      }
    });
    return doc;
  };

  initApiRest = () => {
    if (Meteor.isServer) {
      import {WebApp} from 'meteor/webapp';
      import connectRoute from 'connect-route';

      this.apiRestImage = {
        addRoute: (path, handle) => {

          console.log('Path', path);
          WebApp.connectHandlers.use(connectRoute((router) => {
            router.get('/img/' + path, handle);
          }));

        },
        addThumbnailRoute: (path, handle) => {

          console.log('Path', path);
          WebApp.connectHandlers.use(connectRoute((router) => {
            router.get('/thumbnail/' + path, handle);
          }));

        },
      };
    }

  };

  createAPIRESTForIMGFields () {
    if (Meteor.isServer) {
      const self = this;
      const schema = self.schema;
      Object.keys(schema).forEach(field => {
        if (schema[field].isImage) {
          console.log('CREATE ENDPOINT GET ' +
              `img/${this.collectionName}/${field}/:image ########## IMAGE #############`);
          this.apiRestImage.addRoute(`${this.collectionName}/${field}/:image`,
              (req, res, next) => {

                const {params} = req;

                if (params && !!params.image) {
                  const docID = params.image.indexOf('.png') !== -1
                      ? params.image.split('.png')[0]
                      : params.image.split('.jpg')[0];
                  const doc = self.getCollectionInstance().
                  findOne({_id: docID});

                  if (doc && !!doc[field]&&doc[field]!=='-') {
                    const matches = doc[field].match(
                        /^data:([A-Za-z-+\/]+);base64,([\s\S]+)$/);
                    const response = {};

                    if (!matches || matches.length !== 3) {
                      const noimg = getNoImage(schema[field].isAvatar);
                      const tempImg = noimg.match(/^data:([A-Za-z-+\/]+);base64,([\s\S]+)$/);
                      return new Buffer(tempImg[2], 'base64');
                    }

                    response.type = matches[1];
                    response.data = new Buffer(matches[2], 'base64');
                    res.writeHead(200, {
                      'Content-Type': response.type,
                      'Cache-Control': 'max-age=120, must-revalidate, public',
                      'Last-Modified': (doc.lastupdate || new Date()).toUTCString(),
                    });
                    res.write(response.data);
                    res.end(); // Must call this immediately before return!
                    return;
                  }
                  res.writeHead(404);
                  res.end();
                  return;

                }
                res.writeHead(404);
                res.end();
                return;
              },
          );
        }
      });
    }
  }
  createAPIRESTThumbnailForIMGFields (sharp) {
    if (Meteor.isServer) {
      const self = this;
      const schema = self.schema;
      Object.keys(schema).forEach(field => {
        if (schema[field].isImage) {
          console.log('CREATE ENDPOINT GET ' +
              `thumbnail/${this.collectionName}/${field}/:image ########## IMAGE #############`);
          this.apiRestImage.addThumbnailRoute(`${this.collectionName}/${field}/:image`,
              async (req, res, next) => {

                const {params} = req;

                if (params && !!params.image) {
                  const docID = params.image.indexOf('.png') !== -1
                      ? params.image.split('.png')[0]
                      : params.image.split('.jpg')[0];
                  const doc = self.getCollectionInstance().
                  findOne({_id: docID});

                  if (doc && !!doc[field]&&doc[field]!=='-') {

                    const destructImage = doc[field].split(";");
                    const mimType = destructImage[0].split(":")[1];
                    const imageData = destructImage[1].split(",")[1];





                    try {
                      let resizedImage = Buffer.from(imageData, "base64")
                      resizedImage = await sharp(resizedImage).resize({
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 0.01 },
                        width: 300,
                        height:200
                      }).toFormat('png').toBuffer()

                      res.writeHead(200, {
                        'Content-Type': mimType,
                        'Cache-Control': 'max-age=120, must-revalidate, public',
                        'Last-Modified': (doc.lastupdate ||
                            new Date()).toUTCString(),
                      });
                      res.write(resizedImage);
                      res.end(); // Must call this immediately before return!
                      return;

                      //To Save Base64 IMG
                      // return `data:${mimType};base64,${resizedImage.toString("base64")}`
                    } catch (error) {
                      res.writeHead(200);
                      res.end();
                      return;
                    }

                  }
                  res.writeHead(404);
                  res.end();
                  return;
                }
              });
        }
      });
    }
  }


  /**
   * Wrapper to register a publication of an collection.
   * @param  {String} publication - Name of the publication.
   * @param  {Function} newPublicationsFunction - Function the handle the publication of the data
   */
  addPublication = (publication: string, newPublicationsFunction: any) => {
    const self = this;

    if (Meteor.isServer) {
      Meteor.publish(
          `${self.collectionName}.${publication}`,
          newPublicationsFunction,
      );
      self.publications[publication] = newPublicationsFunction;

      Meteor.publish(
          `${self.collectionName}.${'count' + publication}`,
          self.defaultCounterCollectionPublication(self, publication),
      );
      self.publications['count' +
      publication] = self.defaultCounterCollectionPublication(self,
          publication);

    } else {
      this.publications[publication] = true;
    }
  };

  addTransformedPublication = (
      publication: string, newPublicationsFunction: any,
      transformDocFunc: any) => {

    const self = this;

    if (Meteor.isServer) {

      Meteor.publish(`${self.collectionName}.${publication}`,
          function(query, options) {
            const subHandle = newPublicationsFunction(query, options).
            observe({
              added: (document) => {
                this.added(`${self.collectionName}`, document._id,
                    transformDocFunc(document));
              },
              changed: (newDocument, oldDocument) => {
                this.changed(`${self.collectionName}`, newDocument._id,
                    transformDocFunc(newDocument));
              },
              removed: (oldDocument) => {
                this.removed(`${self.collectionName}`, oldDocument._id);
              },
            });
            this.ready();
            this.onStop(() => {
              subHandle.stop();
            });
          });

      self.publications[publication] = newPublicationsFunction;

      Meteor.publish(
          `${self.collectionName}.${'count' + publication}`,
          self.defaultCounterCollectionPublication(self, publication),
      );
      self.publications['count' +
      publication] = self.defaultCounterCollectionPublication(self,
          publication);

    } else {
      this.publications[publication] = true;
    }

  };

  /**
   * Wrapper to register a publication of an collection.
   * @param  {String} publication - Name of the publication.
   * @param  {Function} newPublicationsFunction - Function the handle the publication of the data
   */
  updatePublication = (publication, newPublicationsFunction) => {
    const self = this;

    if (Meteor.isServer) {
      Meteor.publish(
          `${self.collectionName}.${publication}`,
          newPublicationsFunction,
      );
      self.publications[publication] = newPublicationsFunction;
    } else {
      this.publications[publication] = true;
    }
  };

  /**
   * Wrapper to register a publication of an collection.
   * @param  {String} publication - Name of the publication.
   * @param  {Function} newPublicationsFunction - Function the handle the publication of the data
   */
  addCompositePublication = (
      publication: string, newPublicationsFunction: any) => {
    const self = this;

    if (Meteor.isServer) {
      Meteor.publishComposite(
          `${self.collectionName}.${publication}`,
          newPublicationsFunction,
      );
    }
  };

  /**
   * Wrapper to create a Meteor Method.
   * @param  {String} name - Name of the new Meteor Method.
   * @param  {Function} func - Function to use in the Metero Method.
   */
  registerMethod = (name, func) => {
    const self = this;
    const action = name;
    const collection = this.collectionName;
    const methodFullName = `${this.collectionName}.${name}`;
    const schema = this.schema;

    const method = {
      [methodFullName](...param) {
        console.log('CALL Method:', name, param ? Object.keys(param) : '-');
        // Prevent unauthorized access
        const user = getUser(null, this.connection);

        try {
          const userId = user ? user._id : null;
          const userRoles = user ? user.roles : [];
          const {connection} = this;
          const meteorContext = {
            collection,
            action,
            user,
            connection,
            schema,
            user,
          };

          // Here With pass the new Metoer Method with the framework
          // security and the meteor context.
          const functionResult = func(...param, meteorContext);
          if (action === 'insert') {
            meteorContext.docId = functionResult;
          }
          return functionResult;
        } catch (error) {
          throw error;
        }
      },
    };
    if (Meteor.isServer) {
      Meteor.methods(method);
    }
  };

  /**
   * Wrapper to register de default publication.
   * This is necessary to pass any publication for
   * every ACL rule, projection rules,
   * optimization process for the return of the data.
   * Any Mongo collection options will be set up here.
   */
  registerPublications(options) {
    const self = this;

    if (!options.disableDefaultPublications) {
      this.addPublication('default', this.defaultCollectionPublication);
    }

  }

  defaultCollectionPublication(filter = {}, optionsPub) {
    if (!optionsPub) {
      optionsPub = {limit: 0, skip: 0};
    }

    if(optionsPub.skip<0) {
      optionsPub.skip = 0;
    }

    if(optionsPub.limit<0) {
      optionsPub.limit = 0;
    }
    // Use the default subschema if no one was defined.
    if (!optionsPub.projection || Object.keys(optionsPub.projection).length ===
        0) {
      const tempProjection = {};
      Object.keys(this.schema).
      concat(['_id', 'createdby', 'createdat', 'lastupdate', 'updatedby']).
      forEach((key) => {
        tempProjection[key] = 1;
      });

      optionsPub.projection = tempProjection;
    }

    const imgFields = {};

    Object.keys(this.schema).forEach(field=>{
      if(this.schema[field].isImage) {
        imgFields['has'+field] = {$or:'$'+field};
        delete optionsPub.projection[field]
      }
    });




    const queryOptions = {
      fields: {...optionsPub.projection,
        ...imgFields,
      },
      limit: optionsPub.limit || 0,
      skip: optionsPub.skip || 0,
      transform: (doc) => { // for get path of image fields.
        return this.addImgPathToFields(doc);
      },

    };

    if (optionsPub.transform) {
      queryOptions.transform = optionsPub.transform;
    }

    if (optionsPub.sort) {
      queryOptions.sort = optionsPub.sort;
    }

    return this.getCollectionInstance().find({...filter}, queryOptions);
  }

  defaultCounterCollectionPublication = (
      collection, publishName) => function(...params) {
    let count = 0;
    let initializing = true;

    // `observeChanges` only returns after the initial `added` callbacks have run.
    // Until then, we don't want to send a lot of `changed` messages—hence
    // tracking the `initializing` state.
    let handle;
    const handlePub = collection.publications[publishName](...params);
    if(handlePub) {
      handle = handlePub.observeChanges({
        added: (id) => {
          count += 1;

          if (!initializing) {
            this.changed('counts', `${publishName}Total`, {count});
          }
        },

        removed: (id) => {
          count -= 1;
          this.changed('counts', `${publishName}Total`, {count});
        },

        // We don't care about `changed` events.
      });
    }

    if(!handle) {
      return;
    }

    // Instead, we'll send one `added` message right after `observeChanges` has
    // returned, and mark the subscription as ready.
    initializing = false;
    this.added('counts', `${publishName}Total`, {count});
    this.ready();

    // Stop observing the cursor when the client unsubscribes. Stopping a
    // subscription automatically takes care of sending the client any `removed`
    // messages.
    this.onStop(() => handle.stop());
  };

  /**
   * Get the collection instance.
   * @returns {Object} - Collection.
   */
  getCollectionInstance() {
    return this.collectionInstance;
  }

  /**
   * Register the CRUD methods to use then as
   * Meteor call.
   */
  registerAllMethods() {
    this.registerMethod('update', this.serverUpdate);
    this.registerMethod('insert', this.serverInsert);
    this.registerMethod('remove', this.serverRemove);
    this.registerMethod('upsert', this.serverUpsert);
    this.registerMethod('sync', this.serverSync);
    this.registerMethod('countDocuments', this.countDocuments);
    this.registerMethod('getDocs', this.serverGetDocs);

  }

  prepareData = (dataObj) => {
    const schema = this.schema;
    const schemaKeys = Object.keys(this.schema);
    const newDataObj = {};

    Object.keys(dataObj).forEach(key => {
      const isDate = !!dataObj[key] && !!(dataObj[key] instanceof Date) &&
          !isNaN(dataObj[key].valueOf());

      if (schemaKeys.indexOf(key) !== -1) {
        if (!!schema[key].isImage &&
            (!hasValue(dataObj[key]) || hasValue(dataObj[key]) &&
                dataObj[key].indexOf('data:image') === -1) && dataObj[key] !== '-') {
          // dont update if not have value field of image
        } else if (!!schema[key].isImage && dataObj[key] === '-') {
          newDataObj[key] = null;
        } else if (
            hasValue(dataObj[key])
            && schema[key]
            && schema[key].type === Number
        ) {
          newDataObj[key] = Number(dataObj[key]);
        } else if (
            schema[key]
            && schema[key].type === Date
            && !!isDate
        ) {
          newDataObj[key] = new Date(dataObj[key]);
        } else if (
            schema[key]
            && Array.isArray(schema[key].type)
            && !Array.isArray(dataObj[key])
        ) {
          // No Save
        } else if (
            schema[key]
            && !Array.isArray(schema[key].type)
            && typeof (schema[key].type) === 'object'
            && !hasValue(dataObj[key])
        ) {
          // No Save
        } else if (
            schema[key]
            && schema[key].type === String
            && dataObj[key] === null
        ) {
          // No Save
        } else if (schema[key]
            && schema[key].type !== Date) {
          newDataObj[key] = dataObj[key];
        }
      }
    });

    return newDataObj;
  };

  /**
   * Check collections fields.
   * @param  {Object} dataObj - Document/Object the will be inseted.
   * @param  {String} subSchemaName - Subschema used by the operation.
   * @returns {Object} - The checked object for the subschema.
   */
  checkDataBySchema = (dataObj): any => {
    const schema = this.getSchema();
    const schemaKeys = Object.keys(schema);
    const newDataObj = this.prepareData(dataObj);

    // Don't need to inform every field, but if they was listed
    // or informed, they can't be null.it
    const keysOfDataObj = Object.keys(newDataObj);
    const newSchema = {};

    // Remove from the Schema the optional fields not present in the DataObj.
    schemaKeys.forEach(field => {

      if(schema[field].visibilityFunction&&!schema[field].visibilityFunction(newDataObj)) {
        delete newDataObj[field];
        return;
      } else if (!schema[field].optional && keysOfDataObj.indexOf(field) !== -1 &&
          !hasValue(newDataObj[field])) {
        throw new Meteor.Error('Obrigatoriedade',
            `O campo "${schema[field].label||field}" é obrigatório`);

      } else if (keysOfDataObj.indexOf(field) !== -1) {
        if(!!newDataObj[field]||newDataObj[field]===0) {
          // Call the check from Meteor.
          check(newDataObj[field],schema[field].type)
        }
      }
    });


    return newDataObj;
  };

  /**
   * Check if any updates occurs in
   * any document by any action.
   * @param  {Object} doc - Collection document.
   * @param  {String} action - Action the will be perform.
   */
  includeAuditData(doc, action, defaultUser = 'Anonymous') {
    const userId = getUser() ? getUser()._id : defaultUser;
    if (action === 'insert') {
      doc.createdby = userId;
      doc.createdat = new Date();
      doc.lastupdate = new Date();
      doc.updatedby = userId;
    } else {
      doc.lastupdate = new Date();
      doc.updatedby = userId;
    }
  }

  /**
   * Perform a insert or update on collection.
   * @param  {Object} dataObj - Collection document the will be inserted or updated.
   * @param  {Object} context - Meteor this context.
   * return {Object} doc inserted or updated
   */
  serverSync = (dataObj, context) => {

    if (!dataObj || !dataObj._id) {
      return false;
    }

    if (dataObj.needSync) {
      delete dataObj.needSync;
    }
    const oldDoc = this.getCollectionInstance().findOne({_id: dataObj._id});

    if (!(((!oldDoc || !oldDoc._id) && this.beforeInsert(dataObj, context)) ||
        (this.beforeUpdate(dataObj, context)))) {
      return false;
    }

    if (!oldDoc || !oldDoc._id) {
      dataObj = this.checkDataBySchema(dataObj);
      this.includeAuditData(dataObj, 'insert');
      const insertId = this.getCollectionInstance().insert(dataObj);
      return {_id: insertId, ...dataObj};
    }
    let docToSave = null;
    if (!!dataObj.lastupdate && !!oldDoc.lastupdate &&
        new Date(dataObj.lastupdate) > new Date(oldDoc.lastupdate)) {
      console.log('APP MAIOR');
      docToSave = dataObj;
    } else {
      console.log('Server MAIOR');
      docToSave = oldDoc;
    }

    docToSave = this.checkDataBySchema(docToSave);
    this.includeAuditData(docToSave, 'update');

    const update = this.getCollectionInstance().update(dataObj._id, {
      $set: docToSave,
    });
    const newDoc = this.getCollectionInstance().findOne({_id: dataObj._id});
    return newDoc;
  };

  /**
   * Perform a insert or update on collection.
   * @param  {Object} dataObj - Collection document the will be inserted or updated.
   * @param  {Object} context - Meteor this context.
   */
  serverUpsert(dataObj, context) {
    if (!dataObj._id) {
      const insert = this.serverInsert(dataObj, context);
      dataObj._id = insert;
      return insert;
    }
    return this.serverUpdate(dataObj, context);
  }

  /**
   * Perform a remove on an collection.
   * @param  {Object} dataObj - Collection document the will be removed.
   * @param  {Object} context - Meteor this context.
   */
  serverRemove(dataObj, context) {
    try {
      if (this.beforeRemove(dataObj, context)) {
        const id = dataObj._id;
        check(id, String);
        const result = this.getCollectionInstance().remove(id);
        this.afterRemove(dataObj, context);
        return result;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  prepareDocForUpdate = (doc, oldDoc,nullValues) => {
    const newDoc = {};
    Object.keys(doc).forEach(key => {
      const isDate = doc[key] && (doc[key] instanceof Date) &&
          !isNaN(doc[key].valueOf());


      if(!!nullValues&&!doc[key]&&doc[key]!==0&&typeof doc[key] !=="boolean") {
        nullValues[key] = '';
      } else if (key !== '_id' &&
          ['lastupdate', 'createdat', 'createdby', 'updatedby'].indexOf(key) ===
          -1 && !isDate && (isObject(doc[key]) && !isArray(doc[key]))) {
        newDoc[key] = merge(oldDoc[key] || {}, doc[key]);
      } else {
        newDoc[key] = doc[key];
      }
    });
    return newDoc;
  };

  /**
   * Perform a Update on an collection.
   * @param  {Object} dataObj - Collection document the will be updated.
   * @param  {Object} context - Meteor this context.
   */
  serverUpdate(dataObj, context) {
    try {
      check(dataObj._id, String);
      const id = dataObj._id;
      if (this.beforeUpdate(dataObj, context)) {
        dataObj = this.checkDataBySchema(dataObj);
        this.includeAuditData(dataObj, 'update');
        const oldData = this.getCollectionInstance().findOne({_id: id}) || {};
        const nullValues = {};

        const preparedData = this.prepareDocForUpdate(dataObj, oldData,nullValues);
        console.log('nullValues',nullValues)
        const action = {
          $set: preparedData,
        }
        if(Object.keys(nullValues).length>0) {
          action['$unset'] = nullValues;
        };

        const result = this.getCollectionInstance().
        update({_id: id}, action);
        preparedData._id = id;
        this.afterUpdate(preparedData, context);
        return result;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform a insert on an collection.
   * @param  {Object} dataObj - Collection document the will be inserted.
   * @param  {Object} context - Meteor this context.
   */
  serverInsert(dataObj, context) {
    try {
      const id = dataObj._id;
      if (this.beforeInsert(dataObj, context)) {
        dataObj = this.checkDataBySchema(dataObj);
        this.includeAuditData(dataObj, 'insert');
        if (id) {
          dataObj._id = id;
        }
        const result = this.getCollectionInstance().insert(dataObj);
        this.afterInsert(Object.assign({_id: id || result}, dataObj), context);
        if (context.rest) {
          context.rest.response.statusCode = 201;
        }
        return result;
      }
      return null;
    } catch (insertError) {
      throw insertError;
    }
  }

  /**
   * @returns {String} - Return the number of documents from a collection.
   */
  countDocuments() {
    const result = this.getCollectionInstance().find().count();
    return result;
  }

  /**
   * Perform an action before allows an document be inserted.
   * In this case, we have a check ACL for the user and the collection the will be
   * affected by any updates. So this guarantees the user has to have
   * access to modify this collection.
   * Others actions can be executed in here.
   * @param  {Object} docObj - Document the will be inserted.
   * @param  {Object} context - Meteor this context.
   * (If we don't have context, undefied will be set to this.)
   * @returns {Booolean} - Returns true for any action.
   */
  beforeInsert(docObj: object, context: object) {
    return true;
  }

  /**
   * Perform an action before allows an documents be imported.
   * In this case, we have a check ACL for the user and the collection the will be
   * affected by any updates. So this guarantees the user has to have
   * access to modify this collection.
   * Others actions can be executed in here.
   * @param  {Object} docObjs - Documents the will be imported.
   * @param  {Object} context - Meteor this context.
   * If we don't have context, undefied will be set to this.)
   * @returns {Booolean} - Returns true for any action.
   */
  beforeImport(docObj: object, context: object) {
    return true;
  }

  /**
   * Perform an action before allows an documents be updated.
   * In this case, we have a check ACL for the user and the collection the will be
   * affected by any updates. So this guarantees the user has to have
   * access to modify this collection.
   * Others actions can be executed in here.
   * @param  {Object} docObjs - Documents the will be updated.
   * @param  {Object} context - Meteor this context.
   * (If we don't have context, undefied will be set to this.)
   * @returns {Booolean} - Returns true for any action.
   */
  beforeUpdate(docObj: object, context: object) {
    return true;
  }

  /**
   * Perform an action before allows an documents be removed.
   * In this case, we have a check ACL for the user and the collection the will be
   * affected by any updates. So this guarantees the user has to have
   * access to modify this collection.
   * Others actions can be executed in here.
   * @param  {Object} docObjs - Documents the will be removed.
   * @param  {Object} context - Meteor this context.
   * (If we don't have context, undefied will be set to this.)
   * @returns {Booolean} - Returns true for any action.
   */
  beforeRemove(docObj: object, context: object) {
    return true;
  }

  /**
   * Use this as an extension point, to perform any action
   * after or before action modify a collection/document.
   * @param  {Object} dataObj - Document the will be changed
   * @returns {Object} - Object updated with the current status.
   */
  beforeUpsert(dataObj) {
    const document = {
      ...dataObj,
      collection: this.collectionName,
    };
    return document;
  }

  /**
   * Use this as an extension point, to perform any action
   * after or before action modify a collection/document.
   * @param  {Object} dataObj - Document the will be changed
   * @returns {Object} - Object updated with the current status.
   */
  afterImport(dataObj) {
    const document = {
      ...dataObj,
      collection: this.collectionName,
    };
    return document;
  }

  /**
   * Use this as an extension point, to perform any action
   * after or before action modify a collection/document.
   * @param  {Object} dataObj - Document the will be changed
   * @returns {Object} - Object updated with the current status.
   */
  afterInsert(dataObj) {
    const document = {
      ...dataObj,
      collection: this.collectionName,
    };
    return document;
  }

  /**
   * Use this as an extension point, to perform any action
   * after or before action modify a collection/document.
   * @param  {Object} dataObj - Document the will be changed
   * @returns {Object} - Object updated with the current status.
   */
  afterUpdate(dataObj, context) {
    const document = {
      ...dataObj,
      collection: this.collectionName,
    };

    const schema = this.getSchema();
    const unsetFields = {};
    Object.keys(schema).forEach(field=>{
      if(schema[field].visibilityFunction&&!schema[field].visibilityFunction(dataObj)) {
        unsetFields[field] = '';
      }
    });

    if(Object.keys(unsetFields).length>0) {
      this.getCollectionInstance().update({_id:dataObj._id},{
        $unset: unsetFields
      });
    }
    return document;
  }

  /**
   * Use this as an extension point, to perform any action
   * after or before action modify a collection/document.
   * @param  {Object} dataObj - Document the will be changed
   * @returns {Object} - Object updated with the current status.
   */
  afterRemove(dataObj, context) {
    const document = {
      ...dataObj,
      collection: this.collectionName,
    };
    return document;
  }

  /**
   * Get docs with Meteor.call.
   * @param  {publicationName} publicationName - Publication Name
   * @param  {filter} filter - Collection Filter
   * @param  {optionsPub} optionsPub - Options Publication, like publications.
   * @returns {Array} - Array of documents.
   */
  serverGetDocs(publicationName = 'default', filter = {}, optionsPub) {
    const result = this.publications[publicationName](filter, optionsPub);
    if (result) {
      return result.fetch();
    } else {
      return null;
    }
  }

  /**
   * Wrapper to the Meteor call. This check if the user has
   * connection with the server, in this way we can return the result from
   * a cached collection or from the server.
   * @param  {String} name - Meteor method name defin
   * @param  {Object} ...params - Parameters for this meteor method.
   */
  callMethod(name, ...params) {
    if (Meteor.status().connected) {
      Meteor.call(`${this.collectionName}.${name}`, ...params);
    } else {
      console.log('Sem Conexão com o Servidor');
      // window.$app.globalFunctions.openSnackBar('SEM CONEXÃO COM O SERVIDOR:Sua operçaão não será registrada. Verifique sua conexão com a internet.', 'info');
    }

  }

  /**
   * Wrapper for a Meteor call.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  import(docObj: object, callback = (e, r) => {console.log(e, r);}) {
    this.callMethod('import', docObj, callback);
  }

  /**
   * Wrapper for a Meteor call.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  insert(docObj: any, callback: any) {
    const newObj = {_id: docObj._id};
    const schema = this.getSchema();
    Object.keys(docObj).forEach(key => {
      if (!!schema[key] &&
          (!schema[key].isImage && !schema[key].isAvatar ||
              docObj[key].indexOf('/img/') ===-1&&docObj[key].indexOf('/thumbnail/') ===-1)) {
        newObj[key] = docObj[key];
      }
    });
    this.callMethod('insert', newObj, callback);
  }

  /**
   * Wrapper for a Meteor call.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  update(docObj: object, callback = (e, r) => {console.log(e, r);}) {
    const newObj = {_id: docObj._id};
    const schema = this.schema;
    Object.keys(docObj).forEach(key => {
      if (!!schema[key] &&
          (!schema[key].isImage && !schema[key].isAvatar ||
              typeof docObj[key] === 'string' &&
              docObj[key].indexOf('/img/') === -1&&docObj[key].indexOf('/thumbnail/') === -1)) {
        newObj[key] = docObj[key];
      }
    });

    return this.callMethod('update', newObj, callback);
  }

  /**
   * Wrapper for a Meteor call.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  upsert(docObj: any, callback: any) {
    if (!docObj._id) {
      return this.insert(docObj, callback);
    }
    return this.update(docObj, callback);
  }

  /**
   * Wrapper for a Meteor call.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  remove(docObj: object, callback = (e, r) => {console.log(e, r);}) {
    this.callMethod('remove', docObj, callback);
  }

  /**
   * Get Docs
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  getDocs(
      apiName = 'default', filter = {}, optionsPub = {},
      callback = (e, r) => {console.log(e, r);}) {
    this.callMethod('getDocs', apiName, filter, optionsPub, callback);
  }

  /**
   * Sync one object.
   * @param  {Object} docObj - Document from a collection.
   * @param  {Function} callback - Callback Function
   */
  sync(docObj: object, callback = (e, r) => {console.log(e, r);}) {
    this.callMethod('sync', docObj, callback);
  }

  /**
   * Wrapper to find items on an collection.
   * This guarantees the the action will be executed
   * by a Meteor Mongo Collection of this framework.
   * @param  {Object} query - Params to query a document.
   * @param  {Object} projection - Params to define which fiedls will return.
   */
  find(query: any, projection?: any) {
    return this.getCollectionInstance().find(query, projection);
  }

  /**
   * Wrapper to findOne items on an collection.
   * This guarantees the the action will be executed
   * by a Meteor Mongo Collection of this framework.
   * @param  {Object} query - Params to query a document.
   * @param  {Object} projection - Params to define which fiedls will return.
   */
  findOne(query = {}, projection = {}) {
    const result = this.getCollectionInstance().findOne(query, projection);
    return result;
  }

  /**
   * Make a subscribe for a collection.
   * @param  {} api='default'
   * @param  {} ...param
   */
  subscribe(api = 'default', ...param) {
    const self = this;
    if (Meteor.isClient) {
      const subsHandle = Meteor.subscribe(
          `${this.collectionName}.${api}`,
          ...param,
      );

      const subHandleCounter = Meteor.subscribe(
          `${this.collectionName}.count${api}`,
          param[0] || {},
      );
      const countResult = subHandleCounter.ready() ? self.counts.findOne(
          {_id: api + 'Total'}):null;
      const count = countResult?countResult.count : 0;

      if (subHandleCounter.ready()) {
        subsHandle.total = count;
      }

      if (subHandleCounter && subHandleCounter.ready) {
        return {
          ...subsHandle,
          ready: () => subsHandle.ready() && subHandleCounter.ready(),
        };
      }

      return subsHandle;

    }
    return null;
  }

}
