const Realm = require('realm');
import {File} from './fileObject';

export const Profile = {
  name: 'Profile',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    _partition: 'string',
    identity: 'string',
    role: 'string',
    firstname: 'string',
    surname: 'string',
    email: 'string',
    profilePicture: 'File',
    // extraInfo: { type: "bool", default: false },
    privacyPolicy: 'bool',
    workshops: {type: 'list', objectType: 'UserWorkshop'},
    companies: {type: 'list', objectType: 'UserCompany'},
    // settings: { type: "list", objectType: "Setting" },
    token: 'AccessToken',
    files: 'File[]',
    licenseKey: 'LicenseKey',
  },
};

// export const Setting = {
// 	name: "Setting",
// 	primaryKey: "_id",
// 	properties: {
// 		_id: "string",
// 		type: "string",
// 		setting: "string"
// 	}
// };

export const AccessToken = {
  name: 'AccessToken',
  embedded: true,
  properties: {
    _id: 'objectId',
    theToken: 'string',
  },
};

export const LicenseKey = {
  name: 'LicenseKey',
  embedded: true,
  properties: {
    licenseKey: 'string',
    activationId: 'int',
    expiration: 'date',
  },
};

export const UserCompany = {
  name: 'UserCompany',
  embedded: true,
  properties: {
    _id: 'objectId',
    companyId: 'objectId',
    url: 'string',
    name: 'string',
    logoFile: 'File',
  },
};

export const UserWorkshop = {
  name: 'UserWorkshop',
  embedded: true,
  properties: {
    _id: 'objectId',
    workshopId: 'objectId',
    url: 'string',
    name: 'string',
    status: 'string',
    startDate: 'date',
    endDate: 'date',
    application: 'string',
    isCreatedUsingWalkthrough: 'bool?',
  },
};

export const userSchema = [
  Profile,
  AccessToken,
  UserCompany,
  UserWorkshop,
  File,
  LicenseKey,
];
