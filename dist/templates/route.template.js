"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCaseName = void 0;
const express_1 = __importDefault(require("express"));
{
    exports.camelCaseName;
}
Controller;
from;
'./{{folderName}}.controller';
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
{
    exports.camelCaseName;
}
Validation;
from;
'./{{folderName}}.validation';
{
    {
        #hasFileFields;
    }
}
const processReqBody_1 = require("../../middleware/processReqBody");
{
    {
        /hasFileFields;
    }
}
const router = express_1.default.Router();
router.post('/create-{{folderName}}', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), {}, { :  }, (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), {}, {} / hasFileFields, (0, validateRequest_1.default)({}, { camelCaseName: exports.camelCaseName }, Validation.create, {}, { camelCaseName: exports.camelCaseName }, ZodSchema), {}, { camelCaseName: exports.camelCaseName }, Controller.create, {}, { camelCaseName: exports.camelCaseName });
router.get('/:id', {}, { camelCaseName: exports.camelCaseName }, Controller.getSingle, {}, { camelCaseName: exports.camelCaseName });
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), {}, { :  }, (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), {}, {} / hasFileFields, (0, validateRequest_1.default)({}, { camelCaseName: exports.camelCaseName }, Validation.update, {}, { camelCaseName: exports.camelCaseName }, ZodSchema), {}, { camelCaseName: exports.camelCaseName }, Controller.update, {}, { camelCaseName: exports.camelCaseName });
router.delete('/:id', {}, { camelCaseName: exports.camelCaseName }, Controller.delete, {}, { camelCaseName: exports.camelCaseName });
{
    {
        #hasParentId;
    }
}
router.get('/{{parentField}}/:id', {}, { camelCaseName: exports.camelCaseName }, Controller.getAll, {}, { camelCaseName: exports.camelCaseName }, s);
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
router.get('/', {}, { camelCaseName: exports.camelCaseName }, Controller.getAll, {}, { camelCaseName: exports.camelCaseName }, s);
{
    {
        /hasParentId;
    }
}
Routes = router;
