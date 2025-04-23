"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCaseName = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
{
    camelCaseName;
}
from;
'./{{folderName}}.interface';
{
    camelCaseName;
}
from;
'./{{folderName}}.model';
const mongoose_1 = require("mongoose");
{
    {
        #hasFileFields;
    }
}
const deleteUploadedFile_1 = require("../../../utils/deleteUploadedFile");
{
    {
        /hasFileFields;
    }
}
const create, {}, { camelCaseName };
async (payload, {}, { camelCaseName }) => { {
    camelCaseName;
} };
 > ;
{
    const result = await {}, { camelCaseName };
}
.create(payload);
if (!result) {
    {
        {
            #fileFields;
        }
    }
    if (payload.) {
        {
            arrayName;
        }
    }
    length > 0;
    {
        (0, deleteUploadedFile_1.removeUploadedFiles)(payload., {}, { arrayName });
    }
    ;
}
{
    {
        /fileFields;
    }
}
throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create {{camelCaseName}}');
;
return result;
;
;
const update, {}, { camelCaseName };
;
 = async (id, payload, {}, { camelCaseName }) => { {
    camelCaseName;
} };
 | null > ;
() => {
    const result = await, {}, { camelCaseName };
};
.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
    new: true,
});
if (!result) {
    {
        {
            #fileFields;
        }
    }
    if (payload.) {
        {
            arrayName;
        }
    }
     && payload.;
    {
        {
            arrayName;
        }
    }
    length > 0;
    {
        (0, deleteUploadedFile_1.removeUploadedFiles)(payload., {}, { arrayName });
    }
    ;
}
{
    {
        /fileFields;
    }
}
throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update {{camelCaseName}}');
;
return result;
;
;
const {}, { camelCaseName };
;
 = async (id) => { {
    camelCaseName;
} };
 | null > ;
() => {
    const result = await, {}, { camelCaseName };
};
.findByIdAndDelete(new mongoose_1.Types.ObjectId(id));
if (!result) {
    throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete {{camelCaseName}}');
}
return result;
;
;
const getSingle, {}, { camelCaseName };
;
 = async (id) => { {
    camelCaseName;
} };
 | null > ;
() => {
    const result = await, {}, { camelCaseName };
};
.findById(new mongoose_1.Types.ObjectId(id));
return result;
;
;
{
    {
        #hasParentId;
    }
}
const getAll, {}, { camelCaseName };
;
s = async (id) => { {
    camelCaseName;
} };
[] > ;
() => {
    const result = await, {}, { camelCaseName };
};
.find({}, {}, { parentField }, id);
return result;
;
;
{
    {
        /hasParentId;
    }
}
{
    {
         ^ hasParentId;
    }
}
const getAll, {}, { camelCaseName };
;
s = async () => { {
    camelCaseName;
} };
[] > ;
() => {
    const result = await, {}, { camelCaseName };
};
.find({});
return result;
;
;
{
    {
        /hasParentId;
    }
}
;
Services = {
    create, camelCaseName
};
;
,
    update;
{
    {
        camelCaseName;
    }
}
,
    delete { camelCaseName };
;
,
    getSingle;
{
    {
        camelCaseName;
    }
}
,
    getAll;
{
    {
        camelCaseName;
    }
}
s,
;
;
;
