export interface FieldDefinition {
  name: string;
  type: string;
  ref?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  enumValues?: string[];
  objectProperties?: FieldDefinition[];
  arrayItemType?: string;
}

export interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: any[];
    body?: {
      mode: string;
      raw: string;
      options: {
        raw: {
          language: string;
        };
      };
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: any[];
    };
  };
  event?: {
    listen: string;
    script: {
      exec: string[];
      type: string;
    };
  }[];
}

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: PostmanRequest[];
}

export interface SwaggerPath {
  [method: string]: {
    tags: string[];
    summary: string;
    parameters?: any[];
    requestBody?: any;
    responses: any;
  };
}
